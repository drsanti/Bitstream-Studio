import { VISION_MEDIAPIPE_OPTIONAL_MODEL_FILES } from "../../../../asset-sync/visionMediapipeFreePack";
import { readVisionPoseConfig, type VisionPoseModelVariant } from "./vision-pose-config";
import { resolveVisionMediapipePackAssetUrl } from "./vision-mediapipe-url-resolver";

const POSE_OPTIONAL_FILE: Record<VisionPoseModelVariant, string | null> = {
  lite: null,
  full: "pose_landmarker_full.task",
  heavy: "pose_landmarker_heavy.task",
};

const FILE_LABELS: Record<string, string> = {
  "pose_landmarker_full.task": "Pose full",
  "pose_landmarker_heavy.task": "Pose heavy",
  "hand_landmarker.task": "Hand landmarker",
  "face_landmarker.task": "Face landmarker",
  "efficientdet_lite0.tflite": "Object detector",
};

/** Optional pack files required for a vision node (empty when lite/core-only). */
export function visionMediapipeRequiredOptionalFiles(args: {
  catalogNodeId: string;
  config: Record<string, unknown>;
}): string[] {
  const { catalogNodeId, config } = args;
  switch (catalogNodeId) {
    case "vision-pose": {
      const variant = readVisionPoseConfig(config).modelVariant;
      const file = POSE_OPTIONAL_FILE[variant];
      return file != null ? [file] : [];
    }
    case "vision-hands":
      return ["hand_landmarker.task"];
    case "vision-face":
      return ["face_landmarker.task"];
    case "vision-object":
      return ["efficientdet_lite0.tflite"];
    default:
      return [];
  }
}

export function visionMediapipeFullOptionalPackFiles(): readonly string[] {
  return VISION_MEDIAPIPE_OPTIONAL_MODEL_FILES;
}

export function visionMediapipeFriendlyFileLabel(relativeInsidePack: string): string {
  const key = relativeInsidePack.replace(/\\/g, "/").replace(/^\/+/, "");
  return FILE_LABELS[key] ?? key;
}

async function probeUrlReachable(url: string, signal?: AbortSignal): Promise<boolean> {
  try {
    let res = await fetch(url, { method: "HEAD", signal, cache: "no-store" });
    if (res.ok) {
      return true;
    }
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        signal,
        cache: "no-store",
      });
      return res.ok || res.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}

export async function probeVisionMediapipePackFiles(
  relativeInsidePackFiles: readonly string[],
  signal?: AbortSignal,
): Promise<{ present: string[]; missing: string[] }> {
  const present: string[] = [];
  const missing: string[] = [];
  for (const file of relativeInsidePackFiles) {
    const url = resolveVisionMediapipePackAssetUrl(file);
    const ok = await probeUrlReachable(url, signal);
    if (ok) {
      present.push(file);
    } else {
      missing.push(file);
    }
  }
  return { present, missing };
}
