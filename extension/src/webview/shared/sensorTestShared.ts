import {
  defaultMaskForSensor,
  diffSensorCfg,
  formatCfgOneLine,
} from "../../bitstream2/dev/uart-sensor-cfg-assert";
import {
  normalizeSensorCfg,
  type Bs2SensorConfig,
} from "../../bitstream2/domains/config/sensor-config";
import { BS2_SENSOR_ID } from "../../bitstream2/domains/sensors/sensor-ids";

export const SENSOR_TEST_IDS: readonly number[] = [
  BS2_SENSOR_ID.BMI270,
  BS2_SENSOR_ID.DPS368,
  BS2_SENSOR_ID.SHT40,
  BS2_SENSOR_ID.BMM350,
];

export const SENSOR_TEST_LABEL: Record<number, string> = {
  [BS2_SENSOR_ID.BMI270]: "BMI270",
  [BS2_SENSOR_ID.BMM350]: "BMM350",
  [BS2_SENSOR_ID.SHT40]: "SHT40",
  [BS2_SENSOR_ID.DPS368]: "DPS368",
};

export type SensorTestPreset = {
  id: string;
  label: string;
  cfgPatch: Partial<Bs2SensorConfig>;
};

export const SENSOR_TEST_PRESETS: readonly SensorTestPreset[] = [
  {
    id: "periodic-10hz",
    label: "Periodic 10 Hz",
    cfgPatch: { enabled: true, publishMode: 0, samplingIntervalMs: 100, publishIntervalMs: 0 },
  },
  {
    id: "periodic-50hz",
    label: "Periodic 50 Hz",
    cfgPatch: { enabled: true, publishMode: 0, samplingIntervalMs: 20, publishIntervalMs: 0 },
  },
  {
    id: "decimate-5hz",
    label: "Sample 50 Hz, publish 5 Hz",
    cfgPatch: { enabled: true, publishMode: 0, samplingIntervalMs: 20, publishIntervalMs: 200 },
  },
  {
    id: "on-change-quiet",
    label: "On-change (quiet)",
    cfgPatch: {
      enabled: true,
      publishMode: 1,
      samplingIntervalMs: 500,
      publishIntervalMs: 0,
      deltaX100: 10000,
      minPublishIntervalMs: 500,
    },
  },
  {
    id: "hybrid-floor-2hz",
    label: "Hybrid floor 2 Hz",
    cfgPatch: {
      enabled: true,
      publishMode: 2,
      samplingIntervalMs: 500,
      publishIntervalMs: 500,
      deltaX100: 10000,
      minPublishIntervalMs: 500,
    },
  },
];

export type SensorTestUiStatus = {
  tone: "idle" | "ok" | "warning" | "error";
  message: string;
};

export type SensorTestLastSample = {
  mask: number;
  valuesLen: number;
  atMs: number;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function defaultSensorTestCfg(sensorId: number): Bs2SensorConfig {
  return normalizeSensorCfg({
    sensorId,
    enabled: true,
    publishMode: 0,
    mask: defaultMaskForSensor(sensorId),
    samplingIntervalMs: 100,
    publishIntervalMs: 0,
    deltaX100: 0,
    minPublishIntervalMs: 0,
  });
}

export function quietBusCfg(sensorId: number): Bs2SensorConfig {
  return normalizeSensorCfg({
    sensorId,
    enabled: false,
    publishMode: 0,
    mask: defaultMaskForSensor(sensorId),
    samplingIntervalMs: 1000,
    publishIntervalMs: 0,
    deltaX100: 0,
    minPublishIntervalMs: 0,
  });
}

export function formatSensorTestCfg(cfg: Bs2SensorConfig): string {
  return formatCfgOneLine(cfg);
}

export function diffCfgMessages(expected: Bs2SensorConfig, actual: Bs2SensorConfig): string[] {
  return diffSensorCfg(expected, actual).map(
    (d) => `${String(d.field)} expected=${d.expected} got=${d.actual}`,
  );
}

export function rateFromWindow(timestampsMs: readonly number[], windowMs: number): number {
  if (windowMs <= 0) {
    return 0;
  }
  return (timestampsMs.length * 1000) / windowMs;
}

export function checkPayloadMaskIssues(
  sensorId: number,
  cfg: Bs2SensorConfig | undefined,
  last: SensorTestLastSample | undefined,
): string[] {
  if (!cfg || !last) {
    return [];
  }
  const issues: string[] = [];
  if (sensorId === BS2_SENSOR_ID.BMI270) {
    const expectedMask = cfg.mask & 0x1f;
    if ((last.mask & expectedMask) !== expectedMask) {
      issues.push(`mask: expected include 0x${expectedMask.toString(16)}, got 0x${last.mask.toString(16)}`);
    }
    return issues;
  }
  if ((last.mask & cfg.mask) !== cfg.mask) {
    issues.push(`mask: expected include 0x${cfg.mask.toString(16)}, got 0x${last.mask.toString(16)}`);
  }
  return issues;
}
