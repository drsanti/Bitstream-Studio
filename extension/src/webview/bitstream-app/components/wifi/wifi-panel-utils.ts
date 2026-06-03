import { BS2_WIFI_EVT_KIND, BS2_WIFI_PASSWORD_BUF, BS2_WIFI_SSID_BUF } from "../../../../bitstream2/domains/wifi/commands";

/** Max SSID characters for WIFI_SCAN_SSID REQ body. */
export const BS2_WIFI_SCAN_SSID_MAX_LEN = 32;

/** UI wait for Wi‑Fi scan EVT rows / SCAN_DONE before timeout empty state. */
export const WIFI_SCAN_UI_TIMEOUT_MS = 10_000;

/** Max SSID/password characters for WIFI_CONNECT fixed buffers (NUL-terminated). */
export const BS2_WIFI_CONNECT_SSID_MAX_LEN = BS2_WIFI_SSID_BUF - 1;
export const BS2_WIFI_CONNECT_PASSWORD_MAX_LEN = BS2_WIFI_PASSWORD_BUF - 1;

/** Internal busy tokens set by BitstreamWifiPanel (not shown verbatim in UI). */
export type WifiUserBusyToken =
  | "connecting"
  | "disconnecting"
  | "scanning"
  | "refreshing"
  | "saving";

export function formatWifiUserBusyMessage(token: WifiUserBusyToken | null, ssid?: string): string {
  if (token == null) {
    return "Ready";
  }
  switch (token) {
    case "connecting":
      return ssid != null && ssid.length > 0 ? `Connecting to “${ssid}”…` : "Connecting…";
    case "disconnecting":
      return "Disconnecting…";
    case "scanning":
      return "Looking for networks…";
    case "refreshing":
      return "Updating connection status…";
    case "saving":
      return "Saving setting…";
    default:
      return "Working…";
  }
}

export function resolveWifiUserBusyToken(busy: string | null): WifiUserBusyToken | null {
  if (busy == null || busy.length === 0) {
    return null;
  }
  if (busy === "connecting" || busy === "disconnecting" || busy === "scanning" || busy === "refreshing" || busy === "saving") {
    return busy;
  }
  const lower = busy.toLowerCase();
  if (lower.includes("connect") && !lower.includes("disconnect")) {
    return "connecting";
  }
  if (lower.includes("disconnect")) {
    return "disconnecting";
  }
  if (lower.includes("scan")) {
    return "scanning";
  }
  if (lower.includes("policy") || lower.includes("saving")) {
    return "saving";
  }
  if (lower.includes("poll") || lower.includes("status") || lower.includes("refresh")) {
    return "refreshing";
  }
  return null;
}

export function formatCapsWarningForUser(wifiAdvertised: boolean, lastRxPresent: boolean): string | null {
  if (wifiAdvertised) {
    return null;
  }
  if (lastRxPresent) {
    return "Wi‑Fi is working, but the device did not report Wi‑Fi support at connect. You can still try Connect.";
  }
  return "This device did not report Wi‑Fi support. Connect and scan may not work until firmware advertises Wi‑Fi.";
}

/** BS2 EVT_STATUS inner `kind` byte (Wi‑Fi). */
export function formatWifiEvtKind(kind: number): string {
  switch (kind) {
    case BS2_WIFI_EVT_KIND.LINK:
      return "LINK";
    case BS2_WIFI_EVT_KIND.SCAN_ROW:
      return "SCAN_ROW";
    case BS2_WIFI_EVT_KIND.SCAN_DONE:
      return "SCAN_DONE";
    case BS2_WIFI_EVT_KIND.POLICY:
      return "POLICY";
    default:
      return `0x${kind.toString(16).padStart(2, "0")}`;
  }
}

export function formatTs(ms: number | null): string {
  if (ms == null) {
    return "—";
  }
  try {
    return new Date(ms).toLocaleTimeString();
  } catch {
    return "—";
  }
}

export function formatEventTime(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString();
  } catch {
    return "—";
  }
}

/** MAC address from BS2 SCAN_ROW `bssid` bytes. */
export function formatWifiBssid(bssid: Uint8Array): string {
  if (bssid.length === 0) {
    return "—";
  }
  return Array.from(bssid)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":");
}

/** Mirrors `ipc_wifi_link_state_t` / CM33 → CM55 Wi‑Fi manager (TESAIoT `ipc_wifi_ipc_types.h`). */
export function formatWifiLinkState(state: number): string {
  switch (state) {
    case 0:
      return "Disconnected";
    case 1:
      return "Connecting";
    case 2:
      return "Connected";
    case 3:
      return "Scanning";
    case 4:
      return "Error";
    default:
      return `Unknown (${state})`;
  }
}

/** Mirrors `ipc_wifi_disconnect_reason_t` (subset — extend when firmware adds codes). */
export function formatWifiReason(reason: number): string {
  switch (reason) {
    case 0:
      return "None";
    case 1:
      return "Scan blocked (connected)";
    case 2:
      return "Scan failed";
    case 3:
      return "Connect failed";
    case 4:
      return "Disconnected";
    default:
      return `Code ${reason}`;
  }
}

export function statusTone(state: number): "ok" | "warn" | "error" | "idle" {
  if (state === 2) return "ok";
  if (state === 1 || state === 3) return "warn";
  if (state === 4) return "error";
  return "idle";
}

export function statusPillClass(state: number): string {
  if (state === 2) return "border-emerald-500/35 bg-emerald-500/15 text-emerald-200";
  if (state === 1 || state === 3) return "border-sky-500/35 bg-sky-500/15 text-sky-200";
  if (state === 4) return "border-rose-500/35 bg-rose-500/15 text-rose-200";
  return "border-zinc-600/60 bg-zinc-800/50 text-zinc-300";
}

export function rssiToneClass(rssi: number): string {
  // Firmware uses -127 when RSSI is unknown / no signal yet.
  if (rssi <= -127) return "text-zinc-400";
  if (rssi > -60) return "text-emerald-300";
  if (rssi > -75) return "text-amber-300";
  return "text-rose-300";
}

export function formatWifiRssi(rssi: number): string {
  if (rssi <= -127) {
    return "—";
  }
  return `${rssi} dBm`;
}

export type WifiBusyStage =
  | "connecting"
  | "disconnecting"
  | "scanning"
  | "polling"
  | "policy"
  | "idle";

export function resolveWifiBusyStage(busy: string | null): WifiBusyStage {
  if (!busy) return "idle";
  const lower = busy.toLowerCase();
  if (lower.includes("0x20") || lower.includes("connect")) return "connecting";
  if (lower.includes("0x21") || lower.includes("disconnect")) return "disconnecting";
  if (lower.includes("0x22") || lower.includes("0x23") || lower.includes("scan")) return "scanning";
  if (lower.includes("0x25") || lower.includes("0x26") || lower.includes("policy")) return "policy";
  if (lower.includes("0x24") || lower.includes("status")) return "polling";
  return "idle";
}

