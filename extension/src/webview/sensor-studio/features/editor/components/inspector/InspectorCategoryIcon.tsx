import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Gauge,
  GitBranch,
  Layers,
  Mic,
  Plug,
  Radio,
  Sparkles,
  Wrench,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { getCatalogLucideIcon } from "../node-palette/catalog-lucide-icons";

/** Stream chip on the context bar — drives icon tint + motion. */
export type InspectorStreamStatusKind = "live" | "stale" | "offline" | "sim" | "idle";

const CATEGORY_FALLBACK_ICON: Record<NodeCatalogEntry["category"], LucideIcon> = {
  sensor: Radio,
  input: Plug,
  audio: Mic,
  transform: ArrowRightLeft,
  logic: GitBranch,
  scene: Layers,
  output: Gauge,
  utility: Wrench,
  generator: Sparkles,
};

function resolveInspectorCategoryIcon(
  category: string,
  catalogIconSlug?: string,
): LucideIcon {
  if (catalogIconSlug != null && catalogIconSlug.trim().length > 0) {
    return getCatalogLucideIcon(catalogIconSlug.trim());
  }
  if (category in CATEGORY_FALLBACK_ICON) {
    return CATEGORY_FALLBACK_ICON[category as NodeCatalogEntry["category"]];
  }
  return Radio;
}

export type InspectorCategoryIconProps = {
  category: string;
  categoryTint: string;
  categoryLabel: string;
  catalogIconSlug?: string;
  streamStatus: InspectorStreamStatusKind | null;
  className?: string;
};

/**
 * Catalog / category glyph for the inspector context header.
 * Pulses when telemetry is actively streaming (live / sim / stale).
 */
export function InspectorCategoryIcon(props: InspectorCategoryIconProps) {
  const {
    category,
    categoryTint,
    categoryLabel,
    catalogIconSlug,
    streamStatus,
    className,
  } = props;

  const Icon = resolveInspectorCategoryIcon(category, catalogIconSlug);
  const usesCategoryTint =
    streamStatus == null ||
    streamStatus === "idle" ||
    streamStatus === "offline";

  return (
    <span
      className={twMerge("inline-flex shrink-0 self-start", className)}
      title={categoryLabel}
      aria-hidden
    >
      <Icon
        className={twMerge(
          "h-3.5 w-3.5 shrink-0 transition-colors duration-300",
          streamStatus === "live" &&
            "text-emerald-400 motion-safe:animate-pulse drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]",
          streamStatus === "stale" &&
            "text-amber-400/95 motion-safe:animate-pulse",
          streamStatus === "offline" && "text-rose-400/85",
          streamStatus === "sim" &&
            "text-sky-400/90 motion-safe:animate-pulse drop-shadow-[0_0_5px_rgba(56,189,248,0.35)]",
          streamStatus === "idle" && "text-zinc-500",
          usesCategoryTint && streamStatus !== "offline" && "opacity-90",
          className,
        )}
        style={usesCategoryTint ? { color: categoryTint } : undefined}
      />
    </span>
  );
}
