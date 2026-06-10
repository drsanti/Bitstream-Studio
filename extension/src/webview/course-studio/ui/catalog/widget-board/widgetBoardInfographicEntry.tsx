import type {
  WidgetBoardMetricBarV1,
  WidgetBoardNumericReadoutV1,
  WidgetBoardVerticalBarV1,
} from "../../../schemas/widgetBoard.v1";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { isActiveInfographicPreset } from "../../../schemas/infographicVisualPreset.v1";
import { CourseInfographicWidget } from "../infographics/CourseInfographicWidget";

type InfographicWidgetBoardEntry =
  | WidgetBoardMetricBarV1
  | WidgetBoardNumericReadoutV1
  | WidgetBoardVerticalBarV1;

export function tryRenderWidgetBoardInfographic(args: {
  widget: InfographicWidgetBoardEntry;
  value: number | null;
  unit?: string;
  health?: CourseBindingHealthStatus;
}) {
  const { widget, value, unit, health } = args;
  if (!isActiveInfographicPreset(widget.visualPreset)) {
    return null;
  }

  return (
    <CourseInfographicWidget
      preset={widget.visualPreset}
      label={widget.label}
      value={value}
      unit={unit}
      min={widget.min}
      max={widget.max}
      decimals={widget.decimals}
      showLabel={widget.showLabel}
      showValue={widget.showValue}
      showUnit={widget.showUnit}
      health={health}
      configSource={widget}
      typography={widget.typography}
      className="rounded-[14px] border border-[var(--course-wb-metric-panel-border,rgb(255_255_255/0.08))] bg-[var(--course-wb-metric-panel-bg,rgb(255_255_255/0.04))]"
    />
  );
}
