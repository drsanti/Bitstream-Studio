import { useMemo } from "react";

import type { TRNSelectOption } from "../../../../../ui/TRN";

import { STUDIO_MODEL_SELECT_CUSTOM } from "../../../asset-browser/studio-model-scene-bindings";

import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";

import { useStudioGltfExtraction } from "../../gltf/useStudioGltfExtraction";

import {

  readGlbExtractTag,

  readSourceModelNodeId,

  resolveEventGlbActionModelRefForInspector,

  resolveLinkedStudioModelDisplayLabel,

  STUDIO_GLB_EXTRACT_KIND_KEY,

  STUDIO_GLB_EXTRACT_REF_KEY,

  STUDIO_SOURCE_MODEL_NODE_ID_KEY,

} from "../../model/model-generated-bindings";

import {

  formatStudioModelSelectOptionLabel,

  resolveWiredStudioModelFlowId,

} from "../../model/studio-model-source-select";

import { buildStudioModelCatalogOnlySelectOptions } from "../model-nodes/studio-model-catalog-select-ui";

import { useFlowEditorStore } from "../../store/flow-editor.store";

import {

  ANIMATION_CLIP_NAME_KEY,

  readAnimationClipNodeConfig,

} from "./animation-clip-config";

import {

  readAnimationClipModelCatalogSelectValue,

  resolveAnimationClipGltfFetchUrl,

} from "./animation-clip-model-catalog";



export const GLB_CLIP_UNBOUND = "__unbound__";



export function buildAnimationClipBindingPatch(

  ref: string,

  modelFlowId: string | undefined,

): Record<string, unknown> {

  const patch: Record<string, unknown> = {

    [STUDIO_GLB_EXTRACT_KIND_KEY]: "animation",

    [STUDIO_GLB_EXTRACT_REF_KEY]: ref.trim(),

    [ANIMATION_CLIP_NAME_KEY]: ref.trim(),

  };

  if (modelFlowId != null && modelFlowId.trim().length > 0) {

    patch[STUDIO_SOURCE_MODEL_NODE_ID_KEY] = modelFlowId;

  }

  return patch;

}



/** Persist **Model Source** scope from the unwired dropdown; clear stale clip when model changes. */

