import {
  readCourseDashboardWidgetCondition,
  resolveCourseDashboardWidgetActive,
} from "./courseDashboardWidgetCondition";
import {
  COURSE_DASHBOARD_WIDGET_BAR_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_LED_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT,
} from "./courseLiveBindingDefaults";
import { gaugeZonesFromPreset } from "../../sensor-studio/features/editor/nodes/display/gauge-display-config";

export {
  readCourseDashboardWidgetCondition,
  resolveCourseDashboardWidgetActive,
} from "./courseDashboardWidgetCondition";

export const courseDashboardWidgetKindSchema = [
  "text",
  "led",
  "gauge",
  "bar",
  "status",
] as const;

export type CourseDashboardWidgetKind = (typeof courseDashboardWidgetKindSchema)[number];

export const COURSE_DASHBOARD_WIDGET_KIND_OPTIONS: ReadonlyArray<{
  value: CourseDashboardWidgetKind;
  label: string;
}> = [
  { value: "text", label: "Numeric display" },
  { value: "led", label: "LED indicator" },
  { value: "gauge", label: "Radial gauge" },
  { value: "bar", label: "Bar meter" },
  { value: "status", label: "Status pill" },
];

export type CourseGridPlacement = {
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
};

const MIN_SPAN: Record<CourseDashboardWidgetKind, { columnSpan: number; rowSpan: number }> = {
  text: { columnSpan: 2, rowSpan: 2 },
  led: { columnSpan: 2, rowSpan: 2 },
  gauge: { columnSpan: 3, rowSpan: 3 },
  bar: { columnSpan: 3, rowSpan: 3 },
  status: { columnSpan: 3, rowSpan: 1 },
};

export function courseDashboardWidgetMinSpan(
  kind: CourseDashboardWidgetKind,
): { columnSpan: number; rowSpan: number } {
  return MIN_SPAN[kind];
}

export function defaultCourseDashboardWidgetStyle(
  kind: CourseDashboardWidgetKind,
): Record<string, unknown> {
  switch (kind) {
    case "text":
      return { ...COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT };
    case "led":
      return { ...COURSE_DASHBOARD_WIDGET_LED_STYLE_DEFAULT };
    case "gauge": {
      const base = { ...COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT };
      return {
        ...base,
        zones: gaugeZonesFromPreset(base.zonePreset, base.min, base.max),
      };
    }
    case "bar":
      return { ...COURSE_DASHBOARD_WIDGET_BAR_STYLE_DEFAULT };
    case "status":
      return { ...COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT };
  }
}

export function ensureCourseDashboardWidgetPlacement(
  placement: CourseGridPlacement,
  kind: CourseDashboardWidgetKind,
): CourseGridPlacement {
  const min = courseDashboardWidgetMinSpan(kind);
  return {
    ...placement,
    columnSpan: Math.max(placement.columnSpan, min.columnSpan),
    rowSpan: Math.max(placement.rowSpan, min.rowSpan),
  };
}

/** @deprecated Prefer `resolveCourseDashboardWidgetActive` with `readCourseDashboardWidgetCondition`. */
export function resolveCourseDashboardStatusActive(args: {
  rawValue: number | boolean | null;
  displayValue: number | null;
  threshold: number;
  compareOp?: string;
  bindingValueKind?: "number" | "boolean";
}): boolean {
  const condition = readCourseDashboardWidgetCondition({
    compareOp: args.compareOp,
    threshold: args.threshold,
  });
  return resolveCourseDashboardWidgetActive({
    rawValue: args.rawValue,
    displayValue: args.displayValue,
    bindingValueKind: args.bindingValueKind,
    condition,
  });
}
