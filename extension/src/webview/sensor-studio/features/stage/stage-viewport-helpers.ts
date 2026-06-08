import { NODE_CATALOG_DEFAULTS } from "../../config/node-catalog.config";
import { applyStageScene3dPresentation } from "../../core/stage/stage-scene-defaults";
import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../../core/scene3d/scene3d-config";
import { STUDIO_HANDLE_ENV, STUDIO_HANDLE_MODELS } from "../editor/studio-handle-ids";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { resolveEvaluationGraph } from "../editor/subgraphs/studio-subgraph-store-sync";
import { STUDIO_ROOT_GRAPH_ID } from "../editor/subgraphs/studio-subgraph.types";
import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../asset-browser/studio-model-scene-bindings";
import { applyStudioModelCatalogSelectToNodeConfig } from "../editor/nodes/model-nodes/studio-model-catalog-select";
import type { StudioAssetDescriptor } from "../asset-browser/studio-asset.types";
import { useStageSceneStore } from "../../state/stage-scene.store";
import { getStageFocusedModelSelectContext } from "./stage-model-select-helpers";
import { resolveEnvironmentCubemapSelectValue } from "../editor/nodes/environment/environment-cubemap-select";
import {
  readStagePresentationPreferences,
  stagePresentationOverridesWiredEnvironment,
  stagePresentationSyncBackdrop,
  stagePresentationSyncCubemap,
  stagePresentationSyncIbl,
} from "./stage-presentation-preferences";
import type { StudioDemoTemplateId } from "../editor/store/flow-editor.store";

export const STAGE_DEMO_TEMPLATE_ID: StudioDemoTemplateId = "stage-scene-output";

export function runStageSceneOutputDemoTemplate(): void {
  const catalog = NODE_CATALOG_DEFAULTS.payload.nodes;
  useFlowEditorStore.getState().runDemoTemplate(STAGE_DEMO_TEMPLATE_ID, catalog);
}

function findSceneOutputNodeId(): string | null {
  const snapshotId = useStageSceneStore.getState().snapshot.sceneOutputNodeId;
  if (snapshotId != null) {
    return snapshotId;
  }
  const state = useFlowEditorStore.getState();
  const { nodes } = resolveEvaluationGraph(state);
  return (
    nodes.find((n) => n.type === "studio" && n.data.nodeId === "scene-output")?.id ?? null
  );
}

function getSceneOutputDocumentGraph(): {
  nodes: ReturnType<typeof useFlowEditorStore.getState>["nodes"];
  edges: ReturnType<typeof useFlowEditorStore.getState>["edges"];
} {
  const state = useFlowEditorStore.getState();
  return resolveEvaluationGraph(state);
}

function patchFlowNodeById(
  nodeId: string,
  patcher: (
    node: ReturnType<typeof useFlowEditorStore.getState>["nodes"][number],
  ) => ReturnType<typeof useFlowEditorStore.getState>["nodes"][number],
): void {
  useFlowEditorStore.setState((state) => {
    const apply = (
      list: ReturnType<typeof useFlowEditorStore.getState>["nodes"],
    ) => list.map((n) => (n.id === nodeId ? patcher(n) : n));
    const onRoot = state.rootNodes.some((n) => n.id === nodeId);
    if (onRoot) {
      const rootNodes = apply(state.rootNodes);
      if (state.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
        return { nodes: rootNodes, rootNodes };
      }
      return { rootNodes };
    }
    return { nodes: apply(state.nodes) };
  });
}

/** When Scene Output `env` is wired, Stage toolbar toggles patch this Environment node. */
export type StageEnvironmentWireContext = {
  wired: boolean;
  environmentNodeId: string | null;
  label: string | null;
};

export function getStageEnvironmentWireContext(): StageEnvironmentWireContext {
  const outputId = findSceneOutputNodeId();
  if (outputId == null) {
    return { wired: false, environmentNodeId: null, label: null };
  }
  const environmentNodeId = findWiredEnvironmentSourceNodeId(outputId);
  if (environmentNodeId == null) {
    return { wired: false, environmentNodeId: null, label: null };
  }
  const { nodes } = getSceneOutputDocumentGraph();
  const node = nodes.find((n) => n.id === environmentNodeId);
  const label =
    typeof node?.data.label === "string" && node.data.label.trim().length > 0
      ? node.data.label.trim()
      : "Environment";
  return { wired: true, environmentNodeId, label };
}

