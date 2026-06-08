import { useMemo } from "react";
import type { TRNSelectOption } from "../../../../ui/TRN";
import { STUDIO_MODEL_SELECT_CUSTOM } from "../../asset-browser/studio-model-scene-bindings";
import { useStudioAssetDescriptors } from "../../asset-browser/useStudioAssetDescriptors";
import {
  resolveEventGlbActionModelRefForInspector,
  resolveLinkedStudioModelDisplayLabel,
} from "./model-generated-bindings";
import {
  formatStudioModelSelectOptionLabel,
  resolveWiredStudioModelFlowId,
} from "./studio-model-source-select";
import { buildStudioModelCatalogOnlySelectOptions } from "../nodes/model-nodes/studio-model-catalog-select-ui";
import { useFlowEditorStore } from "../store/flow-editor.store";
import {
  readGlbScopedModelCatalogSelectValue,
  resolveGlbScopedNodeGltfFetchUrl,
} from "./glb-scoped-model-catalog";

/** Shared catalog **Model** row for GLB-scoped nodes (Animation Clip, Part Spin, …). */
export function useGlbScopedModelCatalogFields(flowNodeId: string) {
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const { descriptors } = useStudioAssetDescriptors();

  const node = nodes.find((n) => n.id === flowNodeId);
  const defaultConfig = (node?.data.defaultConfig ?? {}) as Record<string, unknown>;

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
      readGlbScopedModelCatalogSelectValue(
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
    ? modelCatalogValue !== STUDIO_MODEL_SELECT_CUSTOM
      ? modelCatalogValue
      : STUDIO_MODEL_SELECT_CUSTOM
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
    () => resolveGlbScopedNodeGltfFetchUrl(flowNodeId, defaultConfig, nodes, edges, descriptors),
    [defaultConfig, descriptors, edges, flowNodeId, nodes],
  );

  const modelReady = glbFetchUrl != null;

  return {
    defaultConfig,
    modelRef,
    isModelWired,
    wiredModelDisplayLabel,
    modelSourceOptions,
    modelSourceValue,
    modelSourceDisabled,
    glbFetchUrl,
    modelReady,
  };
}
