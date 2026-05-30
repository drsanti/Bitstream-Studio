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

/** How the **Number** generator node edits `value` on the flow card (not the inspector). */
export type NumberConstantCardValueControl = "input" | "slider";

export function readNumberConstantCardValueControl(
  dc: Record<string, unknown>,
): NumberConstantCardValueControl {
  return dc.cardValueControl === "slider" ? "slider" : "input";
}

/**
 * Finite `[min, max]` and positive `step` for the on-card **slider** when clamp bounds are open-ended.
 * Expands the interval so the current coerced `displayValue` always lies inside.
 */
export function getNumberConstantSliderRange(
  dc: Record<string, unknown>,
  displayValue: number,
): { min: number; max: number; step: number } {
  const mode = readNumberConstantMode(dc);
  const cfgMin = readOptionalFiniteNumber(dc, "min");
  const cfgMax = readOptionalFiniteNumber(dc, "max");
  const cfgStep = readOptionalFiniteNumber(dc, "step");

  const v = Number.isFinite(displayValue) ? displayValue : 0;
  let min: number;
  let max: number;

  if (cfgMin != null && cfgMax != null) {
    min = Math.min(cfgMin, cfgMax);
    max = Math.max(cfgMin, cfgMax);
  } else if (cfgMin != null) {
    min = cfgMin;
    const span = Math.max(Math.abs(v - min), 1, Math.abs(min) * 0.1 + 1e-9);
    max = min + span;
  } else if (cfgMax != null) {
    max = cfgMax;
    const span = Math.max(Math.abs(v - max), 1, Math.abs(max) * 0.1 + 1e-9);
    min = max - span;
  } else {
    const half = Math.max(50, Math.abs(v) * 0.5, 1e-3);
    min = v - half;
    max = v + half;
  }

  if (v < min) {
    min = v;
  }
  if (v > max) {
    max = v;
  }
  if (!(max > min)) {
    max = min + (mode === "integer" ? 1 : 0.01);
  }

  let step: number;
  if (mode === "integer") {
    step = Math.max(1, Math.round(cfgStep ?? 1));
  } else {
    step =
      cfgStep != null && cfgStep > 0 && Number.isFinite(cfgStep)
        ? cfgStep
        : Math.max(1e-6, (max - min) / 256);
  }

  return { min, max, step };
}
