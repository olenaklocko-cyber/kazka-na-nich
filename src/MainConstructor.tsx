import type { ReactNode } from "react";

interface Vlastyvosti {
  children: ReactNode;
}

/** Головний робочий екран — конструктор казок (відкривається після «Почати магію»). */
export default function MainConstructor({ children }: Vlastyvosti) {
  return <div className="main-constructor">{children}</div>;
}
