import {
  BITSTREAM_SENSOR_FLAG_BMI270_FUSION_PAYLOAD,
  BITSTREAM_SENSOR_FLAG_SOURCE_DPS368,
  BITSTREAM_SENSOR_FLAG_SOURCE_SHT40,
  BITSTREAM_SENSOR_FLAG_SOURCE_BMI270,
  BITSTREAM_SENSOR_FLAG_SOURCE_BMM350,
  type BitstreamFrame,
} from "../frame/frame-types";

export type BitstreamSensorSourceHint = "unknown" | "sht40" | "dps368" | "bmm350" | "bmi270";

export interface BitstreamSensorSampleV2 {
  counter: number;
  /** BS2 EVT_SENSOR device timestamp (tMs, u32); absent on legacy v1 decode paths. */
  deviceTMs?: number;
  temperatureCx100: number;
  secondaryX100: number;
  sourceHint: BitstreamSensorSourceHint;
  isBmi270FusionPayload: boolean;
  magneticXUtX100?: number;
  magneticYUtX100?: number;
  magneticZUtX100?: number;
  accelXMs2X100?: number;
  accelYMs2X100?: number;
  accelZMs2X100?: number;
  gyroXRadSX100?: number;
  gyroYRadSX100?: number;
  gyroZRadSX100?: number;
  fusionQuatWBucketX10000?: number;
  fusionQuatXX10000?: number;
  fusionQuatYX10000?: number;
  fusionQuatZX10000?: number;
  fusionHeadingRadX100?: number;
  fusionPitchRadX100?: number;
  fusionRollRadX100?: number;
}

function decodeBaseSample(payload: Uint8Array, sourceHint: BitstreamSensorSourceHint): BitstreamSensorSampleV2 | null {
  if (payload.length < 8) {
    return null;
  }

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return {
    counter: view.getUint32(0, true),
    temperatureCx100: view.getInt16(4, true),
    secondaryX100: view.getUint16(6, true),
    sourceHint,
    isBmi270FusionPayload: false,
  };
}

function decodeBmm350Sample(payload: Uint8Array): BitstreamSensorSampleV2 | null {
  if (payload.length < 12) {
    return null;
  }

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const magneticXUtX100 = view.getInt16(6, true);
  const magneticYUtX100 = view.getInt16(8, true);
  const magneticZUtX100 = view.getInt16(10, true);
  const magneticAbsMaxX100 = Math.max(Math.abs(magneticXUtX100), Math.abs(magneticYUtX100), Math.abs(magneticZUtX100));

  return {
    counter: view.getUint32(0, true),
    temperatureCx100: view.getInt16(4, true),
    secondaryX100: magneticAbsMaxX100,
    sourceHint: "bmm350",
    isBmi270FusionPayload: false,
    magneticXUtX100,
    magneticYUtX100,
    magneticZUtX100,
  };
}

function decodeBmi270Sample(payload: Uint8Array, isFusionPayload: boolean): BitstreamSensorSampleV2 | null {
  if (payload.length === 8) {
    return decodeBaseSample(payload, "bmi270");
  }

  if (payload.length !== 20) {
    return null;
  }

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

  if (isFusionPayload) {
    return {
      counter: view.getUint32(0, true),
      temperatureCx100: view.getInt16(4, true),
      secondaryX100: view.getUint16(6, true),
      sourceHint: "bmi270",
      isBmi270FusionPayload: true,
      fusionQuatWBucketX10000: view.getUint16(6, true),
      fusionQuatXX10000: view.getInt16(8, true),
      fusionQuatYX10000: view.getInt16(10, true),
      fusionQuatZX10000: view.getInt16(12, true),
      fusionHeadingRadX100: view.getInt16(14, true),
      fusionPitchRadX100: view.getInt16(16, true),
      fusionRollRadX100: view.getInt16(18, true),
    };
  }

  return {
    counter: view.getUint32(0, true),
    temperatureCx100: view.getInt16(4, true),
    secondaryX100: view.getUint16(6, true),
    sourceHint: "bmi270",
    isBmi270FusionPayload: false,
    accelXMs2X100: view.getInt16(8, true),
    accelYMs2X100: view.getInt16(10, true),
    accelZMs2X100: view.getInt16(12, true),
    gyroXRadSX100: view.getInt16(14, true),
    gyroYRadSX100: view.getInt16(16, true),
    gyroZRadSX100: view.getInt16(18, true),
  };
}

export function decodeBitstreamSensorSample(frame: BitstreamFrame): BitstreamSensorSampleV2 | null {
  if ((frame.flags & BITSTREAM_SENSOR_FLAG_SOURCE_SHT40) !== 0) {
    return decodeBaseSample(frame.payload, "sht40");
  }

  if ((frame.flags & BITSTREAM_SENSOR_FLAG_SOURCE_DPS368) !== 0) {
    return decodeBaseSample(frame.payload, "dps368");
  }

  if ((frame.flags & BITSTREAM_SENSOR_FLAG_SOURCE_BMM350) !== 0) {
    return decodeBmm350Sample(frame.payload);
  }

  if ((frame.flags & BITSTREAM_SENSOR_FLAG_SOURCE_BMI270) !== 0) {
    const isFusionPayload = (frame.flags & BITSTREAM_SENSOR_FLAG_BMI270_FUSION_PAYLOAD) !== 0;
    return decodeBmi270Sample(frame.payload, isFusionPayload);
  }

  return decodeBaseSample(frame.payload, "unknown");
}
