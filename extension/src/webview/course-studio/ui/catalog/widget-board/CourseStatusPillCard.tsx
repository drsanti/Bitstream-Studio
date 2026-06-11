import type { CSSProperties } from "react";
import type {
  WidgetBoardPillSize,
  WidgetBoardPillStyle,
  WidgetBoardReadoutLayoutConfig,
  WidgetBoardStatusPillV1,
  WidgetBoardTileLayoutConfig,
  WidgetBoardWidgetTypographyV1,
} from "../../../schemas/widgetBoard.v1";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { courseBindingHealthToSensorHealth } from "../../../runtime/courseBindingHealth";
import type { SensorHealthStatus } from "../../../../sensor-studio/features/editor/store/flow-editor.store";
import {
  hasWidgetBoardLabelTypography,
  widgetBoardLabelTypographyStyle,
} from "./widgetBoardTypographyStyle";
import { resolveWidgetBoardStatusToneColors } from "./widgetBoardStatusTone";
import {
  pickWidgetBoardReadoutStackProps,
  pickWidgetBoardTileShellProps,
} from "./widgetBoardReadoutLayout";
import { WidgetBoardReadoutStack } from "./WidgetBoardReadoutStack";
import { WidgetBoardTileShell } from "./WidgetBoardTileShell";

const PILL_SIZE_CLASS: Record<WidgetBoardPillSize, string> = {
  sm: "course-status-pill-card__pill--sm px-2 py-0.5 text-[10px]",
  md: "course-status-pill-card__pill--md px-2.5 py-1 text-[11px]",
  lg: "course-status-pill-card__pill--lg px-3 py-1.5 text-[12px]",
};

export function CourseStatusPillCard({
  label,
  active,
  onLabel,
  offLabel,
  widget,
  health,
  typography,
  showLabel = true,
  showStatusPill = true,
  pillSize = "md",
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
  active: boolean;
  onLabel: string;
  offLabel: string;
  widget: Pick<
    WidgetBoardStatusPillV1,
    | "onTone"
    | "offTone"
    | "onBackgroundColor"
    | "onTextColor"
    | "onBorderColor"
    | "offBackgroundColor"
    | "offTextColor"
    | "offBorderColor"
    | "pillStyle"
  >;
  health?: CourseBindingHealthStatus;
  typography?: WidgetBoardWidgetTypographyV1;
  showLabel?: boolean;
  showStatusPill?: boolean;
  pillSize?: WidgetBoardPillSize;
} & WidgetBoardReadoutLayoutConfig &
  WidgetBoardTileLayoutConfig) {
  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale";
  const tone = active ? widget.onTone : widget.offTone;
  const colors = resolveWidgetBoardStatusToneColors({
    tone,
    backgroundColor: active ? widget.onBackgroundColor : widget.offBackgroundColor,
    textColor: active ? widget.onTextColor : widget.offTextColor,
    borderColor: active ? widget.onBorderColor : widget.offBorderColor,
  });
  const pillStyle: WidgetBoardPillStyle = widget.pillStyle;
  const statusText = active ? onLabel : offLabel;

  const layoutConfig: WidgetBoardReadoutLayoutConfig = {
    readoutLayout,
    readoutInlineAlign,
    readoutJustify,
    readoutCrossAlign,
    readoutOrder,
    readoutGapPx,
    readoutValueGrow,
  };

  const pillNode = (
    <span
      className={`course-status-pill-card__pill inline-flex w-fit max-w-full items-center rounded-full font-semibold uppercase tracking-wide ${PILL_SIZE_CLASS[pillSize]}${
        pillStyle === "outline" ? " course-status-pill-card__pill--outline" : ""
      }`}
      style={
        {
          backgroundColor: pillStyle === "filled" ? colors.background : "transparent",
          color: colors.text,
          border: `1px solid ${colors.border}`,
          fontSize: typography?.valueFontSizePx != null ? `${typography.valueFontSizePx}px` : undefined,
        } as CSSProperties
      }
    >
      {statusText}
    </span>
  );

  return (
    <WidgetBoardTileShell
      {...pickWidgetBoardTileShellProps({ tileContentH, tileContentV })}
      kind="status-pill"
      stale={stale}
      className="course-status-pill-card px-3 py-1.5"
    >
      <WidgetBoardReadoutStack
        {...pickWidgetBoardReadoutStackProps(layoutConfig)}
        showLabel={showLabel}
        showValue={showStatusPill}
        label={label}
        value={pillNode}
        labelClassName={`truncate font-medium uppercase tracking-widest${
          hasWidgetBoardLabelTypography(typography)
            ? ""
            : " course-status-pill-card__label text-[var(--course-wb-label)]"
        }`}
        valueClassName="min-w-0"
        labelStyle={widgetBoardLabelTypographyStyle(typography)}
        stackClassName={readoutLayout === "stacked" ? "w-full" : "w-full"}
      />
    </WidgetBoardTileShell>
  );
}
