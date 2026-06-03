import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";

/** Static collider committed to the Stage when physics preview is enabled. */
export type StagePhysicsColliderV1 = {
  version: 1;
  kind: "box" | "sphere";
  sourceNodeId: string;
  label: string;
  position: { x: number; y: number; z: number };
  rotationDeg: { x: number; y: number; z: number };
  halfExtents?: { x: number; y: number; z: number };
  radius?: number;
};

function readNumber(cfg: Record<string, unknown>, key: string, fallback: number): number {
  const v = cfg[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function readColliderTransform(dc: Record<string, unknown>): {
  position: { x: number; y: number; z: number };
  rotationDeg: { x: number; y: number; z: number };
} {
  return {
    position: {
      x: readNumber(dc, "positionX", 0),
      y: readNumber(dc, "positionY", 0),
      z: readNumber(dc, "positionZ", 0),
    },
    rotationDeg: {
      x: readNumber(dc, "rotationDegX", 0),
      y: readNumber(dc, "rotationDegY", 0),
      z: readNumber(dc, "rotationDegZ", 0),
    },
  };
}

export function colliderFromBoxColliderConfig(
  sourceNodeId: string,
  label: string,
  dc: Record<string, unknown>,
): StagePhysicsColliderV1 {
  const xf = readColliderTransform(dc);
  return {
    version: 1,
    kind: "box",
    sourceNodeId,
    label,
    position: xf.position,
    rotationDeg: xf.rotationDeg,
    halfExtents: {
      x: Math.max(0.01, readNumber(dc, "halfExtentsX", 0.5)),
      y: Math.max(0.01, readNumber(dc, "halfExtentsY", 0.5)),
      z: Math.max(0.01, readNumber(dc, "halfExtentsZ", 0.5)),
    },
  };
}

export function colliderFromSphereColliderConfig(
  sourceNodeId: string,
  label: string,
  dc: Record<string, unknown>,
): StagePhysicsColliderV1 {
  const xf = readColliderTransform(dc);
  return {
    version: 1,
    kind: "sphere",
    sourceNodeId,
    label,
    position: xf.position,
    rotationDeg: xf.rotationDeg,
    radius: Math.max(0.01, readNumber(dc, "radius", 0.5)),
  };
}

/**
 * Collect **box-collider** / **sphere-collider** nodes from the flow graph for Stage Rapier preview.
 * Prefer wiring shapes into **physics-world**; unwired nodes are included when physics is enabled.
 */
export function collectStagePhysicsCollidersFromGraph(
  nodes: readonly FlowGraphNode[],
): StagePhysicsColliderV1[] {
  const out: StagePhysicsColliderV1[] = [];
  for (const node of nodes) {
    if (node.type !== "studio") {
      continue;
    }
    const nodeId = node.data.nodeId;
    const dc = node.data.defaultConfig as Record<string, unknown>;
    const label =
      typeof node.data.label === "string" && node.data.label.trim().length > 0
        ? node.data.label.trim()
        : nodeId;

    if (nodeId === "box-collider") {
      out.push(colliderFromBoxColliderConfig(node.id, label, dc));
      continue;
    }

    if (nodeId === "sphere-collider") {
      out.push(colliderFromSphereColliderConfig(node.id, label, dc));
    }
  }
  return out;
}

export function stagePhysicsCollidersLayoutKey(
  colliders: readonly StagePhysicsColliderV1[],
): string {
  return colliders
    .map((c) =>
      c.kind === "box"
        ? `b:${c.sourceNodeId}:${c.position.x},${c.position.y},${c.position.z}:${c.halfExtents?.x},${c.halfExtents?.y},${c.halfExtents?.z}`
        : `s:${c.sourceNodeId}:${c.position.x},${c.position.y},${c.position.z}:${c.radius}`,
    )
    .join("|");
}
