import {
  getStudioModelDescriptorById,
  listStudioModelDescriptors,
  persistedModelUrlFromStudioDescriptor,
  resolveStudioModelGltfFetchUrl,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../../asset-browser/studio-model-scene-bindings";
import type { StudioAssetDescriptor } from "../../asset-browser/studio-asset.types";
import { readStudioModelCatalogSelectValue } from "../nodes/model-nodes/studio-model-catalog-select";
import {
  listCanvasModelSelectNodes,
  type StudioModelSelectFlowNodeLike,
} from "../model/studio-model-source-select";
import type { ModelOutlinerScopeMode } from "./model-outliner-ui-persistence";

export function resolveOutlinerFetchUrl(
  scopeMode: ModelOutlinerScopeMode,
  canvasModelSelectId: string | null,
  catalogAssetId: string | null,
  nodes: readonly StudioModelSelectFlowNodeLike[],
  descriptors: readonly StudioAssetDescriptor[],
): string | null {
  if (scopeMode === "canvas-model-select") {
    if (canvasModelSelectId == null) {
      return null;
    }
    const n = nodes.find((x) => x.id === canvasModelSelectId);
    if (n?.data.nodeId !== "model-select") {
      return null;
    }
    const dc = n.data.defaultConfig;
    const logical = typeof dc.selectedModelUrl === "string" ? dc.selectedModelUrl.trim() : "";
    if (logical.length === 0) {
      return null;
    }
    const studioAssetId =
      typeof dc.selectedStudioAssetId === "string" ? dc.selectedStudioAssetId.trim() : undefined;
    const fetchUrl = resolveStudioModelGltfFetchUrl({ url: logical, studioAssetId }, descriptors, "");
    return fetchUrl.length > 0 ? fetchUrl : null;
  }

  if (catalogAssetId == null || catalogAssetId === STUDIO_MODEL_SELECT_CUSTOM) {
    return null;
  }
  const d = getStudioModelDescriptorById(catalogAssetId, descriptors);
  if (d == null) {
    return null;
  }
  const persisted = persistedModelUrlFromStudioDescriptor(d);
  const fetchUrl = resolveStudioModelGltfFetchUrl(
    { url: persisted, studioAssetId: d.id },
    descriptors,
    "",
  );
  return fetchUrl.length > 0 ? fetchUrl : null;
}

/**
 * Flow node id used as `parentModelFlowNodeId` for GLB extract spawn/drag.
 * Catalog-inline mode may return null when no suitable Model Source exists yet.
 */
export function resolveOutlinerParentModelFlowNodeId(
  scopeMode: ModelOutlinerScopeMode,
  canvasModelSelectId: string | null,
  catalogAssetId: string | null,
  nodes: readonly StudioModelSelectFlowNodeLike[],
  descriptors: readonly StudioAssetDescriptor[],
): string | null {
  if (scopeMode === "canvas-model-select") {
    if (canvasModelSelectId == null) {
      return null;
    }
    const n = nodes.find((x) => x.id === canvasModelSelectId);
    return n?.data.nodeId === "model-select" ? canvasModelSelectId : null;
  }

  if (catalogAssetId == null || catalogAssetId === STUDIO_MODEL_SELECT_CUSTOM) {
    return null;
  }

  const modelSelects = listCanvasModelSelectNodes(nodes);
  const matching = modelSelects.find(
    (n) => readStudioModelCatalogSelectValue(n.data.defaultConfig, descriptors) === catalogAssetId,
  );
  if (matching != null) {
    return matching.id;
  }

  if (modelSelects.length === 1) {
    return modelSelects[0]!.id;
  }

  return null;
}

export function pickDefaultCanvasModelSelectId(
  nodes: readonly StudioModelSelectFlowNodeLike[],
  storedId: string | null,
): string | null {
  const modelSelects = listCanvasModelSelectNodes(nodes);
  if (modelSelects.length === 0) {
    return null;
  }
  if (storedId != null && modelSelects.some((n) => n.id === storedId)) {
    return storedId;
  }
  return modelSelects[0]!.id;
}

export function pickDefaultCatalogAssetId(
  descriptors: readonly StudioAssetDescriptor[],
  storedId: string | null,
): string | null {
  if (storedId != null && getStudioModelDescriptorById(storedId, descriptors) != null) {
    return storedId;
  }
  const models = listStudioModelDescriptors(descriptors);
  return models[0]?.id ?? null;
}
