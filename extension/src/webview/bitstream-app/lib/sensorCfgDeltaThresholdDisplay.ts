/*******************************************************************************
 * File Name : sensorCfgDeltaThresholdDisplay.ts
 *
 * Description : Human-readable labels for SENSOR_CFG deltaX100 (on-change gate).
 *               Wire value unchanged; display-only helpers for config cards.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/** Slider / preset chip label for deltaX100 (0 = most sensitive). */
export function formatDeltaThresholdDisplay(deltaX100: number): string
{
  const n = Math.round(deltaX100);
  if (n <= 0)
  {
    return "Any";
  }
  return `${n}%`;
}

/** Tooltip for delta threshold controls (absolute encoded units, not relative %). */
export const DELTA_THRESHOLD_SLIDER_TITLE =
  "Minimum change before publish (on-change / hybrid). Values are sensitivity steps, not % of the last sample.";
