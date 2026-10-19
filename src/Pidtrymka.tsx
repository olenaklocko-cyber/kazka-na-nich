import { useCallback, useEffect, useState } from "react";
import { podie } from "./lib/analytyka";

const GH_ISSUES = "https://github.com/olenaklocko-cyber/kazka-na-nich/issues/new";
const KLYUCH_ZVERNEN = "kazka_zvernennia";

interface Zvernennia {
  typ: "bug" | "idea" | "question";
  tekst: string;
  chas: number;
  nadislano: boolean;
}

const TYPY: { kod: Zvernennia["typ"]; emodzi: string; nazva: string }[] = [
  { kod: "bug", emodzi: "🐛", nazva: "Помилка" },
  { kod: "idea", emodzi: "💡", nazva: "Ідея" },
  { kod: "question", emodzi: "❓", nazva: "Питання" },
];

function prochytatyZvernennia(): Zvernennia[] {
  try {
    const syra = localStorage.getItem(KLYUCH_ZVERNEN);
    if (!syra) return [];
    const d = JSON.parse(syra);
    return Array.isArray(d) ? (d as Zvernennia[]) : [];
  } catch {
    return [];
  }
}

function zberyahaty(list: Zvernennia[]): void {
  localStorage.setItem(KLYUCH_ZVERNEN, JSON.stringify(list.slice(-20)));
}

