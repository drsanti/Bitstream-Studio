import type {
  KonvaBezierKnot,
  KonvaConnectorAttach,
  KonvaConnectorCurve,
  KonvaConnectorPathMode,
  KonvaConnectorPoint,
} from "../../schemas/konvaConnector";
import type { KonvaConnectorShapeV1, KonvaShapeV1 } from "../../schemas/konvaShapes";
import { isKonvaConnectorShape, isKonvaGroupShape } from "../../schemas/konvaShapes";
import { flattenKonvaShapesToWorld } from "./konvaShapeTree";
import { resolveKonvaConnectorAttachPoint } from "./konvaConnectorAnchor";

export type KonvaConnectorEndpoints = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function getKonvaConnectorPathMode(shape: KonvaConnectorShapeV1): KonvaConnectorPathMode {
  if (shape.pathMode != null) {
    return shape.pathMode;
  }
  if (shape.curve != null) {
    return "quadratic";
  }
  if (shape.waypoints != null && shape.waypoints.length > 0) {
    return "spline";
  }
  if (shape.knots != null && shape.knots.length > 0) {
    return "bezier";
  }
  if (shape.vertices != null && shape.vertices.length > 0) {
    return "tension";
  }
  return "straight";
}

export function konvaConnectorEndpoints(shape: KonvaConnectorShapeV1): KonvaConnectorEndpoints {
  return { x1: shape.x1, y1: shape.y1, x2: shape.x2, y2: shape.y2 };
}

export function defaultKonvaQuadraticControl(
  endpoints: KonvaConnectorEndpoints,
  bend = 24,
): KonvaConnectorCurve {
  const { x1, y1, x2, y2 } = endpoints;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) {
    return { cx: midX, cy: midY - bend };
  }
  const nx = -dy / length;
  const ny = dx / length;
  return { cx: midX + nx * bend, cy: midY + ny * bend };
}

function cubicSegment(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
): string {
  return `C ${x1} ${y1} ${x2} ${y2} ${x3} ${y3}`;
}

function catmullRomToBezier(
  p0: KonvaConnectorPoint,
  p1: KonvaConnectorPoint,
  p2: KonvaConnectorPoint,
  p3: KonvaConnectorPoint,
  tension = 0.5,
): { cp1: KonvaConnectorPoint; cp2: KonvaConnectorPoint; end: KonvaConnectorPoint } {
  const t = tension;
  return {
    cp1: {
      x: p1.x + ((p2.x - p0.x) / 6) * t * 2,
      y: p1.y + ((p2.y - p0.y) / 6) * t * 2,
    },
    cp2: {
      x: p2.x - ((p3.x - p1.x) / 6) * t * 2,
      y: p2.y - ((p3.y - p1.y) / 6) * t * 2,
    },
    end: p2,
  };
}

function buildSplinePath(points: KonvaConnectorPoint[], tension = 0.5): string {
  if (points.length < 2) {
    return "";
  }
  if (points.length === 2) {
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;
  }
  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)]!;
    const p1 = points[index]!;
    const p2 = points[index + 1]!;
    const p3 = points[Math.min(points.length - 1, index + 2)]!;
    const segment = catmullRomToBezier(p0, p1, p2, p3, tension);
    path += ` ${cubicSegment(p1.x, p1.y, segment.cp1.x, segment.cp1.y, segment.cp2.x, segment.cp2.y, segment.end.x, segment.end.y)}`;
  }
  return path;
}

function autoBezierHandles(
  prev: KonvaConnectorPoint,
  current: KonvaConnectorPoint,
  next: KonvaConnectorPoint,
): { cpIn: KonvaConnectorPoint; cpOut: KonvaConnectorPoint } {
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) {
    return { cpIn: current, cpOut: current };
  }
  const scale = Math.min(48, len / 4);
  const ux = dx / len;
  const uy = dy / len;
  return {
    cpIn: { x: current.x - ux * scale, y: current.y - uy * scale },
    cpOut: { x: current.x + ux * scale, y: current.y + uy * scale },
  };
}

