/**
 * Vercel serverless: POST /api/kazka
 * Ключі (LLM_API_KEY, PRO_SECRET, LIQPAY_*) — у Vercel Environment Variables.
 */
import type { ApiReq, ApiRes } from "../shared/api-helpers.js";
import { nePost, viddaty } from "../shared/api-helpers.js";
import { obrobytyKazka } from "../shared/pro.js";

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  if (nePost(req, res)) return;
  try {
    const vidpovid = await obrobytyKazka({
      method: "POST",
      headers: req.headers ?? {},
      body: req.body ?? {},
    });
    viddaty(res, vidpovid);
  } catch {
    res.status(500).json({ pomylka: "Помилка сервера" });
  }
}
