/**
 * SENSOR_CFG v2.1 behavior expectations (EVT rate vs publishMode / intervals).
 */
import {
  effectivePublishIntervalMs,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import type { Bitstream2SensorSamplePayload } from "../bridge/protocol";
import { computeSensorHz, UART_DPS368_SENSOR_ID, UART_SENSOR_NAMES } from "./uart-sensor-assert";
import {
  baseSensorCfg,
  defaultMaskForSensor,
  expectedFirmwareCfg,
  formatCfgOneLine,
} from "./uart-sensor-cfg-assert";
import { CFG_ACCESS_QUIET_MIN_SAMPLE_MS } from "../domains/config/sensor-cfg-access-policy";

/** Matches `BITSTREAM_BS_DPS368_HW_MIN_SAMPLE_MS` in firmware. */
const DPS368_HW_MIN_SAMPLE_MS = 1000;

const DEFAULT_MIN_PASS_RATIO = 0.75;
const DPS368_MIN_PASS_RATIO = 0.65;

export type BehaviorExpect =
  | { kind: "target_hz"; minRatio?: number; maxRatio?: number }
  | { kind: "min_hz"; hz: number }
  | { kind: "max_hz"; hz: number }
  | { kind: "max_evt"; count: number }
  | { kind: "min_evt"; count: number };

export type CfgBehaviorCase = {
  id: string;
  description: string;
  sensorId: number;
  patch: Partial<Bs2SensorConfig> & Pick<Bs2SensorConfig, "sensorId">;
  soakMs?: number;
  expect: BehaviorExpect;
  /** Disable other sensors during soak (default true). */
  isolate?: boolean;
};

export type PairedBehaviorCase = {
  id: string;
  description: string;
  sensorId: number;
  soakMs?: number;
  periodicPatch: Partial<Bs2SensorConfig> & Pick<Bs2SensorConfig, "sensorId">;
  onChangePatch: Partial<Bs2SensorConfig> & Pick<Bs2SensorConfig, "sensorId">;
  minRatio?: number;
};

export type AnyBehaviorCase =
  | ({ type: "single" } & CfgBehaviorCase)
  | ({ type: "paired" } & PairedBehaviorCase);

export function resolveBehaviorWrittenCfg(testCase: CfgBehaviorCase): Bs2SensorConfig {
  return expectedFirmwareCfg({
    ...baseSensorCfg(testCase.sensorId),
    ...testCase.patch,
  });
}

export function resolvePairedWrittenCfg(
  sensorId: number,
  patch: Partial<Bs2SensorConfig> & Pick<Bs2SensorConfig, "sensorId">,
): Bs2SensorConfig {
  return expectedFirmwareCfg({
    ...baseSensorCfg(sensorId),
    ...patch,
  });
}

export function disabledSensorCfg(sensorId: number): Bs2SensorConfig {
  return expectedFirmwareCfg({
    ...baseSensorCfg(sensorId),
    enabled: false,
    samplingIntervalMs: 1000,
    publishIntervalMs: 0,
  });
}

export function restoreAllSensorsCfg(): Bs2SensorConfig[] {
  return [0, 1, 2, 3].map((sensorId) =>
    expectedFirmwareCfg({
      sensorId,
      enabled: true,
      publishMode: 0,
      mask: defaultMaskForSensor(sensorId),
      samplingIntervalMs: 20,
      publishIntervalMs: 0,
      deltaX100: 0,
      minPublishIntervalMs: 0,
    }),
  );
}

function minPassRatioForSensor(sensorId: number, override?: number): number {
  if (override != null) {
    return override;
  }
  return sensorId === UART_DPS368_SENSOR_ID ? DPS368_MIN_PASS_RATIO : DEFAULT_MIN_PASS_RATIO;
}

/** Evaluate EVT rate/count against one behavior expectation. */
export function evaluateBehaviorExpect(
  sensorId: number,
  appliedCfg: Bs2SensorConfig,
  samples: readonly Bitstream2SensorSamplePayload[],
  elapsedMs: number,
  expect: BehaviorExpect,
): string[] {
  const errors: string[] = [];
  const name = UART_SENSOR_NAMES[sensorId] ?? `id${sensorId}`;
  const n = samples.filter((s) => s.sensorId === sensorId).length;
  const hz = computeSensorHz(samples as Bitstream2SensorSamplePayload[], sensorId, elapsedMs);

  switch (expect.kind) {
    case "target_hz": {
      const publishMs = effectivePublishIntervalMs(appliedCfg);
      const targetHz = publishMs > 0 ? 1000 / publishMs : 0;
      const minRatio = minPassRatioForSensor(sensorId, expect.minRatio);
      const maxRatio = expect.maxRatio ?? (1 / minRatio);
      const minHz = targetHz * minRatio;
      const maxHz = targetHz * maxRatio;
      if (n < 1 || hz < minHz) {
        errors.push(
          `${name}: ${n} evt (${hz.toFixed(2)} Hz), need >= ${minHz.toFixed(2)} Hz (target ${targetHz.toFixed(2)} Hz × ${minRatio})`,
        );
      } else if (hz > maxHz) {
        errors.push(
          `${name}: ${n} evt (${hz.toFixed(2)} Hz), need <= ${maxHz.toFixed(2)} Hz (target ${targetHz.toFixed(2)} Hz × ${maxRatio})`,
        );
      }
      break;
    }
    case "min_hz": {
      if (hz < expect.hz) {
        errors.push(`${name}: ${hz.toFixed(2)} Hz, need >= ${expect.hz.toFixed(2)} Hz (${n} evt)`);
      }
      break;
    }
    case "max_hz": {
      if (hz > expect.hz) {
        errors.push(`${name}: ${hz.toFixed(2)} Hz, need <= ${expect.hz.toFixed(2)} Hz (${n} evt)`);
      }
      break;
    }
    case "max_evt": {
      if (n > expect.count) {
        errors.push(`${name}: ${n} evt, need <= ${expect.count}`);
      }
      break;
    }
    case "min_evt": {
      if (n < expect.count) {
        errors.push(`${name}: ${n} evt, need >= ${expect.count}`);
      }
      break;
    }
    default: {
      const _exhaustive: never = expect;
      errors.push(`${name}: unknown expect kind ${String(_exhaustive)}`);
    }
  }

  return errors;
}

function envBehaviorCases(sensorId: number): AnyBehaviorCase[] {
  const tag = UART_SENSOR_NAMES[sensorId]?.toLowerCase() ?? `id${sensorId}`;

  if (sensorId === BS2_SENSOR_ID.DPS368)
  {
    return [
      {
        type: "single",
        id: `${tag}-periodic-1hz`,
        description: "publishMode=0 @ 1 Hz (DPS368 hw min sample 1000 ms)",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 0,
          mask: defaultMaskForSensor(sensorId),
          samplingIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
          publishIntervalMs: 0,
          deltaX100: 0,
          minPublishIntervalMs: 0,
        },
        soakMs: 4000,
        expect: { kind: "target_hz", minRatio: 0.65, maxRatio: 1.35 },
      },
      {
        type: "single",
        id: `${tag}-decimate-0.5hz`,
        description: "publishMode=0 sample 1 Hz, publish decimate 0.5 Hz",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 0,
          mask: defaultMaskForSensor(sensorId),
          samplingIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
          publishIntervalMs: 2000,
          deltaX100: 0,
          minPublishIntervalMs: 0,
        },
        soakMs: 6000,
        expect: { kind: "target_hz", minRatio: 0.65, maxRatio: 1.35 },
      },
      {
        type: "single",
        id: `${tag}-on-change-quiet`,
        description: "publishMode=1 high delta — EVT rate stays low vs periodic",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 1,
          mask: defaultMaskForSensor(sensorId),
          samplingIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
          publishIntervalMs: 0,
          deltaX100: 10000,
          minPublishIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
        },
        soakMs: 4000,
        expect: { kind: "max_hz", hz: 1.0 },
      },
      {
        type: "single",
        id: `${tag}-hybrid-floor`,
        description: "publishMode=2 hybrid — periodic floor at publishInterval (2 s)",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 2,
          mask: defaultMaskForSensor(sensorId),
          samplingIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
          publishIntervalMs: 2000,
          deltaX100: 10000,
          minPublishIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
        },
        soakMs: 6000,
        expect: { kind: "target_hz", minRatio: 0.65, maxRatio: 1.35 },
      },
      {
        type: "paired",
        id: `${tag}-periodic-beats-on-change`,
        description: "periodic EVT rate clearly exceeds on_change with high delta",
        sensorId,
        soakMs: 4000,
        periodicPatch: {
          sensorId,
          enabled: true,
          publishMode: 0,
          mask: defaultMaskForSensor(sensorId),
          samplingIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
          publishIntervalMs: 0,
          deltaX100: 0,
          minPublishIntervalMs: 0,
        },
        onChangePatch: {
          sensorId,
          enabled: true,
          publishMode: 1,
          mask: defaultMaskForSensor(sensorId),
          samplingIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
          publishIntervalMs: 0,
          deltaX100: 10000,
          minPublishIntervalMs: DPS368_HW_MIN_SAMPLE_MS,
        },
        minRatio: 2,
      },
    ];
  }

  return [
    {
      type: "single",
      id: `${tag}-periodic-10hz`,
      description: "publishMode=0 @ 10 Hz (sampling 100 ms)",
      sensorId,
      patch: {
        sensorId,
        enabled: true,
        publishMode: 0,
        mask: defaultMaskForSensor(sensorId),
        samplingIntervalMs: 100,
        publishIntervalMs: 0,
        deltaX100: 0,
        minPublishIntervalMs: 0,
      },
      soakMs: 3000,
      expect: { kind: "target_hz" },
    },
    {
      type: "single",
      id: `${tag}-decimate-5hz`,
      description: "publishMode=0 sample 50 Hz, publish decimate 5 Hz",
      sensorId,
      patch: {
        sensorId,
        enabled: true,
        publishMode: 0,
        mask: defaultMaskForSensor(sensorId),
        samplingIntervalMs: 20,
        publishIntervalMs: 200,
        deltaX100: 0,
        minPublishIntervalMs: 0,
      },
      soakMs: 3000,
      expect: { kind: "target_hz" },
    },
    {
      type: "single",
      id: `${tag}-on-change-quiet`,
      description: "publishMode=1 high delta — EVT rate stays low vs periodic",
      sensorId,
      patch: {
        sensorId,
        enabled: true,
        publishMode: 1,
        mask: defaultMaskForSensor(sensorId),
        samplingIntervalMs: CFG_ACCESS_QUIET_MIN_SAMPLE_MS,
        publishIntervalMs: 0,
        deltaX100: 10000,
        minPublishIntervalMs: CFG_ACCESS_QUIET_MIN_SAMPLE_MS,
      },
      soakMs: 4000,
      expect: { kind: "max_hz", hz: 1.0 },
    },
    {
      type: "single",
      id: `${tag}-hybrid-floor`,
      description: "publishMode=2 hybrid — periodic floor at publishInterval",
      sensorId,
      patch: {
        sensorId,
        enabled: true,
        publishMode: 2,
        mask: defaultMaskForSensor(sensorId),
        samplingIntervalMs: 500,
        publishIntervalMs: 500,
        deltaX100: 10000,
        minPublishIntervalMs: 500,
      },
      soakMs: 4000,
      expect: { kind: "target_hz", minRatio: 0.7, maxRatio: 1.35 },
    },
    {
      type: "paired",
      id: `${tag}-periodic-beats-on-change`,
      description: "periodic EVT rate clearly exceeds on_change with high delta",
      sensorId,
      soakMs: 3000,
      periodicPatch: {
        sensorId,
        enabled: true,
        publishMode: 0,
        mask: defaultMaskForSensor(sensorId),
        samplingIntervalMs: 20,
        publishIntervalMs: 0,
        deltaX100: 0,
        minPublishIntervalMs: 0,
      },
      onChangePatch: {
        sensorId,
        enabled: true,
        publishMode: 1,
        mask: defaultMaskForSensor(sensorId),
        samplingIntervalMs: CFG_ACCESS_QUIET_MIN_SAMPLE_MS,
        publishIntervalMs: 0,
        deltaX100: 10000,
        minPublishIntervalMs: CFG_ACCESS_QUIET_MIN_SAMPLE_MS,
      },
      minRatio: 3,
    },
  ];
}

export function buildCfgBehaviorCases(sensorIds: number[]): AnyBehaviorCase[] {
  const cases: AnyBehaviorCase[] = [];
  for (const sensorId of sensorIds) {
    if (sensorId === BS2_SENSOR_ID.BMI270) {
      cases.push({
        type: "single",
        id: "bmi270-periodic-10hz",
        description: "BMI270 raw periodic @ 10 Hz",
        sensorId,
        patch: {
          sensorId,
          enabled: true,
          publishMode: 0,
          mask: 0x07,
          samplingIntervalMs: 100,
          publishIntervalMs: 0,
          deltaX100: 0,
          minPublishIntervalMs: 0,
        },
        soakMs: 3000,
        expect: { kind: "target_hz", minRatio: 0.7 },
      });
      continue;
    }
    cases.push(...envBehaviorCases(sensorId));
  }
  return cases;
}

export { formatCfgOneLine };
