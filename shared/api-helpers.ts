/**
 * Адаптер для Vercel serverless-функцій api/*.
 * Той самий хендлер shared/pro.ts, що й у dev-сервера, — щоб логіка
 * ліміту й оплати не розійшлася між локальним режимом і продакшеном.
 */
import type { RobochaVidpovid } from "./pro";

export interface ApiReq {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiRes {
  status(code: number): ApiRes;
  setHeader(name: string, value: string | string[]): void;
  json(obj: unknown): void;
}

/** Відправляє відповідь разом із cookie (Set-Cookie), якщо є. */
export function viddaty(res: ApiRes, vidpovid: RobochaVidpovid): void {
  if (vidpovid.cookie.length) res.setHeader("Set-Cookie", vidpovid.cookie);
  res.status(vidpovid.status).json(vidpovid.body);
}

/** true, якщо метод не POST (відповідає 405). */
export function nePost(req: ApiReq, res: ApiRes): boolean {
  if (req.method !== "POST") {
    res.status(405).json({ pomylka: "Лише POST" });
    return true;
  }
  return false;
}
