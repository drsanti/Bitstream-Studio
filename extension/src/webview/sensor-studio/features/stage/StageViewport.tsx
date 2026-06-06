import { useCallback, useMemo, useRef } from "react";
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import { MonitorPlay } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import type { RotationPreviewSceneProps } from "../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import { buildStagePreviewSceneProps } from "../../core/stage/evaluate-stage-scene-snapshot";
import { useStageSceneStore } from "../../state/stage-scene.store";
import {
  StudioSceneViewport,
  type StudioSceneViewportHandle,
} from "../../core/viewport/StudioSceneViewport";
import { rotationPreviewOrientationFromTransformWire } from "../editor/nodes/transform/flow-wire-transform-preview-orientation";
import { StageViewportToolbar } from "./StageViewportToolbar";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { useStudioWorkbenchFocusStore } from "../../state/studio-workbench-focus.store";
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
  stageToolbarPresentationEnabled,
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

/**
 * Full-bleed Stage pane (node-animator **Stage** parity).
 * Committed scene comes from **Scene Output** via {@link evaluateStageSceneSnapshot}.
 */
export function StageViewport() {
  const snapshot = useStageSceneStore((s) => s.snapshot);
  const primaryModelIndex = useStageSceneStore((s) => s.primaryModelIndex);
  const setPrimaryModelIndex = useStageSceneStore((s) => s.setPrimaryModelIndex);
  const viewportRef = useRef<StudioSceneViewportHandle>(null);

  const hasSceneOutput = snapshot.sceneOutputNodeId != null;
  const hasModel = snapshot.models.some((m) => m.modelUrl.length > 0);

  const modelSelectOptions = useMemo(
    () =>
      snapshot.models.map((m, i) => ({
        value: String(i),
        label: m.label.length > 0 ? m.label : `Model ${i + 1}`,
      })),
    [snapshot.models],
  );

  const sceneProps = useMemo((): RotationPreviewSceneProps | null => {
    if (!hasModel) {
      return null;
    }
    const built = buildStagePreviewSceneProps(snapshot, primaryModelIndex);
    const orientation = rotationPreviewOrientationFromTransformWire(snapshot.transformWire);
    return {
      ...orientation,
      ...built.glbAnimationSceneExtras,
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
    };
  }, [hasModel, snapshot, primaryModelIndex]);

  const dispatchStagePick = useFlowEditorStore((s) => s.dispatchStagePickEvent);
  const onFlowSelectionChange = useFlowEditorStore((s) => s.onSelectionChange);
  const setActiveEditorType = useStudioWorkbenchFocusStore((s) => s.setActiveEditorType);

  const onStagePaneFocus = useCallback(() => {
    setActiveEditorType("stage");
    onFlowSelectionChange([]);
  }, [onFlowSelectionChange, setActiveEditorType]);

  const flowNodes = useFlowEditorStore((s) => s.nodes);
  const flowEdges = useFlowEditorStore((s) => s.edges);
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
      dispatchStagePick(pick);
    },
    [dispatchStagePick],
  );

  const onFrameModel = useCallback(() => {
    viewportRef.current?.framePrimaryModel();
  }, []);

  const onResetCamera = useCallback(() => {
    viewportRef.current?.resetCameraToScene3d();
  }, []);

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
          canvas and wire <span className="font-medium text-zinc-400">Models</span> (Studio Model
          nodes) plus optional Environment, Camera, Transform, and Animation inputs.
        </p>
        {loadDemoButton}
      </div>
    );
  }

  if (!hasModel) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 bg-zinc-950 px-6 text-center">
        <MonitorPlay className="size-8 text-amber-400/70" strokeWidth={1.75} aria-hidden />
        <p className="text-sm font-medium text-zinc-200">Scene Output ready</p>
        <p className="max-w-md text-xs leading-relaxed text-zinc-500">
          Wire at least one <span className="font-medium text-zinc-400">Studio Model</span> into the{" "}
          <span className="font-medium text-zinc-400">Models</span> socket on Scene Output.
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
      />
      <StudioSceneViewport
        ref={viewportRef}
        key={`stage-viewport:${snapshot.sceneOutputNodeId ?? "none"}`}
        title="Stage"
        sceneProps={sceneProps!}
        presentation="stage-fullbleed"
        previewScopeId="sensor-studio-stage"
        onStagePick={onStagePick}
      />
    </div>
  );
}
