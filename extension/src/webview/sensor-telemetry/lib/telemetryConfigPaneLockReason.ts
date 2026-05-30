/*******************************************************************************
 * File Name : telemetryConfigPaneLockReason.ts
 *
 * Description : Human-readable lock reasons for the Configuration workbench pane.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { Bs2ControlReadySnapshot } from "../../bitstream-app/hooks/useBs2ControlReady.js";

export type TelemetryConfigLockReason = {
  message: string;
  tone: "warning" | "muted";
};

/** Resolve why sensor cfg controls are disabled; null when editing is allowed. */
export function resolveTelemetryConfigLockReason(
  linkOk: boolean,
  bs2Ready: Bs2ControlReadySnapshot,
  truthReady: boolean,
): TelemetryConfigLockReason | null
{
  if (!bs2Ready.ready)
  {
    if (bs2Ready.reason === "ws_disconnected")
    {
      return {
        message: "Connect Link (broker WebSocket) to edit sensor configuration.",
        tone: "warning",
      };
    }
    if (bs2Ready.reason === "com_closed")
    {
      return {
        message: "Open the serial port for UART, or switch telemetry backend to Simulation.",
        tone: "warning",
      };
    }
  }

  if (!linkOk)
  {
    return {
      message: "Wait for BS2 HELLO or serial handshake before editing sensors.",
      tone: "warning",
    };
  }

  if (!truthReady)
  {
    return {
      message: "Loading sensor configuration from board…",
      tone: "muted",
    };
  }

  return null;
}
