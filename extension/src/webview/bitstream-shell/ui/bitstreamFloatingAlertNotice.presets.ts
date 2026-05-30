/*******************************************************************************
 * File Name : bitstreamFloatingAlertNotice.presets.ts
 *
 * Description : Default icon/title/animation presets for Bitstream floating alerts.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Cpu, FlaskConical } from "lucide-react";
import type { BitstreamFloatingAlertNoticeConfig } from "./BitstreamFloatingAlertNotice.types.js";

/** Visible duration once the notice opens (auto-dismiss unless hovered). */
export const BITSTREAM_ALERT_AUTO_DISMISS_MS = 10_000;

/** Simulator source — no EVT_SENSOR within grace window. */
export const BITSTREAM_ALERT_PRESET_SIMULATOR: BitstreamFloatingAlertNoticeConfig = {
  id: "simulator-missing-data",
  title: "Simulator not sending data",
  variant: "warning",
  Icon: FlaskConical,
  iconAnimation: "bob-glow",
  iconColorClass: "text-amber-400",
  autoDismissMs: BITSTREAM_ALERT_AUTO_DISMISS_MS,
  pauseDismissOnHover: true,
};

/** Bitstream source — no BS2 handshake within grace window. */
export const BITSTREAM_ALERT_PRESET_UART: BitstreamFloatingAlertNoticeConfig = {
  id: "uart-missing-handshake",
  title: "Board not responding yet",
  variant: "warning",
  Icon: Cpu,
  iconAnimation: "bob-glow",
  iconColorClass: "text-amber-400",
  autoDismissMs: BITSTREAM_ALERT_AUTO_DISMISS_MS,
  pauseDismissOnHover: true,
};
