const KOMANDA = "docker compose up --build";

const ZMINNI: { nazva: string; prys: string; opys: string }[] = [
  { nazva: "LLM_API_KEY", prys: "секрет", opys: "Ключ Google Gemini — генерує текст казок. Лише на сервері." },
  { nazva: "PRO_SECRET", prys: "секрет", opys: "Підписує Pro-токени, щоб ніхто не «активував» Pro без оплати." },
  { nazva: "LIQPAY_PUBLIC_KEY", prys: "відкритий", opys: "Публічний ключ каси LiqPay (видно у формі оплати — це нормально)." },
  { nazva: "LIQPAY_PRIVATE_KEY", prys: "секрет", opys: "Приватний ключ LiqPay. Ніколи не потрапляє у фронтенд і у git." },
  { nazva: "APP_URL", prys: "конфіг", opys: "Куди LiqPay повертати після оплати (прод: https://kazka-na-nich.vercel.app)." },
  { nazva: "SERVER_PORT", prys: "конфіг", opys: "Порт Docker/локального сервера (за замовчуванням 3002)." },
];

const SEREDOVYSHCHA: { nazva: string; deZhyve: string; liqPay: string; sekrety: string }[] = [
  {
    nazva: "dev",
    deZhyve: "Твій комп'ютер: npm run dev → http://localhost:5173",
    liqPay: "sandbox (тестова картка 4242…)",
    sekrety: "файл .env у корені (у git не потрапляє)",
  },
  {
    nazva: "stage",
    deZhyve: "Vercel Preview — автоматичний деплой кожної гілки GitHub",
    liqPay: "sandbox",
    sekrety: "Vercel: окремі змінні для Preview",
  },
  {
    nazva: "prod",
    deZhyve: "https://kazka-na-nich.vercel.app (Vercel) або Docker на будь-якому сервері",
    liqPay: "sandbox → реальні ключі перед запуском",
    sekrety: "Vercel: encrypted Environment Variables (лише виробництво)",
  },
];

export default function Infrastruktura() {
  return (
    <main className="zvit">
      <header className="zvit-shapka">
        <h2>⚙️ Інфраструктура та хмара</h2>
      </header>

      <p className="zvit-pidkazka">
        Тиждень 6: продукт має підніматися <strong>однією командою</strong> на
        будь-якій чистій машині — і мати розділені середовища dev / stage / prod з
        безпечними секретами.
      </p>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-komanda">
        <h3 id="zag-komanda">🚀 Одна команда — і продукт живий</h3>
        <p className="zvit-pidkazka">
          У коробці (Docker-образі) вже лежить Node.js, зібраний сайт і сервер із
          API. Витягуєш репозиторій на чисту машину, маєш Docker — і:
        </p>
        <pre className="os-slovo infra-komanda">
          <code>{KOMANDA}</code>
        </pre>
        <p className="zvit-pidkazka">
          Далі відкриваєш <strong>http://localhost:3002</strong> — і застосунок
          працює: генерація казок, ліміт, оплата LiqPay, аналітика. Без Docker
          (лише Node 20+): <code>npm ci &amp;&amp; npm run build &amp;&amp; npm start</code>.
        </p>
        <p className="zvit-visnovok">
          <strong>Що всередині коробки:</strong> багатоетапний Dockerfile —
          етап «builder» збирає фронтенд (Vite), етап «runner» — легкий Alpine-образ
          лише з потрібним (сервер + зібрані файли). Секрети НЕ запікаються в образ —
          вони підключаються ззовні (env_file / змінні).
        </p>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-sered">
        <h3 id="zag-sered">🧩 Навіщо середовища dev / stage / prod</h3>
        <ul className="podii-spysok infra-spysok">
          {SEREDOVYSHCHA.map((s) => (
            <li key={s.nazva} className="infra-seredovyshche">
              <strong className="infra-nazva">{s.nazva}</strong>
              <span>Де живе: {s.deZhyve}</span>
              <span>LiqPay: {s.liqPay}</span>
              <span>Секрети: {s.sekrety}</span>
            </li>
          ))}
        </ul>
        <p className="zvit-visnovok">
          Завдяки розділенню: експерименти в dev не ламають реальних клієнтів, а
          секрети prod ніколи не «зʼїжджають» у тестове середовище.
        </p>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-sekrety">
        <h3 id="zag-sekrety">🔐 Секрети: як зберігати</h3>
        <ul className="podii-spysok infra-spysok">
          <li>
            <code>.env</code> — локально у тебе; у <code>.gitignore</code>; шаблон{" "}
            <code>.env.example</code> у репозиторії (лише назви, без значень).
          </li>
          <li>
            Vercel → Settings → Environment Variables: значення шифруються, доступні
            лише серверним функціям — фронтенд їх ніколи не бачить.
          </li>
          <li>
            Docker отримує змінні ззовні (<code>env_file: .env</code>) — у самому
            образі секретів немає й не може бути.
          </li>
        </ul>
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
            {ZMINNI.map((z) => (
              <tr key={z.nazva}>
                <th scope="row">
                  <code>{z.nazva}</code>
                </th>
                <td>{z.prys === "секрет" ? "🔒 секрет" : "🌐 відкритий/конфіг"}</td>
                <td>{z.opys}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-domen">
        <h3 id="zag-domen">🌐 Домен</h3>
        <p className="zvit-pidkazka">
          Зараз продукт живе на власному піддомені Vercel:{" "}
          <strong>kazka-na-nich.vercel.app</strong> (SSL-сертифікат автоматичний).
        </p>
        <p className="zvit-visnovok">
          <strong>Свій домен (наприклад kazka.com.ua):</strong> 1) купити домен;
          2) у Vercel → Project → Settings → Domains → «Add»; 3) у реєстратора
          домену вказати CNAME на <code>cname.vercel-dns.com</code> (або A-запис
          на 76.76.21.21); 4) зачекати перевірки — Vercel сам випустить
          безкоштовний SSL. Бюджетний варіант без купівлі: free-піддомен
          (напр. duckdns.org) — той самий крок CNAME.
        </p>
      </section>
    </main>
  );
}
