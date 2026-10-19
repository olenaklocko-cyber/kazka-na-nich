import { useEffect, useRef, useState } from "react";

type Mova = "uk" | "en";
type Tema = "nich" | "den";

const LS_TEMA = "kazka-tema";

/** Стан плану з сервера (ліміт рахує саме сервер, не браузер). */
interface Stan {
  pro: boolean;
  proDo: number | null;
  skilky: number;
  lyshylosya: number;
  lymitVykorystano: boolean;
  demo: boolean;
  limit: number;
}

type StanOplaty = null | "zavantazhennya" | "demo" | "liqpay" | "uspikh";

interface LiqPayForma {
  action: string;
  public_key: string;
  data: string;
  signature: string;
}

const HEROI = [
  "Котик-космонавт",
  "Лисичка-мандрівниця",
  "Ведмедик-кухар",
  "Зайчик-художник",
  "Слоненя-музикант",
];

const UROKY = [
  "Чому чистити зуби",
  "Ділитися іграшками",
  "Лягати спати вчасно",
  "Не боятися темряви",
  "Прибирати після ігор",
  "Сміливо знайомитися",
];

type ProfilHolosu = "mama" | "tato" | "charyvnyj";

/** Характери озвучки: ті самі системні голоси, але з різним тембром і темпом. */
const PROFILI: Record<ProfilHolosu, { nazva: string; pitch: number; rate: number }> = {
  mama: { nazva: "🧸 Мама (ніжний)", pitch: 1.3, rate: 0.88 },
  tato: { nazva: "👨 Тато (глибокий)", pitch: 0.72, rate: 0.97 },
  charyvnyj: { nazva: "✨ Казковий", pitch: 1.5, rate: 0.85 },
};

const ZAPYT = { method: "POST", headers: { "Content-Type": "application/json" } };

