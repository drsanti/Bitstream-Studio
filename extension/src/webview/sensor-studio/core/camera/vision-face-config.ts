import {
  readVisionInferenceBaseConfig,
  type VisionInferenceBaseConfig,
} from "./vision-shared-config";
import {
  poseLandmarkToFlowVec3,
  type PoseLandmarkLike,
  type VisionPoseLandmarkVec3,
} from "./vision-pose-config";

/** MediaPipe face mesh landmark indices (subset). */
export const VISION_FACE_LANDMARK = {
  nose: 1,
  leftEye: 33,
  rightEye: 263,
} as const;

export type VisionFaceSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  errorMessage?: string;
  detected: boolean;
  score: number;
  nose: VisionPoseLandmarkVec3;
  leftEye: VisionPoseLandmarkVec3;
  rightEye: VisionPoseLandmarkVec3;
  triggerEdge: boolean;
};

const EMPTY_VEC: VisionPoseLandmarkVec3 = { x: 0, y: 0, z: 0 };

export type VisionFaceConfig = VisionInferenceBaseConfig;

export function readVisionFaceConfig(
  config: Record<string, unknown> | null | undefined,
): VisionFaceConfig {
  return readVisionInferenceBaseConfig(config);
}

export function emptyVisionFaceSnapshot(
  status: VisionFaceSnapshot["status"] = "idle",
  errorMessage?: string,
): VisionFaceSnapshot {
  return {
    status,
    errorMessage,
    detected: false,
    score: 0,
    nose: { ...EMPTY_VEC },
    leftEye: { ...EMPTY_VEC },
    rightEye: { ...EMPTY_VEC },
    triggerEdge: false,
  };
}

export function mapFaceLandmarksToSnapshot(args: {
  landmarks: ReadonlyArray<readonly PoseLandmarkLike[]> | undefined;
  minDetectionConfidence: number;
}): Pick<VisionFaceSnapshot, "detected" | "score" | "nose" | "leftEye" | "rightEye"> {
  const face = args.landmarks?.[0];
  if (face == null || face.length === 0) {
    return {
      detected: false,
      score: 0,
      nose: { ...EMPTY_VEC },
      leftEye: { ...EMPTY_VEC },
      rightEye: { ...EMPTY_VEC },
    };
  }
  const nose = poseLandmarkToFlowVec3(face[VISION_FACE_LANDMARK.nose]);
  const leftEye = poseLandmarkToFlowVec3(face[VISION_FACE_LANDMARK.leftEye]);
  const rightEye = poseLandmarkToFlowVec3(face[VISION_FACE_LANDMARK.rightEye]);
  const score = Math.max(nose.z, leftEye.z, rightEye.z);
  return {
    detected: score >= args.minDetectionConfidence,
    score,
    nose,
    leftEye,
    rightEye,
  };
}
