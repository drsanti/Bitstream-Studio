import type { StagePhysicsColliderV1 } from "../stage/stage-physics-colliders";
import type { FlowWirePhysicsRigidBodyV1 } from "../../features/editor/nodes/physics/flow-wire-physics-body";
import {
  flowWirePhysicsSceneFromEval,
  type FlowWirePhysicsSceneV1,
} from "../../features/editor/nodes/physics/flow-wire-physics-scene";

export type PhysicsWorldEvalConfig = {
  enabled?: boolean;
  gravityY?: number;
};

export function evaluatePhysicsWorldOutput(
  cfg: PhysicsWorldEvalConfig,
  colliders: readonly StagePhysicsColliderV1[] = [],
  rigidBodies: readonly FlowWirePhysicsRigidBodyV1[] = [],
): FlowWirePhysicsSceneV1 {
  const enabled = cfg.enabled !== false;
  const gravityY =
    typeof cfg.gravityY === "number" && Number.isFinite(cfg.gravityY)
      ? cfg.gravityY
      : -9.81;
  return flowWirePhysicsSceneFromEval(enabled, gravityY, colliders, rigidBodies);
}

/** Tier D1 physics catalog nodes — eval no-ops (no preview / WASM side effects). */
export const PHYSICS_DOMAIN_STUB_NODE_IDS = [
  "object-spawner",
  "fixed-joint",
  "hinge-joint",
  "ik-chain",
] as const;

export type PhysicsDomainStubNodeId = (typeof PHYSICS_DOMAIN_STUB_NODE_IDS)[number];

export function isPhysicsDomainStubNodeId(nodeId: string): nodeId is PhysicsDomainStubNodeId {
  return (PHYSICS_DOMAIN_STUB_NODE_IDS as readonly string[]).includes(nodeId);
}
