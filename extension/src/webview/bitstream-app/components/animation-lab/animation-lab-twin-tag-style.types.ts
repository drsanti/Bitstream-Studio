import type { CSSProperties } from "react";
import type { AnimationLabTwinCss3dHiresMode } from "./animation-lab-twin-graphics.js";
import { resolveTwinTagGraphicsFromGlobal } from "./animation-lab-twin-graphics.js";
import {
  normalizeTwinTagIconAnimationLevel,
  normalizeTwinTagIconGlyphStyle,
} from "./animation-lab-twin-tag-icons.js";
import { resolveTwinTagPresetDef } from "./animation-lab-twin-tag-presets.js";
import { twinTagHealthShellClass, twinTagHealthWireframeShellClass } from "./animation-lab-twin-health.js";
import type { AnimationLabTwinHealth } from "./digital-twin.types.js";
import type {
  AnimationLabTwinTagIconAnimationLevel,
  AnimationLabTwinTagIconGlyphStyle,
} from "./animation-lab-twin-tag-icons.js";
import type { AnimationLabTwinTagPresetId } from "./animation-lab-twin-tag-presets.js";

/** Shared by every CSS3D tag on this model. */
export type AnimationLabTwinTagGlobalStyle = {
  presetId?: AnimationLabTwinTagPresetId;
  /** Leading subsystem icon on 3D cards (default on). */
  showCardIcon?: boolean;
  iconAnimationLevel?: AnimationLabTwinTagIconAnimationLevel;
  iconGlyphStyle?: AnimationLabTwinTagIconGlyphStyle;
  /** CSS3D label sharpness when zooming (see Graphics tab). */
  css3dHiresMode?: AnimationLabTwinCss3dHiresMode;
  /** Scanline overlay on supported presets. */
  showScanlines?: boolean;
  /** Card panel opacity (0.35–1). */
  tagOpacity?: number;
  /** Antialiased / geometric text (off = raw pixels). */
  crispText?: boolean;
  widthPx?: number;
  minHeightPx?: number;
  worldScale?: number;
  titleFontPx?: number;
  statusFontPx?: number;
  signalFontPx?: number;
};

/** Per-subsystem overrides (title, anchor, colors, visibility). */
export type AnimationLabTwinTagComponentStyle = {
  showCardIcon?: boolean;
  title?: string;
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
  showTopSignal?: boolean;
  visible?: boolean;
  showHealthPill?: boolean;
  useCustomColors?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedTextColor?: string;
};

/** @deprecated Merged shape for persistence migration only. */
export type AnimationLabTwinTagStyle = AnimationLabTwinTagGlobalStyle &
  AnimationLabTwinTagComponentStyle;

export const DEFAULT_TWIN_TAG_WIDTH_PX = 120;
export const DEFAULT_TWIN_TAG_MIN_HEIGHT_PX = 0;
export const DEFAULT_TWIN_TAG_WORLD_SCALE = 0.0028;
export const DEFAULT_TWIN_TAG_TITLE_FONT_PX = 11;
export const DEFAULT_TWIN_TAG_STATUS_FONT_PX = 9;
export const DEFAULT_TWIN_TAG_SIGNAL_FONT_PX = 10;
export const DEFAULT_TWIN_TAG_BORDER_COLOR = "#52525b";
export const DEFAULT_TWIN_TAG_BACKGROUND_COLOR = "rgba(9, 9, 11, 0.82)";
export const DEFAULT_TWIN_TAG_TEXT_COLOR = "#f4f4f5";
export const DEFAULT_TWIN_TAG_MUTED_TEXT_COLOR = "#a1a1aa";

export type AnimationLabTwinTagStyleResolved = {
  title: string;
  widthPx: number;
  minHeightPx: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  worldScale: number;
  showTopSignal: boolean;
  showCardIcon: boolean;
  iconAnimationLevel: AnimationLabTwinTagIconAnimationLevel;
  iconGlyphStyle: AnimationLabTwinTagIconGlyphStyle;
  visible: boolean;
  titleFontPx: number;
  statusFontPx: number;
  signalFontPx: number;
  showHealthPill: boolean;
  useCustomColors: boolean;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
  presetId: AnimationLabTwinTagPresetId;
  css3dHiresMode: AnimationLabTwinCss3dHiresMode;
  css3dHiresScale: number;
  showScanlines: boolean;
  tagOpacity: number;
  crispText: boolean;
};

export function resolveTwinTagGlobalStyle(
  override: AnimationLabTwinTagGlobalStyle | undefined,
): Required<
  Pick<
    AnimationLabTwinTagStyleResolved,
    "widthPx" | "minHeightPx" | "worldScale" | "titleFontPx" | "statusFontPx" | "signalFontPx"
  >
> {
  return {
    widthPx: clampPx(override?.widthPx, 72, 280, DEFAULT_TWIN_TAG_WIDTH_PX),
    minHeightPx: clampPx(override?.minHeightPx, 0, 200, DEFAULT_TWIN_TAG_MIN_HEIGHT_PX),
    worldScale: clampNum(override?.worldScale, 0.001, 0.02, DEFAULT_TWIN_TAG_WORLD_SCALE),
    titleFontPx: clampPx(override?.titleFontPx, 8, 18, DEFAULT_TWIN_TAG_TITLE_FONT_PX),
    statusFontPx: clampPx(override?.statusFontPx, 7, 14, DEFAULT_TWIN_TAG_STATUS_FONT_PX),
    signalFontPx: clampPx(override?.signalFontPx, 7, 14, DEFAULT_TWIN_TAG_SIGNAL_FONT_PX),
  };
}

