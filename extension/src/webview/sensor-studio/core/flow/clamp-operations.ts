import { readValueNormalizerInput as readClampInput } from "./value-normalizer-operations";

export { readClampInput };

export const CLAMP_INPUT_DEFAULTS = {
  value: 0,
  min: -1,
  max: 1,
} as const;

function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Clamp value to [min, max] (node-animator `clamp` parity). */
export function evaluateClamp(value: number, min: number, max: number): number {
  const val = finiteOrZero(value);
  const lo = Math.min(finiteOrZero(min), finiteOrZero(max));
  const hi = Math.max(finiteOrZero(min), finiteOrZero(max));
  return Math.min(hi, Math.max(lo, val));
}
