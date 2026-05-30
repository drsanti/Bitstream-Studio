import {
  TRNParameter,
  type TRNParameterNameColumnLayout,
  type TRNParameterPositiveSignMode,
} from "@/ui/TRN";
import { TRNTooltip } from "@/ui/TRN";
import { gsap } from "gsap";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  toTrnIconPulseAnimationPreset,
  toTrnIconPulseIntensityPreset,
} from "../../../ui/TRN/trnIconPulsePresets.js";
import { metricProgressPercent } from "../../telemetry/telemetryFormat";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  SENSOR_DECK_UNIT_COL_CLASS,
  SENSOR_DECK_VALUE_TEXT_COL_CLASS,
} from "./sensorDeckParameterLayout.js";

export function SensorMetricRow(props: {
  name: string;
  value: string;
  unit: string;
  progressPercent: number;
  fillColor: string;
  icon: ReactNode;
  hint?: string;
  /** When set with gauge min/max, value text and bar follow GSAP tween rules (same threshold as BMI270 parameters). */
  rawNumeric?: number;
  gaugeMin?: number;
  gaugeMax?: number;
  fractionDigits?: number;
  samplingIntervalMs?: number;
  interpolationThresholdMs?: number;
  interpolationMinDurationMs?: number;
  interpolationMaxDurationMs?: number;
  /** Widen label column when names are words instead of abbreviations (deck cards). */
  nameColumnLayout?: TRNParameterNameColumnLayout;
  /**
   * When true (BMI270-style), omit `iconSlotStyle` / `[&_svg]:text-current` on `TRNParameter`;
   * put axis tint on the Lucide icon via `text-*` classes instead. `fillColor` is still used for the gauge bar.
   */
  iconColorOnIcon?: boolean;
  /**
   * Wire-stable key for icon pulse (defaults to `value`). Use when the displayed string is tweened so the pulse
   * tracks the sample, not every tween frame.
   */
  iconPulseTriggerKey?: ReactNode;
  /** TRNParameter: prefix positive values with `+` (default omit for unsigned rows). */
  positiveSignMode?: TRNParameterPositiveSignMode;
}) {
  const {
    name,
    value,
    unit,
    progressPercent,
    fillColor,
    icon,
    hint,
    rawNumeric,
    gaugeMin,
    gaugeMax,
    fractionDigits = 2,
    samplingIntervalMs = 0,
    interpolationThresholdMs: interpolationThresholdProp,
    interpolationMinDurationMs: interpolationMinProp,
    interpolationMaxDurationMs: interpolationMaxProp,
    nameColumnLayout = "fixed",
    iconColorOnIcon = false,
    iconPulseTriggerKey: iconPulseTriggerKeyProp,
    positiveSignMode = "omit",
  } = props;

  const {
    sensorTelemetryValueTweenEnabled,
    sensorTelemetryValueTweenEase,
    storeThreshold,
    storeMin,
    storeMax,
    sensorTelemetryIconPulseEnabled,
    sensorTelemetryIconPulseThrottleMs,
    sensorTelemetryIconPulseIntensityPreset,
    sensorTelemetryIconPulsePeakColorHex,
    sensorTelemetryIconPulseAnimationPreset,
    sensorTelemetryIconPulseColorAnimationEnabled,
  } = useBitstreamConfigStore(
    useShallow((s) => ({
      sensorTelemetryValueTweenEnabled: s.sensorTelemetryValueTweenEnabled,
      sensorTelemetryValueTweenEase: s.sensorTelemetryValueTweenEase,
      storeThreshold: s.sensorTelemetryInterpolationThresholdMs,
      storeMin: s.sensorTelemetryInterpolationMinMs,
      storeMax: s.sensorTelemetryInterpolationMaxMs,
      sensorTelemetryIconPulseEnabled: s.sensorTelemetryIconPulseEnabled,
      sensorTelemetryIconPulseThrottleMs: s.sensorTelemetryIconPulseThrottleMs,
      sensorTelemetryIconPulseIntensityPreset: s.sensorTelemetryIconPulseIntensityPreset,
      sensorTelemetryIconPulsePeakColorHex: s.sensorTelemetryIconPulsePeakColorHex,
      sensorTelemetryIconPulseAnimationPreset: s.sensorTelemetryIconPulseAnimationPreset,
      sensorTelemetryIconPulseColorAnimationEnabled: s.sensorTelemetryIconPulseColorAnimationEnabled,
    })),
  );

  const iconPulseTriggerKey =
    iconPulseTriggerKeyProp !== undefined ? iconPulseTriggerKeyProp : value;

  const interpolationThresholdMs = interpolationThresholdProp ?? storeThreshold;
  const interpolationMinDurationMs = interpolationMinProp ?? storeMin;
  const interpolationMaxDurationMs = interpolationMaxProp ?? storeMax;

  const gaugeScaleReady =
    typeof gaugeMin === "number" &&
    typeof gaugeMax === "number" &&
    Number.isFinite(rawNumeric);

  const initialNumeric =
    gaugeScaleReady && rawNumeric !== undefined ? rawNumeric : Number.NaN;
  const [displayNumericValue, setDisplayNumericValue] = useState<number | null>(
    Number.isFinite(initialNumeric) ? initialNumeric : null,
  );
  const valueTweenStateRef = useRef<{ value: number } | null>(null);
  const displayNumericRef = useRef<number | null>(
    Number.isFinite(initialNumeric) ? initialNumeric : null,
  );

  const numericForUi: number | null =
    !sensorTelemetryValueTweenEnabled
      ? gaugeScaleReady && rawNumeric !== undefined && Number.isFinite(rawNumeric)
        ? rawNumeric
        : null
      : displayNumericValue;

  useEffect(() => {
    if (!sensorTelemetryValueTweenEnabled) {
      if (valueTweenStateRef.current != null) {
        gsap.killTweensOf(valueTweenStateRef.current);
        valueTweenStateRef.current = null;
      }
      return;
    }

    if (
      !gaugeScaleReady ||
      rawNumeric === undefined ||
      !Number.isFinite(rawNumeric)
    ) {
      if (valueTweenStateRef.current != null) {
        gsap.killTweensOf(valueTweenStateRef.current);
        valueTweenStateRef.current = null;
      }
      displayNumericRef.current = null;
      setDisplayNumericValue(null);
      return;
    }

    const incomingNumericValue = rawNumeric;

    if (valueTweenStateRef.current != null) {
      gsap.killTweensOf(valueTweenStateRef.current);
      valueTweenStateRef.current = null;
    }

    if (displayNumericRef.current == null) {
      displayNumericRef.current = incomingNumericValue;
      setDisplayNumericValue(incomingNumericValue);
      return;
    }

    if (
      Math.abs(incomingNumericValue - displayNumericRef.current) <=
      Number.EPSILON
    ) {
      return;
    }

    if (samplingIntervalMs < interpolationThresholdMs) {
      displayNumericRef.current = incomingNumericValue;
      setDisplayNumericValue(incomingNumericValue);
      return;
    }

    const tweenState = { value: displayNumericRef.current };
    valueTweenStateRef.current = tweenState;
    gsap.to(tweenState, {
      value: incomingNumericValue,
      duration: Math.min(
        interpolationMaxDurationMs / 1000,
        Math.max(
          interpolationMinDurationMs / 1000,
          Math.max(0, samplingIntervalMs) / 1000,
        ),
      ),
      ease: sensorTelemetryValueTweenEase,
      onUpdate: () => {
        displayNumericRef.current = tweenState.value;
        setDisplayNumericValue(tweenState.value);
      },
      onComplete: () => {
        displayNumericRef.current = incomingNumericValue;
        setDisplayNumericValue(incomingNumericValue);
        valueTweenStateRef.current = null;
      },
    });

    return () => {
      if (valueTweenStateRef.current != null) {
        gsap.killTweensOf(valueTweenStateRef.current);
        valueTweenStateRef.current = null;
      }
    };
  }, [
    gaugeScaleReady,
    interpolationMaxDurationMs,
    interpolationMinDurationMs,
    interpolationThresholdMs,
    rawNumeric,
    samplingIntervalMs,
    sensorTelemetryValueTweenEase,
    sensorTelemetryValueTweenEnabled,
  ]);

  const displayValue =
    gaugeScaleReady && numericForUi != null
      ? numericForUi.toFixed(fractionDigits)
      : value;
  const effectiveProgress =
    gaugeScaleReady &&
    numericForUi != null &&
    typeof gaugeMin === "number" &&
    typeof gaugeMax === "number"
      ? metricProgressPercent(numericForUi, gaugeMin, gaugeMax)
      : progressPercent;

  const gaugeEl = (
    <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/15 bg-white/10">
      <div
        className="h-full rounded-full"
        style={{
          width: `${effectiveProgress}%`,
          backgroundColor: fillColor,
        }}
      />
    </div>
  );

  const row = (
    <div className={hint ? "w-full cursor-help" : "w-full"}>
      <TRNParameter
        name={<div className="pb-0.5">{name}</div>}
        nameColumnLayout={nameColumnLayout}
        valueColumnLayout="auto"
        valueTextColumnClassName={SENSOR_DECK_VALUE_TEXT_COL_CLASS}
        unitColumnClassName={SENSOR_DECK_UNIT_COL_CLASS}
        value={displayValue}
        unit={unit}
        positiveSignMode={positiveSignMode}
        iconPulseOnValueChange={sensorTelemetryIconPulseEnabled}
        iconPulseThrottleMs={sensorTelemetryIconPulseThrottleMs}
        iconPulseIntensityPreset={toTrnIconPulseIntensityPreset(
          sensorTelemetryIconPulseIntensityPreset,
        )}
        iconPulsePeakColorHex={sensorTelemetryIconPulsePeakColorHex}
        iconPulseAnimationPreset={toTrnIconPulseAnimationPreset(
          sensorTelemetryIconPulseAnimationPreset,
        )}
        iconPulseColorAnimationEnabled={sensorTelemetryIconPulseColorAnimationEnabled}
        iconPulseTriggerKey={iconPulseTriggerKey}
        icon={icon}
        iconSlotClassName={iconColorOnIcon ? undefined : "[&_svg]:text-current"}
        iconSlotStyle={iconColorOnIcon ? undefined : { color: fillColor }}
        gauge={gaugeEl}
      />
    </div>
  );

  if (!hint) {
    return row;
  }

  return (
    <TRNTooltip
      content={<div className="whitespace-pre-line text-left">{hint}</div>}
      trigger={row}
      placement="top-start"
      openDelayMs={1000}
      className="block w-full"
      triggerClassName="w-full p-0 text-inherit"
      disableHoverFx
    />
  );
}
