import { TRNParameter } from "@/ui/TRN/TRNParameter";
import { TRNTooltip } from "@/ui/TRN";
import { Activity } from "lucide-react";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Bmi270RawSectionItem } from "./bmi270RawTypes";
import { getBmi270AxisGaugeFillColorHex } from "./bmi270AxisTelemetryStyles";
import {
  SENSOR_DECK_UNIT_COL_CLASS,
  SENSOR_DECK_VALUE_TEXT_COL_CLASS,
} from "../telemetry/sensorDeckParameterLayout.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  toTrnIconPulseAnimationPreset,
  toTrnIconPulseIntensityPreset,
} from "../../../ui/TRN/trnIconPulsePresets.js";

export function Bmi270AnimatedParameter(props: {
  item: Bmi270RawSectionItem;
  colorClassName: string;
  samplingIntervalMs?: number;
}) {
  const { item, colorClassName, samplingIntervalMs = 0 } = props;

  const {
    sensorTelemetryValueTweenEnabled,
    sensorTelemetryValueTweenEase,
    sensorTelemetryInterpolationThresholdMs,
    sensorTelemetryInterpolationMinMs,
    sensorTelemetryInterpolationMaxMs,
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
      sensorTelemetryInterpolationThresholdMs: s.sensorTelemetryInterpolationThresholdMs,
      sensorTelemetryInterpolationMinMs: s.sensorTelemetryInterpolationMinMs,
      sensorTelemetryInterpolationMaxMs: s.sensorTelemetryInterpolationMaxMs,
      sensorTelemetryIconPulseEnabled: s.sensorTelemetryIconPulseEnabled,
      sensorTelemetryIconPulseThrottleMs: s.sensorTelemetryIconPulseThrottleMs,
      sensorTelemetryIconPulseIntensityPreset: s.sensorTelemetryIconPulseIntensityPreset,
      sensorTelemetryIconPulsePeakColorHex: s.sensorTelemetryIconPulsePeakColorHex,
      sensorTelemetryIconPulseAnimationPreset: s.sensorTelemetryIconPulseAnimationPreset,
      sensorTelemetryIconPulseColorAnimationEnabled: s.sensorTelemetryIconPulseColorAnimationEnabled,
    })),
  );

  const interpolationThresholdMs = sensorTelemetryInterpolationThresholdMs;
  const interpolationMinDurationMs = sensorTelemetryInterpolationMinMs;
  const interpolationMaxDurationMs = sensorTelemetryInterpolationMaxMs;

  const initialNumericValue = Number(item.value);
  const [displayNumericValue, setDisplayNumericValue] = useState<number | null>(
    Number.isFinite(initialNumericValue) ? initialNumericValue : null,
  );
  const valueTweenStateRef = useRef<{ value: number } | null>(null);
  const displayNumericRef = useRef<number | null>(
    Number.isFinite(initialNumericValue) ? initialNumericValue : null,
  );
  /** When tween is off, render strictly from `item.value` so digits match the wire sample every frame. */
  const wireNumeric = Number.isFinite(Number(item.value))
    ? Number(item.value)
    : null;
  const effectiveNumeric: number | null = sensorTelemetryValueTweenEnabled
    ? displayNumericValue
    : wireNumeric;
  const numericValue = effectiveNumeric ?? Number.NaN;
  const isNumericValue = effectiveNumeric != null;
  const valueFractionDigits = item.valueFractionDigits ?? 2;
  const gaugeMaxAbs =
    item.centerZeroGaugeMaxAbs ??
    item.oneSidedGaugeMaxAbs ??
    (item.unit === "rad/s"
      ? 20
      : item.unit === "m/s²"
        ? 20
        : item.unit === "rad"
          ? Math.PI
          : item.unit === "°C"
            ? 100
            : 1);
  const progressPercent = isNumericValue
    ? Math.min(100, (Math.abs(numericValue) / gaugeMaxAbs) * 100)
    : 0;
  /** Fusion Euler angles use `rad` in (−π, π]; quaternion uses `centerZeroGaugeMaxAbs`. Same pattern as gyro/accel. */
  const isCenterZeroGauge =
    item.oneSidedGaugeMaxAbs == null &&
    (item.centerZeroGaugeMaxAbs != null ||
      item.unit === "rad/s" ||
      item.unit === "m/s²" ||
      item.unit === "rad");
  const signedRatio =
    isNumericValue && gaugeMaxAbs > 0
      ? Math.max(-1, Math.min(1, numericValue / gaugeMaxAbs))
      : 0;
  const signedWidthPercent = Math.abs(signedRatio) * 50;
  const signedLeftPercent = signedRatio < 0 ? 50 - signedWidthPercent : 50;
  const gaugeFillColor = getBmi270AxisGaugeFillColorHex(
    item.name,
    progressPercent,
    isNumericValue ? numericValue : 0,
  );
  const gaugeFillOpacity = 1;

  useEffect(() => {
    if (!sensorTelemetryValueTweenEnabled) {
      if (valueTweenStateRef.current != null) {
        gsap.killTweensOf(valueTweenStateRef.current);
        valueTweenStateRef.current = null;
      }
      return;
    }

    const incomingNumericValue = Number(item.value);
    if (!Number.isFinite(incomingNumericValue)) {
      if (valueTweenStateRef.current != null) {
        gsap.killTweensOf(valueTweenStateRef.current);
        valueTweenStateRef.current = null;
      }
      displayNumericRef.current = null;
      setDisplayNumericValue(null);
      return;
    }

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
    interpolationMaxDurationMs,
    interpolationMinDurationMs,
    interpolationThresholdMs,
    item.value,
    samplingIntervalMs,
    sensorTelemetryValueTweenEase,
    sensorTelemetryValueTweenEnabled,
  ]);

  const row = (
    <div className={item.hint ? "w-full cursor-help" : "w-full"}>
      <TRNParameter
        name={<div className="pb-0.5">{item.name}</div>}
        valueColumnLayout="auto"
        valueTextColumnClassName={SENSOR_DECK_VALUE_TEXT_COL_CLASS}
        unitColumnClassName={SENSOR_DECK_UNIT_COL_CLASS}
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
        iconPulseTriggerKey={item.value}
        value={
          effectiveNumeric == null
            ? item.value
            : effectiveNumeric.toFixed(valueFractionDigits)
        }
        positiveSignMode={item.positiveSignMode ?? "always"}
        gauge={
          isCenterZeroGauge ? (
            <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-white/15 bg-white/10">
              <div className="absolute inset-y-0 left-0 w-1/2 bg-white/5" />
              <div className="absolute inset-y-0 right-0 w-1/2 bg-white/10" />
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/40" />
              <div
                className="absolute inset-y-0 rounded-full"
                style={{
                  left: `${signedLeftPercent}%`,
                  width: `${signedWidthPercent}%`,
                  backgroundColor: gaugeFillColor,
                  opacity: gaugeFillOpacity,
                }}
              />
            </div>
          ) : (
            <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/15 bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: gaugeFillColor,
                  opacity: gaugeFillOpacity,
                }}
              />
            </div>
          )
        }
        unit={item.unit}
        icon={
          <Activity
            className={`h-4 w-4 ${colorClassName}`}
            strokeWidth={2.25}
            aria-hidden
          />
        }
      />
    </div>
  );
  if (!item.hint) return row;
  return (
    <TRNTooltip
      content={<div className="whitespace-pre-line text-left">{item.hint}</div>}
      trigger={row}
      placement="top-start"
      openDelayMs={1000}
      className="block w-full"
      triggerClassName="w-full p-0 text-inherit"
      disableHoverFx
    />
  );
}