function buildBezierPath(
  start: KonvaConnectorPoint,
  knots: KonvaBezierKnot[],
  end: KonvaConnectorPoint,
): string {
  if (knots.length === 0) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  let path = `M ${start.x} ${start.y}`;
  let previous = start;
  for (let index = 0; index < knots.length; index += 1) {
    const knot = knots[index]!;
    const next = index === knots.length - 1 ? end : knots[index + 1]!;
    const prev = index === 0 ? start : knots[index - 1]!;
    const auto = autoBezierHandles(prev, knot, next);
    const cpOut = knot.cpOut ?? auto.cpOut;
    const cpIn = knot.cpIn ?? auto.cpIn;
    path += ` ${cubicSegment(previous.x, previous.y, cpOut.x, cpOut.y, cpIn.x, cpIn.y, knot.x, knot.y)}`;
    previous = knot;
  }
  const last = knots[knots.length - 1]!;
  const autoEnd = autoBezierHandles(
    knots.length > 1 ? knots[knots.length - 2]! : start,
    last,
    end,
  );
  const cpOut = last.cpOut ?? autoEnd.cpOut;
  path += ` ${cubicSegment(last.x, last.y, cpOut.x, cpOut.y, end.x, end.y, end.x, end.y)}`;
  return path;
}

/** Manhattan routing between consecutive points (horizontal then vertical). */
export function buildOrthogonalPath(points: KonvaConnectorPoint[]): string {
  if (points.length < 2) {
    return "";
  }
  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]!;
    const to = points[index + 1]!;
    if (Math.abs(from.x - to.x) < 0.001 || Math.abs(from.y - to.y) < 0.001) {
      path += ` L ${to.x} ${to.y}`;
      continue;
    }
    const corner =
      Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)
        ? { x: to.x, y: from.y }
        : { x: from.x, y: to.y };
    path += ` L ${corner.x} ${corner.y} L ${to.x} ${to.y}`;
  }
  return path;
}

export function defaultKonvaOrthogonalWaypoint(
  endpoints: KonvaConnectorEndpoints,
): KonvaConnectorPoint {
  const { x1, y1, x2, y2 } = endpoints;
  if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
    return { x: x2, y: y1 };
  }
  return { x: x1, y: y2 };
}

export function buildKonvaConnectorPathData(shape: KonvaConnectorShapeV1): string {
  const { x1, y1, x2, y2 } = shape;
  const mode = getKonvaConnectorPathMode(shape);
  if (mode === "straight") {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  if (mode === "quadratic") {
    const curve = shape.curve ?? defaultKonvaQuadraticControl(shape);
    return `M ${x1} ${y1} Q ${curve.cx} ${curve.cy} ${x2} ${y2}`;
  }
  if (mode === "spline") {
    const points: KonvaConnectorPoint[] = [
      { x: x1, y: y1 },
      ...(shape.waypoints ?? []),
      { x: x2, y: y2 },
    ];
    return buildSplinePath(points, 0.5);
  }
  if (mode === "bezier") {
    return buildBezierPath({ x: x1, y: y1 }, shape.knots ?? [], { x: x2, y: y2 });
  }
  if (mode === "orthogonal") {
    const points: KonvaConnectorPoint[] = [
      { x: x1, y: y1 },
      ...(shape.waypoints ?? []),
      { x: x2, y: y2 },
    ];
    return buildOrthogonalPath(points);
  }
  const tension = shape.tension ?? 0.5;
  const points: KonvaConnectorPoint[] = [
    { x: x1, y: y1 },
    ...(shape.vertices ?? []),
    { x: x2, y: y2 },
  ];
  return buildSplinePath(points, tension);
}

export function konvaConnectorUsesPathShape(shape: KonvaConnectorShapeV1): boolean {
  return getKonvaConnectorPathMode(shape) !== "straight";
}

export function konvaConnectorPathBounds(shape: KonvaConnectorShapeV1): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const xs = [shape.x1, shape.x2];
  const ys = [shape.y1, shape.y2];
  const mode = getKonvaConnectorPathMode(shape);
  if (mode === "quadratic" && shape.curve != null) {
    xs.push(shape.curve.cx);
    ys.push(shape.curve.cy);
  }
  for (const point of shape.waypoints ?? []) {
    xs.push(point.x);
    ys.push(point.y);
  }
  for (const point of shape.vertices ?? []) {
    xs.push(point.x);
    ys.push(point.y);
  }
  for (const knot of shape.knots ?? []) {
    xs.push(knot.x, knot.cpIn?.x ?? knot.x, knot.cpOut?.x ?? knot.x);
    ys.push(knot.y, knot.cpIn?.y ?? knot.y, knot.cpOut?.y ?? knot.y);
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const pad = 12;
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(4, maxX - minX + pad * 2),
    height: Math.max(4, maxY - minY + pad * 2),
  };
}

