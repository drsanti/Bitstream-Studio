/**
 * Shared EVT_SENSOR assertions for UART hardware test scripts.
 */
import {
  bmi270StreamModeUiToCode,
  type Bs2Bmi270StreamMode,
} from "../domains/bmi270/bmi270-control";
import type { Bitstream2SensorSamplePayload } from "../bridge/protocol";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import { BMI270_MASK, decodeBmi270Values } from "../domains/sensors/bmi270";
import { BMM350_MASK, decodeBmm350Values } from "../domains/sensors/bmm350";
import { SHT40_MASK, decodeSht40Values } from "../domains/sensors/sht40";
import { DPS368_MASK, decodeDps368Values } from "../domains/sensors/dps368";

export const UART_SENSOR_NAMES: Record<number, string> = {
  0: "BMI270",
  1: "BMM350",
  2: "SHT40",
  3: "DPS368",
};

export const UART_ALL_SENSOR_IDS = [0, 1, 2, 3] as const;
export const UART_BMI270_SENSOR_ID = BS2_SENSOR_ID.BMI270;
export const UART_DPS368_SENSOR_ID = BS2_SENSOR_ID.DPS368;

/** BMI270 raw stream publishes ACC+GYR+TMP only (mask 0x07), not Euler/Quat. */
export const BMI270_RAW_MAX_EVT_MASK = BMI270_MASK.ACC | BMI270_MASK.GYR | BMI270_MASK.TMP;

/**
 * EVT mask required on the wire for a sensor given SENSOR_CFG mask and BMI270 stream mode.
 * Raw BMI270 never includes fusion fields even when cfg mask requests 0x1f.
 */
export function effectiveEvtMaskForSensor(
  sensorId: number,
  cfgMask: number,
  bmi270Mode: Bs2Bmi270StreamMode,
): number {
  if (sensorId === UART_BMI270_SENSOR_ID && bmi270Mode === bmi270StreamModeUiToCode("raw")) {
    return cfgMask & BMI270_RAW_MAX_EVT_MASK;
  }
  return cfgMask;
}

/** Build per-sensor expected EVT masks from applied SENSOR_CFG and BMI270 mode. */
export function buildEffectiveEvtMaskBySensor(
  cfgMaskBySensor: Readonly<Record<number, number>>,
  activeSensorIds: number[],
  bmi270Mode: Bs2Bmi270StreamMode,
): Record<number, number> {
  const out: Record<number, number> = {};
  for (const sensorId of activeSensorIds) {
    const cfgMask = cfgMaskBySensor[sensorId] ?? 0x03;
    out[sensorId] = effectiveEvtMaskForSensor(sensorId, cfgMask, bmi270Mode);
  }
  return out;
}

/** Scalar count for EVT mask (canonical ACC→GYR→TMP→EULER→QUAT order). */
export function expectedScalarCount(sensorId: number, mask: number): number {
  let n = 0;
  if (sensorId === BS2_SENSOR_ID.BMI270) {
    if ((mask & BMI270_MASK.ACC) !== 0) n += 3;
    if ((mask & BMI270_MASK.GYR) !== 0) n += 3;
    if ((mask & BMI270_MASK.TMP) !== 0) n += 1;
    if ((mask & BMI270_MASK.EULER) !== 0) n += 3;
    if ((mask & BMI270_MASK.QUAT) !== 0) n += 4;
    return n;
  }
  if (sensorId === BS2_SENSOR_ID.BMM350) {
    if ((mask & BMM350_MASK.MAG) !== 0) n += 3;
    if ((mask & BMM350_MASK.TMP) !== 0) n += 1;
    return n;
  }
  if (sensorId === BS2_SENSOR_ID.SHT40) {
    if ((mask & SHT40_MASK.TEMP) !== 0) n += 1;
    if ((mask & SHT40_MASK.HUM) !== 0) n += 1;
    return n;
  }
  if (sensorId === BS2_SENSOR_ID.DPS368) {
    if ((mask & DPS368_MASK.PRESS) !== 0) n += 1;
    if ((mask & DPS368_MASK.TMP) !== 0) n += 1;
    return n;
  }
  return n;
}

function valuesToBytes(values: number[]): Uint8Array {
  const out = new Uint8Array(values.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < values.length; i++) {
    view.setInt16(i * 2, values[i]!, true);
  }
  return out;
}

/** Returns decode error string or null when decode succeeds. */
export function decodeSensorSampleError(
  sensorId: number,
  mask: number,
  values: number[],
): string | null {
  const bytes = valuesToBytes(values);
  if (sensorId === BS2_SENSOR_ID.BMI270) {
    const r = decodeBmi270Values(mask, bytes);
    return r.ok ? null : "BMI270 decode failed";
  }
  if (sensorId === BS2_SENSOR_ID.BMM350) {
    const r = decodeBmm350Values(mask, bytes);
    return r.ok ? null : "BMM350 decode failed";
  }
  if (sensorId === BS2_SENSOR_ID.SHT40) {
    const r = decodeSht40Values(mask, bytes);
    return r.ok ? null : "SHT40 decode failed";
  }
  if (sensorId === BS2_SENSOR_ID.DPS368) {
    const r = decodeDps368Values(mask, bytes);
    return r.ok ? null : "DPS368 decode failed";
  }
  return `unknown sensorId ${sensorId}`;
}

