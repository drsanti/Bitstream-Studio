export type NodeInspectorIdentityStripProps = {
  label: string;
  nodeId: string;
  category: string;
  categoryTint: string;
};

/**
 * Compact selection context (label + type id + category) below the inspector tab title.
 */
export function NodeInspectorIdentityStrip(props: NodeInspectorIdentityStripProps) {
  const { label, nodeId, category, categoryTint } = props;
  return (
    <div className="sticky top-0 z-[2] shrink-0 border-b border-emerald-900/20 bg-zinc-950/90 px-2 py-1.5 backdrop-blur-sm supports-backdrop-filter:bg-zinc-950/75">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className="shrink-0 rounded border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide"
          style={{
            borderColor: `${categoryTint}55`,
            color: categoryTint,
            backgroundColor: `${categoryTint}14`,
          }}
        >
          {category}
        </span>
        <span className="min-w-0 truncate text-[11px] font-semibold text-zinc-100">
          {label.length > 0 ? label : "—"}
        </span>
        <span
          className="min-w-0 max-w-full shrink truncate font-mono text-[10px] text-zinc-500"
          title={nodeId}
        >
          {nodeId}
        </span>
      </div>
    </div>
  );
}
