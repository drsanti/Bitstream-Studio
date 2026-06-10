import type { WidgetBoardEntryV1 } from "../../../schemas/widgetBoard.v1";
import { useCourseLiveBinding } from "../../../runtime/useCourseLiveBinding";
import { CourseHeroRadialGauge } from "./CourseHeroRadialGauge";
import { CourseMetricBarCard } from "./CourseMetricBarCard";
import { resolveWidgetBoardDisplayUnit } from "./widgetBoardLayout";

export function CourseWidgetBoardEntry({
  widget,
  staleMs,
}: {
  widget: WidgetBoardEntryV1;
  staleMs?: number;
}) {
  const binding = widget.binding;
  const live = useCourseLiveBinding(binding ?? null, staleMs);

  const resolvedValue =
    live.displayValue != null && Number.isFinite(live.displayValue)
      ? live.displayValue
      : widget.demoValue ?? null;

  const unit = resolveWidgetBoardDisplayUnit({
    widget,
    binding,
    liveUnit: live.unit,
  });

  if (widget.kind === "metric-bar") {
    return (
      <CourseMetricBarCard
        label={widget.label}
        value={resolvedValue}
        unit={unit}
        min={widget.min}
        max={widget.max}
        decimals={widget.decimals}
        health={binding != null ? live.health : undefined}
        typography={widget.typography}
      />
    );
  }

  return (
    <CourseHeroRadialGauge
      label={widget.label}
      value={resolvedValue}
      unit={unit}
      min={widget.min}
      max={widget.max}
      decimals={widget.decimals}
      health={binding != null ? live.health : undefined}
      typography={widget.typography}
      heroArcPreset={widget.heroArcPreset}
      showValue={widget.showValue}
      showUnit={widget.showUnit}
      fillSmoothingMs={widget.fillSmoothingMs}
      holeSizePercent={widget.holeSizePercent}
      zoneTint={widget.zoneTint}
      showGlow={widget.showGlow}
      arcCap={widget.arcCap}
    />
  );
}
