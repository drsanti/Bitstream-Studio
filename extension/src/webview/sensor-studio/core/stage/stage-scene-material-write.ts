import type { Edge } from "@xyflow/react";
import {
  isMeshMaterialNodeId,
  meshMaterialKindForNodeId,
  type MeshMaterialKindV1,
} from "../../features/editor/nodes/material/mesh-material-config";
import { isMeshPrimitiveNodeId } from "../../features/editor/nodes/mesh/mesh-primitive-config";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import type { SceneObjectRefV1 } from "./scene-object-ref";
import { resolveStageObjectMeshSourceNodeIdForSelection } from "./stage-scene-transform-write";

export type StageSceneMaterialWriteTarget = {
  materialNodeId: string;
  catalogNodeId: string;
  kind: MeshMaterialKindV1;
  label: string;
};

export function resolveStageSceneMaterialWriteTarget(args: {
  meshFlowNodeId: string;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): StageSceneMaterialWriteTarget | null {
  const meshNode = args.nodes.find((n) => n.id === args.meshFlowNodeId);
  if (meshNode == null || meshNode.type !== "studio") {
    return null;
  }
  if (!isMeshPrimitiveNodeId(meshNode.data.nodeId)) {
    return null;
  }

  const materialEdge = args.edges.find(
    (e) =>
      e.target === args.meshFlowNodeId &&
      (e.targetHandle ?? "material") === "material",
  );
  if (materialEdge == null) {
    return null;
  }

  const src = args.nodes.find((n) => n.id === materialEdge.source);
  if (src == null || src.type !== "studio") {
    return null;
  }
  if (!isMeshMaterialNodeId(src.data.nodeId)) {
    return null;
  }

  const kind = meshMaterialKindForNodeId(src.data.nodeId);
  if (kind == null) {
    return null;
  }

  const label =
    typeof src.data.label === "string" && src.data.label.trim().length > 0
      ? src.data.label.trim()
      : src.data.nodeId;

  return {
    materialNodeId: src.id,
    catalogNodeId: src.data.nodeId,
    kind,
    label,
  };
}

export function resolveStageSceneMaterialWriteTargetForSelection(args: {
  selection: SceneObjectRefV1;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): StageSceneMaterialWriteTarget | null {
  const meshSourceNodeId = resolveStageObjectMeshSourceNodeIdForSelection({
    selection: args.selection,
    nodes: args.nodes,
    edges: args.edges,
  });
  if (meshSourceNodeId == null) {
    return null;
  }
  return resolveStageSceneMaterialWriteTarget({
    meshFlowNodeId: meshSourceNodeId,
    nodes: args.nodes,
    edges: args.edges,
  });
}

export function isStageSceneMaterialQuickEditEligible(
  selection: SceneObjectRefV1 | null,
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): boolean {
  if (selection == null || selection.kind !== "procedural") {
    return false;
  }
  return (
    resolveStageSceneMaterialWriteTargetForSelection({
      selection,
      nodes,
      edges,
    }) != null
  );
}
