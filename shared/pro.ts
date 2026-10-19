/**
 * Оплата (LiqPay), Pro-токени та серверний лічильник безкоштовних казок.
 *
 * Принцип безпеки:
 *  - номер картки НІКОЛИ не потрапляє в наш код: його вводять лише на
 *    сторінці LiqPay, а ми отримуємо лише «оплачено» + підписаний webhook;
 *  - усі секрети (PRO_SECRET, LIQPAY_PRIVATE_KEY) — тільки в .env / Vercel
 *    Environment Variables, ніколи у фронтенді;
 *  - Pro-статус і лічильник — у HttpOnly cookie з підписом HMAC, сервер
 *    перевіряє підпис сам (обійти через localStorage не можна).
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { generuvalyKazku, prochytatyZapyt } from "./kazka.js";

/** Безкоштовний план: скільки казок можна згенерувати без оплати. */
export const LYMIT_BEZKOShTOVYH = 3;
/** Pro-доступ купується разом на 30 днів ($4.99). */
export const PRO_DNI = 30;
export const CENA_USD = "4.99";

export interface Obrobka {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface RobochaVidpovid {
  status: number;
  /** Рядки Set-Cookie (якщо потрібно встановити cookie). */
  cookie: string[];
  body: unknown;
}

const COOKIE_PRO = "kazka_pro";
const COOKIE_LYCH = "kazka_lych";

/* ============================ КРИПТОГРАФІЯ ============================ */

function sekret(): string {
  const s = process.env.PRO_SECRET;
  if (!s) console.warn("⚠️ PRO_SECRET не заданий — Pro-токени матимуть стандартний ключ");
  return s || "kazka-pro-zapaskovyy-sekret";
}

function hmac(dani: string, kluch: string = sekret()): string {
  return createHmac("sha256", kluch).update(dani).digest("base64url");
}

/** Підписуємо JSON: base64url(дані).base64url(pідпис). */
function pidpysaty(payload: unknown): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${hmac(data)}`;
}

/** Перевіряємо підпис і повертаємо payload або null (захист від підробки). */
function rozpysaty(token: string): Record<string, unknown> | null {
  const krapka = token.lastIndexOf(".");
  if (krapka < 1) return null;
  const data = token.slice(0, krapka);
  const pidpys = token.slice(krapka + 1);
  const очікуваний = hmac(data);
  const a = Buffer.from(pidpys);
  const b = Buffer.from(очікуваний);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload: unknown = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    return typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/* ============================== COOKIE ============================== */

export function prochytatyKuky(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const syre = headers.cookie ?? headers.Cookie ?? "";
  const ridyne = Array.isArray(syre) ? syre.join("; ") : (syre || "");
  const rezultat: Record<string, string> = {};
  for (const partyna of ridyne.split(";")) {
    const krapka = partyna.indexOf("=");
    if (krapka < 1) continue;
    rezultat[partyna.slice(0, krapka).trim()] = partyna.slice(krapka + 1).trim();
  }
  return rezultat;
}

function httpsRezhym(): boolean {
  return (process.env.APP_URL ?? "").startsWith("https");
}

function opysCookie(nazva: string, znachennya: string, maxAge: number, httpOnly = true): string {
  const secure = httpsRezhym() ? "; Secure" : "";
  return `${nazva}=${znachennya}; Path=/; Max-Age=${maxAge}; SameSite=Lax${httpOnly ? "; HttpOnly" : ""}${secure}`;
}

export interface StanPro {
  pro: boolean;
  do: number | null;
}

export function proStatus(kuky: Record<string, string>): StanPro {
  const payload = rozpysaty(kuky[COOKIE_PRO] ?? "");
  if (!payload) return { pro: false, do: null };
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (exp < Date.now()) return { pro: false, do: null };
  return { pro: true, do: exp };
}

function prochytatyLych(kuky: Record<string, string>): number {
  const payload = rozpysaty(kuky[COOKIE_LYCH] ?? "");
  const n = payload && typeof payload.n === "number" ? payload.n : 0;
  return n >= 0 && n < 1000 ? n : 0;
}

function cookieLych(n: number): string {
  return opysCookie(COOKIE_LYCH, pidpysaty({ n, exp: Date.now() + PRO_DNI * 86_400_000 }), PRO_DNI * 86_400);
}

function cookiePro(): string {
  return opysCookie(COOKIE_PRO, pidpysaty({ exp: Date.now() + PRO_DNI * 86_400_000 }), PRO_DNI * 86_400);
}

/* ============================ ЛІЧИЛЬНИК ============================ */

export interface StanLyka {
  skilky: number;
  lyshylosya: number;
  lymitVykorystano: boolean;
}

export function stanLyka(pro: boolean, kuky: Record<string, string>): StanLyka {
  const n = prochytatyLych(kuky);
  return {
    skilky: n,
    lyshylosya: pro ? Infinity : Math.max(0, LYMIT_BEZKOShTOVYH - n),
    lymitVykorystano: !pro && n >= LYMIT_BEZKOShTOVYH,
  };
}

/* ============================== ЛІМІТ ============================== */

/**
 * Генерує казку з урахуванням ліміту.
 * Ліміт рахує СЕРВЕР у підписаному cookie — очистити localStorage недостатньо.
 * Невдала генерація ліміт НЕ з'їдає.
 */
export async function obrobytyKazka(obrobka: Obrobka): Promise<RobochaVidpovid> {
  const kuky = prochytatyKuky(obrobka.headers);
  const stan = proStatus(kuky);
  const lych = stanLyka(stan.pro, kuky);

  if (lych.lymitVykorystano) {
    return {
      status: 403,
      cookie: [],
      body: {
        pomylka: `Ліміт ${LYMIT_BEZKOShTOVYH} безкоштовні казки вичерпано`,
        lymit: true,
        skilky: lych.skilky,
        lyshylosya: 0,
      },
    };
  }

  const zapyt = prochytatyZapyt(obrobka.body);
  if ("pomylka" in zapyt) {
    return { status: 400, cookie: [], body: { pomylka: zapyt.pomylka, skilky: lych.skilky } };
  }

  const rezultat = await generuvalyKazku(zapyt, process.env.LLM_API_KEY ?? "");
  if ("pomylka" in rezultat) {
    return { status: 502, cookie: [], body: { ...rezultat, skilky: lych.skilky } };
  }

  const novyyN = stan.pro ? lych.skilky : lych.skilky + 1;
  return {
    status: 200,
    cookie: stan.pro ? [] : [cookieLych(novyyN)],
    body: {
      ...rezultat,
      pro: stan.pro,
      skilky: novyyN,
      lyshylosya: stan.pro ? -1 : Math.max(0, LYMIT_BEZKOShTOVYH - novyyN),
    },
  };
}

/* ============================== СТАТУС ============================== */

export function obrobytyStatus(obrobka: Obrobka): RobochaVidpovid {
  const kuky = prochytatyKuky(obrobka.headers);
  const stan = proStatus(kuky);
  const lych = stanLyka(stan.pro, kuky);
  const demo = !process.env.LIQPAY_PUBLIC_KEY || !process.env.LIQPAY_PRIVATE_KEY;
  return {
    status: 200,
    cookie: [],
    body: {
      pro: stan.pro,
      proDo: stan.do,
      skilky: lych.skilky,
      lyshylosya: stan.pro ? -1 : lych.lyshylosya,
      lymitVykorystano: lych.lymitVykorystano,
      demo,
      limit: LYMIT_BEZKOShTOVYH,
    },
  };
}

/* ============================ ОПЛАТА ============================ */

interface LiqPayDanі {
  public_key: string;
  action: string;
  amount: string;
  currency: string;
  description: string;
  order_id: string;
  sandbox?: number;
  result_url?: string;
  callback_url?: string;
  [ключ: string]: unknown;
}

function liqPayPidpys(data: string): string {
  const private_key = process.env.LIQPAY_PRIVATE_KEY ?? "";
  return createHash("sha3-256").update(private_key + data + private_key).digest("base64");
}

function demoPidpysanyjToken(): string {
  return pidpysaty({ metu: "demo-oplata", exp: Date.now() + 15 * 60_000 });
}

export function yeDemoRezhym(): boolean {
  return !process.env.LIQPAY_PUBLIC_KEY || !process.env.LIQPAY_PRIVATE_KEY;
}

/**
 * Створює сесію оплати.
 * Демо-режим (немає ключів LiqPay): видає одноразовий токен для нашої
 * демо-сторінки оплати. З ключами: віддає дані для форми на liqpay.ua.
 */
export function obrobytyCheckout(): RobochaVidpovid {
  if (yeDemoRezhym()) {
    return {
      status: 200,
      cookie: [],
      body: {
        demo: true,
        token: demoPidpysanyjToken(),
        cena: CENA_USD,
        posylannyaOpys: "Демо-режим: ключі LiqPay ще не додані",
      },
    };
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:5173";
  const danі: LiqPayDanі = {
    version: 7,
    public_key: process.env.LIQPAY_PUBLIC_KEY ?? "",
    action: "pay",
    amount: CENA_USD,
    currency: "USD",
    description: `Казка на ніч — Pro на ${PRO_DNI} днів: безліміт казок`,
    order_id: `kazka-${Date.now()}-${randomBytes(4).toString("hex")}`,
    sandbox: 1,
    result_url: `${appUrl}/`,
  };
  const data = Buffer.from(JSON.stringify(danі)).toString("base64");
  return {
    status: 200,
    cookie: [],
    body: {
      demo: false,
      forma: {
        action: "https://www.liqpay.ua/api/3/checkout",
        public_key: danі.public_key,
        data,
        signature: liqPayPidpys(data),
      },
      cena: CENA_USD,
    },
  };
}

/** Чи є підпис LiqPay з потрібним статусом (у тестовому режимі ще й sandbox). */
function liqPayUspikh(dataB64: string, signature: string): boolean {
  if (yeDemoRezhym()) return false;
  if (liqPayPidpys(dataB64) !== signature) return false;
  try {
    const danі: unknown = JSON.parse(Buffer.from(dataB64, "base64").toString("utf-8"));
    const status =
      typeof danі === "object" && danі !== null && "status" in danі
        ? String((danі as { status: unknown }).status)
        : "";
    return status === "success" || status === "sandbox" || status === "waitsecure";
  } catch {
    return false;
  }
}

/**
 * Підтвердження оплати.
 *  1) { token }            — демо-режим (наша симуляція сторінки LiqPay);
 *  2) { data, signature }  — справжній result_url від LiqPay (підпис перевіряється).
 * У разі успіху видає cookie Pro на 30 днів.
 */
export function obrobytyPayConfirm(obrobka: Obrobka): RobochaVidpovid {
  const body =
    typeof obrobka.body === "object" && obrobka.body !== null
      ? (obrobka.body as Record<string, unknown>)
      : {};

  let uspikh = false;

  if (typeof body.token === "string" && yeDemoRezhym()) {
    const payload = rozpysaty(body.token);
    uspikh = payload !== null && payload.metu === "demo-oplata" && Number(payload.exp) > Date.now();
  } else if (typeof body.data === "string" && typeof body.signature === "string") {
    uspikh = liqPayUspikh(body.data, body.signature);
  }

  if (!uspikh) {
    return { status: 400, cookie: [], body: { pomylka: "Оплату не підтверджено" } };
  }

  return {
    status: 200,
    cookie: [cookiePro()],
    body: { pro: true, proDo: Date.now() + PRO_DNI * 86_400_000 },
  };
}
