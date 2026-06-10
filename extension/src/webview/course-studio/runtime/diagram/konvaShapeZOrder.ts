import type { KonvaShapeV1 } from "../../schemas/konvaShapes";

export type KonvaShapeZOrderDirection = "forward" | "backward" | "front" | "back";

/** Reorder shapes in the freeform array (later = painted on top). */
export function reorderKonvaShapes(
  shapes: KonvaShapeV1[],
  shapeId: string,
  direction: KonvaShapeZOrderDirection,
): KonvaShapeV1[] {
  const index = shapes.findIndex((shape) => shape.id === shapeId);
  if (index < 0) {
    return shapes;
  }

  const next = [...shapes];
  const [shape] = next.splice(index, 1);
  if (shape == null) {
    return shapes;
  }

  let insertAt = index;
  switch (direction) {
    case "forward":
      insertAt = Math.min(index + 1, next.length);
      break;
    case "backward":
      insertAt = Math.max(index - 1, 0);
      break;
    case "front":
      insertAt = next.length;
      break;
    case "back":
      insertAt = 0;
      break;
    default:
      return shapes;
  }

  next.splice(insertAt, 0, shape);
  return next;
}

export function konvaShapeZOrderIndex(shapes: KonvaShapeV1[], shapeId: string): number {
  return shapes.findIndex((shape) => shape.id === shapeId);
}
