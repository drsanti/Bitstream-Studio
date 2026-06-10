import type { AnimationLabTwinComponentLive, AnimationLabTwinTrendKey } from "./digital-twin.types.js";

export const ANIMATION_LAB_TWIN_TREND_MAX_SAMPLES = 72;

/** Vertical inset (0–40) so peaks/troughs do not clip the SVG edges. */
export const ANIMATION_LAB_TWIN_SPARKLINE_VERTICAL_PAD_PCT = 10;

/**
 * Min–max sparkline scaling for absolute telemetry (°C, %, A).
 * Unlike Sensor Studio's zero-centered sparklines, twin trends are physical magnitudes.
 */
export function buildTwinSparklinePolylinePoints(
  samples: readonly number[],
  maxSamples: number = ANIMATION_LAB_TWIN_TREND_MAX_SAMPLES,
  verticalPadPct: number = ANIMATION_LAB_TWIN_SPARKLINE_VERTICAL_PAD_PCT,
): string {
  const bars = samples.slice(-maxSamples);
  if (bars.length === 0) {
    return "";
  }
  if (bars.length === 1) {
    return `0,50 100,50`;
  }

  let min = bars[0]!;
  let max = bars[0]!;
  for (let i = 1; i < bars.length; i += 1) {
    const value = bars[i]!;
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  const span = max - min;
  const pad = Math.max(0, Math.min(40, verticalPadPct));
  const usable = 100 - pad * 2;

  return bars
    .map((value, index) => {
      const x = (index / (bars.length - 1)) * 100;
      let y: number;
      if (!Number.isFinite(span) || span <= 1e-9) {
        y = 50;
      } else {
        const t = (value - min) / span;
        y = pad + (1 - t) * usable;
      }
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function twinTrendKey(componentId: string, signalKey: string): AnimationLabTwinTrendKey {
  return `${componentId}::${signalKey}`;
}

export function appendTwinTrendSamples(
  store: Record<AnimationLabTwinTrendKey, number[]>,
  components: readonly AnimationLabTwinComponentLive[],
  maxSamples: number = ANIMATION_LAB_TWIN_TREND_MAX_SAMPLES,
): Record<AnimationLabTwinTrendKey, number[]> {
  let next = store;
  for (const component of components) {
    for (const signal of component.signals) {
      if (!Number.isFinite(signal.value)) {
        continue;
      }
      const key = twinTrendKey(component.id, signal.key);
      const prev = next[key] ?? [];
      const row = [...prev, signal.value];
      const trimmed = row.length > maxSamples ? row.slice(-maxSamples) : row;
      if (trimmed !== prev) {
        if (next === store) {
          next = { ...store };
        }
        next[key] = trimmed;
      }
    }
  }
  return next;
}

export function readTwinTrendSamples(
  store: Record<AnimationLabTwinTrendKey, number[]>,
  componentId: string,
  signalKey: string,
): readonly number[] {
  return store[twinTrendKey(componentId, signalKey)] ?? [];
}
