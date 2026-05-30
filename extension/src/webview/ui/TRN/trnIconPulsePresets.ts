/**
 * Maps icon pulse **intensity** and peak **color** to GSAP timeline numbers.
 * Peak color is a `#rrggbb` hex (from the settings color picker). Neutral gray stays on the same hue.
 */

import {
  DEFAULT_SENSOR_TELEMETRY_ICON_PULSE_PEAK_COLOR_HEX,
  normalizeSensorTelemetryIconPulseAnimationPreset,
  type SensorTelemetryIconPulseAnimationPreset,
} from "../../bitstream-app/config/sensorTelemetryUiConfig.js";

export type TrnIconPulseIntensityPreset = "subtle" | "normal" | "strong";

export type TrnIconPulseResolvedTimeline = {
  /** Hue used for achromatic “neutral” along the same axis as the peak. */
  pulseHue: number;
  peakColorCss: string;
  peakScale: number;
  peakRotation: number;
  midRotation: number;
  d1: number;
  d2: number;
  d3: number;
  /** GSAP ease for the approach / peak segment (and matching color in). */
  peakEase: string;
  /** GSAP ease for the short mid transition. */
  midEase: string;
  /** GSAP ease for the settle / return segment (and matching color out). */
  returnEase: string;
};

/** Default peak tint (green); keep in sync with `sensorTelemetryUiConfig` default. */
export const DEFAULT_TRN_ICON_PULSE_PEAK_COLOR_HEX =
  DEFAULT_SENSOR_TELEMETRY_ICON_PULSE_PEAK_COLOR_HEX;

const INTENSITY: Record<
  TrnIconPulseIntensityPreset,
  Pick<
    TrnIconPulseResolvedTimeline,
    "peakScale" | "peakRotation" | "midRotation" | "d1" | "d2" | "d3"
  >
> = {
  subtle: {
    peakScale: 1.06,
    peakRotation: 4,
    midRotation: -3,
    d1: 0.14,
    d2: 0.07,
    d3: 0.14,
  },
  normal: {
    peakScale: 1.12,
    peakRotation: 9,
    midRotation: -6,
    d1: 0.2,
    d2: 0.11,
    d3: 0.2,
  },
  strong: {
    peakScale: 1.18,
    peakRotation: 13,
    midRotation: -9,
    d1: 0.26,
    d2: 0.14,
    d3: 0.26,
  },
};

function clampHueDeg(h: number): number {
  let x = h % 360;
  if (x < 0) {
    x += 360;
  }
  return x;
}

function parseHexToRgb(hexInput: string): { r: number; g: number; b: number } | null {
  const s = hexInput.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) {
    const r = parseInt(s.slice(1, 3), 16) / 255;
    const g = parseInt(s.slice(3, 5), 16) / 255;
    const b = parseInt(s.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = parseInt(s[1] + s[1], 16) / 255;
    const g = parseInt(s[2] + s[2], 16) / 255;
    const b = parseInt(s[3] + s[3], 16) / 255;
    return { r, g, b };
  }
  return null;
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s, l };
}

/** Hue for neutral conversion; low-saturation colors use a cool gray axis. */
export function pulseHueFromPeakHex(peakColorHex: string): number {
  const rgb = parseHexToRgb(peakColorHex);
  if (rgb == null) {
    return 142;
  }
  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (s < 0.06) {
    return 210;
  }
  return clampHueDeg(h);
}

function normalizePeakHexForTimeline(peakColorHex: string): string {
  const rgb = parseHexToRgb(peakColorHex);
  if (rgb == null) {
    return DEFAULT_TRN_ICON_PULSE_PEAK_COLOR_HEX;
  }
  const s = peakColorHex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) {
    return s.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1] + s[1];
    const g = s[2] + s[2];
    const b = s[3] + s[3];
    return `#${r}${g}${b}`.toLowerCase();
  }
  return DEFAULT_TRN_ICON_PULSE_PEAK_COLOR_HEX;
}

const ANIMATION_EASE: Record<
  SensorTelemetryIconPulseAnimationPreset,
  Pick<TrnIconPulseResolvedTimeline, "peakEase" | "midEase" | "returnEase">
> = {
  smooth: {
    peakEase: "power2.out",
    midEase: "sine.inOut",
    returnEase: "power2.inOut",
  },
  elastic: {
    peakEase: "elastic.out(1,0.35)",
    midEase: "sine.inOut",
    returnEase: "elastic.inOut(1,0.35)",
  },
  back: {
    peakEase: "back.out(1.4)",
    midEase: "sine.inOut",
    returnEase: "back.inOut(1.4)",
  },
  snappy: {
    peakEase: "power3.out",
    midEase: "sine.inOut",
    returnEase: "power3.inOut",
  },
};

export function resolveTrnIconPulseTimeline(
  intensity: TrnIconPulseIntensityPreset,
  peakColorHex: string,
  animationPreset: SensorTelemetryIconPulseAnimationPreset = "smooth",
): TrnIconPulseResolvedTimeline {
  const i = INTENSITY[intensity] ?? INTENSITY.normal;
  const normalizedHex = normalizePeakHexForTimeline(peakColorHex);
  const pulseHue = pulseHueFromPeakHex(normalizedHex);
  const ap = normalizeSensorTelemetryIconPulseAnimationPreset(animationPreset);
  const e = ANIMATION_EASE[ap] ?? ANIMATION_EASE.smooth;
  return {
    pulseHue,
    peakColorCss: normalizedHex,
    peakScale: i.peakScale,
    peakRotation: i.peakRotation,
    midRotation: i.midRotation,
    d1: i.d1,
    d2: i.d2,
    d3: i.d3,
    peakEase: e.peakEase,
    midEase: e.midEase,
    returnEase: e.returnEase,
  };
}

export function toTrnIconPulseIntensityPreset(
  value: string,
  fallback: TrnIconPulseIntensityPreset = "normal",
): TrnIconPulseIntensityPreset {
  if (value === "subtle" || value === "normal" || value === "strong") {
    return value;
  }
  return fallback;
}

export function toTrnIconPulseAnimationPreset(
  value: string,
): SensorTelemetryIconPulseAnimationPreset {
  return normalizeSensorTelemetryIconPulseAnimationPreset(value);
}
