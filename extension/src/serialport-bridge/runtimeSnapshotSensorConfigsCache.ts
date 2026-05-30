import type { BridgeRuntimeSnapshotSensorConfigs } from "./protocol";

/**
 * Merge inbound **`RUNTIME_SNAPSHOT.sensorConfigs`** into a bridge-side cache.
 * Rows without **`updatedAtMs > 0`** are ignored (same “verified” semantics as the webview store).
 * Older **`updatedAtMs`** never overwrites newer cached rows for the same **`sourceId`**.
 */
export function mergeBridgeRuntimeSensorConfigsCache(
  prev: BridgeRuntimeSnapshotSensorConfigs | null,
  inbound: unknown,
): BridgeRuntimeSnapshotSensorConfigs | null {
  if (inbound == null || typeof inbound !== "object") {
    return prev;
  }
  const incoming = inbound as BridgeRuntimeSnapshotSensorConfigs;
  const base: BridgeRuntimeSnapshotSensorConfigs = { ...(prev ?? {}) };
  for (const [key, row] of Object.entries(incoming)) {
    const sourceId = Number(key);
    if (!Number.isFinite(sourceId) || row == null || typeof row !== "object") {
      continue;
    }
    const u = row.updatedAtMs;
    if (typeof u !== "number" || u <= 0) {
      continue;
    }
    const prevRow = base[sourceId];
    if (prevRow != null && typeof prevRow.updatedAtMs === "number" && u < prevRow.updatedAtMs) {
      continue;
    }
    base[sourceId] = {
      enabled: Boolean(row.enabled),
      publishMode: typeof row.publishMode === "number" ? row.publishMode : 2,
      samplingIntervalMs: typeof row.samplingIntervalMs === "number" ? row.samplingIntervalMs : 250,
      deltaX100: typeof row.deltaX100 === "number" ? row.deltaX100 : 0,
      minPublishIntervalMs: typeof row.minPublishIntervalMs === "number" ? row.minPublishIntervalMs : 0,
      updatedAtMs: u,
    };
  }
  return Object.keys(base).length > 0 ? base : null;
}
