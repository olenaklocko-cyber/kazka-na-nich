interface Vlastyvosti {
  pro: boolean;
  dataPro: string | null;
  onStart: () => void;
  onAktivuvaty: () => void;
  onSettings: () => void;
}

const ZORI = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37 + 7) % 97}%`,
  top: `${(i * 53 + 3) % 70}%`,
  zatrymka: `${(i % 8) * 0.55}s`,
  tryvalist: `${2 + (i % 5) * 0.7}s`,
}));

const KHMARYNKY = [
  { klas: "khmarynka-1", trivalist: "68s", zatrymka: "0s" },
  { klas: "khmarynka-2", trivalist: "95s", zatrymka: "-30s" },
  { klas: "khmarynka-3", trivalist: "52s", zatrymka: "-12s" },
];

export default function WelcomeScreen({
  pro,
  dataPro,
  onStart,
  onAktivuvaty,
  onSettings,
}: Vlastyvosti) {
  return (
    <div className="landing">
      <div className="landing-zori" aria-hidden="true">
        {ZORI.map((z, i) => (
          <span
            key={i}
            className="zoria"
            style={{
              left: z.left,
              top: z.top,
              animationDelay: z.zatrymka,
              animationDuration: z.tryvalist,
            }}
          />
        ))}
      </div>

      <div className="khmarynky" aria-hidden="true">
        {KHMARYNKY.map((k) => (
          <span
            key={k.klas}
            className={`khmarynka ${k.klas}`}
            style={{ animationDuration: k.trivalist, animationDelay: k.zatrymka }}
          />
        ))}
      </div>

      <div className="misyats-obinka">
        <button
          type="button"
          className="misyats"
          onClick={onStart}
          aria-label="Почати магію — відкрити конструктор казок"
        >
          <span className="misyats-svilo" aria-hidden="true" />
          <span className="misyats-tekst">
            Почати
            <br />
            магію ✨
          </span>
        </button>
      </div>

      <div className="vedmedyk-scena" aria-hidden="true">
        <div className="lizhka">
          <span className="lizhka-nizhka" />
          <span className="lizhka-tyshnya">🧸</span>
          <span className="lizhka-kovdra" />
        </div>
        <span className="zzz zzz-1">z</span>
        <span className="zzz zzz-2">z</span>
        <span className="zzz zzz-3">z</span>
        <div className="nochnyk">
          <span className="nochnyk-svytilo" />
          <span className="nochnyk-stovp" />
        </div>
      </div>

      <header className="landing-verkh">
        <span className="landing-brend">🌙 Казка на ніч</span>
        <div className="landing-verkh-pravo">
          <div
            className={`status-pidpysku ${pro ? "status-pidpysku-pro" : ""}`}
            role="status"
          >
            <span className="status-ikonka" aria-hidden="true">
              {pro ? "☀️" : "🌙"}
            </span>
            {pro ? (
              <span className="status-tekst">
                Pro активовано{dataPro ? ` до ${dataPro}` : ""}
              </span>
            ) : (
              <button type="button" className="knopka knopka-mala" onClick={onAktivuvaty}>
                Активувати Pro
              </button>
            )}
          </div>
          <button
            type="button"
            className="shestirnia"
            aria-label="Налаштування (технічні розділи)"
            onClick={onSettings}
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="landing-tilo">
        <p className="landing-nadzagolovok">Щовечора — нова чарівна історія</p>
        <h1 className="landing-zagolovok">Казка на ніч</h1>
        <p className="landing-pidzagolovok">
          Унікальна казка для твоєї дитини — за 10 секунд
        </p>
      </main>

      <p className="landing-pidkas">
        Натисни на світний місяць ☝ — і казка почнеться. Герой, імʼя та
        повчальний урок. 12 мов, озвучення, 3 безкоштовні спроби.
      </p>

      <p className="landing-nizh">
        Ніч · місяць · затишок — дитина засинає з історією, яку придумали саме для неї
      </p>
    </div>
  );
}
