import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

export type BgEffect = "orbs" | "bars" | "waves";

const KEY = "radio-bg-effect";

export const [bgEffect, _setBg] = createSignal<BgEffect>("orbs");

export function setBgEffect(v: BgEffect) {
  _setBg(v);
  if (!isServer) localStorage.setItem(KEY, v);
}

/** Call once on mount to rehydrate stored preference. */
export function initBgEffect() {
  if (isServer) return;
  const stored = localStorage.getItem(KEY) as BgEffect | null;
  if (stored === "orbs" || stored === "bars" || stored === "waves") {
    _setBg(stored);
  }
}
