function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

export function readValueNormalizerInput(
  wired: unknown,
  configValue: unknown,
  fallback: number,
): number {
  if (typeof wired === "number" && Number.isFinite(wired)) {
    return wired;
  }
  if (typeof configValue === "number" && Number.isFinite(configValue)) {
    return configValue;
  }
  const n = Number(configValue);
  return Number.isFinite(n) ? n : fallback;
}

/** Map value from [inMin, inMax] to [outMin, outMax] with clamp (node-animator parity). */
export function evaluateValueNormalizer(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const val = finiteOrZero(value);
  const i0 = finiteOrZero(inMin);
  const i1 = finiteOrZero(inMax);
  const o0 = finiteOrZero(outMin);
  const o1 = finiteOrZero(outMax);
  const result =
    Math.abs(i1 - i0) < 1e-9 ? o0 : o0 + ((val - i0) * (o1 - o0)) / (i1 - i0);
  const lo = Math.min(o0, o1);
  const hi = Math.max(o0, o1);
  return Math.min(hi, Math.max(lo, result));
}
