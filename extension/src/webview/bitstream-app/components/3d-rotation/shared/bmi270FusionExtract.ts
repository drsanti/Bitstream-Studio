import type {
  Bmi270LiveSample,
  Bmi270ResolvedSample,
} from "../../../types/bitstreamWorkspaceTypes.js";

const QUAT_NORM_EPS = 1e-8;

/**
 * Decode unit fusion quaternion from BMI270 wire int16 fields.
 * Firmware (BS2 + legacy v1): qw_bucket = (int32)(qw×10000)+10000 clamped 0..65535,
 * qx/qy/qz = clamp_float_to_i16(component, 10000). Order on wire: W, X, Y, Z.
 * BSXLite `rotation_vector` is (x,y,z,w) → IPC (qw,qx,qy,qz) unchanged.
 */
export function fusionQuat4FromWireX10000(fields: {
  fusionQuatWBucketX10000: number;
  fusionQuatXX10000: number;
  fusionQuatYX10000: number;
  fusionQuatZX10000: number;
}): { qw: number; qx: number; qy: number; qz: number }
{
  const qx = fields.fusionQuatXX10000 / 10000;
  const qy = fields.fusionQuatYX10000 / 10000;
  const qz = fields.fusionQuatZX10000 / 10000;
  const wBucket =
    fields.fusionQuatWBucketX10000 < 0
      ? fields.fusionQuatWBucketX10000 + 65536
      : fields.fusionQuatWBucketX10000;
  const qw = (wBucket - 10000) / 10000;
  const lenSq = qx * qx + qy * qy + qz * qz + qw * qw;
  if (lenSq < QUAT_NORM_EPS * QUAT_NORM_EPS)
  {
    return { qw: 1, qx: 0, qy: 0, qz: 0 };
  }
  const inv = 1 / Math.sqrt(lenSq);
  return { qw: qw * inv, qx: qx * inv, qy: qy * inv, qz: qz * inv };
}

export type FusionEulerHundredths = {
  roll: number;
  pitch: number;
  heading: number;
};

/** Normalized fusion quaternion from BMI270 wire fields; identity if missing or degenerate. */
export function extractNormalizedQuatFromBmi270Sample(
  sample: Bmi270LiveSample | null,
): { qw: number; qx: number; qy: number; qz: number } {
  if (sample == null) {
    return { qw: 1, qx: 0, qy: 0, qz: 0 };
  }
  const xRaw = sample.fusionQuatXX10000;
  const yRaw = sample.fusionQuatYX10000;
  const zRaw = sample.fusionQuatZX10000;
  const wRaw = sample.fusionQuatWBucketX10000;
  if (
    typeof xRaw !== "number" ||
    typeof yRaw !== "number" ||
    typeof zRaw !== "number" ||
    typeof wRaw !== "number" ||
    !Number.isFinite(xRaw + yRaw + zRaw + wRaw)
  ) {
    return { qw: 1, qx: 0, qy: 0, qz: 0 };
  }
  return fusionQuat4FromWireX10000({
    fusionQuatWBucketX10000: wRaw,
    fusionQuatXX10000: xRaw,
    fusionQuatYX10000: yRaw,
    fusionQuatZX10000: zRaw,
  });
}

export function hasFusionQuaternionWireFields(sample: Bmi270ResolvedSample): boolean {
  return (
    typeof sample.fusionQuatXX10000 === "number" &&
    typeof sample.fusionQuatYX10000 === "number" &&
    typeof sample.fusionQuatZX10000 === "number" &&
    typeof sample.fusionQuatWBucketX10000 === "number"
  );
}

/** True when wire-rate Euler fields are present for BMI270 fusion payloads. */
export function hasFusionEulerWireFields(sample: Bmi270ResolvedSample): boolean {
  return (
    sample.isBmi270FusionPayload === true &&
    typeof sample.fusionRollRadX100 === "number" &&
    typeof sample.fusionPitchRadX100 === "number" &&
    typeof sample.fusionHeadingRadX100 === "number" &&
    Number.isFinite(
      sample.fusionRollRadX100 +
        sample.fusionPitchRadX100 +
        sample.fusionHeadingRadX100,
    )
  );
}

export function extractFusionEulerHundredthsFromBmi270Sample(
  sample: Bmi270LiveSample | null,
): FusionEulerHundredths | null {
  if (sample == null || !hasFusionEulerWireFields(sample)) {
    return null;
  }
  return {
    roll: sample.fusionRollRadX100,
    pitch: sample.fusionPitchRadX100,
    heading: sample.fusionHeadingRadX100,
  };
}
