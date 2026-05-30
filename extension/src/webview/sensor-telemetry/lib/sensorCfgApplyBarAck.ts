/*******************************************************************************
 * File Name : sensorCfgApplyBarAck.ts
 *
 * Description : Filter global sensor cfg ACK for the Configuration Apply bar.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { SensorConfigAckState } from "../../bitstream-app/types/sensorConfigAck.js";

/** Scope global cfg ack to Apply bar (exclude BMI270 stream-mode immediate applies). */
export function sensorCfgApplyBarAck(ack: SensorConfigAckState): SensorConfigAckState | undefined
{
  if (ack.state === "idle")
  {
    return undefined;
  }
  if (ack.pendingReason === "bmi270_output_mode")
  {
    return undefined;
  }
  return ack;
}
