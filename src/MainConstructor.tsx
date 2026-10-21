import type { ReactNode } from "react";

interface Vlastyvosti {
  children: ReactNode;
  /** Напівпрозорий вміст футера (мова, лічильник тощо) */
  dodatokNyzh?: ReactNode;
  pro: boolean;
  dataPro: string;
  tema: "nich" | "den";
  onTema: () => void;
  onOplata: () => void;
  onVidhuk: () => void;
  onNastroiky: () => void;
}

/** Головний робочий екран — конструктор казок на магічному нічному небі. */
export default function MainConstructor({
  children,
  dodatokNyzh,
  pro,
  dataPro,
  tema,
  onTema,
  onOplata,
  onVidhuk,
  onNastroiky,
}: Vlastyvosti) {
  return (
    <div className="chytka-nebo">
      {/* Керування — куточок, не шапка */}
      <div className="chytka-keruvannya">
        <button
          type="button"
          className="knopka-tema"
          aria-pressed={tema === "den"}
          aria-label={tema === "nich" ? "Увімкнути світлу тему" : "Увімкнути нічну тему"}
          onClick={onTema}
        >
          {tema === "nich" ? "☀️" : "🌙"}
        </button>
        <button
          type="button"
          className="shestirnia"
          aria-label="Налаштування (технічні розділи)"
          onClick={onNastroiky}
        >
          ⚙️
        </button>
      </div>

      <div className="chytka-tilo">{children}</div>

      {/* Технічні кнопки — унизу, непомітні */}
      <footer className="chytka-pidval">
        {dodatokNyzh}
        {pro ? (
          <span className="pro-beydzh" role="status">
            ✨ Pro{dataPro ? ` до ${dataPro}` : ""}
          </span>
        ) : (
          <button type="button" className="chytka-posylannya" onClick={onOplata}>
            💳 Pro — $4.99
          </button>
        )}
        <button type="button" className="chytka-posylannya" onClick={onVidhuk}>
          💬 Відгук
        </button>
      </footer>
    </div>
  );
}