export function konvaConnectorEndTangent(shape: KonvaConnectorShapeV1): {
  x: number;
  y: number;
  angle: number;
} {
  const { x1, y1, x2, y2 } = shape;
  const mode = getKonvaConnectorPathMode(shape);
  let dx = x2 - x1;
  let dy = y2 - y1;
  if (mode === "quadratic") {
    const curve = shape.curve ?? defaultKonvaQuadraticControl(shape);
    dx = x2 - curve.cx;
    dy = y2 - curve.cy;
  } else if (mode === "spline" || mode === "tension") {
    const middle =
      mode === "spline"
        ? shape.waypoints?.[shape.waypoints.length - 1]
        : shape.vertices?.[shape.vertices.length - 1];
    if (middle != null) {
      dx = x2 - middle.x;
      dy = y2 - middle.y;
    }
  } else if (mode === "bezier") {
    const knots = shape.knots ?? [];
    const last = knots[knots.length - 1];
    if (last?.cpOut != null) {
      dx = x2 - last.cpOut.x;
      dy = y2 - last.cpOut.y;
    } else if (last != null) {
      dx = x2 - last.x;
      dy = y2 - last.y;
    }
  }
  return { x: x2, y: y2, angle: Math.atan2(dy, dx) };
}

export function konvaConnectorArrowHeadPoints(
  x: number,
  y: number,
  angle: number,
  pointerLength: number,
  pointerWidth: number,
): number[] {
  const backX = x - Math.cos(angle) * pointerLength;
  const backY = y - Math.sin(angle) * pointerLength;
  const leftX = backX + Math.cos(angle + Math.PI / 2) * (pointerWidth / 2);
  const leftY = backY + Math.sin(angle + Math.PI / 2) * (pointerWidth / 2);
  const rightX = backX + Math.cos(angle - Math.PI / 2) * (pointerWidth / 2);
  const rightY = backY + Math.sin(angle - Math.PI / 2) * (pointerWidth / 2);
  return [x, y, leftX, leftY, rightX, rightY];
}

export function translateKonvaConnectorGeometry(
  shape: KonvaConnectorShapeV1,
  dx: number,
  dy: number,
  options?: { clearAttachments?: boolean },
): KonvaConnectorShapeV1 {
  const next: KonvaConnectorShapeV1 = {
    ...shape,
    x1: shape.x1 + dx,
    y1: shape.y1 + dy,
    x2: shape.x2 + dx,
    y2: shape.y2 + dy,
  };
  if (shape.curve != null) {
    next.curve = { cx: shape.curve.cx + dx, cy: shape.curve.cy + dy };
  }
  if (shape.waypoints != null) {
    next.waypoints = shape.waypoints.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    }));
  }
  if (shape.vertices != null) {
    next.vertices = shape.vertices.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    }));
  }
  if (shape.knots != null) {
    next.knots = shape.knots.map((knot) => ({
      x: knot.x + dx,
      y: knot.y + dy,
      cpIn: knot.cpIn != null ? { x: knot.cpIn.x + dx, y: knot.cpIn.y + dy } : undefined,
      cpOut: knot.cpOut != null ? { x: knot.cpOut.x + dx, y: knot.cpOut.y + dy } : undefined,
    }));
  }
  if (options?.clearAttachments) {
    delete next.startAttach;
    delete next.endAttach;
  }
  return next;
}

export function resolveKonvaConnectorShape(
  shape: KonvaConnectorShapeV1,
  worldShapes: KonvaShapeV1[],
): KonvaConnectorShapeV1 {
  let next = shape;
  if (shape.startAttach != null) {
    const point = resolveKonvaConnectorAttachPoint(shape.startAttach, worldShapes, {
      x: shape.x1,
      y: shape.y1,
    });
    next = { ...next, x1: point.x, y1: point.y };
  }
  if (shape.endAttach != null) {
    const point = resolveKonvaConnectorAttachPoint(shape.endAttach, worldShapes, {
      x: shape.x2,
      y: shape.y2,
    });
    next = { ...next, x2: point.x, y2: point.y };
  }
  return next;
}

