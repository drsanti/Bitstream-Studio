import type { Edge } from "@xyflow/react";
import {
  meshGroupInputHandleId,
  MESH_GROUP_NODE_ID,
  readMeshGroupInputCount,
} from "../../features/editor/nodes/mesh/mesh-group-inputs";
import { isMeshPrimitiveNodeId } from "../../features/editor/nodes/mesh/mesh-primitive-config";
import {
  flowWireTransformFieldsForNodeConfigPatch,
  type FlowWireTransformV1,
} from "../../features/editor/nodes/transform/flow-wire-transform";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import { useFlowEditorStore } from "../../features/editor/store/flow-editor.store";
import type { SceneObjectRefV1 } from "./scene-object-ref";
import {
  findGlbPartTransformNodeId,
  isGlbInstanceStageGizmoEligible,
} from "./stage-scene-glb-transform-write";

export type StageSceneTransformWriteTarget =
  | { kind: "object-transform"; nodeId: string }
  | { kind: "mesh-embedded"; nodeId: string }
  | { kind: "glb-part-transform"; nodeId: string };

export function resolveStageSceneTransformWriteTarget(args: {
  meshFlowNodeId: string;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): StageSceneTransformWriteTarget | null {
  const meshNode = args.nodes.find((n) => n.id === args.meshFlowNodeId);
  if (meshNode == null || meshNode.type !== "studio") {
    return null;
  }
  if (!isMeshPrimitiveNodeId(meshNode.data.nodeId)) {
    return null;
  }

  const transformEdge = args.edges.find(
    (e) =>
      e.target === args.meshFlowNodeId &&
      (e.targetHandle ?? "transform") === "transform",
  );
  if (transformEdge != null) {
    const src = args.nodes.find((n) => n.id === transformEdge.source);
    if (src?.type === "studio" && src.data.nodeId === "object-transform") {
      return { kind: "object-transform", nodeId: src.id };
    }
  }

  return { kind: "mesh-embedded", nodeId: args.meshFlowNodeId };
}

function resolveMeshGroupLeafIndexFromSelection(
  selection: Extract<SceneObjectRefV1, { kind: "procedural" }>,
): number | null {
  if (selection.meshLeafIndex != null && selection.meshLeafIndex >= 0) {
    return selection.meshLeafIndex;
  }
  if (selection.objectPath === `proc:${selection.sourceNodeId}`) {
    return 0;
  }
  return null;
}

/** Wired mesh primitive behind a Mesh Bundle leaf input (SE2.1). */
export function resolveMeshGroupLeafMeshSourceNodeId(args: {
  groupNodeId: string;
  leafIndex: number;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): string | null {
  const groupNode = args.nodes.find((n) => n.id === args.groupNodeId);
  if (groupNode == null || groupNode.type !== "studio") {
    return null;
  }
  if (groupNode.data.nodeId !== MESH_GROUP_NODE_ID) {
    return null;
  }
  const leafIndex = args.leafIndex;
  if (!Number.isFinite(leafIndex) || leafIndex < 0) {
    return null;
  }
  const inputCount = readMeshGroupInputCount(groupNode.data.defaultConfig);
  if (leafIndex >= inputCount) {
    return null;
  }
  const handleId = meshGroupInputHandleId(leafIndex);
  const inputEdge = args.edges.find(
    (e) =>
      e.target === args.groupNodeId &&
      (e.targetHandle ?? "a") === handleId,
  );
  if (inputEdge == null) {
    return null;
  }
  const sourceNode = args.nodes.find((n) => n.id === inputEdge.source);
  if (sourceNode == null || sourceNode.type !== "studio") {
    return null;
  }
  if (!isMeshPrimitiveNodeId(sourceNode.data.nodeId)) {
    return null;
  }
  return sourceNode.id;
}

/** Flow mesh primitive node that owns Stage object transform/material edits. */
export function resolveStageObjectMeshSourceNodeIdForSelection(args: {
  selection: SceneObjectRefV1;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): string | null {
  if (args.selection.kind !== "procedural") {
    return null;
  }
  const node = args.nodes.find((n) => n.id === args.selection.sourceNodeId);
  if (node == null || node.type !== "studio") {
    return null;
  }
  if (node.data.nodeId === MESH_GROUP_NODE_ID) {
    const leafIndex = resolveMeshGroupLeafIndexFromSelection(args.selection);
    if (leafIndex == null) {
      return null;
    }
    return resolveMeshGroupLeafMeshSourceNodeId({
      groupNodeId: args.selection.sourceNodeId,
      leafIndex,
      nodes: args.nodes,
      edges: args.edges,
    });
  }
  if (isMeshPrimitiveNodeId(node.data.nodeId)) {
    return args.selection.sourceNodeId;
  }
  return null;
}

export function resolveStageSceneTransformWriteTargetForSelection(args: {
  selection: SceneObjectRefV1;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): StageSceneTransformWriteTarget | null {
  if (args.selection.kind === "glb-instance") {
    if (!isGlbInstanceStageGizmoEligible(args.selection, args.nodes, args.edges)) {
      return null;
    }
    const existing = findGlbPartTransformNodeId({
      sourceModelNodeId: args.selection.sourceNodeId,
      partPath: args.selection.objectPath,
      nodes: args.nodes,
      edges: args.edges,
    });
    if (existing != null) {
      return { kind: "glb-part-transform", nodeId: existing };
    }
    return { kind: "glb-part-transform", nodeId: "__pending__" };
  }
  if (args.selection.kind !== "procedural") {
    return null;
  }
  const node = args.nodes.find((n) => n.id === args.selection.sourceNodeId);
  if (node == null || node.type !== "studio") {
    return null;
  }
  const meshSourceNodeId = resolveStageObjectMeshSourceNodeIdForSelection({
    selection: args.selection,
    nodes: args.nodes,
    edges: args.edges,
  });
  if (meshSourceNodeId == null) {
    return null;
  }
  return resolveStageSceneTransformWriteTarget({
    meshFlowNodeId: meshSourceNodeId,
    nodes: args.nodes,
    edges: args.edges,
  });
}

export function isStageSceneGizmoEligible(
  selection: SceneObjectRefV1 | null,
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[] = [],
): boolean {
  if (selection == null) {
    return false;
  }
  return (
    resolveStageSceneTransformWriteTargetForSelection({
      selection,
      nodes,
      edges,
    }) != null
  );
}

/** Persist a gizmo edit to the flow graph (object-transform, mesh embedded, or glb-part-transform). */
export function commitStageSceneTransformWrite(args: {
  selection: SceneObjectRefV1;
  transform: FlowWireTransformV1;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  /** When false, skip undo (caller already pushed one snapshot at gizmo drag start). */
  recordUndo?: boolean;
}): boolean {
  const target = resolveStageSceneTransformWriteTargetForSelection({
    selection: args.selection,
    nodes: args.nodes,
    edges: args.edges,
  });
  if (target == null) {
    return false;
  }
  const fields = flowWireTransformFieldsForNodeConfigPatch(args.transform);
  const store = useFlowEditorStore.getState();
  if (target.kind === "glb-part-transform") {
    if (args.selection.kind !== "glb-instance") {
      return false;
    }
    return store.commitStageGlbPartTransformWrite({
      selection: args.selection,
      transform: args.transform,
      recordUndo: args.recordUndo,
    });
  }
  if (args.recordUndo === false) {
    return store.patchNodeConfigFieldsByNodeIdSilent(target.nodeId, fields);
  }
  return store.patchNodeConfigFieldsByNodeId(target.nodeId, fields);
}
