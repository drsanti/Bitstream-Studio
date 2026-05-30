/*******************************************************************************
 * File Name : uartHandshakeMissingAlert.ts
 *
 * Description : Pure helpers for UART source — no handshake within grace window.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { HandshakeLifecycleState } from "../../bitstream-app/state/bitstreamLive.store.js";
import type { BitstreamTelemetryBackend } from "../../bitstream-app/state/bitstreamTelemetryBackend.js";
import {
  isLinkHandshakeSatisfied,
  type TelemetryTransportSnapshot,
} from "../../bitstream-app/utils/bitstreamTelemetryTransport.js";

/** Grace period after explicit UART switch before showing the notice. */
export const UART_MISSING_HANDSHAKE_GRACE_MS = 10_000;

export function isUartHandshakeEstablished(args: {
  handshakeState: HandshakeLifecycleState;
  conn: TelemetryTransportSnapshot;
}): boolean {
  return isLinkHandshakeSatisfied(args.handshakeState, args.conn);
}

export function shouldShowUartMissingHandshakeNotice(args: {
  backend: BitstreamTelemetryBackend;
  watchStartedAtMs: number | null;
  nowMs: number;
  handshakeState: HandshakeLifecycleState;
  conn: TelemetryTransportSnapshot;
  graceMs?: number;
}): boolean {
  const graceMs = args.graceMs ?? UART_MISSING_HANDSHAKE_GRACE_MS;
  if (args.backend !== "uart") {
    return false;
  }
  if (args.watchStartedAtMs == null) {
    return false;
  }
  if (args.nowMs - args.watchStartedAtMs < graceMs) {
    return false;
  }
  if (args.handshakeState === "failed") {
    return false;
  }
  return !isUartHandshakeEstablished({
    handshakeState: args.handshakeState,
    conn: args.conn,
  });
}

export function uartMissingHandshakeMessage(args: {
  wsConnected: boolean;
  comOpen: boolean;
}): string {
  if (!args.wsConnected) {
    return (
      "Press Link in the toolbar to connect to TERNION, then plug in your board with USB."
    );
  }
  if (!args.comOpen) {
    return (
      "Connect your board by USB. If it is already plugged in, try another cable or USB port " +
      "and wait a few seconds."
    );
  }
  return (
    "The board is not responding yet. Check power, USB, and that BS2 firmware is running. " +
    "Try unplug and replug USB."
  );
}
