import type { StudioNode } from "../../store/flow-editor.store";

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

export function NodeInspectorMultiLiveReadouts(props: NodeInspectorMultiLiveReadoutsProps) {
  return (
    <div className="space-y-2 text-xs">
      <p className="text-[11px] leading-snug text-zinc-400">
        Multiple nodes selected. Live values below update with the simulation. Select a single node to edit
        details and settings.
      </p>
      <ul className="max-h-[min(64vh,520px)] space-y-1.5 overflow-y-auto overflow-x-hidden rounded border border-zinc-800/80 bg-zinc-950/50 p-1.5">
        {props.nodes.map((n) => (
          <li
            key={n.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 rounded border border-zinc-800/60 bg-black/30 px-2 py-1.5"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-zinc-200">{n.data.label}</div>
              <div className="truncate font-mono text-[10px] text-zinc-500">{n.data.nodeId}</div>
            </div>
            <div className="shrink-0 text-right font-mono text-[11px] text-emerald-100/90">
              {formatLive(n.data.liveValue)}
            </div>
            <div className="col-span-2 text-[10px] text-zinc-600">
              updated {n.data.lastUpdatedAt ?? "—"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
