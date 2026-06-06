import type { PoseLandmarkLike } from "./vision-pose-config";
import { readPoseLandmarkConfidence } from "./vision-pose-config";

/** BlazePose 33-landmark skeleton edges (subset for overlay). */
export const VISION_POSE_SKETCH_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
];

export type VisionPoseSketchPoint = {
  x: number;
  y: number;
  visibility: number;
};

export function mapLandmarksToSketchPoints(
  landmarks: readonly PoseLandmarkLike[] | undefined,
): VisionPoseSketchPoint[] {
  if (landmarks == null || landmarks.length === 0) {
    return [];
  }
  return landmarks.map((lm) => {
    const x = typeof lm.x === "number" && Number.isFinite(lm.x) ? lm.x : 0;
    const y = typeof lm.y === "number" && Number.isFinite(lm.y) ? lm.y : 0;
    return { x, y, visibility: readPoseLandmarkConfidence(lm) };
  });
}

export function sketchPointToSvg(args: {
  point: VisionPoseSketchPoint;
  width: number;
  height: number;
  mirror: boolean;
  minVisibility: number;
  /** When set, maps normalized coords into this rect (object-fit: contain letterboxing). */
  contentRect?: { x: number; y: number; w: number; h: number };
}): { cx: number; cy: number; visible: boolean } {
  const visible = args.point.visibility >= args.minVisibility;
  const nx = args.mirror ? 1 - args.point.x : args.point.x;
  const rect = args.contentRect ?? { x: 0, y: 0, w: args.width, h: args.height };
  return {
    cx: rect.x + nx * rect.w,
    cy: rect.y + args.point.y * rect.h,
    visible,
  };
}

/** Letterbox rect for `object-fit: contain` video inside a container. */
export function objectContainVideoRect(args: {
  containerW: number;
  containerH: number;
  videoW: number;
  videoH: number;
}): { x: number; y: number; w: number; h: number } {
  return objectFitVideoRect({ ...args, fit: "contain" });
}

/** Crop rect for `object-fit: cover` video inside a container. */
export function objectCoverVideoRect(args: {
  containerW: number;
  containerH: number;
  videoW: number;
  videoH: number;
}): { x: number; y: number; w: number; h: number } {
  return objectFitVideoRect({ ...args, fit: "cover" });
}

function objectFitVideoRect(args: {
  containerW: number;
  containerH: number;
  videoW: number;
  videoH: number;
  fit: "contain" | "cover";
}): { x: number; y: number; w: number; h: number } {
  const { containerW, containerH, videoW, videoH, fit } = args;
  if (containerW <= 0 || containerH <= 0 || videoW <= 0 || videoH <= 0) {
    return { x: 0, y: 0, w: containerW, h: containerH };
  }
  const scale =
    fit === "contain"
      ? Math.min(containerW / videoW, containerH / videoH)
      : Math.max(containerW / videoW, containerH / videoH);
  const w = videoW * scale;
  const h = videoH * scale;
  return {
    x: (containerW - w) / 2,
    y: (containerH - h) / 2,
    w,
    h,
  };
}
