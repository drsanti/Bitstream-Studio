import { TWIN_TAG_CSS3D_HIRES_SCALE } from "./animation-lab-constants.js";
import type { AnimationLabTwinTagGlobalStyle } from "./animation-lab-twin-tag-style.types.js";
import type { AnimationLabTwinTagPresetId } from "./animation-lab-twin-tag-presets.js";

export type AnimationLabTwinCss3dHiresMode = "auto" | "1" | "1.5" | "2" | "2.5" | "3";

const HIRES_MODES = new Set<string>(["auto", "1", "1.5", "2", "2.5", "3"]);

export function isAnimationLabTwinCss3dHiresMode(
  value: unknown,
): value is AnimationLabTwinCss3dHiresMode {
  return typeof value === "string" && HIRES_MODES.has(value);
}

export function normalizeTwinTagCss3dHiresMode(
  value: unknown,
): AnimationLabTwinCss3dHiresMode {
  return isAnimationLabTwinCss3dHiresMode(value) ? value : "2";
}

export const TWIN_TAG_CSS3D_HIRES_SELECT_OPTIONS: ReadonlyArray<{
  value: AnimationLabTwinCss3dHiresMode;
  label: string;
}> = [
  { value: "auto", label: "Auto (display DPR, max 2.5×)" },
  { value: "1", label: "1× — performance" },
  { value: "1.5", label: "1.5×" },
  { value: "2", label: "2× — balanced (default)" },
  { value: "2.5", label: "2.5× — sharp zoom" },
  { value: "3", label: "3× — maximum sharpness" },
];

export function resolveCss3dHiresScale(mode: AnimationLabTwinCss3dHiresMode | undefined): number {
  const normalized = normalizeTwinTagCss3dHiresMode(mode);
  if (normalized === "auto") {
    if (typeof window === "undefined") {
      return TWIN_TAG_CSS3D_HIRES_SCALE;
    }
    const dpr = window.devicePixelRatio;
    if (!Number.isFinite(dpr) || dpr <= 1) {
      return 1.5;
    }
    return Math.min(2.5, Math.max(1.25, dpr));
  }
  return Number.parseFloat(normalized);
}

export function twinTagPresetSupportsScanlines(presetId: AnimationLabTwinTagPresetId): boolean {
  return (
    presetId === "industrial-hud" ||
    presetId === "bracket-tactical" ||
    presetId === "high-contrast" ||
    presetId === "amber-phosphor"
  );
}

export function resolveTwinTagGraphicsFromGlobal(
  global: AnimationLabTwinTagGlobalStyle | undefined,
): {
  css3dHiresMode: AnimationLabTwinCss3dHiresMode;
  css3dHiresScale: number;
  showScanlines: boolean;
  tagOpacity: number;
  crispText: boolean;
} {
  return {
    css3dHiresMode: normalizeTwinTagCss3dHiresMode(global?.css3dHiresMode),
    css3dHiresScale: resolveCss3dHiresScale(global?.css3dHiresMode),
    showScanlines: global?.showScanlines !== false,
    tagOpacity: clampOpacity(global?.tagOpacity, 1),
    crispText: global?.crispText !== false,
  };
}

function clampOpacity(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0.35, value));
}
