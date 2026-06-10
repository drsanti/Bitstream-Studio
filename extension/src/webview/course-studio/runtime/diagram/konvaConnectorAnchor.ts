import type { KonvaConnectorAnchorKind } from "../../schemas/konvaConnector";
import type { KonvaShapeV1 } from "../../schemas/konvaShapes";

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

function rectLocalAnchor(
  x: number,
  y: number,
  width: number,
  height: number,
  anchor: KonvaConnectorAnchorKind,
): { x: number; y: number } {
  switch (anchor) {
    case "n":
      return { x: x + width / 2, y };
    case "s":
      return { x: x + width / 2, y: y + height };
    case "e":
      return { x: x + width, y: y + height / 2 };
    case "w":
      return { x, y: y + height / 2 };
    case "ne":
      return { x: x + width, y };
    case "nw":
      return { x, y };
    case "se":
      return { x: x + width, y: y + height };
    case "sw":
      return { x, y: y + height };
    case "center":
      return { x: x + width / 2, y: y + height / 2 };
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
}

function closestPointOnRectPerimeter(
  px: number,
  py: number,
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; anchor: KonvaConnectorAnchorKind } {
  const anchors: KonvaConnectorAnchorKind[] = [
    "n",
    "s",
    "e",
    "w",
    "ne",
    "nw",
    "se",
    "sw",
  ];
  let best = rectLocalAnchor(x, y, width, height, "n");
  let bestDist = Number.POSITIVE_INFINITY;
  let bestAnchor: KonvaConnectorAnchorKind = "n";

  for (const anchor of anchors) {
    const pt = rectLocalAnchor(x, y, width, height, anchor);
    const dist = Math.hypot(px - pt.x, py - pt.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = pt;
      bestAnchor = anchor;
    }
  }

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));
  const cx = clamp(px, x, x + width);
  const cy = clamp(py, y, y + height);
  const onLeft = Math.abs(cx - x) < 0.001;
  const onRight = Math.abs(cx - (x + width)) < 0.001;
  const onTop = Math.abs(cy - y) < 0.001;
  const onBottom = Math.abs(cy - (y + height)) < 0.001;
  if (onLeft || onRight || onTop || onBottom) {
    const edgePoint = {
      x: onLeft ? x : onRight ? x + width : cx,
      y: onTop ? y : onBottom ? y + height : cy,
    };
    const edgeDist = Math.hypot(px - edgePoint.x, py - edgePoint.y);
    if (edgeDist < bestDist) {
      best = edgePoint;
      bestDist = edgeDist;
      if (onTop && onLeft) {
        bestAnchor = "nw";
      } else if (onTop && onRight) {
        bestAnchor = "ne";
      } else if (onBottom && onRight) {
        bestAnchor = "se";
      } else if (onBottom && onLeft) {
        bestAnchor = "sw";
      } else if (onTop) {
        bestAnchor = "n";
      } else if (onBottom) {
        bestAnchor = "s";
      } else if (onLeft) {
        bestAnchor = "w";
      } else {
        bestAnchor = "e";
      }
    }
  }

  return { ...best, anchor: bestAnchor };
}

function closestPointOnCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number; anchor: KonvaConnectorAnchorKind } {
  const dx = px - cx;
  const dy = py - cy;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) {
    return { x: cx, y: cy - radius, anchor: "n" };
  }
  const x = cx + (dx / len) * radius;
  const y = cy + (dy / len) * radius;
  const angle = Math.atan2(y - cy, x - cx);
  const octant = Math.round(angle / (Math.PI / 4)) % 8;
  const anchorMap: KonvaConnectorAnchorKind[] = [
    "e",
    "se",
    "s",
    "sw",
    "w",
    "nw",
    "n",
    "ne",
  ];
  const normalized = ((octant % 8) + 8) % 8;
  return { x, y, anchor: anchorMap[normalized] ?? "e" };
}

function closestPointOnDiamond(
  px: number,
  py: number,
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; anchor: KonvaConnectorAnchorKind } {
  const points = [
    { anchor: "n" as const, x: x + width / 2, y },
    { anchor: "e" as const, x: x + width, y: y + height / 2 },
    { anchor: "s" as const, x: x + width / 2, y: y + height },
    { anchor: "w" as const, x, y: y + height / 2 },
  ];
  let best = points[0]!;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const entry of points) {
    const dist = Math.hypot(px - entry.x, py - entry.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }
  return { x: best.x, y: best.y, anchor: best.anchor };
}

