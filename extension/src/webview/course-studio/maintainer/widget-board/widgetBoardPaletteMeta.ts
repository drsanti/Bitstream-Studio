import {
  Activity,
  BarChart3,
  CircleDot,
  Gauge,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import type { WidgetBoardWidgetKind } from "../../schemas/widgetBoard.v1";
import { COURSE_INSPECTOR_CARD_ICON_CLASS } from "../CourseInspectorCard";

export type WidgetBoardPaletteEntry = {
  kind: WidgetBoardWidgetKind;
  label: string;
  description: string;
};

const WIDGET_BOARD_KIND_ICONS: Record<WidgetBoardWidgetKind, LucideIcon> = {
  "metric-bar": BarChart3,
  "hero-radial-gauge": Gauge,
  "numeric-readout": Hash,
  "vertical-bar": Activity,
  "status-pill": CircleDot,
  "led-indicator": CircleDot,
};

export function widgetBoardWidgetKindLabel(kind: WidgetBoardWidgetKind): string {
  return WIDGET_BOARD_PALETTE.find((entry) => entry.kind === kind)?.label ?? kind;
}

export function widgetBoardWidgetKindIcon(kind: WidgetBoardWidgetKind) {
  const Icon = WIDGET_BOARD_KIND_ICONS[kind];
  return createElement(Icon, {
    className: COURSE_INSPECTOR_CARD_ICON_CLASS,
    "aria-hidden": true,
  });
}

export const WIDGET_BOARD_PALETTE: readonly WidgetBoardPaletteEntry[] = [
  {
    kind: "metric-bar",
    label: "Metric bar",
    description: "Label, value, and horizontal gradient bar",
  },
  {
    kind: "numeric-readout",
    label: "Numeric readout",
    description: "Large centered value without a bar",
  },
  {
    kind: "vertical-bar",
    label: "Vertical bar",
    description: "Vertical level meter with value readout",
  },
  {
    kind: "hero-radial-gauge",
    label: "Hero gauge",
    description: "Circular speedometer-style readout",
  },
  {
    kind: "status-pill",
    label: "Status pill",
    description: "OK / fault pill from threshold rule",
  },
  {
    kind: "led-indicator",
    label: "LED indicator",
    description: "On/off lamp with optional blink",
  },
];
