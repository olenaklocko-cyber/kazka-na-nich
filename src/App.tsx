import { useEffect, useRef, useState } from "react";
import WelcomeScreen from "./WelcomeScreen";
import MainConstructor from "./MainConstructor";
import AdminSettingsModal, { type Rozdil } from "./AdminSettingsModal";
import KnigaKazky, { PROFILI, type ProfilHolosu } from "./KnigaKazky";
import { dodatyVidhuk, podie, variantAB } from "./lib/analytyka";

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

const HEROY_KVADRATYKY: { emoji: string; nazva: string }[] = [
  { emoji: "🐱", nazva: "Котик" },
  { emoji: "🐶", nazva: "Песик" },
  { emoji: "🦊", nazva: "Лисичка" },
  { emoji: "🐰", nazva: "Зайчик" },
  { emoji: "🐻", nazva: "Ведмедик" },
  { emoji: "🦉", nazva: "Сова" },
  { emoji: "🦄", nazva: "Єдиноріг" },
  { emoji: "🐉", nazva: "Дракончик" },
  { emoji: "🤖", nazva: "Робот" },
  { emoji: "🧚", nazva: "Фея" },
  { emoji: "🚀", nazva: "Космонавт" },
  { emoji: "🦖", nazva: "Динозаврик" },
];

type PoleHolosu = "imia" | "hero" | "urok";

