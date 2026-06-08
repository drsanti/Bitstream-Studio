import type { Edge } from "@xyflow/react";
import type { Scene3DConfigV1 } from "../scene3d/scene3d-config";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import {
  STUDIO_HANDLE_MESHES,
  STUDIO_HANDLE_MODELS,
} from "../../features/editor/studio-handle-ids";
import { collectFlowMeshEntries } from "./collect-flow-mesh-entries";

const SCENE_OUTPUT_NODE_ID = "scene-output";
import type { StageSceneModelEntryV1 } from "./stage-scene-snapshot";

/** Committed Stage scene has procedural meshes and no wired GLB models. */
export function isMeshesOnlyCommittedStage(args: {
  models: readonly StageSceneModelEntryV1[];
  meshesCount: number;
}): boolean {
  return args.models.length === 0 && args.meshesCount > 0;
}

/** Runtime eval / preview — strip baked demo GLB when meshes-only. */
export function clearScene3dModelForMeshesOnly(scene3d: Scene3DConfigV1): Scene3DConfigV1 {
  return {
    ...scene3d,
    model: {
      ...scene3d.model,
      url: "",
      studioAssetId: undefined,
    },
  };
}

export function sceneOutputModelWireEdgeIds(
  edges: readonly Edge[],
  sceneOutputNodeId: string,
): string[] {
  return edges
    .filter(
      (edge) =>
        edge.target === sceneOutputNodeId &&
        (edge.targetHandle ?? STUDIO_HANDLE_MODELS) === STUDIO_HANDLE_MODELS,
    )
    .map((edge) => edge.id);
}

/**
 * When meshes-only is active, Scene Output **Models** wires are orphans (no committed GLB).
 * Returns edge ids to remove when {@link autoDisconnectOrphanModelSources} is enabled.
 */
export function orphanSceneOutputModelEdgeIds(args: {
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): string[] {
  const outputNode = args.nodes.find((n) => n.data.nodeId === SCENE_OUTPUT_NODE_ID);
  if (outputNode == null) {
    return [];
  }
  const meshes = collectFlowMeshEntries({
    nodes: args.nodes,
    edges: args.edges,
    targetNodeId: outputNode.id,
    targetHandle: STUDIO_HANDLE_MESHES,
  });
  if (!isMeshesOnlyCommittedStage({ models: [], meshesCount: meshes.length })) {
    return [];
  }
  return sceneOutputModelWireEdgeIds(args.edges, outputNode.id);
}