export default function App() {
  const [imia, setImia] = useState("");
  const [hero, setHero] = useState("");
  const [urok, setUrok] = useState("");
  const [mova, setMova] = useState<Mova>("uk");
  const [tema, setTema] = useState<Tema>(
    () => (localStorage.getItem(LS_TEMA) as Tema) || "nich",
  );

  const [zavantazhennya, setZavantazhennya] = useState(false);
  const [kazka, setKazka] = useState<string | null>(null);
  const [pomylka, setPomylka] = useState<string | null>(null);
  const [stan, setStan] = useState<Stan | null>(null);
  const [ohovorytysya, setOhovorytysya] = useState(false);
  const [profilHolosu, setProfilHolosu] = useState<ProfilHolosu>("mama");
  const [holosSystemu, setHolosSystemu] = useState("");
  const [holosy, setHolosy] = useState<SpeechSynthesisVoice[]>([]);
  const rezultatRef = useRef<HTMLHeadingElement>(null);

  const [oplata, setOplata] = useState<StanOplaty>(null);
  const [oplataPomylka, setOplataPomylka] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [liqpayForma, setLiqpayForma] = useState<LiqPayForma | null>(null);
  const oplataRef = useRef<HTMLDivElement>(null);
  const liqpayRef = useRef<HTMLFormElement>(null);

  const limyt = stan?.lymitVykorystano ?? false;
  const pro = stan?.pro ?? false;

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem(LS_TEMA, tema);
  }, [tema]);

  useEffect(() => {
    const speech = window.speechSynthesis;
    return () => speech.cancel();
  }, []);

  useEffect(() => {
    const speech = window.speechSynthesis;
    const zapyatyty = () => {
      const all = speech.getVoices();
      const pidkhodni = all.filter((v) => {
        const lang = v.lang.toLowerCase();
        return lang.startsWith("uk") || lang.startsWith("en");
      });
      setHolosy(pidkhodni.length > 0 ? pidkhodni : all);
    };
    zapyatyty();
    speech.addEventListener("voiceschanged", zapyatyty);
    return () => speech.removeEventListener("voiceschanged", zapyatyty);
  }, []);

  useEffect(() => {
    if (!ohovorytysya) return;
    const speech = window.speechSynthesis;
    const id = window.setInterval(() => {
      if (!speech.speaking) setOhovorytysya(false);
    }, 500);
    return () => window.clearInterval(id);
  }, [ohovorytysya]);

  /** Стан плану (Pro / лічильник / демо-режим) — джерело правди, сервер. */
  const zavantazhytyStan = async () => {
    try {
      const res = await fetch("/api/status", {
        ...ZAPYT,
        body: "{}",
      });
      if (res.ok) setStan((await res.json()) as Stan);
    } catch {
      /* сервер недоступний — покажемо «…», генерація сама оновить стан */
    }
  };

  useEffect(() => {
    void zavantazhytyStan();
  }, []);

  /** Повернення з LiqPay (result_url): підтверджуємо підпис і вмикаємо Pro. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get("data");
    const signature = params.get("signature");
    if (!data || !signature) return;
    window.history.replaceState({}, "", window.location.pathname);
    void (async () => {
      try {
        const res = await fetch("/api/pay/confirm", {
          ...ZAPYT,
          body: JSON.stringify({ data, signature }),
        });
        const vidpovid = (await res.json()) as { pro?: boolean };
        if (res.ok && vidpovid.pro) {
          localStorage.removeItem("kazka_platizh");
          setOplata("uspikh");
          await zavantazhytyStan();
        }
      } catch {
        /* сервер недоступний — Pro оновиться при наступному запиті стану */
      }
    })();
  }, []);

  /** План Б: якщо LiqPay повернув без підпису — питаємо статус за збереженим order_id. */
  useEffect(() => {
    if (stan?.pro) return;
    let platizh: { id?: string; t?: number } | null = null;
    try {
      platizh = JSON.parse(localStorage.getItem("kazka_platizh") ?? "null");
    } catch {
      platizh = null;
    }
    if (!platizh?.id || typeof platizh.t !== "number" || Date.now() - platizh.t > 30 * 60_000) {
      if (platizh) localStorage.removeItem("kazka_platizh");
      return;
    }
    void (async () => {
      try {
        const res = await fetch("/api/pay/confirm", {
          ...ZAPYT,
          body: JSON.stringify({ orderId: platizh.id }),
        });
        const vidpovid = (await res.json()) as { pro?: boolean };
        if (res.ok && vidpovid.pro) {
          localStorage.removeItem("kazka_platizh");
          setOplata("uspikh");
          await zavantazhytyStan();
        }
      } catch {
        /* офлайн — спробуємо при наступному відвідуванні */
      }
    })();
  }, [stan?.pro]);

  const generuvaly = async (podium: "perehlyad" | "scheOdna" = "perehlyad") => {
    if (zavantazhennya || limyt) return;
    setPomylka(null);
    if (podium === "perehlyad") setKazka(null);
    setZavantazhennya(true);
    try {
      const res = await fetch("/api/kazka", {
        ...ZAPYT,
        body: JSON.stringify({ imia, hero, urok, mova }),
      });
      const data = (await res.json()) as {
        tekst?: string;
        pomylka?: string;
        lymit?: boolean;
        skilky?: number;
        lyshylosya?: number;
        pro?: boolean;
      };
      if (typeof data.skilky === "number") {
        setStan((prev) => ({
          pro: data.pro ?? prev?.pro ?? false,
          proDo: prev?.proDo ?? null,
          skilky: data.skilky ?? 0,
          lyshylosya: data.lyshylosya ?? 0,
          lymitVykorystano: data.lymit ?? false,
          demo: prev?.demo ?? true,
          limit: prev?.limit ?? 3,
        }));
      }
      if (!res.ok || data.pomylka || !data.tekst) {
        setPomylka(data.pomylka ?? "Щось пішло не так — спробуй ще раз");
        return;
      }
      setKazka(data.tekst);
      window.setTimeout(() => rezultatRef.current?.focus(), 60);
    } catch {
      setPomylka("Сервер не відповідає — спробуй трохи пізніше");
    } finally {
      setZavantazhennya(false);
    }
  };

  const ozhuyvaty = () => {
    if (!kazka) return;
    const speech = window.speechSynthesis;
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(kazka);
    const prof = PROFILI[profilHolosu];
    utterance.lang = mova === "uk" ? "uk-UA" : "en-US";
    utterance.rate = prof.rate;
    utterance.pitch = prof.pitch;
    const vybranyj = holosSystemu
      ? holosy.find((v) => v.voiceURI === holosSystemu)
      : holosy.find((v) => v.lang.toLowerCase().startsWith("uk"));
    if (vybranyj) utterance.voice = vybranyj;
    utterance.onend = () => setOhovorytysya(false);
    utterance.onerror = () => setOhovorytysya(false);
    setOhovorytysya(true);
    speech.speak(utterance);
  };

  const prykynytyOzhuvannya = () => {
    window.speechSynthesis.cancel();
    setOhovorytysya(false);
  };

  /* ======================= ОПЛАТА (тиждень 3) ======================= */

  const vidkrytyOplatu = async () => {
    setOplataPomylka(null);
    setDemoToken(null);
    setLiqpayForma(null);
    setOplata("zavantazhennya");
    try {
      const res = await fetch("/api/checkout", { ...ZAPYT, body: "{}" });
      const data = (await res.json()) as {
        demo?: boolean;
        token?: string;
        forma?: LiqPayForma;
        pomylka?: string;
      };
      if (!res.ok) {
        setOplataPomylka(data.pomylka ?? "Не вдалося почати оплату");
        return;
      }
      if (data.demo && data.token) {
        setDemoToken(data.token);
        setOplata("demo");
      } else if (data.forma) {
        try {
          const pl = JSON.parse(atob(data.forma.data)) as { order_id?: string };
          if (typeof pl.order_id === "string") {
            localStorage.setItem("kazka_platizh", JSON.stringify({ id: pl.order_id, t: Date.now() }));
          }
        } catch {
          /* без order_id — відновлення просто не спрацює */
        }
        setLiqpayForma(data.forma);
        setOplata("liqpay");
      }
    } catch {
      setOplataPomylka("Сервер недоступний — спробуй пізніше");
    }
  };

  const zakrytyOplatu = () => {
    setOplata(null);
    setOplataPomylka(null);
  };

  /** Демо-режим: підтверджуємо оплачений токен, сервер видає Pro-токен. */
  const pidtverdzytyDemo = async () => {
    if (!demoToken) return;
    setOplataPomylka(null);
    try {
      const res = await fetch("/api/pay/confirm", {
        ...ZAPYT,
        body: JSON.stringify({ token: demoToken }),
      });
      const data = (await res.json()) as { pro?: boolean; pomylka?: string };
      if (!res.ok || !data.pro) {
        setOplataPomylka(data.pomylka ?? "Не вдалося підтвердити оплату");
        return;
      }
      setOplata("uspikh");
      await zavantazhytyStan();
    } catch {
      setOplataPomylka("Сервер недоступний — спробуй пізніше");
    }
  };

  useEffect(() => {
    if (oplata !== "liqpay" || !liqpayForma) return;
    const id = window.setTimeout(() => liqpayRef.current?.submit(), 150);
    return () => window.clearTimeout(id);
  }, [oplata, liqpayForma]);

  useEffect(() => {
    if (!oplata) return;
    const naEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") zakrytyOplatu();
    };
    document.addEventListener("keydown", naEsc);
    oplataRef.current?.focus();
    return () => document.removeEventListener("keydown", naEsc);
  }, [oplata]);

  const formaZapovnena =
    imia.trim().length > 0 || hero.trim().length > 0 || urok.trim().length > 0;

  const dataPro =
    stan?.proDo != null ? new Date(stan.proDo).toLocaleDateString("uk-UA") : "";

  return (
    <div className="kazka-dodatok">
      <header className="shapka">
        <div className="shapka-zagolovok">
          <span className="shapka-ikonka" aria-hidden="true">
            🌙
          </span>
          <div>
            <h1>Казка на ніч</h1>
            <p className="shapka-pidzagolovok">
              Унікальна казка для твоєї дитини — за 10 секунд
            </p>
          </div>
        </div>
        <div className="shapka-prava">
          {pro ? (
            <span className="pro-beydzh" role="status">
              ✨ Pro{dataPro ? ` до ${dataPro}` : ""}
            </span>
          ) : (
            <button type="button" className="knopka knopka-mala" onClick={() => void vidkrytyOplatu()}>
              💳 Pro — $4.99
            </button>
          )}
          <button
            type="button"
            className="knopka knopka-tema"
            aria-pressed={tema === "den"}
            aria-label={
              tema === "nich" ? "Увімкнути світлу тему" : "Увімкнути нічну тему"
            }
            onClick={() => setTema(tema === "nich" ? "den" : "nich")}
          >
            {tema === "nich" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <main className="holovne">
        <form
          className="generator sklo"
          onSubmit={(e) => {
            e.preventDefault();
            void generuvaly();
          }}
        >
          <h2>Створити казку</h2>

          <div className="pole">
            <label htmlFor="imia">Ім'я дитини</label>
            <input
              id="imia"
              type="text"
              value={imia}
              maxLength={40}
              placeholder="Наприклад: Мілана"
              autoComplete="off"
              disabled={limyt}
              onChange={(e) => setImia(e.target.value)}
            />
          </div>

          <div className="pole">
            <label htmlFor="hero">Головний герой</label>
            <input
              id="hero"
              type="text"
              value={hero}
              list="spysok-heroi"
              maxLength={60}
              placeholder="Котик-космонавт"
              autoComplete="off"
              disabled={limyt}
              onChange={(e) => setHero(e.target.value)}
            />
            <datalist id="spysok-heroi">
              {HEROI.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>

          <div className="pole">
            <label htmlFor="urok">Повчальний урок</label>
            <input
              id="urok"
              type="text"
              value={urok}
              list="spysok-urokiv"
              maxLength={80}
              placeholder="Наприклад: чому чистити зуби"
              autoComplete="off"
              disabled={limyt}
              onChange={(e) => setUrok(e.target.value)}
            />
            <datalist id="spysok-urokiv">
              {UROKY.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          <fieldset className="mova-vybir">
            <legend>Мова казки</legend>
            <div className="mova-vybir-riadky">
              <label className="mova-mayzhe">
                <input
                  type="radio"
                  name="mova"
                  checked={mova === "uk"}
                  disabled={limyt}
                  onChange={() => setMova("uk")}
                />
                🇺🇦 Українська
              </label>
              <label className="mova-mayzhe">
                <input
                  type="radio"
                  name="mova"
                  checked={mova === "en"}
                  disabled={limyt}
                  onChange={() => setMova("en")}
                />
                🇬🇧 English
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            className="knopka knopka-stvoryty"
            disabled={zavantazhennya || limyt || !formaZapovnena}
          >
            {zavantazhennya ? "✨ Вигадую казку…" : "✨ Створити казку"}
          </button>

          {zavantazhennya && (
            <p className="generuvalno" role="status">
              ✨ Генерую казку… це займе близько 10 секунд
            </p>
          )}

          {pro ? (
            <p className="lichylnyk" role="status">
              ✨ Pro активно{dataPro ? ` до ${dataPro}` : ""} — безліміт казок
            </p>
          ) : (
            <p className="lichylnyk" role="status">
              Безкоштовних казок лишилось: {stan ? stan.lyshylosya : "…"} з{" "}
              {stan?.limit ?? 3}
            </p>
          )}

          {limyt && (
            <div className="limyt-cta" role="status">
              <p className="limyt-zagolovok">🎁 Безкоштовні казки закінчились</p>
              <p>
                Pro за $4.99 (разово, на 30 днів): безліміт казок, а далі — різні
                голоси ШІ та збереження історії.
              </p>
              <button type="button" className="knopka" onClick={() => void vidkrytyOplatu()}>
                💳 Оновити до Pro — $4.99
              </button>
            </div>
          )}
        </form>

        <section className="rezyltat sklo" aria-label="Результат">
          {pomylka && (
            <p className="pomylka" role="alert">
              {pomylka}
            </p>
          )}

          {kazka ? (
            <>
              <div className="rezyltat-shapka">
                <h2 tabIndex={-1} ref={rezultatRef}>
                  Твоя казка
                </h2>
                <div className="rezyltat-knopky">
                  <button
                    type="button"
                    className="knopka knopka-mala"
                    aria-pressed={ohovorytysya}
                    onClick={ohovorytysya ? prykynytyOzhuvannya : ozhuyvaty}
                  >
                    {ohovorytysya ? "⏸ Зупинити" : "▶️ Озвучити"}
                  </button>
                  <button
                    type="button"
                    className="knopka knopka-mala knopka-natural"
                    disabled={zavantazhennya || limyt}
                    onClick={() => void generuvaly("scheOdna")}
                  >
                    🔄 Ще одна
                  </button>
                </div>
              </div>
              <div className="holos-panel">
                <fieldset>
                  <legend>Голос оповідача</legend>
                  <div className="holos-chipy">
                    {(Object.keys(PROFILI) as ProfilHolosu[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={`chip ${profilHolosu === k ? "chip-aktyvnyj" : ""}`}
                        aria-pressed={profilHolosu === k}
                        onClick={() => setProfilHolosu(k)}
                      >
                        {PROFILI[k].nazva}
                      </button>
                    ))}
                  </div>
                  <div className="holos-vybir">
                    <label htmlFor="holos-systemu">Системний голос</label>
                    <select
                      id="holos-systemu"
                      value={holosSystemu}
                      onChange={(e) => setHolosSystemu(e.target.value)}
                    >
                      <option value="">Автоматично (найкращий доступний)</option>
                      {holosy.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} — {v.lang}
                        </option>
                      ))}
                    </select>
                  </div>
                  {mova === "uk" &&
                    holosy.length > 0 &&
                    !holosy.some((v) => v.lang.toLowerCase().startsWith("uk")) && (
                      <p className="holos-warh" role="note">
                        ⚠️ На цьому пристрої немає українського голосу —
                        звучання може бути неприродним. Спробуй профіль «Казковий»,
                        обери голос зі списку, або створи казку 🇬🇧 англійською (там
                        голоси якісніші).
                      </p>
                    )}
                </fieldset>
              </div>
              <article className="kazka-tekst" lang={mova === "uk" ? "uk" : "en"}>
                {kazka}
              </article>
            </>
          ) : (
            !pomylka && (
              <p className="pusto">
                Тут з'явиться твоя казка — заповни ліворуч кілька слів і натисни
                «Створити казку». ✨
              </p>
            )
          )}
        </section>
      </main>

      {/* ==================== ДІАЛОГ ОПЛАТИ ==================== */}
      {oplata && (
        <div
          className="oplata-fon"
          onClick={(e) => {
            if (e.target === e.currentTarget) zakrytyOplatu();
          }}
        >
          <div
            className="oplata-modal sklo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="oplata-zagolovok"
            tabIndex={-1}
            ref={oplataRef}
          >
            <button
              type="button"
              className="oplata-zakryty"
              aria-label="Закрити"
              onClick={zakrytyOplatu}
            >
              ✕
            </button>

            <h2 id="oplata-zagolovok">💳 Pro-доступ</h2>

            <ul className="pro-spysok">
              <li>✅ Безліміт казок на 30 днів</li>
              <li>🔒 Номер картки бачить лише LiqPay — ми ніколи</li>
              <li>🎁 $4.99 разово, без автопродовження</li>
              <li>🔜 Далі: різні голоси ШІ, збереження історії</li>
            </ul>

            {oplata === "zavantazhennya" && (
              <p role="status">Відкриваю сторінку оплати…</p>
            )}

            {oplata === "demo" && (
              <>
                {stan?.demo && (
                  <p className="demo-baner" role="note">
                    ⚠️ <b>ДЕМО-РЕЖИМ.</b> Ключі LiqPay ще не додані, тому оплата
                    симульована: жодних грошей не списується і картку вводити не
                    потрібно. З ключами тут з'явиться справжня тестова сторінка
                    LiqPay.
                  </p>
                )}
                <p className="oplata-pidsumok">
                  До сплати: <b>$4.99</b> — Pro на 30 днів
                </p>
                <button
                  type="button"
                  className="knopka knopka-stvoryty"
                  onClick={() => void pidtverdzytyDemo()}
                >
                  💳 Сплатити $4.99 (демо)
                </button>
              </>
            )}

            {oplata === "uspikh" && (
              <p className="oplata-uspikh" role="status">
                ✅ Оплачено! Pro активно{dataPro ? ` до ${dataPro}` : ""} —
                безліміт казок відкрито.
              </p>
            )}

            {oplata === "liqpay" && (
              <p role="status">Переходжу на захищену сторінку LiqPay…</p>
            )}

            {oplataPomylka && (
              <p className="pomylka" role="alert">
                {oplataPomylka}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Прихована форма для справжнього редиректу на LiqPay */}
      {oplata === "liqpay" && liqpayForma && (
        <form ref={liqpayRef} action={liqpayForma.action} method="POST" hidden>
          <input type="hidden" name="public_key" value={liqpayForma.public_key} />
          <input type="hidden" name="data" value={liqpayForma.data} />
          <input type="hidden" name="signature" value={liqpayForma.signature} />
        </form>
      )}

      <footer className="pidval">
        <p>
          🌙 Казка на ніч — навчальний продукт рівня 7. Оплату обробляє LiqPay:
          наш сервер бачить лише «оплачено», ніколи — дані картки. Зроблено з 💙
          для батьків, які втомилися вигадувати щовечора.
        </p>
      </footer>
    </div>
  );
}
