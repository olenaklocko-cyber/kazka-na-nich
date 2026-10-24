/**
 * ШІ-озвучка казки: Gemini TTS → MP3 (αудіо-байти).
 *
 * Спільна логіка для Vercel (api/ozvuka.ts) і локального dev-сервера
 * (server/server.ts), щоб поведінка не розійшлася між режимами.
 *
 * Живі голоси: модель текстує інтонації через speech_metadata.style,
 * а тембр дає prebuilt-голос. Ключ LLM_API_KEY — лише на сервері.
 */
import { Mp3Encoder } from "@breezystack/lamejs";

export interface OzvukaZapyt {
  tekst?: unknown;
  profil?: unknown;
  mova?: unknown;
}

export type OzvukaVidpovid =
  | { kind: "pomylka"; status: number; pomylka: string }
  | { kind: "audio"; status: 200; contentType: "audio/mpeg"; body: Buffer };

interface TtsKrok {
  content?: Array<{ data?: string }>;
}
interface TtsVidpovid {
  steps?: TtsKrok[];
}

/** Модель TTS (за замовчуванням — швидка й економна для зачитувань). */
function model(): string {
  return process.env.TTS_MODEL ?? "gemini-3.8-flash-lite-tts";
}

interface ProfilTTS {
  voice: string;
  style: string;
  styleEn: string;
}

/**
 * Три характери озвучки. Голоси підібрані за метаданими Gemini
 * (гендер/тембр/персона), стиль — опис гри, яку має дати актор.
 */
const PROFILI_TTS: Record<string, ProfilTTS> = {
  mama: {
    voice: "en-us-assistant-11",
    style:
      "М'яким, теплим, заспокійливим жіночим голосом мами. Повільний, ніжний, лагідний темп — щоб дитина засинала. " +
      "Природні ніжні інтонації, без різких наголосів, тихо й лагідно, як читають колискову на ніч.",
    styleEn:
      "In a soft, warm, soothing mother's voice. Slow, gentle, tender pace for putting a child to sleep. " +
      "Natural gentle intonations, no sharp emphasis, quiet and tender like reading a lullaby at night.",
  },
  tato: {
    voice: "achird",
    style:
      "Глибоким, оксамитовим чоловічим голосом тата. Спокійний, впевнений, розмірений темп. " +
      "Добрий, надійний і теплий тон, природні інтонації уважного оповідача.",
    styleEn:
      "In a deep, velvety father's voice. Calm, confident, measured pace. " +
      "Kind, warm and reliable tone with natural attentive narrator intonation.",
  },
  charyvnyj: {
    voice: "enceladus",
    style:
      "Виразним акторським голосом чарівного оповідача казок: злегка таємничий і загадковий, " +
      "з живими інтонаціями, шепотом таємниці, емоційними підйомами й спадами — " +
      "як розповідають найцікавіші нічні казки.",
    styleEn:
      "With an expressive fairytale narrator's voice: slightly mysterious and magical, with lively intonations, " +
      "a whisper of secret, emotional ups and downs — like telling the most captivating bedtime story.",
  },
};

const MAX_TEKST = 6000;

