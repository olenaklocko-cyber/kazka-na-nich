import { useEffect } from "react";
import type { RefObject } from "react";

export type ProfilHolosu = "mama" | "tato" | "charyvnyj";

/** Характери озвучки: системні голоси з різним тембром і темпом. */
export const PROFILI: Record<ProfilHolosu, { nazva: string; pitch: number; rate: number }> = {
  mama: { nazva: "🧸 Мама (ніжний)", pitch: 1.3, rate: 0.88 },
  tato: { nazva: "👨 Тато (глибокий)", pitch: 0.72, rate: 0.97 },
  charyvnyj: { nazva: "✨ Казковий", pitch: 1.5, rate: 0.85 },
};

interface Vlastyvosti {
  kazka: string;
  imia: string;
  mova: "uk" | "en";
  ohovorytysya: boolean;
  profil: ProfilHolosu;
  holosSystemu: string;
  holosy: SpeechSynthesisVoice[];
  nemaUkHolosu: boolean;
  zavantazhennya: boolean;
  limyt: boolean;
  zagolovokRef: RefObject<HTMLHeadingElement | null>;
  onZakryty: () => void;
  onChytatyMami: () => void;
  onKazkovyiHolos: () => void;
  onPrykynyty: () => void;
  onScheOdna: () => void;
  onProfil: (p: ProfilHolosu) => void;
  onHolos: (uri: string) => void;
}

export default function KnigaKazky({
  kazka,
  imia,
  mova,
  ohovorytysya,
  profil,
  holosSystemu,
  holosy,
  nemaUkHolosu,
  zavantazhennya,
  limyt,
  zagolovokRef,
  onZakryty,
  onChytatyMami,
  onKazkovyiHolos,
  onPrykynyty,
  onScheOdna,
  onProfil,
  onHolos,
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
              Спеціально для <strong>{imia}</strong> 🌙
            </p>
          )}

          <div className="knyha-knopky">
            <button
              type="button"
              className="knopka knopka-knyha"
              aria-pressed={ohovorytysya}
              onClick={ohovorytysya ? onPrykynyty : onChytatyMami}
            >
              {ohovorytysya ? "⏸ Зупинити читання" : "👩 Читати мамі"}
            </button>
            <button
              type="button"
              className="knopka knopka-knyha knopka-knyha-kazkovyi"
              aria-pressed={ohovorytysya && profil === "charyvnyj"}
              onClick={ohovorytysya ? onPrykynyty : onKazkovyiHolos}
            >
              🔊 Увімкнути казковий голос
            </button>
            <button
              type="button"
              className="knopka knopka-knyha knopka-druhynna"
              disabled={zavantazhennya || limyt}
              onClick={onScheOdna}
            >
              🔄 Ще одна казка
            </button>
            <button type="button" className="knopka knopka-druhynna" onClick={onZakryty}>
              📕 Закрити книгу
            </button>
          </div>

          <fieldset className="holos-panel knyha-holos">
            <legend>Голос оповідача</legend>
            <div className="holos-chipy">
              {(Object.keys(PROFILI) as ProfilHolosu[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`chip ${profil === k ? "chip-aktyvnyj" : ""}`}
                  aria-pressed={profil === k}
                  onClick={() => onProfil(k)}
                >
                  {PROFILI[k].nazva}
                </button>
              ))}
            </div>
            <div className="holos-vybir">
              <label htmlFor="knyha-holos">Системний голос</label>
              <select
                id="knyha-holos"
                value={holosSystemu}
                onChange={(e) => onHolos(e.target.value)}
              >
                <option value="">Автоматично (найкращий доступний)</option>
                {holosy.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} — {v.lang}
                  </option>
                ))}
              </select>
            </div>
            {nemaUkHolosu && (
              <p className="holos-warh" role="note">
                ⚠️ Немає українського голосу — спробуй профіль «✨ Казковий» або
                обери голос зі списку.
              </p>
            )}
          </fieldset>
        </section>

        <section className="knyha-prava">
          <article className="kazka-tekst knyha-tekst" lang={mova === "uk" ? "uk" : "en"}>
            {kazka}
          </article>
        </section>
      </div>
    </div>
  );
}
