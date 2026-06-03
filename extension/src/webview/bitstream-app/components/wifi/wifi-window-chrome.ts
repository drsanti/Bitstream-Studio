/*******************************************************************************
 * File Name        : wifi-window-chrome.ts
 *
 * Description      : TRNWindow title and header chrome for the Device Wi‑Fi panel.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamWifiStatusPayload } from "../../../../bitstream2/domains/wifi/store-types";
import { formatWifiLinkState, formatWifiRssi } from "./wifi-panel-utils";

/** Default window title before link status is known. */
export const WIFI_WINDOW_TITLE_BASE = "Device Wi‑Fi";

/** Build a user-facing window title from the latest link status. */
export function formatWifiWindowTitle(lastStatus: BitstreamWifiStatusPayload | null): string {
  if (lastStatus == null) {
    return WIFI_WINDOW_TITLE_BASE;
  }
  const ssid = lastStatus.ssid.trim();
  if (lastStatus.state === 2 && ssid.length > 0) {
    return `${WIFI_WINDOW_TITLE_BASE} · ${ssid}`;
  }
  return `${WIFI_WINDOW_TITLE_BASE} · ${formatWifiLinkState(lastStatus.state)}`;
}

/** Compact RSSI label for the title bar (fixed width friendly). */
export function formatWifiWindowHeaderRssi(rssi: number): string | null {
  if (rssi <= -127) {
    return null;
  }
  return formatWifiRssi(rssi);
}
