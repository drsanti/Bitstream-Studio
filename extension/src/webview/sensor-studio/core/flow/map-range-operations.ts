import { readValueNormalizerInput as readMapRangeInput } from "./value-normalizer-operations";

export { readMapRangeInput };

export const MAP_RANGE_INPUT_DEFAULTS = {
  value: 0,
  inMin: 0,
  inMax: 1,
  outMin: -1,
  outMax: 1,
} as const;

function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Linear map with optional clamp (node-animator `mapRange` parity). */
export function evaluateMapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamp: boolean,
): number {
  const val = finiteOrZero(value);
  const i0 = finiteOrZero(inMin);
  const i1 = finiteOrZero(inMax);
  const o0 = finiteOrZero(outMin);
  const o1 = finiteOrZero(outMax);
  const result =
    Math.abs(i1 - i0) < 1e-9 ? o0 : o0 + ((val - i0) * (o1 - o0)) / (i1 - i0);
  if (!clamp) {
    return result;
  }
  const lo = Math.min(o0, o1);
  const hi = Math.max(o0, o1);
  return Math.min(hi, Math.max(lo, result));
}
