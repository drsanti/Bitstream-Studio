import type { ReactNode } from "react";
import { TRNHintText } from "@/ui/TRN";

/**
 * Read-only label/value row for sensor configuration summaries (device truth panels).
 */
export function SensorConfigMetricRow(props: {
  label: string;
  value: ReactNode;
  hint?: string;
})
{
  const { label, value, hint } = props;

  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded border border-zinc-800/60 bg-zinc-950/25 px-2 py-1.5">
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</span>
        <span className="min-w-0 truncate text-end text-[11px] font-medium text-zinc-100">{value}</span>
      </div>
      {hint != null && hint.length > 0 ? (
        <TRNHintText tone="muted" className="mb-0 text-[9px] leading-snug">
          {hint}
        </TRNHintText>
      ) : null}
    </div>
  );
}
