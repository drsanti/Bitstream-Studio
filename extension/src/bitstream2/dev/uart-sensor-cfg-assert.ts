/**
 * SENSOR_CFG v2.1 compare helpers (host normalize + firmware clamp parity).
 */
import {
  normalizeSensorCfg,
  type Bs2PublishMode,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import { UART_SENSOR_NAMES } from "./uart-sensor-assert";

const FW_SAMPLING_MIN_MS = 10;
const FW_SAMPLING_MAX_MS = 60000;
const FW_DELTA_MAX_X100 = 10000;

/** Expected cfg after `bitstream_bs_cfg_set_v21` + `bs_clamp_cfg` on CM55. */
export function expectedFirmwareCfg(written: Bs2SensorConfig): Bs2SensorConfig {
  const c = normalizeSensorCfg(written);

  let samplingIntervalMs = c.samplingIntervalMs;
  if (samplingIntervalMs < FW_SAMPLING_MIN_MS) {
    samplingIntervalMs = FW_SAMPLING_MIN_MS;
  } else if (samplingIntervalMs > FW_SAMPLING_MAX_MS) {
    samplingIntervalMs = FW_SAMPLING_MAX_MS;
  }

  let deltaX100 = c.deltaX100;
  if (deltaX100 > FW_DELTA_MAX_X100) {
    deltaX100 = FW_DELTA_MAX_X100;
  }

  let minPublishIntervalMs = c.minPublishIntervalMs;
  if (minPublishIntervalMs > samplingIntervalMs) {
    minPublishIntervalMs = samplingIntervalMs;
  }

  let publishIntervalMs = c.publishIntervalMs;
  if (publishIntervalMs > 0 && publishIntervalMs < samplingIntervalMs) {
    publishIntervalMs = samplingIntervalMs;
  }

  return normalizeSensorCfg({
    ...c,
    samplingIntervalMs,
    deltaX100,
    minPublishIntervalMs,
    publishIntervalMs,
  });
}

export type CfgFieldDiff = {
  field: keyof Bs2SensorConfig;
  expected: string;
  actual: string;
};

/** Compare two cfg rows; returns diffs (empty when equal). */
export function diffSensorCfg(expected: Bs2SensorConfig, actual: Bs2SensorConfig): CfgFieldDiff[] {
  const fields: (keyof Bs2SensorConfig)[] = [
    "sensorId",
    "enabled",
    "publishMode",
    "mask",
    "samplingIntervalMs",
    "deltaX100",
    "minPublishIntervalMs",
    "publishIntervalMs",
  ];
  const out: CfgFieldDiff[] = [];
  for (const field of fields) {
    const e = expected[field];
    const a = actual[field];
    if (e !== a) {
      out.push({
        field,
        expected: String(e),
        actual: String(a),
      });
    }
  }
  return out;
}

export function formatCfgOneLine(cfg: Bs2SensorConfig): string {
  const name = UART_SENSOR_NAMES[cfg.sensorId] ?? `id${cfg.sensorId}`;
  return (
    `${name} en=${cfg.enabled} mode=${cfg.publishMode} mask=0x${cfg.mask.toString(16)} ` +
    `samp=${cfg.samplingIntervalMs}ms pub=${cfg.publishIntervalMs}ms ` +
    `delta=${cfg.deltaX100} minPub=${cfg.minPublishIntervalMs}ms`
  );
}

export type CfgRoundtripCase = {
  id: string;
  description: string;
  sensorId: number;
  patch: Partial<Bs2SensorConfig> & Pick<Bs2SensorConfig, "sensorId">;
};

export function defaultMaskForSensor(sensorId: number): number {
  return sensorId === 0 ? 0x1f : 0x03;
}

export function baseSensorCfg(sensorId: number): Bs2SensorConfig {
  return normalizeSensorCfg({
    sensorId,
    enabled: true,
    publishMode: 0 as Bs2PublishMode,
    mask: defaultMaskForSensor(sensorId),
    samplingIntervalMs: 50,
    deltaX100: 0,
    minPublishIntervalMs: 0,
    publishIntervalMs: 0,
  });
}

export function buildCfgRoundtripCases(sensorIds: number[]): CfgRoundtripCase[] {
  const cases: CfgRoundtripCase[] = [];
  for (const sensorId of sensorIds) {
    const tag = UART_SENSOR_NAMES[sensorId]?.toLowerCase() ?? `id${sensorId}`;
    cases.push(
      {
        id: `${tag}-periodic-50hz`,
        description: "publishMode=0 periodic @ 50 Hz",
        sensorId,
        patch: { sensorId, publishMode: 0, samplingIntervalMs: 20, publishIntervalMs: 0 },
      },
      {
        id: `${tag}-disabled`,
        description: "enabled=false (others unchanged fields)",
        sensorId,
        patch: { sensorId, enabled: false, samplingIntervalMs: 1000, publishIntervalMs: 0 },
      },
      {
        id: `${tag}-on-change`,
        description: "publishMode=1 on_change with delta + minPublish",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 1,
          samplingIntervalMs: 50,
          deltaX100: 1,
          minPublishIntervalMs: 20,
          publishIntervalMs: 0,
        },
      },
      {
        id: `${tag}-hybrid`,
        description: "publishMode=2 hybrid with delta + minPublish",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 2,
          samplingIntervalMs: 50,
          deltaX100: 5,
          minPublishIntervalMs: 25,
          publishIntervalMs: 0,
        },
      },
      {
        id: `${tag}-sample-10hz`,
        description: "samplingIntervalMs=100 (10 Hz)",
        sensorId,
        patch: { sensorId, enabled: true, publishMode: 0, samplingIntervalMs: 100, publishIntervalMs: 0 },
      },
      {
        id: `${tag}-publish-decimate`,
        description: "sample 50 Hz, publish 5 Hz (publishIntervalMs=200)",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 0,
          samplingIntervalMs: 20,
          publishIntervalMs: 200,
        },
      },
      {
        id: `${tag}-mask-partial`,
        description: sensorId === 0 ? "BMI270 mask ACC+GYR 0x03" : "env mask single channel 0x01",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          mask: sensorId === 0 ? 0x03 : 0x01,
        },
      },
      {
        id: `${tag}-clamp-min-sample`,
        description: "firmware clamps samplingIntervalMs below 10 → 10",
        sensorId,
        patch: { sensorId, enabled: true, samplingIntervalMs: 5, publishIntervalMs: 0 },
      },
      {
        id: `${tag}-clamp-min-publish`,
        description: "minPublishIntervalMs > sampling → clamped to sampling",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 1,
          samplingIntervalMs: 50,
          minPublishIntervalMs: 200,
          deltaX100: 1,
        },
      },
    );
  }
  return cases;
}

export function resolveRoundtripWrittenCfg(testCase: CfgRoundtripCase): Bs2SensorConfig {
  return normalizeSensorCfg({
    ...baseSensorCfg(testCase.sensorId),
    ...testCase.patch,
  });
}
