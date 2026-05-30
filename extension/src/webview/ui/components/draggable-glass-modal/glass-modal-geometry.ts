import type { Point2D } from "./types";

/** Centered open position, drag clamping, safe numeric fallback. */

export function sanitize(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getCenteredPosition(
  panelWidth: number,
  panelHeight: number,
): Point2D {
  if (typeof window === "undefined") {
    return { x: 48, y: 48 };
  }
  return {
    x: Math.max(0, (window.innerWidth - panelWidth) / 2),
    y: Math.max(0, (window.innerHeight - panelHeight) / 2),
  };
}

export function clampPosition(pos: Point2D): Point2D {
  if (typeof window === "undefined") {
    return pos;
  }
  return {
    x: Math.max(-100, Math.min(pos.x, window.innerWidth - 100)),
    y: Math.max(0, Math.min(pos.y, window.innerHeight - 100)),
  };
}
