import type { BitstreamSensorSampleV2, BitstreamSensorSourceHint } from "../../../bitstream/events/sensor-decoder";
import type { Bitstream2SensorSamplePayload } from "../../../bitstream2/bridge/protocol";
import { BMI270_MASK } from "../../../bitstream2/domains/sensors/bmi270";
import { BMM350_MASK } from "../../../bitstream2/domains/sensors/bmm350";
import { DPS368_MASK } from "../../../bitstream2/domains/sensors/dps368";
import { SHT40_MASK } from "../../../bitstream2/domains/sensors/sht40";
import { BS2_SENSOR_ID } from "../../../bitstream2/domains/sensors/sensor-ids";

function bs2SensorIdToSourceHint(sensorId: number): BitstreamSensorSourceHint | null {
  switch (sensorId) {
    case BS2_SENSOR_ID.BMI270:
      return "bmi270";
    case BS2_SENSOR_ID.BMM350:
      return "bmm350";
    case BS2_SENSOR_ID.SHT40:
      return "sht40";
    case BS2_SENSOR_ID.DPS368:
      return "dps368";
    default:
      return null;
  }
}

function takeN(values: number[], count: number): number[] | null {
  if (values.length < count) {
    return null;
  }
  const slice = values.slice(0, count);
  values.splice(0, count);
  return slice;
}

function mapBmi270(
  mask: number,
  counter: number,
  values: number[],
): BitstreamSensorSampleV2 | null {
  const rest = [...values];
  const sample: BitstreamSensorSampleV2 = {
    counter,
    sourceHint: "bmi270",
    isBmi270FusionPayload: false,
  };
  let secondaryX100: number | undefined;

  if ((mask & BMI270_MASK.ACC) !== 0) {
    const triple = takeN(rest, 3);
    if (!triple) return null;
    /* Firmware EVT: m/s²×100 (see bitstream_sensor_port_cm55_bmi270, ARCHITECTURE.md). */
    sample.accelXMs2X100 = triple[0];
    sample.accelYMs2X100 = triple[1];
    sample.accelZMs2X100 = triple[2];
    secondaryX100 = Math.max(
      Math.abs(sample.accelXMs2X100),
      Math.abs(sample.accelYMs2X100),
      Math.abs(sample.accelZMs2X100),
    );
  }
  if ((mask & BMI270_MASK.GYR) !== 0) {
    const triple = takeN(rest, 3);
    if (!triple) return null;
    sample.gyroXRadSX100 = triple[0];
    sample.gyroYRadSX100 = triple[1];
    sample.gyroZRadSX100 = triple[2];
  }
  if ((mask & BMI270_MASK.TMP) !== 0) {
    const t = takeN(rest, 1);
    if (!t) return null;
    sample.temperatureCx100 = t[0];
  }
  if ((mask & BMI270_MASK.EULER) !== 0) {
    const triple = takeN(rest, 3);
    if (!triple) return null;
    sample.isBmi270FusionPayload = true;
    /* Firmware BS2 + legacy BMI270 fusion: heading/pitch/roll are radians ×100 (see ipc_fusion_result_t). */
    sample.fusionHeadingRadX100 = triple[0];
    sample.fusionPitchRadX100 = triple[1];
    sample.fusionRollRadX100 = triple[2];
    secondaryX100 = Math.max(secondaryX100 ?? 0, Math.abs(triple[0]));
  }
  if ((mask & BMI270_MASK.QUAT) !== 0) {
    const quad = takeN(rest, 4);
    if (!quad) return null;
    sample.isBmi270FusionPayload = true;
    sample.fusionQuatWBucketX10000 = quad[0];
    sample.fusionQuatXX10000 = quad[1];
    sample.fusionQuatYX10000 = quad[2];
    sample.fusionQuatZX10000 = quad[3];
    secondaryX100 = Math.max(secondaryX100 ?? 0, Math.abs(quad[0]));
  }

  if (secondaryX100 !== undefined) {
    sample.secondaryX100 = secondaryX100;
  }
  return sample;
}

function mapBmm350(mask: number, counter: number, values: number[]): BitstreamSensorSampleV2 | null {
  const rest = [...values];
  const sample: BitstreamSensorSampleV2 = {
    counter,
    sourceHint: "bmm350",
    isBmi270FusionPayload: false,
  };
  let magneticAbsMax: number | undefined;

  if ((mask & BMM350_MASK.MAG) !== 0) {
    const triple = takeN(rest, 3);
    if (!triple) return null;
    sample.magneticXUtX100 = triple[0];
    sample.magneticYUtX100 = triple[1];
    sample.magneticZUtX100 = triple[2];
    magneticAbsMax = Math.max(Math.abs(triple[0]), Math.abs(triple[1]), Math.abs(triple[2]));
  }
  if ((mask & BMM350_MASK.TMP) !== 0) {
    const t = takeN(rest, 1);
    if (!t) return null;
    sample.temperatureCx100 = t[0];
  }
  if (magneticAbsMax !== undefined) {
    sample.secondaryX100 = magneticAbsMax;
  }
  return sample;
}

