/*******************************************************************************
 * File Name : temperatureDisplay.ts
 *
 * Description : Temperature formatting for telemetry cards with global unit and
 *               precision options (°C, °F, K).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type TemperatureDisplayUnit = "c" | "f" | "k";

export const TEMPERATURE_UNIT_LABELS: Record<TemperatureDisplayUnit, string> = {
  c: "°C",
  f: "°F",
  k: "K",
};

export type TemperatureDisplayFractionDigits = 0 | 1 | 2;

export function isTemperatureDisplayUnit(value: unknown): value is TemperatureDisplayUnit
{
  return value === "c" || value === "f" || value === "k";
}

export function isTemperatureDisplayFractionDigits(
  value: unknown,
): value is TemperatureDisplayFractionDigits
{
  return value === 0 || value === 1 || value === 2;
}

export function convertTemperatureCToUnit(celsius: number, unit: TemperatureDisplayUnit): number
{
  switch (unit)
  {
    case "c":
      return celsius;
    case "f":
      return celsius * (9 / 5) + 32;
    case "k":
      return celsius + 273.15;
    default:
    {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}

export function formatTemperatureFromC(
  celsius: number | undefined,
  unit: TemperatureDisplayUnit,
  fractionDigits: TemperatureDisplayFractionDigits,
): { text: string; unitLabel: string; numeric: number | undefined }
{
  if (typeof celsius !== "number" || !Number.isFinite(celsius))
  {
    return { text: "--", unitLabel: TEMPERATURE_UNIT_LABELS[unit], numeric: undefined };
  }
  const numeric = convertTemperatureCToUnit(celsius, unit);
  return {
    text: numeric.toFixed(fractionDigits),
    unitLabel: TEMPERATURE_UNIT_LABELS[unit],
    numeric,
  };
}

/** True when a decoded sample object includes a BS2 temperature field (mask had TMP / TEMP). */
export function hasTemperatureCx100(sample: unknown): boolean
{
  return (
    sample != null &&
    typeof sample === "object" &&
    "temperatureCx100" in sample &&
    typeof (sample as { temperatureCx100?: unknown }).temperatureCx100 === "number" &&
    Number.isFinite((sample as { temperatureCx100: number }).temperatureCx100)
  );
}

export function readTemperatureCFromSample(sample: unknown): number | undefined
{
  if (!hasTemperatureCx100(sample))
  {
    return undefined;
  }
  return (sample as { temperatureCx100: number }).temperatureCx100 / 100;
}

