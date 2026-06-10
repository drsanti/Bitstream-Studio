import type { GridPlacementV1 } from "../../../schemas/placement";
import type { WidgetBoardEntryV1, WidgetBoardWidgetKind } from "../../../schemas/widgetBoard.v1";
import { HERO_RADIAL_GAUGE_DEFAULTS } from "./heroRadialGaugeConfig";

export const WIDGET_BOARD_LED_DEFAULTS = {
  label: "Status",
  onColor: "#22c55e",
  offColor: "#27272a",
  compareOp: ">=" as const,
  compareValue: 0.5,
  demoActive: true,
  blink: false,
  blinkPeriodMs: 800,
  ledSize: "md" as const,
  showLabel: true,
  glowWhenOn: true,
};

export const WIDGET_BOARD_STATUS_DEFAULTS = {
  label: "Status",
  onLabel: "OK",
  offLabel: "Fault",
  onTone: "success" as const,
  offTone: "danger" as const,
  pillStyle: "filled" as const,
  compareOp: ">=" as const,
  compareValue: 0.5,
  demoActive: true,
  showLabel: true,
};

export const WIDGET_BOARD_NUMERIC_DEFAULTS = {
  label: "Value",
  min: 0,
  max: 100,
  decimals: 1,
  demoValue: 42,
  unit: "",
  showLabel: true,
  showValue: true,
  showUnit: true,
  valueAlign: "center" as const,
  valueScale: "large" as const,
};

export const WIDGET_BOARD_VERTICAL_BAR_DEFAULTS = {
  label: "Level",
  min: 0,
  max: 100,
  decimals: 0,
  demoValue: 65,
  unit: "%",
  showLabel: true,
  showValue: true,
  showUnit: true,
  fillFrom: "bottom" as const,
  fillSmoothingMs: 0,
  trackWidthPercent: 14,
};

export const WIDGET_BOARD_METRIC_BAR_READOUT_DEFAULTS = {
  showLabel: true,
  showValue: true,
  showUnit: true,
};

export const WIDGET_BOARD_INFOGRAPHIC_DEFAULTS = {
  visualPreset: "abstract" as const,
};

export function buildDefaultWidgetBoardEntry(
  kind: WidgetBoardWidgetKind,
  id: string,
  placement: GridPlacementV1,
): WidgetBoardEntryV1 {
  const base = { id, placement };

  switch (kind) {
    case "metric-bar":
      return {
        ...base,
        kind,
        label: "Metric",
        min: 0,
        max: 100,
        decimals: 0,
        demoValue: 50,
        ...WIDGET_BOARD_METRIC_BAR_READOUT_DEFAULTS,
        ...WIDGET_BOARD_INFOGRAPHIC_DEFAULTS,
      };
    case "numeric-readout":
      return { ...base, kind, ...WIDGET_BOARD_NUMERIC_DEFAULTS, ...WIDGET_BOARD_INFOGRAPHIC_DEFAULTS };
    case "vertical-bar":
      return { ...base, kind, ...WIDGET_BOARD_VERTICAL_BAR_DEFAULTS, ...WIDGET_BOARD_INFOGRAPHIC_DEFAULTS };
    case "status-pill":
      return { ...base, kind, ...WIDGET_BOARD_STATUS_DEFAULTS };
    case "led-indicator":
      return { ...base, kind, ...WIDGET_BOARD_LED_DEFAULTS };
    case "hero-radial-gauge":
      return {
        ...base,
        kind,
        min: 0,
        max: 180,
        decimals: 0,
        unit: "km/h",
        demoValue: 0,
        ...HERO_RADIAL_GAUGE_DEFAULTS,
      };
  }
}
