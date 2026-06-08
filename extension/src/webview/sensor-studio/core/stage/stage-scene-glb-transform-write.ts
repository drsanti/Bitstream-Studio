import type { Edge } from "@xyflow/react";
import { STUDIO_GLB_EXTRACT_REF_KEY } from "../../features/editor/model/model-generated-bindings";
import {
  GLB_PART_TRANSFORM_NODE_ID,
  glbPartTransformFieldsForNodeConfigPatch,
  readGlbPartTransformPath,
} from "../../features/editor/nodes/scene/glb-part-transform-config";
import type { FlowWireTransformV1 } from "../../features/editor/nodes/transform/flow-wire-transform";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import { resolveNodeStudioModelScopeNodeId } from "../../features/editor/model/model-generated-bindings";
import type { SceneObjectRefV1 } from "./scene-object-ref";

export function isGlbPartPathEligibleForStageGizmo(objectPath: string): boolean {
  const path = objectPath.trim();
  return path.length > 0 && !path.startsWith("proc:");
}

export function isGlbInstanceStageGizmoEligible(
  selection: Extract<SceneObjectRefV1, { kind: "glb-instance" }>,
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): boolean {
  const source = nodes.find((n) => n.id === selection.sourceNodeId);
  if (source == null || source.type !== "studio" || source.data.nodeId !== "model-select") {
    return false;
  }
  return isGlbPartPathEligibleForStageGizmo(selection.objectPath);
}

/** Find an existing **glb-part-transform** node for this model + part path. */
export function findGlbPartTransformNodeId(args: {
  sourceModelNodeId: string;
  partPath: string;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): string | null {
  const partPath = args.partPath.trim();
  if (partPath.length === 0) {
    return null;
  }
  for (const node of args.nodes) {
    if (node.type !== "studio" || node.data.nodeId !== GLB_PART_TRANSFORM_NODE_ID) {
      continue;
    }
    if (
      resolveNodeStudioModelScopeNodeId(node, args.nodes, args.edges) !==
      args.sourceModelNodeId
    ) {
      continue;
    }
    if (readGlbPartTransformPath(node.data.defaultConfig) !== partPath) {
      continue;
    }
    return node.id;
  }
  return null;
}

export function glbPartTransformSpawnDefaultConfig(args: {
  sourceModelNodeId: string;
  partPath: string;
  transform: FlowWireTransformV1;
}): Record<string, unknown> {
  return {
    sourceModelNodeId: args.sourceModelNodeId,
    [STUDIO_GLB_EXTRACT_REF_KEY]: args.partPath,
    glbExtractKind: "part",
    ...glbPartTransformFieldsForNodeConfigPatch(args.transform),
  };
}