/** Обробляє запит озвучки: текст казки → MP3-байти. */
export async function obrobytyOzvuka(tilo: OzvukaZapyt): Promise<OzvukaVidpovid> {
  const tekst = typeof tilo.tekst === "string" ? tilo.tekst.trim() : "";
  const mova = tilo.mova === "en" ? "en" : "uk";
  const prof = typeof tilo.profil === "string" ? PROFILI_TTS[tilo.profil] : undefined;

  if (!tekst || tekst.length < 5) {
    return { kind: "pomylka", status: 400, pomylka: "Порожній текст для озвучки" };
  }
  if (tekst.length > MAX_TEKST) {
    return { kind: "pomylka", status: 400, pomylka: "Казка задовга для озвучки" };
  }
  if (!prof) {
    return { kind: "pomylka", status: 400, pomylka: "Невідомий голос" };
  }
  const kluch = process.env.LLM_API_KEY;
  if (!kluch) {
    return { kind: "pomylka", status: 500, pomylka: "Серверний ключ API не налаштовано" };
  }

  try {
    const vidp = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": kluch },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model: model(),
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text: tekst,
                annotations: [
                  {
                    type: "speech_metadata",
                    style: mova === "en" ? prof.styleEn : prof.style,
                  },
                ],
              },
            ],
          },
        ],
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice: prof.voice }] },
      }),
    });

    const data = (await vidp.json()) as TtsVidpovid & { error?: { message?: string } };
    if (!vidp.ok) {
      console.error("Gemini TTS:", vidp.status, data.error?.message ?? "невідома помилка");
      return { kind: "pomylka", status: 502, pomylka: "Не вдалося озвучити казку — спробуй ще раз" };
    }

    const b64 = data.steps?.[0]?.content?.[0]?.data;
    if (typeof b64 !== "string" || !b64) {
      console.error("Gemini TTS: порожня аудіовідповідь");
      return { kind: "pomylka", status: 502, pomylka: "Сервіс озвучки повернув порожню відповідь" };
    }

    const mp3 = wavDoMp3(Buffer.from(b64, "base64"));
    if (!mp3.length) {
      console.error("Gemini TTS: не вдалося закодувати аудіо");
      return { kind: "pomylka", status: 502, pomylka: "Не вдалося обробити аудіо" };
    }
    return { kind: "audio", status: 200, contentType: "audio/mpeg", body: mp3 };
  } catch (e) {
    console.error("TTS помилка:", e instanceof Error ? e.message : e);
    return { kind: "pomylka", status: 502, pomylka: "Не вдалося озвучити казку — спробуй ще раз" };
  }
}

/** WAV (PCM 16 біт) → MP3. Повертає порожній Buffer, якщо формат неочікуваний. */
function wavDoMp3(wav: Buffer): Buffer {
  if (wav.length < 44 || wav.subarray(0, 4).toString("ascii") !== "RIFF") return Buffer.alloc(0);

  let pos = 12;
  let channels = 0;
  let sampleRate = 0;
  let bits = 0;
  let dataStart = -1;
  let dataLen = 0;

  while (pos + 8 <= wav.length) {
    const id = wav.subarray(pos, pos + 4).toString("ascii");
    const size = wav.readUInt32LE(pos + 4);
    if (id === "fmt ") {
      channels = wav.readUInt16LE(pos + 10);
      sampleRate = wav.readUInt32LE(pos + 12);
      bits = wav.readUInt16LE(pos + 22);
    } else if (id === "data") {
      dataStart = pos + 8;
      dataLen = Math.min(size, wav.length - dataStart);
      break;
    }
    pos += 8 + size + (size % 2);
  }

  if (dataStart < 0 || (channels !== 1 && channels !== 2) || bits !== 16 || !sampleRate) {
    return Buffer.alloc(0);
  }

  const total = Math.floor(dataLen / 2);
  let zvuk: Int16Array;
  if ((wav.byteOffset + dataStart) % 2 === 0) {
    zvuk = new Int16Array(wav.buffer, wav.byteOffset + dataStart, total);
  } else {
    const kopiya = Buffer.from(wav.subarray(dataStart, dataStart + total * 2));
    zvuk = new Int16Array(kopiya.buffer, kopiya.byteOffset, total);
  }

  const enc = new Mp3Encoder(channels, sampleRate, 64);
  const shmatky: Buffer[] = [];
  const blok = 1152 * 16;
  const push = (b: Uint8Array): void => {
    if (b.length) shmatky.push(Buffer.from(b));
  };

  if (channels === 1) {
    for (let i = 0; i < zvuk.length; i += blok) {
      push(enc.encodeBuffer(zvuk.subarray(i, i + blok)));
    }
  } else {
    const n = Math.floor(zvuk.length / 2);
    const l = new Int16Array(n);
    const r = new Int16Array(n);
    for (let i = 0, j = 0; i < n; i += 1, j += 2) {
      l[i] = zvuk[j];
      r[i] = zvuk[j + 1];
    }
    for (let i = 0; i < n; i += blok) {
      push(enc.encodeBuffer(l.subarray(i, i + blok), r.subarray(i, i + blok)));
    }
  }

  push(enc.flush());
  return Buffer.concat(shmatky);
}
