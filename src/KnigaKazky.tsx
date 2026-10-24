import { useEffect } from "react";
import type { RefObject } from "react";

export type ProfilHolosu = "mama" | "tato" | "charyvnyj";

/** Характери озвучки: системні голоси з різним тембром і темпом. */
export const PROFILI: Record<ProfilHolosu, { nazva: string; pitch: number; rate: number }> = {
  mama: { nazva: "🧸 Мама (ніжний)", pitch: 1.3, rate: 0.88 },
  tato: { nazva: "👨 Тато (глибокий)", pitch: 0.72, rate: 0.97 },
  charyvnyj: { nazva: "✨ Казковий", pitch: 1.5, rate: 0.85 },
};

/**
 * Родовий відмінок імені після прийменника «для»:
 * Даша → Даші, Оля → Олі, Андрій → Андрія, Дмитро → Дмитра, Іван → Івана.
 */
function doRodovoho(imia: string): string {
  const n = imia.trim();
  if (!n) return n;
  const c = n[n.length - 1];
  const p = n.length > 1 ? n[n.length - 2] : "";
  const pryhuk = "жчшщ".includes(p);
  if (c === "а") return n.slice(0, -1) + (pryhuk ? "і" : "и");
  if (c === "я") return n.slice(0, -1) + ("аеєиіїоуюя".includes(p) ? "ї" : "і");
  if (c === "о") return n + "а";
  if (c === "й" || c === "ь") return n.slice(0, -1) + "я";
  if ("аяуюеєиіїоюяйь".includes(c)) return n;
  return n + "а";
}

interface Vlastyvosti {
  kazka: string;
  imia: string;
  mova: "uk" | "en";
  ohovorytysya: boolean;
  profil: ProfilHolosu;
  zavantazhennya: boolean;
  limyt: boolean;
  zagolovokRef: RefObject<HTMLHeadingElement | null>;
  onZakryty: () => void;
  onHovorety: (p: ProfilHolosu) => void;
  onPrykynyty: () => void;
  onScheOdna: () => void;
}

export default function KnigaKazky({
  kazka,
  imia,
  mova,
  ohovorytysya,
  profil,
  zavantazhennya,
  limyt,
  zagolovokRef,
  onZakryty,
  onHovorety,
  onPrykynyty,
  onScheOdna,
}: Vlastyvosti) {
  useEffect(() => {
    const naEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onZakryty();
    };
    document.addEventListener("keydown", naEsc);
    const staryj = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", naEsc);
      document.body.style.overflow = staryj;
    };
  }, [onZakryty]);

  return (
    <div
      className="knyha-fon"
      onClick={(e) => {
        if (e.target === e.currentTarget) onZakryty();
      }}
    >
      <div
        className="knyha"
        role="dialog"
        aria-modal="true"
        aria-labelledby="knyha-zagolovok"
      >
        <span className="knyha-spidzal" aria-hidden="true" />

        <section className="knyha-lyeva">
          <p className="knyha-dekor" aria-hidden="true">
            ✨📖✨
          </p>
          <h2 id="knyha-zagolovok" tabIndex={-1} ref={zagolovokRef}>
            Твоя казка
          </h2>
          {imia && (
            <p className="knyha-dlya">
              <span className="knyha-dlya-pidkaz">Спеціально для</span>
              <strong>{doRodovoho(imia)} 🌙</strong>
            </p>
          )}

          <div className="knyha-ozvukka">
            <p className="knyha-ozvukka-zagolovok">Озвучити казку:</p>
            <div className="knyha-ozvukka-ryad">
              <div className="holos-chipy">
                {(Object.keys(PROFILI) as ProfilHolosu[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`chip ${profil === k ? "chip-aktyvnyj" : ""}`}
                    aria-pressed={profil === k}
                    onClick={() =>
                      ohovorytysya && profil === k ? onPrykynyty() : onHovorety(k)
                    }
                  >
                    {PROFILI[k].nazva}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`kniga-play ${ohovorytysya ? "kniga-play-zapys" : ""}`}
                aria-label={ohovorytysya ? "Зупинити озвучку" : "Озвучити казку"}
                onClick={ohovorytysya ? onPrykynyty : () => onHovorety(profil)}
              >
                {ohovorytysya ? "⏹" : "▶"}
              </button>
            </div>
          </div>
        </section>

        <section className="knyha-prava">
          <article className="kazka-tekst knyha-tekst" lang={mova === "uk" ? "uk" : "en"}>
            {kazka}
          </article>
          <div className="knyha-kincya">
            <button type="button" className="knopka knopka-sche-odna" disabled={zavantazhennya || limyt} onClick={onScheOdna}>
              🔄 Ще одна казка
            </button>
            <button type="button" className="knopka knopka-zakryty-knihu" onClick={onZakryty}>
              📕 Закрити книгу
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
