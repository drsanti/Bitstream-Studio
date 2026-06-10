import { DIAGRAM_SNAP_GRID, snapDiagramCoord } from "./diagramCanvasSnap";
import {
  snapDiagramCanvasPoint,
  snapDiagramDragDelta,
  type DiagramAlignBounds,
  type DiagramAlignmentGuide,
} from "./diagramAlignmentSnap";
import type { KonvaShapeV1 } from "../../schemas/konvaShapes";
import { getKonvaShapeAlignBounds } from "./konvaShapeBounds";
import { translateKonvaConnectorGeometry } from "./konvaConnectorPath";

export function snapKonvaCanvasPoint(args: {
  x: number;
  y: number;
  targets: DiagramAlignBounds[];
  snapEnabled?: boolean;
}): { x: number; y: number; guides: DiagramAlignmentGuide[] } {
  return snapDiagramCanvasPoint({
    x: args.x,
    y: args.y,
    targets: args.targets,
    snapEnabled: args.snapEnabled,
    grid: DIAGRAM_SNAP_GRID,
  });
}

export function snapKonvaShapeDragOffset(args: {
  shape: KonvaShapeV1;
  startBounds: DiagramAlignBounds;
  offsetX: number;
  offsetY: number;
  targets: DiagramAlignBounds[];
  snapEnabled?: boolean;
}): { offsetX: number; offsetY: number; guides: DiagramAlignmentGuide[] } {
  if (args.snapEnabled === false) {
    return { offsetX: args.offsetX, offsetY: args.offsetY, guides: [] };
  }
  const result = snapDiagramDragDelta({
    startBounds: args.startBounds,
    dx: args.offsetX,
    dy: args.offsetY,
    targets: args.targets,
    grid: DIAGRAM_SNAP_GRID,
  });
  return {
    offsetX: result.dx,
    offsetY: result.dy,
    guides: result.guides,
  };
}

export function snapKonvaShapeGeometry(
  shape: KonvaShapeV1,
  targets: DiagramAlignBounds[],
  snapEnabled = true,
): KonvaShapeV1 {
  if (!snapEnabled) {
    return shape;
  }
  if (shape.type === "line" || shape.type === "arrow") {
    const start = snapKonvaCanvasPoint({ x: shape.x1, y: shape.y1, targets, snapEnabled });
    const end = snapKonvaCanvasPoint({ x: shape.x2, y: shape.y2, targets, snapEnabled });
    return { ...shape, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  }
  if (shape.type === "circle") {
    const pt = snapKonvaCanvasPoint({ x: shape.x, y: shape.y, targets, snapEnabled });
    return {
      ...shape,
      x: pt.x,
      y: pt.y,
      radius: snapDiagramCoord(shape.radius),
    };
  }
  if (shape.type === "text") {
    const pt = snapKonvaCanvasPoint({ x: shape.x, y: shape.y, targets, snapEnabled });
    return {
      ...shape,
      x: pt.x,
      y: pt.y,
      fontSize: snapDiagramCoord(shape.fontSize ?? 20),
    };
  }
  const pt = snapKonvaCanvasPoint({ x: shape.x, y: shape.y, targets, snapEnabled });
  return {
    ...shape,
    x: pt.x,
    y: pt.y,
    width: snapDiagramCoord(shape.width),
    height: snapDiagramCoord(shape.height),
  };
}

export function applyKonvaDragOffsetToShape(
  shape: KonvaShapeV1,
  offsetX: number,
  offsetY: number,
): KonvaShapeV1 {
  if (shape.type === "line" || shape.type === "arrow") {
    const translated = translateKonvaConnectorGeometry(shape, offsetX, offsetY, {
      clearAttachments: true,
    });
    return {
      ...translated,
      x1: snapDiagramCoord(translated.x1),
      y1: snapDiagramCoord(translated.y1),
      x2: snapDiagramCoord(translated.x2),
      y2: snapDiagramCoord(translated.y2),
    };
  }
  if (shape.type === "circle") {
    return {
      ...shape,
      x: snapDiagramCoord(shape.x + offsetX),
      y: snapDiagramCoord(shape.y + offsetY),
    };
  }
  return {
    ...shape,
    x: snapDiagramCoord(shape.x + offsetX),
    y: snapDiagramCoord(shape.y + offsetY),
  };
}

export function getKonvaShapeDragStartBounds(shape: KonvaShapeV1): DiagramAlignBounds {
  return getKonvaShapeAlignBounds(shape);
}
