import { useEffect, useMemo, useState } from "react";
import { podie, vsePodii, vsiVidhuky } from "./lib/analytyka";

const KLYUCH_CHEKLIST = "kazka_cheklist_start";

interface BlokCheklistu {
  nazva: string;
  emodzi: string;
  punkty: { id: string; tekst: string }[];
}

const CHEKLIST: BlokCheklistu[] = [
  {
    nazva: "Продукт",
    emodzi: "🌙",
    punkty: [
      { id: "kazka", tekst: "Казка генерується за ~10 секунд (імʼя + герой + урок)" },
      { id: "limit", tekst: "Ліміт 3 безкоштовні казки працює, Pro за $4.99 активується" },
      { id: "mova", tekst: "12 мов, голосове введення, озвучення" },
    ],
  },
  {
    nazva: "Якість і довіра",
    emodzi: "🔍",
    punkty: [
      { id: "a11y", tekst: "Доступність: контраст AA, role=status, фокус" },
      { id: "testoplata", tekst: "Оплата тестована в sandbox (картка 4242…)" },
      { id: "povernennia", tekst: "Повернення з каси без підпису рятує план Б (order_id)" },
    ],
  },
  {
    nazva: "Інфраструктура",
    emodzi: "⚙️",
    punkty: [
      { id: "prod", tekst: "Прод живий: kazka-na-nich.vercel.app відповідає" },
      { id: "status", tekst: "Вкладка «Підтримка» показує 🟢 статус API" },
      { id: "docker", tekst: "Docker: docker compose up --build піднімає з нуля" },
      { id: "sekrety", tekst: "Секрети лише в .env / Vercel env — у git їх немає" },
    ],
  },
  {
    nazva: "Документація",
    emodzi: "📚",
    punkty: [
      { id: "docs", tekst: "Вкладка «Документація»: гайд, changelog, архітектура" },
      { id: "readme", tekst: "README + ГАЙД у репозиторії для GitHub" },
      { id: "issues", tekst: "Шаблони звернень налаштовані (баг/ідея/питання)" },
    ],
  },
  {
    nazva: "Перед демо-днем",
    emodzi: "🎤",
    punkty: [
      { id: "link", tekst: "Живе посилання перевірене в приватному вікні" },
      { id: "story", tekst: "Розповідь 3 хв: проблема → рішення → демо → цифри (нижче)" },
      { id: "post", tekst: "Пост-анонс скопійовано і надіслано першим користувачам" },
      { id: "feedback", tekst: "Зібрані відгуки розібрані → задачі (вкладка Аналітика)" },
    ],
  },
];

const POST = `🌙 Казка на ніч — запускаю!

Проблема: батькам щовечора складно вигадувати нову казку — знайомі хочуть саме «про мою дитину», а готових текстів в інтернеті сотні й усі однакові.

Рішення: AI-генератор унікальних дитячих казок за 10 секунд — з імʼям твоєї дитини, її улюбленим героєм (котик, дракончик, робот…) і повчальним уроком. 12 мов, озвучення, 3 безкоштовні казки, Pro — $4.99.

🔗 Спробувати: https://kazka-na-nich.vercel.app

Зроблено за 7 тижнів курсу: від першої HTML-сторінки до продукту з оплатою LiqPay, аналітикою, Docker-запуском і внеском у open-source. Пишіть, що подобається і що дратує — зберу відгуки і покращу 🙌

#казкананіч #ai #ukraine #product`;

