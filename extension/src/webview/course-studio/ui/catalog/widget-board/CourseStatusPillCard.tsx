import type { CSSProperties } from "react";
import type {
  WidgetBoardPillStyle,
  WidgetBoardStatusPillV1,
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

export function CourseStatusPillCard({
  label,
  active,
  onLabel,
  offLabel,
  widget,
  health,
  typography,
  showLabel = true,
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
}) {
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

  return (
    <div
      className={`course-status-pill-card flex h-full min-h-0 min-w-0 flex-col justify-center gap-1 px-3 py-1.5 ${
        stale ? "course-widget-board-entry--stale" : ""
      }`}
      data-course-widget-kind="status-pill"
    >
      {showLabel ? (
        <p
          className={`truncate font-medium uppercase tracking-widest${
            hasWidgetBoardLabelTypography(typography)
              ? ""
              : " course-status-pill-card__label text-[var(--course-wb-label)]"
          }`}
          style={widgetBoardLabelTypographyStyle(typography)}
        >
          {label}
        </p>
      ) : null}
      <span
        className={`course-status-pill-card__pill inline-flex w-fit max-w-full items-center rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide${
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
    </div>
  );
}
