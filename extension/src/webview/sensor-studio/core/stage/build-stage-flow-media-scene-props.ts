import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import type { StudioFlowEdgeLike } from "../../features/editor/model/model-generated-bindings";
import {
  buildGlbScalarPreviewSceneProps,
  type GlbScalarPreviewSceneProps,
} from "../../features/editor/gltf/build-glb-scalar-preview-scene-props";
import { SCENE_OUTPUT_NODE_ID } from "../stage/evaluate-stage-scene-snapshot";

type FlowNodeLike = FlowGraphNode;

/**
 * Camera CSS3D feeds + GLB material-video drives for the Stage viewport.
 * Scoped to the focused Stage model; CSS3D feeds are graph-global.
 */
export function buildStageFlowMediaSceneProps(args: {
  nodes: readonly FlowNodeLike[];
  edges?: readonly StudioFlowEdgeLike[];
  sceneOutputNodeId: string | null;
  primaryModelSourceNodeId: string | null;
}): GlbScalarPreviewSceneProps {
  if (args.sceneOutputNodeId == null) {
    return {};
  }
  const scopeId = args.primaryModelSourceNodeId ?? "";
  return buildGlbScalarPreviewSceneProps({
    nodes: args.nodes,
    edges: args.edges,
    flowNodeId: args.sceneOutputNodeId,
    catalogNodeId: SCENE_OUTPUT_NODE_ID,
    defaultConfig:
      scopeId.length > 0 ? { sourceModelNodeId: scopeId } : {},
  });
}
