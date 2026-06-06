import { joinAssetBase } from "../../../asset-source-strategy";
import {
  resolveVisionMediapipePackAssetUrl,
  resolveVisionMediapipeWasmBaseUrl,
} from "./vision-mediapipe-url-resolver";

const STORAGE_KEY = "trn_vision_mediapipe_endpoints_v1";

export const PREFER_BUNDLED_MEDIAPIPE_STORAGE_KEY = "trn_vision_prefer_bundled_mediapipe";

/** Path segment under `out/webview/assets/` after `viteStaticCopy` (also under dev `__extension_src_assets/`). */
export const VISION_MEDIAPIPE_BUNDLED_REL = "vision/mediapipe/";

/** @deprecated Use {@link resolveBundledMediapipeRoot} — dev-only HTTP prefix for docs/tests. */
export const VISION_MEDIAPIPE_BUNDLED_DEV_PREFIX = "/__extension_src_assets/vision/mediapipe/";

/** @deprecated Use {@link resolveBundledMediapipeRoot} — relative layout under `assets/` for docs/tests. */
export const VISION_MEDIAPIPE_BUNDLED_PROD_PREFIX = "/assets/vision/mediapipe/";

export type VisionMediapipeEndpoints = {
  wasmBase: string;
  poseLiteUrl: string;
  poseFullUrl: string;
  poseHeavyUrl: string;
  handUrl: string;
  faceUrl: string;
  objectUrl: string;
};

export const DEFAULT_VISION_MEDIAPIPE_ENDPOINTS: VisionMediapipeEndpoints = {
  wasmBase: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
  poseLiteUrl:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  poseFullUrl:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  poseHeavyUrl:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
  handUrl:
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  faceUrl:
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  objectUrl:
    "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
};

function isViteDevWebview(): boolean {
  return typeof import.meta !== "undefined" && import.meta.env?.DEV === true;
}

function webviewOriginRoot(): string {
  const base = import.meta.env?.BASE_URL ?? "./";
  if (typeof window === "undefined") {
    return base.endsWith("/") ? base : `${base}/`;
  }
  const root = new URL(base, window.location.href);
  return root.href.endsWith("/") ? root.href : `${root.href}/`;
}

/**
 * Resolve bundled MediaPipe root URL for dev, built webview, and VSIX.
 *
 * VS Code webviews inject `window.LOCAL_ASSETS_BASE_URI` (`asWebviewUri` → `out/webview/assets`).
 * Absolute `/assets/...` against `window.location.origin` returns 401 in the webview — always
 * prefer injected bases (same pattern as Jolt and `resolveVehicleEngineSoundUrl`).
 */
export function resolveBundledMediapipeRoot(): string {
  if (typeof window !== "undefined") {
    const local = window.LOCAL_ASSETS_BASE_URI?.trim();
    if (local) {
      return joinAssetBase(local, VISION_MEDIAPIPE_BUNDLED_REL);
    }
  }

  if (isViteDevWebview() && typeof window !== "undefined") {
    return new URL(
      `__extension_src_assets/${VISION_MEDIAPIPE_BUNDLED_REL}`,
      webviewOriginRoot(),
    ).href;
  }

  if (typeof window === "undefined") {
    return VISION_MEDIAPIPE_BUNDLED_PROD_PREFIX;
  }

  return new URL(`assets/${VISION_MEDIAPIPE_BUNDLED_REL}`, webviewOriginRoot()).href;
}

/** @deprecated Prefer {@link resolveBundledMediapipeRoot}. */
export function bundledMediapipeRootPrefix(): string {
  return isViteDevWebview()
    ? VISION_MEDIAPIPE_BUNDLED_DEV_PREFIX
    : VISION_MEDIAPIPE_BUNDLED_PROD_PREFIX;
}

export function bundledVisionMediapipeEndpoints(): VisionMediapipeEndpoints {
  return {
    wasmBase: resolveVisionMediapipeWasmBaseUrl(),
    poseLiteUrl: resolveVisionMediapipePackAssetUrl("pose_landmarker_lite.task"),
    poseFullUrl: resolveVisionMediapipePackAssetUrl("pose_landmarker_full.task"),
    poseHeavyUrl: resolveVisionMediapipePackAssetUrl("pose_landmarker_heavy.task"),
    handUrl: resolveVisionMediapipePackAssetUrl("hand_landmarker.task"),
    faceUrl: resolveVisionMediapipePackAssetUrl("face_landmarker.task"),
    objectUrl: resolveVisionMediapipePackAssetUrl("efficientdet_lite0.tflite"),
  };
}

function readStorageOverride(): Partial<VisionMediapipeEndpoints> | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw.trim().length === 0) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<VisionMediapipeEndpoints>;
    return parsed != null && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function isPreferBundledMediapipeEnabled(): boolean {
  if (typeof localStorage === "undefined") {
    return true;
  }
  const raw = localStorage.getItem(PREFER_BUNDLED_MEDIAPIPE_STORAGE_KEY);
  if (raw === "0") {
    return false;
  }
  return true;
}

export function setPreferBundledMediapipeEnabled(enabled: boolean): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  if (enabled) {
    localStorage.setItem(PREFER_BUNDLED_MEDIAPIPE_STORAGE_KEY, "1");
  } else {
    localStorage.setItem(PREFER_BUNDLED_MEDIAPIPE_STORAGE_KEY, "0");
  }
}

function mergeEndpoints(
  base: VisionMediapipeEndpoints,
  override: Partial<VisionMediapipeEndpoints> | null,
): VisionMediapipeEndpoints {
  if (override == null) {
    return { ...base };
  }
  return {
    wasmBase: override.wasmBase?.trim() || base.wasmBase,
    poseLiteUrl: override.poseLiteUrl?.trim() || base.poseLiteUrl,
    poseFullUrl: override.poseFullUrl?.trim() || base.poseFullUrl,
    poseHeavyUrl: override.poseHeavyUrl?.trim() || base.poseHeavyUrl,
    handUrl: override.handUrl?.trim() || base.handUrl,
    faceUrl: override.faceUrl?.trim() || base.faceUrl,
    objectUrl: override.objectUrl?.trim() || base.objectUrl,
  };
}

export function getVisionMediapipeEndpoints(): VisionMediapipeEndpoints {
  const preferBundled = isPreferBundledMediapipeEnabled();
  const base = preferBundled
    ? bundledVisionMediapipeEndpoints()
    : DEFAULT_VISION_MEDIAPIPE_ENDPOINTS;
  if (preferBundled) {
    return { ...base };
  }
  return mergeEndpoints(base, readStorageOverride());
}

export function setVisionMediapipeEndpoints(
  patch: Partial<VisionMediapipeEndpoints>,
): VisionMediapipeEndpoints {
  if (isPreferBundledMediapipeEnabled()) {
    return { ...bundledVisionMediapipeEndpoints() };
  }
  const next = { ...getVisionMediapipeEndpoints(), ...patch };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function resetVisionMediapipeEndpoints(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFER_BUNDLED_MEDIAPIPE_STORAGE_KEY);
  }
}

export function visionMediapipeEndpointsStorageKey(): string {
  return STORAGE_KEY;
}

/** @deprecated No longer auto-falls back to CDN — kept for API compatibility. */
export function disableBundledMediapipeForSession(): void {
  /* intentional no-op */
}

export function resetBundledMediapipeSession(): void {
  /* intentional no-op */
}

export function isBundledMediapipeDisabledForSession(): boolean {
  return false;
}
