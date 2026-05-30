/*******************************************************************************
 * File Name : sensorConfigPanelDraft.ts
 *
 * Description : Helpers for SENSOR_CFG draft-until-Apply control panel mode.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type SensorCardAckState = {
  state: "idle" | "pending" | "ok" | "error";
  message?: string;
};

const IDLE_CARD_ACK: SensorCardAckState = { state: "idle" };

/** When true, per-card badges stay idle; use the pane Apply bar for apply status. */
export function cardAckForDraftMode(
  draftUntilApply: boolean | undefined,
  localAck: SensorCardAckState,
): SensorCardAckState
{
  if (draftUntilApply && localAck.state === "idle")
  {
    return IDLE_CARD_ACK;
  }
  return localAck;
}

export function runSensorCfgCardChange(
  draftUntilApply: boolean | undefined,
  beginAck: () => void,
  onChange: () => void,
): void
{
  if (!draftUntilApply)
  {
    beginAck();
  }
  onChange();
}
