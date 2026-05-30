import type { Project4TelemetryStatus } from "../../hooks/useProject4Telemetry";

function truncateMiddle(url: string, maxChars: number): string {
  const u = url.trim();
  if (u.length <= maxChars) {
    return u || "(empty)";
  }
  const inner = Math.max(8, maxChars - 1);
  const head = Math.ceil(inner / 2);
  const tail = Math.floor(inner / 2);
  return `${u.slice(0, head)}…${u.slice(-tail)}`;
}

function statusTone(status: Project4TelemetryStatus): string {
  switch (status) {
    case "live":
      return "bg-emerald-500/20 text-emerald-100 ring-emerald-500/35";
    case "stale":
      return "bg-amber-500/15 text-amber-100 ring-amber-500/35";
    case "error":
      return "bg-rose-500/15 text-rose-100 ring-rose-500/35";
    default:
      return "bg-zinc-700/50 text-zinc-200 ring-zinc-600/60";
  }
}

export type ConnectionIndicatorProps = {
  status: Project4TelemetryStatus;
  mcuBaseUrl: string;
  lastSampleAt: number | null;
  lastError: string | null;
};

export function ConnectionIndicator(props: ConnectionIndicatorProps) {
  const sampleLabel =
    props.lastSampleAt != null
      ? new Date(props.lastSampleAt).toLocaleTimeString(undefined, {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";

  return (
    <div className="pointer-events-auto flex min-w-0 flex-1 flex-col gap-1 px-0.5 py-0.5 text-[11px] text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            "rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ring-1 " +
            statusTone(props.status)
          }
        >
          {props.status}
        </span>
        <span className="font-mono text-zinc-400">
          <span className="text-zinc-500">MCU </span>
          {truncateMiddle(props.mcuBaseUrl, 44)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-zinc-500">
        <span>
          Last sample <span className="font-mono text-zinc-300">{sampleLabel}</span>
        </span>
        {props.lastError != null ? (
          <span className="font-mono text-rose-200/95">{props.lastError}</span>
        ) : null}
      </div>
    </div>
  );
}
