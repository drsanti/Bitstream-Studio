/** Snap a flow coordinate to the canvas grid (palette drop / programmatic placement). */
export function snapFlowPoint(
  point: { x: number; y: number },
  gridSize: number,
  enabled: boolean,
): { x: number; y: number } {
  if (!enabled || !Number.isFinite(gridSize) || gridSize <= 0) {
    return point;
  }
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}
