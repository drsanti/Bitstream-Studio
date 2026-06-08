import { create } from "zustand";
import type { StudioGltfExtractKind, StudioGltfExtractRow } from "../gltf/studio-gltf-extract";
import type { StudioGltfExtractionResult } from "../gltf/studio-gltf-extract";
import type { ModelOutlinerTypeFilter } from "./model-outliner-type-filter";
import type { ModelOutlinerScopeMode } from "./model-outliner-ui-persistence";

export type ModelOutlinerNavigatePayload = {
  scopeMode?: ModelOutlinerScopeMode;
  canvasModelId?: string | null;
  catalogAssetId?: string | null;
  typeFilter?: ModelOutlinerTypeFilter;
  scenePath?: string | null;
  selectExtractRow?: { kind: StudioGltfExtractKind; ref: string } | null;
};

type ModelOutlinerNavigationStore = {
  seq: number;
  payload: ModelOutlinerNavigatePayload | null;
  requestNavigate: (payload: ModelOutlinerNavigatePayload) => void;
  clearNavigate: () => void;
};

export const useModelOutlinerNavigationStore = create<ModelOutlinerNavigationStore>((set, get) => ({
  seq: 0,
  payload: null,
  requestNavigate: (payload) => {
    set({ seq: get().seq + 1, payload });
  },
  clearNavigate: () => set({ payload: null }),
}));

export function focusModelOutlinerPane(focusWorkbenchPane: (editorType: string) => void): void {
  focusWorkbenchPane("model-outliner");
}

export function openModelOutliner(
  focusWorkbenchPane: (editorType: string) => void,
  payload: ModelOutlinerNavigatePayload,
): void {
  useModelOutlinerNavigationStore.getState().requestNavigate(payload);
  focusModelOutlinerPane(focusWorkbenchPane);
}

export function findExtractRowInExtraction(
  extraction: StudioGltfExtractionResult,
  target: { kind: StudioGltfExtractKind; ref: string },
): StudioGltfExtractRow | null {
  const lists: StudioGltfExtractRow[][] = [
    extraction.animations,
    extraction.parts,
    extraction.materials,
    extraction.morphs,
    extraction.lights,
    extraction.cameras,
  ];
  for (const list of lists) {
    const row = list.find((r) => r.kind === target.kind && r.ref === target.ref);
    if (row != null) {
      return row;
    }
  }
  return null;
}

export function buildCanvasModelOutlinerNavigate(
  canvasModelId: string,
  typeFilter?: ModelOutlinerTypeFilter,
): ModelOutlinerNavigatePayload {
  return {
    scopeMode: "canvas-model-select",
    canvasModelId,
    typeFilter,
  };
}

export function buildCatalogOutlinerNavigate(
  catalogAssetId: string,
  typeFilter?: ModelOutlinerTypeFilter,
): ModelOutlinerNavigatePayload {
  return {
    scopeMode: "catalog-inline",
    catalogAssetId,
    typeFilter,
  };
}
