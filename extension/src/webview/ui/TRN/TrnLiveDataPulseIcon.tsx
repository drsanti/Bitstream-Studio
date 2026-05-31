import type { ReactNode } from "react";
import { useMemo, useRef } from "react";
import type { SensorTelemetryIconPulseAnimationPreset } from "../../bitstream-app/config/sensorTelemetryUiConfig.js";
import {
  DEFAULT_TRN_ICON_PULSE_PEAK_COLOR_HEX,
  type TrnIconPulseIntensityPreset,
} from "./trnIconPulsePresets.js";
import {
  useGsapIconPulseOnValueChange,
  type TrnIconPulseStyle,
} from "./useGsapIconPulseOnValueChange.js";

export type TrnLiveDataPulseIconProps = {
  children: ReactNode;
  /** Serialized live sample fingerprint — pulse when this changes. */
  pulseTriggerKey?: string | number | null;
  /** Master switch; typically `streamMode === "live"`. */
  enabled?: boolean;
  /** Minimum ms between pulse starts (default 280). Node library uses 1000. */
  throttleMs?: number;
  intensityPreset?: TrnIconPulseIntensityPreset;
  peakColorHex?: string;
  animationPreset?: SensorTelemetryIconPulseAnimationPreset;
  colorAnimationEnabled?: boolean;
  className?: string;
};

const DEFAULT_THROTTLE_MS = 280;

/**
 * Wraps a Lucide (or other) icon and runs the same GSAP pulse used by {@link TRNParameter}
 * when `pulseTriggerKey` changes — e.g. live telemetry ticks in the node library.
 */
export function TrnLiveDataPulseIcon(props: TrnLiveDataPulseIconProps) {
  const {
    children,
    pulseTriggerKey = null,
    enabled = true,
    throttleMs = DEFAULT_THROTTLE_MS,
    intensityPreset = "normal",
    peakColorHex = DEFAULT_TRN_ICON_PULSE_PEAK_COLOR_HEX,
    animationPreset = "smooth",
    colorAnimationEnabled = true,
    className,
  } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const pulseActive = enabled && pulseTriggerKey != null && pulseTriggerKey !== "";

  const pulseStyle = useMemo(
    (): TrnIconPulseStyle => ({
      throttleMs,
      intensityPreset,
      peakColorHex,
      animationPreset,
      colorAnimationEnabled,
    }),
    [animationPreset, colorAnimationEnabled, intensityPreset, peakColorHex, throttleMs],
  );

  useGsapIconPulseOnValueChange(
    wrapRef,
    pulseActive,
    children,
    pulseTriggerKey,
    undefined,
    pulseStyle,
  );

  return (
    <div ref={wrapRef} className={className}>
      {children}
    </div>
  );
}
