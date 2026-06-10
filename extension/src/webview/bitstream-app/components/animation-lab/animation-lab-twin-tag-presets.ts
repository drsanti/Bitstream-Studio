import {
  twinPresetLabelLocalized,
  type AnimationLabTwinLocale,
} from "./animation-lab-twin-i18n.js";
import type { AnimationLabTwinTagIconPlacement } from "./animation-lab-twin-tag-icons.js";
import { TWIN_TAG_DEFAULT_SIZE_SCALE } from "./animation-lab-constants.js";
import type { AnimationLabTwinTagGlobalStyle } from "./animation-lab-twin-tag-style.types.js";

const S = TWIN_TAG_DEFAULT_SIZE_SCALE;

export type AnimationLabTwinTagPresetId =
  | "industrial-hud"
  | "minimal-glass"
  | "bracket-tactical"
  | "compact-chip"
  | "high-contrast"
  | "amber-phosphor"
  | "wireframe-outline";

export type AnimationLabTwinTagPresetLayout = "industrial" | "minimal" | "compact" | "wireframe";

export type AnimationLabTwinTagPresetDef = {
  id: AnimationLabTwinTagPresetId;
  label: string;
  description: string;
  layout: AnimationLabTwinTagPresetLayout;
  /** Extra root classes (paired with animation-lab-twin-css3d-tag.css). */
  presetClass: string;
  /** Where the subsystem icon is drawn on the card. */
  iconPlacement: AnimationLabTwinTagIconPlacement;
  /** Applied when operator picks this preset (merged into global). */
  globalDefaults: Required<
    Pick<
      AnimationLabTwinTagGlobalStyle,
      "widthPx" | "minHeightPx" | "titleFontPx" | "statusFontPx" | "signalFontPx"
    >
  >;
};

export const ANIMATION_LAB_TWIN_TAG_PRESETS: AnimationLabTwinTagPresetDef[] = [
  {
    id: "industrial-hud",
    label: "Industrial HUD",
    description: "Dark glass, health rail, scanlines, mono telemetry",
    layout: "industrial",
    presetClass: "animation-lab-twin-css3d-tag--preset-industrial-hud",
    iconPlacement: "leading",
    globalDefaults: {
      widthPx: 148 * S,
      minHeightPx: 0,
      titleFontPx: 11 * S,
      statusFontPx: 9 * S,
      signalFontPx: 10 * S,
    },
  },
  {
    id: "minimal-glass",
    label: "Minimal glass",
    description: "Frosted panel, soft borders, no scanlines",
    layout: "minimal",
    presetClass: "animation-lab-twin-css3d-tag--preset-minimal-glass",
    iconPlacement: "leading",
    globalDefaults: {
      widthPx: 136 * S,
      minHeightPx: 0,
      titleFontPx: 11 * S,
      statusFontPx: 9 * S,
      signalFontPx: 10 * S,
    },
  },
  {
    id: "bracket-tactical",
    label: "Bracket tactical",
    description: "Cyan bracket frame, ops-console accent",
    layout: "industrial",
    presetClass: "animation-lab-twin-css3d-tag--preset-bracket-tactical",
    iconPlacement: "corner",
    globalDefaults: {
      widthPx: 152 * S,
      minHeightPx: 0,
      titleFontPx: 11 * S,
      statusFontPx: 8 * S,
      signalFontPx: 10 * S,
    },
  },
  {
    id: "compact-chip",
    label: "Compact chip",
    description: "Dense callout for crowded models",
    layout: "compact",
    presetClass: "animation-lab-twin-css3d-tag--preset-compact-chip",
    iconPlacement: "leading",
    globalDefaults: {
      widthPx: 112 * S,
      minHeightPx: 0,
      titleFontPx: 9 * S,
      statusFontPx: 7 * S,
      signalFontPx: 9 * S,
    },
  },
  {
    id: "high-contrast",
    label: "High contrast",
    description: "Bold borders and type for bright booths",
    layout: "industrial",
    presetClass: "animation-lab-twin-css3d-tag--preset-high-contrast",
    iconPlacement: "leading",
    globalDefaults: {
      widthPx: 156 * S,
      minHeightPx: 0,
      titleFontPx: 12 * S,
      statusFontPx: 10 * S,
      signalFontPx: 11 * S,
    },
  },
  {
    id: "amber-phosphor",
    label: "Amber phosphor",
    description: "CRT terminal glow — amber readout on dark glass",
    layout: "industrial",
    presetClass: "animation-lab-twin-css3d-tag--preset-amber-phosphor",
    iconPlacement: "leading",
    globalDefaults: {
      widthPx: 144 * S,
      minHeightPx: 0,
      titleFontPx: 11 * S,
      statusFontPx: 9 * S,
      signalFontPx: 10 * S,
    },
  },
  {
    id: "wireframe-outline",
    label: "Wireframe",
    description: "Outline-only HUD — transparent fill, health-colored border",
    layout: "wireframe",
    presetClass: "animation-lab-twin-css3d-tag--preset-wireframe-outline",
    iconPlacement: "leading",
    globalDefaults: {
      widthPx: 140 * S,
      minHeightPx: 0,
      titleFontPx: 10 * S,
      statusFontPx: 8 * S,
      signalFontPx: 10 * S,
    },
  },
];

const PRESET_BY_ID = new Map(
  ANIMATION_LAB_TWIN_TAG_PRESETS.map((preset) => [preset.id, preset]),
);

export const DEFAULT_TWIN_TAG_PRESET_ID: AnimationLabTwinTagPresetId = "minimal-glass";

export function isAnimationLabTwinTagPresetId(
  value: unknown,
): value is AnimationLabTwinTagPresetId {
  return typeof value === "string" && PRESET_BY_ID.has(value as AnimationLabTwinTagPresetId);
}

export function resolveTwinTagPresetId(
  global: AnimationLabTwinTagGlobalStyle | undefined,
): AnimationLabTwinTagPresetId {
  if (isAnimationLabTwinTagPresetId(global?.presetId)) {
    return global.presetId;
  }
  return DEFAULT_TWIN_TAG_PRESET_ID;
}

export function resolveTwinTagPresetDef(
  global: AnimationLabTwinTagGlobalStyle | undefined,
): AnimationLabTwinTagPresetDef {
  return (
    PRESET_BY_ID.get(resolveTwinTagPresetId(global)) ??
    PRESET_BY_ID.get(DEFAULT_TWIN_TAG_PRESET_ID) ??
    ANIMATION_LAB_TWIN_TAG_PRESETS[0]
  );
}

export function twinTagPresetSelectOptions(
  locale?: AnimationLabTwinLocale,
): Array<{ value: string; label: string }> {
  return ANIMATION_LAB_TWIN_TAG_PRESETS.map((preset) => ({
    value: preset.id,
    label:
      locale != null ? twinPresetLabelLocalized(preset.id, locale) : preset.label,
  }));
}
