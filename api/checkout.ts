/**
 * Vercel serverless: POST /api/checkout — створення оплати.
 * Без ключів LiqPay працює демо-режим, з ключами — реальна форма LiqPay.
 */
import type { ApiReq, ApiRes } from "../shared/api-helpers";
import { nePost, viddaty } from "../shared/api-helpers";
import { obrobytyCheckout } from "../shared/pro";

export default function handler(req: ApiReq, res: ApiRes): void {
  if (nePost(req, res)) return;
  viddaty(res, obrobytyCheckout());
}
