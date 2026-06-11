import { Vector3, type Camera } from "three";

export type PhysicsLabViewportScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const PHYSICS_LAB_MARQUEE_MIN_DRAG_PX = 4;

export function normalizePhysicsLabViewportScreenRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
): PhysicsLabViewportScreenRect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function physicsLabMarqueeIsDrag(rect: PhysicsLabViewportScreenRect): boolean {
  return (
    rect.width >= PHYSICS_LAB_MARQUEE_MIN_DRAG_PX ||
    rect.height >= PHYSICS_LAB_MARQUEE_MIN_DRAG_PX
  );
}

/** Box marquee — not while Alt orbit / Alt+Shift pan. */
export function shouldStartPhysicsLabViewportMarquee(
  event: Pick<PointerEvent, "altKey">,
): boolean {
  return !event.altKey;
}

export function physicsLabViewportPointInRect(
  point: { x: number; y: number },
  rect: PhysicsLabViewportScreenRect,
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function projectWorldPointToPhysicsLabViewport(
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

export function mergePhysicsLabBoxSelection(
  current: readonly string[],
  hits: readonly string[],
  additive: boolean,
): { selectedIds: string[]; activeId: string | null } {
  if (!additive) {
    const selectedIds = [...hits];
    return {
      selectedIds,
      activeId: selectedIds[selectedIds.length - 1] ?? null,
    };
  }
  const merged = new Set(current);
  for (const id of hits) {
    merged.add(id);
  }
  const selectedIds = [...merged];
  return {
    selectedIds,
    activeId: hits[hits.length - 1] ?? selectedIds[selectedIds.length - 1] ?? null,
  };
}
