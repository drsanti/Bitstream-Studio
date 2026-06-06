/**
 * MediaPipe vision pack layout for ternion-3d-assets-free and Free Loader sync.
 * Node-safe (asset-sync + tests); webview imports the same module.
 *
 * @see extension/docs/VISION_MEDIAPIPE_FREE_PACK.md
 */

/** Pack-relative path under free mirror / online base (no `assets/` prefix). */
export const VISION_MEDIAPIPE_PACK_REL = "vision/mediapipe/";

export const VISION_MEDIAPIPE_MANIFEST_PACK_REL = "vision/mediapipe/manifest.v1.json";

export const VISION_MEDIAPIPE_WASM_FILES = [
  "wasm/vision_wasm_internal.js",
  "wasm/vision_wasm_internal.wasm",
  "wasm/vision_wasm_nosimd_internal.js",
  "wasm/vision_wasm_nosimd_internal.wasm",
] as const;

export const VISION_MEDIAPIPE_LITE_FILES = ["pose_landmarker_lite.task"] as const;

export const VISION_MEDIAPIPE_OPTIONAL_MODEL_FILES = [
  "pose_landmarker_full.task",
  "pose_landmarker_heavy.task",
  "hand_landmarker.task",
  "face_landmarker.task",
  "efficientdet_lite0.tflite",
] as const;

export type VisionMediapipePackManifestV1 = {
  revision: string;
  mediapipeTasksVisionVersion?: string;
  files: Array<{ path: string; bytes?: number }>;
  packs?: {
    lite?: string[];
    full?: string[];
  };
};

export function visionMediapipePackRelativeToRepoPath(packRelative: string): string {
  const trimmed = packRelative.replace(/\\/g, "/").replace(/^\/+/, "");
  const underPack = trimmed.startsWith(VISION_MEDIAPIPE_PACK_REL)
    ? trimmed
    : `${VISION_MEDIAPIPE_PACK_REL}${trimmed}`;
  return `assets/${underPack}`;
}

export function defaultVisionMediapipePackFilePaths(): string[] {
  const meta = [
    "README.md",
    "NOTICE.md",
    "manifest.v1.json",
  ];
  return [
    ...VISION_MEDIAPIPE_WASM_FILES,
    ...VISION_MEDIAPIPE_LITE_FILES,
    ...VISION_MEDIAPIPE_OPTIONAL_MODEL_FILES,
    ...meta,
  ];
}

/** GitHub `assets/...` repo paths for selective Free Loader sync. */
export function visionMediapipeFreePackRepoPaths(): string[] {
  return defaultVisionMediapipePackFilePaths().map(visionMediapipePackRelativeToRepoPath);
}

export function repoPathsFromVisionMediapipeManifest(
  manifest: VisionMediapipePackManifestV1,
): string[] {
  const paths = new Set<string>();
  paths.add(visionMediapipePackRelativeToRepoPath("manifest.v1.json"));
  for (const entry of manifest.files ?? []) {
    const p = entry.path?.trim();
    if (p) {
      paths.add(visionMediapipePackRelativeToRepoPath(p));
    }
  }
  return [...paths].sort((a, b) => a.localeCompare(b));
}

export function isVisionMediapipeCorePackFile(relativeInsidePack: string): boolean {
  const p = relativeInsidePack.replace(/\\/g, "/").replace(/^\/+/, "");
  if (p.startsWith("wasm/")) {
    return true;
  }
  return p === "pose_landmarker_lite.task";
}
