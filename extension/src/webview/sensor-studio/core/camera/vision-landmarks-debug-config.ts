import {
  resolveVisionQualityTargetFps,
  type VisionInferenceBackend,
  type VisionQualityPreset,
} from "./vision-shared-config";

export type VisionLandmarksDebugConfig = {
  enabled: boolean;
  qualityPreset: VisionQualityPreset;
  targetFps: number;
  maxPoints: number;
  drawSketchOverlay: boolean;
  minSketchVisibility: number;
  drawLandmarks3d: boolean;
  inferenceBackend: VisionInferenceBackend;
};

export type VisionLandmarksDebugSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  errorMessage?: string;
  count: number;
  json: string;
};

function readFinite(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function isQualityPreset(v: unknown): v is VisionQualityPreset {
  return v === "low" || v === "med" || v === "high";
}

export function readVisionLandmarksDebugConfig(
  config: Record<string, unknown> | null | undefined,
): VisionLandmarksDebugConfig {
  const qualityPreset = isQualityPreset(config?.qualityPreset)
    ? config.qualityPreset
    : "low";
  const targetFpsRaw = readFinite(
    config?.targetFps,
    resolveVisionQualityTargetFps(qualityPreset),
  );
  return {
    enabled: config?.enabled !== false,
    qualityPreset,
    targetFps: Math.min(15, Math.max(1, Math.round(targetFpsRaw))),
    maxPoints: Math.min(33, Math.max(4, Math.round(readFinite(config?.maxPoints, 17)))),
    drawSketchOverlay: config?.drawSketchOverlay !== false,
    minSketchVisibility: Math.max(
      0,
      Math.min(1, readFinite(config?.minSketchVisibility, 0.35)),
    ),
    drawLandmarks3d: config?.drawLandmarks3d === true,
    inferenceBackend: config?.inferenceBackend === "worker" ? "worker" : "main",
  };
}

export function emptyVisionLandmarksDebugSnapshot(
  status: VisionLandmarksDebugSnapshot["status"] = "idle",
  errorMessage?: string,
): VisionLandmarksDebugSnapshot {
  return {
    status,
    errorMessage,
    count: 0,
    json: "[]",
  };
}