export function buildAnimationClipModelSourcePatch(

  modelFlowId: string,

  currentConfig: Record<string, unknown>,

): Record<string, unknown> {

  const prevId = readSourceModelNodeId(currentConfig);

  const patch: Record<string, unknown> = {

    [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,

  };

  if (prevId !== modelFlowId) {

    patch[STUDIO_GLB_EXTRACT_KIND_KEY] = "";

    patch[STUDIO_GLB_EXTRACT_REF_KEY] = "";

    patch[ANIMATION_CLIP_NAME_KEY] = "";

  }

  return patch;

}



export function useAnimationClipEditorState(flowNodeId: string) {

  const nodes = useFlowEditorStore((s) => s.nodes);

  const edges = useFlowEditorStore((s) => s.edges);

  const { descriptors } = useStudioAssetDescriptors();



  const node = nodes.find((n) => n.id === flowNodeId);

  const defaultConfig = (node?.data.defaultConfig ?? {}) as Record<string, unknown>;

  const parsed = readAnimationClipNodeConfig(defaultConfig);



  const wiredModelFlowId = useMemo(

    () => resolveWiredStudioModelFlowId(flowNodeId, nodes, edges),

    [edges, flowNodeId, nodes],

  );

  const isModelWired = wiredModelFlowId != null;



  const modelRef = useMemo(

    () => resolveEventGlbActionModelRefForInspector(nodes, edges, flowNodeId),

    [edges, flowNodeId, nodes],

  );



  const modelLabel = useMemo(() => {

    if (node == null) {

      return null;

    }

    return resolveLinkedStudioModelDisplayLabel(node, nodes, edges);

  }, [edges, node, nodes]);



  const catalogModelOptions = useMemo(

    () => buildStudioModelCatalogOnlySelectOptions(descriptors),

    [descriptors],

  );



  const modelCatalogValue = useMemo(

    () =>

      readAnimationClipModelCatalogSelectValue(

        flowNodeId,

        defaultConfig,

        nodes,

        edges,

        descriptors,

      ),

    [defaultConfig, descriptors, edges, flowNodeId, nodes],

  );



  const modelSourceOptions: TRNSelectOption[] = useMemo(() => {

    if (catalogModelOptions.length === 0) {

      return [{ value: STUDIO_MODEL_SELECT_CUSTOM, label: "No models in catalog" }];

    }

    if (modelCatalogValue !== STUDIO_MODEL_SELECT_CUSTOM) {

      return catalogModelOptions;

    }

    return [{ value: STUDIO_MODEL_SELECT_CUSTOM, label: "Select model…" }, ...catalogModelOptions];

  }, [catalogModelOptions, modelCatalogValue]);



  const modelSourceValue = isModelWired

    ? (modelCatalogValue !== STUDIO_MODEL_SELECT_CUSTOM

        ? modelCatalogValue

        : STUDIO_MODEL_SELECT_CUSTOM)

    : modelCatalogValue;



  const wiredModelDisplayLabel = useMemo(() => {

    if (!isModelWired || wiredModelFlowId == null) {

      return null;

    }

    const parent = nodes.find((n) => n.id === wiredModelFlowId);

    if (parent == null) {

      return modelLabel?.displayLabel ?? "Linked model";

    }

    const fromCatalog = catalogModelOptions.find((o) => o.value === modelCatalogValue);

    if (fromCatalog != null && typeof fromCatalog.label === "string") {

      return fromCatalog.label;

    }

    return formatStudioModelSelectOptionLabel(parent, descriptors);

  }, [

    catalogModelOptions,

    descriptors,

    isModelWired,

    modelCatalogValue,

    modelLabel?.displayLabel,

    nodes,

    wiredModelFlowId,

  ]);



  const modelSourceDisabled = isModelWired || catalogModelOptions.length === 0;



  const glbFetchUrl = useMemo(

    () => resolveAnimationClipGltfFetchUrl(flowNodeId, defaultConfig, nodes, edges, descriptors),

    [defaultConfig, descriptors, edges, flowNodeId, nodes],

  );



  const modelReadyForClips = glbFetchUrl != null;



  const extraction = useStudioGltfExtraction(glbFetchUrl);



  const clipOptions: TRNSelectOption[] = useMemo(() => {

    if (extraction.state !== "ok" || extraction.result == null) {

      return [];

    }

    return extraction.result.animations.map((row) => ({

      value: row.ref,

      label:

        row.durationS != null && row.durationS > 0

          ? `${row.label} (${row.durationS.toFixed(2)}s)`

          : row.label,

    }));

  }, [extraction.result, extraction.state]);



  const glbTag = readGlbExtractTag(defaultConfig);

  const boundRef = glbTag?.kind === "animation" ? glbTag.ref : parsed.clipName;

  const isBound = boundRef.length > 0;



  const selectOptions: TRNSelectOption[] = useMemo(() => {

    if (!modelReadyForClips) {

      return [{ value: GLB_CLIP_UNBOUND, label: "Select model first" }];

    }

    if (extraction.state === "loading") {

      if (isBound && boundRef.length > 0) {

        return [{ value: boundRef, label: `${boundRef} (loading…)` }];

      }

      return [{ value: GLB_CLIP_UNBOUND, label: "Loading clips…" }];

    }

    if (extraction.state === "error") {

      const msg =

        extraction.errorMessage != null && extraction.errorMessage.trim().length > 0

          ? extraction.errorMessage.trim()

          : "Failed to load GLB";

      return [{ value: GLB_CLIP_UNBOUND, label: msg }];

    }

    if (clipOptions.length === 0) {

      return [{ value: GLB_CLIP_UNBOUND, label: "No clips in this GLB" }];

    }

    if (isBound) {

      if (clipOptions.some((o) => o.value === boundRef)) {

        return clipOptions;

      }

      return [{ value: boundRef, label: boundRef }, ...clipOptions];

    }

    return [{ value: GLB_CLIP_UNBOUND, label: "Select clip…" }, ...clipOptions];

  }, [

    boundRef,

    clipOptions,

    extraction.errorMessage,

    extraction.state,

    isBound,

    modelReadyForClips,

  ]);



  const selectValue = useMemo(() => {

    if (isBound && clipOptions.some((o) => o.value === boundRef)) {

      return boundRef;

    }

    if (isBound && boundRef.length > 0) {

      return boundRef;

    }

    return GLB_CLIP_UNBOUND;

  }, [boundRef, clipOptions, isBound]);



  const clipSelectDisabled =

    !modelReadyForClips ||

    extraction.state === "loading" ||

    extraction.state === "error" ||

    (extraction.state === "ok" && clipOptions.length === 0);



  return {

    parsed,

    modelRef,

    modelLabel,

    isModelWired,

    wiredModelDisplayLabel,

    modelSourceOptions,

    modelSourceValue,

    modelSourceDisabled,

    extraction,

    clipOptions,

    selectOptions,

    selectValue,

    clipSelectDisabled,

    boundRef,

    isBound,

  };

}


