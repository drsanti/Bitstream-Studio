import type { Scene3DConfigV1 } from "../../../../core/scene3d/scene3d-config";
import type { StagePhysicsColliderV1 } from "../../../../core/stage/stage-physics-colliders";
import type { FlowWirePhysicsSceneV1 } from "./flow-wire-physics-scene";

/** Merge physics-world wire into persisted `scene3d.physics` (Stage / Model Viewer snapshot). */
export function mergeFlowWirePhysicsIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWirePhysicsSceneV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null || !wire.enabled) {
    return {
      ...scene3d,
      physics: { enabled: false, gravityY: -9.81 },
    };
  }
  return {
    ...scene3d,
    physics: {
      enabled: true,
      gravityY: wire.gravityY,
    },
  };
}

export function physicsCollidersFromWire(
  wire: FlowWirePhysicsSceneV1 | null | undefined,
): StagePhysicsColliderV1[] {
  if (wire == null || !wire.enabled) {
    return [];
  }
  return Array.isArray(wire.colliders) ? wire.colliders : [];
}
