/*******************************************************************************
 * File Name        : wifi-activity-events.ts
 *
 * Description      : Structured Wi‑Fi Activity tab events and append/collapse helpers.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { formatWifiLinkState, formatWifiRssi } from "./wifi-panel-utils";

export type WifiActivityBadgeTone = "ok" | "warn" | "error" | "idle" | "info" | "scan";

export type WifiActivityEvent = {
  at: number;
  badge: string;
  tone: WifiActivityBadgeTone;
  primary: string;
  meta?: string;
  /** When set, rapid repeats update the newest matching row (RSSI-only status ticks). */
  collapseKey?: string;
};

const RSSI_COLLAPSE_WINDOW_MS = 5000;
const MAX_ACTIVITY_EVENTS = 12;

/** Pill colors per activity badge tone. */
export function wifiActivityBadgeClass(tone: WifiActivityBadgeTone): string {
  switch (tone) {
    case "ok":
      return "border-emerald-500/35 bg-emerald-500/15 text-emerald-200";
    case "warn":
      return "border-sky-500/35 bg-sky-500/15 text-sky-200";
    case "scan":
      return "border-violet-500/35 bg-violet-500/15 text-violet-200";
    case "error":
      return "border-rose-500/35 bg-rose-500/15 text-rose-200";
    case "info":
      return "border-zinc-600/70 bg-zinc-800/60 text-zinc-300";
    case "idle":
    default:
      return "border-zinc-600/60 bg-zinc-800/50 text-zinc-400";
  }
}

function linkStateToTone(state: number): WifiActivityBadgeTone {
  if (state === 2) {
    return "ok";
  }
  if (state === 1 || state === 3) {
    return "warn";
  }
  if (state === 4) {
    return "error";
  }
  return "idle";
}

/** Build a status row from BS2 link state + SSID + RSSI. */
export function wifiActivityFromLinkStatus(
  state: number,
  ssid: string,
  rssi: number,
  atMs: number = Date.now(),
): WifiActivityEvent {
  const badge = formatWifiLinkState(state);
  const network = ssid.trim().length > 0 ? ssid.trim() : "No network";
  return {
    at: atMs,
    badge,
    tone: linkStateToTone(state),
    primary: network,
    meta: rssi <= -127 ? undefined : formatWifiRssi(rssi),
    collapseKey: `status|${state}|${network}`,
  };
}

/** Prepend or merge into the activity list (newest first). */
export function appendWifiActivityEvent(
  prev: WifiActivityEvent[],
  evt: WifiActivityEvent,
): WifiActivityEvent[] {
  if (evt.collapseKey != null && prev.length > 0) {
    const head = prev[0];
    if (
      head.collapseKey === evt.collapseKey &&
      head.badge === evt.badge &&
      evt.at - head.at <= RSSI_COLLAPSE_WINDOW_MS
    ) {
      return [{ ...head, at: evt.at, meta: evt.meta }, ...prev.slice(1)].slice(0, MAX_ACTIVITY_EVENTS);
    }
  }
  return [evt, ...prev].slice(0, MAX_ACTIVITY_EVENTS);
}

export function createWifiActivityEvent(
  badge: string,
  tone: WifiActivityBadgeTone,
  primary: string,
  meta?: string,
): WifiActivityEvent {
  return {
    at: Date.now(),
    badge,
    tone,
    primary,
    meta,
  };
}
