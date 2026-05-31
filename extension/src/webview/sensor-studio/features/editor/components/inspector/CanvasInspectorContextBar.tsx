import { GitBranch } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { CanvasSensorHealthSummary } from "./canvas-inspector-helpers";

export type CanvasInspectorContextBarProps = {
  nodeCount: number;
  edgeCount: number;
  selectionCount: number;
  health: CanvasSensorHealthSummary;
};

function HealthPill(props: { label: string; count: number; toneClass: string }) {
  const { label, count, toneClass } = props;
  if (count <= 0) {
    return null;
  }
  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[10px] tabular-nums leading-none",
        toneClass,
      )}
    >
      <span className="opacity-80">{label}</span>
      <span>{count}</span>
    </span>
  );
}

export function CanvasInspectorContextBar(props: CanvasInspectorContextBarProps) {
  const { nodeCount, edgeCount, selectionCount, health } = props;

  const graphLine =
    selectionCount > 0
      ? `${nodeCount} nodes · ${edgeCount} edges · ${selectionCount} selected`
      : `${nodeCount} nodes · ${edgeCount} edges`;

  return (
    <div className="shrink-0 border-b border-zinc-800/70 px-2.5 py-2">
      <div className="flex min-w-0 items-start gap-2">
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sky-500/25 bg-sky-950/25 text-sky-300/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          aria-hidden
        >
          <GitBranch className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <div className="truncate text-[11px] font-semibold tracking-wide text-zinc-100/95">
              Flow canvas
            </div>
            {selectionCount > 0 ? (
              <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-950/30 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-sky-200/90">
                {selectionCount} sel
              </span>
            ) : null}
          </div>
          <p className="truncate text-[10px] leading-snug text-zinc-500">{graphLine}</p>
          {health.linked > 0 ? (
            <div className="flex flex-wrap gap-1 pt-0.5">
              <HealthPill
                label="live"
                count={health.live}
                toneClass="border-emerald-500/35 bg-emerald-950/35 text-emerald-200/95"
              />
              <HealthPill
                label="sim"
                count={health.sim}
                toneClass="border-violet-500/35 bg-violet-950/30 text-violet-200/95"
              />
              <HealthPill
                label="stale"
                count={health.stale}
                toneClass="border-amber-500/35 bg-amber-950/30 text-amber-100/95"
              />
              <HealthPill
                label="offline"
                count={health.offline}
                toneClass="border-zinc-600/50 bg-zinc-900/60 text-zinc-400"
              />
              {health.live + health.stale + health.offline + health.sim === 0 ? (
                <span className="text-[10px] text-zinc-600">
                  {health.linked} hardware-linked node{health.linked === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
