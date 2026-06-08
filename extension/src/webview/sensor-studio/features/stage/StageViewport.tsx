import { useCallback, useEffect, useMemo, useRef } from "react";
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import { MonitorPlay } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import type { RotationPreviewSceneProps } from "../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import { sceneObjectRefFromStagePick } from "../../core/stage/scene-object-ref";
import { buildStagePreviewSceneProps } from "../../core/stage/evaluate-stage-scene-snapshot";
import { buildStageFlowMediaSceneProps } from "../../core/stage/build-stage-flow-media-scene-props";
import { useStageFlowEvaluationGraph } from "../../core/stage/use-stage-flow-evaluation-graph";
import { graphHasVisionHudNodes } from "../../core/camera/collect-vision-hud-chips";
import {
  isStageEditMode,
  isStageSimulateMode,
} from "../../core/stage/stage-workbench-mode";
import { useStageSceneStore } from "../../state/stage-scene.store";
import { useStageViewportNavigationStore } from "../../state/stage-viewport-navigation.store";
import { canDeleteStageSceneSelection } from "../../core/stage/stage-scene-selection-delete";
import {
  commitStageSceneTransformWrite,
  isStageSceneGizmoEligible,
} from "../../core/stage/stage-scene-transform-write";
import { flowWireTransformFromObject3D } from "../editor/nodes/transform/flow-wire-transform-from-object3d";
import {
  StudioSceneViewport,
  type StudioSceneViewportHandle,
} from "../../core/viewport/StudioSceneViewport";
import type { StudioViewportViewSnapId } from "../../core/viewport/studio-viewport-view-snaps";
import { rotationPreviewOrientationFromTransformWire } from "../editor/nodes/transform/flow-wire-transform-preview-orientation";
import { StageViewportToolbar } from "./StageViewportToolbar";
import { SensorStudioPerformanceViewportOverlay } from "../shell/SensorStudioPerformanceViewportOverlay";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { useStudioWorkbenchFocusStore } from "../../state/studio-workbench-focus.store";
import { useSensorStudioPerformanceStore } from "../../state/sensor-studio-performance.store";
import { useStudioRuntimeVisibilityStore } from "../../state/studio-runtime-visibility.store";
import { scene3dInspectorEnvironmentCatalogSelectValue } from "../asset-browser/studio-environment-scene-bindings";
import { useStudioAssetDescriptors } from "../asset-browser/useStudioAssetDescriptors";
import { buildEnvironmentCubemapSelectOptions } from "../editor/nodes/environment/environment-cubemap-select";
import {
  buildStudioModelCatalogSelectOptions,
  readStudioModelCatalogSelectValue,
} from "../editor/nodes/model-nodes/studio-model-catalog-select";
import {
  stagePresentationOverridesWiredStudioModel,
  stagePresentationSyncCubemap,
  stageSpawnToolbarEnabled,
  stageToolbarPresentationEnabled,
  useStagePresentationPreferences,
} from "./stage-presentation-preferences";
import {
  getStageFocusedModelSelectContext,
  patchStageFocusedModelCatalogSelect,
} from "./stage-model-select-helpers";
import {
  getStageEnvironmentWireContext,
  patchSceneOutputEnvironmentFromSelect,
  patchSceneOutputFogEnabled,
  patchSceneOutputShowBackground,
  patchSceneOutputShowGrid,
  patchSceneOutputUseCubemapIbl,
  runStageSceneOutputDemoTemplate,
} from "./stage-viewport-helpers";
import { useStageViewportNavigationShortcuts } from "./use-stage-viewport-navigation-shortcuts";
import {
  spawnKindTitle,
  type StageProceduralSpawnKind,
} from "../../core/stage/stage-procedural-spawn-kind";

/**
 * Full-bleed Stage pane (node-animator **Stage** parity).
 * Committed scene comes from **Scene Output** via {@link evaluateStageSceneSnapshot}.
 */
