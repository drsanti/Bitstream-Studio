import type { ReactNode } from "react";
import { Box, Link2 } from "lucide-react";
import { TRNHintTooltip } from "../../../../../ui/TRN";

export type GroupInspectorContextBarProps = {
  title: string;
  hostNodeId: string;
  inputCount: number;
  outputCount: number;
  isLinkedInstance: boolean;
  linkedHostCount: number;
  isInsideGroup: boolean;
  focusedBoundaryRole?: "input" | "output" | null;
};

function NodeInstanceHint(props: { nodeId: string; children: ReactNode }) {
  return (
    <TRNHintTooltip
      trigger={props.children}
      content={props.nodeId}
      triggerAriaLabel={`Group node id ${props.nodeId}`}
      placement="bottom-start"
    />
  );
}

/**
 * Selection header for the node group inspector — mirrors {@link InspectorContextBar} chrome.
 */
export function GroupInspectorContextBar(props: GroupInspectorContextBarProps) {
  const {
    title,
    hostNodeId,
    inputCount,
    outputCount,
    isLinkedInstance,
    linkedHostCount,
    isInsideGroup,
    focusedBoundaryRole,
  } = props;

  const statusChip =
    focusedBoundaryRole != null ? (
      <span className="shrink-0 rounded bg-cyan-950/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-cyan-300/90">
        Boundary {focusedBoundaryRole}
      </span>
    ) : isInsideGroup ? (
      <span className="shrink-0 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-400">
        Inside group
      </span>
    ) : isLinkedInstance ? (
      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300">
        <Link2 className="h-2.5 w-2.5 opacity-80" aria-hidden />
        Linked ×{linkedHostCount}
      </span>
    ) : (
      <span className="shrink-0 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-500">
        Independent
      </span>
    );

  return (
    <header className="sticky top-0 z-2 shrink-0 border-b border-zinc-800/60 bg-zinc-950/80 px-3 py-2 backdrop-blur-sm supports-backdrop-filter:bg-zinc-950/70">
      <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] items-start gap-x-2 gap-y-1">
        <span
          className="row-span-2 mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-500/25 bg-cyan-950/35 text-cyan-400"
          aria-hidden
        >
          <Box className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 truncate text-[13px] font-semibold leading-tight text-zinc-50">
          {title}
        </span>
        <span className="shrink-0 self-start text-[10px] leading-none text-zinc-500">
          {inputCount} in / {outputCount} out
        </span>
        <div className="col-start-2 col-end-4 flex min-w-0 items-center gap-1.5 text-[10px] leading-snug">
          <span className="shrink-0 text-zinc-500">Node group</span>
          <span className="text-zinc-700" aria-hidden>
            ·
          </span>
          <NodeInstanceHint nodeId={hostNodeId}>
            <span className="min-w-0 truncate text-zinc-600 hover:text-zinc-400">{hostNodeId}</span>
          </NodeInstanceHint>
          <span className="ml-auto shrink-0 pl-2">{statusChip}</span>
        </div>
      </div>
    </header>
  );
}
