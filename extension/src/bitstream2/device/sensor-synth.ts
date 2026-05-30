import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import { BMI270_MASK } from "../domains/sensors/bmi270";
import { BMM350_MASK } from "../domains/sensors/bmm350";
import { SHT40_MASK } from "../domains/sensors/sht40";
import { DPS368_MASK } from "../domains/sensors/dps368";

/** Fundamental simulator sine frequency (~0.2 Hz). */
export const SIM_SINE_HZ = 0.2;

const TWO_PI = Math.PI * 2;

/** BMI270 ±2g → ±19.6 m/s² in wire units (m/s²×100). */
const BMI270_ACC_MS2_X100_FS = Math.round(2 * 9.80665 * 100);
/** BMI270 gyro range 2000 °/s → rad/s×100 (matches sensor_bmi270 GYR_RANGE_DPS). */
const BMI270_GYR_RADS_X100_FS = Math.round(((2000 * Math.PI) / 180) * 100);
/** Resting 1g on Z for synthetic accel (m/s²×100). */
const BMI270_ACC_Z_1G_MS2_X100 = Math.round(9.80665 * 100);

function packI16(parts: number[]): Uint8Array {
  const out = new Uint8Array(parts.length * 2);
  const view = new DataView(out.buffer);
  parts.forEach((v, i) => view.setInt16(i * 2, v, true));
  return out;
}

/** Phase in radians from wall-clock time and sensor id (decorrelates streams). */
export function simPhaseFromTimeMs(tMs: number, sensorId: number): number {
  return TWO_PI * SIM_SINE_HZ * (tMs / 1000) + sensorId * 0.41;
}

/** One int16 channel: center + amplitude * sin(phase + offset). */
export function simSineI16(
  phase: number,
  channelOffsetRad: number,
  center: number,
  amplitude: number,
): number {
  return Math.round(center + amplitude * Math.sin(phase + channelOffsetRad));
}

/**
 * Build synthetic EVT_SENSOR valuesBytes for the firmware simulator.
 * Every enabled scalar varies as a sine wave (unique phase offset per channel).
 */
