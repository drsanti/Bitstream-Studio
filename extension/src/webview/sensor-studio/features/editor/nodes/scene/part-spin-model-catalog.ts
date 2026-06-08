import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import { applyGlbScopedModelCatalogSelect } from "../../model/glb-scoped-model-catalog";
import type { StudioFlowEdgeLike } from "../../model/model-generated-bindings";
import type { StudioModelSelectFlowNodeLike } from "../../model/studio-model-source-select";

/** Apply a catalog GLB pick on an unwired **Part Spin** node. */
export function applyPartSpinModelCatalogSelect(args: {
  flowNodeId: string;
  catalogAssetId: string;
  nodeConfig: Record<string, unknown>;
  nodes: readonly StudioModelSelectFlowNodeLike[];
  edges: readonly StudioFlowEdgeLike[];
  descriptors: readonly StudioAssetDescriptor[];
  updateField: (nodeId: string, key: string, value: unknown) => void;
}): void {
  applyGlbScopedModelCatalogSelect({
    flowNodeId: args.flowNodeId,
    catalogAssetId: args.catalogAssetId,
    nodeConfig: args.nodeConfig,
    nodes: args.nodes,
    edges: args.edges,
    descriptors: args.descriptors,
    updateField: args.updateField,
  });
}
