/**
 * Matrix test case definitions for UART sensor validation.
 */
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import { UART_ALL_SENSOR_IDS } from "./uart-sensor-assert";
import type { Bs2PublishMode } from "../domains/config/sensor-config";

export type MatrixTier = "smoke" | "standard" | "exhaustive";

export type MatrixSensorCfgOverride = {
  mask?: number;
  publishMode?: Bs2PublishMode;
  /** Sampling rate (Hz). */
  hz?: number;
  /** Publish rate (Hz); `0` or omitted = same as sampling. */
  publishHz?: number;
  deltaX100?: number;
  minPublishIntervalMs?: number;
};

export type MatrixTestCase = {
  id: string;
  tiers: MatrixTier[];
  description: string;
  activeSensorIds: number[];
  defaults?: MatrixSensorCfgOverride;
  perSensor?: Partial<Record<number, MatrixSensorCfgOverride>>;
  bmi270Mode?: "raw" | "fusion" | "hybrid";
  fusionFeedHz?: number;
  soakMs?: number;
  /** Minimum fraction of expected telemetry Hz (periodic mode). */
  minPassRatio?: number;
  /** Skip Hz threshold; require ≥1 EVT + payload checks only. */
  payloadOnly?: boolean;
  /** Run SENSOR_CFG GET on active sensors after soak. */
  requireCfgGet?: boolean;
  /** Max EVT count allowed from disabled sensors (when all four are configured). */
  disabledMaxEvt?: number;
  /** When true, do not fail on EVT from non-active sensors (isolation cases). */
  skipDisabledEvtCheck?: boolean;
};

function allSensors(hz = 50): MatrixTestCase {
  return {
    id: "all-raw-full",
    tiers: ["smoke", "standard"],
    description: "All sensors raw @ full mask periodic",
    activeSensorIds: [...UART_ALL_SENSOR_IDS],
    defaults: { hz, publishMode: 0, mask: undefined },
    bmi270Mode: "raw",
    perSensor: {
      [BS2_SENSOR_ID.BMI270]: { mask: 0x1f },
      [BS2_SENSOR_ID.BMM350]: { mask: 0x03 },
      [BS2_SENSOR_ID.SHT40]: { mask: 0x03 },
      [BS2_SENSOR_ID.DPS368]: { mask: 0x03 },
    },
  };
}

function onlySensor(sensorId: number, name: string, mask = 0x03): MatrixTestCase {
  return {
    id: `only-${name.toLowerCase()}`,
    tiers: ["smoke", "standard"],
    description: `Only ${name} enabled`,
    activeSensorIds: [sensorId],
    defaults: { hz: 50, publishMode: 0 },
    perSensor: { [sensorId]: { mask: sensorId === BS2_SENSOR_ID.BMI270 ? 0x1f : mask } },
    bmi270Mode: sensorId === BS2_SENSOR_ID.BMI270 ? "raw" : undefined,
  };
}

function buildBmi270HzGrid(): MatrixTestCase[] {
  const modes = ["raw", "fusion", "hybrid"] as const;
  const hzList = [20, 50, 100];
  const cases: MatrixTestCase[] = [];
  for (const mode of modes) {
    for (const hz of hzList) {
      cases.push({
        id: `bmi270-${mode}-${hz}hz`,
        tiers: mode === "raw" && hz === 50 ? ["standard"] : ["standard"],
        description: `BMI270 ${mode} @ ${hz} Hz, mask 0x1f`,
        activeSensorIds: [BS2_SENSOR_ID.BMI270],
        defaults: { hz, publishMode: 0, mask: 0x1f },
        bmi270Mode: mode,
        fusionFeedHz: hz * 2,
      });
    }
  }
  return cases;
}

function buildBmi270MaskCases(): MatrixTestCase[] {
  return [
    {
      id: "bmi270-mask-03-raw",
      tiers: ["standard"],
      description: "BMI270 raw ACC+GYR only (mask 0x03)",
      activeSensorIds: [BS2_SENSOR_ID.BMI270],
      defaults: { hz: 50, publishMode: 0, mask: 0x03 },
      bmi270Mode: "raw",
    },
    {
      id: "bmi270-mask-07-raw",
      tiers: ["standard"],
      description: "BMI270 raw ACC+GYR+TMP (mask 0x07)",
      activeSensorIds: [BS2_SENSOR_ID.BMI270],
      defaults: { hz: 50, publishMode: 0, mask: 0x07 },
      bmi270Mode: "raw",
    },
    {
      id: "bmi270-mask-1f-fusion",
      tiers: ["standard"],
      description: "BMI270 fusion full mask 0x1f",
      activeSensorIds: [BS2_SENSOR_ID.BMI270],
      defaults: { hz: 50, publishMode: 0, mask: 0x1f },
      bmi270Mode: "fusion",
      fusionFeedHz: 100,
    },
    {
      id: "bmi270-mask-18-fusion",
      tiers: ["standard"],
      description: "BMI270 fusion Euler+Quat only (mask 0x18)",
      activeSensorIds: [BS2_SENSOR_ID.BMI270],
      defaults: { hz: 50, publishMode: 0, mask: 0x18 },
      bmi270Mode: "fusion",
      fusionFeedHz: 100,
    },
  ];
}

