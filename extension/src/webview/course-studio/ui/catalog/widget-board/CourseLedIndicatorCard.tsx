import { useEffect, useState, type CSSProperties } from "react";
import type { WidgetBoardLedSize, WidgetBoardWidgetTypographyV1 } from "../../../schemas/widgetBoard.v1";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { courseBindingHealthToSensorHealth } from "../../../runtime/courseBindingHealth";
import type { SensorHealthStatus } from "../../../../sensor-studio/features/editor/store/flow-editor.store";
import {
  hasWidgetBoardLabelTypography,
  widgetBoardLabelTypographyStyle,
} from "./widgetBoardTypographyStyle";

const LED_SIZE_CLASS: Record<WidgetBoardLedSize, string> = {
  sm: "course-led-indicator-card__lamp--sm",
  md: "course-led-indicator-card__lamp--md",
  lg: "course-led-indicator-card__lamp--lg",
};

export function CourseLedIndicatorCard({
  label,
  active,
  onColor,
  offColor,
  ledSize = "md",
  showLabel = true,
  glowWhenOn = true,
  blink = false,
  blinkPeriodMs = 800,
  health,
  typography,
}: {
  label: string;
  active: boolean;
  onColor: string;
  offColor: string;
  ledSize?: WidgetBoardLedSize;
  showLabel?: boolean;
  glowWhenOn?: boolean;
  blink?: boolean;
  blinkPeriodMs?: number;
  health?: CourseBindingHealthStatus;
  typography?: WidgetBoardWidgetTypographyV1;
}) {
  const [blinkVisible, setBlinkVisible] = useState(true);
  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale";
  const lampOn = active && (!blink || blinkVisible);
  const lampColor = lampOn ? onColor : offColor;

  useEffect(() => {
    if (!blink || !active) {
      setBlinkVisible(true);
      return;
    }
    const period = Math.max(200, Math.min(3000, blinkPeriodMs));
    const id = window.setInterval(() => {
      setBlinkVisible((prev) => !prev);
    }, period);
    return () => window.clearInterval(id);
  }, [active, blink, blinkPeriodMs]);

  return (
    <div
      className={`course-led-indicator-card flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2 ${
        stale ? "course-widget-board-entry--stale" : ""
      }`}
      data-course-widget-kind="led-indicator"
    >
      <span
        className={`course-led-indicator-card__lamp rounded-full ${LED_SIZE_CLASS[ledSize]}${
          lampOn && glowWhenOn ? " course-led-indicator-card__lamp--glow" : ""
        }`}
        style={
          {
            backgroundColor: lampColor,
            boxShadow:
              lampOn && glowWhenOn
                ? `0 0 12px color-mix(in srgb, ${onColor} 55%, transparent)`
                : "none",
          } as CSSProperties
        }
        aria-hidden
      />
      {showLabel ? (
        <p
          className={`max-w-full truncate text-center font-medium uppercase tracking-widest${
            hasWidgetBoardLabelTypography(typography)
              ? ""
              : " course-led-indicator-card__label text-[var(--course-wb-label)]"
          }`}
          style={widgetBoardLabelTypographyStyle(typography)}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}
