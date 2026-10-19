/**
 * Vercel serverless: POST /api/pay/confirm — підтвердження оплати.
 * Демо-токен (симуляція) або підписаний data+signature від LiqPay (result_url).
 */
import type { ApiReq, ApiRes } from "../../shared/api-helpers.js";
import { nePost, viddaty } from "../../shared/api-helpers.js";
import { obrobytyPayConfirm } from "../../shared/pro.js";

export default function handler(req: ApiReq, res: ApiRes): void {
  if (nePost(req, res)) return;
  viddaty(res, obrobytyPayConfirm({ method: "POST", headers: req.headers ?? {}, body: req.body ?? {} }));
}
