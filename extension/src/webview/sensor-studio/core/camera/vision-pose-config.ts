export type VisionPoseModelVariant = "lite" | "full" | "heavy";
export type VisionPoseQualityPreset = "low" | "med" | "high";
export type VisionPoseInferenceBackend = "main" | "worker";

export type VisionPoseConfig = {
  enabled: boolean;
  modelVariant: VisionPoseModelVariant;
  qualityPreset: VisionPoseQualityPreset;
  targetFps: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  triggerOnEnter: boolean;
  triggerOnExit: boolean;
  drawSketchOverlay: boolean;
  minSketchVisibility: number;
  drawLandmarks3d: boolean;
  inferenceBackend: VisionPoseInferenceBackend;
};

export type VisionPoseLandmarkVec3 = {
  x: number;
  y: number;
  z: number;
};

export type VisionPoseSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  errorMessage?: string;
  /** 0–100 while status is loading; null when unknown. */
  loadProgressPercent?: number | null;
  detected: boolean;
  score: number;
  nose: VisionPoseLandmarkVec3;
  leftWrist: VisionPoseLandmarkVec3;
  rightWrist: VisionPoseLandmarkVec3;
  /** True once per detection enter/exit edge (consumed by flow tick). */
  triggerEdge: boolean;
};

export const VISION_POSE_MODEL_URL: Record<VisionPoseModelVariant, string> = {
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  heavy: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
};

export const VISION_POSE_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";

/** MediaPipe pose landmark indices (blazepose). */
export const VISION_POSE_LANDMARK = {
  nose: 0,
  leftWrist: 15,
  rightWrist: 16,
} as const;

const EMPTY_VEC: VisionPoseLandmarkVec3 = { x: 0, y: 0, z: 0 };

export function emptyVisionPoseSnapshot(
  status: VisionPoseSnapshot["status"] = "idle",
  errorMessage?: string,
): VisionPoseSnapshot {
  return {
    status,
    errorMessage,
    loadProgressPercent: null,
    detected: false,
    score: 0,
    nose: { ...EMPTY_VEC },
    leftWrist: { ...EMPTY_VEC },
    rightWrist: { ...EMPTY_VEC },
    triggerEdge: false,
  };
}

export function isVisionPoseModelVariant(v: unknown): v is VisionPoseModelVariant {
  return v === "lite" || v === "full" || v === "heavy";
}

export function isVisionPoseQualityPreset(v: unknown): v is VisionPoseQualityPreset {
  return v === "low" || v === "med" || v === "high";
}

export function resolveVisionPoseTargetFps(preset: VisionPoseQualityPreset): number {
  switch (preset) {
    case "low":
      return 8;
    case "high":
      return 24;
    default:
      return 15;
  }
}

function readFinite(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function isVisionPoseInferenceBackend(v: unknown): v is VisionPoseInferenceBackend {
  return v === "main" || v === "worker";
}

export function readVisionPoseConfig(
  config: Record<string, unknown> | null | undefined,
): VisionPoseConfig {
  const qualityPreset = isVisionPoseQualityPreset(config?.qualityPreset)
    ? config.qualityPreset
    : "med";
  const modelVariant = isVisionPoseModelVariant(config?.modelVariant)
    ? config.modelVariant
    : "lite";
  const targetFpsRaw = readFinite(config?.targetFps, resolveVisionPoseTargetFps(qualityPreset));
  const minSketchRaw = readFinite(config?.minSketchVisibility, 0.35);
  const inferenceBackend: VisionPoseInferenceBackend =
    config?.inferenceBackend === "worker" ? "worker" : "main";
  return {
    enabled: config?.enabled !== false,
    modelVariant,
    qualityPreset,
    targetFps: Math.min(30, Math.max(1, Math.round(targetFpsRaw))),
    minDetectionConfidence: Math.max(
      0,
      Math.min(1, readFinite(config?.minDetectionConfidence, 0.5)),
    ),
    minTrackingConfidence: Math.max(
      0,
      Math.min(1, readFinite(config?.minTrackingConfidence, 0.5)),
    ),
    triggerOnEnter: config?.triggerOnEnter !== false,
    triggerOnExit: config?.triggerOnExit === true,
    drawSketchOverlay: config?.drawSketchOverlay !== false,
    minSketchVisibility: Math.max(0, Math.min(1, minSketchRaw)),
    drawLandmarks3d: config?.drawLandmarks3d === true,
    inferenceBackend,
  };
}

export type PoseLandmarkLike = {
  x?: number;
  y?: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

/** Normalized landmark confidence for overlay drawing (not depth). */
export function readPoseLandmarkConfidence(lm: PoseLandmarkLike | undefined): number {
  if (lm == null) {
    return 0;
  }
  if (typeof lm.visibility === "number" && Number.isFinite(lm.visibility)) {
    return lm.visibility;
  }
  if (typeof lm.presence === "number" && Number.isFinite(lm.presence)) {
    return lm.presence;
  }
  return 1;
}

export function poseLandmarkToFlowVec3(lm: PoseLandmarkLike | undefined): VisionPoseLandmarkVec3 {
  if (lm == null) {
    return { ...EMPTY_VEC };
  }
  const x = typeof lm.x === "number" && Number.isFinite(lm.x) ? lm.x : 0;
  const y = typeof lm.y === "number" && Number.isFinite(lm.y) ? lm.y : 0;
  const z = readPoseLandmarkConfidence(lm);
  return { x, y, z };
}

export function mapPoseLandmarksToSnapshot(args: {
  landmarks: readonly PoseLandmarkLike[] | undefined;
  minDetectionConfidence: number;
}): Pick<
  VisionPoseSnapshot,
  "detected" | "score" | "nose" | "leftWrist" | "rightWrist"
> {
  const list = args.landmarks;
  if (list == null || list.length === 0) {
    return {
      detected: false,
      score: 0,
      nose: { ...EMPTY_VEC },
      leftWrist: { ...EMPTY_VEC },
      rightWrist: { ...EMPTY_VEC },
    };
  }
  const noseLm = list[VISION_POSE_LANDMARK.nose];
  const leftWristLm = list[VISION_POSE_LANDMARK.leftWrist];
  const rightWristLm = list[VISION_POSE_LANDMARK.rightWrist];
  const score = Math.max(
    poseLandmarkToFlowVec3(noseLm).z,
    poseLandmarkToFlowVec3(leftWristLm).z,
    poseLandmarkToFlowVec3(rightWristLm).z,
  );
  const detected = score >= args.minDetectionConfidence;
  return {
    detected,
    score,
    nose: poseLandmarkToFlowVec3(noseLm),
    leftWrist: poseLandmarkToFlowVec3(leftWristLm),
    rightWrist: poseLandmarkToFlowVec3(rightWristLm),
  };
}