function buildEnvMaskCases(
  sensorId: number,
  name: string,
  masks: Array<{ mask: number; label: string }>,
): MatrixTestCase[] {
  return masks.map(({ mask, label }) => ({
    id: `${name.toLowerCase()}-mask-${mask.toString(16)}`,
    tiers: ["standard"] as MatrixTier[],
    description: `${name} isolated mask ${label} (0x${mask.toString(16)})`,
    activeSensorIds: [sensorId],
    defaults: { hz: 50, publishMode: 0, mask },
  }));
}

function buildPublishModeCases(): MatrixTestCase[] {
  const modes: Bs2PublishMode[] = [0, 1, 2];
  const labels = ["periodic", "on_change", "hybrid"];
  const cases: MatrixTestCase[] = [];

  for (let i = 0; i < modes.length; i++) {
    const publishMode = modes[i]!;
    const label = labels[i]!;
    cases.push({
      id: `bmm350-publish-${label}`,
      tiers: ["standard"],
      description: `BMM350 publishMode=${publishMode} (${label})`,
      activeSensorIds: [BS2_SENSOR_ID.BMM350],
      defaults: { hz: 20, publishMode, mask: 0x03, deltaX100: 1 },
      payloadOnly: publishMode !== 0,
    });
    cases.push({
      id: `bmi270-fusion-publish-${label}`,
      tiers: ["standard"],
      description: `BMI270 fusion publishMode=${publishMode} (${label})`,
      activeSensorIds: [BS2_SENSOR_ID.BMI270],
      defaults: { hz: 50, publishMode, mask: 0x1f, deltaX100: 1 },
      bmi270Mode: "fusion",
      fusionFeedHz: 100,
      payloadOnly: publishMode !== 0,
    });
  }
  return cases;
}

function buildExhaustiveBmi270MaskFusion(): MatrixTestCase[] {
  const cases: MatrixTestCase[] = [];
  for (let mask = 1; mask <= 0x1f; mask++) {
    if ((mask & 0x18) === 0) {
      continue;
    }
    cases.push({
      id: `exhaust-bmi270-fusion-mask-${mask.toString(16).padStart(2, "0")}`,
      tiers: ["exhaustive"],
      description: `BMI270 fusion mask 0x${mask.toString(16)}`,
      activeSensorIds: [BS2_SENSOR_ID.BMI270],
      defaults: { hz: 50, publishMode: 0, mask },
      bmi270Mode: "fusion",
      fusionFeedHz: 100,
      soakMs: 8000,
    });
  }
  return cases;
}

