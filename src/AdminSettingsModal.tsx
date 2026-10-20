import { useEffect, useRef } from "react";
import Analytyka from "./Analytyka";
import OpenSource from "./OpenSource";
import Infrastruktura from "./Infrastruktura";
import Pidtrymka from "./Pidtrymka";
import Dokumentatsiya from "./Dokumentatsiya";
import Zapusk from "./Zapusk";

export type Rozdil =
  | "kazky"
  | "analytyka"
  | "os"
  | "infra"
  | "pidtrymka"
  | "dok"
  | "zapusk";

const VKLADKY: { rozdil: Exclude<Rozdil, "kazky">; nazva: string }[] = [
  { rozdil: "analytyka", nazva: "📈 Аналітика" },
  { rozdil: "os", nazva: "🌍 Open Source" },
  { rozdil: "infra", nazva: "⚙️ Інфраструктура" },
  { rozdil: "pidtrymka", nazva: "📖 Підтримка" },
  { rozdil: "dok", nazva: "📚 Документація" },
  { rozdil: "zapusk", nazva: "🏆 Запуск" },
];

interface Vlastyvosti {
  rozdil: Rozdil;
  setRozdil: (r: Rozdil) => void;
  onClose: () => void;
}

export default function AdminSettingsModal({ rozdil, setRozdil, onClose }: Vlastyvosti) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const naEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", naEsc);
    const staryj = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", naEsc);
      document.body.style.overflow = staryj;
    };
  }, [onClose]);

  const aktyvna: Exclude<Rozdil, "kazky"> = rozdil === "kazky" ? "analytyka" : rozdil;

  return (
    <div
      className="nastroika-fon"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="nastroika-panel sklo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nastroika-zagolovok"
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="nastroika-shapka">
          <h2 id="nastroika-zagolovok">⚙️ Налаштування</h2>
          <button type="button" className="knopka knopka-mala" onClick={onClose}>
            ✕ Закрити
          </button>
        </div>

        <nav className="nastroika-vkladky" aria-label="Технічні розділи">
          {VKLADKY.map((v) => (
            <button
              key={v.rozdil}
              type="button"
              className="knopka knopka-mala knopka-vkladka"
              aria-pressed={aktyvna === v.rozdil}
              onClick={() => {
                setRozdil(v.rozdil);
                window.location.hash = v.rozdil === "analytyka" ? "analytyka" : v.rozdil;
              }}
            >
              {v.nazva}
            </button>
          ))}
        </nav>

        <div className="nastroika-vmist">
          {aktyvna === "analytyka" && <Analytyka onNyazh={onClose} />}
          {aktyvna === "os" && <OpenSource />}
          {aktyvna === "infra" && <Infrastruktura />}
          {aktyvna === "pidtrymka" && <Pidtrymka />}
          {aktyvna === "dok" && <Dokumentatsiya />}
          {aktyvna === "zapusk" && <Zapusk />}
        </div>
      </div>
    </div>
  );
}
