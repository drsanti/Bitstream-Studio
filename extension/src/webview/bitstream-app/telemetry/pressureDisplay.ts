/*******************************************************************************
 * File Name : pressureDisplay.ts
 *
 * Description : DPS368 barometric pressure display helpers (unit, gauge range).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type PressureDisplayUnit = "hpa" | "kpa" | "pa";

export type PressureGaugeRange = "sea-level" | "full" | "auto";

export const PRESSURE_UNIT_LABELS: Record<PressureDisplayUnit, string> = {
  hpa: "hPa",
  kpa: "kPa",
  pa: "Pa",
};

export const PRESSURE_GAUGE_RANGE_LABELS: Record<PressureGaugeRange, string> = {
  "sea-level": "Sea level (900–1100 hPa)",
  full: "Full (300–1200 hPa)",
  auto: "Auto",
};

export type PressureDisplayFractionDigits = 0 | 1 | 2;

const SEA_LEVEL_MIN_HPA = 900;
const SEA_LEVEL_MAX_HPA = 1100;
const FULL_MIN_HPA = 300;
const FULL_MAX_HPA = 1200;
const AUTO_MIN_SPAN_HPA = 200;
const AUTO_HEADROOM = 1.08;

/** Wire: secondaryX100 stores hPa × 10. */
export function pressureHpaFromWireSecondaryX100(secondaryX100: number): number
{
  return secondaryX100 / 10;
}

export function convertPressureHpaToUnit(hpa: number, unit: PressureDisplayUnit): number
{
  switch (unit)
  {
    case "hpa":
      return hpa;
    case "kpa":
      return hpa / 10;
    case "pa":
      return hpa * 100;
    default:
    {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}

export type PressureGaugeLimits = {
  gaugeMin: number;
  gaugeMax: number;
};

export function resolvePressureGaugeLimitsHpa(
  range: PressureGaugeRange,
  pressureHpa: number | undefined,
): PressureGaugeLimits
{
  if (range === "full")
  {
    return { gaugeMin: FULL_MIN_HPA, gaugeMax: FULL_MAX_HPA };
  }

  if (range === "auto")
  {
    const center = typeof pressureHpa === "number" && Number.isFinite(pressureHpa)
      ? pressureHpa
      : 1013;
    const half = Math.max(AUTO_MIN_SPAN_HPA / 2, Math.ceil(center * 0.05 * AUTO_HEADROOM));
    return {
      gaugeMin: Math.max(FULL_MIN_HPA, Math.floor(center - half)),
      gaugeMax: Math.min(FULL_MAX_HPA, Math.ceil(center + half)),
    };
  }

  return { gaugeMin: SEA_LEVEL_MIN_HPA, gaugeMax: SEA_LEVEL_MAX_HPA };
}

export function resolvePressureGaugeLimits(
  range: PressureGaugeRange,
  pressureHpa: number | undefined,
  unit: PressureDisplayUnit,
): PressureGaugeLimits
{
  const hpaLimits = resolvePressureGaugeLimitsHpa(range, pressureHpa);
  return {
    gaugeMin: convertPressureHpaToUnit(hpaLimits.gaugeMin, unit),
    gaugeMax: convertPressureHpaToUnit(hpaLimits.gaugeMax, unit),
  };
}

export function formatPressureFromWireHpa(
  pressureHpa: number | undefined,
  unit: PressureDisplayUnit,
  fractionDigits: PressureDisplayFractionDigits,
): { text: string; unitLabel: string; numeric: number | undefined }
{
  if (typeof pressureHpa !== "number" || !Number.isFinite(pressureHpa))
  {
    return { text: "--", unitLabel: PRESSURE_UNIT_LABELS[unit], numeric: undefined };
  }
  const numeric = convertPressureHpaToUnit(pressureHpa, unit);
  return {
    text: numeric.toFixed(fractionDigits),
    unitLabel: PRESSURE_UNIT_LABELS[unit],
    numeric,
  };
}

export function isPressureDisplayUnit(value: unknown): value is PressureDisplayUnit
{
  return value === "hpa" || value === "kpa" || value === "pa";
}

export function isPressureGaugeRange(value: unknown): value is PressureGaugeRange
{
  return value === "sea-level" || value === "full" || value === "auto";
}

export function isPressureDisplayFractionDigits(
  value: unknown,
): value is PressureDisplayFractionDigits
{
  return value === 0 || value === 1 || value === 2;
}
