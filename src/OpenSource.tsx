import { useState } from "react";

const PR_POSYLANNIA = "https://github.com/EbookFoundation/free-programming-books/pull/13549";
const REPO = "EbookFoundation/free-programming-books";

const KROKY = [
  {
    krok: "Пошук",
    opys: "Знайшла дружній проєкт з розділом українською і прочитала його CONTRIBUTING.md — правила прямо дозволяють дрібні правки опечаток.",
  },
  {
    krok: "Fork",
    opys: "Створила свою копію репозиторію: github.com/olenaklocko-cyber/free-programming-books. Оригінал (upstream) не змінюється без рев'ю.",
  },
  {
    krok: "Гілка + коміт",
    opys: "Гілка fix/uk-latin-h-novachok з одним символом: латинська H → кирилична Н.",
  },
  {
    krok: "Pull Request",
    opys: "Чемний опис англійською: що не так, чому це шкодить читачам, чекліст правил. Мейнтейнери дивляться, CI перевіряє.",
  },
];

export default function OpenSource() {
  const [latynska, setLatynska] = useState(true);

  const symvol = latynska ? "H" : "Н";
  const kod = latynska ? "U+0048 (латиниця)" : "U+041D (кирилиця)";

  return (
    <main className="zvit">
      <header className="zvit-shapka">
        <h2>🌍 Мій внесок у Open Source</h2>
        <a className="knopka knopka-mala" href={PR_POSYLANNIA} target="_blank" rel="noreferrer">
          Відкрити PR ↗
        </a>
      </header>

      <p className="zvit-pidkazka">
        Тиждень 5: участь у справжньому спільнотному проєкті — не лише у своєму. Проєкт{" "}
        <strong>{REPO}</strong> (350 000+ зірок) збирає безкоштовні книжки та курси
        програмування багатьма мовами, зокрема українською.
      </p>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-pr">
        <h3 id="zag-pr">Що виправлено: невидима літера</h3>
        <p className="zvit-pidkazka">
          У списку українських курсів слово «Новачок» було написане з латинською
          літерою H — вона виглядає точно так само, як українська Н, але ламає
          пошук, копіювання та скрінрідери. Натисни — і подивись різницю:
        </p>
        <div className="os-demo">
          <button
            type="button"
            className="knopka knopka-mala"
            aria-pressed={latynska}
            onClick={() => setLatynska((v) => !v)}
          >
            {latynska ? "Показати правильну Н" : "Показати латинську H"}
          </button>
          <p className="os-slovo" role="status">
            BEG — {symvol}овачок. Основи.
          </p>
          <p className="os-kod">{kod}</p>
        </div>
        <p className="zvit-visnovok">
          <strong>Мій PR:</strong>{" "}
          <a href={PR_POSYLANNIA} target="_blank" rel="noreferrer">
            pull/13549
          </a>{" "}
          — один символ, один файл, нічого зайвого. Мейнтейнери можуть відповісти
          за кілька днів; якщо поправлять — оновимо разом.
        </p>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-yak">
        <h3 id="zag-yak">Як влаштований внесок (fork → PR → upstream)</h3>
        <ol className="os-kroky">
          {KROKY.map((k) => (
            <li key={k.krok}>
              <strong>{k.krok}</strong> — {k.opys}
            </li>
          ))}
        </ol>
        <p className="zvit-visnovok">
          <strong>Ліцензія:</strong> вміст проєкту — CC-BY-SA 2.5 (вільно
          використовувати з зазначенням авторства), код скриптів — MIT. Тому мій
          внесок автоматично стає частиною вільного ресурсу для всіх.
        </p>
      </section>
    </main>
  );
}