function resolveConnectorInTree(shape: KonvaShapeV1, worldShapes: KonvaShapeV1[]): KonvaShapeV1 {
  if (isKonvaGroupShape(shape)) {
    return {
      ...shape,
      children: shape.children.map((child) => resolveConnectorInTree(child, worldShapes)),
    };
  }
  if (isKonvaConnectorShape(shape)) {
    return resolveKonvaConnectorShape(shape, worldShapes);
  }
  return shape;
}

export function resolveKonvaConnectors(shapes: KonvaShapeV1[]): KonvaShapeV1[] {
  const worldShapes = flattenKonvaShapesToWorld(shapes);
  return shapes.map((shape) => resolveConnectorInTree(shape, worldShapes));
}

export function syncKonvaConnectorsForMovedShapes(
  shapes: KonvaShapeV1[],
  movedShapeIds: string[],
): KonvaShapeV1[] {
  const moved = new Set(movedShapeIds);
  const worldShapes = flattenKonvaShapesToWorld(shapes);

  const syncShape = (shape: KonvaShapeV1): KonvaShapeV1 => {
    if (isKonvaGroupShape(shape)) {
      return {
        ...shape,
        children: shape.children.map((child) => syncShape(child)),
      };
    }
    if (!isKonvaConnectorShape(shape)) {
      return shape;
    }
    const touches =
      (shape.startAttach != null && moved.has(shape.startAttach.shapeId)) ||
      (shape.endAttach != null && moved.has(shape.endAttach.shapeId));
    if (!touches) {
      return shape;
    }
    return resolveKonvaConnectorShape(shape, worldShapes);
  };

  return shapes.map((shape) => syncShape(shape));
}

export function convertKonvaConnectorPathMode(
  shape: KonvaConnectorShapeV1,
  nextMode: KonvaConnectorPathMode,
): KonvaConnectorShapeV1 {
  const currentMode = getKonvaConnectorPathMode(shape);
  if (currentMode === nextMode) {
    return { ...shape, pathMode: nextMode };
  }

  const endpoints = konvaConnectorEndpoints(shape);
  const base: KonvaConnectorShapeV1 = {
    ...shape,
    pathMode: nextMode,
    curve: undefined,
    waypoints: undefined,
    knots: undefined,
    vertices: undefined,
    tension: undefined,
  };

  if (nextMode === "straight") {
    return base;
  }

  if (nextMode === "quadratic") {
    const curve =
      shape.curve ??
      (shape.waypoints?.[0] != null
        ? { cx: shape.waypoints[0].x, cy: shape.waypoints[0].y }
        : defaultKonvaQuadraticControl(endpoints));
    return { ...base, curve };
  }

  if (nextMode === "spline") {
    const waypoints =
      shape.waypoints ??
      (shape.curve != null ? [{ x: shape.curve.cx, y: shape.curve.cy }] : []);
    return { ...base, waypoints };
  }

  if (nextMode === "orthogonal") {
    const waypoints =
      shape.waypoints ??
      (shape.curve != null
        ? [{ x: shape.curve.cx, y: shape.curve.cy }]
        : [defaultKonvaOrthogonalWaypoint(endpoints)]);
    return { ...base, waypoints };
  }

  if (nextMode === "tension") {
    const vertices =
      shape.vertices ??
      shape.waypoints ??
      (shape.curve != null ? [{ x: shape.curve.cx, y: shape.curve.cy }] : []);
    return { ...base, vertices, tension: shape.tension ?? 0.5 };
  }

  const knots =
    shape.knots ??
    (shape.waypoints ?? []).map((point) => ({ x: point.x, y: point.y })) ??
    (shape.curve != null ? [{ x: shape.curve.cx, y: shape.curve.cy }] : []);
  return { ...base, knots };
}

export const KONVA_CONNECTOR_MIN_WAYPOINT_DISTANCE = 8;

function konvaConnectorPointDistanceSquared(
  a: KonvaConnectorPoint,
  b: KonvaConnectorPoint,
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function closestPointOnConnectorSegment(
  point: KonvaConnectorPoint,
  start: KonvaConnectorPoint,
  end: KonvaConnectorPoint,
): { point: KonvaConnectorPoint; distSq: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) {
    return {
      point: start,
      distSq: konvaConnectorPointDistanceSquared(point, start),
    };
  }
  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq),
  );
  const projected = { x: start.x + t * dx, y: start.y + t * dy };
  return {
    point: projected,
    distSq: konvaConnectorPointDistanceSquared(point, projected),
  };
}

