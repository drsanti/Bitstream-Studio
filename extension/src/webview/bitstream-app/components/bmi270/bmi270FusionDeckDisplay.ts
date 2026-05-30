/*******************************************************************************
 * File Name : bmi270FusionDeckDisplay.ts
 *
 * Description : Display helpers for BMI270 fusion quaternion and Euler deck rows.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  formatFusionEulerDisplayFromRad,
  fusionEulerRadFromWireHundredths,
  type FusionEulerAngleDisplayMode,
} from "../../telemetry/fusionEulerAngleDisplay.js";
import {
  toNormalizedQwFromBucket,
  toScaledValueBy,
} from "../../telemetry/telemetryFormat.js";

/** Imaginary quaternion component: wire int16 bucket on sample, normalized float on wire tap. */
export function fusionQuatImagDisplay(
  sampleX10000: number | undefined,
  wireTapNormalized: number | undefined,
  wireTapLastAtMs: number | null,
): string
{
  if (wireTapLastAtMs != null && typeof wireTapNormalized === "number")
  {
    return wireTapNormalized.toFixed(2);
  }
  if (typeof sampleX10000 === "number")
  {
    return toScaledValueBy(sampleX10000, 10000, 2);
  }
  return "--";
}

/** Scalar W: bucket on sample, normalized on wire tap. */
export function fusionQuatWDisplay(
  sampleBucketX10000: number | undefined,
  wireTapNormalizedQw: number | undefined,
  wireTapLastAtMs: number | null,
): string
{
  if (wireTapLastAtMs != null && typeof wireTapNormalizedQw === "number")
  {
    return wireTapNormalizedQw.toFixed(2);
  }
  if (typeof sampleBucketX10000 === "number")
  {
    return toNormalizedQwFromBucket(sampleBucketX10000);
  }
  return "--";
}

/** @deprecated Use fusionQuatImagDisplay or fusionQuatWDisplay — kept for tests migrating bucket paths. */
export function fusionQuatRowDisplay(
  sampleBucketX10000: number | undefined,
  wireTapBucketX10000: number | undefined,
  wireTapLastAtMs: number | null,
  divisor: number,
  fractionDigits: number,
): string
{
  if (typeof sampleBucketX10000 === "number")
  {
    if (divisor === 10000 && fractionDigits === 2)
    {
      return toNormalizedQwFromBucket(sampleBucketX10000);
    }
    return toScaledValueBy(sampleBucketX10000, divisor, fractionDigits);
  }
  if (wireTapLastAtMs == null || typeof wireTapBucketX10000 !== "number")
  {
    return "--";
  }
  if (divisor === 10000 && fractionDigits === 2)
  {
    return toNormalizedQwFromBucket(wireTapBucketX10000);
  }
  return toScaledValueBy(wireTapBucketX10000, divisor, fractionDigits);
}

export type FusionEulerRowDisplayResult = {
  value: string;
  unit: string;
  centerZeroGaugeMaxAbs?: number;
  oneSidedGaugeMaxAbs?: number;
  positiveSignMode?: "always" | "omit";
};

/** Prefer sample Euler field; else wire tap radians after first fusion frame. */
export function fusionEulerRowDisplay(
  sampleRadX100: number | undefined,
  wireTapRad: number | undefined,
  wireTapLastAtMs: number | null,
  displayMode: FusionEulerAngleDisplayMode,
  fractionDigits = 2,
): FusionEulerRowDisplayResult
{
  let rad: number | undefined;
  if (typeof sampleRadX100 === "number")
  {
    rad = fusionEulerRadFromWireHundredths(sampleRadX100);
  }
  else if (wireTapLastAtMs != null && typeof wireTapRad === "number")
  {
    rad = wrapFusionEulerWireTapRad(wireTapRad);
  }

  if (rad == null || !Number.isFinite(rad))
  {
    return { value: "--", unit: displayMode === "signed-pi-rad" ? "rad" : "°" };
  }

  const row = formatFusionEulerDisplayFromRad(rad, displayMode, fractionDigits);
  return {
    value: row.text,
    unit: row.unit,
    centerZeroGaugeMaxAbs: row.centerZeroGaugeMaxAbs,
    oneSidedGaugeMaxAbs: row.oneSidedGaugeMaxAbs,
    positiveSignMode: row.positiveSignMode,
  };
}

function wrapFusionEulerWireTapRad(wireTapRad: number): number
{
  return fusionEulerRadFromWireHundredths(Math.round(wireTapRad * 100));
}
