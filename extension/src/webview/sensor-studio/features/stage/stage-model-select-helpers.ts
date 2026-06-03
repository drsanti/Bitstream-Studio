import type { StageSceneModelEntryV1 } from "../../core/stage/stage-scene-snapshot";
import type { StudioAssetDescriptor } from "../asset-browser/studio-asset.types";
import { applyStudioModelCatalogSelectToNodeConfig } from "../editor/nodes/model-nodes/studio-model-catalog-select";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { stagePresentationOverridesWiredStudioModel } from "./stage-presentation-preferences";

export type StageFocusedModelSelectContext = {
  /** Focused Models wire source is a **model-select** node. */
  patchable: boolean;
  sourceNodeId: string | null;
  sourceLabel: string | null;
};

export function getStageFocusedModelSelectContext(
  models: readonly StageSceneModelEntryV1[],
  primaryModelIndex: number,
): StageFocusedModelSelectContext {
  if (models.length === 0) {
    return { patchable: false, sourceNodeId: null, sourceLabel: null };
  }
  const idx = Math.max(0, Math.min(primaryModelIndex, models.length - 1));
  const entry = models[idx];
  const node = useFlowEditorStore.getState().nodes.find((n) => n.id === entry?.sourceNodeId);
  if (node?.type !== "studio" || node.data.nodeId !== "model-select") {
    return { patchable: false, sourceNodeId: entry?.sourceNodeId ?? null, sourceLabel: entry?.label ?? null };
  }
  return {
    patchable: true,
    sourceNodeId: node.id,
    sourceLabel: entry.label.length > 0 ? entry.label : null,
  };
}

/** Stage toolbar catalog pick — updates focused wired **model-select** node. */
export function patchStageFocusedModelCatalogSelect(
  models: readonly StageSceneModelEntryV1[],
  primaryModelIndex: number,
  selectValue: string,
  descriptors: readonly StudioAssetDescriptor[],
): void {
  const ctx = getStageFocusedModelSelectContext(models, primaryModelIndex);
  if (
    !stagePresentationOverridesWiredStudioModel() ||
    !ctx.patchable ||
    ctx.sourceNodeId == null
  ) {
    return;
  }
  const nodeId = ctx.sourceNodeId;
  useFlowEditorStore.setState((state) => ({
    nodes: state.nodes.map((n) => {
      if (n.id !== nodeId || n.type !== "studio") {
        return n;
      }
      const dc = { ...(n.data.defaultConfig as Record<string, unknown>) };
      const patchField = (key: string, value: unknown) => {
        dc[key] = value;
      };
      applyStudioModelCatalogSelectToNodeConfig(selectValue, descriptors, patchField);
      return { ...n, data: { ...n.data, defaultConfig: dc } };
    }),
  }));
  useFlowEditorStore.getState().tickSimulation();
}
