import type Konva from "konva";
import type { KonvaGroupShapeV1, KonvaShapeV1 } from "../../schemas/konvaShapes";
import { isKonvaGroupShape } from "../../schemas/konvaShapes";
import { clampKonvaRectCornerRadiusFields } from "./konvaCornerRadius";
import { translateKonvaConnectorGeometry } from "./konvaConnectorPath";

const MIN_BOX = 8;
const MIN_RADIUS = 4;
const MIN_FONT = 8;

function clampSize(value: number, min: number): number {
  return Math.max(min, value);
}

function rotateLocalPoint(
  x: number,
  y: number,
  degrees: number,
): { x: number; y: number } {
  if (Math.abs(degrees) < 0.001) {
    return { x, y };
  }
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function scaleKonvaShapeInGroupLocal(
  shape: KonvaShapeV1,
  scaleX: number,
  scaleY: number,
): KonvaShapeV1 {
  const absScaleX = Math.abs(scaleX);
  const absScaleY = Math.abs(scaleY);

  if (isKonvaGroupShape(shape)) {
    return {
      ...shape,
      x: shape.x * scaleX,
      y: shape.y * scaleY,
      children: shape.children.map((child) => scaleKonvaShapeInGroupLocal(child, scaleX, scaleY)),
    };
  }

  if (shape.type === "rect") {
    return clampKonvaRectCornerRadiusFields({
      ...shape,
      x: shape.x * scaleX,
      y: shape.y * scaleY,
      width: clampSize(shape.width * absScaleX, MIN_BOX),
      height: clampSize(shape.height * absScaleY, MIN_BOX),
    });
  }

  if (shape.type === "diamond") {
    return {
      ...shape,
      x: shape.x * scaleX,
      y: shape.y * scaleY,
      width: clampSize(shape.width * absScaleX, MIN_BOX),
      height: clampSize(shape.height * absScaleY, MIN_BOX),
    };
  }

  if (shape.type === "circle") {
    const radiusScale = Math.max(absScaleX, absScaleY);
    return {
      ...shape,
      x: shape.x * scaleX,
      y: shape.y * scaleY,
      radius: clampSize(shape.radius * radiusScale, MIN_RADIUS),
    };
  }

  if (shape.type === "text") {
    const fontScale = Math.max(absScaleX, absScaleY);
    return {
      ...shape,
      x: shape.x * scaleX,
      y: shape.y * scaleY,
      fontSize: clampSize((shape.fontSize ?? 20) * fontScale, MIN_FONT),
    };
  }

  return shape;
}

function rotateKonvaShapeInGroupLocal(shape: KonvaShapeV1, degrees: number): KonvaShapeV1 {
  if (Math.abs(degrees) < 0.001) {
    return shape;
  }

  if (isKonvaGroupShape(shape)) {
    const pos = rotateLocalPoint(shape.x, shape.y, degrees);
    return {
      ...shape,
      x: pos.x,
      y: pos.y,
      rotation: (shape.rotation ?? 0) + degrees,
      children: shape.children.map((child) => rotateKonvaShapeInGroupLocal(child, degrees)),
    };
  }

  const pos = rotateLocalPoint(shape.x, shape.y, degrees);
  return {
    ...shape,
    x: pos.x,
    y: pos.y,
    rotation: (shape.rotation ?? 0) + degrees,
  };
}

/** Bake Konva Transformer scale/rotation on a group into child geometry. */
export function bakeKonvaGroupFromNode(
  shape: KonvaGroupShapeV1,
  node: Konva.Group,
): KonvaGroupShapeV1 {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  const rotation = node.rotation();

  let children = shape.children;
  if (Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001) {
    children = children.map((child) => scaleKonvaShapeInGroupLocal(child, scaleX, scaleY));
  }
  if (Math.abs(rotation) > 0.001) {
    children = children.map((child) => rotateKonvaShapeInGroupLocal(child, rotation));
  }

  return {
    ...shape,
    x: node.x(),
    y: node.y(),
    rotation: (shape.rotation ?? 0) + rotation,
    children,
  };
}

/** Bake Konva node transform into diagram shape JSON and reset node scale. */
export function shapeFromKonvaNode(shape: KonvaShapeV1, node: Konva.Node): KonvaShapeV1 {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  const rotation = node.rotation();

  if (isKonvaGroupShape(shape)) {
    return bakeKonvaGroupFromNode(shape, node as Konva.Group);
  }

  if (shape.type === "rect") {
    const rect = node as Konva.Rect | Konva.Group;
    const rectBody =
      rect.getClassName() === "Group"
        ? ((rect as Konva.Group).findOne(`#shape-${shape.id}`) as Konva.Rect | undefined)
        : (rect as Konva.Rect);
    const host = rect.getClassName() === "Group" ? (rect as Konva.Group) : rect;
    const body = rectBody ?? (rect as Konva.Rect);
    const scaleX = host.scaleX();
    const scaleY = host.scaleY();
    return clampKonvaRectCornerRadiusFields({
      ...shape,
      x: host.x(),
      y: host.y(),
      width: clampSize(body.width() * Math.abs(scaleX), MIN_BOX),
      height: clampSize(body.height() * Math.abs(scaleY), MIN_BOX),
      rotation: host.rotation(),
    });
  }

  if (shape.type === "diamond") {
    const group = node as Konva.Group;
    return {
      ...shape,
      x: group.x(),
      y: group.y(),
      width: clampSize(shape.width * Math.abs(scaleX), MIN_BOX),
      height: clampSize(shape.height * Math.abs(scaleY), MIN_BOX),
      rotation,
    };
  }

  if (shape.type === "circle") {
    const circle = node as Konva.Circle;
    const radiusScale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
    return {
      ...shape,
      x: circle.x(),
      y: circle.y(),
      radius: clampSize(shape.radius * radiusScale, MIN_RADIUS),
      rotation,
    };
  }

  if (shape.type === "line" || shape.type === "arrow") {
    const nodeClass = node.getClassName();
    const offsetX = node.x();
    const offsetY = node.y();
    return translateKonvaConnectorGeometry(
      { ...shape, x1: shape.x1, y1: shape.y1, x2: shape.x2, y2: shape.y2 },
      offsetX,
      offsetY,
      { clearAttachments: nodeClass === "Group" || offsetX !== 0 || offsetY !== 0 },
    );
  }

  const text = node as Konva.Text;
  const fontScale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
  const baseFont = shape.fontSize ?? 20;
  return {
    ...shape,
    x: text.x(),
    y: text.y(),
    fontSize: clampSize(baseFont * fontScale, MIN_FONT),
    rotation,
  };
}

export function resetKonvaNodeTransform(node: Konva.Node): void {
  node.scaleX(1);
  node.scaleY(1);
  node.skewX(0);
  node.skewY(0);
}
