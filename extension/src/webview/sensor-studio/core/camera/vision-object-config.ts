import {
  readVisionInferenceBaseConfig,
  type VisionInferenceBaseConfig,
} from "./vision-shared-config";

export type VisionObjectSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  errorMessage?: string;
  detected: boolean;
  count: number;
  label: string;
  score: number;
  triggerEdge: boolean;
};

export type VisionObjectConfig = VisionInferenceBaseConfig & {
  maxResults: number;
  scoreThreshold: number;
};

function readFinite(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function readVisionObjectConfig(
  config: Record<string, unknown> | null | undefined,
): VisionObjectConfig {
  const base = readVisionInferenceBaseConfig(config);
  return {
    ...base,
    maxResults: Math.min(10, Math.max(1, Math.round(readFinite(config?.maxResults, 5)))),
    scoreThreshold: Math.max(
      0,
      Math.min(1, readFinite(config?.scoreThreshold, 0.35)),
    ),
  };
}

export function emptyVisionObjectSnapshot(
  status: VisionObjectSnapshot["status"] = "idle",
  errorMessage?: string,
): VisionObjectSnapshot {
  return {
    status,
    errorMessage,
    detected: false,
    count: 0,
    label: "",
    score: 0,
    triggerEdge: false,
  };
}

type DetectionLike = {
  categories?: ReadonlyArray<{ categoryName?: string; score?: number }>;
};

export function mapObjectDetectionsToSnapshot(args: {
  detections: readonly DetectionLike[] | undefined;
  scoreThreshold: number;
}): Pick<VisionObjectSnapshot, "detected" | "count" | "label" | "score"> {
  const list = args.detections ?? [];
  const filtered = list.filter((det) => {
    const score = det.categories?.[0]?.score ?? 0;
    return score >= args.scoreThreshold;
  });
  if (filtered.length === 0) {
    return { detected: false, count: 0, label: "", score: 0 };
  }
  let topLabel = "";
  let topScore = 0;
  for (const det of filtered) {
    const cat = det.categories?.[0];
    const score = cat?.score ?? 0;
    if (score >= topScore) {
      topScore = score;
      topLabel = cat?.categoryName ?? "";
    }
  }
  return {
    detected: true,
    count: filtered.length,
    label: topLabel,
    score: topScore,
  };
}