function konvaConnectorChainMiddle(chain: KonvaConnectorPoint[]): KonvaConnectorPoint[] {
  return chain.slice(1, Math.max(1, chain.length - 1));
}

export function konvaConnectorPointChain(shape: KonvaConnectorShapeV1): KonvaConnectorPoint[] {
  const mode = getKonvaConnectorPathMode(shape);
  const start = { x: shape.x1, y: shape.y1 };
  const end = { x: shape.x2, y: shape.y2 };
  if (mode === "quadratic" && shape.curve != null) {
    return [start, { x: shape.curve.cx, y: shape.curve.cy }, end];
  }
  if (mode === "spline") {
    return [start, ...(shape.waypoints ?? []), end];
  }
  if (mode === "orthogonal") {
    return [start, ...(shape.waypoints ?? []), end];
  }
  if (mode === "tension") {
    return [start, ...(shape.vertices ?? []), end];
  }
  if (mode === "bezier") {
    return [start, ...(shape.knots ?? []).map((knot) => ({ x: knot.x, y: knot.y })), end];
  }
  return [start, end];
}

function insertKonvaConnectorPointInChain(
  chain: KonvaConnectorPoint[],
  point: KonvaConnectorPoint,
): KonvaConnectorPoint[] | null {
  const minDistSq = KONVA_CONNECTOR_MIN_WAYPOINT_DISTANCE ** 2;
  for (const existing of chain) {
    if (konvaConnectorPointDistanceSquared(existing, point) < minDistSq) {
      return null;
    }
  }
  if (chain.length < 2) {
    return [...chain, point];
  }

  let insertAt = 1;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (let index = 0; index < chain.length - 1; index += 1) {
    const segment = closestPointOnConnectorSegment(point, chain[index]!, chain[index + 1]!);
    if (segment.distSq < bestDistSq) {
      bestDistSq = segment.distSq;
      insertAt = index + 1;
    }
  }

  const next = [...chain];
  next.splice(insertAt, 0, point);
  return next;
}

function clearKonvaConnectorPathFields(
  shape: KonvaConnectorShapeV1,
): KonvaConnectorShapeV1 {
  return {
    ...shape,
    curve: undefined,
    waypoints: undefined,
    vertices: undefined,
    knots: undefined,
    tension: undefined,
  };
}

/** Insert a bend / waypoint at the nearest segment to `point`. Returns null if too close to an existing point. */
export function insertKonvaConnectorBendPoint(
  shape: KonvaConnectorShapeV1,
  point: KonvaConnectorPoint,
): KonvaConnectorShapeV1 | null {
  const mode = getKonvaConnectorPathMode(shape);
  const chain = konvaConnectorPointChain(shape);
  const nextChain = insertKonvaConnectorPointInChain(chain, point);
  if (nextChain == null || nextChain.length <= chain.length) {
    return null;
  }
  const middle = konvaConnectorChainMiddle(nextChain);

  if (mode === "tension") {
    return {
      ...clearKonvaConnectorPathFields(shape),
      pathMode: "tension",
      vertices: middle,
      tension: shape.tension ?? 0.5,
    };
  }

  if (mode === "bezier") {
    return {
      ...clearKonvaConnectorPathFields(shape),
      pathMode: "bezier",
      knots: middle.map((entry) => ({ x: entry.x, y: entry.y })),
    };
  }

  if (mode === "orthogonal") {
    return {
      ...clearKonvaConnectorPathFields(shape),
      pathMode: "orthogonal",
      waypoints: middle,
    };
  }

  return {
    ...clearKonvaConnectorPathFields(shape),
    pathMode: "spline",
    waypoints: middle,
  };
}

function konvaConnectorShapeFromMiddlePoints(
  shape: KonvaConnectorShapeV1,
  mode: KonvaConnectorPathMode,
  middle: KonvaConnectorPoint[],
): KonvaConnectorShapeV1 {
  if (middle.length === 0) {
    return {
      ...clearKonvaConnectorPathFields(shape),
      pathMode: "straight",
    };
  }
  if (mode === "tension") {
    return {
      ...clearKonvaConnectorPathFields(shape),
      pathMode: "tension",
      vertices: middle,
      tension: shape.tension ?? 0.5,
    };
  }
  if (mode === "bezier") {
    return {
      ...clearKonvaConnectorPathFields(shape),
      pathMode: "bezier",
      knots: middle.map((entry) => ({ x: entry.x, y: entry.y })),
    };
  }
  if (mode === "orthogonal") {
    return {
      ...clearKonvaConnectorPathFields(shape),
      pathMode: "orthogonal",
      waypoints: middle,
    };
  }
  return {
    ...clearKonvaConnectorPathFields(shape),
    pathMode: "spline",
    waypoints: middle,
  };
}

