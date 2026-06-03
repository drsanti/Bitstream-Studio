import type { StagePhysicsColliderV1 } from "../../../../core/stage/stage-physics-colliders";

/** Collider shape on **`physicsCollider`** wires (box/sphere catalog nodes → physics-world). */
export type FlowWirePhysicsColliderV1 = StagePhysicsColliderV1 & {
  kindWire: "physicsCollider";
};

export function flowWirePhysicsColliderFromStage(
  collider: StagePhysicsColliderV1,
): FlowWirePhysicsColliderV1 {
  return { ...collider, kindWire: "physicsCollider" };
}

export function isFlowWirePhysicsColliderV1(v: unknown): v is FlowWirePhysicsColliderV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWirePhysicsColliderV1).version === 1 &&
    ((v as FlowWirePhysicsColliderV1).kind === "box" ||
      (v as FlowWirePhysicsColliderV1).kind === "sphere")
  );
}
