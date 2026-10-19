/**
 * Dev-сервер (локально): платежі й генерація казок на порту 3002.
 * Секрети читає з .env у корені проєкту (ніколи не потрапляють у фронтенд).
 *
 * Маршрути (спільні з Vercel api/* через shared/pro.ts):
 *   POST /api/kazka         — генерація з серверним лімітом
 *   POST /api/status        — Pro / лічильник / демо-режим
 *   POST /api/checkout      — створення оплати (LiqPay або демо-токен)
 *   POST /api/pay/confirm   — підтвердження оплати (демо-токен або підпис LiqPay)
 */
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Obrobka, RobochaVidpovid } from "../shared/pro.js";
import { obrobytyCheckout, obrobytyKazka, obrobytyPayConfirm, obrobytyStatus } from "../shared/pro.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.SERVER_PORT ?? 3002);

/** Мінімальний читач .env (без зайвих залежностей). */
function zavantazhytyEnv(): void {
  const fayl = path.join(__dirname, "..", ".env");
  if (!existsSync(fayl)) return;
  for (const рядок of readFileSync(fayl, "utf-8").split("\n")) {
    const trimmed = рядок.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const k = trimmed.indexOf("=");
    if (k < 1) continue;
    const key = trimmed.slice(0, k).trim();
    if (!(key in process.env)) {
      process.env[key] = trimmed.slice(k + 1).trim();
    }
  }
}

zavantazhytyEnv();

/** Парсимо тіло: JSON або form-urlencoded (result_url від LiqPay надсилає саме форму). */
function prochytatyTilo(req: IncomingMessage, done: (body: unknown) => void): void {
  const ct = String(req.headers["content-type"] ?? "");
  let syra = "";
  req.on("data", (chunk) => {
    syra += chunk;
    if (syra.length > 100_000) req.destroy();
  });
  req.on("end", () => {
    if (!syra) return done({});
    try {
      if (ct.includes("application/x-www-form-urlencoded")) {
        done(Object.fromEntries(new URLSearchParams(syra)));
      } else {
        done(JSON.parse(syra));
      }
    } catch {
      done({});
    }
  });
}

function viddaty(res: ServerResponse, vidpovid: RobochaVidpovid): void {
  if (vidpovid.cookie.length) res.setHeader("Set-Cookie", vidpovid.cookie);
  res.writeHead(vidpovid.status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(vidpovid.body));
}

const MARshruty: Record<string, (obrobka: Obrobka) => RobochaVidpovid | Promise<RobochaVidpovid>> = {
  "/api/status": obrobytyStatus,
  "/api/checkout": () => obrobytyCheckout(),
  "/api/pay/confirm": obrobytyPayConfirm,
  "/api/kazka": obrobytyKazka,
};

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  const url = (req.url ?? "/").split("?")[0];
  const obrobyty = req.method === "POST" ? MARshruty[url] : undefined;

  if (!obrobyty) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ pomylka: "Не знайдено" }));
    return;
  }

  prochytatyTilo(req, (body) => {
    void (async () => {
      try {
        const vidpovid = await obrobyty({ method: req.method ?? "POST", headers: req.headers, body });
        viddaty(res, vidpovid);
      } catch (e) {
        console.error("Помилка обробки:", e);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ pomylka: "Помилка сервера" }));
      }
    })();
  });
});

server.listen(PORT, () => {
  console.log(`🌙 Казковий сервер: http://localhost:${PORT}`);
});
