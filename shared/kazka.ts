/**
 * Генерація дитячої казки через Gemini API (REST, без SDK).
 * Спільний модуль: dev-сервер (server/) і Vercel-функція (api/).
 */

export type Mova = "uk" | "en";

export interface KazkaZapyt {
  imia: string;
  hero: string;
  urok: string;
  mova: Mova;
}

export type KazkaResult = { tekst: string } | { pomylka: string };

const MODEL = "gemini-3.5-flash-lite";
const MAX_DOVZHINA = { imia: 40, hero: 60, urok: 80 } as const;

function ochystyty(value: string, max: number): string {
  return value.replace(/[\r\n\t ]+/g, " ").trim().slice(0, max);
}

function promt(d: KazkaZapyt): string {
  const movaTekst =
    d.mova === "uk" ? "українською мовою" : "англійською мовою";
  return `Склади коротку дитячу казку на ніч ${movaTekst}.
Ім'я дитини (головний глядач казки): ${ochystyty(d.imia, MAX_DOVZHINA.imia) || "Малюк"}.
Головний герой: ${ochystyty(d.hero, MAX_DOVZHINA.hero) || "добрий зайчик"}.
Повчальний урок, який має бути природно вплетений у сюжет: ${ochystyty(d.urok, MAX_DOVZHINA.urok || "бути добрим")}.
Вимоги:
- 150-250 слів, чітка структура: початок, пригоди, добрий кінець;
- м'який сюжет: без жахітв, насильства, страшних монстрів і смерті;
- урок випливає з історії, а не з моралізаторства в кінці;
- казка має починатися з самої історії;
- без згадок про штучний інтелект, комп'ютери чи те, що ти — модель.
Відповідай ЛИШЕ текстом казки, без заголовків, списків і пояснень.`;
}

interface GeminiVidpovid {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

export async function generuvalyKazku(
  zapyt: KazkaZapyt,
  kluch: string,
): Promise<KazkaResult> {
  if (!kluch) return { pomylka: "Серверний ключ API не налаштовано" };

  const vidpovid = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(kluch)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promt(zapyt) }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 800 },
      }),
    },
  );

  if (!vidpovid.ok) {
    const text = await vidpovid.text().catch(() => "");
    console.error("Gemini API:", vidpovid.status, text.slice(0, 300));
    return { pomylka: "Не вдалося зв'язатися з генератором казок" };
  }

  const data = (await vidpovid.json()) as GeminiVidpovid;
  const blokuvannya = data.promptFeedback?.blockReason;
  if (blokuvannya) {
    console.error("Запит заблоковано:", blokuvannya);
    return { pomylka: "Запит заблоковано фільтром безпеки" };
  }

  const tekst = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!tekst) {
    return { pomylka: "Генератор повернув порожню казку — спробуй ще раз" };
  }

  return { tekst };
}

/** Валідація тіла запиту (спільна для dev і Vercel). */
export function prochytatyZapyt(body: unknown): KazkaZapyt | { pomylka: string } {
  if (typeof body !== "object" || body === null) {
    return { pomylka: "Некоректне тіло запиту" };
  }
  const b = body as Record<string, unknown>;
  const imia = typeof b.imia === "string" ? b.imia : "";
  const hero = typeof b.hero === "string" ? b.hero : "";
  const urok = typeof b.urok === "string" ? b.urok : "";
  const mova: Mova = b.mova === "en" ? "en" : "uk";

  if (!imia.trim() && !hero.trim() && !urok.trim()) {
    return { pomylka: "Заповніть хоча б одне поле" };
  }
  return { imia, hero, urok, mova };
}
