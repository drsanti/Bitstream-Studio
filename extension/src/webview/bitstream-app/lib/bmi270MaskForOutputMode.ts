/*******************************************************************************
 * File Name : bmi270MaskForOutputMode.ts
 *
 * Description : SENSOR_CFG mask helpers when BMI270 output mode needs fusion channels.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BMI270_MASK } from "../../../bitstream2/domains/sensors/bmi270.js";
import type { Bmi270StreamModeUi } from "../state/bitstreamConfig.store.js";

const FUSION_CHANNEL_BITS = BMI270_MASK.EULER | BMI270_MASK.QUAT;

/** True when SENSOR_CFG mask includes both Euler and Quaternion bits. */
export function bmi270MaskIncludesFusionChannels(mask: number): boolean
{
  return (mask & FUSION_CHANNEL_BITS) === FUSION_CHANNEL_BITS;
}

/** OR in Euler + Quat when output mode is fusion or hybrid (SENSOR_CFG prerequisite). */
export function bmi270MaskForFusionOutput(mode: Bmi270StreamModeUi, currentMask: number): number
{
  if (mode === "raw")
  {
    return currentMask & 0xff;
  }
  return (currentMask | FUSION_CHANNEL_BITS) & 0xff;
}