export default function Pidtrymka() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [chasPerevirky, setChasPerevirky] = useState<number | null>(null);
  const [typ, setTyp] = useState<Zvernennia["typ"]>("bug");
  const [tekst, setTekst] = useState("");
  const [istoriya, setIstoriya] = useState<Zvernennia[]>(() => prochytatyZvernennia());

  const perevirytu = useCallback(async () => {
    setApiOk(null);
    try {
      const vidp = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(8000),
      });
      setApiOk(vidp.ok);
    } catch {
      setApiOk(false);
    }
    setChasPerevirky(Date.now());
  }, []);

  useEffect(() => {
    void perevirytu();
  }, [perevirytu]);

  const stvorytyZvernennia = () => {
    const chystyjTekst = tekst.trim();
    if (!chystyjTekst) return;
    const nazvaTypu = TYPY.find((t) => t.kod === typ)?.nazva ?? "Звернення";
    const titul = `[${nazvaTypu}] ${chystyjTekst.slice(0, 60)}`;
    const tilo = `${chystyjTekst}\n\n---\nНадіслано з вкладки «Підтримка» застосунку «Казка на ніч».`;
    const url = `${GH_ISSUES}?title=${encodeURIComponent(titul)}&body=${encodeURIComponent(tilo)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    const nove: Zvernennia = { typ, tekst: chystyjTekst, chas: Date.now(), nadislano: true };
    const onovleno = [...istoriya, nove];
    setIstoriya(onovleno);
    zberyahaty(onovleno);
    setTekst("");
    podie("zvernennia_stvoreno", { typ });
  };

  return (
    <main className="zvit">
      <header className="zvit-shapka">
        <h2>📖 Підтримка</h2>
      </header>

      <p className="zvit-pidkazka">
        Тиждень 7: статус сервісів, гайд «за 5 хвилин» і простий спосіб надіслати
        звернення — усе тут, без реєстрацій.
      </p>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-status">
        <h3 id="zag-status">🟢 Статус сервісів</h3>
        <div className="pidtrymka-statusy">
          <div className="pidtrymka-status">
            <span
              className={`pidtrymka-cykor ${apiOk === null ? "pidtrymka-cykor-sivi" : apiOk ? "pidtrymka-cykor-zelenyi" : "pidtrymka-cykor-chervonyi"}`}
              aria-hidden="true"
            >
              ●
            </span>
            <div>
              <strong>API сервера (генерація, ліміт, оплата)</strong>
              <span>
                {apiOk === null
                  ? "Перевіряємо…"
                  : apiOk
                    ? "Працює — відповідає за 8 сек"
                    : "Не відповідає — спробуй оновити"}
              </span>
            </div>
          </div>
          <div className="pidtrymka-status">
            <span className="pidtrymka-cykor pidtrymka-cykor-zelenyi" aria-hidden="true">
              ●
            </span>
            <div>
              <strong>Сайт (відкрита сторінка)</strong>
              <span>Працює — ти це читаєш саме з нього</span>
            </div>
          </div>
          <div className="pidtrymka-status">
            <span className="pidtrymka-cykor pidtrymka-cykor-zelenyi" aria-hidden="true">
              ●
            </span>
            <div>
              <strong>Каса LiqPay</strong>
              <span>Sandbox-режим; перевіряється під час оплати</span>
            </div>
          </div>
        </div>
        <p className="zvit-pidkazka">
          {chasPerevirky
            ? `Остання перевірка API: ${new Date(chasPerevirky).toLocaleTimeString("uk-UA")}. `
            : ""}
          <button type="button" className="knopka knopka-mala" onClick={() => void perevirytu()}>
            🔁 Оновити статус
          </button>
        </p>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-guide">
        <h3 id="zag-guide">🚀 Гайд: почати за 5 хвилин</h3>
        <ol className="podii-spysok infra-spysok">
          <li>
            <strong>Просто подивитися</strong> — відкрий головну, введи імʼя дитини,
            обери героя, натисни «Створити казку». 3 безкоштовні казки.
          </li>
          <li>
            <strong>У себе на компʼютері</strong> — <code>git clone</code> →{" "}
            <code>npm ci</code> → <code>cp .env.example .env</code> →{" "}
            <code>npm run dev</code> → http://localhost:5173
          </li>
          <li>
            <strong>Однією командою в Docker</strong> — <code>docker compose up --build</code> →
            http://localhost:3002
          </li>
        </ol>
        <p className="zvit-visnovok">
          Повний гайд — у файлі <code>ГАЙД.md</code> репозиторію. Тестова оплата:
          картка 4242 4242 4242 4242, 12/30.
        </p>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-forma">
        <h3 id="zag-forma">✉️ Надіслати звернення</h3>
        <p className="zvit-pidkazka">
          Обери тип, опиши — і кнопка відкриє готову форму на GitHub Issues (без
          реєстрації можна лише читати; акаунт GitHub безкоштовний).
        </p>
        <div className="pidtrymka-typy" role="group" aria-label="Тип звернення">
          {TYPY.map((t) => (
            <button
              key={t.kod}
              type="button"
              className="knopka knopka-mala knopka-vkladka"
              aria-pressed={typ === t.kod}
              onClick={() => setTyp(t.kod)}
            >
              {t.emodzi} {t.nazva}
            </button>
          ))}
        </div>
        <textarea
          className="pole-tekst"
          rows={4}
          placeholder="Опиши, що сталося або чого хочеш…"
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          aria-label="Текст звернення"
        />
        <button
          type="button"
          className="knopka"
          onClick={stvorytyZvernennia}
          disabled={!tekst.trim()}
        >
          🚀 Створити звернення на GitHub
        </button>

        {istoriya.length > 0 && (
          <div className="pidtrymka-istoriya">
            <h4>Мої звернення (збережені локально)</h4>
            <ul className="podii-spysok">
              {istoriya
                .slice()
                .reverse()
                .map((z) => (
                  <li key={z.chas}>
                    <strong>{TYPY.find((t) => t.kod === z.typ)?.emodzi} </strong>
                    {z.tekst.slice(0, 80)}
                    {z.tekst.length > 80 ? "…" : ""}
                    <span className="zvit-pidkazka">
                      {" "}
                      — {new Date(z.chas).toLocaleString("uk-UA")}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-faq">
        <h3 id="zag-faq">❓ Часті питання</h3>
        <ul className="podii-spysok infra-spysok">
          <li>
            <strong>Де мій Pro?</strong> Кнопка «Pro — $4.99» → оплата; ліміт
            безкоштовних — 3 казки.
          </li>
          <li>
            <strong>Куди зникла казка?</strong> Казки генеруються «тут і зараз»,
            зберігай улюблені (список поруч із текстом).
          </li>
          <li>
            <strong>Сайт впав?</strong> Онови статус вище; якщо червоний — зачекай
            хвилину і натисни «Оновити».
          </li>
        </ul>
      </section>
    </main>
  );
}
