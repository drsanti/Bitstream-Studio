import type { CSSProperties } from "react";
import type {
  WidgetBoardReadoutLayoutConfig,
  WidgetBoardTileLayoutConfig,
  WidgetBoardWidgetTypographyV1,
} from "../../../schemas/widgetBoard.v1";
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
import {
  pickWidgetBoardReadoutStackProps,
  pickWidgetBoardTileShellProps,
} from "./widgetBoardReadoutLayout";
import { WidgetBoardReadoutStack } from "./WidgetBoardReadoutStack";
import { WidgetBoardTileShell } from "./WidgetBoardTileShell";

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
  readoutLayout = "stacked",
  readoutInlineAlign = "start",
  readoutJustify,
  readoutCrossAlign,
  readoutOrder,
  readoutGapPx,
  readoutValueGrow,
  tileContentH = "center",
  tileContentV = "center",
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
} & WidgetBoardReadoutLayoutConfig &
  WidgetBoardTileLayoutConfig) {
  const normalized = normalizeWidgetBoardScalar(value, min, max);
  const fillPercent = normalized == null ? 0 : normalized * 100;
  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale" || sensorHealth === "inactive";

  const unitSuffix = unit != null && unit.length > 0 ? ` ${unit}` : "";
  const labelStyle = widgetBoardLabelTypographyStyle(typography);
  const valueStyle = widgetBoardValueTypographyStyle(typography);
  const unitStyle = widgetBoardUnitTypographyStyle(typography);

  const layoutConfig: WidgetBoardReadoutLayoutConfig = {
    readoutLayout,
    readoutInlineAlign,
    readoutJustify,
    readoutCrossAlign,
    readoutOrder,
    readoutGapPx,
    readoutValueGrow,
  };

  const valueNode = (
    <>
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
    </>
  );

  return (
    <WidgetBoardTileShell
      {...pickWidgetBoardTileShellProps({ tileContentH, tileContentV })}
      kind="metric-bar"
      stale={stale}
      className="course-metric-bar-card max-w-full px-3 py-2.5"
    >
      <div className="w-full min-w-0">
        <WidgetBoardReadoutStack
          {...pickWidgetBoardReadoutStackProps(layoutConfig)}
          showLabel={showLabel}
          showValue={showValue}
          label={label}
          value={valueNode}
          labelClassName={`font-medium uppercase tracking-widest${
            hasWidgetBoardLabelTypography(typography)
              ? ""
              : " course-metric-bar-card__label text-[var(--course-wb-label)]"
          }`}
          valueClassName={`font-bold leading-tight${
            hasWidgetBoardValueTypography(typography)
              ? ""
              : " course-metric-bar-card__value text-[var(--course-wb-value)]"
          }`}
          labelStyle={labelStyle}
          valueStyle={
            {
              ...valueStyle,
              textShadow:
                typography?.valueColor != null ? "none" : "var(--course-wb-value-shadow, none)",
            } as CSSProperties
          }
          stackClassName="w-full"
        />
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
    </WidgetBoardTileShell>
  );
}
