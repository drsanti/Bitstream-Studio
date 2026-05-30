import type { Bitstream2DevSimStatePayload } from "../../../bitstream2/bridge/protocol";
import {
  effectivePublishIntervalMs,
  isSensorStreamRunnable,
  type Bs2SensorConfig,
} from "../../../bitstream2/domains/config/sensor-config";

export function sensorCfgSignature(c: Bs2SensorConfig): string {
  return [
    c.sensorId,
    c.enabled ? 1 : 0,
    c.publishMode,
    c.mask,
    c.samplingIntervalMs,
    c.publishIntervalMs,
    c.deltaX100,
    c.minPublishIntervalMs,
  ].join("|");
}

export function isSensorCfgDirty(draft: Bs2SensorConfig, applied: Bs2SensorConfig): boolean {
  return sensorCfgSignature(draft) !== sensorCfgSignature(applied);
}

/** Whether the simulator is actively streaming this sensor (applied config). */
export function isAppliedSensorStreaming(
  sensorId: number,
  simState: Bitstream2DevSimStatePayload | null | undefined,
): boolean {
  if (!simState) return false;
  if (simState.streamActiveSensorIds.includes(sensorId)) return true;
  const cfg = simState.configs.find((c) => c.sensorId === sensorId);
  if (!cfg) return false;
  return isSensorStreamRunnable(cfg);
}

const PUBLISH_MODE_LABEL: Record<number, string> = {
  0: "periodic",
  1: "on_change",
  2: "hybrid",
};

export function streamSummary(cfg: Bs2SensorConfig): string {
  if (!isSensorStreamRunnable(cfg)) {
    return "off";
  }
  const mode = PUBLISH_MODE_LABEL[cfg.publishMode] ?? `mode${cfg.publishMode}`;
  const sample = cfg.samplingIntervalMs;
  const pub = effectivePublishIntervalMs(cfg);
  if (pub !== sample && cfg.publishIntervalMs > 0) {
    return `sample ${sample} ms · tx ${pub} ms · ${mode}`;
  }
  return `~${sample} ms · ${mode}`;
}

export type SensorCfgFieldKey =
  | "enabled"
  | "publishMode"
  | "mask"
  | "samplingIntervalMs"
  | "publishIntervalMs"
  | "deltaX100"
  | "minPublishIntervalMs";

export function changedSensorCfgFields(
  draft: Bs2SensorConfig,
  applied: Bs2SensorConfig,
): SensorCfgFieldKey[] {
  const out: SensorCfgFieldKey[] = [];
  if (draft.enabled !== applied.enabled) out.push("enabled");
  if (draft.publishMode !== applied.publishMode) out.push("publishMode");
  if (draft.mask !== applied.mask) out.push("mask");
  if (draft.samplingIntervalMs !== applied.samplingIntervalMs) out.push("samplingIntervalMs");
  if (draft.publishIntervalMs !== applied.publishIntervalMs) out.push("publishIntervalMs");
  if (draft.deltaX100 !== applied.deltaX100) out.push("deltaX100");
  if (draft.minPublishIntervalMs !== applied.minPublishIntervalMs) {
    out.push("minPublishIntervalMs");
  }
  return out;
}

export function appliedFieldHint(field: SensorCfgFieldKey, applied: Bs2SensorConfig): string {
  switch (field) {
    case "enabled":
      return applied.enabled ? "on" : "off";
    case "publishMode":
      return PUBLISH_MODE_LABEL[applied.publishMode] ?? String(applied.publishMode);
    case "mask":
      return `0x${applied.mask.toString(16)}`;
    case "samplingIntervalMs":
      return `${applied.samplingIntervalMs} ms`;
    case "publishIntervalMs":
      return applied.publishIntervalMs > 0
        ? `${applied.publishIntervalMs} ms`
        : "same as sampling";
    case "deltaX100":
      return `${applied.deltaX100} (×0.01)`;
    case "minPublishIntervalMs":
      return `${applied.minPublishIntervalMs} ms`;
  }
}

export const CFG_SET_REQUEST_PREFIX = "sim-cfg-set-";

export function cfgSetRequestId(sensorId: number): string {
  return `${CFG_SET_REQUEST_PREFIX}${sensorId}-${Date.now()}`;
}

export function parseCfgSetRequestSensorId(requestId: string): number | null {
  if (!requestId.startsWith(CFG_SET_REQUEST_PREFIX)) return null;
  const rest = requestId.slice(CFG_SET_REQUEST_PREFIX.length);
  const dash = rest.indexOf("-");
  if (dash < 0) return null;
  const id = Number(rest.slice(0, dash));
  return Number.isFinite(id) ? id : null;
}
