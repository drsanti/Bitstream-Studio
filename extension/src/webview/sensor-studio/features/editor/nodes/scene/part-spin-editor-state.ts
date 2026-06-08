import { useMemo } from "react";
import type { TRNSelectOption } from "../../../../../ui/TRN";
import { useStudioGltfExtraction } from "../../gltf/useStudioGltfExtraction";
import {
  readGlbExtractTag,
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
} from "../../model/model-generated-bindings";
import { useGlbScopedModelCatalogFields } from "../../model/use-glb-scoped-model-catalog-fields";
import { readPartSpinNodeConfig } from "./part-spin-config";

export const GLB_PART_UNBOUND = "__part_unbound__";

export function buildPartSpinBindingPatch(
  ref: string,
  modelFlowId: string | undefined,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    [STUDIO_GLB_EXTRACT_KIND_KEY]: "part",
    [STUDIO_GLB_EXTRACT_REF_KEY]: ref.trim(),
  };
  if (modelFlowId != null && modelFlowId.trim().length > 0) {
    patch[STUDIO_SOURCE_MODEL_NODE_ID_KEY] = modelFlowId;
  }
  return patch;
}

export function usePartSpinEditorState(flowNodeId: string) {
  const {
    defaultConfig,
    modelRef,
    isModelWired,
    wiredModelDisplayLabel,
    modelSourceOptions,
    modelSourceValue,
    modelSourceDisabled,
    glbFetchUrl,
    modelReady,
  } = useGlbScopedModelCatalogFields(flowNodeId);

  const parsed = readPartSpinNodeConfig(defaultConfig);
  const extraction = useStudioGltfExtraction(glbFetchUrl);

  const partOptions: TRNSelectOption[] = useMemo(() => {
    if (extraction.state !== "ok" || extraction.result == null) {
      return [];
    }
    return extraction.result.parts.map((row) => ({
      value: row.ref,
      label: row.label.length > 0 ? row.label : row.ref,
    }));
  }, [extraction.result, extraction.state]);

  const glbTag = readGlbExtractTag(defaultConfig);
  const boundRef = glbTag?.kind === "part" ? glbTag.ref : parsed.partPath;
  const isBound = boundRef.length > 0;

  const partSelectOptions: TRNSelectOption[] = useMemo(() => {
    if (!modelReady) {
      return [{ value: GLB_PART_UNBOUND, label: "Select model first" }];
    }
    if (extraction.state === "loading") {
      if (isBound && boundRef.length > 0) {
        return [{ value: boundRef, label: `${boundRef} (loading…)` }];
      }
      return [{ value: GLB_PART_UNBOUND, label: "Loading parts…" }];
    }
    if (extraction.state === "error") {
      const msg =
        extraction.errorMessage != null && extraction.errorMessage.trim().length > 0
          ? extraction.errorMessage.trim()
          : "Failed to load GLB";
      return [{ value: GLB_PART_UNBOUND, label: msg }];
    }
    if (partOptions.length === 0) {
      return [{ value: GLB_PART_UNBOUND, label: "No parts in this GLB" }];
    }
    if (isBound) {
      if (partOptions.some((o) => o.value === boundRef)) {
        return partOptions;
      }
      return [{ value: boundRef, label: boundRef }, ...partOptions];
    }
    return [{ value: GLB_PART_UNBOUND, label: "Select part…" }, ...partOptions];
  }, [
    boundRef,
    extraction.errorMessage,
    extraction.state,
    isBound,
    modelReady,
    partOptions,
  ]);

  const partSelectValue = useMemo(() => {
    if (isBound && partOptions.some((o) => o.value === boundRef)) {
      return boundRef;
    }
    if (isBound && boundRef.length > 0) {
      return boundRef;
    }
    return GLB_PART_UNBOUND;
  }, [boundRef, isBound, partOptions]);

  const partSelectDisabled =
    !modelReady ||
    extraction.state === "loading" ||
    extraction.state === "error" ||
    (extraction.state === "ok" && partOptions.length === 0);

  return {
    parsed,
    modelRef,
    isModelWired,
    wiredModelDisplayLabel,
    modelSourceOptions,
    modelSourceValue,
    modelSourceDisabled,
    partSelectOptions,
    partSelectValue,
    partSelectDisabled,
    boundRef,
    isBound,
  };
}
