import type { WidgetBoardEntryV1 } from "../../../schemas/widgetBoard.v1";
import { useCourseLiveBinding } from "../../../runtime/useCourseLiveBinding";
import { CourseHeroRadialGauge } from "./CourseHeroRadialGauge";
import { CourseLedIndicatorCard } from "./CourseLedIndicatorCard";
import { CourseMetricBarCard } from "./CourseMetricBarCard";
import { CourseNumericReadoutCard } from "./CourseNumericReadoutCard";
import { CourseStatusPillCard } from "./CourseStatusPillCard";
import { CourseVerticalBarCard } from "./CourseVerticalBarCard";
import { resolveWidgetBoardBooleanActive } from "./widgetBoardActiveState";
import { resolveWidgetBoardDisplayUnit } from "./widgetBoardLayout";
import { spreadWidgetBoardLayoutProps } from "./widgetBoardReadoutLayout";
import { tryRenderWidgetBoardInfographic } from "./widgetBoardInfographicEntry";

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
      : widget.kind !== "status-pill" && widget.kind !== "led-indicator"
        ? (widget.demoValue ?? null)
        : null;

  const unit = resolveWidgetBoardDisplayUnit({
    widget,
    binding,
    liveUnit: live.unit,
  });

  const hasLiveSample =
    binding?.path != null &&
    binding.path.length > 0 &&
    (live.rawValue != null || live.displayValue != null);

  const layoutProps = spreadWidgetBoardLayoutProps(widget);

  if (widget.kind === "metric-bar") {
    const infographic = tryRenderWidgetBoardInfographic({
      widget,
      value: resolvedValue,
      unit,
      health: binding != null ? live.health : undefined,
    });
    if (infographic != null) {
      return infographic;
    }
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
        showLabel={widget.showLabel}
        showValue={widget.showValue}
        showUnit={widget.showUnit}
        trackColor={widget.trackColor}
        fillColor={widget.fillColor}
        {...layoutProps}
      />
    );
  }

  if (widget.kind === "numeric-readout") {
    const infographic = tryRenderWidgetBoardInfographic({
      widget,
      value: resolvedValue,
      unit,
      health: binding != null ? live.health : undefined,
    });
    if (infographic != null) {
      return infographic;
    }
    return (
      <CourseNumericReadoutCard
        label={widget.label}
        value={resolvedValue}
        unit={unit}
        decimals={widget.decimals}
        health={binding != null ? live.health : undefined}
        typography={widget.typography}
        showLabel={widget.showLabel}
        showValue={widget.showValue}
        showUnit={widget.showUnit}
        valueAlign={widget.valueAlign}
        valueScale={widget.valueScale}
        {...layoutProps}
      />
    );
  }

  if (widget.kind === "vertical-bar") {
    const infographic = tryRenderWidgetBoardInfographic({
      widget,
      value: resolvedValue,
      unit,
      health: binding != null ? live.health : undefined,
    });
    if (infographic != null) {
      return infographic;
    }
    return (
      <CourseVerticalBarCard
        label={widget.label}
        value={resolvedValue}
        unit={unit}
        min={widget.min}
        max={widget.max}
        decimals={widget.decimals}
        health={binding != null ? live.health : undefined}
        typography={widget.typography}
        showLabel={widget.showLabel}
        showValue={widget.showValue}
        showUnit={widget.showUnit}
        fillFrom={widget.fillFrom}
        fillSmoothingMs={widget.fillSmoothingMs}
        trackWidthPercent={widget.trackWidthPercent}
        trackColor={widget.trackColor}
        fillColor={widget.fillColor}
        {...layoutProps}
      />
    );
  }

  if (widget.kind === "status-pill") {
    const active = resolveWidgetBoardBooleanActive({
      binding,
      rawValue: live.rawValue,
      displayValue: live.displayValue,
      condition: { compareOp: widget.compareOp, compareValue: widget.compareValue },
      demoActive: widget.demoActive,
      hasLiveSample,
    });
    return (
      <CourseStatusPillCard
        label={widget.label}
        active={active}
        onLabel={widget.onLabel}
        offLabel={widget.offLabel}
        widget={widget}
        health={binding != null ? live.health : undefined}
        typography={widget.typography}
        showLabel={widget.showLabel}
        showStatusPill={widget.showStatusPill}
        pillSize={widget.pillSize}
        {...layoutProps}
      />
    );
  }

  if (widget.kind === "led-indicator") {
    const active = resolveWidgetBoardBooleanActive({
      binding,
      rawValue: live.rawValue,
      displayValue: live.displayValue,
      condition: { compareOp: widget.compareOp, compareValue: widget.compareValue },
      demoActive: widget.demoActive,
      hasLiveSample,
    });
    return (
      <CourseLedIndicatorCard
        label={widget.label}
        active={active}
        onColor={widget.onColor}
        offColor={widget.offColor}
        ledSize={widget.ledSize}
        showLabel={widget.showLabel}
        glowWhenOn={widget.glowWhenOn}
        blink={widget.blink}
        blinkPeriodMs={widget.blinkPeriodMs}
        health={binding != null ? live.health : undefined}
        typography={widget.typography}
        {...layoutProps}
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
      showLabel={widget.showLabel}
      labelPosition={widget.labelPosition}
      tileContentH={widget.tileContentH}
      tileContentV={widget.tileContentV}
    />
  );
}