function mapSht40(mask: number, counter: number, values: number[]): BitstreamSensorSampleV2 | null {
  const rest = [...values];
  const sample: BitstreamSensorSampleV2 = {
    counter,
    sourceHint: "sht40",
    isBmi270FusionPayload: false,
  };

  if ((mask & SHT40_MASK.TEMP) !== 0) {
    const t = takeN(rest, 1);
    if (!t) return null;
    sample.temperatureCx100 = t[0];
  }
  if ((mask & SHT40_MASK.HUM) !== 0) {
    const h = takeN(rest, 1);
    if (!h) return null;
    sample.secondaryX100 = h[0];
  }

  return sample;
}

function mapDps368(mask: number, counter: number, values: number[]): BitstreamSensorSampleV2 | null {
  const rest = [...values];
  const sample: BitstreamSensorSampleV2 = {
    counter,
    sourceHint: "dps368",
    isBmi270FusionPayload: false,
  };

  if ((mask & DPS368_MASK.PRESS) !== 0) {
    const p = takeN(rest, 1);
    if (!p) return null;
    sample.secondaryX100 = p[0];
  }
  if ((mask & DPS368_MASK.TMP) !== 0) {
    const t = takeN(rest, 1);
    if (!t) return null;
    sample.temperatureCx100 = t[0];
  }

  return sample;
}

/** Map BS-framed `EVT_SENSOR` JSON into legacy `BitstreamSensorSampleV2` for Sensor Studio. */
export function bs2SampleToBitstreamSensorSampleV2(
  payload: Bitstream2SensorSamplePayload,
): BitstreamSensorSampleV2 | null {
  const sourceHint = bs2SensorIdToSourceHint(payload.sensorId);
  if (sourceHint == null) {
    return null;
  }

  const mask = payload.mask & 0xff;
  const values = [...payload.values];

  let mapped: BitstreamSensorSampleV2 | null = null;
  switch (payload.sensorId) {
    case BS2_SENSOR_ID.BMI270:
      mapped = mapBmi270(mask, payload.counter, values);
      break;
    case BS2_SENSOR_ID.BMM350:
      mapped = mapBmm350(mask, payload.counter, values);
      break;
    case BS2_SENSOR_ID.SHT40:
      mapped = mapSht40(mask, payload.counter, values);
      break;
    case BS2_SENSOR_ID.DPS368:
      mapped = mapDps368(mask, payload.counter, values);
      break;
    default:
      return null;
  }

  if (mapped == null)
  {
    return null;
  }

  return {
    ...mapped,
    deviceTMs: payload.tMs >>> 0,
  };
}

/** Numeric / optional fields merged from partial BS2 EVT rows (mask subsets). */
export const BS2_PARTIAL_SAMPLE_MERGE_KEYS = [
  "temperatureCx100",
  "secondaryX100",
  "magneticXUtX100",
  "magneticYUtX100",
  "magneticZUtX100",
  "accelXMs2X100",
  "accelYMs2X100",
  "accelZMs2X100",
  "gyroXRadSX100",
  "gyroYRadSX100",
  "gyroZRadSX100",
  "fusionQuatWBucketX10000",
  "fusionQuatXX10000",
  "fusionQuatYX10000",
  "fusionQuatZX10000",
  "fusionHeadingRadX100",
  "fusionPitchRadX100",
  "fusionRollRadX100",
] as const satisfies readonly (keyof BitstreamSensorSampleV2)[];

/** Merge partial BS2 rows without zeroing fields omitted from the latest EVT mask. */
export function mergePartialBitstreamSensorSample(
  prev: BitstreamSensorSampleV2 | null,
  incoming: BitstreamSensorSampleV2,
): BitstreamSensorSampleV2 {
  if (prev == null || prev.sourceHint !== incoming.sourceHint) {
    return incoming;
  }

  const merged: BitstreamSensorSampleV2 = {
    ...prev,
    counter: incoming.counter,
    sourceHint: incoming.sourceHint,
    deviceTMs: incoming.deviceTMs ?? prev.deviceTMs,
    isBmi270FusionPayload:
      incoming.isBmi270FusionPayload === true || prev.isBmi270FusionPayload === true,
  };

  for (const key of BS2_PARTIAL_SAMPLE_MERGE_KEYS) {
    if (key in incoming) {
      (merged as Record<string, unknown>)[key] = incoming[key];
    }
  }

  return merged;
}
