import { ANIMATION_LAB_STORAGE_PREFIX } from "./animation-lab-constants.js";
import type {
  AnimationLabTwinTagComponentStyle,
  AnimationLabTwinTagGlobalStyle,
  AnimationLabTwinTagStyle,
} from "./animation-lab-twin-tag-style.types.js";

export type AnimationLabTwinTagStylesSnapshot = {
  global: AnimationLabTwinTagGlobalStyle;
  byComponent: Record<string, AnimationLabTwinTagComponentStyle>;
};

const GLOBAL_FIELD_KEYS = new Set([
  "presetId",
  "showCardIcon",
  "iconAnimationLevel",
  "iconGlyphStyle",
  "css3dHiresMode",
  "showScanlines",
  "tagOpacity",
  "crispText",
  "widthPx",
  "minHeightPx",
  "worldScale",
  "titleFontPx",
  "statusFontPx",
  "signalFontPx",
]);

function storageKey(scopeKey: string): string {
  const safe = scopeKey.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return `${ANIMATION_LAB_STORAGE_PREFIX}:twin-tag-styles:${safe}`;
}

function isV2Snapshot(raw: Record<string, unknown>): boolean {
  return "global" in raw || "byComponent" in raw;
}

function pickGlobalFields(style: AnimationLabTwinTagStyle): AnimationLabTwinTagGlobalStyle {
  const global: AnimationLabTwinTagGlobalStyle = {};
  if (style.presetId != null) {
    global.presetId = style.presetId;
  }
  if (style.showCardIcon != null) {
    global.showCardIcon = style.showCardIcon;
  }
  if (style.iconAnimationLevel != null) {
    global.iconAnimationLevel = style.iconAnimationLevel;
  }
  if (style.iconGlyphStyle != null) {
    global.iconGlyphStyle = style.iconGlyphStyle;
  }
  if (style.css3dHiresMode != null) {
    global.css3dHiresMode = style.css3dHiresMode;
  }
  if (style.showScanlines != null) {
    global.showScanlines = style.showScanlines;
  }
  if (style.tagOpacity != null) {
    global.tagOpacity = style.tagOpacity;
  }
  if (style.crispText != null) {
    global.crispText = style.crispText;
  }
  if (style.widthPx != null) {
    global.widthPx = style.widthPx;
  }
  if (style.minHeightPx != null) {
    global.minHeightPx = style.minHeightPx;
  }
  if (style.worldScale != null) {
    global.worldScale = style.worldScale;
  }
  if (style.titleFontPx != null) {
    global.titleFontPx = style.titleFontPx;
  }
  if (style.statusFontPx != null) {
    global.statusFontPx = style.statusFontPx;
  }
  if (style.signalFontPx != null) {
    global.signalFontPx = style.signalFontPx;
  }
  return global;
}

function pickComponentFields(style: AnimationLabTwinTagStyle): AnimationLabTwinTagComponentStyle {
  const component: AnimationLabTwinTagComponentStyle = {};
  for (const [key, value] of Object.entries(style)) {
    if (GLOBAL_FIELD_KEYS.has(key)) {
      continue;
    }
    (component as Record<string, unknown>)[key] = value;
  }
  return component;
}

function migrateV1FlatMap(flat: Record<string, AnimationLabTwinTagStyle>): AnimationLabTwinTagStylesSnapshot {
  const byComponent: Record<string, AnimationLabTwinTagComponentStyle> = {};
  let global: AnimationLabTwinTagGlobalStyle = {};
  for (const [id, style] of Object.entries(flat)) {
    if (Object.keys(global).length === 0) {
      global = pickGlobalFields(style);
    }
    const componentOnly = pickComponentFields(style);
    if (Object.keys(componentOnly).length > 0) {
      byComponent[id] = componentOnly;
    }
  }
  return { global, byComponent };
}

export function readAnimationLabTwinTagStyles(scopeKey: string): AnimationLabTwinTagStylesSnapshot {
  if (typeof window === "undefined" || scopeKey.length === 0) {
    return { global: {}, byComponent: {} };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(scopeKey));
    if (raw == null || raw.length === 0) {
      return { global: {}, byComponent: {} };
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { global: {}, byComponent: {} };
    }
    const record = parsed as Record<string, unknown>;
    if (isV2Snapshot(record)) {
      return {
        global: (record.global as AnimationLabTwinTagGlobalStyle) ?? {},
        byComponent: (record.byComponent as Record<string, AnimationLabTwinTagComponentStyle>) ?? {},
      };
    }
    return migrateV1FlatMap(record as Record<string, AnimationLabTwinTagStyle>);
  } catch {
    return { global: {}, byComponent: {} };
  }
}

export function persistAnimationLabTwinTagStyles(
  scopeKey: string,
  snapshot: AnimationLabTwinTagStylesSnapshot,
): void {
  if (typeof window === "undefined" || scopeKey.length === 0) {
    return;
  }
  try {
    window.localStorage.setItem(storageKey(scopeKey), JSON.stringify(snapshot));
  } catch {
    // ignore quota
  }
}
