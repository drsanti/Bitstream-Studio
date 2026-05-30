import type { DeviceSensorConfigRow } from "../../../bitstream-app/state/bitstreamDeviceSensorConfig.store";

function clampMs(value: number, minMs: number, maxMs: number): number {
  if (!Number.isFinite(value)) {
    return minMs;
  }
  const rounded = Math.round(value);
  return Math.min(maxMs, Math.max(minMs, rounded));
}

/**
 * Fallback when no verified `sensor.cfg` row exists: avoid labeling samples STALE/OFFLINE too aggressively.
 */
export const SENSOR_HEALTH_FALLBACK_LIVE_MAX_AGE_MS = 2000;
export const SENSOR_HEALTH_FALLBACK_STALE_MAX_AGE_MS = 9000;

/**
 * Converts a verified device cfg row into LIVE vs STALE age thresholds (exclusive upper bounds for LIVE bucket).
 */
export function sensorHealthAgeThresholdsMs(
  row: Pick<
    DeviceSensorConfigRow,
    "publishMode" | "samplingIntervalMs" | "minPublishIntervalMs"
  > | null,
): { liveMaxAgeMs: number; staleMaxAgeMs: number } {
  if (row == null) {
    return {
      liveMaxAgeMs: SENSOR_HEALTH_FALLBACK_LIVE_MAX_AGE_MS,
      staleMaxAgeMs: SENSOR_HEALTH_FALLBACK_STALE_MAX_AGE_MS,
    };
  }

  const sampling = clampMs(row.samplingIntervalMs, 10, 120_000);
  const minPublish = clampMs(row.minPublishIntervalMs, 10, 120_000);

  // Heuristic:
  // - Periodic mode (publishMode === 0) is paced primarily by sampling.
  // - Delta / hybrid modes cannot publish faster than minPublishIntervalMs while sampling sets driver cadence.
  const cadenceMs =
    row.publishMode === 0 ? Math.max(sampling, minPublish) : Math.max(sampling, minPublish);

  const liveMaxAgeMs = clampMs(cadenceMs * 1.75 + 200, 400, 15_000);
  let staleMaxAgeMs = clampMs(cadenceMs * 5 + 800, 1200, 45_000);
  if (staleMaxAgeMs <= liveMaxAgeMs + 250) {
    staleMaxAgeMs = liveMaxAgeMs + 500;
  }
  return { liveMaxAgeMs, staleMaxAgeMs };
}
