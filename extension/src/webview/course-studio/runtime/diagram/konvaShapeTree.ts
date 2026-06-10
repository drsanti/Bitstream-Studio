import type { KonvaGroupShapeV1, KonvaShapeV1 } from "../../schemas/konvaShapes";
import { isKonvaConnectorShape, isKonvaGroupShape } from "../../schemas/konvaShapes";
import type { DiagramAlignBounds } from "./diagramAlignmentSnap";
import { getKonvaShapeAlignBounds } from "./konvaShapeBounds";
import { translateKonvaConnectorGeometry } from "./konvaConnectorPath";

export type KonvaShapeTransformFrame = {
  x: number;
  y: number;
  rotation: number;
};

const IDENTITY_FRAME: KonvaShapeTransformFrame = { x: 0, y: 0, rotation: 0 };

function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  degrees: number,
): { x: number; y: number } {
  if (Math.abs(degrees) < 0.001) {
    return { x, y };
  }
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

function composeFrame(
  parent: KonvaShapeTransformFrame,
  local: KonvaShapeTransformFrame,
): KonvaShapeTransformFrame {
  const rotated = rotatePoint(local.x, local.y, 0, 0, parent.rotation);
  return {
    x: parent.x + rotated.x,
    y: parent.y + rotated.y,
    rotation: parent.rotation + local.rotation,
  };
}

/** Apply ancestor canvas transform to a leaf shape (returns world-space geometry). */
export function applyKonvaShapeTransformFrame(
  shape: KonvaShapeV1,
  frame: KonvaShapeTransformFrame,
): KonvaShapeV1 {
  if (frame.x === 0 && frame.y === 0 && frame.rotation === 0) {
    return shape;
  }

  if (isKonvaConnectorShape(shape)) {
    let next = translateKonvaConnectorGeometry(shape, frame.x, frame.y);
    if (Math.abs(frame.rotation) > 0.001) {
      const p1 = rotatePoint(next.x1, next.y1, frame.x, frame.y, frame.rotation);
      const p2 = rotatePoint(next.x2, next.y2, frame.x, frame.y, frame.rotation);
      next = { ...next, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    return next;
  }

  const local = rotatePoint(shape.x, shape.y, 0, 0, frame.rotation);
  const worldX = frame.x + local.x;
  const worldY = frame.y + local.y;

  if (shape.type === "circle") {
    return {
      ...shape,
      x: worldX,
      y: worldY,
      rotation: (shape.rotation ?? 0) + frame.rotation,
    };
  }

  return {
    ...shape,
    x: worldX,
    y: worldY,
    rotation: (shape.rotation ?? 0) + frame.rotation,
  };
}

/** Flatten nested groups into world-space leaf shapes (for connector anchors and marquee). */
export function flattenKonvaShapesToWorld(
  shapes: KonvaShapeV1[],
  parentFrame: KonvaShapeTransformFrame = IDENTITY_FRAME,
): KonvaShapeV1[] {
  const out: KonvaShapeV1[] = [];
  for (const shape of shapes) {
    if (isKonvaGroupShape(shape)) {
      const groupFrame = composeFrame(parentFrame, {
        x: shape.x,
        y: shape.y,
        rotation: shape.rotation ?? 0,
      });
      out.push(...flattenKonvaShapesToWorld(shape.children, groupFrame));
      continue;
    }
    out.push(applyKonvaShapeTransformFrame(shape, parentFrame));
  }
  return out;
}

export function collectKonvaShapeDescendantIds(shape: KonvaShapeV1): string[] {
  if (!isKonvaGroupShape(shape)) {
    return [shape.id];
  }
  return shape.children.flatMap((child) => collectKonvaShapeDescendantIds(child));
}

export function collectKonvaShapeTreeIds(shapes: KonvaShapeV1[]): string[] {
  const ids: string[] = [];
  const walk = (entries: KonvaShapeV1[]) => {
    for (const entry of entries) {
      ids.push(entry.id);
      if (isKonvaGroupShape(entry)) {
        walk(entry.children);
      }
    }
  };
  walk(shapes);
  return ids;
}

export function findKonvaShapeById(
  shapes: KonvaShapeV1[],
  shapeId: string,
): KonvaShapeV1 | null {
  for (const shape of shapes) {
    if (shape.id === shapeId) {
      return shape;
    }
    if (isKonvaGroupShape(shape)) {
      const found = findKonvaShapeById(shape.children, shapeId);
      if (found != null) {
        return found;
      }
    }
  }
  return null;
}

export function findKonvaShapeParentId(
  shapes: KonvaShapeV1[],
  shapeId: string,
  parentId: string | null = null,
): string | null {
  for (const shape of shapes) {
    if (shape.id === shapeId) {
      return parentId;
    }
    if (isKonvaGroupShape(shape)) {
      const found = findKonvaShapeParentId(shape.children, shapeId, shape.id);
      if (found != null) {
        return found;
      }
    }
  }
  return null;
}

export function getKonvaGroupSelectionId(
  shapes: KonvaShapeV1[],
  shapeId: string,
): string {
  let current = shapeId;
  while (true) {
    const parentId = findKonvaShapeParentId(shapes, current);
    if (parentId == null) {
      return current;
    }
    current = parentId;
  }
}

export function getKonvaShapeWorldBounds(
  shape: KonvaShapeV1,
  parentFrame: KonvaShapeTransformFrame = IDENTITY_FRAME,
): DiagramAlignBounds {
  if (isKonvaGroupShape(shape)) {
    const frame = composeFrame(parentFrame, {
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation ?? 0,
    });
    if (shape.children.length === 0) {
      return { x: frame.x, y: frame.y, width: 1, height: 1 };
    }
    const childBounds = shape.children.map((child) => getKonvaShapeWorldBounds(child, frame));
    const x = Math.min(...childBounds.map((bounds) => bounds.x));
    const y = Math.min(...childBounds.map((bounds) => bounds.y));
    const maxX = Math.max(...childBounds.map((bounds) => bounds.x + bounds.width));
    const maxY = Math.max(...childBounds.map((bounds) => bounds.y + bounds.height));
    return { x, y, width: Math.max(1, maxX - x), height: Math.max(1, maxY - y) };
  }

  const world = applyKonvaShapeTransformFrame(shape, parentFrame);
  return getKonvaShapeAlignBounds(world);
}

export function getKonvaTopLevelShapeWorldBounds(shape: KonvaShapeV1): DiagramAlignBounds {
  return getKonvaShapeWorldBounds(shape);
}

export function mapKonvaShapeTree(
  shapes: KonvaShapeV1[],
  mapper: (shape: KonvaShapeV1) => KonvaShapeV1,
): KonvaShapeV1[] {
  return shapes.map((shape) => {
    if (isKonvaGroupShape(shape)) {
      const mapped = mapper(shape);
      if (!isKonvaGroupShape(mapped)) {
        return mapped;
      }
      return {
        ...mapped,
        children: mapKonvaShapeTree(shape.children, mapper),
      };
    }
    return mapper(shape);
  });
}

export function translateKonvaShapeLocal(
  shape: KonvaShapeV1,
  dx: number,
  dy: number,
): KonvaShapeV1 {
  if (isKonvaConnectorShape(shape)) {
    return translateKonvaConnectorGeometry(shape, dx, dy);
  }
  if (shape.type === "circle") {
    return { ...shape, x: shape.x + dx, y: shape.y + dy };
  }
  if (isKonvaGroupShape(shape)) {
    return { ...shape, x: shape.x + dx, y: shape.y + dy };
  }
  return { ...shape, x: shape.x + dx, y: shape.y + dy };
}

export function rebaseKonvaShapeToLocalOrigin(
  shape: KonvaShapeV1,
  originX: number,
  originY: number,
): KonvaShapeV1 {
  return translateKonvaShapeLocal(shape, -originX, -originY);
}

export function rebaseKonvaShapeToWorldOrigin(
  shape: KonvaShapeV1,
  originX: number,
  originY: number,
): KonvaShapeV1 {
  return translateKonvaShapeLocal(shape, originX, originY);
}

export function isKonvaGroupShapeType(shape: KonvaShapeV1): shape is KonvaGroupShapeV1 {
  return isKonvaGroupShape(shape);
}

export function replaceKonvaShapeById(
  shapes: KonvaShapeV1[],
  shapeId: string,
  replacement: KonvaShapeV1,
): KonvaShapeV1[] {
  return shapes.map((shape) => {
    if (shape.id === shapeId) {
      return replacement;
    }
    if (isKonvaGroupShape(shape)) {
      return {
        ...shape,
        children: replaceKonvaShapeById(shape.children, shapeId, replacement),
      };
    }
    return shape;
  });
}

export function removeKonvaShapeById(shapes: KonvaShapeV1[], shapeId: string): KonvaShapeV1[] {
  const next: KonvaShapeV1[] = [];
  for (const shape of shapes) {
    if (shape.id === shapeId) {
      continue;
    }
    if (isKonvaGroupShape(shape)) {
      next.push({
        ...shape,
        children: removeKonvaShapeById(shape.children, shapeId),
      });
      continue;
    }
    next.push(shape);
  }
  return next;
}

export function findKonvaShapeAncestorPath(
  shapes: KonvaShapeV1[],
  shapeId: string,
  trail: string[] = [],
): string[] | null {
  for (const shape of shapes) {
    if (shape.id === shapeId) {
      return [...trail, shape.id];
    }
    if (isKonvaGroupShape(shape)) {
      const found = findKonvaShapeAncestorPath(shape.children, shapeId, [...trail, shape.id]);
      if (found != null) {
        return found;
      }
    }
  }
  return null;
}

export function isKonvaTopLevelShapeId(shapes: KonvaShapeV1[], shapeId: string): boolean {
  return shapes.some((shape) => shape.id === shapeId);
}