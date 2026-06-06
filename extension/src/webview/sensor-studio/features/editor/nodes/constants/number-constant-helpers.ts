/** Persisted on **`number-constant`** `defaultConfig` (subset). */
export type NumberConstantMode = "float" | "integer";

export function readNumberConstantMode(dc: Record<string, unknown>): NumberConstantMode {
  return dc.numberMode === "integer" ? "integer" : "float";
}

export function readOptionalFiniteNumber(
  dc: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = dc[key];
  if (v === null || v === undefined) {
    return undefined;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  return undefined;
}

function asFinite(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Clamp, optional step quantize, then integer round — used by simulation and on-card edits
 * so the wire always matches inspector rules.
 */
export function coerceNumberConstantValue(dc: Record<string, unknown>, raw: unknown): number {
  let v = asFinite(raw, 0);
  const min = readOptionalFiniteNumber(dc, "min");
  const max = readOptionalFiniteNumber(dc, "max");
  if (min != null && max != null) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    v = Math.min(hi, Math.max(lo, v));
  } else {
    if (min != null) {
      v = Math.max(min, v);
    }
    if (max != null) {
      v = Math.min(max, v);
    }
  }

  const step = readOptionalFiniteNumber(dc, "step");
  if (step != null && step > 0 && Number.isFinite(step)) {
    v = Math.round(v / step) * step;
  }

  if (readNumberConstantMode(dc) === "integer") {
    v = Math.round(v);
  }
  return v;
}