export function resolveTwinTagStyle(
  componentLabel: string,
  global: AnimationLabTwinTagGlobalStyle | undefined,
  componentOverride: AnimationLabTwinTagComponentStyle | undefined,
): AnimationLabTwinTagStyleResolved {
  const shared = resolveTwinTagGlobalStyle(global);
  const graphics = resolveTwinTagGraphicsFromGlobal(global);
  const title = componentOverride?.title?.trim();
  const preset = resolveTwinTagPresetDef(global);
  return {
    ...shared,
    ...graphics,
    presetId: preset.id,
    title: title != null && title.length > 0 ? title : componentLabel,
    offsetX: finiteOr(componentOverride?.offsetX, 0),
    offsetY: finiteOr(componentOverride?.offsetY, 0),
    offsetZ: finiteOr(componentOverride?.offsetZ, 0),
    showTopSignal: componentOverride?.showTopSignal !== false,
    showCardIcon:
      componentOverride?.showCardIcon !== false && global?.showCardIcon !== false,
    iconAnimationLevel: normalizeTwinTagIconAnimationLevel(global?.iconAnimationLevel),
    iconGlyphStyle: normalizeTwinTagIconGlyphStyle(global?.iconGlyphStyle),
    visible: componentOverride?.visible !== false,
    showHealthPill: componentOverride?.showHealthPill !== false,
    useCustomColors: componentOverride?.useCustomColors === true,
    borderColor: normalizeTwinTagHexColor(
      componentOverride?.borderColor,
      DEFAULT_TWIN_TAG_BORDER_COLOR,
    ),
    backgroundColor: normalizeTwinTagHexColor(
      componentOverride?.backgroundColor,
      DEFAULT_TWIN_TAG_BACKGROUND_COLOR,
    ),
    textColor: normalizeTwinTagHexColor(componentOverride?.textColor, DEFAULT_TWIN_TAG_TEXT_COLOR),
    mutedTextColor: normalizeTwinTagHexColor(
      componentOverride?.mutedTextColor,
      DEFAULT_TWIN_TAG_MUTED_TEXT_COLOR,
    ),
  };
}

export function normalizeTwinTagHexColor(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const h = trimmed.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  if (/^rgba?\(/i.test(trimmed) || /^hsla?\(/i.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

export type TwinTagCardAppearance = {
  className: string;
  style: CSSProperties;
};

export function resolveTwinTagCardAppearance(
  health: AnimationLabTwinHealth,
  tagStyle: AnimationLabTwinTagStyleResolved,
  selected: boolean,
): TwinTagCardAppearance {
  const layout: CSSProperties = {
    width: tagStyle.widthPx,
    minWidth: tagStyle.widthPx,
    maxWidth: tagStyle.widthPx,
    minHeight: tagStyle.minHeightPx > 0 ? tagStyle.minHeightPx : undefined,
    fontSize: tagStyle.titleFontPx,
    color: tagStyle.useCustomColors ? tagStyle.textColor : undefined,
    opacity: tagStyle.tagOpacity,
  };

  const preset = resolveTwinTagPresetDef({ presetId: tagStyle.presetId });
  const healthShell =
    preset.id === "wireframe-outline"
      ? twinTagHealthWireframeShellClass(health)
      : twinTagHealthShellClass(health);
  const shellClass = [
    "animation-lab-twin-css3d-tag pointer-events-auto cursor-pointer select-none overflow-hidden border",
    preset.presetClass,
    tagStyle.crispText
      ? "animation-lab-twin-css3d-tag--crisp-text"
      : "animation-lab-twin-css3d-tag--soft-text",
    tagStyle.useCustomColors
      ? "animation-lab-twin-css3d-tag--health-offline border-zinc-600/40 text-zinc-100"
      : healthShell,
    selected ? "animation-lab-twin-css3d-tag--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (tagStyle.useCustomColors) {
    return {
      className: shellClass,
      style: {
        ...layout,
        borderColor: tagStyle.borderColor,
        backgroundColor: tagStyle.backgroundColor,
        color: tagStyle.textColor,
      },
    };
  }

  return {
    className: shellClass,
    style: layout,
  };
}

export const DEFAULT_TWIN_TAG_GLOBAL_PATCH: AnimationLabTwinTagGlobalStyle = {
  css3dHiresMode: "2",
  showScanlines: true,
  tagOpacity: 1,
  crispText: true,
  showCardIcon: true,
  iconAnimationLevel: "full",
  iconGlyphStyle: "lucide",
  widthPx: DEFAULT_TWIN_TAG_WIDTH_PX,
  minHeightPx: DEFAULT_TWIN_TAG_MIN_HEIGHT_PX,
  worldScale: DEFAULT_TWIN_TAG_WORLD_SCALE,
  titleFontPx: DEFAULT_TWIN_TAG_TITLE_FONT_PX,
  statusFontPx: DEFAULT_TWIN_TAG_STATUS_FONT_PX,
  signalFontPx: DEFAULT_TWIN_TAG_SIGNAL_FONT_PX,
};

export const DEFAULT_TWIN_TAG_COMPONENT_PATCH: AnimationLabTwinTagComponentStyle = {
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  showTopSignal: true,
  showCardIcon: true,
  visible: true,
  title: "",
  showHealthPill: true,
  useCustomColors: false,
  borderColor: DEFAULT_TWIN_TAG_BORDER_COLOR,
  backgroundColor: DEFAULT_TWIN_TAG_BACKGROUND_COLOR,
  textColor: DEFAULT_TWIN_TAG_TEXT_COLOR,
  mutedTextColor: DEFAULT_TWIN_TAG_MUTED_TEXT_COLOR,
};

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clampNum(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function clampPx(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(max, Math.max(min, Math.round(value)));
  }
  return fallback;
}

export function twinTagColorInputValue(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }
  return "#27272a";
}
