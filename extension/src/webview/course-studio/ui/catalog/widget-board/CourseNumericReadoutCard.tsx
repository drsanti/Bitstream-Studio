import type { CSSProperties } from "react";
import type {
  WidgetBoardValueAlign,
  WidgetBoardValueScale,
  WidgetBoardWidgetTypographyV1,
} from "../../../schemas/widgetBoard.v1";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { courseBindingHealthToSensorHealth } from "../../../runtime/courseBindingHealth";
import type { SensorHealthStatus } from "../../../../sensor-studio/features/editor/store/flow-editor.store";
import { formatWidgetBoardValue } from "./widgetBoardLayout";
import {
  hasWidgetBoardLabelTypography,
  hasWidgetBoardUnitTypography,
  hasWidgetBoardValueTypography,
  widgetBoardLabelTypographyStyle,
  widgetBoardUnitTypographyStyle,
  widgetBoardValueTypographyStyle,
} from "./widgetBoardTypographyStyle";

const VALUE_SCALE_CLASS: Record<WidgetBoardValueScale, string> = {
  standard: "course-numeric-readout-card__value--standard",
  large: "course-numeric-readout-card__value--large",
  hero: "course-numeric-readout-card__value--hero",
};

const ALIGN_CLASS: Record<WidgetBoardValueAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function CourseNumericReadoutCard({
  label,
  value,
  unit,
  decimals,
  health,
  typography,
  showLabel = true,
  showValue = true,
  showUnit = true,
  valueAlign = "center",
  valueScale = "large",
}: {
  label: string;
  value: number | null;
  unit?: string;
  decimals: number;
  health?: CourseBindingHealthStatus;
  typography?: WidgetBoardWidgetTypographyV1;
  showLabel?: boolean;
  showValue?: boolean;
  showUnit?: boolean;
  valueAlign?: WidgetBoardValueAlign;
  valueScale?: WidgetBoardValueScale;
}) {
  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale";
  const unitSuffix = unit != null && unit.length > 0 ? unit : "";
  const labelStyle = widgetBoardLabelTypographyStyle(typography);
  const valueStyle = widgetBoardValueTypographyStyle(typography);
  const unitStyle = widgetBoardUnitTypographyStyle(typography);
  const alignClass = ALIGN_CLASS[valueAlign];

  return (
    <div
      className={`course-numeric-readout-card flex h-full min-h-0 min-w-0 flex-col justify-center px-3 py-2 ${
        stale ? "course-widget-board-entry--stale" : ""
      } ${alignClass}`}
      data-course-widget-kind="numeric-readout"
    >
      {showLabel ? (
        <p
          className={`font-medium uppercase tracking-widest${
            hasWidgetBoardLabelTypography(typography)
              ? ""
              : " course-numeric-readout-card__label text-[var(--course-wb-label)]"
          }`}
          style={labelStyle}
        >
          {label}
        </p>
      ) : null}
      {showValue ? (
        <p
          className={`font-bold leading-tight${
            hasWidgetBoardValueTypography(typography)
              ? ""
              : ` course-numeric-readout-card__value text-[var(--course-wb-value)] ${VALUE_SCALE_CLASS[valueScale]}`
          }`}
          style={
            {
              ...valueStyle,
              textShadow:
                typography?.valueColor != null ? "none" : "var(--course-wb-value-shadow, none)",
            } as CSSProperties
          }
        >
          {formatWidgetBoardValue(value, decimals)}
          {showUnit && unitSuffix.length > 0 ? (
            <span
              className={`ml-1 font-semibold${
                hasWidgetBoardUnitTypography(typography)
                  ? ""
                  : " course-numeric-readout-card__unit text-[var(--course-wb-unit)]"
              }`}
              style={unitStyle}
            >
              {unitSuffix}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
