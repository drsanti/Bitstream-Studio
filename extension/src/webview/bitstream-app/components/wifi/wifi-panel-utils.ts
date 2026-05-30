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
  if (lower.includes("connect")) return "connecting";
  if (lower.includes("disconnect")) return "disconnecting";
  if (lower.includes("scan")) return "scanning";
  if (lower.includes("policy")) return "policy";
  if (lower.includes("poll")) return "polling";
  return "idle";
}
