import { z } from "zod";

export const INFOGRAPHIC_VISUAL_PRESET_IDS = [
  "abstract",
  "thermometer-mercury",
  "battery-segmented",
  "seven-segment",
  "compass-rose",
  "droplet-fill",
  "manometer-column",
] as const;

export const infographicVisualPresetSchema = z.enum(INFOGRAPHIC_VISUAL_PRESET_IDS);

export type InfographicVisualPresetId = z.infer<typeof infographicVisualPresetSchema>;

export type InfographicValueMode = "ratio" | "angle" | "numeric";

export type InfographicPresetMeta = {
  id: InfographicVisualPresetId;
  label: string;
  description: string;
  valueMode: InfographicValueMode;
};

export const INFOGRAPHIC_PRESET_META: Record<
  Exclude<InfographicVisualPresetId, "abstract">,
  InfographicPresetMeta
> = {
  "thermometer-mercury": {
    id: "thermometer-mercury",
    label: "Mercury thermometer",
    description: "Vertical temperature tube with bulb",
    valueMode: "ratio",
  },
  "battery-segmented": {
    id: "battery-segmented",
    label: "Battery segments",
    description: "Horizontal segmented charge icon",
    valueMode: "ratio",
  },
  "seven-segment": {
    id: "seven-segment",
    label: "7-segment display",
    description: "Industrial numeric readout",
    valueMode: "numeric",
  },
  "compass-rose": {
    id: "compass-rose",
    label: "Compass rose",
    description: "Heading needle on cardinal rose",
    valueMode: "angle",
  },
  "droplet-fill": {
    id: "droplet-fill",
    label: "Droplet fill",
    description: "Humidity droplet level meter",
    valueMode: "ratio",
  },
  "manometer-column": {
    id: "manometer-column",
    label: "Manometer column",
    description: "Vertical pressure column",
    valueMode: "ratio",
  },
};

export const INFOGRAPHIC_PRESET_OPTIONS = Object.values(INFOGRAPHIC_PRESET_META).map((meta) => ({
  value: meta.id,
  label: meta.label,
}));

export function isInfographicVisualPreset(
  value: unknown,
): value is InfographicVisualPresetId {
  return (
    typeof value === "string" &&
    (INFOGRAPHIC_VISUAL_PRESET_IDS as readonly string[]).includes(value)
  );
}

export function coerceInfographicVisualPreset(
  value: unknown,
  fallback: InfographicVisualPresetId = "abstract",
): InfographicVisualPresetId {
  return isInfographicVisualPreset(value) ? value : fallback;
}

export function isActiveInfographicPreset(
  preset: InfographicVisualPresetId | undefined,
): preset is Exclude<InfographicVisualPresetId, "abstract"> {
  return preset != null && preset !== "abstract";
}

export function resolveInfographicValueMode(
  preset: InfographicVisualPresetId,
): InfographicValueMode {
  if (preset === "abstract") {
    return "ratio";
  }
  return INFOGRAPHIC_PRESET_META[preset].valueMode;
}

/** Suggest a skin from catalog binding path (inspector hint / default on bind). */
export function suggestInfographicPresetFromPath(path: string): InfographicVisualPresetId | undefined {
  const normalized = path.trim().toLowerCase();
  if (normalized.length === 0) {
    return undefined;
  }
  if (/temp|°c|celsius|fahrenheit/.test(normalized)) {
    return "thermometer-mercury";
  }
  if (/\.rh|humidity|relative/.test(normalized)) {
    return "droplet-fill";
  }
  if (/pressure|hpa|baro|altitude/.test(normalized)) {
    return "manometer-column";
  }
  if (/heading|yaw|compass/.test(normalized)) {
    return "compass-rose";
  }
  if (/soc|battery|charge/.test(normalized)) {
    return "battery-segmented";
  }
  if (/quat|euler|qw|qx|pitch|roll/.test(normalized)) {
    return "seven-segment";
  }
  return undefined;
}

export const INFOGRAPHIC_SKIN_DEFAULTS = {
  fillSmoothingMs: 150,
  tubeWidthPercent: 18,
  bulbSizePercent: 28,
  segmentCount: 5,
  trackWidthPercent: 16,
  showScaleTicks: true,
  roseStyle: "aviation" as const,
  showCardinals: true,
  showDigitalHeading: true,
} as const;

export type InfographicSkinConfig = {
  fillSmoothingMs: number;
  tubeWidthPercent: number;
  bulbSizePercent: number;
  segmentCount: number;
  trackWidthPercent: number;
  showScaleTicks: boolean;
  roseStyle: "aviation" | "minimal";
  showCardinals: boolean;
  showDigitalHeading: boolean;
  fillColor?: string;
  trackColor?: string;
  needleColor?: string;
};

export function readInfographicSkinConfig(
  source: Record<string, unknown> | undefined,
): InfographicSkinConfig {
  const style = source ?? {};
  return {
    fillSmoothingMs:
      typeof style.fillSmoothingMs === "number"
        ? Math.max(0, Math.min(5000, Math.round(style.fillSmoothingMs)))
        : INFOGRAPHIC_SKIN_DEFAULTS.fillSmoothingMs,
    tubeWidthPercent:
      typeof style.tubeWidthPercent === "number"
        ? Math.max(10, Math.min(32, Math.round(style.tubeWidthPercent)))
        : INFOGRAPHIC_SKIN_DEFAULTS.tubeWidthPercent,
    bulbSizePercent:
      typeof style.bulbSizePercent === "number"
        ? Math.max(18, Math.min(40, Math.round(style.bulbSizePercent)))
        : INFOGRAPHIC_SKIN_DEFAULTS.bulbSizePercent,
    segmentCount:
      typeof style.segmentCount === "number"
        ? Math.max(3, Math.min(8, Math.round(style.segmentCount)))
        : INFOGRAPHIC_SKIN_DEFAULTS.segmentCount,
    trackWidthPercent:
      typeof style.trackWidthPercent === "number"
        ? Math.max(10, Math.min(36, Math.round(style.trackWidthPercent)))
        : INFOGRAPHIC_SKIN_DEFAULTS.trackWidthPercent,
    showScaleTicks:
      typeof style.showScaleTicks === "boolean"
        ? style.showScaleTicks
        : INFOGRAPHIC_SKIN_DEFAULTS.showScaleTicks,
    roseStyle: style.roseStyle === "minimal" ? "minimal" : "aviation",
    showCardinals:
      typeof style.showCardinals === "boolean"
        ? style.showCardinals
        : INFOGRAPHIC_SKIN_DEFAULTS.showCardinals,
    showDigitalHeading:
      typeof style.showDigitalHeading === "boolean"
        ? style.showDigitalHeading
        : INFOGRAPHIC_SKIN_DEFAULTS.showDigitalHeading,
    fillColor: typeof style.fillColor === "string" ? style.fillColor : undefined,
    trackColor: typeof style.trackColor === "string" ? style.trackColor : undefined,
    needleColor: typeof style.needleColor === "string" ? style.needleColor : undefined,
  };
}
