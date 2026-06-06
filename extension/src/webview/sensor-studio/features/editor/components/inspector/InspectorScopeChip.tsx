import {
  inferInspectorScopeBadge,
  type InspectorScopeBadgeLabel,
} from "./inspector-section-scope-badges";

export { INSPECTOR_SCOPE_BADGES, inferInspectorScopeBadge } from "./inspector-section-scope-badges";
export type { InspectorScopeBadgeLabel } from "./inspector-section-scope-badges";

export type InspectorSectionScopeBadgeProps = {
  label: InspectorScopeBadgeLabel | string;
};

/** Compact scope pill beside an inspector card title. */
export function InspectorSectionScopeBadge(props: InspectorSectionScopeBadgeProps) {
  const { label } = props;
  return (
    <span className="rounded-full border border-zinc-600/45 bg-zinc-900/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
      {label}
    </span>
  );
}

/** @deprecated Use {@link InspectorSectionScopeBadge} with an explicit or inferred label. */
export function InspectorScopeThisNodeChip() {
  return <InspectorSectionScopeBadge label="This node" />;
}
