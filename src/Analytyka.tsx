import { useEffect, useMemo, useState } from "react";
import {
  dopovnytyDemoPodii,
  ochystytyPodii,
  variantAB,
  vsePodii,
  vsiVidhuky,
  vzatyVidhukDoRoboty,
  type Vidhuk,
} from "./lib/analytyka";

const KROKY_VORONKY: { nazva: string; podiya: string }[] = [
  { nazva: "Зайшли на сторінку", podiya: "storinka" },
  { nazva: "Почали заповнювати форму", podiya: "form_start" },
  { nazva: "Створили казку", podiya: "kazka_uspikh" },
  { nazva: "Відкрили оплату", podiya: "oproplata_vidkryto" },
  { nazva: "Оплатили (Pro)", podiya: "pro_uspikh" },
];

function formatChas(chas: number): string {
  return new Date(chas).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Analytyka({ onNyazh }: { onNyazh: () => void }) {
  const [pidtverdzhennia, setPidtverdzhennia] = useState(false);
  const [vitalist, setVitalist] = useState(0);

  useEffect(() => {
    if (!pidtverdzhennia) return;
    const t = window.setTimeout(() => setPidtverdzhennia(false), 4000);
    return () => window.clearTimeout(t);
  }, [pidtverdzhennia]);

  /** Швидкий демо-показ: #analytyka-demo одразу наповнює воронку. */
  useEffect(() => {
    if (window.location.hash === "#analytyka-demo") dopovnytyDemoPodii();
    setVitalist((v) => v + 1);
  }, []);

  const podii = useMemo(() => vsePodii(), [vitalist]);
  const vidhuky = useMemo(() => vsiVidhuky(), [vitalist]);

  const skilky = (nazva: string) => podii.filter((p) => p.nazva === nazva).length;
  const pidstanky = useMemo(
    () => KROKY_VORONKY.map((k) => ({ ...k, kilkist: skilky(k.podiya) })),
    [podii],
  );
  const vkhid = Math.max(pidstanky[0]?.kilkist ?? 0, 1);

  const abVarianty = (["A", "B"] as const).map((v) => {
    const zaidyly = podii.filter((p) => p.nazva === "storinka" && p.parametry?.variant === v).length;
    const natushnuli = podii.filter(
      (p) => p.nazva === "kazka_start" && p.parametry?.variant === v,
    ).length;
    const konversiia = zaidyly > 0 ? Math.round((natushnuli / zaidyly) * 100) : 0;
    return { variant: v, zaidyly, natushnuli, konversiia };
  });

  const pryjnyatyDoRoboty = (v: Vidhuk) => {
    vzatyVidhukDoRoboty(v.chas);
    void navigator.clipboard
      .writeText(`- [ ] Фікс за зворотним зв'язком (${formatChas(v.chas)}): ${v.tekst || (v.otsinka === "plus" ? "Похвала — підтримати" : "Скарга — розібратися")}`)
      .then(() => setPidtverdzhennia(true))
      .catch(() => setPidtverdzhennia(true));
  };

  return (
    <main className="zvit">
      <header className="zvit-shapka">
        <h2>📈 Аналітика продукту</h2>
        <div className="zvit-knopky">
          <button
            type="button"
            className="knopka knopka-mala"
            onClick={() => {
              dopovnytyDemoPodii();
              setVitalist((v) => v + 1);
            }}
          >
            🧪 Демо-події
          </button>
        </div>
      </header>

      <p className="zvit-pidkazka">
        Дані — події цього браузера (демо-збір). Кожна подія також надсилається на
        сервер <code>/api/analytics</code>. A/B-варіант випадковий і зберігається
        назавжди: зараз твій варіант — <strong>{variantAB()}</strong>.
      </p>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-voronka">
        <h3 id="zag-voronka">Воронка: від заходу до оплати</h3>
        <ol className="voronka">
          {pidstanky.map((k, i) => {
            const vidsotok = Math.round((k.kilkist / vkhid) * 100);
            const vidstannya =
              i > 0 ? Math.max(vkhid, 1) - (pidstanky[i - 1]?.kilkist ?? 0) : 0;
            return (
              <li key={k.podiya} className="voronka-krok">
                <div className="voronka-ryadok">
                  <span className="voronka-nazva">{k.nazva}</span>
                  <span className="voronka-chysla">
                    {k.kilkist} ({vidsotok}%)
                  </span>
                </div>
                <div className="voronka-dyuzhyna" aria-hidden="true">
                  <div className="voronka-zapovnennia" style={{ width: `${vidsotok}%` }} />
                </div>
                {i > 0 && vidstannya > 0 && (
                  <p className="voronka-vtrata">↓ втрачено {vidstannya} на цьому кроці</p>
                )}
              </li>
            );
          })}
        </ol>
        <p className="zvit-visnovok">
          <strong>Де більше все губиться:</strong>{" "}
          {(() => {
            let naykrashche = 0;
            let maximalnaVtrata = -1;
            for (let i = 1; i < pidstanky.length; i++) {
              const vtrata =
                (pidstanky[i - 1]?.kilkist ?? 0) - (pidstanky[i]?.kilkist ?? 0);
              if (vtrata > maximalnaVtrata) {
                maximalnaVtrata = vtrata;
                naykrashche = i;
              }
            }
            return maximalnaVtrata > 0
              ? `крок «${pidstanky[naykrashche]?.nazva}» (−${maximalnaVtrata}). Моя ідея фіксу: зробити наступний крок очевиднішим — велика кнопка під результатом і нагадування про ліміт безкоштовних казок.`
              : "поки що немає виразних втрат — збери більше подій.";
          })()}
        </p>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-ab">
        <h3 id="zag-ab">A/B-тест: текст кнопки «Створити казку»</h3>
        <p className="zvit-pidkazka">
          Гіпотеза: кнопка з вигодою («Безкоштовна казка за 10 секунд») частіше
          натискається, ніж нейтральна («Створити казку»). Метрика: % від заходів,
          хто натиснув.
        </p>
        <table className="ab-tablitsya">
          <caption className="sr-only">Результати A/B-тесту</caption>
          <thead>
            <tr>
              <th scope="col">Варіант</th>
              <th scope="col">Заходили</th>
              <th scope="col">Натиснули «Створити»</th>
              <th scope="col">Конверсія</th>
            </tr>
          </thead>
          <tbody>
            {abVarianty.map((v) => (
              <tr key={v.variant}>
                <th scope="row">
                  {v.variant === "A" ? "A: «✨ Створити казку»" : "B: «🌙 Казка за 10 секунд»"}
                  {v.variant === variantAB() ? " (твій)" : ""}
                </th>
                <td>{v.zaidyly}</td>
                <td>{v.natushnuli}</td>
                <td>{v.konversiia}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-zvaz">
        <h3 id="zag-zvaz">💬 Зворотний зв'язок → задачі</h3>
        {vidhuky.length === 0 ? (
          <p className="zvit-pidkazka">
            Поки відгуків немає. У застосунку натисни «💬» у шапці — і твоя оцінка
            з'явиться тут.
          </p>
        ) : (
          <ul className="vidhuky-spysok">
            {vidhuky
              .slice()
              .reverse()
              .map((v) => (
                <li key={v.chas} className="vidhuk">
                  <span aria-hidden="true">{v.otsinka === "plus" ? "👍" : "👎"}</span>
                  <div>
                    <p className="vidhuk-tekst">{v.tekst || "(без коментаря)"}</p>
                    <p className="vidhuk-chas">{formatChas(v.chas)}</p>
                  </div>
                  {v.vzyatoDoRoboty ? (
                    <span className="vidhuk-status">у задачах ✓</span>
                  ) : (
                    <button type="button" className="knopka knopka-mala" onClick={() => pryjnyatyDoRoboty(v)}>
                      → В задачу
                    </button>
                  )}
                </li>
              ))}
          </ul>
        )}
        {pidtverdzhennia && (
          <p className="zvit-pidtverdzhennia" role="status">
            Задачу скопійовано в буфер обміну ✓
          </p>
        )}
      </section>

      <section className="zvit-sektsiia sklo" aria-labelledby="zag-podii">
        <h3 id="zag-podii">Всі події ({podii.length})</h3>
        <ul className="podii-spysok">
          {podii
            .slice()
            .reverse()
            .slice(0, 40)
            .map((p, i) => (
              <li key={`${p.chas}-${i}`}>
                <code>{p.nazva}</code> · {formatChas(p.chas)}
                {p.parametry?.variant ? ` · варіант ${String(p.parametry.variant)}` : ""}
              </li>
            ))}
        </ul>
        <button
          type="button"
          className="knopka knopka-mala"
          onClick={() => {
            ochystytyPodii();
            onNyazh();
          }}
        >
          🗑 Очистити демо-дані й повернутися
        </button>
      </section>
    </main>
  );
}
