export type VisionQualityPreset = "low" | "med" | "high";

export type VisionInferenceBackend = "main" | "worker";

export type VisionTriggerConfig = {
  triggerOnEnter: boolean;
  triggerOnExit: boolean;
};

export type VisionInferenceBaseConfig = VisionTriggerConfig & {
  enabled: boolean;
  qualityPreset: VisionQualityPreset;
  targetFps: number;
  minDetectionConfidence: number;
  inferenceBackend: VisionInferenceBackend;
};

export function isVisionInferenceBackend(v: unknown): v is VisionInferenceBackend {
  return v === "main" || v === "worker";
}

function readFinite(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function isVisionQualityPreset(v: unknown): v is VisionQualityPreset {
  return v === "low" || v === "med" || v === "high";
}

export function resolveVisionQualityTargetFps(preset: VisionQualityPreset): number {
  switch (preset) {
    case "low":
      return 8;
    case "high":
      return 24;
    default:
      return 15;
  }
}

export function readVisionInferenceBaseConfig(
  config: Record<string, unknown> | null | undefined,
): VisionInferenceBaseConfig {
  const qualityPreset = isVisionQualityPreset(config?.qualityPreset)
    ? config.qualityPreset
    : "med";
  const targetFpsRaw = readFinite(
    config?.targetFps,
    resolveVisionQualityTargetFps(qualityPreset),
  );
  const inferenceBackend: VisionInferenceBackend =
    config?.inferenceBackend === "worker" ? "worker" : "main";
  return {
    enabled: config?.enabled !== false,
    qualityPreset,
    targetFps: Math.min(30, Math.max(1, Math.round(targetFpsRaw))),
    minDetectionConfidence: Math.max(
      0,
      Math.min(1, readFinite(config?.minDetectionConfidence, 0.5)),
    ),
    triggerOnEnter: config?.triggerOnEnter !== false,
    triggerOnExit: config?.triggerOnExit === true,
    inferenceBackend,
  };
}
