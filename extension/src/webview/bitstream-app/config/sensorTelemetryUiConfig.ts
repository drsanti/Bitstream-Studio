/**
 * Runtime settings for live sensor deck value tweening and TRNParameter icon pulse.
 * Persisted in `bitstream-dashboard-config-v2` via {@link useBitstreamConfigStore}.
 */

export const SENSOR_TELEMETRY_TWEEN_EASES = [
  "none",
  "power1.out",
  "power2.out",
] as const;
export type SensorTelemetryTweenEase = (typeof SENSOR_TELEMETRY_TWEEN_EASES)[number];

export const SENSOR_TELEMETRY_ICON_PULSE_INTENSITY_PRESETS = [
  "subtle",
  "normal",
  "strong",
] as const;
export type SensorTelemetryIconPulseIntensityPreset =
  (typeof SENSOR_TELEMETRY_ICON_PULSE_INTENSITY_PRESETS)[number];

/** GSAP ease families for the three-segment icon pulse (peak / mid / return). */
export const SENSOR_TELEMETRY_ICON_PULSE_ANIMATION_PRESETS = [
  "smooth",
  "elastic",
  "back",
  "snappy",
] as const;
export type SensorTelemetryIconPulseAnimationPreset =
  (typeof SENSOR_TELEMETRY_ICON_PULSE_ANIMATION_PRESETS)[number];

/** Keep in sync with {@link DEFAULT_TRN_ICON_PULSE_PEAK_COLOR_HEX} in `trnIconPulsePresets.ts`. */
export const DEFAULT_SENSOR_TELEMETRY_ICON_PULSE_PEAK_COLOR_HEX = "#4ade80";

/** Maps persisted legacy segmented presets (v1) to hex when migrating old localStorage. */
const LEGACY_ICON_PULSE_COLOR_PRESET_HEX: Record<string, string> = {
  green: "#4ade80",
  cyan: "#22d3ee",
  amber: "#fbbf24",
  white: "#e4e4e7",
};

function parseIconPulsePeakColorHex(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const t = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) {
    return t.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

/**
 * Normalizes persisted peak pulse color (`#rrggbb`).
 * If invalid, falls back to legacy `sensorTelemetryIconPulseColorPreset` when present, then default green.
 */
export function normalizeSensorTelemetryIconPulsePeakColorHex(
  value: unknown,
  legacyPreset?: unknown,
): string {
  const parsed = parseIconPulsePeakColorHex(value);
  if (parsed != null) {
    return parsed;
  }
  if (
    legacyPreset === "green" ||
    legacyPreset === "cyan" ||
    legacyPreset === "amber" ||
    legacyPreset === "white"
  ) {
    return LEGACY_ICON_PULSE_COLOR_PRESET_HEX[legacyPreset] ?? DEFAULT_SENSOR_TELEMETRY_ICON_PULSE_PEAK_COLOR_HEX;
  }
  if (typeof legacyPreset === "string") {
    const fromMap = LEGACY_ICON_PULSE_COLOR_PRESET_HEX[legacyPreset];
    if (fromMap != null) {
      return fromMap;
    }
  }
  return DEFAULT_SENSOR_TELEMETRY_ICON_PULSE_PEAK_COLOR_HEX;
}

export function normalizeSensorTelemetryTweenEase(
  value: unknown,
): SensorTelemetryTweenEase {
  if (
    value === "none" ||
    value === "power1.out" ||
    value === "power2.out"
  ) {
    return value;
  }
  return "none";
}

export function normalizeSensorTelemetryIconPulseIntensityPreset(
  value: unknown,
): SensorTelemetryIconPulseIntensityPreset {
  if (value === "subtle" || value === "normal" || value === "strong") {
    return value;
  }
  return "normal";
}

export function normalizeSensorTelemetryIconPulseAnimationPreset(
  value: unknown,
): SensorTelemetryIconPulseAnimationPreset {
  if (
    value === "smooth" ||
    value === "elastic" ||
    value === "back" ||
    value === "snappy"
  ) {
    return value;
  }
  return "smooth";
}

export function clampSensorTelemetryInterpolationThresholdMs(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 250;
  return Math.max(50, Math.min(500, n));
}

export function clampSensorTelemetryInterpolationMinMs(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 500;
  return Math.max(50, Math.min(2000, n));
}

export function clampSensorTelemetryInterpolationMaxMs(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 2500;
  return Math.max(200, Math.min(5000, n));
}

export function clampSensorTelemetryIconPulseThrottleMs(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 280;
  return Math.max(80, Math.min(600, n));
}

/** Keep min ≤ max after independent clamps. */
export function clampInterpolationMinMaxPair(
  minMs: number,
  maxMs: number,
): { minMs: number; maxMs: number } {
  if (minMs <= maxMs) {
    return { minMs, maxMs };
  }
  return { minMs: maxMs, maxMs: minMs };
}
