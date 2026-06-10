import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { WidgetBoardWidgetTypographyV1 } from "../../../schemas/widgetBoard.v1";
import type { CourseBindingHealthStatus } from "../../../runtime/courseBindingHealth";
import { courseBindingHealthToSensorHealth } from "../../../runtime/courseBindingHealth";
import type { SensorHealthStatus } from "../../../../sensor-studio/features/editor/store/flow-editor.store";
import {
  gaugeNeedleSmoothingSettled,
  stepGaugeNeedleSmoothing,
} from "../../../../sensor-studio/features/editor/nodes/display/gauge-display-config";
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
  coerceHeroRadialGaugeArcCap,
  coerceHeroRadialGaugeArcPreset,
  coerceHeroRadialGaugeZoneTint,
  heroGaugeArcEndDeg,
  heroGaugeConicBackground,
  HERO_RADIAL_GAUGE_DEFAULTS,
  resolveHeroGaugeArcToColor,
  type HeroRadialGaugeArcCapId,
  type HeroRadialGaugeArcPresetId,
  type HeroRadialGaugeZoneTintId,
} from "./heroRadialGaugeConfig";

function useSmoothedFillRatio(
  targetRatio: number,
  fillSmoothingMs: number,
): number {
  const [displayRatio, setDisplayRatio] = useState(targetRatio);
  const smoothRef = useRef(targetRatio);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (fillSmoothingMs <= 0) {
      smoothRef.current = targetRatio;
      setDisplayRatio(targetRatio);
      return;
    }

    let mounted = true;
    const tick = (ts: number) => {
      const last = lastTsRef.current ?? ts;
      lastTsRef.current = ts;
      const dt = ts - last;
      const next = stepGaugeNeedleSmoothing(
        smoothRef.current,
        targetRatio,
        dt,
        fillSmoothingMs,
      );
      smoothRef.current = next;
      if (mounted) {
        setDisplayRatio(next);
      }
      if (!gaugeNeedleSmoothingSettled(next, targetRatio, 0, 1)) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetRatio, fillSmoothingMs]);

  return fillSmoothingMs <= 0 ? targetRatio : displayRatio;
}

