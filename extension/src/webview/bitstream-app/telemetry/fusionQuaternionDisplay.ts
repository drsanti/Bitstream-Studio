/*******************************************************************************
 * File Name : fusionQuaternionDisplay.ts
 *
 * Description : BMI270 fusion quaternion deck display helpers (norm row, +w
 *               hemisphere, component resolve from sample / wire tap).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type FusionQuatComponents = {
  qx: number;
  qy: number;
  qz: number;
  qw: number;
};

/** Decode normalized imaginary component from wire ×10000 bucket. */
export function fusionQuatImagFromWireBucket(bucketX10000: number): number
{
  return bucketX10000 / 10000;
}

/** Decode normalized W from firmware bucket (same as toNormalizedQwFromBucket). */
export function fusionQuatWFromWireBucket(bucketX10000: number): number
{
  return (bucketX10000 - 10000) / 10000;
}

/** Prefer wire tap after first fusion frame; else sample buckets. */
export function resolveFusionQuatComponents(input: {
  sampleQxX10000?: number;
  sampleQyX10000?: number;
  sampleQzX10000?: number;
  sampleQwBucketX10000?: number;
  wireTapQx?: number;
  wireTapQy?: number;
  wireTapQz?: number;
  wireTapQw?: number;
  wireTapLastAtMs: number | null;
}): FusionQuatComponents | null
{
  if (input.wireTapLastAtMs != null)
  {
    const { wireTapQx, wireTapQy, wireTapQz, wireTapQw } = input;
    if (
      typeof wireTapQx === "number" &&
      typeof wireTapQy === "number" &&
      typeof wireTapQz === "number" &&
      typeof wireTapQw === "number"
    )
    {
      return { qx: wireTapQx, qy: wireTapQy, qz: wireTapQz, qw: wireTapQw };
    }
  }

  const { sampleQxX10000, sampleQyX10000, sampleQzX10000, sampleQwBucketX10000 } = input;
  if (
    typeof sampleQxX10000 === "number" &&
    typeof sampleQyX10000 === "number" &&
    typeof sampleQzX10000 === "number" &&
    typeof sampleQwBucketX10000 === "number"
  )
  {
    return {
      qx: fusionQuatImagFromWireBucket(sampleQxX10000),
      qy: fusionQuatImagFromWireBucket(sampleQyX10000),
      qz: fusionQuatImagFromWireBucket(sampleQzX10000),
      qw: fusionQuatWFromWireBucket(sampleQwBucketX10000),
    };
  }

  return null;
}

/** Same rotation as q; display-only canonical hemisphere with qw >= 0. */
export function applyPreferPositiveW(q: FusionQuatComponents): FusionQuatComponents
{
  if (q.qw >= 0)
  {
    return q;
  }
  return { qx: -q.qx, qy: -q.qy, qz: -q.qz, qw: -q.qw };
}

export function fusionQuatNorm(q: FusionQuatComponents): number
{
  return Math.sqrt(q.qx * q.qx + q.qy * q.qy + q.qz * q.qz + q.qw * q.qw);
}

export function formatFusionQuatComponent(value: number, fractionDigits = 2): string
{
  return value.toFixed(fractionDigits);
}