const STATIC_CASES: MatrixTestCase[] = [
  {
    ...allSensors(50),
    id: "smoke-all-raw-50",
    bmi270Mode: "raw",
  },
  {
    id: "smoke-all-fusion-50",
    tiers: ["smoke", "standard"],
    description: "All sensors fusion @ 50 Hz",
    activeSensorIds: [...UART_ALL_SENSOR_IDS],
    defaults: { hz: 50, publishMode: 0 },
    perSensor: {
      [BS2_SENSOR_ID.BMI270]: { mask: 0x1f },
      [BS2_SENSOR_ID.BMM350]: { mask: 0x03 },
      [BS2_SENSOR_ID.SHT40]: { mask: 0x03 },
      [BS2_SENSOR_ID.DPS368]: { mask: 0x03 },
    },
    bmi270Mode: "fusion",
    fusionFeedHz: 100,
  },
  {
    id: "smoke-all-hybrid-50",
    tiers: ["smoke", "standard"],
    description: "All sensors hybrid @ 50 Hz",
    activeSensorIds: [...UART_ALL_SENSOR_IDS],
    defaults: { hz: 50, publishMode: 0 },
    perSensor: {
      [BS2_SENSOR_ID.BMI270]: { mask: 0x1f },
      [BS2_SENSOR_ID.BMM350]: { mask: 0x03 },
      [BS2_SENSOR_ID.SHT40]: { mask: 0x03 },
      [BS2_SENSOR_ID.DPS368]: { mask: 0x03 },
    },
    bmi270Mode: "hybrid",
    fusionFeedHz: 100,
  },
  onlySensor(BS2_SENSOR_ID.BMI270, "BMI270"),
  onlySensor(BS2_SENSOR_ID.BMM350, "BMM350"),
  onlySensor(BS2_SENSOR_ID.SHT40, "SHT40"),
  onlySensor(BS2_SENSOR_ID.DPS368, "DPS368"),
  {
    id: "smoke-bmi270-decimated",
    tiers: ["smoke", "standard"],
    description: "BMI270 sample 50 Hz publish 10 Hz",
    activeSensorIds: [BS2_SENSOR_ID.BMI270],
    defaults: { hz: 50, publishHz: 10, publishMode: 0, mask: 0x1f },
    bmi270Mode: "raw",
    minPassRatio: 0.5,
  },
  {
    id: "smoke-all-decimated",
    tiers: ["standard"],
    description: "All sensors sample 50 Hz publish 10 Hz",
    activeSensorIds: [...UART_ALL_SENSOR_IDS],
    defaults: { hz: 50, publishHz: 10, publishMode: 0 },
    perSensor: {
      [BS2_SENSOR_ID.BMI270]: { mask: 0x1f },
      [BS2_SENSOR_ID.BMM350]: { mask: 0x03 },
      [BS2_SENSOR_ID.SHT40]: { mask: 0x03 },
      [BS2_SENSOR_ID.DPS368]: { mask: 0x03 },
    },
    bmi270Mode: "raw",
    minPassRatio: 0.5,
  },
  {
    id: "standard-cfg-get-spot",
    tiers: ["standard"],
    description: "All sensors + SENSOR_CFG GET verify",
    activeSensorIds: [...UART_ALL_SENSOR_IDS],
    defaults: { hz: 20, publishMode: 0 },
    perSensor: {
      [BS2_SENSOR_ID.BMI270]: { mask: 0x1f },
      [BS2_SENSOR_ID.BMM350]: { mask: 0x03 },
      [BS2_SENSOR_ID.SHT40]: { mask: 0x03 },
      [BS2_SENSOR_ID.DPS368]: { mask: 0x03 },
    },
    bmi270Mode: "raw",
    requireCfgGet: true,
    soakMs: 10_000,
  },
];

function dedupeCases(cases: MatrixTestCase[]): MatrixTestCase[] {
  const seen = new Set<string>();
  const out: MatrixTestCase[] = [];
  for (const c of cases) {
    if (seen.has(c.id)) {
      continue;
    }
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

export function buildMatrixCases(tier: MatrixTier): MatrixTestCase[] {
  const all = dedupeCases([
    ...STATIC_CASES,
    ...buildBmi270HzGrid(),
    ...buildBmi270MaskCases(),
    ...buildEnvMaskCases(BS2_SENSOR_ID.BMM350, "BMM350", [
      { mask: 0x01, label: "MAG" },
      { mask: 0x02, label: "TMP" },
      { mask: 0x03, label: "MAG+TMP" },
    ]),
    ...buildEnvMaskCases(BS2_SENSOR_ID.SHT40, "SHT40", [
      { mask: 0x01, label: "TEMP" },
      { mask: 0x02, label: "HUM" },
      { mask: 0x03, label: "TEMP+HUM" },
    ]),
    ...buildEnvMaskCases(BS2_SENSOR_ID.DPS368, "DPS368", [
      { mask: 0x01, label: "PRESS" },
      { mask: 0x02, label: "TMP" },
      { mask: 0x03, label: "PRESS+TMP" },
    ]),
    ...buildPublishModeCases(),
    ...buildExhaustiveBmi270MaskFusion(),
  ]);

  if (tier === "exhaustive") {
    return all.filter((c) => c.tiers.includes("exhaustive") || c.tiers.includes("standard") || c.tiers.includes("smoke"));
  }
  return all.filter((c) => c.tiers.includes(tier));
}

export function findMatrixCase(id: string): MatrixTestCase | undefined {
  return buildMatrixCases("exhaustive").find((c) => c.id === id);
}

export function estimateCaseDurationMs(testCase: MatrixTestCase, defaultSoakMs: number): number {
  const soak = testCase.soakMs ?? defaultSoakMs;
  const setupMs = testCase.bmi270Mode === "fusion" || testCase.bmi270Mode === "hybrid" ? 4000 : 1500;
  return soak + setupMs;
}

export function estimateTierDurationMs(tier: MatrixTier, defaultSoakMs: number): number {
  return buildMatrixCases(tier).reduce((sum, c) => sum + estimateCaseDurationMs(c, defaultSoakMs), 0);
}