export function CourseHeroRadialGauge({
  label,
  value,
  unit,
  min,
  max,
  decimals,
  health,
  typography,
  heroArcPreset = HERO_RADIAL_GAUGE_DEFAULTS.heroArcPreset,
  showValue = HERO_RADIAL_GAUGE_DEFAULTS.showValue,
  showUnit = HERO_RADIAL_GAUGE_DEFAULTS.showUnit,
  fillSmoothingMs = HERO_RADIAL_GAUGE_DEFAULTS.fillSmoothingMs,
  holeSizePercent = HERO_RADIAL_GAUGE_DEFAULTS.holeSizePercent,
  zoneTint = HERO_RADIAL_GAUGE_DEFAULTS.zoneTint,
  showGlow = HERO_RADIAL_GAUGE_DEFAULTS.showGlow,
  arcCap = HERO_RADIAL_GAUGE_DEFAULTS.arcCap,
}: {
  label?: string;
  value: number | null;
  unit?: string;
  min: number;
  max: number;
  decimals: number;
  health?: CourseBindingHealthStatus;
  typography?: WidgetBoardWidgetTypographyV1;
  heroArcPreset?: HeroRadialGaugeArcPresetId;
  showValue?: boolean;
  showUnit?: boolean;
  fillSmoothingMs?: number;
  holeSizePercent?: number;
  zoneTint?: HeroRadialGaugeZoneTintId;
  showGlow?: boolean;
  arcCap?: HeroRadialGaugeArcCapId;
}) {
  const arcPreset = coerceHeroRadialGaugeArcPreset(heroArcPreset);
  const tintMode = coerceHeroRadialGaugeZoneTint(zoneTint);
  const capStyle = coerceHeroRadialGaugeArcCap(arcCap);
  const targetRatio = normalizeWidgetBoardScalar(value, min, max) ?? 0;
  const displayRatio = useSmoothedFillRatio(targetRatio, fillSmoothingMs);
  const sensorHealth: SensorHealthStatus | undefined =
    health != null ? courseBindingHealthToSensorHealth(health) : undefined;
  const stale = sensorHealth === "stale";
  const displayUnit = unit != null && unit.length > 0 ? unit.toUpperCase() : "";
  const labelStyle = widgetBoardLabelTypographyStyle(typography);
  const valueStyle = widgetBoardValueTypographyStyle(typography);
  const unitStyle = widgetBoardUnitTypographyStyle(typography);
  const customValueTypography = hasWidgetBoardValueTypography(typography);
  const showLabel = label != null && label.trim().length > 0;
  const holeInset = Math.max(8, Math.min(20, Math.round(holeSizePercent)));
  const arcToColor = resolveHeroGaugeArcToColor({
    zoneTint: tintMode,
    value,
    min,
    max,
  });
  const arcEndDeg = heroGaugeArcEndDeg(displayRatio, arcPreset);
  const showRoundCap = capStyle === "round" && displayRatio > 0.01;
  const capColor = arcToColor.startsWith("var(") ? "var(--course-wb-gauge-arc-to)" : arcToColor;

  return (
    <div
      className={`course-hero-radial-gauge flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-1 p-2 ${
        stale ? "course-widget-board-entry--stale" : ""
      }`}
      data-course-widget-kind="hero-radial-gauge"
    >
      {showLabel ? (
        <div
          className={`max-w-full truncate text-center font-semibold uppercase tracking-[0.14em]${
            hasWidgetBoardLabelTypography(typography)
              ? ""
              : " text-[10px] text-[var(--course-wb-label)]"
          }`}
          style={labelStyle}
        >
          {label}
        </div>
      ) : null}
      <div
        className="course-hero-radial-gauge__ring relative grid min-h-0 min-w-0 shrink-0 place-items-center"
        style={{
          background: heroGaugeConicBackground(displayRatio, arcPreset, {
            arcToColor,
            arcCap: capStyle,
          }),
          filter: showGlow ? "var(--course-wb-live-glow, none)" : "none",
          flex: showLabel ? "1 1 auto" : undefined,
        }}
      >
        <div
          className="course-hero-radial-gauge__hole absolute rounded-full"
          style={{ inset: `${holeInset}%` }}
          aria-hidden
        />
        {showRoundCap ? (
          <div
            className="course-hero-radial-gauge__arc-cap pointer-events-none absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: "3.5cqmin",
              height: "3.5cqmin",
              marginLeft: "-1.75cqmin",
              marginTop: "-1.75cqmin",
              backgroundColor: capColor,
              transform: `rotate(${arcEndDeg}deg) translateY(-47cqmin)`,
              transformOrigin: "center center",
            }}
            aria-hidden
          />
        ) : null}
        {showValue || (showUnit && displayUnit.length > 0) ? (
          <div className="relative z-[1] text-center leading-none">
            {showValue ? (
              <div
                className={`font-extrabold tracking-tight${
                  customValueTypography
                    ? ""
                    : " course-hero-radial-gauge__value text-[var(--course-wb-value)]"
                }`}
                style={
                  {
                    ...valueStyle,
                    textShadow:
                      typography?.valueColor != null
                        ? "none"
                        : "var(--course-wb-value-shadow, none)",
                  } as CSSProperties
                }
              >
                {formatWidgetBoardValue(value, decimals)}
              </div>
            ) : null}
            {showUnit && displayUnit.length > 0 ? (
              <div
                className={`mt-1 font-medium uppercase tracking-[0.2em]${
                  hasWidgetBoardUnitTypography(typography)
                    ? ""
                    : " course-hero-radial-gauge__unit text-[var(--course-wb-unit)]"
                }`}
                style={unitStyle}
              >
                {displayUnit}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
