import type { PoseLandmarkLike } from "./vision-pose-config";

export function serializePoseLandmarksCompact(args: {
  landmarks: readonly PoseLandmarkLike[] | undefined;
  maxPoints: number;
}): { count: number; json: string } {
  const list = args.landmarks;
  if (list == null || list.length === 0) {
    return { count: 0, json: "[]" };
  }
  const maxPoints = Math.max(1, Math.min(33, Math.round(args.maxPoints)));
  const slice = list.slice(0, maxPoints);
  const compact = slice.map((lm) => {
    const x = typeof lm.x === "number" && Number.isFinite(lm.x) ? lm.x : 0;
    const y = typeof lm.y === "number" && Number.isFinite(lm.y) ? lm.y : 0;
    const v =
      typeof lm.visibility === "number" && Number.isFinite(lm.visibility)
        ? lm.visibility
        : typeof lm.z === "number" && Number.isFinite(lm.z)
          ? lm.z
          : 0;
    return { x, y, v };
  });
  return {
    count: list.length,
    json: JSON.stringify(compact),
  };
}
