/*******************************************************************************
 * File Name : fusionEulerAngleDisplay.ts
 *
 * Description : BMI270 fusion Euler angle display modes for the telemetry deck
 *               (−π…+π rad, −180…+180°, 0…360°). Wire decode stays radians.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { wrapRadiansSignedPi } from "./telemetryFormat.js";

/** User-selectable angle readout for BMI270 Euler telemetry rows. */
export type FusionEulerAngleDisplayMode =
  | "signed-pi-rad"
  | "signed-deg"
  | "unsigned-deg";

export const FUSION_EULER_ANGLE_DISPLAY_MODE_LABELS: Record<
  FusionEulerAngleDisplayMode,
  string
> = {
  "signed-pi-rad": "−π … +π (rad)",
  "signed-deg": "−180 … +180 (°)",
  "unsigned-deg": "0 … 360 (°)",
};

export const FUSION_EULER_ANGLE_DISPLAY_MODE_DESCRIPTIONS: Record<
  FusionEulerAngleDisplayMode,
  string
> = {
  "signed-pi-rad":
    "Signed radians in (−π, π], same wrap as fusion wire decode.",
  "signed-deg":
    "Signed degrees in (−180°, 180°] after wrapping wire radians.",
  "unsigned-deg":
    "Compass-style degrees in [0°, 360°) from wrapped wire radians.",
};

const RAD_PER_DEG = Math.PI / 180;

/** Decode fusion Euler wire field (rad ×100) to signed radians in (−π, π]. */
export function fusionEulerRadFromWireHundredths(value: number): number
{
  return wrapRadiansSignedPi(value / 100);
}

export type FusionEulerDisplayRow = {
  text: string;
  unit: string;
  centerZeroGaugeMaxAbs?: number;
  oneSidedGaugeMaxAbs?: number;
  /** TRNParameter: omit leading + on positive values (0…360°). */
  positiveSignMode?: "always" | "omit";
};

/** Format one Euler component for deck display (does not change wire values). */
export function formatFusionEulerDisplayFromRad(
  radSignedPi: number,
  mode: FusionEulerAngleDisplayMode,
  fractionDigits = 2,
): FusionEulerDisplayRow
{
  switch (mode)
  {
    case "signed-pi-rad":
      return {
        text: radSignedPi.toFixed(fractionDigits),
        unit: "rad",
        centerZeroGaugeMaxAbs: Math.PI,
        positiveSignMode: "always",
      };
    case "signed-deg":
    {
      const deg = radSignedPi / RAD_PER_DEG;
      return {
        text: deg.toFixed(fractionDigits),
        unit: "°",
        centerZeroGaugeMaxAbs: 180,
        positiveSignMode: "always",
      };
    }
    case "unsigned-deg":
    {
      const deg = ((radSignedPi / RAD_PER_DEG) % 360 + 360) % 360;
      return {
        text: deg.toFixed(fractionDigits),
        unit: "°",
        oneSidedGaugeMaxAbs: 360,
        positiveSignMode: "omit",
      };
    }
    default:
    {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function isFusionEulerAngleDisplayMode(
  value: unknown,
): value is FusionEulerAngleDisplayMode
{
  return (
    value === "signed-pi-rad" ||
    value === "signed-deg" ||
    value === "unsigned-deg"
  );
}
