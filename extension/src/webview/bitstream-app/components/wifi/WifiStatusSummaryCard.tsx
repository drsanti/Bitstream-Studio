/*******************************************************************************
 * File Name        : WifiStatusSummaryCard.tsx
 *
 * Description      : Connection summary for the Wi‑Fi panel Status tab.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.1
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Activity, Wifi, WifiOff } from "lucide-react";
import { TRNButton, TRNStatusIcon } from "@/ui/TRN";
import { WifiLinkProgressIcon } from "./WifiLinkProgressIcon";
import {
  formatWifiLinkState,
  formatWifiReason,
  formatWifiRssi,
  statusPillClass,
  statusTone,
} from "./wifi-panel-utils";

function toneValueClass(tone: "ok" | "warn" | "error" | "idle"): string {
  if (tone === "ok") {
    return "text-emerald-200";
  }
  if (tone === "warn") {
    return "text-amber-200";
  }
  if (tone === "error") {
    return "text-rose-200";
  }
  return "text-zinc-200";
}

function rssiTone(rssi: number): "ok" | "warn" | "error" | "idle" {
  if (rssi <= -127) {
    return "idle";
  }
  if (rssi > -60) {
    return "ok";
  }
  if (rssi > -75) {
    return "warn";
  }
  return "error";
}

export function WifiStatusSummaryCard(props: {
  state: number;
  rssi: number;
  ssid: string;
  reason: number;
  autoConnectEnabled: boolean | null;
  connectInFlight: boolean;
  onRefresh: () => void;
  onPolicyToggle: () => void;
  refreshDisabled: boolean;
}) {
  const {
    state,
    rssi,
    ssid,
    reason,
    autoConnectEnabled,
    connectInFlight,
    onRefresh,
    onPolicyToggle,
    refreshDisabled,
  } = props;

  const firmwareStateText = formatWifiLinkState(state);
  const showConnectingAnim = (connectInFlight && state !== 2) || state === 1;
  const showScanningAnim = state === 3 && !showConnectingAnim;

  const displayStateText =
    connectInFlight && state !== 2 ? "Connecting" : firmwareStateText;
  const displayState = connectInFlight && state !== 2 ? 1 : state;
  const stateTone = statusTone(displayState);
  const rssiText = formatWifiRssi(rssi);
  const rssiToneState = rssiTone(rssi);
  const showErrorDetail = state === 4 && reason !== 0;
  const connectionTileLive = showConnectingAnim || showScanningAnim;

  const stateIcon =
    showConnectingAnim ? (
      <WifiLinkProgressIcon motif="connecting" label="Connecting" />
    ) : showScanningAnim ? (
      <WifiLinkProgressIcon motif="scanning" label="Scanning" />
    ) : state === 2 ? (
      <Wifi className="h-4 w-4" />
    ) : (
      <WifiOff className="h-4 w-4" />
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusPillClass(displayState)}`}
        >
          {displayStateText}
        </span>
        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] ${
            autoConnectEnabled === true
              ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
              : "border-zinc-600/70 bg-zinc-800/60 text-zinc-300"
          }`}
        >
          Auto-connect: {autoConnectEnabled == null ? "Unknown" : autoConnectEnabled ? "On" : "Off"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className={`rounded-md border bg-zinc-900/55 p-2 ${
            connectionTileLive
              ? "border-sky-500/40 bg-zinc-900/65"
              : "border-zinc-700/80"
          }`}
        >
          <div className="mb-1 flex items-center gap-1.5 text-zinc-400">
            {showConnectingAnim || showScanningAnim ? (
              stateIcon
            ) : (
              <TRNStatusIcon
                icon={stateIcon}
                state={stateTone}
                label={displayStateText}
                className="px-0.5 py-0.5"
              />
            )}
            <span className="text-[10px] uppercase tracking-wide">Connection</span>
          </div>
          <p className={`text-sm font-semibold ${toneValueClass(stateTone)}`}>{displayStateText}</p>
          {showConnectingAnim ? (
            <p className="mt-0.5 text-[10px] leading-snug text-sky-200/80">Joining the network…</p>
          ) : null}
        </div>
        <div className="rounded-md border border-zinc-700/80 bg-zinc-900/55 p-2">
          <div className="mb-1 flex items-center gap-1 text-zinc-400">
            <TRNStatusIcon
              icon={<Activity className="h-4 w-4" />}
              state={showConnectingAnim ? "idle" : rssiToneState}
              label={`Signal ${rssiText}`}
              className="px-0.5 py-0.5"
            />
            <span className="text-[10px] uppercase tracking-wide">Signal</span>
          </div>
          <p
            className={`text-sm font-semibold ${
              showConnectingAnim ? "text-zinc-500" : toneValueClass(rssiToneState)
            }`}
          >
            {showConnectingAnim && rssi <= -127 ? "—" : rssiText}
          </p>
        </div>
        <div className="col-span-2 rounded-md border border-zinc-700/80 bg-zinc-900/55 p-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">Network</div>
          <p className="truncate text-sm font-semibold text-zinc-100">{ssid || "Not connected"}</p>
          {showErrorDetail ? (
            <p className="mt-1 text-[11px] text-rose-200/90">{formatWifiReason(reason)}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 pt-2">
        <TRNButton size="compact" className="text-[11px]" onClick={onRefresh} disabled={refreshDisabled}>
          Refresh status
        </TRNButton>
        <TRNButton size="compact" className="text-[11px]" onClick={onPolicyToggle} disabled={refreshDisabled}>
          {autoConnectEnabled ? "Turn off auto-connect" : "Turn on auto-connect"}
        </TRNButton>
      </div>
    </div>
  );
}
