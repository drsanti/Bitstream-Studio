import type { LucideIcon } from "lucide-react";
import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";

export type PresentationCalloutVariant = "info" | "warning" | "danger" | "tip";

export const CALLOUT_VARIANT_STYLES: Record<
  PresentationCalloutVariant,
  { border: string; bg: string; title: string; icon: LucideIcon }
> = {
  info: {
    border: "color-mix(in srgb, var(--accent-cyan) 35%, transparent)",
    bg: "var(--accent-cyan-bg)",
    title: "var(--accent-cyan)",
    icon: Info,
  },
  warning: {
    border: "color-mix(in srgb, var(--accent-amber) 40%, transparent)",
    bg: "var(--accent-amber-bg)",
    title: "var(--accent-amber)",
    icon: AlertTriangle,
  },
  danger: {
    border: "color-mix(in srgb, var(--accent-red, #f87171) 40%, transparent)",
    bg: "color-mix(in srgb, var(--accent-red, #f87171) 12%, transparent)",
    title: "var(--accent-red, #f87171)",
    icon: AlertCircle,
  },
  tip: {
    border: "color-mix(in srgb, var(--accent-purple) 35%, transparent)",
    bg: "var(--accent-purple-bg)",
    title: "var(--accent-purple)",
    icon: Lightbulb,
  },
};

export function calloutVariantFromBlockKind(
  kind: "callout-info" | "callout-warning" | "callout-danger" | "callout-tip",
): PresentationCalloutVariant {
  if (kind === "callout-info") return "info";
  if (kind === "callout-warning") return "warning";
  if (kind === "callout-danger") return "danger";
  return "tip";
}
