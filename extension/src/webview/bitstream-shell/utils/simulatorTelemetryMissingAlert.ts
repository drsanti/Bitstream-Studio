/*******************************************************************************
 * File Name : simulatorTelemetryMissingAlert.ts
 *
 * Description : Pure helpers for Simulator source — no EVT_SENSOR within grace window.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamTelemetryBackend } from "../../bitstream-app/state/bitstreamTelemetryBackend.js";

/** Grace period after explicit Simulator switch before showing the notice. */
export const SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS = 3_000;

export function hasEvtSensorSinceSimulatorSwitch(args: {
  watchStartedAtMs: number;
  lastEvtSensorRxAtMs: number | null;
  evtSensorRxCount?: number;
  evtSensorRxCountBaseline?: number;
}): boolean {
  const { watchStartedAtMs, lastEvtSensorRxAtMs, evtSensorRxCount, evtSensorRxCountBaseline } = args;
  if (
    evtSensorRxCount != null &&
    evtSensorRxCountBaseline != null &&
    evtSensorRxCount > evtSensorRxCountBaseline
  ) {
    return true;
  }
  return lastEvtSensorRxAtMs != null && lastEvtSensorRxAtMs >= watchStartedAtMs;
}

export function shouldShowSimulatorMissingNotice(args: {
  backend: BitstreamTelemetryBackend;
  watchStartedAtMs: number | null;
  nowMs: number;
  lastEvtSensorRxAtMs: number | null;
  graceMs?: number;
}): boolean {
  const graceMs = args.graceMs ?? SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS;
  if (args.backend !== "simulator") {
    return false;
  }
  if (args.watchStartedAtMs == null) {
    return false;
  }
  if (args.nowMs - args.watchStartedAtMs < graceMs) {
    return false;
  }
  return !hasEvtSensorSinceSimulatorSwitch({
    watchStartedAtMs: args.watchStartedAtMs,
    lastEvtSensorRxAtMs: args.lastEvtSensorRxAtMs,
  });
}

export function simulatorMissingNoticeMessage(wsConnected: boolean): string {
  if (!wsConnected) {
    return (
      "Press Link in the toolbar to connect to TERNION, then open the Bitstream Simulator " +
      "extension and tap Start or Streaming."
    );
  }
  return (
    "Open the Bitstream Simulator extension (VS Code Activity bar), tap Start or Streaming, " +
    "and wait a few seconds for sample data. No USB board or COM port is needed."
  );
}
