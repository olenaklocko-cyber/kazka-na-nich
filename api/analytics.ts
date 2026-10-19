/**
 * Vercel serverless: POST /api/analytics — прийом подій аналітики.
 * Дані звітів агрегуються у браузері; тут логуємо для серверного обліку.
 */
import type { ApiReq, ApiRes } from "../shared/api-helpers.js";

export default function handler(req: ApiReq, res: ApiRes): void {
  if (req.method !== "POST") {
    res.status(405).json({ pomylka: "Лише POST" });
    return;
  }
  const body =
    typeof req.body === "object" && req.body !== null
      ? (req.body as Record<string, unknown>)
      : {};
  const nazva = typeof body.n === "string" ? body.n.slice(0, 64) : "nevidomo";
  const params = typeof body.p === "object" && body.p !== null ? body.p : {};
  console.log(
    JSON.stringify({
      typ: "analytyka",
      podiia: nazva,
      chas: typeof body.t === "number" ? body.t : Date.now(),
      variant: (params as Record<string, unknown>).variant ?? null,
    }),
  );
  res.status(204).json({});
}