export function StageViewport() {
  const snapshot = useStageSceneStore((s) => s.snapshot);
  const primaryModelIndex = useStageSceneStore((s) => s.primaryModelIndex);
  const setPrimaryModelIndex = useStageSceneStore((s) => s.setPrimaryModelIndex);
  const selectedSceneObject = useStageSceneStore((s) => s.selectedSceneObject);
  const setSelectedSceneObject = useStageSceneStore((s) => s.setSelectedSceneObject);
  const setLastViewportPick = useStageSceneStore((s) => s.setLastViewportPick);
  const spawnPendingKind = useStageSceneStore((s) => s.spawnPendingKind);
  const setSpawnPendingKind = useStageSceneStore((s) => s.setSpawnPendingKind);
  const workbenchMode = useStageSceneStore((s) => s.workbenchMode);
  const setWorkbenchMode = useStageSceneStore((s) => s.setWorkbenchMode);
  const setGizmoLiveTransform = useStageSceneStore((s) => s.setGizmoLiveTransform);
  const clearGizmoLiveTransform = useStageSceneStore((s) => s.clearGizmoLiveTransform);
  const pushUndoSnapshot = useFlowEditorStore((s) => s.pushUndoSnapshot);
  const tickSimulation = useFlowEditorStore((s) => s.tickSimulation);
  const deleteStageSceneSelection = useFlowEditorStore((s) => s.deleteStageSceneSelection);
  const stageEditMode = isStageEditMode(workbenchMode);

  useEffect(() => {
    if (isStageSimulateMode(workbenchMode)) {
      tickSimulation({ forceStageSnapshot: true });
    }
  }, [tickSimulation, workbenchMode]);

  const viewportProjection = useStageViewportNavigationStore((s) => s.projection);
  const viewportOrthoZoom = useStageViewportNavigationStore((s) => s.orthoZoom);
  const viewportMousePreset = useStageViewportNavigationStore((s) => s.mousePreset);
  const viewportViewSnapMode = useStageViewportNavigationStore((s) => s.viewSnapMode);
  const toggleViewportProjection = useStageViewportNavigationStore((s) => s.toggleProjection);
  const setViewportOrthoZoom = useStageViewportNavigationStore((s) => s.setOrthoZoom);
  const viewportGizmoMode = useStageViewportNavigationStore((s) => s.gizmoMode);
  const setViewportGizmoMode = useStageViewportNavigationStore((s) => s.setGizmoMode);

  const viewportRef = useRef<StudioSceneViewportHandle>(null);
  const stagePaneVisible = useStudioRuntimeVisibilityStore((s) => s.stagePaneVisible);
  const stage3dMaxFps = useSensorStudioPerformanceStore((s) => s.preferences.stage3dMaxFps);
  const { preferences: stagePresentationPreferences } = useStagePresentationPreferences();

  const hasSceneOutput = snapshot.sceneOutputNodeId != null;
  const hasModel = snapshot.models.some((m) => m.modelUrl.length > 0);
  const hasMeshes = snapshot.meshes.length > 0;
  const hasStageContent = hasModel || hasMeshes;

  const { nodes: flowNodes, edges: flowEdges } = useStageFlowEvaluationGraph();

  const modelSelectOptions = useMemo(
    () =>
      snapshot.models.map((m, i) => ({
        value: String(i),
        label: m.label.length > 0 ? m.label : `Model ${i + 1}`,
      })),
    [snapshot.models],
  );

  const sceneProps = useMemo((): RotationPreviewSceneProps | null => {
    if (!hasStageContent) {
      return null;
    }
    const built = buildStagePreviewSceneProps(snapshot, primaryModelIndex);
    const focusedModel = snapshot.models[primaryModelIndex] ?? snapshot.models[0];
    const stageMedia = buildStageFlowMediaSceneProps({
      nodes: flowNodes,
      edges: flowEdges,
      sceneOutputNodeId: snapshot.sceneOutputNodeId,
      primaryModelSourceNodeId: focusedModel?.sourceNodeId ?? null,
    });
    const orientation = rotationPreviewOrientationFromTransformWire(snapshot.transformWire);
    return {
      ...orientation,
      ...built.glbAnimationSceneExtras,
      ...stageMedia,
      meshOrientationFromEulerFallback: false,
      fusionEulerHundredths: null,
      showGrid: built.showGrid,
      showBackgroundTexture: built.showBackgroundTexture,
      useCubemapIbl: built.useCubemapIbl,
      environmentPresetIndex: built.environmentPresetIndex,
      scene3d: built.scene3d,
      previewMeshGlbUrl: built.previewMeshGlbUrl,
      stageModelInstances: built.stageModelInstances,
      stagePrimaryModelIndex: built.stagePrimaryModelIndex,
      stagePhysicsWire: built.stagePhysicsWire,
      stagePhysicsColliders: built.stagePhysicsColliders,
      stageProceduralMeshes: built.stageProceduralMeshes,
    };
  }, [flowEdges, flowNodes, hasStageContent, primaryModelIndex, snapshot]);

  const visionHudNodes = useMemo(
    () => (graphHasVisionHudNodes(flowNodes) ? flowNodes : []),
    [flowNodes],
  );

  const dispatchStagePick = useFlowEditorStore((s) => s.dispatchStagePickEvent);
  const selectStudioNodesByIds = useFlowEditorStore((s) => s.selectStudioNodesByIds);
  const spawnStageProceduralPrimitive = useFlowEditorStore(
    (s) => s.spawnStageProceduralPrimitive,
  );
  const fitFlowCanvasToNodeIds = useFlowEditorStore((s) => s.fitFlowCanvasToNodeIds);
  const setActiveEditorType = useStudioWorkbenchFocusStore((s) => s.setActiveEditorType);

  const onStagePaneFocus = useCallback(() => {
    setActiveEditorType("stage");
  }, [setActiveEditorType]);

  const environmentWire = useMemo(
    () => getStageEnvironmentWireContext(),
    [flowNodes, flowEdges],
  );

  const { descriptors } = useStudioAssetDescriptors();
  const environmentSelectOptions = useMemo(
    () =>
      buildEnvironmentCubemapSelectOptions(descriptors, {
        presetIndex: snapshot.scene3d.environment.presetIndex,
        studioAssetId: snapshot.scene3d.environment.studioAssetId,
      }),
    [
      descriptors,
      snapshot.scene3d.environment.presetIndex,
      snapshot.scene3d.environment.studioAssetId,
    ],
  );
  const environmentSelectValue = useMemo(
    () =>
      scene3dInspectorEnvironmentCatalogSelectValue(
        {
          presetIndex: snapshot.scene3d.environment.presetIndex,
          studioAssetId: snapshot.scene3d.environment.studioAssetId,
        },
        descriptors,
        getEngineEnvironmentCubeMaps(),
      ),
    [
      descriptors,
      snapshot.scene3d.environment.presetIndex,
      snapshot.scene3d.environment.studioAssetId,
    ],
  );
  const onEnvironmentSelectChange = useCallback(
    (value: string) => {
      patchSceneOutputEnvironmentFromSelect(value, descriptors);
    },
    [descriptors],
  );

  const focusedModelSelect = useMemo(
    () => getStageFocusedModelSelectContext(snapshot.models, primaryModelIndex),
    [flowNodes, snapshot.models, primaryModelIndex],
  );

  const studioModelCatalogOptions = useMemo(
    () => buildStudioModelCatalogSelectOptions(descriptors),
    [descriptors],
  );

  const studioModelCatalogValue = useMemo(() => {
    if (!focusedModelSelect.patchable || focusedModelSelect.sourceNodeId == null) {
      return "";
    }
    const node = flowNodes.find((n) => n.id === focusedModelSelect.sourceNodeId);
    if (node == null) {
      return "";
    }
    return readStudioModelCatalogSelectValue(
      node.data.defaultConfig as Record<string, unknown>,
      descriptors,
    );
  }, [descriptors, flowNodes, focusedModelSelect.patchable, focusedModelSelect.sourceNodeId]);

  const onStudioModelCatalogChange = useCallback(
    (value: string) => {
      patchStageFocusedModelCatalogSelect(
        snapshot.models,
        primaryModelIndex,
        value,
        descriptors,
      );
    },
    [descriptors, primaryModelIndex, snapshot.models],
  );

  const onToggleGrid = useCallback(() => {
    patchSceneOutputShowGrid(!snapshot.showGrid);
  }, [snapshot.showGrid]);

  const onToggleBackground = useCallback(() => {
    patchSceneOutputShowBackground(!snapshot.scene3d.environment.showBackgroundTexture);
  }, [snapshot.scene3d.environment.showBackgroundTexture]);

  const onToggleIbl = useCallback(() => {
    patchSceneOutputUseCubemapIbl(!snapshot.scene3d.environment.useCubemapIbl);
  }, [snapshot.scene3d.environment.useCubemapIbl]);

  const onToggleFog = useCallback(() => {
    patchSceneOutputFogEnabled(!snapshot.scene3d.fog.enabled);
  }, [snapshot.scene3d.fog.enabled]);

  const onStagePick = useCallback(
    (pick: {
      button: number;
      modelIndex: number;
      sourceNodeId: string;
      hitPoint: { x: number; y: number; z: number };
      objectPath: string;
    }) => {
      setLastViewportPick(pick);
      dispatchStagePick(pick);
    },
    [dispatchStagePick, setLastViewportPick],
  );

  const onStageSelect = useCallback(
    (pick: {
      button: number;
      modelIndex: number;
      sourceNodeId: string;
      hitPoint: { x: number; y: number; z: number };
      objectPath: string;
    }) => {
      if (spawnPendingKind != null && stageEditMode) {
        const spawned = spawnStageProceduralPrimitive({
          kind: spawnPendingKind,
          hitPoint: pick.hitPoint,
        });
        setSpawnPendingKind(null);
        if (spawned != null) {
          setSelectedSceneObject({
            kind: "procedural",
            sourceNodeId: spawned.meshFlowNodeId,
            objectPath: spawned.objectPath,
            modelIndex: pick.modelIndex,
          });
        }
        return;
      }
      const ref = sceneObjectRefFromStagePick(pick);
      setSelectedSceneObject(ref);
    },
    [
      setSelectedSceneObject,
      setSpawnPendingKind,
      spawnPendingKind,
      spawnStageProceduralPrimitive,
      stageEditMode,
    ],
  );

  const onToggleSpawnKind = useCallback(
    (kind: StageProceduralSpawnKind) => {
      setSpawnPendingKind(spawnPendingKind === kind ? null : kind);
    },
    [setSpawnPendingKind, spawnPendingKind],
  );

  const onCancelSpawnPending = useCallback(() => {
    setSpawnPendingKind(null);
  }, [setSpawnPendingKind]);

  const onStageClearSelection = useCallback(() => {
    setSelectedSceneObject(null);
    selectStudioNodesByIds([]);
  }, [selectStudioNodesByIds, setSelectedSceneObject]);

  const onFrameModel = useCallback(() => {
    viewportRef.current?.framePrimaryModel();
  }, []);

  const onFrameSelection = useCallback(() => {
    viewportRef.current?.frameSelection();
  }, []);

  const onResetCamera = useCallback(() => {
    viewportRef.current?.resetCameraToScene3d();
  }, []);

  const onSnapView = useCallback((snap: StudioViewportViewSnapId) => {
    viewportRef.current?.snapToView(snap);
  }, []);

  const stageGizmoEligible = useMemo(
    () => isStageSceneGizmoEligible(selectedSceneObject, flowNodes, flowEdges),
    [flowEdges, flowNodes, selectedSceneObject],
  );
  const stageGizmoEnabled = stageGizmoEligible && stageEditMode;
  const stageDeleteSelectionEnabled = useMemo(
    () =>
      stageEditMode &&
      canDeleteStageSceneSelection({
        selection: selectedSceneObject,
        nodes: flowNodes,
        edges: flowEdges,
      }),
    [flowEdges, flowNodes, selectedSceneObject, stageEditMode],
  );

  const onDeleteStageSelection = useCallback(() => {
    if (selectedSceneObject == null) {
      return;
    }
    const deleted = deleteStageSceneSelection(selectedSceneObject);
    if (deleted) {
      setSelectedSceneObject(null);
      selectStudioNodesByIds([]);
    }
  }, [
    deleteStageSceneSelection,
    selectStudioNodesByIds,
    selectedSceneObject,
    setSelectedSceneObject,
  ]);

  const onStageTransformBeginDrag = useCallback(() => {
    pushUndoSnapshot();
  }, [pushUndoSnapshot]);

  const onStageTransformLiveChange = useCallback(
    (object: import("three").Object3D) => {
      if (selectedSceneObject == null) {
        return;
      }
      setGizmoLiveTransform({
        objectPath: selectedSceneObject.objectPath,
        transform: flowWireTransformFromObject3D(object),
      });
    },
    [selectedSceneObject, setGizmoLiveTransform],
  );

  const onStageTransformCommit = useCallback(
    (object: import("three").Object3D) => {
      if (selectedSceneObject == null) {
        return;
      }
      commitStageSceneTransformWrite({
        selection: selectedSceneObject,
        transform: flowWireTransformFromObject3D(object),
        nodes: flowNodes,
        edges: flowEdges,
        recordUndo: false,
      });
      clearGizmoLiveTransform();
    },
    [clearGizmoLiveTransform, flowEdges, flowNodes, selectedSceneObject],
  );

  useStageViewportNavigationShortcuts({
    enabled: hasStageContent,
    onToggleProjection: toggleViewportProjection,
    onSnapView,
    onFrameSelection,
    onResetCamera,
    gizmoEnabled: stageGizmoEnabled,
    onSetGizmoMode: setViewportGizmoMode,
    spawnPending: spawnPendingKind != null,
    onCancelSpawnPending,
    deleteSelectionEnabled: stageDeleteSelectionEnabled,
    onDeleteSelection: onDeleteStageSelection,
  });

  const loadDemoButton = (
    <TRNButton className="mt-2 h-8 border border-zinc-600/80 bg-zinc-800/80 px-3 text-xs text-zinc-200" onClick={runStageSceneOutputDemoTemplate}>
      Load Stage demo
    </TRNButton>
  );

  if (!hasSceneOutput) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 bg-zinc-950 px-6 text-center">
        <MonitorPlay className="size-8 text-violet-400/80" strokeWidth={1.75} aria-hidden />
        <p className="text-sm font-medium text-zinc-200">Stage</p>
        <p className="max-w-md text-xs leading-relaxed text-zinc-500">
          Add a <span className="font-medium text-zinc-400">Scene Output</span> node on the Flow
          canvas and wire <span className="font-medium text-zinc-400">Models</span> (Model Source
          nodes) plus optional Environment, Camera, Transform, and Animation inputs.
        </p>
        {loadDemoButton}
      </div>
    );
  }

  if (!hasStageContent) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 bg-zinc-950 px-6 text-center">
        <MonitorPlay className="size-8 text-amber-400/70" strokeWidth={1.75} aria-hidden />
        <p className="text-sm font-medium text-zinc-200">Scene Output ready</p>
        <p className="max-w-md text-xs leading-relaxed text-zinc-500">
          Wire <span className="font-medium text-zinc-400">Model Source</span> nodes into{" "}
          <span className="font-medium text-zinc-400">Models</span> and/or procedural{" "}
          <span className="font-medium text-zinc-400">Mesh Box / Sphere / Plane</span> nodes into{" "}
          <span className="font-medium text-zinc-400">Meshes</span> on Scene Output.
        </p>
        {loadDemoButton}
      </div>
    );
  }

  return (
    <div
      className="group/stage pointer-events-auto relative h-full min-h-0 w-full bg-zinc-950"
      onPointerDownCapture={onStagePaneFocus}
    >
      <StageViewportToolbar
        showGrid={snapshot.showGrid}
        showBackgroundTexture={snapshot.scene3d.environment.showBackgroundTexture}
        useCubemapIbl={snapshot.scene3d.environment.useCubemapIbl}
        environmentWired={environmentWire.wired}
        environmentSelectOptions={environmentSelectOptions}
        environmentSelectValue={environmentSelectValue}
        onEnvironmentSelectChange={onEnvironmentSelectChange}
        fogEnabled={snapshot.scene3d.fog.enabled}
        physicsActive={snapshot.physicsWire?.enabled === true}
        colliderCount={snapshot.physicsColliders.length}
        modelCount={snapshot.models.length}
        modelSelectOptions={modelSelectOptions}
        primaryModelIndex={primaryModelIndex}
        onPrimaryModelIndexChange={setPrimaryModelIndex}
        studioModelCatalogOptions={studioModelCatalogOptions}
        studioModelCatalogValue={studioModelCatalogValue}
        onStudioModelCatalogChange={onStudioModelCatalogChange}
        studioModelCatalogPatchable={
          focusedModelSelect.patchable && stagePresentationOverridesWiredStudioModel()
        }
        stageToolbarPresentationEnabled={stageToolbarPresentationEnabled()}
        stageEnvironmentPickerEnabled={stagePresentationSyncCubemap()}
        stageBackdropControlEnabled={stageToolbarPresentationEnabled()}
        stageIblControlEnabled={stageToolbarPresentationEnabled()}
        studioModelSourceLabel={focusedModelSelect.sourceLabel}
        onToggleGrid={onToggleGrid}
        onToggleBackground={onToggleBackground}
        onToggleIbl={onToggleIbl}
        onToggleFog={onToggleFog}
        onFrameModel={onFrameModel}
        onResetCamera={onResetCamera}
        viewportProjection={viewportProjection}
        onToggleViewportProjection={toggleViewportProjection}
        workbenchMode={workbenchMode}
        onWorkbenchModeChange={setWorkbenchMode}
        gizmoEligible={stageGizmoEnabled}
        gizmoMode={viewportGizmoMode}
        onGizmoModeChange={setViewportGizmoMode}
        spawnEnabled={
          stageEditMode &&
          stageSpawnToolbarEnabled(
            {
              hasSceneOutput,
              hasMeshes,
            },
            stagePresentationPreferences,
          )
        }
        spawnPendingKind={spawnPendingKind}
        onToggleSpawnKind={onToggleSpawnKind}
      />
      {spawnPendingKind != null ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[60] w-max max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-full border border-emerald-700/70 bg-emerald-950/85 px-4 py-2 text-center text-[11px] text-emerald-100 shadow-lg backdrop-blur-md">
          Click the Stage to place a {spawnKindTitle(spawnPendingKind)} · Esc to cancel
        </div>
      ) : null}
      <SensorStudioPerformanceViewportOverlay
        variant="stage3d"
        className="bottom-14"
      />
      <StudioSceneViewport
        ref={viewportRef}
        key={`stage-viewport:${snapshot.sceneOutputNodeId ?? "none"}`}
        title="Stage"
        sceneProps={sceneProps!}
        presentation="stage-fullbleed"
        previewScopeId="sensor-studio-stage"
        renderLoopActive={stagePaneVisible}
        maxRenderFps={stage3dMaxFps}
        visionHudNodes={visionHudNodes}
        visionHudEdges={flowEdges}
        onStagePick={onStagePick}
        onStageSelect={onStageSelect}
        onStageClearSelection={onStageClearSelection}
        viewportProjection={viewportProjection}
        viewportOrthoZoom={viewportOrthoZoom}
        onViewportOrthoZoomChange={setViewportOrthoZoom}
        viewportMousePreset={viewportMousePreset}
        viewportViewSnapMode={viewportViewSnapMode}
        stageSelectionObjectPath={selectedSceneObject?.objectPath ?? null}
        stageGizmoEnabled={stageGizmoEnabled}
        stageGizmoMode={viewportGizmoMode}
        onStageTransformBeginDrag={onStageTransformBeginDrag}
        onStageTransformLiveChange={onStageTransformLiveChange}
        onStageTransformCommit={onStageTransformCommit}
      />
    </div>
  );
}
