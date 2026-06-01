function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.min(1, Math.max(0, n));
}

/** Linear interpolate A → B by factor t (clamped 0–1). */
export function evaluateLerp(a: number, b: number, t: number): number {
  const A = finiteOrZero(a);
  const B = finiteOrZero(b);
  const T = clamp01(t);
  return A + (B - A) * T;
}

/** Defaults when a lerp input pin has no wire (node-animator parity). */
export const LERP_INPUT_DEFAULTS = {
  a: 0,
  b: 1,
  t: 0,
} as const;

export function readLerpInputValue(
  wiredValue: number | boolean | string | null,
  fallback: number,
): number {
  if (wiredValue == null) {
    return fallback;
  }
  return typeof wiredValue === "number" && Number.isFinite(wiredValue) ? wiredValue : fallback;
}
