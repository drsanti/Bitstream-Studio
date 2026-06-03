import { twMerge } from "tailwind-merge";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { resolveNodeCatalogIconSlug } from "../../../../core/config/resolve-node-catalog-entry";
import { getCatalogLucideIcon } from "../../components/node-palette/catalog-lucide-icons";

/** Category tint for header prefix icons (matches palette / minimap families). */
const FLOW_NODE_HEADER_CATEGORY_ICON_CLASS: Record<
  NodeCatalogEntry["category"],
  string
> = {
  sensor: "text-emerald-400/90",
  input: "text-slate-400/90",
  audio: "text-rose-400/90",
  transform: "text-amber-400/90",
  logic: "text-violet-400/90",
  output: "text-cyan-400/90",
  utility: "text-fuchsia-400/90",
  generator: "text-zinc-400/90",
};

export type FlowNodeHeaderIconProps = {
  nodeId: string;
  category: NodeCatalogEntry["category"];
  className?: string;
};

/** Catalog glyph shown left of the node title (same slug as node palette). */
export function FlowNodeHeaderIcon(props: FlowNodeHeaderIconProps) {
  const { nodeId, category, className } = props;
  const Icon = getCatalogLucideIcon(resolveNodeCatalogIconSlug(nodeId));
  const tintClass =
    FLOW_NODE_HEADER_CATEGORY_ICON_CLASS[category] ?? "text-zinc-400/90";

  return (
    <Icon
      className={twMerge("size-3.5 shrink-0", tintClass, className)}
      strokeWidth={2}
      aria-hidden
    />
  );
}