/** Remove a middle bend by index (0 = first waypoint / knot / vertex). Returns null if index invalid. */
export function removeKonvaConnectorBendPointAt(
  shape: KonvaConnectorShapeV1,
  index: number,
): KonvaConnectorShapeV1 | null {
  const mode = getKonvaConnectorPathMode(shape);

  if (mode === "quadratic") {
    if (index !== 0) {
      return null;
    }
    return {
      ...clearKonvaConnectorPathFields(shape),
      pathMode: "straight",
    };
  }

  if (mode === "straight") {
    return null;
  }

  let middle: KonvaConnectorPoint[] = [];
  if (mode === "spline" || mode === "orthogonal") {
    middle = [...(shape.waypoints ?? [])];
  } else if (mode === "tension") {
    middle = [...(shape.vertices ?? [])];
  } else if (mode === "bezier") {
    middle = (shape.knots ?? []).map((knot) => ({ x: knot.x, y: knot.y }));
  }

  if (index < 0 || index >= middle.length) {
    return null;
  }
  middle.splice(index, 1);
  return konvaConnectorShapeFromMiddlePoints(shape, mode, middle);
}

/** Index of the middle bend nearest to `point`, or -1 when none exist. */
export function findNearestKonvaConnectorBendIndex(
  shape: KonvaConnectorShapeV1,
  point: KonvaConnectorPoint,
): number {
  const mode = getKonvaConnectorPathMode(shape);
  if (mode === "straight") {
    return -1;
  }

  let middle: KonvaConnectorPoint[] = [];
  if (mode === "quadratic" && shape.curve != null) {
    middle = [{ x: shape.curve.cx, y: shape.curve.cy }];
  } else if (mode === "spline" || mode === "orthogonal") {
    middle = shape.waypoints ?? [];
  } else if (mode === "tension") {
    middle = shape.vertices ?? [];
  } else if (mode === "bezier") {
    middle = (shape.knots ?? []).map((knot) => ({ x: knot.x, y: knot.y }));
  }

  if (middle.length === 0) {
    return -1;
  }

  let bestIndex = 0;
  let bestDist = konvaConnectorPointDistanceSquared(point, middle[0]!);
  for (let index = 1; index < middle.length; index += 1) {
    const entry = middle[index];
    if (entry == null) {
      continue;
    }
    const dist = konvaConnectorPointDistanceSquared(point, entry);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = index;
    }
  }
  return bestIndex;
}

/** Remove the bend closest to `point`. Returns null when no bend can be removed. */
export function removeKonvaConnectorBendPointNear(
  shape: KonvaConnectorShapeV1,
  point: KonvaConnectorPoint,
): KonvaConnectorShapeV1 | null {
  const index = findNearestKonvaConnectorBendIndex(shape, point);
  if (index < 0) {
    return null;
  }
  return removeKonvaConnectorBendPointAt(shape, index);
}

export type KonvaConnectorEndpointCommit = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  startAttach?: KonvaConnectorAttach;
  endAttach?: KonvaConnectorAttach;
};

export function patchKonvaConnectorEndpoints(
  shape: KonvaConnectorShapeV1,
  patch: Partial<KonvaConnectorEndpointCommit> & {
    startAttach?: KonvaConnectorAttach | null;
    endAttach?: KonvaConnectorAttach | null;
  },
): KonvaConnectorShapeV1 {
  const { startAttach, endAttach, ...rest } = patch;
  const next: KonvaConnectorShapeV1 = { ...shape, ...rest };
  if (startAttach === null) {
    delete next.startAttach;
  } else if (startAttach !== undefined) {
    next.startAttach = startAttach;
  }
  if (endAttach === null) {
    delete next.endAttach;
  } else if (endAttach !== undefined) {
    next.endAttach = endAttach;
  }
  return next;
}