/** Мінімальний тип для Web Speech API (SpeechRecognition). */
interface RozPiznavanniaHolosu {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((podiia: { error?: string }) => void) | null;
  onresult: ((podiia: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
}

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

  const [slukhae, setSlukhae] = useState<PoleHolosu | null>(null);
  const [holosPomylka, setHolosPomylka] = useState<string | null>(null);
  const rozPiznavanniaRef = useRef<RozPiznavanniaHolosu | null>(null);

  const [rozdil, setRozdil] = useState<Rozdil>(() =>
    window.location.hash.startsWith("#analytyka")
      ? "analytyka"
      : window.location.hash.startsWith("#os")
        ? "os"
        : window.location.hash.startsWith("#infra")
          ? "infra"
          : window.location.hash.startsWith("#pidtrymka")
            ? "pidtrymka"
            : window.location.hash.startsWith("#dok")
              ? "dok"
              : window.location.hash.startsWith("#zapusk")
                ? "zapusk"
                : "kazky",
  );
  const [ekran, setEkran] = useState<"welcome" | "konstruktor">(() => {
    const params = new URLSearchParams(window.location.search);
    const h = window.location.hash;
    const tekhnichnyj =
      h.startsWith("#analytyka") ||
      h.startsWith("#os") ||
      h.startsWith("#infra") ||
      h.startsWith("#pidtrymka") ||
      h.startsWith("#dok") ||
      h.startsWith("#zapusk");
    return params.has("data") || tekhnichnyj ? "konstruktor" : "welcome";
  });
  const [nastroika, setNastroika] = useState(() => {
    const h = window.location.hash;
    return (
      h.startsWith("#analytyka") ||
      h.startsWith("#os") ||
      h.startsWith("#infra") ||
      h.startsWith("#pidtrymka") ||
      h.startsWith("#dok") ||
      h.startsWith("#zapusk")
    );
  });
  const [sviyHeroy, setSviyHeroy] = useState(false);
  const [knyhaVidkrita, setKnyhaVidkrita] = useState(false);
  const [vidhukModalka, setVidhukModalka] = useState(false);
  const [vidhukOtsinka, setVidhukOtsinka] = useState<"plus" | "minus" | null>(null);
  const [vidhukTekst, setVidhukTekst] = useState("");
  const formStartRef = useRef(false);

  const [oplata, setOplata] = useState<StanOplaty>(null);
  const [oplataPomylka, setOplataPomylka] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [liqpayForma, setLiqpayForma] = useState<LiqPayForma | null>(null);
  const oplataRef = useRef<HTMLDivElement>(null);
  const liqpayRef = useRef<HTMLFormElement>(null);

  const limyt = stan?.lymitVykorystano ?? false;
  const pro = stan?.pro ?? false;
  const proRef = useRef(false);

  useEffect(() => {
    if (limyt) podie("limit");
  }, [limyt]);

  useEffect(() => {
    if (pro && !proRef.current) {
      proRef.current = true;
      podie("pro_uspikh");
    }
  }, [pro]);

  useEffect(() => {
    if (kazka) setKnyhaVidkrita(true);
  }, [kazka]);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem(LS_TEMA, tema);
  }, [tema]);

  useEffect(() => {
    podie("storinka");
    const naHash = () => {
      const h = window.location.hash;
      if (h.startsWith("#analytyka")) setRozdil("analytyka");
      else if (h.startsWith("#os")) setRozdil("os");
      else if (h.startsWith("#infra")) setRozdil("infra");
      else if (h.startsWith("#pidtrymka")) setRozdil("pidtrymka");
      else if (h.startsWith("#dok")) setRozdil("dok");
      else if (h.startsWith("#zapusk")) setRozdil("zapusk");
      else {
        setRozdil("kazky");
        setNastroika(false);
        return;
      }
      setEkran("konstruktor");
      setNastroika(true);
    };
    window.addEventListener("hashchange", naHash);
    return () => window.removeEventListener("hashchange", naHash);
  }, []);

  /** Один раз на сесію: користувач почав заповнювати форму. */
  const formStart = () => {
    if (formStartRef.current) return;
    formStartRef.current = true;
    podie("form_start");
  };

  useEffect(() => {
    const speech = window.speechSynthesis;
    return () => {
      rozPiznavanniaRef.current?.stop();
      speech.cancel();
    };
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
          podie("oplata_pidtverdzhena");
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
          podie("oplata_vidnovlena");
          setOplata("uspikh");
          await zavantazhytyStan();
        }
      } catch {
        /* офлайн — спробуємо при наступному відвідуванні */
      }
    })();
  }, [stan?.pro]);

  /** Голосове введення: розпізнає сказане і додає у вибране поле форми. */
  const slukhaty = (pole: PoleHolosu, pryjnyaty: (tekst: string) => void) => {
    setHolosPomylka(null);
    if (slukhae === pole) {
      rozPiznavanniaRef.current?.stop();
      return;
    }
    rozPiznavanniaRef.current?.stop();
    const w = window as unknown as {
      SpeechRecognition?: new () => RozPiznavanniaHolosu;
      webkitSpeechRecognition?: new () => RozPiznavanniaHolosu;
    };
    const Klas = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Klas) {
      setHolosPomylka("Цей браузер не підтримує голосове введення — спробуй Chrome або Edge");
      return;
    }
    const roz = new Klas();
    roz.lang = mova === "en" ? "en-US" : "uk-UA";
    roz.interimResults = false;
    roz.continuous = false;
    roz.onstart = () => {
      setSlukhae(pole);
      setHolosPomylka(null);
    };
    roz.onend = () => setSlukhae(null);
    roz.onerror = (podiia) => {
      setSlukhae(null);
      setHolosPomylka(
        podiia.error === "not-allowed"
          ? "Браузер не дав доступ до мікрофона — дозволь у налаштуваннях сайту"
          : podiia.error === "no-speech"
            ? "Нічого не почулося — спробуй ще раз і говори чіткіше"
            : "Не вдалося розпізнати голос — спробуй ще раз",
      );
    };
    roz.onresult = (podiia) => {
      const ostannie = podiia.results[podiia.results.length - 1];
      const tekst = ostannie[0]?.transcript?.trim();
      if (tekst) {
        podie("mikrofon", { pole });
        pryjnyaty(tekst);
      }
    };
    rozPiznavanniaRef.current = roz;
    roz.start();
  };

  const generuvaly = async (podium: "perehlyad" | "scheOdna" = "perehlyad") => {
    if (zavantazhennya || limyt) return;
    setPomylka(null);
    if (podium === "perehlyad") setKazka(null);
    setZavantazhennya(true);
    podie("kazka_start");
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
        podie("kazka_pomylka", { prychyna: data.pomylka ?? "nevidomo" });
        setPomylka(data.pomylka ?? "Щось пішло не так — спробуй ще раз");
        return;
      }
      podie("kazka_uspikh", { dovzhyta: data.tekst.length });
      setKazka(data.tekst);
      window.setTimeout(() => rezultatRef.current?.focus(), 60);
    } catch {
      setPomylka("Сервер не відповідає — спробуй трохи пізніше");
    } finally {
      setZavantazhennya(false);
    }
  };

  const ozhuyvaty = (zminenyjProfil?: ProfilHolosu) => {
    if (!kazka) return;
    const speech = window.speechSynthesis;
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(kazka);
    const prof = PROFILI[zminenyjProfil ?? profilHolosu];
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
    podie("oproplata_vidkryto");
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
        podie("liqpay_kasa");
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
      podie("demo_pidtverdzheno");
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

  useEffect(() => {
    if (!vidhukModalka) return;
    const naEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVidhukModalka(false);
    };
    document.addEventListener("keydown", naEsc);
    return () => document.removeEventListener("keydown", naEsc);
  }, [vidhukModalka]);

  const nadislalyVidhuk = () => {
    if (!vidhukOtsinka) return;
    dodatyVidhuk(vidhukOtsinka, vidhukTekst.trim());
    setVidhukModalka(false);
  };

  const formaZapovnena =
    imia.trim().length > 0 || hero.trim().length > 0 || urok.trim().length > 0;

  const vybranyjHeroy = HEROY_KVADRATYKY.find((h) => h.nazva === hero.trim());
  const pokazatySvoyho = sviyHeroy || (hero.trim() !== "" && !vybranyjHeroy);

  const dataPro =
    stan?.proDo != null ? new Date(stan.proDo).toLocaleDateString("uk-UA") : "";

  const zakrytyNastroiky = () => {
    setNastroika(false);
    setRozdil("kazky");
    if (window.location.hash) window.location.hash = "";
  };

  const vidkrytyNastroiky = () => {
    if (rozdil === "kazky" || rozdil === undefined) setRozdil("analytyka");
    setNastroika(true);
  };

  if (ekran === "welcome") {
    return (
      <>
        <WelcomeScreen
          pro={pro}
          dataPro={dataPro}
          onStart={() => setEkran("konstruktor")}
          onAktivuvaty={() => {
            setEkran("konstruktor");
            void vidkrytyOplatu();
          }}
          onSettings={vidkrytyNastroiky}
        />
        {nastroika && (
          <AdminSettingsModal rozdil={rozdil} setRozdil={setRozdil} onClose={zakrytyNastroiky} />
        )}
      </>
    );
  }

  return (
    <div className="kazka-dodatok">
      {rozdil === "kazky" ? (
      <MainConstructor
        pro={pro}
        dataPro={dataPro}
        tema={tema}
        onTema={() => setTema(tema === "nich" ? "den" : "nich")}
        onOplata={() => void vidkrytyOplatu()}
        onVidhuk={() => {
          setVidhukModalka(true);
          setVidhukOtsinka(null);
          setVidhukTekst("");
        }}
        onNastroiky={vidkrytyNastroiky}
        dodatokNyzh={
          <>
            <div className="mova-khrugly" role="radiogroup" aria-label="Мова казки">
              <label className={`mova-pilyuka ${mova === "uk" ? "mova-pilyuka-aktyvna" : ""}`}>
                <input
                  type="radio"
                  name="mova"
                  checked={mova === "uk"}
                  disabled={limyt}
                  onChange={() => setMova("uk")}
                />
                🇺🇦 Укр
              </label>
              <label className={`mova-pilyuka ${mova === "en" ? "mova-pilyuka-aktyvna" : ""}`}>
                <input
                  type="radio"
                  name="mova"
                  checked={mova === "en"}
                  disabled={limyt}
                  onChange={() => setMova("en")}
                />
                🇬🇧 Eng
              </label>
            </div>
            <p className="chytka-luchyk" role="status">
              {pro
                ? `✨ Pro активовано${dataPro ? ` до ${dataPro}` : ""} — безліміт казок`
                : `Безкоштовних казок лишилось: ${stan ? stan.lyshylosya : "…"} з ${stan?.limit ?? 3}`}
            </p>
          </>
        }
      >
      <main className="chytka-forma-tilo">
        <form
          className="chytka-dvir"
          onSubmit={(e) => {
            e.preventDefault();
            void generuvaly();
          }}
        >
          {/* ЛІВА ЗОНА — Чарівна Книга Нотаток */}
          <section className="chytka-leva-zona" aria-label="Введення даних казки">
            <div className="chytka-knyha">
              {pomylka && (
                <p className="pomylka" role="alert">
                  {pomylka}
                </p>
              )}

              <h2 className="knyha-nadpis">Як звати малюка?</h2>
              <div className="magic-cloud-input">
                <input
                  id="imia"
                  type="text"
                  className="cloud-inner-input"
                  value={imia}
                  maxLength={40}
                  placeholder="Введи ім'я..."
                  autoComplete="off"
                  disabled={limyt}
                  onChange={(e) => {
                    formStart();
                    setImia(e.target.value);
                  }}
                />
                <button
                  type="button"
                  className={`star-mic-btn ${slukhae === "imia" ? "star-mic-btn-zapys" : ""}`}
                  disabled={limyt}
                  aria-label={
                    slukhae === "imia"
                      ? "Зупинити запис: ім'я дитини"
                      : "Сказати ім'я дитини голосом"
                  }
                  aria-pressed={slukhae === "imia"}
                  onClick={() => slukhaty("imia", (t) => setImia((p) => (p ? `${p} ` : "") + t))}
                >
                  {slukhae === "imia" ? "⏹" : "✨"}
                </button>
              </div>

              <h2 className="knyha-nadpis">Повчальний урок</h2>
              <div className="khmara-imia khmara-mensha">
                <input
                  id="urok"
                  type="text"
                  className="khmara-imia-vkhid"
                  value={urok}
                  list="spysok-urokiv"
                  maxLength={80}
                  placeholder="Чому чистити зуби?"
                  autoComplete="off"
                  disabled={limyt}
                  onChange={(e) => {
                    formStart();
                    setUrok(e.target.value);
                  }}
                />
                <button
                  type="button"
                  className={`khmara-mikrofon khmara-mikrofon-malyj ${slukhae === "urok" ? "khmara-mikrofon-zapys" : ""}`}
                  disabled={limyt}
                  aria-label={
                    slukhae === "urok" ? "Зупинити запис: повчальний урок" : "Сказати урок голосом"
                  }
                  aria-pressed={slukhae === "urok"}
                  onClick={() => slukhaty("urok", (t) => setUrok((p) => (p ? `${p} ` : "") + t))}
                >
                  {slukhae === "urok" ? "⏹" : "✨"}
                </button>
              </div>
              <datalist id="spysok-urokiv">
                {UROKY.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <p className="holos-pidkazka" role="status">
              {slukhae
                ? "Слухаю… говори, потім натисни ⏹"
                : (holosPomylka ?? "Не вмієш друкувати? Натисни ✨ і скажи голосом")}
            </p>

            {limyt && (
              <div className="limyt-khmara" role="status">
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
          </section>

          {/* ПРАВА ЗОНА — Чарівна Галявина (вибір героя) */}
          <section className="chytka-haljavyna" aria-label="Вибір головного героя">
            <div className="heroy-sitka" role="group" aria-label="Головний герой">
              {HEROY_KVADRATYKY.map((h) => {
                const aktivnyj = hero.trim() === h.nazva && !sviyHeroy;
                return (
                  <button
                    key={h.nazva}
                    type="button"
                    className={`heroy-blyskavka ${aktivnyj ? "heroy-blyskavka-aktyvna" : ""}`}
                    disabled={limyt}
                    aria-pressed={aktivnyj}
                    onClick={() => {
                      formStart();
                      podie("heroy_kvadratyk", { heroy: h.nazva });
                      setSviyHeroy(false);
                      setHero(aktivnyj ? "" : h.nazva);
                    }}
                  >
                    <span className="heroy-obraz" aria-hidden="true">
                      {h.emoji}
                    </span>
                    <span className="heroy-pidpis">{h.nazva}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className={`heroy-blyskavka ${pokazatySvoyho ? "heroy-blyskavka-aktyvna" : ""}`}
                disabled={limyt}
                aria-pressed={pokazatySvoyho}
                onClick={() => {
                  formStart();
                  setSviyHeroy(true);
                  setHero("");
                }}
              >
                <span className="heroy-obraz" aria-hidden="true">
                  ➕
                </span>
                <span className="heroy-pidpis">Свій варіант</span>
              </button>
            </div>
            {pokazatySvoyho && (
              <div className="heroy-sviy-khmara">
                <input
                  id="hero"
                  type="text"
                  className="heroy-sviy-vkhid"
                  value={hero}
                  list="spysok-heroi"
                  maxLength={60}
                  placeholder="Впиши будь-кого: Єдиноріг-фізик 🦄"
                  autoComplete="off"
                  disabled={limyt}
                  autoFocus
                  onChange={(e) => {
                    formStart();
                    setHero(e.target.value);
                  }}
                />
                <button
                  type="button"
                  className="khmara-mikrofon khmara-mikrofon-malyj"
                  disabled={limyt}
                  aria-label={
                    slukhae === "hero" ? "Зупинити запис: головний герой" : "Сказати героя голосом"
                  }
                  aria-pressed={slukhae === "hero"}
                  onClick={() => slukhaty("hero", (t) => setHero((p) => (p ? `${p} ` : "") + t))}
                >
                  {slukhae === "hero" ? "⏹" : "✨"}
                </button>
              </div>
            )}
            <datalist id="spysok-heroi">
              {HEROI.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>

            {/* Фінальний акорд — по центру під героями */}
            <button
              type="submit"
              className="zirka-knopka"
              disabled={zavantazhennya || limyt || !formaZapovnena}
            >
              {zavantazhennya
                ? "✨ Вигадую казку…"
                : variantAB() === "A"
                  ? "✨ Створити казку"
                  : "🌙 Казка за 10 секунд"}
            </button>

            {zavantazhennya && (
              <p className="generuvalno" role="status">
                ✨ Генерую казку… це займе близько 10 секунд
              </p>
            )}
          </section>
        </form>

        {kazka && !knyhaVidkrita && (
          <button
            type="button"
            className="knyha-viklik"
            onClick={() => setKnyhaVidkrita(true)}
          >
            📖 Твоя казка чекає — відкрити книгу
          </button>
        )}
      </main>
      </MainConstructor>
      ) : null}

      {rozdil === "kazky" && kazka && knyhaVidkrita && (
        <KnigaKazky
          kazka={kazka}
          imia={imia.trim()}
          mova={mova}
          ohovorytysya={ohovorytysya}
          profil={profilHolosu}
          holosSystemu={holosSystemu}
          holosy={holosy}
          nemaUkHolosu={
            mova === "uk" &&
            holosy.length > 0 &&
            !holosy.some((v) => v.lang.toLowerCase().startsWith("uk"))
          }
          zavantazhennya={zavantazhennya}
          limyt={limyt}
          zagolovokRef={rezultatRef}
          onZakryty={() => setKnyhaVidkrita(false)}
          onChytatyMami={() => {
            setProfilHolosu("mama");
            ozhuyvaty("mama");
          }}
          onKazkovyiHolos={() => {
            setProfilHolosu("charyvnyj");
            ozhuyvaty("charyvnyj");
          }}
          onPrykynyty={prykynytyOzhuvannya}
          onScheOdna={() => void generuvaly("scheOdna")}
          onProfil={setProfilHolosu}
          onHolos={setHolosSystemu}
        />
      )}

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

      {vidhukModalka && (
        <div className="oplata-fon" role="presentation" onClick={() => setVidhukModalka(false)}>
          <div
            className="oplata-modal vidhuk-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="zag-vidhuk"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="zag-vidhuk">💬 Як тобі застосунок?</h2>
            <div className="vidhuk-otsinky" role="group" aria-label="Оцінка">
              <button
                type="button"
                className={vidhukOtsinka === "plus" ? "kvadratyk kvadratyk-aktyvnyj" : "kvadratyk"}
                aria-pressed={vidhukOtsinka === "plus"}
                onClick={() => setVidhukOtsinka("plus")}
              >
                <span aria-hidden="true">👍</span>
                <span className="kvadratyk-nazva">Подобається</span>
              </button>
              <button
                type="button"
                className={vidhukOtsinka === "minus" ? "kvadratyk kvadratyk-aktyvnyj" : "kvadratyk"}
                aria-pressed={vidhukOtsinka === "minus"}
                onClick={() => setVidhukOtsinka("minus")}
              >
                <span aria-hidden="true">👎</span>
                <span className="kvadratyk-nazva">Є що покращити</span>
              </button>
            </div>
            <label className="vidhuk-pidpis" htmlFor="vidhuk-tekst">
              Коментар (необов'язково)
            </label>
            <textarea
              id="vidhuk-tekst"
              className="vidhuk-textarea"
              rows={3}
              maxLength={300}
              value={vidhukTekst}
              placeholder="Наприклад: хотіла би зберігати казки"
              onChange={(e) => setVidhukTekst(e.target.value)}
            />
            <div className="oplata-dii">
              <button
                type="button"
                className="knopka"
                disabled={!vidhukOtsinka}
                onClick={nadislalyVidhuk}
              >
                Надіслати
              </button>
              <button type="button" className="knopka knopka-druhynna" onClick={() => setVidhukModalka(false)}>
                Пізніше
              </button>
            </div>
          </div>
        </div>
      )}

      {nastroika && (
        <AdminSettingsModal rozdil={rozdil} setRozdil={setRozdil} onClose={zakrytyNastroiky} />
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
