import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import type { FlowWirePhysicsJointV1 } from "../../features/editor/nodes/physics/flow-wire-physics-joint";
import {
  flowWirePhysicsSpawnerFromConfig,
  type FlowWirePhysicsSpawnerV1,
} from "../../features/editor/nodes/physics/flow-wire-physics-spawner";
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
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  physicsWorldNodeId: string;
  pinValues: Map<string, unknown>;
}): FlowWirePhysicsRigidBodyV1[] {
  const { nodes, edges, physicsWorldNodeId, pinValues } = args;
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

export function evaluatePhysicsJointNode(
  node: FlowGraphNode,
  readPort: (port: "bodyA" | "bodyB") => unknown,
): FlowWirePhysicsJointV1 | null {
  const nodeId = node.data.nodeId;
  if (nodeId !== "fixed-joint" && nodeId !== "hinge-joint") {
    return null;
  }
  const bodyA = readPort("bodyA");
  const bodyB = readPort("bodyB");
  if (!isFlowWirePhysicsRigidBodyV1(bodyA) || !isFlowWirePhysicsRigidBodyV1(bodyB)) {
    return null;
  }
  const label =
    typeof node.data.label === "string" && node.data.label.trim().length > 0
      ? node.data.label.trim()
      : nodeId;
  const cfg = node.data.defaultConfig as Record<string, unknown>;
  const axisRaw = cfg.axis;
  const axis =
    axisRaw === "x" || axisRaw === "z" ? axisRaw : ("y" as const);
  return {
    kindWire: "physicsJoint",
    version: 1,
    sourceNodeId: node.id,
    label,
    jointKind: nodeId === "hinge-joint" ? "hinge" : "fixed",
    bodyASourceNodeId: bodyA.sourceNodeId,
    bodyBSourceNodeId: bodyB.sourceNodeId,
    axis,
  };
}

export function collectPhysicsJointsFromGraph(args: {
  nodes: readonly FlowGraphNode[];
  readIncoming: (nodeId: string, port: string) => unknown;
}): FlowWirePhysicsJointV1[] {
  const joints: FlowWirePhysicsJointV1[] = [];
  for (const node of args.nodes) {
    const joint = evaluatePhysicsJointNode(node, (port) =>
      args.readIncoming(node.id, port),
    );
    if (joint != null) {
      joints.push(joint);
    }
  }
  return joints;
}

export function evaluatePhysicsSpawnerNode(
  node: FlowGraphNode,
  readPort: (port: "rate" | "trigger") => unknown,
): FlowWirePhysicsSpawnerV1 | null {
  if (node.data.nodeId !== "object-spawner") {
    return null;
  }
  const cfg = node.data.defaultConfig as Record<string, unknown>;
  const label =
    typeof node.data.label === "string" && node.data.label.trim().length > 0
      ? node.data.label.trim()
      : "object-spawner";
  const rateIn = readPort("rate");
  const rateOverride =
    typeof rateIn === "number" && Number.isFinite(rateIn) ? rateIn : undefined;
  return flowWirePhysicsSpawnerFromConfig(node.id, label, cfg, rateOverride);
}

export function collectPhysicsSpawnersFromGraph(args: {
  nodes: readonly FlowGraphNode[];
  readIncoming: (nodeId: string, port: string) => unknown;
}): FlowWirePhysicsSpawnerV1[] {
  const spawners: FlowWirePhysicsSpawnerV1[] = [];
  for (const node of args.nodes) {
    const spawner = evaluatePhysicsSpawnerNode(node, (port) =>
      args.readIncoming(node.id, port),
    );
    if (spawner != null) {
      spawners.push(spawner);
    }
  }
  return spawners;
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