function shouldPatchWiredEnvironmentNode(
  environmentNodePatch: Record<string, unknown> | undefined,
): boolean {
  if (environmentNodePatch == null) {
    return false;
  }
  const prefs = readStagePresentationPreferences();
  if (!stagePresentationOverridesWiredEnvironment(prefs)) {
    return false;
  }
  if ("showBackgroundTexture" in environmentNodePatch) {
    return stagePresentationSyncBackdrop(prefs);
  }
  if ("useCubemapIbl" in environmentNodePatch) {
    return stagePresentationSyncIbl(prefs);
  }
  if ("presetIndex" in environmentNodePatch || "studioAssetId" in environmentNodePatch) {
    return stagePresentationSyncCubemap(prefs);
  }
  return true;
}

function findWiredEnvironmentSourceNodeId(outputNodeId: string): string | null {
  const { nodes, edges } = getSceneOutputDocumentGraph();
  const edge = edges.find(
    (e) =>
      e.target === outputNodeId &&
      (e.targetHandle ?? STUDIO_HANDLE_ENV) === STUDIO_HANDLE_ENV,
  );
  if (edge == null) {
    return null;
  }
  const source = nodes.find((n) => n.id === edge.source);
  if (source?.type !== "studio" || source.data.nodeId !== "environment") {
    return null;
  }
  return source.id;
}

function patchSceneOutputScene3d(
  mutator: (base: Scene3DConfigV1, showGrid: boolean) => Scene3DConfigV1,
  environmentNodePatch?: Record<string, unknown>,
): void {
  const outputId = findSceneOutputNodeId();
  if (outputId == null) {
    return;
  }
  const envSourceId = findWiredEnvironmentSourceNodeId(outputId);
  const patchNodes = (
    list: ReturnType<typeof useFlowEditorStore.getState>["nodes"],
  ) =>
    list.map((n) => {
      if (n.id === outputId && n.type === "studio") {
        const dc = { ...(n.data.defaultConfig as Record<string, unknown>) };
        const showGrid = typeof dc.showGrid === "boolean" ? dc.showGrid : false;
        const base =
          dc.scene3d != null
            ? coerceScene3DConfigV1(dc.scene3d)
            : defaultScene3DConfig();
        dc.scene3d = persistScene3DConfig(mutator(base, showGrid));
        return { ...n, data: { ...n.data, defaultConfig: dc } };
      }
      if (
        shouldPatchWiredEnvironmentNode(environmentNodePatch) &&
        envSourceId != null &&
        environmentNodePatch != null &&
        n.id === envSourceId &&
        n.type === "studio"
      ) {
        const dc = { ...(n.data.defaultConfig as Record<string, unknown>), ...environmentNodePatch };
        return { ...n, data: { ...n.data, defaultConfig: dc } };
      }
      return n;
    });
  useFlowEditorStore.setState((state) => {
    if (state.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
      const nodes = patchNodes(state.nodes);
      return { nodes, rootNodes: nodes, rootEdges: state.edges };
    }
    return { rootNodes: patchNodes(state.rootNodes) };
  });
  useFlowEditorStore.getState().tickSimulation({ forceStageSnapshot: true });
}

/** Patch Scene Output `scene3d` for the committed Stage snapshot (no wired Environment sync). */
export function patchCommittedScene3d(
  mutator: (base: Scene3DConfigV1, showGrid: boolean) => Scene3DConfigV1,
): void {
  patchSceneOutputScene3d(mutator);
}

function findPrimaryWiredModelSelectNodeId(outputNodeId: string): string | null {
  const { edges, nodes } = getSceneOutputDocumentGraph();
  const modelEdge = edges.find(
    (e) =>
      e.target === outputNodeId &&
      (e.targetHandle ?? STUDIO_HANDLE_MODELS) === STUDIO_HANDLE_MODELS,
  );
  if (modelEdge == null) {
    return null;
  }
  const src = nodes.find((n) => n.id === modelEdge.source);
  if (src?.type !== "studio" || src.data.nodeId !== "model-select") {
    return null;
  }
  return src.id;
}

/**
 * Stage Scene3D **Model** catalog pick: updates the wired **Model Select** node when present,
 * otherwise bakes into Scene Output `scene3d.model`.
 */
