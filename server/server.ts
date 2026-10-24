/**
 * Dev-сервер (локально): платежі й генерація казок на порту 3002.
 * Секрети читає з .env у корені проєкту (ніколи не потрапляють у фронтенд).
 *
 * Маршрути (спільні з Vercel api/* через shared/pro.ts):
 *   POST /api/kazka         — генерація з серверним лімітом
 *   POST /api/status        — Pro / лічильник / демо-режим
 *   POST /api/checkout      — створення оплати (LiqPay або демо-токен)
 *   POST /api/pay/confirm   — підтвердження оплати (демо-токен або підпис LiqPay)
 *   POST /api/ozvuka        — ШІ-озвучка казки (голоси Мама/Тато/Казковий) → MP3
 */
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Obrobka, RobochaVidpovid } from "../shared/pro.js";
import { obrobytyCheckout, obrobytyKazka, obrobytyPayConfirm, obrobytyStatus } from "../shared/pro.js";
import { obrobytyOzvuka } from "../shared/ozvuka.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? process.env.SERVER_PORT ?? 3002);
const DIST = path.join(__dirname, "..", "dist");

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

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/** Віддає зібрані файли з dist/ (Docker/прод). true — якщо запит оброблено. */
function sprobovatyStatyku(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const shlyakh = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (shlyakh.startsWith("/api/")) return false;

  const bezpechnyj = path.normalize(shlyakh).replace(/^(\.\.[/\\])+/, "");
  let fayl = path.join(DIST, bezpechnyj);
  if (!fayl.startsWith(DIST)) return false;
  if (existsSync(fayl) && statSync(fayl).isDirectory()) fayl = path.join(fayl, "index.html");
  if (!existsSync(fayl)) {
    // SPA-фолбек: будь-який інший GET → index.html (робота вкладок/хешів)
    fayl = path.join(DIST, "index.html");
    if (!existsSync(fayl)) return false;
  }

  const rozshyrennya = path.extname(fayl).toLowerCase();
  const typ = MIME[rozshyrennya] ?? "application/octet-stream";
  const stat = statSync(fayl);
  res.writeHead(200, {
    "Content-Type": typ,
    "Content-Length": stat.size,
    "Cache-Control": rozshyrennya === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  if (req.method === "HEAD") {
    res.end();
    return true;
  }
  createReadStream(fayl).pipe(res);
  return true;
}

const MARshruty: Record<string, (obrobka: Obrobka) => RobochaVidpovid | Promise<RobochaVidpovid>> = {
  "/api/status": obrobytyStatus,
  "/api/checkout": () => obrobytyCheckout(),
  "/api/pay/confirm": obrobytyPayConfirm,
  "/api/kazka": obrobytyKazka,
  "/api/analytics": (obrobka) => {
    const body =
      typeof obrobka.body === "object" && obrobka.body !== null
        ? (obrobka.body as Record<string, unknown>)
        : {};
    console.log(
      JSON.stringify({
        typ: "analytyka",
        podiia: typeof body.n === "string" ? body.n : "nevidomo",
        chas: typeof body.t === "number" ? body.t : Date.now(),
      }),
    );
    return { status: 204, cookie: [], body: {} };
  },
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
  if (sprobovatyStatyku(req, res)) return;

  // Озвучка повертає MP3-байти, тому обробляється окремо від JSON-мапи
  if (url === "/api/ozvuka" && req.method === "POST") {
    prochytatyTilo(req, (body) => {
      void (async () => {
        try {
          const vidpovid = await obrobytyOzvuka((body ?? {}) as Record<string, unknown>);
          if (vidpovid.kind === "audio") {
            res.writeHead(200, {
              "Content-Type": vidpovid.contentType,
              "Cache-Control": "public, max-age=3600",
            });
            res.end(vidpovid.body);
          } else {
            res.writeHead(vidpovid.status, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ pomylka: vidpovid.pomylka }));
          }
        } catch (e) {
          console.error("Помилка озвучки:", e);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ pomylka: "Помилка сервера" }));
        }
      })();
    });
    return;
  }

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