export function buildSyntheticSensorValues(
  sensorId: number,
  mask: number,
  tMs: number,
  getWavesForChannel?: (channelKey: string) => Array<{ freqHz: number; amp: number }> | null,
): Uint8Array {
  const phase0 = simPhaseFromTimeMs(tMs, sensorId);
  const tSec = tMs / 1000;
  const wavePhaseOffsets = [0, 1.3, 2.6];

  const clampI16 = (v: number) => Math.max(-32768, Math.min(32767, Math.round(v)));

  const sum3 = (channelKey: string, phaseOffsetRad: number): number => {
    const waves = getWavesForChannel?.(channelKey) ?? null;
    const w = waves && waves.length === 3 ? waves : null;
    const f0 = w ? Math.max(0, Number(w[0]?.freqHz ?? 0)) : SIM_SINE_HZ;
    const f1 = w ? Math.max(0, Number(w[1]?.freqHz ?? 0)) : 0;
    const f2 = w ? Math.max(0, Number(w[2]?.freqHz ?? 0)) : 0;
    const a0 = w ? Math.max(0, Math.min(1, Number(w[0]?.amp ?? 0))) : 1;
    const a1 = w ? Math.max(0, Math.min(1, Number(w[1]?.amp ?? 0))) : 0;
    const a2 = w ? Math.max(0, Math.min(1, Number(w[2]?.amp ?? 0))) : 0;
    const sumAmp = Math.max(1e-6, a0 + a1 + a2);
    const phBase = phase0 + phaseOffsetRad;
    const s =
      a0 * Math.sin(TWO_PI * f0 * tSec + phBase + wavePhaseOffsets[0]) +
      a1 * Math.sin(TWO_PI * f1 * tSec + phBase + wavePhaseOffsets[1]) +
      a2 * Math.sin(TWO_PI * f2 * tSec + phBase + wavePhaseOffsets[2]);
    return s / sumAmp; // normalized [-1, 1]
  };

  const chan = (channelKey: string, phaseOffsetRad: number, center: number, fullScale: number) => {
    const n = sum3(channelKey, phaseOffsetRad);
    return clampI16(center + n * fullScale);
  };

  if (sensorId === BS2_SENSOR_ID.BMI270) {
    const parts: number[] = [];
    if ((mask & BMI270_MASK.ACC) !== 0) {
      // ACC in m/s²×100 (firmware wire); Z biased ~1g
      parts.push(
        chan("bmi270.acc.x", 0.0, 0, BMI270_ACC_MS2_X100_FS),
        chan("bmi270.acc.y", 1.1, 0, BMI270_ACC_MS2_X100_FS),
        chan("bmi270.acc.z", 2.2, BMI270_ACC_Z_1G_MS2_X100, BMI270_ACC_MS2_X100_FS),
      );
    }
    if ((mask & BMI270_MASK.GYR) !== 0) {
      // GYR in rad/s×100 (firmware wire)
      parts.push(
        chan("bmi270.gyr.x", 3.3, 0, BMI270_GYR_RADS_X100_FS),
        chan("bmi270.gyr.y", 4.4, 0, BMI270_GYR_RADS_X100_FS),
        chan("bmi270.gyr.z", 5.5, 0, BMI270_GYR_RADS_X100_FS),
      );
    }
    if ((mask & BMI270_MASK.TMP) !== 0) {
      // Temp in °C×100, center ~25.00°C, span ±10.00°C
      parts.push(chan("bmi270.tmp", 6.0, 2500, 1000));
    }
    if ((mask & BMI270_MASK.EULER) !== 0) {
      // Euler in rad×100 (matches firmware ipc_fusion_result_t); sine ~±π rad
      parts.push(
        chan("bmi270.euler.h", 7.0, 0, 314),
        chan("bmi270.euler.p", 8.2, 0, 314),
        chan("bmi270.euler.r", 9.4, 0, 314),
      );
    }
    if ((mask & BMI270_MASK.QUAT) !== 0) {
      // Quaternion in ×10000, normalize to roughly [-1, 1]
      parts.push(
        chan("bmi270.quat.w", 10.0, 0, 10_000),
        chan("bmi270.quat.x", 11.2, 0, 10_000),
        chan("bmi270.quat.y", 12.4, 0, 10_000),
        chan("bmi270.quat.z", 13.6, 0, 10_000),
      );
    }
    return packI16(parts);
  }

  if (sensorId === BS2_SENSOR_ID.BMM350) {
    const parts: number[] = [];
    if ((mask & BMM350_MASK.MAG) !== 0) {
      // MAG in µT×100 (per existing decode/display); normalize to ±50.00 µT
      parts.push(
        chan("bmm350.mag.x", 0.0, 0, 5000),
        chan("bmm350.mag.y", 1.1, 0, 5000),
        chan("bmm350.mag.z", 2.2, 0, 5000),
      );
    }
    if ((mask & BMM350_MASK.TMP) !== 0) {
      parts.push(chan("bmm350.tmp", 3.3, 2400, 800));
    }
    return packI16(parts);
  }

  if (sensorId === BS2_SENSOR_ID.SHT40) {
    const parts: number[] = [];
    if ((mask & SHT40_MASK.TEMP) !== 0) {
      parts.push(chan("sht40.temp", 0.0, 2350, 800));
    }
    if ((mask & SHT40_MASK.HUM) !== 0) {
      parts.push(chan("sht40.hum", 1.5, 5500, 2000));
    }
    return packI16(parts);
  }

  if (sensorId === BS2_SENSOR_ID.DPS368) {
    const parts: number[] = [];
    if ((mask & DPS368_MASK.PRESS) !== 0) {
      parts.push(chan("dps368.press", 0.0, 10130, 200));
    }
    if ((mask & DPS368_MASK.TMP) !== 0) {
      parts.push(chan("dps368.tmp", 1.5, 2400, 800));
    }
    return packI16(parts);
  }

  return new Uint8Array(0);
}
