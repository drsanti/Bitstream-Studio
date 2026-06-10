import type { CSSProperties } from "react";
import type {
  WidgetBoardFillOrigin,
  WidgetBoardWidgetTypographyV1,
} from "../../../schemas/widgetBoard.v1";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { courseBindingHealthToSensorHealth } from "../../../runtime/courseBindingHealth";
import type { SensorHealthStatus } from "../../../../sensor-studio/features/editor/store/flow-editor.store";
import { formatWidgetBoardValue, normalizeWidgetBoardScalar } from "./widgetBoardLayout";
import {
  hasWidgetBoardLabelTypography,
  hasWidgetBoardUnitTypography,
  hasWidgetBoardValueTypography,
  widgetBoardLabelTypographyStyle,
  widgetBoardUnitTypographyStyle,
  widgetBoardValueTypographyStyle,
} from "./widgetBoardTypographyStyle";
import { useWidgetBoardSmoothedRatio } from "./useWidgetBoardSmoothedRatio";

export function CourseVerticalBarCard({
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
  fillFrom = "bottom",
  fillSmoothingMs = 0,
  trackWidthPercent = 14,
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
  fillFrom?: WidgetBoardFillOrigin;
  fillSmoothingMs?: number;
  trackWidthPercent?: number;
  trackColor?: string;
  fillColor?: string;
}) {
  const targetRatio = normalizeWidgetBoardScalar(value, min, max) ?? 0;
  const displayRatio = useWidgetBoardSmoothedRatio(targetRatio, fillSmoothingMs);
  const fillPercent = displayRatio * 100;
  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale";
  const unitSuffix = unit != null && unit.length > 0 ? ` ${unit}` : "";
  const trackWidth = Math.max(8, Math.min(40, Math.round(trackWidthPercent)));

  return (
    <div
      className={`course-vertical-bar-card flex h-full min-h-0 min-w-0 gap-2 px-2 py-2 ${
        stale ? "course-widget-board-entry--stale" : ""
      }`}
      data-course-widget-kind="vertical-bar"
    >
      <div
        className="course-vertical-bar-card__track relative min-h-0 shrink-0 overflow-hidden rounded-full"
        style={{
          width: `${trackWidth}%`,
          backgroundColor: trackColor ?? "var(--course-wb-track-bg)",
        }}
        aria-hidden
      >
        <span
          className="course-vertical-bar-card__fill absolute left-0 right-0 rounded-full transition-[height,top,bottom] duration-200"
          style={{
            height: `${fillPercent}%`,
            ...(fillFrom === "top"
              ? { top: 0, bottom: "auto" }
              : { bottom: 0, top: "auto" }),
            background: fillColor
              ? fillColor
              : "linear-gradient(180deg, var(--course-wb-gradient-from), var(--course-wb-gradient-to))",
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {showLabel ? (
          <p
            className={`font-medium uppercase tracking-widest${
              hasWidgetBoardLabelTypography(typography)
                ? ""
                : " course-vertical-bar-card__label text-[var(--course-wb-label)]"
            }`}
            style={widgetBoardLabelTypographyStyle(typography)}
          >
            {label}
          </p>
        ) : null}
        {showValue ? (
          <p
            className={`mt-0.5 font-bold leading-tight${
              hasWidgetBoardValueTypography(typography)
                ? ""
                : " course-vertical-bar-card__value text-[var(--course-wb-value)]"
            }`}
            style={
              {
                ...widgetBoardValueTypographyStyle(typography),
                textShadow:
                  typography?.valueColor != null ? "none" : "var(--course-wb-value-shadow, none)",
              } as CSSProperties
            }
          >
            {formatWidgetBoardValue(value, decimals)}
            {showUnit ? (
              <span
                className={`font-semibold${
                  hasWidgetBoardUnitTypography(typography)
                    ? ""
                    : " course-vertical-bar-card__unit text-[var(--course-wb-unit)]"
                }`}
                style={widgetBoardUnitTypographyStyle(typography)}
              >
                {unitSuffix}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
