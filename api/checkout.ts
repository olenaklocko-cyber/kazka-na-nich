/**
 * Vercel serverless: POST /api/checkout — створення оплати.
 * Без ключів LiqPay працює демо-режим, з ключами — реальна форма LiqPay.
 */
import type { ApiReq, ApiRes } from "../shared/api-helpers.js";
import { nePost, viddaty } from "../shared/api-helpers.js";
import { obrobytyCheckout } from "../shared/pro.js";

export default function handler(req: ApiReq, res: ApiRes): void {
  if (nePost(req, res)) return;
  viddaty(res, obrobytyCheckout());
}
