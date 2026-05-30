/*******************************************************************************
 * File Name : magnetometerDisplay.ts
 *
 * Description : BMM350 magnetometer deck display helpers (|B| magnitude, gauge
 *               range presets).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type Bmm350MagGaugeRange = "earth" | "wide" | "auto";

export const BMM350_MAG_GAUGE_RANGE_LABELS: Record<Bmm350MagGaugeRange, string> = {
  earth: "Earth field (~100 µT)",
  wide: "Wide (1000 µT)",
  auto: "Auto",
};

const EARTH_AXIS_MAX_UT = 100;
const WIDE_AXIS_MAX_UT = 1000;
const AUTO_AXIS_MIN_UT = 100;
const AUTO_AXIS_MAX_UT = 1000;
const AUTO_HEADROOM = 1.15;

export function magnetometerMagnitudeUt(
  mx: number | undefined,
  my: number | undefined,
  mz: number | undefined,
): number | undefined
{
  if (
    typeof mx !== "number" ||
    typeof my !== "number" ||
    typeof mz !== "number" ||
    !Number.isFinite(mx) ||
    !Number.isFinite(my) ||
    !Number.isFinite(mz)
  )
  {
    return undefined;
  }
  return Math.sqrt(mx * mx + my * my + mz * mz);
}

export type MagnetometerGaugeLimits = {
  axisMin: number;
  axisMax: number;
  magnitudeMin: number;
  magnitudeMax: number;
};

/** Resolve signed axis and one-sided |B| gauge limits from preset (and live µT for auto). */
export function resolveMagnetometerGaugeLimits(
  range: Bmm350MagGaugeRange,
  mx: number | undefined,
  my: number | undefined,
  mz: number | undefined,
  magnitudeUt: number | undefined,
): MagnetometerGaugeLimits
{
  if (range === "wide")
  {
    return {
      axisMin: -WIDE_AXIS_MAX_UT,
      axisMax: WIDE_AXIS_MAX_UT,
      magnitudeMin: 0,
      magnitudeMax: WIDE_AXIS_MAX_UT,
    };
  }

  if (range === "auto")
  {
    const peakAxis = Math.max(
      Math.abs(mx ?? 0),
      Math.abs(my ?? 0),
      Math.abs(mz ?? 0),
    );
    const peakMag = magnitudeUt ?? 0;
    const axisMax = Math.min(
      AUTO_AXIS_MAX_UT,
      Math.max(AUTO_AXIS_MIN_UT, Math.ceil(Math.max(peakAxis, 1) * AUTO_HEADROOM)),
    );
    const magnitudeMax = Math.min(
      AUTO_AXIS_MAX_UT,
      Math.max(AUTO_AXIS_MIN_UT, Math.ceil(Math.max(peakMag, 1) * AUTO_HEADROOM)),
    );
    return {
      axisMin: -axisMax,
      axisMax,
      magnitudeMin: 0,
      magnitudeMax,
    };
  }

  return {
    axisMin: -EARTH_AXIS_MAX_UT,
    axisMax: EARTH_AXIS_MAX_UT,
    magnitudeMin: 0,
    magnitudeMax: EARTH_AXIS_MAX_UT,
  };
}

export function isBmm350MagGaugeRange(value: unknown): value is Bmm350MagGaugeRange
{
  return value === "earth" || value === "wide" || value === "auto";
}
