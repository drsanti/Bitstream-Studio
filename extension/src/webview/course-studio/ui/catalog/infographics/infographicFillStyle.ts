import type { InfographicVisualPresetId } from "./infographicVisualPreset";
import type { InfographicSkinConfig } from "./infographicVisualPreset";

export type InfographicFillGradientStops = {
  from: string;
  mid?: string;
  to: string;
};

export const INFOGRAPHIC_THERMAL_GRADIENT: InfographicFillGradientStops = {
  from: "#fbbf24",
  mid: "#f97316",
  to: "#ef4444",
};

export const INFOGRAPHIC_HUMIDITY_GRADIENT: InfographicFillGradientStops = {
  from: "#22d3ee",
  mid: "#3b82f6",
  to: "#f5f5f5",
};

export const INFOGRAPHIC_TOP_RIGHT_READOUT = {
  readoutCrossAlign: "end",
  readoutJustify: "end",
} as const;

function readGradientStop(style: Record<string, unknown>, key: string): string | undefined {
  const value = style[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function resolveInfographicFillGradientStops(
  config: InfographicSkinConfig,
  preset: Exclude<InfographicVisualPresetId, "abstract">,
  styleSource?: Record<string, unknown>,
): InfographicFillGradientStops {
  const style = styleSource ?? {};
  const from =
    readGradientStop(style, "fillGradientFrom") ??
    (preset === "droplet-fill"
      ? INFOGRAPHIC_HUMIDITY_GRADIENT.from
      : preset === "thermometer-mercury"
        ? INFOGRAPHIC_THERMAL_GRADIENT.from
        : config.fillColor ?? INFOGRAPHIC_THERMAL_GRADIENT.from);
  const mid =
    readGradientStop(style, "fillGradientMid") ??
    (preset === "droplet-fill"
      ? INFOGRAPHIC_HUMIDITY_GRADIENT.mid
      : preset === "thermometer-mercury"
        ? INFOGRAPHIC_THERMAL_GRADIENT.mid
        : undefined);
  const to =
    readGradientStop(style, "fillGradientTo") ??
    (preset === "droplet-fill"
      ? INFOGRAPHIC_HUMIDITY_GRADIENT.to
      : preset === "thermometer-mercury"
        ? INFOGRAPHIC_THERMAL_GRADIENT.to
        : config.fillColor ?? INFOGRAPHIC_THERMAL_GRADIENT.to);

  return { from, mid, to };
}

/** CSS linear gradient along the fill axis (bottom = cool/low stop, top = hot/high stop). */
export function infographicFillCssGradient(
  stops: InfographicFillGradientStops,
  direction: "to top" | "to bottom" = "to top",
): string {
  if (stops.mid != null) {
    return `linear-gradient(${direction}, ${stops.from}, ${stops.mid}, ${stops.to})`;
  }
  return `linear-gradient(${direction}, ${stops.from}, ${stops.to})`;
}

/** Bulb / accent color at the current fill level (warmer or lighter as ratio rises). */
export function infographicFillAccentColor(
  stops: InfographicFillGradientStops,
  ratio: number,
): string {
  const t = Math.max(0, Math.min(1, ratio));
  if (t >= 0.66) {
    return stops.to;
  }
  if (t >= 0.33 && stops.mid != null) {
    return stops.mid;
  }
  return stops.from;
}
