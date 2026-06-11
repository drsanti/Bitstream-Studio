import type { CSSProperties } from "react";
import type {
  WidgetBoardReadoutLayoutConfig,
  WidgetBoardTileLayoutConfig,
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
import {
  pickWidgetBoardReadoutStackProps,
  pickWidgetBoardTileShellProps,
} from "./widgetBoardReadoutLayout";
import { WidgetBoardReadoutStack } from "./WidgetBoardReadoutStack";
import { WidgetBoardTileShell } from "./WidgetBoardTileShell";

const VALUE_SCALE_CLASS: Record<WidgetBoardValueScale, string> = {
  standard: "course-numeric-readout-card__value--standard",
  large: "course-numeric-readout-card__value--large",
  hero: "course-numeric-readout-card__value--hero",
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
  decimals: number;
  health?: CourseBindingHealthStatus;
  typography?: WidgetBoardWidgetTypographyV1;
  showLabel?: boolean;
  showValue?: boolean;
  showUnit?: boolean;
  valueAlign?: WidgetBoardValueAlign;
  valueScale?: WidgetBoardValueScale;
} & WidgetBoardReadoutLayoutConfig &
  WidgetBoardTileLayoutConfig) {
  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale";
  const unitSuffix = unit != null && unit.length > 0 ? unit : "";
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

  const labelClass = `font-medium uppercase tracking-widest${
    hasWidgetBoardLabelTypography(typography)
      ? ""
      : " course-numeric-readout-card__label text-[var(--course-wb-label)]"
  }`;

  const valueClass = `font-bold leading-tight${
    hasWidgetBoardValueTypography(typography)
      ? ""
      : ` course-numeric-readout-card__value text-[var(--course-wb-value)] ${VALUE_SCALE_CLASS[valueScale]}`
  }`;

  const valueNode = (
    <>
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
    </>
  );

  return (
    <WidgetBoardTileShell
      {...pickWidgetBoardTileShellProps({ tileContentH, tileContentV })}
      kind="numeric-readout"
      stale={stale}
      className="course-numeric-readout-card px-3 py-2"
    >
      <WidgetBoardReadoutStack
        {...pickWidgetBoardReadoutStackProps({ ...layoutConfig, valueAlign })}
        showLabel={showLabel}
        showValue={showValue}
        label={label}
        value={valueNode}
        labelClassName={labelClass}
        valueClassName={valueClass}
        labelStyle={labelStyle}
        valueStyle={valueStyle}
        stackClassName="w-full"
      />
    </WidgetBoardTileShell>
  );
}
