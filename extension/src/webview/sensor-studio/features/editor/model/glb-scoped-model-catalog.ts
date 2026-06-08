import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
  resolveStudioModelGltfFetchUrl,
  resolveStudioModelSelectGltfFetchUrl,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../../asset-browser/studio-model-scene-bindings";
import type { StudioAssetDescriptor } from "../../asset-browser/studio-asset.types";
import {
  readSourceModelNodeId,
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
  type StudioFlowEdgeLike,
} from "./model-generated-bindings";
import {
  GLB_MODEL_SOURCE_UNBOUND,
  listCanvasModelSelectNodes,
  resolveUnwiredStudioModelSourceSelectValue,
  resolveWiredStudioModelFlowId,
  type StudioModelSelectFlowNodeLike,
} from "./studio-model-source-select";
import {
  applyStudioModelCatalogSelectToNodeConfig,
  readStudioModelCatalogSelectValue,
} from "../nodes/model-nodes/studio-model-catalog-select";

function readInlineNodeModelCatalogAssetId(
  config: Record<string, unknown>,
  descriptors: readonly StudioAssetDescriptor[],
): string {
  const assetId =
    typeof config.selectedStudioAssetId === "string" ? config.selectedStudioAssetId.trim() : "";
  if (assetId.length === 0) {
    return STUDIO_MODEL_SELECT_CUSTOM;
  }
  return getStudioModelDescriptorById(assetId, descriptors) != null
    ? assetId
    : STUDIO_MODEL_SELECT_CUSTOM;
}

/** Catalog pick for GLB-scoped flow nodes when **Model** is unwired. */
export function readGlbScopedModelCatalogSelectValue(
  flowNodeId: string,
  nodeConfig: Record<string, unknown>,
  nodes: readonly StudioModelSelectFlowNodeLike[],
  edges: readonly StudioFlowEdgeLike[],
  descriptors: readonly StudioAssetDescriptor[],
): string {
  const wired = resolveWiredStudioModelFlowId(flowNodeId, nodes, edges);
  if (wired != null) {
    const parent = nodes.find((n) => n.id === wired);
    if (parent != null) {
      return readStudioModelCatalogSelectValue(parent.data.defaultConfig, descriptors);
    }
  }

  const scopeId = resolveUnwiredStudioModelSourceSelectValue(nodeConfig, nodes);
  if (scopeId !== GLB_MODEL_SOURCE_UNBOUND) {
    const parent = nodes.find((n) => n.id === scopeId);
    if (parent != null) {
      return readStudioModelCatalogSelectValue(parent.data.defaultConfig, descriptors);
    }
  }

  return readInlineNodeModelCatalogAssetId(nodeConfig, descriptors);
}

export function clearGlbScopedExtractBindingPatch(
  extraClearKeys: readonly string[] = [],
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    [STUDIO_GLB_EXTRACT_KIND_KEY]: "",
    [STUDIO_GLB_EXTRACT_REF_KEY]: "",
  };
  for (const key of extraClearKeys) {
    patch[key] = "";
  }
  return patch;
}

function modelCatalogChanged(
  nodeConfig: Record<string, unknown>,
  nodes: readonly StudioModelSelectFlowNodeLike[],
  edges: readonly StudioFlowEdgeLike[],
  flowNodeId: string,
  descriptors: readonly StudioAssetDescriptor[],
  nextCatalogAssetId: string,
): boolean {
  return (
    readGlbScopedModelCatalogSelectValue(flowNodeId, nodeConfig, nodes, edges, descriptors) !==
    nextCatalogAssetId
  );
}

function resolveModelSelectTargetForCatalogPick(
  catalogAssetId: string,
  nodeConfig: Record<string, unknown>,
  nodes: readonly StudioModelSelectFlowNodeLike[],
  descriptors: readonly StudioAssetDescriptor[],
): string | undefined {
  const modelSelects = listCanvasModelSelectNodes(nodes);
  if (modelSelects.length === 0) {
    return undefined;
  }

  const matching = modelSelects.find(
    (n) => readStudioModelCatalogSelectValue(n.data.defaultConfig, descriptors) === catalogAssetId,
  );
  if (matching != null) {
    return matching.id;
  }

  const fromConfig = readSourceModelNodeId(nodeConfig);
  if (fromConfig != null && modelSelects.some((n) => n.id === fromConfig)) {
    return fromConfig;
  }

  if (modelSelects.length === 1) {
    return modelSelects[0]!.id;
  }

  return modelSelects[0]!.id;
}

