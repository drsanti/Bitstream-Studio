import { Activity } from "lucide-react";
import type { StudioNode } from "../../store/flow-editor.store";
import { TRNHintText } from "../../../../../ui/TRN";
import { formatInspectorUpdatedAt } from "./inspector-format-time";
import { InspectorSection } from "./InspectorSection";

export type NodeInspectorMultiLiveReadoutsProps = {
  nodes: StudioNode[];
};

function formatLive(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v.toFixed(4);
  }
  if (v == null) {
    return "—";
  }
  return String(v);
}

function MultiLiveRow(props: { node: StudioNode }) {
  const n = props.node;
  return (
    <li className="border-b border-zinc-800/50 py-2 last:border-0 last:pb-0">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2">
        <span className="truncate text-[11px] font-medium text-zinc-200">{n.data.label}</span>
        <span className="shrink-0 text-[13px] text-emerald-50/95">{formatLive(n.data.liveValue)}</span>
      </div>
      <div className="mt-0.5 flex min-w-0 items-baseline justify-between gap-2">
        <span className="truncate text-[10px] text-zinc-500">{n.data.nodeId}</span>
        <span className="shrink-0 text-[10px] text-zinc-600">
          {formatInspectorUpdatedAt(n.data.lastUpdatedAt)}
        </span>
      </div>
    </li>
  );
}

export function NodeInspectorMultiLiveReadouts(props: NodeInspectorMultiLiveReadoutsProps) {
  const { nodes } = props;

  return (
    <div className="space-y-2">
      <TRNHintText>
        Multiple nodes selected. Live values below update with the simulation. Select a single node
        to edit details and settings.
      </TRNHintText>
      <InspectorSection
        title="Live values"
        hint={`${nodes.length} selected nodes — updates with simulation`}
        titleLeadingSlot={<Activity className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />}
        collapsible
        defaultExpanded
      >
        <ul className="scrollbar-hide max-h-[min(64vh,520px)] space-y-0 overflow-y-auto overflow-x-hidden">
          {nodes.map((n) => (
            <MultiLiveRow key={n.id} node={n} />
          ))}
        </ul>
      </InspectorSection>
    </div>
  );
}
