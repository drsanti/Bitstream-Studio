import type { KonvaShapeV1 } from "../../schemas/konvaShapes";
import { isKonvaGroupShape } from "../../schemas/konvaShapes";
import type { DiagramAlignBounds } from "./diagramAlignmentSnap";
import { konvaConnectorPathBounds } from "./konvaConnectorPath";
import { getKonvaTopLevelShapeWorldBounds } from "./konvaShapeTree";

export function getKonvaShapeAlignBounds(shape: KonvaShapeV1): DiagramAlignBounds {
  if (isKonvaGroupShape(shape)) {
    return getKonvaTopLevelShapeWorldBounds(shape);
  }
  if (shape.type === "rect" || shape.type === "diamond") {
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  }
  if (shape.type === "circle") {
    const d = shape.radius * 2;
    return { x: shape.x - shape.radius, y: shape.y - shape.radius, width: d, height: d };
  }
  if (shape.type === "text") {
    const fontSize = shape.fontSize ?? 20;
    const width = Math.max(40, shape.text.length * fontSize * 0.55);
    return { x: shape.x, y: shape.y, width, height: fontSize * 1.25 };
  }
  if (shape.type === "line" || shape.type === "arrow") {
    return konvaConnectorPathBounds(shape);
  }
  return { x: shape.x, y: shape.y, width: 40, height: 24 };
}

export function collectKonvaAlignTargets(
  shapes: KonvaShapeV1[],
  excludeId: string,
  canvas: { width: number; height: number },
): DiagramAlignBounds[] {
  const targets = shapes
    .filter((shape) => shape.id !== excludeId)
    .map((shape) => getKonvaShapeAlignBounds(shape));
  targets.push({ x: 0, y: 0, width: canvas.width, height: canvas.height });
  targets.push({
    x: canvas.width / 2 - 1,
    y: 0,
    width: 2,
    height: canvas.height,
  });
  targets.push({
    x: 0,
    y: canvas.height / 2 - 1,
    width: canvas.width,
    height: 2,
  });
  return targets;
}
