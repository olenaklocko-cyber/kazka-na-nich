import { useState } from "react";

type Rozdil = "haid" | "changelog" | "pro";

const KROKY_HAID: { zag: string; kroky: string[] }[] = [
  {
    zag: "1. Просто створити казку (1 хвилина)",
    kroky: [
      "Відкрий головну сторінку (книжки «Казки»)",
      "Введи імʼя дитини — або натисни 🎙 і скажи голосом",
      "Обери героя — квадратик з емодзі (Котик, Дракончик, Робот…)",
      "Додай тему або повчальний урок — «чому мити руки»",
      "Натисни «Створити казку» — через ~10 секунд казка зʼявиться праворуч",
      "Безкоштовно: 3 казки. Далі — Pro за $4.99",
    ],
  },
  {
    zag: "2. Запустити у себе на компʼютері (5 хвилин)",
    kroky: [
      "Потрібен Node.js 20+ (перевір: node -v) і git",
      "git clone https://github.com/olenaklocko-cyber/kazka-na-nich.git",
      "npm ci — встановити залежності (~1 хв)",
      "cp .env.example .env — і впиши свої ключі (LLM_API_KEY, PRO_SECRET, LIQPAY_*)",
      "npm run dev — відкрий http://localhost:5173",
    ],
  },
  {
    zag: "3. Однією командою у Docker (2 хвилини)",
    kroky: [
      "Встанови Docker Desktop (docker.com/products/docker-desktop)",
      "git clone https://github.com/olenaklocko-cyber/kazka-na-nich.git && cd kazka-na-nich",
      "cp .env.example .env — впиши ключі",
      "docker compose up --build — чекай першої збірки ~2 хв",
      "Відкрий http://localhost:3002 — готово",
    ],
  },
];

const VERSII: {
  versiia: string;
  data: string;
  tyzhden: string;
  zminy: string[];
}[] = [
  {
    versiia: "1.0.0",
    data: "19.10.2026",
    tyzhden: "Тиждень 7 — Документація та підтримка",
    zminy: [
      "Вкладка «📖 Підтримка»: живий статус API 🟢/🔴, гайд, форма звернень",
      "README, ГАЙД «за 5 хвилин», CHANGELOG, LICENSE (MIT)",
      "Шаблони GitHub Issues (баг / ідея / питання)",
    ],
  },
  {
    versiia: "0.9.0",
    data: "19.10.2026",
    tyzhden: "Тиждень 6 — Інфраструктура та хмара",
    zminy: [
      "Docker: запуск однією командою docker compose up --build",
      ".env.example, .dockerignore; dev/stage/prod",
      "Вкладка «⚙️ Інфраструктура»; сервер віддає dist/ + SPA-фолбек",
    ],
  },
  {
    versiia: "0.8.0",
    data: "19.10.2026",
    tyzhden: "Тиждень 5 — Open Source",
    zminy: [
      "Внесок у free-programming-books (PR #13549): невидима латинська H → кирилична Н",
      "Вкладка «🌍 Open Source» з інтерактивним демо",
    ],
  },
  {
    versiia: "0.7.0",
    data: "19.10.2026",
    tyzhden: "Тиждень 4 — Аналітика",
    zminy: [
      "Воронка, A/B-тест кнопки, відгуки → задачі",
      "13 типів подій, /api/analytics, вкладка «📈 Аналітика»",
    ],
  },
  {
    versiia: "0.6.0",
    data: "19.10.2026",
    tyzhden: "Тиждень 3 — Оплата",
    zminy: [
      "LiqPay checkout (sandbox), Pro-токени HMAC-SHA256, ліміт 3 казки",
      "План Б: підтвердження оплати за order_id через API статусу LiqPay",
    ],
  },
  {
    versiia: "0.5.0",
    data: "19.10.2026",
    tyzhden: "Тиждень 2 — Якість",
    zminy: [
      "Ревʼю доступності: AA-контраст, role=status, color-scheme",
      "Озвучення казок, голосове введення, квадратики-герої",
    ],
  },
  {
    versiia: "0.4.0",
    data: "18.10.2026",
    tyzhden: "Тиждень 1 — Перший реліз",
    zminy: ["«Казка на ніч»: Vite + React + TS, dev-сервер + Vercel serverless"],
  },
];

const ARHITEKTURA: { shar: string; tech: string; de: string }[] = [
  { shar: "Фронтенд", tech: "React 19 + Vite + TypeScript", de: "src/" },
  { shar: "Dev/Docker-сервер", tech: "Node (tsx), один файл", de: "server/server.ts" },
  { shar: "Прод-API", tech: "Vercel Serverless Functions", de: "api/*.ts" },
  { shar: "Спільна логіка", tech: "чистий TypeScript", de: "shared/pro.ts" },
  { shar: "Хмара", tech: "Vercel", de: "kazka-na-nich.vercel.app" },
  { shar: "Контейнер", tech: "Docker (Alpine, 2 етапи)", de: "Dockerfile" },
];

const SEKRETY: { nazva: string; prys: string; opys: string }[] = [
  { nazva: "LLM_API_KEY", prys: "🔒", opys: "Ключ Google Gemini — генерація тексту казок" },
  { nazva: "PRO_SECRET", prys: "🔒", opys: "Підпис Pro-токенів" },
  { nazva: "LIQPAY_PUBLIC_KEY", prys: "🌐", opys: "Публічний ключ каси LiqPay" },
  { nazva: "LIQPAY_PRIVATE_KEY", prys: "🔒", opys: "Підпис запитів до LiqPay" },
  { nazva: "APP_URL", prys: "⚙️", opys: "Куди LiqPay повертати після оплати" },
  { nazva: "SERVER_PORT", prys: "⚙️", opys: "Порт локального/Docker-сервера (3002)" },
];

