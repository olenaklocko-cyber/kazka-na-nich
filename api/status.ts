/**
 * Vercel serverless: POST /api/status — Pro-статус, лічильник, демо-режим.
 */
import type { ApiReq, ApiRes } from "../shared/api-helpers";
import { nePost, viddaty } from "../shared/api-helpers";
import { obrobytyStatus } from "../shared/pro";

export default function handler(req: ApiReq, res: ApiRes): void {
  if (nePost(req, res)) return;
  viddaty(res, obrobytyStatus({ method: "POST", headers: req.headers ?? {}, body: req.body ?? {} }));
}
