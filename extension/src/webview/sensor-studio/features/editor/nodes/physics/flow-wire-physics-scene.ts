import type { StagePhysicsColliderV1 } from "../../../../core/stage/stage-physics-colliders";
import type { FlowWirePhysicsJointV1 } from "./flow-wire-physics-joint";
import type { FlowWirePhysicsRigidBodyV1 } from "./flow-wire-physics-body";
import type { FlowWirePhysicsSpawnerV1 } from "./flow-wire-physics-spawner";

/** Structured physics scene on **`physicsScene`** wires (physics-world → Scene Output / Model Viewer). */
export type FlowWirePhysicsSceneV1 = {
  kind: "physicsScene";
  version: 1;
  enabled: boolean;
  gravityY: number;
  colliders: StagePhysicsColliderV1[];
  rigidBodies: FlowWirePhysicsRigidBodyV1[];
  joints: FlowWirePhysicsJointV1[];
  spawners: FlowWirePhysicsSpawnerV1[];
};

export function flowWirePhysicsSceneFromEval(
  enabled: boolean,
  gravityY: number,
  colliders: readonly StagePhysicsColliderV1[] = [],
  rigidBodies: readonly FlowWirePhysicsRigidBodyV1[] = [],
  joints: readonly FlowWirePhysicsJointV1[] = [],
  spawners: readonly FlowWirePhysicsSpawnerV1[] = [],
): FlowWirePhysicsSceneV1 {
  return {
    kind: "physicsScene",
    version: 1,
    enabled,
    gravityY,
    colliders: [...colliders],
    rigidBodies: [...rigidBodies],
    joints: [...joints],
    spawners: [...spawners],
  };
}

export function isFlowWirePhysicsSceneV1(v: unknown): v is FlowWirePhysicsSceneV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWirePhysicsSceneV1).kind === "physicsScene" &&
    (v as FlowWirePhysicsSceneV1).version === 1
  );
}

export function coerceFlowWirePhysicsSceneV1(raw: unknown): FlowWirePhysicsSceneV1 {
  if (!isFlowWirePhysicsSceneV1(raw)) {
    return flowWirePhysicsSceneFromEval(false, -9.81);
  }
  const enabled = raw.enabled !== false;
  const gravityY =
    typeof raw.gravityY === "number" && Number.isFinite(raw.gravityY)
      ? raw.gravityY
      : -9.81;
  const colliders = Array.isArray(raw.colliders) ? raw.colliders : [];
  const rigidBodies = Array.isArray(raw.rigidBodies) ? raw.rigidBodies : [];
  const joints = Array.isArray(raw.joints) ? raw.joints : [];
  const spawners = Array.isArray(raw.spawners) ? raw.spawners : [];
  return flowWirePhysicsSceneFromEval(
    enabled,
    gravityY,
    colliders,
    rigidBodies,
    joints,
    spawners,
  );
}