export function konvaShapeAnchorPoint(
  shape: KonvaShapeV1,
  anchor: KonvaConnectorAnchorKind,
): { x: number; y: number } | null {
  if (shape.type === "line" || shape.type === "arrow") {
    return null;
  }

  if (shape.type === "rect") {
    const local = rectLocalAnchor(shape.x, shape.y, shape.width, shape.height, anchor);
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    return rotatePoint(local.x, local.y, cx, cy, shape.rotation ?? 0);
  }

  if (shape.type === "diamond") {
    if (["n", "e", "s", "w", "center"].includes(anchor)) {
      const local = rectLocalAnchor(shape.x, shape.y, shape.width, shape.height, anchor);
      if (anchor === "center") {
        return local;
      }
      return closestPointOnDiamond(local.x, local.y, shape.x, shape.y, shape.width, shape.height);
    }
    return closestPointOnDiamond(
      shape.x + shape.width / 2,
      shape.y + shape.height / 2,
      shape.x,
      shape.y,
      shape.width,
      shape.height,
    );
  }

  if (shape.type === "circle") {
    if (anchor === "center") {
      return { x: shape.x, y: shape.y };
    }
    const radius = shape.radius;
    switch (anchor) {
      case "n":
        return { x: shape.x, y: shape.y - radius };
      case "s":
        return { x: shape.x, y: shape.y + radius };
      case "e":
        return { x: shape.x + radius, y: shape.y };
      case "w":
        return { x: shape.x - radius, y: shape.y };
      case "ne":
        return { x: shape.x + radius * 0.707, y: shape.y - radius * 0.707 };
      case "nw":
        return { x: shape.x - radius * 0.707, y: shape.y - radius * 0.707 };
      case "se":
        return { x: shape.x + radius * 0.707, y: shape.y + radius * 0.707 };
      case "sw":
        return { x: shape.x - radius * 0.707, y: shape.y + radius * 0.707 };
      default:
        return { x: shape.x + radius, y: shape.y };
    }
  }

  if (shape.type === "text") {
    const fontSize = shape.fontSize ?? 20;
    const width = Math.max(40, shape.text.length * fontSize * 0.55);
    const height = fontSize * 1.25;
    return rectLocalAnchor(shape.x, shape.y, width, height, anchor);
  }

  return null;
}

export function closestKonvaShapeMagnet(
  px: number,
  py: number,
  shape: KonvaShapeV1,
): { x: number; y: number; anchor: KonvaConnectorAnchorKind } | null {
  if (shape.type === "line" || shape.type === "arrow") {
    return null;
  }

  if (shape.type === "rect") {
    const local = closestPointOnRectPerimeter(
      px,
      py,
      shape.x,
      shape.y,
      shape.width,
      shape.height,
    );
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const rotated = rotatePoint(local.x, local.y, cx, cy, shape.rotation ?? 0);
    return { ...rotated, anchor: local.anchor };
  }

  if (shape.type === "diamond") {
    return closestPointOnDiamond(px, py, shape.x, shape.y, shape.width, shape.height);
  }

  if (shape.type === "circle") {
    return closestPointOnCircle(px, py, shape.x, shape.y, shape.radius);
  }

  if (shape.type === "text") {
    const fontSize = shape.fontSize ?? 20;
    const width = Math.max(40, shape.text.length * fontSize * 0.55);
    const height = fontSize * 1.25;
    return closestPointOnRectPerimeter(px, py, shape.x, shape.y, width, height);
  }

  return null;
}

export function resolveKonvaConnectorAttachPoint(
  attach: { shapeId: string; anchor?: KonvaConnectorAnchorKind },
  shapes: KonvaShapeV1[],
  fallback: { x: number; y: number },
): { x: number; y: number } {
  const target = shapes.find((shape) => shape.id === attach.shapeId);
  if (target == null) {
    return fallback;
  }
  const anchor = attach.anchor ?? "center";
  const point = konvaShapeAnchorPoint(target, anchor);
  return point ?? fallback;
}

const KONVA_SHAPE_MAGNET_ANCHORS: Record<
  "rect" | "circle" | "diamond" | "text",
  KonvaConnectorAnchorKind[]
> = {
  rect: ["n", "s", "e", "w", "ne", "nw", "se", "sw"],
  circle: ["n", "s", "e", "w", "ne", "nw", "se", "sw"],
  diamond: ["n", "e", "s", "w"],
  text: ["n", "s", "e", "w", "ne", "nw", "se", "sw"],
};

/** Visible magnet ports while drawing connectors (edge / corner anchors). */
export function listKonvaShapeMagnetPorts(
  shape: KonvaShapeV1,
): { x: number; y: number; anchor: KonvaConnectorAnchorKind }[] {
  if (shape.type === "line" || shape.type === "arrow") {
    return [];
  }
  if (shape.type === "rect") {
    return KONVA_SHAPE_MAGNET_ANCHORS.rect.flatMap((anchor) => {
      const point = konvaShapeAnchorPoint(shape, anchor);
      return point != null ? [{ ...point, anchor }] : [];
    });
  }
  if (shape.type === "circle") {
    return KONVA_SHAPE_MAGNET_ANCHORS.circle.flatMap((anchor) => {
      const point = konvaShapeAnchorPoint(shape, anchor);
      return point != null ? [{ ...point, anchor }] : [];
    });
  }
  if (shape.type === "diamond") {
    return KONVA_SHAPE_MAGNET_ANCHORS.diamond.flatMap((anchor) => {
      const point = konvaShapeAnchorPoint(shape, anchor);
      return point != null ? [{ ...point, anchor }] : [];
    });
  }
  if (shape.type === "text") {
    return KONVA_SHAPE_MAGNET_ANCHORS.text.flatMap((anchor) => {
      const point = konvaShapeAnchorPoint(shape, anchor);
      return point != null ? [{ ...point, anchor }] : [];
    });
  }
  return [];
}
