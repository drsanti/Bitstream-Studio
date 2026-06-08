import type { NodeCatalogEntry } from "../../../core/config/config-types";
import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
} from "../../asset-browser/studio-model-scene-bindings";
import type { StudioAssetDescriptor } from "../../asset-browser/studio-asset.types";
import {
  defaultGlbMaterialParamValue,
  STUDIO_GLB_MATERIAL_PARAM_KEY,
} from "../gltf/studio-glb-material-param";
import {
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
} from "../model/model-generated-bindings";
import type { StudioGltfExtractRow } from "../gltf/studio-gltf-extract";

export type ModelOutlinerSpawnBinding =
  | { mode: "parent-model-select"; parentModelFlowNodeId: string }
  | { mode: "inline-catalog"; catalogAssetId: string };

export function resolveModelOutlinerSpawnBinding(args: {
  parentModelFlowNodeId: string | null;
  catalogAssetId: string | null;
}): ModelOutlinerSpawnBinding | null {
  if (args.parentModelFlowNodeId != null) {
    return { mode: "parent-model-select", parentModelFlowNodeId: args.parentModelFlowNodeId };
  }
  if (args.catalogAssetId != null && args.catalogAssetId.trim().length > 0) {
    return { mode: "inline-catalog", catalogAssetId: args.catalogAssetId.trim() };
  }
  return null;
}

export function catalogNodeIdForGlbExtractRow(row: StudioGltfExtractRow): string {
  if (row.kind === "material") {
    return "glb-material-param";
  }
  return "number-constant";
}

export function buildGlbExtractSpawnMergeConfig(
  catalogNodeId: string,
  row: StudioGltfExtractRow,
): Record<string, unknown> {
  const merge: Record<string, unknown> = {
    [STUDIO_GLB_EXTRACT_KIND_KEY]: row.kind,
    [STUDIO_GLB_EXTRACT_REF_KEY]: row.ref,
  };
  if (catalogNodeId === "number-constant") {
    merge.value = 0;
  } else if (catalogNodeId === "glb-material-param") {
    merge[STUDIO_GLB_MATERIAL_PARAM_KEY] = "emissive";
    merge.value = defaultGlbMaterialParamValue("emissive");
  }
  return merge;
}

export function buildInlineCatalogSpawnConfig(
  catalogAssetId: string,
  descriptors: readonly StudioAssetDescriptor[],
  mergeDefaultConfig: Record<string, unknown>,
): Record<string, unknown> | null {
  const d = getStudioModelDescriptorById(catalogAssetId, descriptors);
  if (d == null) {
    return null;
  }
  const persisted = persistedModelUrlFromStudioDescriptor(d);
  return {
    ...mergeDefaultConfig,
    [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: "",
    selectedStudioAssetId: d.id,
    selectedModelUrl: persisted,
  };
}

export function findCatalogEntry(
  entries: readonly NodeCatalogEntry[],
  catalogNodeId: string,
): NodeCatalogEntry | undefined {
  return entries.find((e) => e.id === catalogNodeId);
}