export function patchStageSceneModelCatalogSelect(
  catalogValue: string,
  descriptors: readonly StudioAssetDescriptor[],
): void {
  const outputId = findSceneOutputNodeId();
  if (outputId == null) {
    return;
  }

  const { snapshot, primaryModelIndex } = useStageSceneStore.getState();
  const focusedCtx = getStageFocusedModelSelectContext(snapshot.models, primaryModelIndex);
  const modelSelectId =
    focusedCtx.patchable && focusedCtx.sourceNodeId != null
      ? focusedCtx.sourceNodeId
      : findPrimaryWiredModelSelectNodeId(outputId);

  if (modelSelectId != null) {
    patchFlowNodeById(modelSelectId, (n) => {
      if (n.type !== "studio") {
        return n;
      }
      const dc = { ...(n.data.defaultConfig as Record<string, unknown>) };
      applyStudioModelCatalogSelectToNodeConfig(catalogValue, descriptors, (key, value) => {
        dc[key] = value;
      });
      return { ...n, data: { ...n.data, defaultConfig: dc } };
    });
    useFlowEditorStore.getState().tickSimulation({ forceStageSnapshot: true });
    return;
  }

  patchCommittedScene3d((base, showGrid) => {
    if (catalogValue === STUDIO_MODEL_SELECT_CUSTOM) {
      const { studioAssetId: _sid, ...rest } = base.model;
      return applyStageScene3dPresentation(
        { ...base, model: { ...rest, studioAssetId: undefined } },
        { showGrid },
      );
    }
    const picked = getStudioModelDescriptorById(catalogValue, descriptors);
    if (picked == null) {
      return applyStageScene3dPresentation(base, { showGrid });
    }
    return applyStageScene3dPresentation(
      {
        ...base,
        model: {
          ...base.model,
          url: persistedModelUrlFromStudioDescriptor(picked),
          studioAssetId: picked.id,
        },
      },
      { showGrid },
    );
  });
}

/** Sync Scene Output `showGrid` and re-evaluate the Stage snapshot. */
export function patchSceneOutputShowGrid(showGrid: boolean): void {
  const outputId = findSceneOutputNodeId();
  if (outputId == null) {
    return;
  }
  patchFlowNodeById(outputId, (n) => {
    if (n.type !== "studio") {
      return n;
    }
    const dc = { ...(n.data.defaultConfig as Record<string, unknown>) };
    dc.showGrid = showGrid;
    const base =
      dc.scene3d != null ? coerceScene3DConfigV1(dc.scene3d) : defaultScene3DConfig();
    dc.scene3d = persistScene3DConfig(applyStageScene3dPresentation(base, { showGrid }));
    return { ...n, data: { ...n.data, defaultConfig: dc } };
  });
  useFlowEditorStore.getState().tickSimulation({ forceStageSnapshot: true });
}

export function patchSceneOutputShowBackground(showBackgroundTexture: boolean): void {
  patchSceneOutputScene3d(
    (base, showGrid) =>
      applyStageScene3dPresentation(
        {
          ...base,
          environment: { ...base.environment, showBackgroundTexture },
        },
        { showGrid },
      ),
    { showBackgroundTexture },
  );
}

export function patchSceneOutputUseCubemapIbl(useCubemapIbl: boolean): void {
  patchSceneOutputScene3d(
    (base, showGrid) =>
      applyStageScene3dPresentation(
        {
          ...base,
          environment: { ...base.environment, useCubemapIbl },
        },
        { showGrid },
      ),
    { useCubemapIbl },
  );
}

/** Cubemap / HDRI preset from Stage toolbar — syncs wired Environment node when `env` is wired. */
export function patchSceneOutputEnvironmentFromSelect(
  selectValue: string,
  descriptors: readonly StudioAssetDescriptor[],
): void {
  const outputId = findSceneOutputNodeId();
  if (outputId == null) {
    return;
  }
  const { nodes } = getSceneOutputDocumentGraph();
  const outputNode = nodes.find((n) => n.id === outputId);
  const dc = (outputNode?.data.defaultConfig ?? {}) as Record<string, unknown>;
  const base =
    dc.scene3d != null ? coerceScene3DConfigV1(dc.scene3d) : defaultScene3DConfig();
  const resolved = resolveEnvironmentCubemapSelectValue(
    selectValue,
    descriptors,
    base.environment.presetIndex,
  );
  if (resolved == null) {
    return;
  }
  const hasCatalogId =
    resolved.studioAssetId != null && resolved.studioAssetId.trim().length > 0;
  const environmentNodePatch: Record<string, unknown> = {
    presetIndex: resolved.presetIndex,
    studioAssetId: hasCatalogId ? resolved.studioAssetId : "",
  };
  patchSceneOutputScene3d(
    (sceneBase, grid) =>
      applyStageScene3dPresentation(
        {
          ...sceneBase,
          environment: {
            ...sceneBase.environment,
            presetIndex: resolved.presetIndex,
            ...(hasCatalogId
              ? { studioAssetId: resolved.studioAssetId }
              : { studioAssetId: undefined }),
          },
        },
        { showGrid: grid },
      ),
    environmentNodePatch,
  );
}

export function patchSceneOutputFogEnabled(fogEnabled: boolean): void {
  patchSceneOutputScene3d((base, showGrid) =>
    applyStageScene3dPresentation(
      {
        ...base,
        fog: { ...base.fog, enabled: fogEnabled },
      },
      { showGrid },
    ),
  );
}
