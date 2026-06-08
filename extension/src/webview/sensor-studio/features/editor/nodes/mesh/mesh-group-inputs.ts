import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../store/flow-graph-types";
import type { StudioOutputHandleDef } from "../../store/flow-editor.store";

export const MESH_GROUP_INPUT_COUNT_KEY = "meshInputCount";

export const MESH_GROUP_MIN_INPUTS = 2;
export const MESH_GROUP_MAX_INPUTS = 8;
export const MESH_GROUP_DEFAULT_INPUTS = 2;

export const MESH_GROUP_INPUT_HANDLE_IDS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
] as const;

export type MeshGroupInputHandleId = (typeof MESH_GROUP_INPUT_HANDLE_IDS)[number];

export const MESH_GROUP_OUTPUT_HANDLE: StudioOutputHandleDef = {
  id: "out",
  portType: "mesh",
  label: "Mesh",
};

export const MESH_GROUP_NODE_ID = "mesh-group" as const;

/** Operator-facing palette / inspector title (persisted node id stays `mesh-group`). */
export const MESH_BUNDLE_NODE_TITLE = "Mesh Bundle" as const;

export function isMeshGroupNodeId(nodeId: string): boolean {
  return nodeId === MESH_GROUP_NODE_ID;
}

export function meshGroupInputHandleId(index: number): MeshGroupInputHandleId {
  const id = MESH_GROUP_INPUT_HANDLE_IDS[index];
  if (id == null) {
    throw new RangeError(`mesh group input index out of range: ${index}`);
  }
  return id;
}

export function readMeshGroupInputCount(defaultConfig: Record<string, unknown>): number {
  const raw = defaultConfig[MESH_GROUP_INPUT_COUNT_KEY];
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return MESH_GROUP_DEFAULT_INPUTS;
  }
  return Math.min(
    MESH_GROUP_MAX_INPUTS,
    Math.max(MESH_GROUP_MIN_INPUTS, Math.round(n)),
  );
}

export function computeMeshGroupInputHandles(
  defaultConfig: Record<string, unknown>,
): StudioOutputHandleDef[] {
  const count = readMeshGroupInputCount(defaultConfig);
  return MESH_GROUP_INPUT_HANDLE_IDS.slice(0, count).map((id, index) => ({
    id,
    portType: "mesh",
    label: String(index + 1),
  }));
}

export function listMeshGroupInputHandleIds(
  defaultConfig: Record<string, unknown>,
): MeshGroupInputHandleId[] {
  const count = readMeshGroupInputCount(defaultConfig);
  return [...MESH_GROUP_INPUT_HANDLE_IDS.slice(0, count)];
}

export function isMeshGroupInputHandleId(handleId: string): boolean {
  return (MESH_GROUP_INPUT_HANDLE_IDS as readonly string[]).includes(handleId);
}

export function pruneMeshGroupEdges(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): Edge[] {
  const allowedByTarget = new Map<string, Set<string>>();
  for (const node of nodes) {
    if (node.type !== "studio" || node.data.nodeId !== "mesh-group") {
      continue;
    }
    allowedByTarget.set(
      node.id,
      new Set(listMeshGroupInputHandleIds(node.data.defaultConfig)),
    );
  }
  if (allowedByTarget.size === 0) {
    return [...edges];
  }
  return edges.filter((edge) => {
    const allowed = allowedByTarget.get(edge.target);
    if (allowed == null) {
      return true;
    }
    const handle = edge.targetHandle ?? "a";
    return allowed.has(handle);
  });
}
