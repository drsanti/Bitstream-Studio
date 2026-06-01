import type { StudioGlbAnimationPlaybackModeV1 } from "../../../sensor-studio/features/editor/gltf/studio-glb-animation-playback-mode.js";
import {
  readAnimationLabPlaybackMode,
  readAnimationLabSoloCrossFadeS,
} from "./animation-lab-persistence.js";

const STORAGE_KEY = "bitstream:studio-glb-preview-defaults-from-lab";

export type StudioGlbPreviewDefaultsFromLab = {
  animationPlaybackMode: StudioGlbAnimationPlaybackModeV1;
  animationCrossfadeS: number;
  /** Optional solo clip ref for new GLB Animation Bundle nodes (`animationSoloClipRef`). */
  defaultSoloClipRef?: string;
  updatedAtMs: number;
};

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

export function readStudioGlbPreviewDefaultsFromLab(): StudioGlbPreviewDefaultsFromLab | null {
  const raw = readRaw(STORAGE_KEY);
  if (raw == null || raw.length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StudioGlbPreviewDefaultsFromLab;
    if (parsed == null || typeof parsed !== "object") {
      return null;
    }
    const mode = parsed.animationPlaybackMode;
    if (mode !== "per-clip" && mode !== "parallel-all" && mode !== "sequence") {
      return null;
    }
    const cross = Number(parsed.animationCrossfadeS);
    return {
      animationPlaybackMode: mode,
      animationCrossfadeS: Number.isFinite(cross) && cross >= 0 ? Math.min(2, cross) : 0.15,
      defaultSoloClipRef:
        typeof parsed.defaultSoloClipRef === "string" && parsed.defaultSoloClipRef.trim().length > 0
          ? parsed.defaultSoloClipRef.trim()
          : undefined,
      updatedAtMs:
        typeof parsed.updatedAtMs === "number" && Number.isFinite(parsed.updatedAtMs)
          ? parsed.updatedAtMs
          : Date.now(),
    };
  } catch {
    return null;
  }
}

/** Snapshot current Animation Lab persistence + optional active clip into Studio spawn defaults. */
export function persistStudioGlbPreviewDefaultsFromLab(args?: {
  defaultSoloClipRef?: string | null;
}): StudioGlbPreviewDefaultsFromLab {
  const snapshot: StudioGlbPreviewDefaultsFromLab = {
    animationPlaybackMode: readAnimationLabPlaybackMode(),
    animationCrossfadeS: readAnimationLabSoloCrossFadeS(),
    defaultSoloClipRef:
      args?.defaultSoloClipRef != null && args.defaultSoloClipRef.trim().length > 0
        ? args.defaultSoloClipRef.trim()
        : undefined,
    updatedAtMs: Date.now(),
  };
  writeRaw(STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

/** Merge saved lab defaults into a new `glb-animation-bundle` node `defaultConfig`. */
export function mergeLabDefaultsIntoGlbAnimationBundleConfig(
  base: Record<string, unknown>,
): Record<string, unknown> {
  const saved = readStudioGlbPreviewDefaultsFromLab();
  if (saved == null) {
    return base;
  }
  const next: Record<string, unknown> = {
    ...base,
    animationPlaybackMode: saved.animationPlaybackMode,
    animationCrossfadeS: saved.animationCrossfadeS,
  };
  if (saved.defaultSoloClipRef != null) {
    next.animationSoloClipRef = saved.defaultSoloClipRef;
  }
  return next;
}
