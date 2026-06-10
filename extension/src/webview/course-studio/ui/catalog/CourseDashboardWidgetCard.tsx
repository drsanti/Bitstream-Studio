import { LedIndicatorNodePanel } from "../../../sensor-studio/features/editor/nodes/led-indicator/LedIndicatorNodePanel";
import { NumericDisplayNodePanel } from "../../../sensor-studio/features/editor/nodes/numeric-display/NumericDisplayNodePanel";
import { BarMeterNodePanel } from "../../../sensor-studio/features/editor/nodes/bar-meter/BarMeterNodePanel";
import { RadialGaugeNodePanel } from "../../../sensor-studio/features/editor/nodes/radial-gauge/RadialGaugeNodePanel";
import { DashboardStatusNodePanel } from "../../../sensor-studio/features/dashboard/DashboardStatusNodePanel";
import type { PageBlockV1 } from "../../schemas/page.v1";
import type { DashboardWidgetBlockColors } from "../../schemas/dashboardWidgetBlockColors";
import { dashboardWidgetBlockColorsToStyle } from "../../schemas/dashboardWidgetBlockColors";
import {
  COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING,
  COURSE_DASHBOARD_WIDGET_BAR_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_LED_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT,
} from "../../schemas/courseLiveBindingDefaults";
import { resolveCourseDashboardWidgetActive, readCourseDashboardWidgetCondition } from "../../schemas/courseDashboardWidgetKinds";
import { resolveBindingDisplayUnit } from "../../runtime/diagram/diagramBindingCatalog";
import { useCourseLiveBinding } from "../../runtime/useCourseLiveBinding";

function readStatusLabel(style: Record<string, unknown>): string {
  if (typeof style.label === "string" && style.label.trim().length > 0) {
    return style.label.trim();
  }
  return COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT.label;
}

const DASHBOARD_WIDGET_PANEL_CLASS =
  "relative box-border h-full min-h-0 w-full max-w-full min-w-0 overflow-hidden";

export function CourseDashboardWidgetCard({
  block,
  colors,
  staleMs,
}: {
  block: Extract<PageBlockV1, { kind: "dashboard-widget" }>;
  colors?: DashboardWidgetBlockColors;
  staleMs?: number;
}) {
  const binding = block.binding ?? COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING;
  const live = useCourseLiveBinding(binding, staleMs);
  const style = block.style ?? {};
  const colorStyle = dashboardWidgetBlockColorsToStyle(colors);
  const hasTitle = block.title != null && block.title.length > 0;

  const numericValue =
    live.displayValue != null && Number.isFinite(live.displayValue) ? live.displayValue : null;

  const textStyle = {
    ...COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT,
    ...style,
    unit:
      resolveBindingDisplayUnit(binding) ||
      (typeof style.unit === "string" ? style.unit : COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT.unit),
  };

  const gaugeStyle = {
    ...COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT,
    ...style,
    unit:
      resolveBindingDisplayUnit(binding) ||
      (typeof style.unit === "string" ? style.unit : COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.unit),
  };

  const barStyle = {
    ...COURSE_DASHBOARD_WIDGET_BAR_STYLE_DEFAULT,
    ...style,
    unit:
      resolveBindingDisplayUnit(binding) ||
      (typeof style.unit === "string" ? style.unit : COURSE_DASHBOARD_WIDGET_BAR_STYLE_DEFAULT.unit),
  };

  const ledStyle = {
    ...COURSE_DASHBOARD_WIDGET_LED_STYLE_DEFAULT,
    ...style,
  };

  const statusStyle = {
    ...COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT,
    ...style,
  };

  const bindingValueKind = live.catalogEntry?.valueKind;
  const widgetCondition = readCourseDashboardWidgetCondition(style);
  const widgetActiveInput =
    typeof live.rawValue === "boolean" || typeof live.rawValue === "number"
      ? live.rawValue
      : null;

  const widgetActive = resolveCourseDashboardWidgetActive({
    rawValue: widgetActiveInput,
    displayValue: live.displayValue,
    condition: widgetCondition,
    bindingValueKind,
  });

  return (
    <div
      data-course-dashboard-widget=""
      className="course-dashboard-widget-card flex h-full min-h-0 w-full max-w-full min-w-0 box-border flex-col overflow-hidden rounded-xl border bg-[var(--course-dashboard-widget-bg,var(--surface-card))] border-[var(--course-dashboard-widget-border,var(--surface-border))]"
      style={colorStyle}
    >
      {hasTitle ? (
        <div
          className="shrink-0 border-b px-3 py-2 text-[11px] font-semibold leading-snug text-[var(--course-dashboard-widget-title,var(--text-primary))] bg-[var(--course-dashboard-widget-header-bg,transparent)] border-[var(--course-dashboard-widget-header-border,var(--surface-border))]"
        >
          {block.title}
        </div>
      ) : null}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--course-dashboard-widget-bg,var(--surface-card))]">
        {block.widgetKind === "led" ? (
          <LedIndicatorNodePanel
            value={widgetActive}
            defaultConfig={ledStyle}
            sensorHealth={live.sensorHealth}
          />
        ) : block.widgetKind === "gauge" ? (
          <RadialGaugeNodePanel
            className={DASHBOARD_WIDGET_PANEL_CLASS}
            value={numericValue}
            defaultConfig={gaugeStyle}
            sensorHealth={live.sensorHealth}
          />
        ) : block.widgetKind === "bar" ? (
          <BarMeterNodePanel
            className={DASHBOARD_WIDGET_PANEL_CLASS}
            value={numericValue}
            defaultConfig={barStyle}
            sensorHealth={live.sensorHealth}
          />
        ) : block.widgetKind === "status" ? (
          <DashboardStatusNodePanel
            className="h-full min-h-0 w-full max-w-full min-w-0 border-0 bg-transparent"
            label={readStatusLabel(style)}
            active={widgetActive}
            defaultConfig={statusStyle}
          />
        ) : (
          <NumericDisplayNodePanel
            value={numericValue}
            defaultConfig={textStyle}
            sensorHealth={live.sensorHealth}
          />
        )}
      </div>
    </div>
  );
}
