import type { Edge } from "@xyflow/react";
import {
  coerceFlowWireMeshV1,
  flattenFlowWireMeshesForStage,
  isFlowWireMeshV1,
  type FlowWireMeshV1,
} from "../../features/editor/nodes/mesh/flow-wire-mesh";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import type { StageMeshEntryV1 } from "./stage-mesh-entry";

function resolveMeshWireFromSourceNode(node: FlowGraphNode): FlowWireMeshV1 | null {
  const live = node.data.liveMeshWire;
  if (isFlowWireMeshV1(live)) {
    return coerceFlowWireMeshV1(live);
  }
  return null;
}

/** Collect procedural mesh entries wired into a flow node's **`meshes`** input. */
export function collectFlowMeshEntries(args: {
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  targetNodeId: string;
  targetHandle?: string;
}): StageMeshEntryV1[] {
  const handle = args.targetHandle ?? "meshes";
  const meshEdges = args.edges.filter(
    (e) => e.target === args.targetNodeId && (e.targetHandle ?? handle) === handle,
  );
  const entries: StageMeshEntryV1[] = [];
  for (const edge of meshEdges) {
    const src = args.nodes.find((n) => n.id === edge.source);
    if (src == null) {
      continue;
    }
    const wire = resolveMeshWireFromSourceNode(src);
    if (wire == null) {
      continue;
    }
    const baseLabel =
      typeof src.data.label === "string" && src.data.label.trim().length > 0
        ? src.data.label.trim()
        : src.data.nodeId;
    const leaves = flattenFlowWireMeshesForStage(wire);
    if (leaves.length === 0) {
      continue;
    }
    for (let i = 0; i < leaves.length; i += 1) {
      const leaf = leaves[i]!;
      const label = leaves.length > 1 ? `${baseLabel} ${i + 1}` : baseLabel;
      entries.push({
        sourceNodeId: src.id,
        label,
        wire: leaf,
        ...(leaves.length > 1 ? { meshLeafIndex: i } : {}),
      });
    }
  }
  return entries;
}