export function verifySensorPayloadFields(
  activeSensorIds: number[],
  samples: Bitstream2SensorSamplePayload[],
  cfgMaskBySensor: Readonly<Record<number, number>>,
  bmi270Mode: Bs2Bmi270StreamMode,
): string[] {
  const errors: string[] = [];
  const expectedMaskBySensor = buildEffectiveEvtMaskBySensor(cfgMaskBySensor, activeSensorIds, bmi270Mode);

  for (const sensorId of activeSensorIds) {
    const expectedMask = expectedMaskBySensor[sensorId] ?? 0x03;
    const sensorSamples = samples.filter((s) => s.sensorId === sensorId);
    if (sensorSamples.length === 0) {
      errors.push(`${UART_SENSOR_NAMES[sensorId]}: no EVT samples`);
      continue;
    }

    const hasFullMask = sensorSamples.some((s) => (s.mask & expectedMask) === expectedMask);
    if (!hasFullMask) {
      const maxMask = Math.max(...sensorSamples.map((s) => s.mask));
      errors.push(
        `${UART_SENSOR_NAMES[sensorId]}: no sample with expected mask 0x${expectedMask.toString(16)} (max 0x${maxMask.toString(16)})`,
      );
    }

    const lenMismatch = sensorSamples.find(
      (s) => s.values.length !== expectedScalarCount(sensorId, s.mask),
    );
    if (lenMismatch != null) {
      errors.push(
        `${UART_SENSOR_NAMES[sensorId]}: mask 0x${lenMismatch.mask.toString(16)} valuesLen=${lenMismatch.values.length} expected ${expectedScalarCount(sensorId, lenMismatch.mask)}`,
      );
    }

    const decodeFail = sensorSamples.find((s) => decodeSensorSampleError(sensorId, s.mask, s.values) != null);
    if (decodeFail != null) {
      errors.push(
        `${UART_SENSOR_NAMES[sensorId]}: ${decodeSensorSampleError(sensorId, decodeFail.mask, decodeFail.values)}`,
      );
    }
  }

  const bmi270CfgMask = cfgMaskBySensor[UART_BMI270_SENSOR_ID] ?? 0x1f;
  const bmi270ExpectedMask = effectiveEvtMaskForSensor(
    UART_BMI270_SENSOR_ID,
    bmi270CfgMask,
    bmi270Mode,
  );
  if (activeSensorIds.includes(UART_BMI270_SENSOR_ID) && (bmi270ExpectedMask & BMI270_MASK.TMP) !== 0) {
    const bmi = samples.filter((s) => s.sensorId === UART_BMI270_SENSOR_ID);
    if (!bmi.some((s) => (s.mask & BMI270_MASK.TMP) !== 0)) {
      errors.push("BMI270: temperature (mask bit TMP) never present in EVT");
    }
  }

  if (
    activeSensorIds.includes(UART_BMI270_SENSOR_ID) &&
    bmi270Mode !== bmi270StreamModeUiToCode("raw") &&
    (bmi270ExpectedMask & (BMI270_MASK.EULER | BMI270_MASK.QUAT)) !== 0
  ) {
    const bmi = samples.filter((s) => s.sensorId === UART_BMI270_SENSOR_ID);
    const hasEuler = bmi.some((s) => (s.mask & BMI270_MASK.EULER) !== 0);
    const hasQuat = bmi.some((s) => (s.mask & BMI270_MASK.QUAT) !== 0);
    if (!hasEuler) {
      errors.push("BMI270: fusion mode but Euler never present");
    }
    if (!hasQuat) {
      errors.push("BMI270: fusion mode but Quaternion never present");
    }
    const fullFusion = bmi.find((s) => (s.mask & bmi270ExpectedMask) === bmi270ExpectedMask);
    if (fullFusion != null && fullFusion.values.length !== expectedScalarCount(UART_BMI270_SENSOR_ID, fullFusion.mask)) {
      errors.push(
        `BMI270: full-mask fusion sample valuesLen=${fullFusion.values.length} expected ${expectedScalarCount(UART_BMI270_SENSOR_ID, fullFusion.mask)}`,
      );
    }
  }

  return errors;
}

export function computeSensorHz(
  samples: Bitstream2SensorSamplePayload[],
  sensorId: number,
  elapsedMs: number,
): number {
  const n = samples.filter((s) => s.sensorId === sensorId).length;
  if (elapsedMs <= 0) {
    return 0;
  }
  return (n * 1000) / elapsedMs;
}
