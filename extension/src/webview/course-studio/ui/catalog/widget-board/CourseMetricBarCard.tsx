import type { CSSProperties } from "react";
import type { WidgetBoardWidgetTypographyV1 } from "../../../schemas/widgetBoard.v1";
import type { SensorHealthStatus } from "../../../../sensor-studio/features/editor/store/flow-editor.store";
import { courseBindingHealthToSensorHealth } from "../../../runtime/courseBindingHealth";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { formatWidgetBoardValue, normalizeWidgetBoardScalar } from "./widgetBoardLayout";
import {
  hasWidgetBoardLabelTypography,
  hasWidgetBoardUnitTypography,
  hasWidgetBoardValueTypography,
  widgetBoardLabelTypographyStyle,
  widgetBoardUnitTypographyStyle,
  widgetBoardValueTypographyStyle,
} from "./widgetBoardTypographyStyle";

export function CourseMetricBarCard({
  label,
  value,
  unit,
  min,
  max,
  decimals,
  health,
  typography,
  showLabel = true,
  showValue = true,
  showUnit = true,
  trackColor,
  fillColor,
}: {
  label: string;
  value: number | null;
  unit?: string;
  min: number;
  max: number;
  decimals: number;
  health?: CourseBindingHealthStatus;
  typography?: WidgetBoardWidgetTypographyV1;
  showLabel?: boolean;
  showValue?: boolean;
  showUnit?: boolean;
  trackColor?: string;
  fillColor?: string;
}) {
  const normalized = normalizeWidgetBoardScalar(value, min, max);
  const fillPercent = normalized == null ? 0 : normalized * 100;
  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale" || sensorHealth === "inactive";

  const unitSuffix = unit != null && unit.length > 0 ? ` ${unit}` : "";
  const labelStyle = widgetBoardLabelTypographyStyle(typography);
  const valueStyle = widgetBoardValueTypographyStyle(typography);
  const unitStyle = widgetBoardUnitTypographyStyle(typography);

  return (
    <div
      className={`course-metric-bar-card flex h-full min-h-0 min-w-0 max-w-full flex-col justify-center px-3 py-2.5 ${
        stale ? "course-widget-board-entry--stale" : ""
      }`}
      data-course-widget-kind="metric-bar"
    >
      {showLabel ? (
        <p
          className={`font-medium uppercase tracking-widest${
            hasWidgetBoardLabelTypography(typography)
              ? ""
              : " course-metric-bar-card__label text-[var(--course-wb-label)]"
          }`}
          style={labelStyle}
        >
          {label}
        </p>
      ) : null}
      {showValue ? (
        <p
          className={`mt-1 font-bold leading-tight${
            hasWidgetBoardValueTypography(typography)
              ? ""
              : " course-metric-bar-card__value text-[var(--course-wb-value)]"
          }`}
          style={
            {
              ...valueStyle,
              textShadow: typography?.valueColor != null ? "none" : "var(--course-wb-value-shadow, none)",
            } as CSSProperties
          }
        >
          {formatWidgetBoardValue(value, decimals)}
          {showUnit && value != null ? (
            <span
              className={`font-semibold${
                hasWidgetBoardUnitTypography(typography)
                  ? ""
                  : " course-metric-bar-card__unit text-[var(--course-wb-unit)]"
              }`}
              style={unitStyle}
            >
              {unitSuffix}
            </span>
          ) : null}
        </p>
      ) : null}
      <div
        className="course-metric-bar-card__track mt-2 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: trackColor ?? undefined }}
        aria-hidden
      >
        <span
          className="course-metric-bar-card__fill block h-full rounded-full transition-[width] duration-200"
          style={{
            width: `${fillPercent}%`,
            background: fillColor
              ? fillColor
              : "linear-gradient(90deg, var(--course-wb-gradient-from), var(--course-wb-gradient-to))",
          }}
        />
      </div>
    </div>
  );
}
