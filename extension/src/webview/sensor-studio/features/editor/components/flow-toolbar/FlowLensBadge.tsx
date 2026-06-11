import { GitBranch } from "lucide-react";
import type { FlowOutputLensKind } from "../../../../core/flow/flow-output-lens";

export type FlowLensBadgeProps = {
  lens: FlowOutputLensKind | "full";
  compact?: boolean;
};

const LENS_LABEL: Record<FlowOutputLensKind | "full", string> = {
  full: "Full graph",
  dashboard: "Dashboard wiring",
  stage: "Stage wiring",
};

export function FlowLensBadge(props: FlowLensBadgeProps) {
  const { lens, compact = false } = props;
  if (lens === "full") {
    return null;
  }

  return (
    <div
      className={`pointer-events-none flex items-center gap-1 rounded-md border border-cyan-800/40 bg-cyan-950/35 px-2 py-1 text-[10px] font-medium text-cyan-100/90 ${
        compact ? "shrink-0" : ""
      }`}
      aria-label={`Flow lens: ${LENS_LABEL[lens]}`}
    >
      <GitBranch className="size-3 shrink-0 opacity-80" aria-hidden />
      <span>{LENS_LABEL[lens]}</span>
    </div>
  );
}
