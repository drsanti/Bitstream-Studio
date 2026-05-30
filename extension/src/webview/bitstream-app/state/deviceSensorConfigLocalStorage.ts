import type { DeviceSensorConfigRow } from "./bitstreamDeviceSensorConfig.store.js";

export const DEVICE_SENSOR_CONFIG_STORAGE_KEY = "ternion.bitstream.deviceSensorConfig.v1";

const SCHEMA_VERSION = 1 as const;

type PersistedEnvelopeV1 = {
  schemaVersion: typeof SCHEMA_VERSION;
  /** Keys are stringified `sourceId` for JSON stability. */
  bySourceId: Record<string, DeviceSensorConfigRow>;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Merge persisted rows over seeds only when **`updatedAtMs`** is newer (or seed is missing).
 * Never applies persisted rows with **`updatedAtMs <= 0`**.
 */
export function mergePersistedDeviceSensorRowsIntoSeeds(
  seeds: Partial<Record<number, DeviceSensorConfigRow>>,
  persisted: Partial<Record<number, DeviceSensorConfigRow>> | null,
): Partial<Record<number, DeviceSensorConfigRow>> {
  if (persisted == null) {
    return { ...seeds };
  }
  const out: Partial<Record<number, DeviceSensorConfigRow>> = { ...seeds };
  for (const [key, row] of Object.entries(persisted)) {
    const sourceId = Number(key);
    if (!Number.isFinite(sourceId) || row == null) {
      continue;
    }
    if (typeof row.updatedAtMs !== "number" || row.updatedAtMs <= 0) {
      continue;
    }
    const prev = out[sourceId];
    const prevTs = prev?.updatedAtMs ?? 0;
    if (row.updatedAtMs >= prevTs) {
      out[sourceId] = {
        sourceId,
        enabled: Boolean(row.enabled),
        publishMode: row.publishMode,
        samplingIntervalMs: row.samplingIntervalMs,
        deltaX100: row.deltaX100,
        minPublishIntervalMs: row.minPublishIntervalMs,
        publishIntervalMs: row.publishIntervalMs ?? 0,
        updatedAtMs: row.updatedAtMs,
      };
    }
  }
  return out;
}

export function readPersistedDeviceSensorConfigRows(): Partial<
  Record<number, DeviceSensorConfigRow>
> | null {
  if (!isBrowser()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(DEVICE_SENSOR_CONFIG_STORAGE_KEY);
    if (raw == null || raw.trim() === "") {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== "object") {
      return null;
    }
    const env = parsed as Partial<PersistedEnvelopeV1>;
    if (env.schemaVersion !== SCHEMA_VERSION || env.bySourceId == null || typeof env.bySourceId !== "object") {
      return null;
    }
    const out: Partial<Record<number, DeviceSensorConfigRow>> = {};
    for (const [k, row] of Object.entries(env.bySourceId)) {
      const sourceId = Number(k);
      if (!Number.isFinite(sourceId) || row == null || typeof row !== "object") {
        continue;
      }
      const r = row as Partial<DeviceSensorConfigRow>;
      if (typeof r.updatedAtMs !== "number" || r.updatedAtMs <= 0) {
        continue;
      }
      out[sourceId] = {
        sourceId,
        enabled: Boolean(r.enabled),
        publishMode: typeof r.publishMode === "number" ? r.publishMode : 2,
        samplingIntervalMs: typeof r.samplingIntervalMs === "number" ? r.samplingIntervalMs : 250,
        deltaX100: typeof r.deltaX100 === "number" ? r.deltaX100 : 0,
        minPublishIntervalMs: typeof r.minPublishIntervalMs === "number" ? r.minPublishIntervalMs : 0,
        publishIntervalMs: typeof r.publishIntervalMs === "number" ? r.publishIntervalMs : 0,
        updatedAtMs: r.updatedAtMs,
      };
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function writePersistedDeviceSensorConfigRows(
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>,
): void {
  if (!isBrowser()) {
    return;
  }
  try {
    const bySourceIdOut: Record<string, DeviceSensorConfigRow> = {};
    for (const [k, row] of Object.entries(bySourceId)) {
      const sourceId = Number(k);
      if (!Number.isFinite(sourceId) || row == null) {
        continue;
      }
      if (typeof row.updatedAtMs !== "number" || row.updatedAtMs <= 0) {
        continue;
      }
      bySourceIdOut[String(sourceId)] = {
        sourceId,
        enabled: row.enabled,
        publishMode: row.publishMode,
        samplingIntervalMs: row.samplingIntervalMs,
        deltaX100: row.deltaX100,
        minPublishIntervalMs: row.minPublishIntervalMs,
        publishIntervalMs: row.publishIntervalMs ?? 0,
        updatedAtMs: row.updatedAtMs,
      };
    }
    const env: PersistedEnvelopeV1 = {
      schemaVersion: SCHEMA_VERSION,
      bySourceId: bySourceIdOut,
    };
    window.localStorage.setItem(DEVICE_SENSOR_CONFIG_STORAGE_KEY, JSON.stringify(env));
  } catch {
    // ignore quota / private mode
  }
}
