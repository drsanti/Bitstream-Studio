import { z } from "zod";
import {
  gaugeZoneColor,
  gaugeZonesFromPreset,
  type GaugeZonePresetId,
} from "../../../../sensor-studio/features/editor/nodes/display/gauge-display-config";

export const heroRadialGaugeArcPresetSchema = z.enum(["hero140", "semicircle", "wide"]);

export type HeroRadialGaugeArcPresetId = z.infer<typeof heroRadialGaugeArcPresetSchema>;

export const heroRadialGaugeZoneTintSchema = z.enum(["off", "traffic", "cold-hot"]);

export type HeroRadialGaugeZoneTintId = z.infer<typeof heroRadialGaugeZoneTintSchema>;

export const heroRadialGaugeArcCapSchema = z.enum(["round", "butt"]);

export type HeroRadialGaugeArcCapId = z.infer<typeof heroRadialGaugeArcCapSchema>;

export const HERO_RADIAL_GAUGE_ARC_PRESET_OPTIONS: ReadonlyArray<{
  id: HeroRadialGaugeArcPresetId;
  label: string;
  hint: string;
}> = [
  {
    id: "hero140",
    label: "140° hero",
    hint: "Default EV dashboard sweep — compact focal arc.",
  },
  {
    id: "semicircle",
    label: "180° semicircle",
    hint: "Flat-bottom arc for speedometer-style readouts.",
  },
  {
    id: "wide",
    label: "200° wide",
    hint: "Extra sweep for dense numeric values in a 3×3 cell.",
  },
];

export const HERO_RADIAL_GAUGE_ZONE_TINT_OPTIONS: ReadonlyArray<{
  id: HeroRadialGaugeZoneTintId;
  label: string;
  hint: string;
}> = [
  {
    id: "off",
    label: "Off",
    hint: "Use board theme arc colors.",
  },
  {
    id: "traffic",
    label: "Traffic light",
    hint: "Tint the arc tip cyan → amber → red across the scale.",
  },
  {
    id: "cold-hot",
    label: "Cold → hot",
    hint: "Tint the arc tip blue → amber → red across the scale.",
  },
];

export const HERO_RADIAL_GAUGE_ARC_CAP_OPTIONS: ReadonlyArray<{
  id: HeroRadialGaugeArcCapId;
  label: string;
  hint: string;
}> = [
  {
    id: "round",
    label: "Round",
    hint: "Rounded cap at the live arc tip.",
  },
  {
    id: "butt",
    label: "Butt",
    hint: "Flat cut at the arc tip.",
  },
];

export const HERO_RADIAL_GAUGE_DEFAULTS = {
  heroArcPreset: "hero140" as const,
  showValue: true,
  showUnit: true,
  fillSmoothingMs: 0,
  holeSizePercent: 10,
  zoneTint: "off" as const,
  showGlow: false,
  arcCap: "round" as const,
};

export function heroRadialGaugeArcGeometry(preset: HeroRadialGaugeArcPresetId): {
  startDeg: number;
  sweepDeg: number;
} {
  switch (preset) {
    case "semicircle":
      return { startDeg: 180, sweepDeg: 180 };
    case "wide":
      return { startDeg: 210, sweepDeg: 200 };
    default:
      return { startDeg: 225, sweepDeg: 140 };
  }
}

export function heroGaugeArcEndDeg(
  fillRatio: number,
  preset: HeroRadialGaugeArcPresetId,
): number {
  const { startDeg, sweepDeg } = heroRadialGaugeArcGeometry(preset);
  return startDeg + Math.max(0, Math.min(1, fillRatio)) * sweepDeg;
}

export function coerceHeroRadialGaugeArcPreset(raw: unknown): HeroRadialGaugeArcPresetId {
  if (raw === "semicircle" || raw === "wide" || raw === "hero140") {
    return raw;
  }
  return HERO_RADIAL_GAUGE_DEFAULTS.heroArcPreset;
}

export function coerceHeroRadialGaugeZoneTint(raw: unknown): HeroRadialGaugeZoneTintId {
  if (raw === "traffic" || raw === "cold-hot" || raw === "off") {
    return raw;
  }
  return HERO_RADIAL_GAUGE_DEFAULTS.zoneTint;
}

export function coerceHeroRadialGaugeArcCap(raw: unknown): HeroRadialGaugeArcCapId {
  if (raw === "round" || raw === "butt") {
    return raw;
  }
  return HERO_RADIAL_GAUGE_DEFAULTS.arcCap;
}

const THEME_ARC_TO = "var(--course-wb-gauge-arc-to)";
const THEME_ARC_VIA = "var(--course-wb-gauge-arc-via, var(--course-wb-gauge-arc-to))";

export function resolveHeroGaugeArcToColor(options: {
  zoneTint: HeroRadialGaugeZoneTintId;
  value: number | null;
  min: number;
  max: number;
}): string {
  const { zoneTint, value, min, max } = options;
  if (zoneTint === "off" || value == null || !Number.isFinite(value)) {
    return THEME_ARC_TO;
  }
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const clamped = Math.max(lo, Math.min(hi, value));
  const zones = gaugeZonesFromPreset(zoneTint as GaugeZonePresetId, lo, hi);
  return gaugeZoneColor(zones, clamped, "#22d3ee");
}

export function heroGaugeConicBackground(
  fillRatio: number,
  preset: HeroRadialGaugeArcPresetId,
  options?: {
    arcToColor?: string;
    arcCap?: HeroRadialGaugeArcCapId;
  },
): string {
  const { startDeg, sweepDeg } = heroRadialGaugeArcGeometry(preset);
  const activeDeg = Math.max(0, Math.min(1, fillRatio)) * sweepDeg;
  const arcTo = options?.arcToColor ?? THEME_ARC_TO;
  const arcVia = options?.arcToColor != null && options.arcToColor !== THEME_ARC_TO ? arcTo : THEME_ARC_VIA;
  // Round tips use a sized overlay cap in CourseHeroRadialGauge; keep the inactive wedge tight.
  const inactiveGap = 0.5;
  const inactiveStart = activeDeg + inactiveGap;
  const inactiveEnd = sweepDeg + 1;
  return `conic-gradient(from ${startDeg}deg, var(--course-wb-gauge-arc-from) 0deg, ${arcVia} ${activeDeg * 0.55}deg, ${arcTo} ${activeDeg}deg, rgba(255,255,255,0.08) ${inactiveStart}deg, transparent ${inactiveEnd}deg)`;
}
