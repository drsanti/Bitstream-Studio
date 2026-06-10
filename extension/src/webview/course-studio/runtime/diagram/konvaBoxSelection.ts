import type { KonvaShapeV1 } from "../../schemas/konvaShapes";
import type { DiagramAlignBounds } from "./diagramAlignmentSnap";
import { getKonvaShapeAlignBounds } from "./konvaShapeBounds";

export type KonvaCanvasPoint = { x: number; y: number };

export type KonvaSelectionBox = DiagramAlignBounds;

const MIN_MARQUEE_DRAG_PX = 4;

export function normalizeKonvaSelectionBox(
  start: KonvaCanvasPoint,
  end: KonvaCanvasPoint,
): KonvaSelectionBox {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function konvaSelectionBoxIsDrag(box: KonvaSelectionBox): boolean {
  return box.width >= MIN_MARQUEE_DRAG_PX || box.height >= MIN_MARQUEE_DRAG_PX;
}

export function konvaBoundsIntersect(a: DiagramAlignBounds, b: DiagramAlignBounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function konvaShapeIdsInSelectionBox(
  shapes: KonvaShapeV1[],
  box: KonvaSelectionBox,
): string[] {
  if (box.width <= 0 && box.height <= 0) {
    return [];
  }
  return shapes
    .filter((shape) => konvaBoundsIntersect(getKonvaShapeAlignBounds(shape), box))
    .map((shape) => shape.id);
}

export function mergeKonvaShapeSelection(
  current: string[],
  next: string[],
  additive: boolean,
): string[] {
  if (!additive) {
    return [...next];
  }
  const merged = new Set(current);
  for (const id of next) {
    merged.add(id);
  }
  return [...merged];
}

export function toggleKonvaShapeSelection(current: string[], shapeId: string): string[] {
  if (current.includes(shapeId)) {
    return current.filter((id) => id !== shapeId);
  }
  return [...current, shapeId];
}

export function primaryKonvaShapeSelection(selectedShapeIds: string[]): string | null {
  return selectedShapeIds.length > 0
    ? (selectedShapeIds[selectedShapeIds.length - 1] ?? null)
    : null;
}
