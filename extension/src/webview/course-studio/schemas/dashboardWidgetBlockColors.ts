import { z } from "zod";
import type { CSSProperties } from "react";
import {
  courseBlockColorHexSchema,
  normalizeCourseBlockColorHex,
} from "./blockColorHex";

export const dashboardWidgetBlockColorsSchema = z.object({
  background: courseBlockColorHexSchema.optional(),
  border: courseBlockColorHexSchema.optional(),
  title: courseBlockColorHexSchema.optional(),
  headerBackground: courseBlockColorHexSchema.optional(),
  headerBorder: courseBlockColorHexSchema.optional(),
});

export type DashboardWidgetBlockColors = z.infer<typeof dashboardWidgetBlockColorsSchema>;
export type DashboardWidgetBlockColorKey = keyof DashboardWidgetBlockColors;

export const DASHBOARD_WIDGET_BLOCK_COLOR_THEME_DEFAULTS: Record<
  DashboardWidgetBlockColorKey,
  string
> = {
  background: "#18181b",
  border: "#3f3f46",
  title: "#fafafa",
  headerBackground: "#27272a",
  headerBorder: "#3f3f46",
};

export const DASHBOARD_WIDGET_BLOCK_COLOR_CSS_VARS: Record<DashboardWidgetBlockColorKey, string> =
  {
    background: "--course-dashboard-widget-bg",
    border: "--course-dashboard-widget-border",
    title: "--course-dashboard-widget-title",
    headerBackground: "--course-dashboard-widget-header-bg",
    headerBorder: "--course-dashboard-widget-header-border",
  };

export const DASHBOARD_WIDGET_BLOCK_COLOR_INSPECTOR_GROUPS: ReadonlyArray<{
  id: "chrome" | "header";
  title: string;
  rows: ReadonlyArray<{ key: DashboardWidgetBlockColorKey; label: string; hint?: string }>;
}> = [
  {
    id: "chrome",
    title: "Container",
    rows: [
      { key: "background", label: "Background" },
      { key: "border", label: "Border" },
    ],
  },
  {
    id: "header",
    title: "Title bar",
    rows: [
      {
        key: "headerBackground",
        label: "Header background",
        hint: "Shown when the block has a title.",
      },
      {
        key: "headerBorder",
        label: "Header divider",
        hint: "Line between the title row and widget canvas.",
      },
      { key: "title", label: "Title text" },
    ],
  },
];

export function stripEmptyDashboardWidgetBlockColors(
  colors: DashboardWidgetBlockColors | undefined,
): DashboardWidgetBlockColors | undefined {
  if (colors == null) {
    return undefined;
  }
  const next: Partial<DashboardWidgetBlockColors> = {};
  for (const key of Object.keys(DASHBOARD_WIDGET_BLOCK_COLOR_CSS_VARS) as DashboardWidgetBlockColorKey[]) {
    const value = colors[key];
    if (value != null && value.length > 0) {
      next[key] = value;
    }
  }
  return Object.keys(next).length > 0 ? (next as DashboardWidgetBlockColors) : undefined;
}

export function patchDashboardWidgetBlockColor(
  colors: DashboardWidgetBlockColors | undefined,
  key: DashboardWidgetBlockColorKey,
  value: string | undefined,
): DashboardWidgetBlockColors | undefined {
  const normalized =
    value == null || value.length === 0 ? undefined : normalizeCourseBlockColorHex(value);
  const next: DashboardWidgetBlockColors = { ...(colors ?? {}) };
  if (normalized == null) {
    delete next[key];
  } else {
    next[key] = normalized;
  }
  return stripEmptyDashboardWidgetBlockColors(next);
}

export function dashboardWidgetBlockColorsToStyle(
  colors: DashboardWidgetBlockColors | undefined,
): CSSProperties | undefined {
  if (colors == null) {
    return undefined;
  }
  const style: Record<string, string> = {};
  for (const key of Object.keys(DASHBOARD_WIDGET_BLOCK_COLOR_CSS_VARS) as DashboardWidgetBlockColorKey[]) {
    const value = colors[key];
    if (value != null) {
      style[DASHBOARD_WIDGET_BLOCK_COLOR_CSS_VARS[key]] = value;
    }
  }
  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}
