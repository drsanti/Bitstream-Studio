import { Quaternion, Vector3 } from "three";
import type { Camera } from "three";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import { computeDiagram3dNodeWorldMatrix } from "../diagram/diagram3dHierarchyTransform";
import { listDiagram3dNodes } from "../diagram/diagram3dNodeMutations";

export type Scene3dViewportScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const SCENE_3D_VIEWPORT_MARQUEE_MIN_DRAG_PX = 4;

export function normalizeScene3dViewportScreenRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
): Scene3dViewportScreenRect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function scene3dViewportMarqueeIsDrag(rect: Scene3dViewportScreenRect): boolean {
  return (
    rect.width >= SCENE_3D_VIEWPORT_MARQUEE_MIN_DRAG_PX ||
    rect.height >= SCENE_3D_VIEWPORT_MARQUEE_MIN_DRAG_PX
  );
}

/** Box marquee is for plain LMB drag and Shift+LMB drag — not Alt (orbit) or Alt+Shift (pan). */
export function shouldStartScene3dViewportMarquee(
  event: Pick<PointerEvent, "altKey">,
): boolean {
  return !event.altKey;
}

export function scene3dViewportPointInRect(
  point: { x: number; y: number },
  rect: Scene3dViewportScreenRect,
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function projectWorldPointToViewport(
  world: Vector3,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const projected = world.clone().project(camera);
  return {
    x: ((projected.x + 1) / 2) * viewportWidth,
    y: ((1 - projected.y) / 2) * viewportHeight,
  };
}

export function listDiagram3dNodeIdsInViewportRect(
  diagram: DiagramV1,
  rect: Scene3dViewportScreenRect,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
): string[] {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return [];
  }
  if (!scene3dViewportMarqueeIsDrag(rect)) {
    return [];
  }

  const hits: string[] = [];
  for (const entry of listDiagram3dNodes(diagram)) {
    const worldMatrix = computeDiagram3dNodeWorldMatrix(diagram, entry.id);
    if (worldMatrix == null) {
      continue;
    }
    const world = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    worldMatrix.decompose(world, quaternion, scale);
    const screen = projectWorldPointToViewport(world, camera, viewportWidth, viewportHeight);
    if (scene3dViewportPointInRect(screen, rect)) {
      hits.push(entry.id);
    }
  }
  return hits;
}

export function mergeScene3dViewportBoxSelection(
  current: readonly string[],
  hits: readonly string[],
  additive: boolean,
): { selected: string[]; active: string | null } {
  if (!additive) {
    const selected = [...hits];
    return {
      selected,
      active: selected[selected.length - 1] ?? null,
    };
  }
  const merged = new Set(current);
  for (const id of hits) {
    merged.add(id);
  }
  const selected = [...merged];
  return {
    selected,
    active: hits[hits.length - 1] ?? selected[selected.length - 1] ?? null,
  };
}
