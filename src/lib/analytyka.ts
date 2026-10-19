/** Легка клієнтська аналітика: події, воронка, A/B-варіант, зворотний зв'язок. */

export type VariantAB = "A" | "B";

export interface Podie {
  nazva: string;
  chas: number;
  parametry?: Record<string, string | number | boolean>;
}

export interface Vidhuk {
  chas: number;
  otsinka: "plus" | "minus";
  tekst: string;
  vzyatoDoRoboty: boolean;
}

const LS_PODII = "kazka_analytyka_podii";
const LS_AB = "kazka_ab_variant";
const LS_VIDHUKY = "kazka_vidhuky";

function chytatyLS<T>(kluch: string, zamovchuvannya: T): T {
  try {
    const znachennia = localStorage.getItem(kluch);
    return znachennia ? (JSON.parse(znachennia) as T) : zamovchuvannya;
  } catch {
    return zamovchuvannya;
  }
}

/** 50/50: варіант вибирається один раз і зберігається в браузері. */
export function variantAB(): VariantAB {
  const znachennia = localStorage.getItem(LS_AB);
  if (znachennia === "A" || znachennia === "B") return znachennia;
  const novyi: VariantAB = Math.random() < 0.5 ? "A" : "B";
  localStorage.setItem(LS_AB, novyi);
  return novyi;
}

/** Реєструє подію: у localStorage (для звіту) + на сервер (beacon). */
export function podie(
  nazva: string,
  parametry?: Record<string, string | number | boolean>,
): void {
  const podieObj: Podie = {
    nazva,
    chas: Date.now(),
    parametry: { variant: variantAB(), ...parametry },
  };
  const spysok = chytatyLS<Podie[]>(LS_PODII, []);
  spysok.push(podieObj);
  try {
    localStorage.setItem(LS_PODII, JSON.stringify(spysok.slice(-400)));
  } catch {
    /* сховище переповнене — аналітика не має ламати продукт */
  }
  try {
    const tela = JSON.stringify({ n: nazva, t: podieObj.chas, p: podieObj.parametry });
    navigator.sendBeacon?.(
      "/api/analytics",
      new Blob([tela], { type: "application/json" }),
    );
  } catch {
    /* офлайн — звіт працює і з localStorage */
  }
}

export function vsePodii(): Podie[] {
  return chytatyLS<Podie[]>(LS_PODII, []);
}

export function ochystytyPodii(): void {
  localStorage.removeItem(LS_PODII);
}

export function dodatyVidhuk(otsinka: "plus" | "minus", tekst: string): void {
  const spysok = chytatyLS<Vidhuk[]>(LS_VIDHUKY, []);
  spysok.push({ chas: Date.now(), otsinka, tekst, vzyatoDoRoboty: false });
  localStorage.setItem(LS_VIDHUKY, JSON.stringify(spysok));
  podie("zvorotnyj_zvaz", { otsinka, dovzhyta: tekst.length > 0 });
}

export function vsiVidhuky(): Vidhuk[] {
  return chytatyLS<Vidhuk[]>(LS_VIDHUKY, []);
}

export function vzatyVidhukDoRoboty(chasVidhuku: number): void {
  const spysok = chytatyLS<Vidhuk[]>(LS_VIDHUKY, []);
  const znaydenyj = spysok.find((v) => v.chas === chasVidhuku);
  if (znaydenyj) znaydenyj.vzyatoDoRoboty = true;
  localStorage.setItem(LS_VIDHUKY, JSON.stringify(spysok));
}

/** Демо-набір подій для показу воронки без реальних користувачів. */
export function dopovnytyDemoPodii(): void {
  const zaраз = Date.now();
  const demo: Podie[] = [
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
      nazva: "storinka",
      chas: zaраз - (8 - i) * 60_000,
      parametry: { variant: i % 2 === 0 ? "A" : "B" },
    })),
    ...[0, 1, 2, 3, 4].map((i) => ({
      nazva: "form_start",
      chas: zaраз - (6 - i) * 50_000,
      parametry: { variant: i % 2 === 0 ? "A" : "B" },
    })),
    ...[0, 1, 2].map((i) => ({
      nazva: "kazka_start",
      chas: zaраз - (4 - i) * 40_000,
      parametry: { variant: i === 2 ? "B" : "A" },
    })),
    ...[0, 1].map((i) => ({
      nazva: "kazka_uspikh",
      chas: zaраз - (3 - i) * 30_000,
      parametry: { variant: i === 1 ? "B" : "A" },
    })),
    { nazva: "oproplata_vidkryto", chas: zaраз - 25_000, parametry: { variant: "A" } },
    { nazva: "oproplata_vidkryto", chas: zaраз - 20_000, parametry: { variant: "B" } },
    { nazva: "oproplata_vidkryto", chas: zaраз - 15_000, parametry: { variant: "B" } },
    { nazva: "oplata_pidtverdzhena", chas: zaраз - 10_000, parametry: { variant: "B" } },
    { nazva: "pro_uspikh", chas: zaраз - 9_000, parametry: { variant: "B" } },
  ];
  const spysok = chytatyLS<Podie[]>(LS_PODII, []);
  localStorage.setItem(LS_PODII, JSON.stringify([...spysok, ...demo].slice(-400)));
}
