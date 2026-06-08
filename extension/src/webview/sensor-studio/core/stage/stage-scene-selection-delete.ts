import type { Edge } from "@xyflow/react";
import { findGlbPartTransformNodeId } from "./stage-scene-glb-transform-write";
import type { SceneObjectRefV1 } from "./scene-object-ref";
import { resolveStageObjectMeshSourceNodeIdForSelection } from "./stage-scene-transform-write";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";

/** Flow node ids to remove when the operator deletes a Stage scene selection. */
export function resolveStageSceneDeletionNodeIds(args: {
  selection: SceneObjectRefV1;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): string[] {
  if (args.selection.kind === "glb-instance") {
    const nodeId = findGlbPartTransformNodeId({
      sourceModelNodeId: args.selection.sourceNodeId,
      partPath: args.selection.objectPath,
      nodes: args.nodes,
      edges: args.edges,
    });
    return nodeId != null ? [nodeId] : [];
  }
  const meshNodeId = resolveStageObjectMeshSourceNodeIdForSelection({
    selection: args.selection,
    nodes: args.nodes,
    edges: args.edges,
  });
  return meshNodeId != null ? [meshNodeId] : [];
}

export function canDeleteStageSceneSelection(args: {
  selection: SceneObjectRefV1 | null;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): boolean {
  if (args.selection == null) {
    return false;
  }
  return (
    resolveStageSceneDeletionNodeIds({
      selection: args.selection,
      nodes: args.nodes,
      edges: args.edges,
    }).length > 0
  );
}