/** Resolve GLB fetch URL — scoped **model-select** or inline catalog on the node. */
export function resolveGlbScopedNodeGltfFetchUrl(
  flowNodeId: string,
  nodeConfig: Record<string, unknown>,
  nodes: readonly StudioModelSelectFlowNodeLike[],
  edges: readonly StudioFlowEdgeLike[],
  descriptors: readonly StudioAssetDescriptor[],
): string | null {
  const scopeId = resolveUnwiredStudioModelSourceSelectValue(nodeConfig, nodes);
  const wired = resolveWiredStudioModelFlowId(flowNodeId, nodes, edges);
  const modelFlowId = wired ?? (scopeId !== GLB_MODEL_SOURCE_UNBOUND ? scopeId : undefined);

  if (modelFlowId != null && modelFlowId.trim().length > 0) {
    const fetchUrl = resolveStudioModelSelectGltfFetchUrl(nodes, modelFlowId, descriptors);
    if (fetchUrl != null) {
      return fetchUrl;
    }
  }

  const url = typeof nodeConfig.selectedModelUrl === "string" ? nodeConfig.selectedModelUrl.trim() : "";
  if (url.length === 0) {
    return null;
  }
  const studioAssetId =
    typeof nodeConfig.selectedStudioAssetId === "string"
      ? nodeConfig.selectedStudioAssetId.trim()
      : undefined;
  const fetchUrl = resolveStudioModelGltfFetchUrl({ url, studioAssetId }, descriptors, "");
  return fetchUrl.length > 0 ? fetchUrl : null;
}

/** Apply a catalog GLB pick on an unwired GLB-scoped node. */
export function applyGlbScopedModelCatalogSelect(args: {
  flowNodeId: string;
  catalogAssetId: string;
  nodeConfig: Record<string, unknown>;
  nodes: readonly StudioModelSelectFlowNodeLike[];
  edges: readonly StudioFlowEdgeLike[];
  descriptors: readonly StudioAssetDescriptor[];
  updateField: (nodeId: string, key: string, value: unknown) => void;
  clearExtraKeys?: readonly string[];
}): void {
  const {
    flowNodeId,
    catalogAssetId,
    nodeConfig,
    nodes,
    edges,
    descriptors,
    updateField,
    clearExtraKeys = [],
  } = args;

  if (catalogAssetId === STUDIO_MODEL_SELECT_CUSTOM || catalogAssetId.length === 0) {
    return;
  }

  const shouldClearBinding = modelCatalogChanged(
    nodeConfig,
    nodes,
    edges,
    flowNodeId,
    descriptors,
    catalogAssetId,
  );
  const clearPatch = shouldClearBinding ? clearGlbScopedExtractBindingPatch(clearExtraKeys) : {};

  const targetModelId = resolveModelSelectTargetForCatalogPick(
    catalogAssetId,
    nodeConfig,
    nodes,
    descriptors,
  );

  if (targetModelId != null) {
    applyStudioModelCatalogSelectToNodeConfig(catalogAssetId, descriptors, (key, value) => {
      updateField(targetModelId, key, value);
    });
    const prevId = readSourceModelNodeId(nodeConfig);
    updateField(flowNodeId, STUDIO_SOURCE_MODEL_NODE_ID_KEY, targetModelId);
    updateField(flowNodeId, "selectedStudioAssetId", "");
    updateField(flowNodeId, "selectedModelUrl", "");
    if (shouldClearBinding || prevId !== targetModelId) {
      for (const [key, value] of Object.entries(clearPatch)) {
        updateField(flowNodeId, key, value);
      }
    }
    return;
  }

  const d = getStudioModelDescriptorById(catalogAssetId, descriptors);
  if (d == null) {
    return;
  }
  const persisted = persistedModelUrlFromStudioDescriptor(d);
  updateField(flowNodeId, STUDIO_SOURCE_MODEL_NODE_ID_KEY, "");
  updateField(flowNodeId, "selectedStudioAssetId", d.id);
  updateField(flowNodeId, "selectedModelUrl", persisted);
  if (shouldClearBinding) {
    for (const [key, value] of Object.entries(clearPatch)) {
      updateField(flowNodeId, key, value);
    }
  }
}
