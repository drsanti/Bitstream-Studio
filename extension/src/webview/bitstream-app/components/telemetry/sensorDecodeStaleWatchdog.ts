import type { BitstreamSensorSourceHint } from "../../../bitstream/index.js";
import type { DeviceSensorConfigRow } from "../../state/bitstreamDeviceSensorConfig.store.js";
import type { HandshakeLifecycleState } from "../../state/bitstreamLive.store.js";
import {
  computeWorstSampleAgeMs,
  SENSOR_RX_HINTS,
} from "../../ui/BitstreamTelemetryRxBadges.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../constants/sensorSourceIds.js";

const HINT_TO_SOURCE_ID: Record<BitstreamSensorSourceHint, number> = {
  sht40: SENSOR_SOURCE_ID_SHT40,
  dps368: SENSOR_SOURCE_ID_DPS368,
  bmm350: SENSOR_SOURCE_ID_BMM350,
  bmi270: SENSOR_SOURCE_ID_BMI270,
};

function clampSamplingIntervalMs(raw: number | undefined): number {
  if (raw == null || !Number.isFinite(raw)) {
    return 250;
  }
  return Math.max(10, Math.min(60_000, raw));
}

function isSensorRowEnabled(row: DeviceSensorConfigRow | undefined): boolean {
  if (row == null) {
    return true;
  }
  return row.enabled !== false;
}

export type SensorDecodeStaleIntervalMultiplier = 2 | 3 | 4;

/**
 * Safety net when device `samplingIntervalMs` in the store is stale vs real firmware cadence.
 * Matches rose RX badge territory (multi-second gaps) regardless of cfg interval.
 */
export const SENSOR_DECODE_ABSOLUTE_STALE_RECOVER_MS = 3000;

/** Beyond this wall age, auto-recover ignores hourly cap and retries aggressively. */
export const SENSOR_DECODE_CRITICAL_STALE_MS = 60_000;

export function clampSensorDecodeStaleIntervalMultiplier(
  value: unknown,
): SensorDecodeStaleIntervalMultiplier {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 2;
  if (n <= 2) {
    return 2;
  }
  if (n >= 4) {
    return 4;
  }
  return 3;
}

export type StaleEnabledSensorSnapshot = {
  hint: BitstreamSensorSourceHint;
  ageMs: number;
  intervalMs: number;
  thresholdMs: number;
};

/** Per enabled sensor: age since last decode vs `intervalMs × multiplier`. */
export function listStaleEnabledSensorsBeyondInterval(args: {
  lastAtByHint: Record<string, number | null>;
  nowMs: number;
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>;
  multiplier: SensorDecodeStaleIntervalMultiplier;
}): StaleEnabledSensorSnapshot[] {
  const { lastAtByHint, nowMs, bySourceId, multiplier } = args;
  const stale: StaleEnabledSensorSnapshot[] = [];

  for (const hint of SENSOR_RX_HINTS) {
    const sid = HINT_TO_SOURCE_ID[hint];
    const row = bySourceId[sid];
    if (!isSensorRowEnabled(row)) {
      continue;
    }
    const lastAt = lastAtByHint[hint];
    if (typeof lastAt !== "number") {
      continue;
    }
    const intervalMs = clampSamplingIntervalMs(row?.samplingIntervalMs);
    const thresholdMs = intervalMs * multiplier;
    const ageMs = Math.max(0, nowMs - lastAt);
    if (ageMs > thresholdMs) {
      stale.push({ hint, ageMs, intervalMs, thresholdMs });
    }
  }

  return stale;
}

export function computeSensorDecodeStaleBeyondInterval(args: {
  lastAtByHint: Record<string, number | null>;
  nowMs: number;
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>;
  multiplier: SensorDecodeStaleIntervalMultiplier;
}): boolean {
  return listStaleEnabledSensorsBeyondInterval(args).length > 0;
}

/**
 * Decode pipeline should recover when any enabled sensor exceeds N× its configured sampling interval.
 * Does not require BRx (serial may still show bytes while HostSession stops decoding).
 */
export function computeSensorDecodeStaleRecoverLikely(args: {
  /** UART: serial open. Simulator: WS transport connected (no COM). */
  transportReady: boolean;
  handshakeState: HandshakeLifecycleState;
  sampleCount: number;
  lastAtByHint: Record<string, number | null>;
  nowMs: number;
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>;
  multiplier: SensorDecodeStaleIntervalMultiplier;
}): boolean {
  const {
    transportReady,
    handshakeState,
    sampleCount,
    lastAtByHint,
    nowMs,
    bySourceId,
    multiplier,
  } = args;
  if (!transportReady || handshakeState !== "passed" || sampleCount <= 0) {
    return false;
  }
  const worstAgeMs = computeWorstSampleAgeMs(lastAtByHint, nowMs, bySourceId);
  if (
    worstAgeMs != null &&
    worstAgeMs >= SENSOR_DECODE_ABSOLUTE_STALE_RECOVER_MS
  ) {
    return true;
  }
  return computeSensorDecodeStaleBeyondInterval({
    lastAtByHint,
    nowMs,
    bySourceId,
    multiplier,
  });
}

/** Short debounce before HostSession reset (one extra missed frame at high rate). */
export function computeStaleRecoverSustainMs(
  staleSensors: readonly StaleEnabledSensorSnapshot[],
): number {
  if (staleSensors.length === 0) {
    return 400;
  }
  const minThreshold = Math.min(...staleSensors.map((s) => s.thresholdMs));
  return Math.max(250, Math.min(1200, Math.round(minThreshold * 0.5)));
}

export function formatSensorDecodeStaleRecoverSnapshot(parts: {
  multiplier: SensorDecodeStaleIntervalMultiplier;
  staleSensors: readonly StaleEnabledSensorSnapshot[];
  sensorChannelDecodeRejectCount: number;
  sampleCount: number;
}): string {
  const detail =
    parts.staleSensors.length === 0
      ? "none"
      : parts.staleSensors
          .map(
            (s) =>
              `${s.hint}:age=${Math.round(s.ageMs)}ms>thr=${s.thresholdMs}ms(int=${s.intervalMs}×${parts.multiplier})`,
          )
          .join(" ");
  return `[telemetry/stale-recover] mult=${parts.multiplier} stale=${detail} rejects=${parts.sensorChannelDecodeRejectCount} sampleCount=${parts.sampleCount} action=HostSessionReset`;
}
