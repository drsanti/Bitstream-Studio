import { TRNHighlightedJsonBlock } from "../../ui/TRN/TRNHighlightedJsonBlock";
import { TRNInteractiveCard } from "../../ui/TRN/TRNInteractiveCard";
import {
  type Project4TelemetryStatus,
  type UseProject4TelemetryResult,
} from "../hooks/useProject4Telemetry";
import { buildTelemetryUrl } from "../lib/mcu-http";
import { useProject4SettingsStore } from "../settings/project4-settings.store";

function statusBadgeClass(status: Project4TelemetryStatus): string {
  switch (status) {
    case "live":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35";
    case "stale":
      return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35";
    case "error":
      return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/35";
    default:
      return "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-600/50";
  }
}

export type Project4McuTelemetryCardProps = {
  telemetry: UseProject4TelemetryResult;
};

export function Project4McuTelemetryCard(props: Project4McuTelemetryCardProps) {
  const { status, snapshot, lastSampleAt, lastError, staleThresholdMs } = props.telemetry;
  const mcuBaseUrl = useProject4SettingsStore((st) => st.mcuBaseUrl);
  const telemetryPath = useProject4SettingsStore((st) => st.telemetryPath);

  const resolvedUrl = buildTelemetryUrl(useProject4SettingsStore.getState());
  const json = JSON.stringify(snapshot ?? {}, null, 2);

  return (
    <TRNInteractiveCard
      title="MCU telemetry"
      titleTrailingSlot={
        <span
          className={
            "rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide " +
            statusBadgeClass(status)
          }
        >
          {status}
        </span>
      }
      className="border-white/12 bg-zinc-950/40 text-zinc-100 shadow-none backdrop-blur-xl backdrop-saturate-150"
      headerClassName="border-white/10 bg-zinc-900/45 backdrop-blur-md"
    >
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400">
          <span>
            <span className="text-zinc-500">Base </span>
            <span className="font-mono text-zinc-300">{mcuBaseUrl || "(empty)"}</span>
          </span>
          <span>
            <span className="text-zinc-500">GET </span>
            <span className="font-mono text-zinc-300">{telemetryPath}</span>
          </span>
        </div>
        <div className="font-mono text-[10px] text-zinc-500 break-all">Resolved {resolvedUrl}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400">
          <span>
            Last sample{" "}
            <span className="font-mono text-zinc-200">
              {lastSampleAt != null ? new Date(lastSampleAt).toISOString() : "—"}
            </span>
          </span>
          <span>
            Stale after{" "}
            <span className="font-mono text-zinc-200">{staleThresholdMs}</span> ms quiet
          </span>
        </div>
        {lastError != null ? (
          <div className="space-y-1">
            <p className="rounded border border-rose-500/35 bg-rose-950/40 px-2 py-1 font-mono text-[11px] text-rose-200">
              {lastError}
            </p>
            <p className="text-[10px] leading-snug text-zinc-500">
              Check that the robot AP is reachable from this machine, the URL in Settings matches the MCU,
              and the browser allows the request (mixed content or CORS can block LAN HTTP from an{" "}
              <span className="font-mono text-zinc-400">https</span> dev page).
            </p>
          </div>
        ) : null}
        <TRNHighlightedJsonBlock value={json} className="max-h-56 text-[11px]" />
      </div>
    </TRNInteractiveCard>
  );
}
