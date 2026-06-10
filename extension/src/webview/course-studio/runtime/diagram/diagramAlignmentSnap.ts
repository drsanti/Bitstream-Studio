import type { DiagramV1 } from "../../schemas/diagram.v1";
import { DIAGRAM_SNAP_GRID, snapDiagramCoord } from "./diagramCanvasSnap";
import { findDiagramNode, getNodeHitBounds, listDiagramNodes } from "./diagramNodeMutations";

export const DIAGRAM_ALIGN_SNAP_THRESHOLD = 4;

export type DiagramAlignBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DiagramAlignmentGuide = {
  axis: "x" | "y";
  position: number;
};

export type DiagramDragSnapResult = {
  dx: number;
  dy: number;
  guides: DiagramAlignmentGuide[];
};

function boxXLines(bounds: DiagramAlignBounds): number[] {
  return [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width];
}

function boxYLines(bounds: DiagramAlignBounds): number[] {
  return [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height];
}

function collectTargetLines(targets: DiagramAlignBounds[]): { x: number[]; y: number[] } {
  const x = new Set<number>();
  const y = new Set<number>();
  for (const target of targets) {
    for (const value of boxXLines(target)) {
      x.add(value);
    }
    for (const value of boxYLines(target)) {
      y.add(value);
    }
  }
  return { x: [...x], y: [...y] };
}

function bestAxisSnap(
  movingValues: number[],
  targetValues: number[],
  threshold: number,
): { shift: number; guide: number } | null {
  let best: { shift: number; guide: number; dist: number } | null = null;
  for (const moving of movingValues) {
    for (const target of targetValues) {
      const dist = Math.abs(moving - target);
      if (dist > threshold) {
        continue;
      }
      if (best == null || dist < best.dist) {
        best = { shift: target - moving, guide: target, dist };
      }
    }
  }
  if (best == null) {
    return null;
  }
  return { shift: best.shift, guide: best.guide };
}

/** Snap drag delta to peer edges/centers (after grid snap), return active guides. */
export function snapDiagramDragDelta(args: {
  startBounds: DiagramAlignBounds;
  dx: number;
  dy: number;
  targets: DiagramAlignBounds[];
  snapX?: boolean;
  snapY?: boolean;
  grid?: number;
  threshold?: number;
}): DiagramDragSnapResult {
  const {
    startBounds,
    dx,
    dy,
    targets,
    snapX = true,
    snapY = true,
    grid = DIAGRAM_SNAP_GRID,
    threshold = DIAGRAM_ALIGN_SNAP_THRESHOLD,
  } = args;

  let x = snapX ? snapDiagramCoord(startBounds.x + dx, grid) : startBounds.x + dx;
  let y = snapY ? snapDiagramCoord(startBounds.y + dy, grid) : startBounds.y + dy;
  const guides: DiagramAlignmentGuide[] = [];

  if (targets.length === 0) {
    return {
      dx: x - startBounds.x,
      dy: y - startBounds.y,
      guides,
    };
  }

  const { x: targetX, y: targetY } = collectTargetLines(targets);
  const moving: DiagramAlignBounds = {
    x,
    y,
    width: startBounds.width,
    height: startBounds.height,
  };

  if (snapX && targetX.length > 0) {
    const xSnap = bestAxisSnap(boxXLines(moving), targetX, threshold);
    if (xSnap != null) {
      x += xSnap.shift;
      guides.push({ axis: "x", position: xSnap.guide });
    }
  }

  if (snapY && targetY.length > 0) {
    const movingAfterX = { ...moving, x };
    const ySnap = bestAxisSnap(boxYLines(movingAfterX), targetY, threshold);
    if (ySnap != null) {
      y += ySnap.shift;
      guides.push({ axis: "y", position: ySnap.guide });
    }
  }

  return {
    dx: x - startBounds.x,
    dy: y - startBounds.y,
    guides,
  };
}

/** Snap a canvas point to grid + peer edge/center lines. */
export function snapDiagramCanvasPoint(args: {
  x: number;
  y: number;
  targets: DiagramAlignBounds[];
  snapEnabled?: boolean;
  grid?: number;
  threshold?: number;
}): { x: number; y: number; guides: DiagramAlignmentGuide[] } {
  const {
    x,
    y,
    targets,
    snapEnabled = true,
    grid = DIAGRAM_SNAP_GRID,
    threshold = DIAGRAM_ALIGN_SNAP_THRESHOLD,
  } = args;

  if (!snapEnabled) {
    return { x, y, guides: [] };
  }

  let sx = snapDiagramCoord(x, grid);
  let sy = snapDiagramCoord(y, grid);
  const guides: DiagramAlignmentGuide[] = [];

  if (targets.length === 0) {
    return { x: sx, y: sy, guides };
  }

  const { x: targetX, y: targetY } = collectTargetLines(targets);
  const xSnap = bestAxisSnap([sx], targetX, threshold);
  if (xSnap != null) {
    sx += xSnap.shift;
    guides.push({ axis: "x", position: xSnap.guide });
  }
  const ySnap = bestAxisSnap([sy], targetY, threshold);
  if (ySnap != null) {
    sy += ySnap.shift;
    guides.push({ axis: "y", position: ySnap.guide });
  }

  return { x: sx, y: sy, guides };
}

export function collectDiagramAlignTargets(
  diagram: DiagramV1,
  excludeNodeId: string,
): DiagramAlignBounds[] {
  const targets: DiagramAlignBounds[] = [];
  for (const entry of listDiagramNodes(diagram)) {
    if (entry.id === excludeNodeId) {
      continue;
    }
    const node = findDiagramNode(diagram, entry.id);
    if (node == null) {
      continue;
    }
    const bounds = getNodeHitBounds(node);
    if (bounds != null) {
      targets.push(bounds);
    }
  }
  return targets;
}

export function resolveDiagramDragSnapAxes(
  node: ReturnType<typeof findDiagramNode>,
): { snapX: boolean; snapY: boolean } {
  if (node == null) {
    return { snapX: false, snapY: false };
  }
  if (node.type === "rect") {
    return {
      snapX: typeof node.x === "number",
      snapY: typeof node.y === "number",
    };
  }
  if (node.type === "text") {
    return { snapX: true, snapY: true };
  }
  if (node.type === "ellipse") {
    return {
      snapX: typeof node.cx === "number",
      snapY: typeof node.cy === "number",
    };
  }
  if (node.type === "line" || node.type === "arrow") {
    return { snapX: true, snapY: true };
  }
  return { snapX: false, snapY: false };
}