export default function Dokumentatsiya() {
  const [rozdil, setRozdil] = useState<Rozdil>("haid");

  return (
    <main className="zvit">
      <header className="zvit-shapka">
        <h2>📚 Документація продукту</h2>
      </header>

      <p className="zvit-pidkazka">
        Тиждень 7: уся документація — гайд, що змінювалося, архітектура — живе
        <strong> всередині проєкту</strong>. Куратор відкрив вкладку — і все бачить.
      </p>

      <nav className="pidtrymka-typy" aria-label="Розділи документації">
        <button
          type="button"
          className="knopka knopka-mala knopka-vkladka"
          aria-pressed={rozdil === "haid"}
          onClick={() => setRozdil("haid")}
        >
          🚀 Гайд «за 5 хвилин»
        </button>
        <button
          type="button"
          className="knopka knopka-mala knopka-vkladka"
          aria-pressed={rozdil === "changelog"}
          onClick={() => setRozdil("changelog")}
        >
          📝 Що змінювалось
        </button>
        <button
          type="button"
          className="knopka knopka-mala knopka-vkladka"
          aria-pressed={rozdil === "pro"}
          onClick={() => setRozdil("pro")}
        >
          🧭 Про проєкт
        </button>
      </nav>

      {rozdil === "haid" && (
        <>
          {KROKY_HAID.map((blok) => (
            <section key={blok.zag} className="zvit-sektsiia sklo" aria-labelledby={blok.zag}>
              <h3 id={blok.zag}>{blok.zag}</h3>
              <ol className="podii-spysok infra-spysok">
                {blok.kroky.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ol>
            </section>
          ))}
          <p className="zvit-visnovok">
            <strong>Далі:</strong> статус сервісів і кнопка звернення — у вкладці
            «📖 Підтримка». Тестова оплата: картка 4242 4242 4242 4242, 12/30.
          </p>
        </>
      )}

      {rozdil === "changelog" && (
        <>
          {VERSII.map((v) => (
            <section
              key={v.versiia}
              className="zvit-sektsiia sklo"
              aria-labelledby={`v-${v.versiia}`}
            >
              <h3 id={`v-${v.versiia}`}>
                {v.versiia} — {v.tyzhden}
              </h3>
              <p className="zvit-pidkazka">{v.data}</p>
              <ul className="podii-spysok infra-spysok">
                {v.zminy.map((z) => (
                  <li key={z}>{z}</li>
                ))}
              </ul>
            </section>
          ))}
          <p className="zvit-visnovok">
            Повна версія changelog — у файлі CHANGELOG.md репозиторію (формат Keep
            a Changelog).
          </p>
        </>
      )}

      {rozdil === "pro" && (
        <>
          <section className="zvit-sektsiia sklo" aria-labelledby="shvylyj-start">
            <h3 id="shvylyj-start">⚡ Швидкий старт</h3>
            <ul className="podii-spysok infra-spysok">
              <li>
                <strong>Просто користуватися:</strong> цей сайт → вкладка «Казки»
              </li>
              <li>
                <strong>Локально:</strong> git clone → npm ci → npm run dev →
                localhost:5173
              </li>
              <li>
                <strong>Однією командою:</strong> docker compose up --build →
                localhost:3002
              </li>
            </ul>
          </section>

          <section className="zvit-sektsiia sklo" aria-labelledby="arh">
            <h3 id="arh">🏗 Архітектура</h3>
            <table className="ab-tablitsya">
              <caption className="sr-only">Шари архітектури</caption>
              <thead>
                <tr>
                  <th scope="col">Шар</th>
                  <th scope="col">Технологія</th>
                  <th scope="col">Де живе</th>
                </tr>
              </thead>
              <tbody>
                {ARHITEKTURA.map((a) => (
                  <tr key={a.shar}>
                    <th scope="row">{a.shar}</th>
                    <td>{a.tech}</td>
                    <td>
                      <code>{a.de}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="zvit-visnovok">
              Той самий код API працює в трьох місцях: локально, у Docker і на
              Vercel — через shared/pro.ts.
            </p>
          </section>

          <section className="zvit-sektsiia sklo" aria-labelledby="sek">
            <h3 id="sek">🔐 Секрети (лише назви — значень тут немає і не буде)</h3>
            <table className="ab-tablitsya">
              <caption className="sr-only">Змінні середовища</caption>
              <thead>
                <tr>
                  <th scope="col">Змінна</th>
                  <th scope="col">Тип</th>
                  <th scope="col">Навіщо</th>
                </tr>
              </thead>
              <tbody>
                {SEKRETY.map((s) => (
                  <tr key={s.nazva}>
                    <th scope="row">
                      <code>{s.nazva}</code>
                    </th>
                    <td>{s.prys === "🔒" ? "🔒 секрет" : "🌐/⚙️ відкритий"}</td>
                    <td>{s.opys}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p className="zvit-visnovok">
            Код: github.com/olenaklocko-cyber/kazka-na-nich · Ліцензія MIT ·
            Оплата виводиться LiqPay (sandbox) · Версія 1.0.0
          </p>
        </>
      )}
    </main>
  );
}
