import {
  ANIMATION_LAB_DEFAULT_MODEL_ID,
  ANIMATION_LAB_STORAGE_PREFIX,
} from "./animation-lab-constants.js";
import type {
  GlbAnimationLabMixerEngine,
  GlbAnimationLabPlaybackMode,
} from "./glb-animation-lab.types.js";
import { isStudioGlbAnimationPlaybackModeV1 } from "../../../sensor-studio/features/editor/gltf/studio-glb-animation-playback-mode.js";

function readRaw(key: string): string | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

const KEYS = {
  modelId: `${ANIMATION_LAB_STORAGE_PREFIX}:model-id`,
  playbackMode: `${ANIMATION_LAB_STORAGE_PREFIX}:playback-mode`,
  showGrid: `${ANIMATION_LAB_STORAGE_PREFIX}:show-grid`,
  mixerEngine: `${ANIMATION_LAB_STORAGE_PREFIX}:mixer-engine`,
  soloCrossFadeS: `${ANIMATION_LAB_STORAGE_PREFIX}:solo-cross-fade-s`,
  showTwinTags: `${ANIMATION_LAB_STORAGE_PREFIX}:twin-tags-visible`,
  twinTagsFaultsOnly: `${ANIMATION_LAB_STORAGE_PREFIX}:twin-tags-alerts-only`,
  inspectorPanelWidthPx: `${ANIMATION_LAB_STORAGE_PREFIX}:inspector-panel-width-px`,
} as const;

const INSPECTOR_PANEL_WIDTH_DEFAULT_PX = 320;
const INSPECTOR_PANEL_WIDTH_MIN_PX = 280;
const INSPECTOR_PANEL_WIDTH_MAX_PX = 560;

export function readAnimationLabModelId(): string {
  const raw = readRaw(KEYS.modelId);
  return raw != null && raw.length > 0 ? raw : ANIMATION_LAB_DEFAULT_MODEL_ID;
}

export function persistAnimationLabModelId(id: string): void {
  writeRaw(KEYS.modelId, id);
}

export function readAnimationLabPlaybackMode(): GlbAnimationLabPlaybackMode {
  const raw = readRaw(KEYS.playbackMode);
  if (raw === "solo") {
    return "per-clip";
  }
  if (isStudioGlbAnimationPlaybackModeV1(raw)) {
    return raw;
  }
  return "per-clip";
}

export function persistAnimationLabPlaybackMode(mode: GlbAnimationLabPlaybackMode): void {
  writeRaw(KEYS.playbackMode, mode);
}

export function readAnimationLabMixerEngine(): GlbAnimationLabMixerEngine {
  const raw = readRaw(KEYS.mixerEngine);
  return raw === "legacy" ? "legacy" : "studio";
}

export function persistAnimationLabMixerEngine(engine: GlbAnimationLabMixerEngine): void {
  writeRaw(KEYS.mixerEngine, engine);
}

export function readAnimationLabSoloCrossFadeS(): number {
  const raw = readRaw(KEYS.soloCrossFadeS);
  if (raw == null) {
    return 0.15;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.min(2, n) : 0.15;
}

export function persistAnimationLabSoloCrossFadeS(seconds: number): void {
  writeRaw(KEYS.soloCrossFadeS, String(seconds));
}

export function readAnimationLabShowGrid(): boolean {
  return readRaw(KEYS.showGrid) !== "0";
}

export function persistAnimationLabShowGrid(show: boolean): void {
  writeRaw(KEYS.showGrid, show ? "1" : "0");
}

export function readAnimationLabShowTwinTags(): boolean | null {
  const raw = readRaw(KEYS.showTwinTags);
  if (raw === "1") {
    return true;
  }
  if (raw === "0") {
    return false;
  }
  return null;
}

export function persistAnimationLabShowTwinTags(show: boolean): void {
  writeRaw(KEYS.showTwinTags, show ? "1" : "0");
}

export function readAnimationLabTwinTagsFaultsOnly(): boolean | null {
  const raw = readRaw(KEYS.twinTagsFaultsOnly);
  if (raw === "1") {
    return true;
  }
  if (raw === "0") {
    return false;
  }
  return null;
}

export function persistAnimationLabTwinTagsFaultsOnly(faultsOnly: boolean): void {
  writeRaw(KEYS.twinTagsFaultsOnly, faultsOnly ? "1" : "0");
}

export function readAnimationLabInspectorPanelWidthPx(): number {
  const raw = readRaw(KEYS.inspectorPanelWidthPx);
  if (raw == null) {
    return INSPECTOR_PANEL_WIDTH_DEFAULT_PX;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return INSPECTOR_PANEL_WIDTH_DEFAULT_PX;
  }
  return Math.min(
    INSPECTOR_PANEL_WIDTH_MAX_PX,
    Math.max(INSPECTOR_PANEL_WIDTH_MIN_PX, Math.round(n)),
  );
}

export function persistAnimationLabInspectorPanelWidthPx(widthPx: number): void {
  const clamped = Math.min(
    INSPECTOR_PANEL_WIDTH_MAX_PX,
    Math.max(INSPECTOR_PANEL_WIDTH_MIN_PX, Math.round(widthPx)),
  );
  writeRaw(KEYS.inspectorPanelWidthPx, String(clamped));
}
