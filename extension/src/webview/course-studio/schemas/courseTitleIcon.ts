import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Cpu,
  Factory,
  Gauge,
  Info,
  LayoutDashboard,
  Lightbulb,
  ListOrdered,
  Workflow,
} from "lucide-react";
import { z } from "zod";
import type { PresentationCalloutVariant } from "../../presentation/components/callout-tokens";

/** Persisted on blocks when the author explicitly hides the prefix icon (callouts). */
export const COURSE_TITLE_ICON_NONE = "__none__" as const;

/** Inspector-only value: callout uses the variant default icon. */
export const COURSE_CALLOUT_ICON_DEFAULT = "__default__" as const;

export const courseTitleIconSchema = z.string().min(1).optional();

/** Picker defaults when icon color is unset (theme-aligned hex approximations). */
export const COURSE_TITLE_ICON_COLOR_DEFAULT_HEX = {
  heading: "#f59e0b",
  liveMetric: "#f87171",
} as const;

export const COURSE_CALLOUT_ICON_COLOR_DEFAULT_HEX: Record<PresentationCalloutVariant, string> = {
  info: "#22d3ee",
  warning: "#f59e0b",
  danger: "#f87171",
  tip: "#a78bfa",
};

export function calloutDefaultIconColorHex(variant: PresentationCalloutVariant): string {
  return COURSE_CALLOUT_ICON_COLOR_DEFAULT_HEX[variant];
}

export type CourseTitleIconName = (typeof COURSE_TITLE_ICON_CATALOG)[number]["value"];

export const COURSE_TITLE_ICON_CATALOG = [
  { value: "LayoutDashboard", label: "Dashboard", Icon: LayoutDashboard },
  { value: "Workflow", label: "Workflow", Icon: Workflow },
  { value: "ListOrdered", label: "Numbered list", Icon: ListOrdered },
  { value: "Lightbulb", label: "Tip", Icon: Lightbulb },
  { value: "Info", label: "Info", Icon: Info },
  { value: "BookOpen", label: "Chapter", Icon: BookOpen },
  { value: "Gauge", label: "Sensor / gauge", Icon: Gauge },
  { value: "Activity", label: "Live metric", Icon: Activity },
  { value: "Cpu", label: "Hardware", Icon: Cpu },
  { value: "Factory", label: "Industrial", Icon: Factory },
  { value: "Briefcase", label: "Use cases", Icon: Briefcase },
  { value: "CheckCircle2", label: "Checklist", Icon: CheckCircle2 },
  { value: "AlertTriangle", label: "Caution", Icon: AlertTriangle },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  Icon: LucideIcon;
}>;

const catalogByValue = new Map(
  COURSE_TITLE_ICON_CATALOG.map((entry) => [entry.value, entry] as const),
);

export function resolveCourseLucideIcon(name: string | undefined): LucideIcon | null {
  if (name == null || name.length === 0 || name === COURSE_TITLE_ICON_NONE) {
    return null;
  }
  const fromCatalog = catalogByValue.get(name)?.Icon;
  if (fromCatalog != null) {
    return fromCatalog;
  }
  const fromLucide = (LucideIcons as Record<string, LucideIcon | undefined>)[name];
  return fromLucide ?? null;
}

/** Optional title prefix: custom icon, explicit none, or optional fallback (e.g. live-metric Activity). */
export function resolveCourseTitlePrefixIcon(
  icon: string | undefined,
  fallback?: LucideIcon,
): LucideIcon | null {
  const resolved = resolveCourseLucideIcon(icon);
  if (resolved != null) {
    return resolved;
  }
  if (icon === COURSE_TITLE_ICON_NONE) {
    return null;
  }
  return fallback ?? null;
}

export function calloutIconSelectValue(icon: string | undefined): string {
  if (icon === COURSE_TITLE_ICON_NONE) {
    return COURSE_TITLE_ICON_NONE;
  }
  if (icon != null && icon.length > 0) {
    return icon;
  }
  return COURSE_CALLOUT_ICON_DEFAULT;
}

export function optionalTitleIconSelectValue(icon: string | undefined): string {
  if (icon != null && icon.length > 0 && icon !== COURSE_TITLE_ICON_NONE) {
    return icon;
  }
  return "";
}

export function patchTitleIconFromSelect(
  value: string,
  mode: "optional" | "callout",
): { icon?: string | undefined } {
  if (mode === "callout") {
    if (value === COURSE_CALLOUT_ICON_DEFAULT) {
      return { icon: undefined };
    }
    if (value === COURSE_TITLE_ICON_NONE || value === "") {
      return { icon: COURSE_TITLE_ICON_NONE };
    }
    return { icon: value };
  }
  if (value === "" || value === COURSE_TITLE_ICON_NONE) {
    return { icon: undefined };
  }
  return { icon: value };
}
