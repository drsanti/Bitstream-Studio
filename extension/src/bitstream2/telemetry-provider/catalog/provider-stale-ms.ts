import { DEFAULT_PROVIDER_STALE_MS } from "../provider-stale-tracker";

const STALE_MIN_MS = 500;
const STALE_MAX_MS = 10_000;
const STALE_INTERVAL_MULTIPLIER = 3;

/** Derive `staleAfterMs` from catalog publish defaults (~3 missed sample periods). */
export function staleAfterMsFromSensorDefaults(defaults: {
  samplingIntervalMs?: number | string;
  publishIntervalMs?: number | string;
}): number {
  const publishIntervalMs = Number(defaults.publishIntervalMs ?? 0);
  const samplingIntervalMs = Number(defaults.samplingIntervalMs ?? 0);
  const intervalMs =
    publishIntervalMs > 0
      ? publishIntervalMs
      : samplingIntervalMs > 0
        ? samplingIntervalMs
        : 1000;
  return Math.min(STALE_MAX_MS, Math.max(STALE_MIN_MS, intervalMs * STALE_INTERVAL_MULTIPLIER));
}

export function createProviderStaleResolver(
  bySensor?: ReadonlyMap<string, number>,
  fallbackMs: number = DEFAULT_PROVIDER_STALE_MS,
): (sensor: string) => number {
  return (sensor) => bySensor?.get(sensor) ?? fallbackMs;
}