export default function Zapusk() {
  const [zrobleno, setZrobleno] = useState<string[]>(() => {
    try {
      const syra = localStorage.getItem(KLYUCH_CHEKLIST);
      const d = syra ? JSON.parse(syra) : [];
      return Array.isArray(d) ? (d as string[]) : [];
    } catch {
      return [];
    }
  });
  const [skopijovano, setSkopijovano] = useState(false);
  const [podii] = useState(() => vsePodii());
  const vidhuky = useMemo(() => vsiVidhuky(), []);

  useEffect(() => {
    localStorage.setItem(KLYUCH_CHEKLIST, JSON.stringify(zrobleno));
  }, [zrobleno]);

  const variaty = podii.find((p) => p.nazva === "storinka")?.parametry?.variant;

  const cyfry = useMemo(() => {
    const rahunok = (nazva: string) => podii.filter((p) => p.nazva === nazva).length;
    return {
      kazky: rahunok("kazka_uspikh"),
      starty: rahunok("kazka_start"),
      pomylky: rahunok("kazka_pomylka"),
      oplaty: rahunok("oplata_pidtverdzhena") + rahunok("demo_pidtverdzheno"),
      vidhukyPlus: vidhuky.filter((v) => v.otsinka === "plus").length,
      vidhukyMinus: vidhuky.filter((v) => v.otsinka === "minus").length,
      mikrofon: rahunok("mikrofon"),
    };
  }, [podii, vidhuky]);

  const vsiId = CHEKLIST.flatMap((b) => b.punkty.map((p) => p.id));
  const chasto = Math.round((zrobleno.length / vsiId.length) * 100);

  const peremknuty = (id: string) => {
    setZrobleno((stare) => (stare.includes(id) ? stare.filter((x) => x !== id) : [...stare, id]));
    if (!zrobleno.includes(id)) podie("cheklist_start_punkt", { id });
  };

  const skopiyuvatyPost = async () => {
    try {
      await navigator.clipboard.writeText(POST);
      setSkopijovano(true);
      podie("post_skopijovano");
      setTimeout(() => setSkopijovano(false), 2500);
    } catch {
      /* браузер заборонив — користувач скопіює вручну з поля */
    }
  };

  return (
    <main className="zvit">
      <header className="zvit-shapka">
        <h2>🏆 Запуск продукту</h2>
      </header>

      <p className="zvit-pidkazka">
        Тиждень 8 — випускний: чек-лист запуску, готова презентація і пост-анонс.
        Усе тут: від першого пункту до демо-дня.
      </p>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-cheklist">
        <h3 id="zag-cheklist">✅ Чек-лист запуску</h3>
        <p className="zvit-pidkazka">
          <strong>
            {zrobleno.length} з {vsiId.length} ✓ ({chasto}%)
          </strong>{" "}
          — позначки зберігаються у браузері, можна закривати вкладку.
        </p>
        <div className="voronka-bary" aria-hidden="true" style={{ marginBottom: 12 }}>
          <div className="voronka-bara" style={{ width: `${chasto}%` }} />
        </div>
        {CHEKLIST.map((b) => (
          <div key={b.nazva} className="pidtrymka-status" style={{ marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <strong>
                {b.emodzi} {b.nazva}
              </strong>
              <ul className="podii-spysok infra-spysok" style={{ marginTop: 6 }}>
                {b.punkty.map((p) => (
                  <li key={p.id}>
                    <label className="zapusk-punkt">
                      <input
                        type="checkbox"
                        checked={zrobleno.includes(p.id)}
                        onChange={() => peremknuty(p.id)}
                      />
                      <span>{p.tekst}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-pitch">
        <h3 id="zag-pitch">🎤 Презентація: проблема → рішення → демо → цифри</h3>
        <div className="zapusk-pitch">
          <h4>❌ Проблема</h4>
          <p>
            Батьки щовечора вигадують казку для дитини. Готові тексти в інтернеті —
            шаблонні, не «про мою Мілану». Свої — забирають 20 хвилин після
            важкого дня.
          </p>
          <h4>✅ Рішення</h4>
          <p>
            «Казка на ніч» — AI-генератор: імʼя дитини + улюблений герой + урок →
            унікальна казка за 10 секунд. 12 мов, озвучення, голосове введення.
            3 безкоштовні, Pro за $4.99 (LiqPay).
          </p>
          <h4>🎬 Демо (2 хв)</h4>
          <p>
            1) Головна → імʼя «Мілана», герой «Дракончик», урок «не боятися
            темряви» → «Створити казку». 2) Показати озвучення. 3) Ліміт → кнопка
            Pro → каса LiqPay (тестова картка). 4) Швидко: вкладки Аналітика
            (воронка), Open Source (PR у 350k-проєкт), Підтримка (статус 🟢).
          </p>
          <h4>📊 Цифри</h4>
          <p>
            7 тижнів розробки · 6 вкладок · 12 мов · 13 типів подій аналітики ·
            PR у free-programming-books (350 000 зірок) · запуск однією
            командою Docker · оплата LiqPay з планом Б відновлення.
          </p>
        </div>
        <p className="zvit-visnovok">
          <strong>Фраза для завершення:</strong> «Я пройшла шлях від першої
          HTML-сторінки до продукту з оплатою, аналітикою, документацією та
          інфраструктурою — і цей продукт уже живий за цим посиланням».
        </p>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-cyfry">
        <h3 id="zag-cyfry">📈 Цифри з цього браузера (живі)</h3>
        <p className="zvit-pidkazka">
          Скільки реально зроблено тут: казок згенеровано, оплат, відгуків.
        </p>
        <table className="ab-tablitsya">
          <caption className="sr-only">Живі метрики браузера</caption>
          <thead>
            <tr>
              <th scope="col">Метрика</th>
              <th scope="col">Значення</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Успішних казок</th>
              <td>{cyfry.kazky}</td>
            </tr>
            <tr>
              <th scope="row">Спроб створити (з помилками)</th>
              <td>{cyfry.starty}</td>
            </tr>
            <tr>
              <th scope="row">Підтверджених оплат (з демо)</th>
              <td>{cyfry.oplaty}</td>
            </tr>
            <tr>
              <th scope="row">Відгуки 👍 / 👎</th>
              <td>
                {cyfry.vidhukyPlus} / {cyfry.vidhukyMinus}
              </td>
            </tr>
            <tr>
              <th scope="row">Голосових введень</th>
              <td>{cyfry.mikrofon}</td>
            </tr>
            <tr>
              <th scope="row">A/B-варіант кнопки</th>
              <td>{variaty ? String(variaty) : "—"}</td>
            </tr>
          </tbody>
        </table>
        {vidhuky.length > 0 && (
          <div className="pidtrymka-istoriya">
            <h4>Останні відгуки (перші користувачі → задачі)</h4>
            <ul className="podii-spysok">
              {vidhuky
                .slice()
                .reverse()
                .slice(0, 5)
                .map((v) => (
                  <li key={v.chas}>
                    {v.otsinka === "plus" ? "👍" : "👎"} {v.tekst.slice(0, 100) || "(без тексту)"}{" "}
                    <span className="zvit-pidkazka">
                      — {new Date(v.chas).toLocaleString("uk-UA")}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-post">
        <h3 id="zag-post">📢 Пост-анонс (готовий текст)</h3>
        <p className="zvit-pidkazka">
          Для Telegram / Instagram / LinkedIn. Скопіюй і надішли першим
          користувачам.
        </p>
        <textarea
          className="pole-tekst"
          rows={10}
          readOnly
          value={POST}
          aria-label="Текст поста-анонсу"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button type="button" className="knopka" onClick={() => void skopiyuvatyPost()}>
          {skopijovano ? "✅ Скопійовано!" : "📋 Скопіювати пост"}
        </button>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-demo">
        <h3 id="zag-demo">🎪 Демо-день: сценарій</h3>
        <ol className="podii-spysok infra-spysok">
          <li>
            <strong>Живе посилання</strong> — https://kazka-na-nich.vercel.app у
            приватному вікні (перевір статус 🟢 у «Підтримці»).
          </li>
          <li>
            <strong>Розповідь 3 хв</strong> — проблема → рішення → демо → цифри
            (блок вище, слово в слово можна).
          </li>
          <li>
            <strong>Дайте покрутити</strong> — гості самі створюють казку (3
            безкоштовні; для оплати — тестова картка 4242 4242 4242 4242, 12/30).
          </li>
          <li>
            <strong>Збір відгуків</strong> — кнопка «💬 Відгук» на сайті або вкладка
            «Підтримка» → «Створити звернення»; далі — розбір у вкладці
            «Аналітика».
          </li>
        </ol>
      </section>

      <p className="zvit-visnovok">
        <strong>Ти пройшла шлях:</strong> HTML-сторінка → React-продукт → оплата →
        аналітика → open source → Docker → документація → запуск. Це і є повний
        цикл створення продукту. Вітаю з випускним! 🏆🌙
      </p>
    </main>
  );
}
