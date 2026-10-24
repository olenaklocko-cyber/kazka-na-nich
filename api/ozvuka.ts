/**
 * Vercel serverless: POST /api/ozvuka
 * Повертає MP3-озвучку казки (живі ШІ-голоси, див. shared/ozvuka.ts).
 * Ключ LLM_API_KEY — у Vercel Environment Variables.
 */
import type { ApiReq, ApiRes } from "../shared/api-helpers.js";
import { obrobytyOzvuka } from "../shared/ozvuka.js";

interface OzvukaRes extends ApiRes {
  end(data: Buffer): unknown;
}

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ pomylka: "Лише POST" });
    return;
  }
  try {
    const tilo = (req.body ?? {}) as Record<string, unknown>;
    const vidpovid = await obrobytyOzvuka(tilo);
    if (vidpovid.kind === "audio") {
      res.setHeader("Content-Type", vidpovid.contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.status(200);
      (res as OzvukaRes).end(vidpovid.body);
    } else {
      res.status(vidpovid.status).json({ pomylka: vidpovid.pomylka });
    }
  } catch {
    res.status(500).json({ pomylka: "Помилка сервера" });
  }
}
