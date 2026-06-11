import { Vector3, type Camera } from "three";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";
import {
  physicsLabMarqueeIsDrag,
  physicsLabViewportPointInRect,
  projectWorldPointToPhysicsLabViewport,
  type PhysicsLabViewportScreenRect,
} from "./physicsLabBoxSelection.js";

export type PhysicsLabBoxSelectProjector = (
  rect: PhysicsLabViewportScreenRect,
) => string[];

export function listPhysicsLabBodyIdsInViewportRect(
  rect: PhysicsLabViewportScreenRect,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
): string[] {
  if (viewportWidth <= 0 || viewportHeight <= 0 || !physicsLabMarqueeIsDrag(rect)) {
    return [];
  }

  const bodies = usePhysicsLabStore.getState().bodies;
  const hits: string[] = [];
  for (const body of bodies) {
    const world = new Vector3(...body.position);
    const screen = projectWorldPointToPhysicsLabViewport(
      world,
      camera,
      viewportWidth,
      viewportHeight,
    );
    if (physicsLabViewportPointInRect(screen, rect)) {
      hits.push(body.id);
    }
  }
  return hits;
}
