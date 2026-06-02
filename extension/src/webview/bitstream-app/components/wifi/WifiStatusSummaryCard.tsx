import { Activity, LoaderCircle, Radio, Wifi, WifiOff } from "lucide-react";
import { TRNCard } from "../../../ui/TRN/TRNCard";
import { TRNStatusIcon } from "../../../ui/TRN/TRNStatusIcon";
import {
  formatWifiLinkState,
  formatWifiRssi,
  formatWifiReason,
  statusPillClass,
  statusTone,
} from "./wifi-panel-utils";

function toneValueClass(tone: "ok" | "warn" | "error" | "idle"): string {
  if (tone === "ok") return "text-emerald-200";
  if (tone === "warn") return "text-amber-200";
  if (tone === "error") return "text-rose-200";
  return "text-zinc-200";
}

function rssiTone(rssi: number): "ok" | "warn" | "error" | "idle" {
  // Firmware uses -127 when RSSI is unknown / no signal yet.
  if (rssi <= -127) return "idle";
  if (rssi > -60) return "ok";
  if (rssi > -75) return "warn";
  return "error";
}

export function WifiStatusSummaryCard(props: {
  state: number;
  rssi: number;
  ssid: string;
  reason: number;
  autoConnectEnabled: boolean | null;
  busy: string | null;
}) {
  const { state, rssi, ssid, reason, autoConnectEnabled, busy } = props;
  const stateText = formatWifiLinkState(state);
  const stateTone = statusTone(state);
  const rssiText = formatWifiRssi(rssi);
  const rssiToneState = rssiTone(rssi);
  const stateIcon =
    state === 2 ? (
      <Wifi className="h-4 w-4" />
    ) : state === 1 || state === 3 ? (
      <Radio className="h-4 w-4 animate-pulse" />
    ) : (
      <WifiOff className="h-4 w-4" />
    );

  return (
    <TRNCard
      title="Wi‑Fi (Bitstream)"
      icon={<Wifi className="h-4 w-4" />}
      mode="simple"
      collapsible={false}
      glass
      glassPreset="medium"
      titleTrailing={
        <span className="inline-flex items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusPillClass(state)}`}>{stateText}</span>
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] ${
              autoConnectEnabled === true
                ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
                : "border-zinc-600/70 bg-zinc-800/60 text-zinc-300"
            }`}
          >
            Auto: {autoConnectEnabled == null ? "?" : autoConnectEnabled ? "On" : "Off"}
          </span>
        </span>
      }
      contentClassName="space-y-2 p-2"
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-zinc-700/80 bg-zinc-900/55 p-2">
          <div className="mb-1 flex items-center gap-1 text-zinc-400">
            <TRNStatusIcon icon={stateIcon} state={stateTone} label={`State ${stateText}`} className="px-0.5 py-0.5" />
            <span className="text-[10px] uppercase tracking-wide">State</span>
          </div>
          <p className={`text-sm font-semibold ${toneValueClass(stateTone)}`}>{stateText}</p>
        </div>
        <div className="rounded-md border border-zinc-700/80 bg-zinc-900/55 p-2">
          <div className="mb-1 flex items-center gap-1 text-zinc-400">
            <TRNStatusIcon
              icon={<Activity className="h-4 w-4" />}
              state={rssiToneState}
              label={`RSSI ${rssiText}`}
              className="px-0.5 py-0.5"
            />
            <span className="text-[10px] uppercase tracking-wide">RSSI</span>
          </div>
          <p className={`text-sm font-semibold ${toneValueClass(rssiToneState)}`}>{rssiText}</p>
        </div>
        <div className="rounded-md border border-zinc-700/80 bg-zinc-900/55 p-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">SSID</div>
          <p className="truncate text-sm font-semibold text-zinc-100">{ssid || "(empty)"}</p>
        </div>
        <div className="rounded-md border border-zinc-700/80 bg-zinc-900/55 p-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">Reason</div>
          <p className="text-sm font-semibold text-zinc-100">
            {reason} <span className="text-zinc-400">({formatWifiReason(reason)})</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        {busy ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/35 bg-sky-500/15 px-2 py-0.5 text-sky-100">
            <LoaderCircle className="h-3 w-3 animate-spin" />
            {busy}
          </span>
        ) : null}
      </div>
    </TRNCard>
  );
}
