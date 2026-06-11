import { PRESENTATION_DARK_TEXT_LIVE_VALUE } from "../../presentation/design/presentationTextColors";
import type { DiagramBindingV1 } from "./diagram.v1";

export const COURSE_LIVE_METRIC_AXIS_DEFAULTS = {
  ax: { path: "bmi270.ax", fallback: 0, unit: "g" },
  ay: { path: "bmi270.ay", fallback: 0, unit: "g" },
  az: { path: "bmi270.az", fallback: 0, unit: "g" },
} as const satisfies Record<"ax" | "ay" | "az", DiagramBindingV1>;

export const COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING: DiagramBindingV1 = {
  path: "bmi270.ax",
  fallback: 0,
  unit: "g",
};

export const COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT = {
  label: "Value",
  unit: "g",
  decimals: 2,
  showStatusBar: true,
  zones: [{ from: -1e12, to: 1e12, color: PRESENTATION_DARK_TEXT_LIVE_VALUE }],
} as const;

export const COURSE_DASHBOARD_WIDGET_LED_STYLE_DEFAULT = {
  label: "Status",
  onColor: "#22c55e",
  offColor: "#18181b",
  compareOp: ">=",
  threshold: 0.5,
  blink: false,
} as const;

/** Radial gauge — passed to `RadialGaugeNodePanel` / `coerceRadialGaugeConfig`. */
export const COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT = {
  min: 0,
  max: 100,
  unit: "",
  decimals: 1,
  arcPreset: "automotive270",
  showFaceplate: true,
  showTrack: true,
  showTicks: true,
  showTickLabels: true,
  showNeedle: true,
  showDigitalValue: true,
  showUnit: true,
  needleSmoothingMs: 120,
  showSetpoint: false,
  zonePreset: "traffic" as const,
} as const;

/** Bar meter — passed to `BarMeterNodePanel` / `coerceBarMeterConfig`. */
export const COURSE_DASHBOARD_WIDGET_BAR_STYLE_DEFAULT = {
  min: 0,
  max: 1,
  unit: "g",
  decimals: 2,
  orientation: "vertical",
  showPeakHold: true,
  fillSmoothingMs: 120,
} as const;

/** Status pill — passed to `DashboardStatusNodePanel` / `coerceDashboardStatusStyleV1`. */
export const COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT = {
  label: "Status",
  onLabel: "OK",
  offLabel: "Fault",
  onTone: "success",
  offTone: "danger",
  compareOp: ">=",
  threshold: 0.5,
} as const;

export function resolveLiveMetricAxisBinding(
  axis: "ax" | "ay" | "az",
  binding: DiagramBindingV1 | undefined,
): DiagramBindingV1 {
  return binding ?? { ...COURSE_LIVE_METRIC_AXIS_DEFAULTS[axis] };
}
