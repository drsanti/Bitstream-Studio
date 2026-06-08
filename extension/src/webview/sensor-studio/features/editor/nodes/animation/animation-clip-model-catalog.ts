import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import {
  applyGlbScopedModelCatalogSelect,
  readGlbScopedModelCatalogSelectValue,
  resolveGlbScopedNodeGltfFetchUrl,
} from "../../model/glb-scoped-model-catalog";
import type { StudioFlowEdgeLike } from "../../model/model-generated-bindings";
import type { StudioModelSelectFlowNodeLike } from "../../model/studio-model-source-select";
import { ANIMATION_CLIP_NAME_KEY } from "./animation-clip-config";

export const readAnimationClipModelCatalogSelectValue = readGlbScopedModelCatalogSelectValue;
export const resolveAnimationClipGltfFetchUrl = resolveGlbScopedNodeGltfFetchUrl;

/** Apply a catalog GLB pick on an unwired **Animation Clip** node. */
export function applyAnimationClipModelCatalogSelect(args: {
  clipFlowNodeId: string;
  catalogAssetId: string;
  clipConfig: Record<string, unknown>;
  nodes: readonly StudioModelSelectFlowNodeLike[];
  edges: readonly StudioFlowEdgeLike[];
  descriptors: readonly StudioAssetDescriptor[];
  updateField: (nodeId: string, key: string, value: unknown) => void;
}): void {
  applyGlbScopedModelCatalogSelect({
    flowNodeId: args.clipFlowNodeId,
    catalogAssetId: args.catalogAssetId,
    nodeConfig: args.clipConfig,
    nodes: args.nodes,
    edges: args.edges,
    descriptors: args.descriptors,
    updateField: args.updateField,
    clearExtraKeys: [ANIMATION_CLIP_NAME_KEY],
  });
}
