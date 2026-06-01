import type { AnimationLabTwinComponentLive, AnimationLabTwinTrendKey } from "./digital-twin.types.js";

export const ANIMATION_LAB_TWIN_TREND_MAX_SAMPLES = 60;

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
