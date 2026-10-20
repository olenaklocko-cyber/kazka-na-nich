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

      <div className="misyats" aria-hidden="true">
        <span className="misyats-svilo" />
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
        <button type="button" className="knopka knopka-charya" onClick={onStart}>
          Почати магію ✨
        </button>
        <p className="landing-pidkas">
          Герой, імʼя та повчальний урок — і казка готова. 12 мов, озвучення, 3
          безкоштовні спроби.
        </p>
      </main>

      <p className="landing-nizh">Ніч · місяць · затишок — дитина засинає з історією, яку придумали саме для неї</p>
    </div>
  );
}
