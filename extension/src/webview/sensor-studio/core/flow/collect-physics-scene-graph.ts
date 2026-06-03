import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import {
  flowWirePhysicsColliderFromStage,
  isFlowWirePhysicsColliderV1,
  type FlowWirePhysicsColliderV1,
} from "../../features/editor/nodes/physics/flow-wire-physics-collider";
import {
  flowWirePhysicsRigidBodyFromConfig,
  isFlowWirePhysicsRigidBodyV1,
  type FlowWirePhysicsRigidBodyV1,
} from "../../features/editor/nodes/physics/flow-wire-physics-body";
import {
  collectStagePhysicsCollidersFromGraph,
  colliderFromBoxColliderConfig,
  colliderFromSphereColliderConfig,
  type StagePhysicsColliderV1,
} from "../stage/stage-physics-colliders";

export const PHYSICS_WORLD_HANDLE_SHAPES = "shapes";
export const PHYSICS_WORLD_HANDLE_BODIES = "bodies";

/** Colliders wired into **physics-world** `shapes` (+ optional unwired graph nodes when enabled). */
export function collectPhysicsCollidersForWorld(args: {
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  physicsWorldNodeId: string;
  pinValues: Map<string, unknown>;
  includeUnwiredGraphNodes: boolean;
}): StagePhysicsColliderV1[] {
  const { nodes, edges, physicsWorldNodeId, pinValues, includeUnwiredGraphNodes } = args;
  const byId = new Map<string, StagePhysicsColliderV1>();

  for (const edge of edges) {
    if (edge.target !== physicsWorldNodeId) {
      continue;
    }
    if ((edge.targetHandle ?? PHYSICS_WORLD_HANDLE_SHAPES) !== PHYSICS_WORLD_HANDLE_SHAPES) {
      continue;
    }
    const sh = edge.sourceHandle ?? "out";
    const key = `${edge.source}\u0000${sh}`;
    const v = pinValues.get(key);
    if (isFlowWirePhysicsColliderV1(v)) {
      byId.set(v.sourceNodeId, v);
      continue;
    }
    const src = nodes.find((n) => n.id === edge.source);
    if (src?.data.nodeId === "box-collider") {
      byId.set(src.id, evaluateBoxColliderOutput(src));
    } else if (src?.data.nodeId === "sphere-collider") {
      byId.set(src.id, evaluateSphereColliderOutput(src));
    }
  }

  if (includeUnwiredGraphNodes) {
    for (const c of collectStagePhysicsCollidersFromGraph(nodes)) {
      if (!byId.has(c.sourceNodeId)) {
        byId.set(c.sourceNodeId, c);
      }
    }
  }

  return [...byId.values()];
}

export function collectPhysicsRigidBodiesForWorld(args: {
  edges: readonly Edge[];
  physicsWorldNodeId: string;
  pinValues: Map<string, unknown>;
}): FlowWirePhysicsRigidBodyV1[] {
  const { edges, physicsWorldNodeId, pinValues } = args;
  const bodies: FlowWirePhysicsRigidBodyV1[] = [];
  const seen = new Set<string>();
  for (const edge of edges) {
    if (edge.target !== physicsWorldNodeId) {
      continue;
    }
    if ((edge.targetHandle ?? PHYSICS_WORLD_HANDLE_BODIES) !== PHYSICS_WORLD_HANDLE_BODIES) {
      continue;
    }
    const sh = edge.sourceHandle ?? "out";
    const key = `${edge.source}\u0000${sh}`;
    let body = pinValues.get(key);
    if (!isFlowWirePhysicsRigidBodyV1(body)) {
      const src = nodes.find((n) => n.id === edge.source);
      if (src?.data.nodeId === "rigid-body") {
        const dc = src.data.defaultConfig as Record<string, unknown>;
        const label =
          typeof src.data.label === "string" && src.data.label.trim().length > 0
            ? src.data.label.trim()
            : "rigid-body";
        body = flowWirePhysicsRigidBodyFromConfig(src.id, label, dc);
      }
    }
    if (isFlowWirePhysicsRigidBodyV1(body) && !seen.has(edge.source)) {
      seen.add(edge.source);
      bodies.push(body);
    }
  }
  return bodies;
}

export function evaluateBoxColliderOutput(node: FlowGraphNode): FlowWirePhysicsColliderV1 {
  const dc = node.data.defaultConfig as Record<string, unknown>;
  const label =
    typeof node.data.label === "string" && node.data.label.trim().length > 0
      ? node.data.label.trim()
      : "box-collider";
  return flowWirePhysicsColliderFromStage(
    colliderFromBoxColliderConfig(node.id, label, dc),
  );
}

export function evaluateSphereColliderOutput(node: FlowGraphNode): FlowWirePhysicsColliderV1 {
  const dc = node.data.defaultConfig as Record<string, unknown>;
  const label =
    typeof node.data.label === "string" && node.data.label.trim().length > 0
      ? node.data.label.trim()
      : "sphere-collider";
  return flowWirePhysicsColliderFromStage(
    colliderFromSphereColliderConfig(node.id, label, dc),
  );
}
