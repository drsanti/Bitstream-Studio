import {
  readVisionInferenceBaseConfig,
  type VisionInferenceBaseConfig,
} from "./vision-shared-config";
import {
  poseLandmarkToFlowVec3,
  type PoseLandmarkLike,
  type VisionPoseLandmarkVec3,
} from "./vision-pose-config";

/** MediaPipe hand landmark index — index finger tip (per hand). */
export const VISION_HAND_LANDMARK_INDEX_TIP = 8;

export type VisionHandsSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  errorMessage?: string;
  detected: boolean;
  score: number;
  leftIndex: VisionPoseLandmarkVec3;
  rightIndex: VisionPoseLandmarkVec3;
  triggerEdge: boolean;
};

const EMPTY_VEC: VisionPoseLandmarkVec3 = { x: 0, y: 0, z: 0 };

export type VisionHandsConfig = VisionInferenceBaseConfig;

export function readVisionHandsConfig(
  config: Record<string, unknown> | null | undefined,
): VisionHandsConfig {
  return readVisionInferenceBaseConfig(config);
}

export function emptyVisionHandsSnapshot(
  status: VisionHandsSnapshot["status"] = "idle",
  errorMessage?: string,
): VisionHandsSnapshot {
  return {
    status,
    errorMessage,
    detected: false,
    score: 0,
    leftIndex: { ...EMPTY_VEC },
    rightIndex: { ...EMPTY_VEC },
    triggerEdge: false,
  };
}

type HandednessLike = { categoryName?: string; score?: number };

export function mapHandLandmarksToSnapshot(args: {
  landmarks: ReadonlyArray<readonly PoseLandmarkLike[]> | undefined;
  handedness: ReadonlyArray<readonly HandednessLike[]> | undefined;
  minDetectionConfidence: number;
}): Pick<
  VisionHandsSnapshot,
  "detected" | "score" | "leftIndex" | "rightIndex"
> {
  const hands = args.landmarks;
  if (hands == null || hands.length === 0) {
    return {
      detected: false,
      score: 0,
      leftIndex: { ...EMPTY_VEC },
      rightIndex: { ...EMPTY_VEC },
    };
  }

  let leftIndex = { ...EMPTY_VEC };
  let rightIndex = { ...EMPTY_VEC };
  let score = 0;

  for (let i = 0; i < hands.length; i += 1) {
    const lm = hands[i];
    const tip = poseLandmarkToFlowVec3(lm?.[VISION_HAND_LANDMARK_INDEX_TIP]);
    score = Math.max(score, tip.z);
    const label =
      args.handedness?.[i]?.[0]?.categoryName?.toLowerCase() ?? "";
    if (label.includes("left")) {
      leftIndex = tip;
    } else if (label.includes("right")) {
      rightIndex = tip;
    } else if (i === 0 && leftIndex.z === 0) {
      leftIndex = tip;
    } else if (rightIndex.z === 0) {
      rightIndex = tip;
    }
  }

  return {
    detected: score >= args.minDetectionConfidence,
    score,
    leftIndex,
    rightIndex,
  };
}
