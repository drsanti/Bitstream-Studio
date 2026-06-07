import { create } from "zustand";
import { createFlowUndoCoalescer } from "./flow-undo-coalesce";
import type { Connection, Edge, Node } from "@xyflow/react";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import {
  DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
  DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
} from "../../../../assets-manager/registry/default-studio-pack-model";
import {
  applyStageScene3dPresentation,
  migrateStageSceneFlowNode,
  STAGE_DEFAULT_SHOW_GRID,
  stageEnvironmentNodeDefaultConfig,
  stageSceneOutputDefaultScene3d,
} from "../../../core/stage/stage-scene-defaults";
import { migrateLegacyPackModelInDefaultConfig } from "../../../persistence/migrate-legacy-pack-model";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import { NODE_CATALOG_DEFAULTS } from "../../../config/node-catalog.config";
import {
  inferSensorTelemetryHintFromSourceKey,
  isValidStudioSensorSourceKey,
  resolveLiveNumericFromLatestByHint,
} from "../../../core/live/resolve-sensor-source-key";
import { bitstreamSensorHintToSourceId } from "../../../core/device/bitstream-hint-to-source-id";
import { sensorHealthAgeThresholdsMs } from "../../../core/device/sensor-health-thresholds";
import { computeBmi270PinBundle } from "../../../core/live/bmi270-pin-bundle";
import type {
  FlowWireQuaternion,
  FlowWireVec3,
} from "../../../core/live/flow-wire-types";
import { useBitstreamLiveStore } from "../../../../bitstream-app/state/bitstreamLive.store";
import {
  useBitstreamDeviceSensorConfigStore,
  type DeviceSensorConfigRow,
} from "../../../../bitstream-app/state/bitstreamDeviceSensorConfig.store";
import { useBmi270FusionEulerWireTapStore } from "../../../../bitstream-app/state/bmi270FusionEulerWireTap.store";
import { useBmi270FusionQuatOrientationStore } from "../../../../bitstream-app/state/bmi270FusionQuatOrientation.store";
import { mergeLabDefaultsIntoGlbAnimationBundleConfig } from "../../../../bitstream-app/components/animation-lab/studio-glb-preview-defaults-from-lab.js";
import {
  computeBmm350PinBundle,
  computeDps368PinBundle,
  computeSht40PinBundle,
} from "../../../core/live/environment-sensors-live-ports";
import type {
  BitstreamSensorSampleV2,
  BitstreamSensorSourceHint,
} from "../../../../bitstream/events/sensor-decoder";
import {
  collectFlowEventTargetNodeIds,
  readEventBooleanValue,
  runFlowEventDispatch,
} from "../../../core/flow/flow-event-runner";
import { evaluateMathOperation } from "../../../core/flow/math-operations";
import { evaluateCompareOperation } from "../../../core/flow/compare-operations";
import {
  evaluateCombineQuaternion,
  evaluateCombineXyz,
  evaluateSwitchNumber,
} from "../../../core/flow/switch-combine-operations";
import {
  evaluateLerp,
  LERP_INPUT_DEFAULTS,
  readLerpInputValue,
} from "../../../core/flow/lerp-operations";
import {
  evaluateMultiplexer,
  readMultiplexerPaths,
} from "../../../core/flow/json-path";
import {
  evaluateClamp,
  CLAMP_INPUT_DEFAULTS,
  readClampInput,
} from "../../../core/flow/clamp-operations";
import {
  evaluateMapRange,
  MAP_RANGE_INPUT_DEFAULTS,
  readMapRangeInput,
} from "../../../core/flow/map-range-operations";
import {
  evaluateNoiseSim,
  evaluateRampSim,
  evaluateSineWave,
  evaluateStepSim,
  readSimInput,
} from "../../../core/flow/sim-generator-operations";
import {
  evaluateVectorConstant,
  VECTOR_CONSTANT_DEFAULTS,
  readVectorAxisInput,
} from "../../../core/flow/vector-constant-operations";
import {
  evaluateQuaternionConstant,
  QUATERNION_CONSTANT_DEFAULTS,
  readQuaternionAxisInput,
} from "../../../core/flow/quaternion-constant-operations";
import {
  evaluateVectorQuaternionMathNode,
  isVectorQuaternionMathNodeId,
} from "../../../core/flow/flow-vector-quaternion-math-eval";
import { advanceFlowClock } from "../../../core/flow/flow-clock";
import { evaluateDebugValue } from "../../../core/flow/debug-node-operations";
import { evaluateFogOutputs } from "../../../core/flow/fog-operations";
import {
  evaluateCameraSwitchIndex,
  evaluateContactShadowsOutputs,
  evaluateEmitterOutputs,
  evaluateMaterialVariantName,
  evaluateMorphWeight,
  evaluatePostProcessingOutputs,
  evaluateSceneLightOutputs,
  evaluateUvTransformOutputs,
  UV_TRANSFORM_KEYS,
} from "../../../core/flow/scene-fx-operations";
import {
  collectPhysicsCollidersForWorld,
  collectPhysicsRigidBodiesForWorld,
  evaluateBoxColliderOutput,
  evaluateSphereColliderOutput,
} from "../../../core/flow/collect-physics-scene-graph";
import {
  evaluatePhysicsWorldOutput,
  isPhysicsDomainStubNodeId,
} from "../../../core/flow/physics-domain-eval";
import { flowWirePhysicsRigidBodyFromConfig } from "../nodes/physics/flow-wire-physics-body";
import { evaluateStageSceneSnapshot } from "../../../core/stage/evaluate-stage-scene-snapshot";
import { isFlowNodeDragActive } from "../nodes/flow-node/flow-node-drag-state";
import { filterNodeChangesForStore } from "../flow-react-flow-node-sync";
import { useStageSceneStore } from "../../../state/stage-scene.store";
import {
  evaluateFrameDelta,
  evaluateSceneTime,
} from "../../../core/flow/scene-time-operations";
import {
  applyAudioSfxPresetToConfig,
  resolveAudioSfxPreset,
} from "../../../core/audio/audio-sfx-config";
import {
  readMachineFamilyId,
  resolveDronePreset,
  resolveEnginePreset,
  resolveIndustrialPreset,
  resolveMotorPreset,
} from "../../../core/audio/audio-machine-config";
import {
  clampMachineLoad,
  clampMachineSpeed,
  resolveDroneDetuneHz,
  resolveDroneMotorHz,
  resolveEngineFireHz,
  resolveEngineRumbleHz,
  resolveIndustrialCycleHz,
  resolveMotorWhineHz,
} from "../../../core/audio/audio-machine-speed";
import { clampAnalyserFftSize } from "../../../core/audio/clamp-analyser-fft-size";
import { resolveOscillatorSweepHz } from "../../../core/audio/oscillator-sweep";
import {
  findWiredAudioBusSourceNodeId,
  readMonitorModeEnabled,
  resolveAudioMonitorSourceNodeId,
} from "../../../core/audio/resolve-audio-monitor-source";
import { studioAudioRuntime } from "../../../core/audio/studio-audio-runtime";
import { studioCameraRuntime } from "../../../core/camera/studio-camera-runtime";
import {
  evaluateVisionFlowNode,
  isVisionInferenceNodeId,
} from "../../../core/camera/evaluate-vision-flow-nodes";
import {
  isFlowWireVideoBusV1,
  isFlowWireVideoTextureV1,
  makeFlowWireVideoBusV1,
  makeFlowWireVideoTextureV1,
  type FlowWireVideoBusV1,
  type FlowWireVideoTextureV1,
} from "../../../core/camera/flow-wire-video";
import type { FlowWireFogV1 } from "../nodes/scene-fx/flow-wire-fog";
import {
  coerceFlowWireFogV1,
  flowWireFogFromEval,
  isFlowWireFogV1,
} from "../nodes/scene-fx/flow-wire-fog";
import type { FlowWireStudioLightV1 } from "../nodes/scene-fx/flow-wire-studio-light";
import {
  coerceFlowWireStudioLightV1,
  flowWireStudioLightFromEval,
  isFlowWireStudioLightV1,
} from "../nodes/scene-fx/flow-wire-studio-light";
import type { FlowWireContactShadowsV1 } from "../nodes/scene-fx/flow-wire-contact-shadows";
import {
  coerceFlowWireContactShadowsV1,
  flowWireContactShadowsFromEval,
  isFlowWireContactShadowsV1,
} from "../nodes/scene-fx/flow-wire-contact-shadows";
import type { FlowWirePostProcessingV1 } from "../nodes/scene-fx/flow-wire-post-processing";
import {
  coerceFlowWirePostProcessingV1,
  flowWirePostProcessingFromEval,
  isFlowWirePostProcessingV1,
} from "../nodes/scene-fx/flow-wire-post-processing";
import type { FlowWireParticleEmitterV1 } from "../nodes/scene-fx/flow-wire-particle-emitter";
import {
  coerceFlowWireParticleEmitterV1,
  flowWireParticleEmitterFromEval,
  isFlowWireParticleEmitterV1,
} from "../nodes/scene-fx/flow-wire-particle-emitter";
import { evaluateSceneSettingsExposure } from "../../../core/flow/scene-settings-operations";
import {
  syncSocketLivePreviewHandlesFromPinValues,
  syncSocketLivePreviewInputHandlesFromIncoming,
} from "../nodes/flow-node/sync-socket-live-preview-handles";
import {
  evaluateTransformPartialVec3,
  readTransformAxisInput,
} from "../../../core/flow/transform-partial-operations";
import { evaluateLogicGateOperation } from "../../../core/flow/logic-gate-operations";
import {
  evaluateValueNormalizer,
  readValueNormalizerInput,
} from "../../../core/flow/value-normalizer-operations";
import {
  computeLogicGateInputHandles,
  LOGIC_GATE_OUTPUT_HANDLE,
} from "../../../core/flow/logic-gate-inputs";
import {
  computeMathInputHandles,
  MATH_OUTPUT_HANDLE,
} from "../../../core/flow/math-node-inputs";
import type { StudioAssetDescriptor } from "../../asset-browser/studio-asset.types";
import { resolveSingleClipAutoBindPatchesForGlbAnimNodes } from "../gltf/glb-anim-clip-auto-bind";
import { resolvePartSpinAutoBindPatches } from "../gltf/glb-part-spin-auto-bind";
import {
  buildFlowClipboardPayload,
  FLOW_CLIPBOARD_MARKER,
  FLOW_CLIPBOARD_VERSION,
  parseFlowClipboard,
  remapFlowPaste,
  serializeFlowClipboard,
} from "../clipboard/flow-clipboard";
import { createStudioNodeGroupFromSelection } from "../subgraphs/create-studio-node-group";
import { repairOrphanedNodeGroupSubgraphs } from "../subgraphs/repair-orphaned-node-group-subgraphs";
import { dissolveStudioNodeGroupInParent } from "../subgraphs/dissolve-studio-node-group";
import {
  appendGroupHostToRootGraph,
  duplicateStudioGroupDeepCopy,
  duplicateStudioGroupLinked,
  type DuplicateGroupInstanceResult,
} from "../subgraphs/duplicate-group-instance";
import { attachSubgraphsForPastedNodeGroups } from "../subgraphs/paste-subgraph-groups";
import { rewireParentGraphForStudioGroup } from "../subgraphs/rewire-parent-graph-for-group";
import {
  commitActiveGraphMutation,
  initialSubgraphStoreSlice,
  persistActiveGraphBuffer,
  resolveEvaluationGraph,
  type StudioSubgraphStoreSlice,
} from "../subgraphs/studio-subgraph-store-sync";
import {
  buildStudioGroupBoundaryLiveFields,
  buildStudioNodeGroupHostLiveFields,
} from "../subgraphs/studio-group-boundary-live";
import {
  resolveRootCanvasViewOnHydrate,
  resolveSubgraphCanvasViewOnRestore,
} from "../subgraphs/resolve-subgraph-canvas-view";
import { applyStudioGroupBoundaryNodeChrome } from "../layout-nodes/studio-group-boundary-node-chrome";
import {
  promoteGroupConnection,
  syncGroupInterfaceFromHostWires,
} from "../subgraphs/studio-group-connect-promote";
import { applyUnwiredGroupInputDefaults } from "../subgraphs/studio-group-input-defaults";
import {
  isExcludedFromNodeGroup,
  isStudioGroupBoundaryNode,
  isStudioNodeGroupNode,
  STUDIO_ROOT_GRAPH_ID,
  ensureDefaultGroupSockets,
  type StudioGraphId,
  type StudioGroupBoundaryData,
  type StudioGroupInterface,
  type StudioNodeGroupData,
  type StudioSubgraphDocument,
  type SubgraphFlowNode,
} from "../subgraphs/studio-subgraph.types";
import {
  applyGroupInterfaceToSubgraph,
  filterParentEdgesForGroupInterface,
  subgraphForInterfaceEdit,
} from "../subgraphs/studio-group-interface-sync";
import { buildStudioNodeAssetFromGroup } from "../subgraphs/node-library/build-node-asset-from-group";
import { findStudioNodeGroupHost } from "../subgraphs/node-library/find-studio-node-group-host";
import { instantiateStudioNodeAsset } from "../subgraphs/node-library/instantiate-node-asset";
import {
  upsertStudioLibraryPreset,
  findLinkedStudioLibraryPreset,
  type StudioLibrarySaveResult,
} from "../subgraphs/node-library/library-preset-upsert";
import { replaceStudioNodeGroupFromAsset } from "../subgraphs/node-library/replace-group-from-asset";
import {
  downloadStudioNodeAssetFile,
  rekeyStudioNodeAssetMeta,
  type StudioNodeAssetFile,
} from "../subgraphs/node-library/studio-node-asset-file";
import {
  readPersistedNodeGroupLibrary,
  writePersistedNodeGroupLibrary,
} from "../../../persistence/node-group-library.repository";
import {
  readPersistedFlowPresetLibrary,
  writePersistedFlowPresetLibrary,
} from "../../../persistence/flow-preset-library.repository";
import { buildFlowPresetFromCanvas } from "../flow-library/build-flow-preset-from-canvas";
import {
  downloadStudioFlowPresetFile,
  rekeyStudioFlowPresetMeta,
  type StudioFlowPresetCategory,
  type StudioFlowPresetFile,
} from "../flow-library/studio-flow-preset-file";
import { remapFlowDocumentForMerge } from "../flow-library/merge-flow-document-into-canvas";
import { parseFlowImportPayload } from "../flow-library/parse-flow-import-payload";
import {
  resolveSaveToLibraryTarget,
  type SaveToLibraryTarget,
} from "../flow-library/resolve-save-to-library-target";
import {
  findLinkedFlowPreset,
  upsertFlowPreset,
  type FlowPresetSaveResult,
} from "../flow-library/flow-preset-upsert";
import { resolveStudioGroupNodePortType } from "../subgraphs/resolve-studio-group-port";
import { pointerEventMatchesOnClickConfig } from "../nodes/events/on-click-config";
import { readGlbAnimTriggerNonce } from "../nodes/events/glb-anim-event-config";
import {
  readClipboardText,
  writeClipboardText,
} from "../../../../ui/utils/clipboard";
import { validateStudioNodeConfig } from "../../../core/validation/node-config.validation";
import {
  type StudioPersistedViewport,
  clearPersistedFlowDocument,
  isValidStudioPersistedViewport,
} from "../../../persistence/flow-graph.repository";
import {
  coerceFlowCanvasPreferences,
  type FlowCanvasPreferences,
} from "../../../persistence/flow-canvas-preferences";
import {
  coerceWorkbenchFlowAttachment,
  type WorkbenchFlowAttachmentV1,
} from "../../../../ui/workbench/workbench-flow-attachment";
import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  persistScene3DConfig,
} from "../../../core/scene3d/scene3d-config";
import { isStudioFlexPlotCanvasNodeId } from "../nodes/flow-node/studio-flex-plot-canvas";
import {
  coercePlotterConfig,
  isPlotterNodeId,
  migrateLegacyPlotterNodeData,
  persistPlotterConfig,
  type PlotterConfig,
} from "../nodes/plotter/plotter-config";
import { migrateLegacyGaugeNodeData } from "../nodes/display/gauge-display-config";
import type { FlowWireEnvironmentV1 } from "../nodes/environment/flow-wire-environment";
import {
  coerceFlowWireEnvironmentV1,
  flowWireEnvironmentFromNodeDefaultConfig,
  isFlowWireEnvironmentV1,
} from "../nodes/environment/flow-wire-environment";
import type { FlowWireCameraV1 } from "../nodes/camera-view/flow-wire-camera";
import {
  coerceFlowWireCameraV1,
  flowWireCameraFromNodeDefaultConfig,
  isFlowWireCameraV1,
} from "../nodes/camera-view/flow-wire-camera";
import type { FlowWireAnimationV1 } from "../nodes/animation/flow-wire-animation";
import {
  coerceFlowWireAnimationV1,
  flowAnimationWireFromBundleDefaultConfig,
  isFlowWireAnimationV1,
} from "../nodes/animation/flow-wire-animation";
import {
  ANIMATION_CLIP_NAME_KEY,
  flowAnimationWireFromAnimationClipEval,
} from "../nodes/animation/animation-clip-config";
import {
  blendFlowWireAnimationsV1,
  mergeFlowWireAnimationsV1,
  mixFlowWireAnimationsV1,
} from "../nodes/animation/animation-wire-merge";
import {
  ANIMATION_MERGE_INPUT_COUNT_KEY,
  ANIMATION_MERGE_OUTPUT_HANDLE,
  animationMergeInputHandleId,
  computeAnimationMergeInputHandles,
  pruneAnimationMergeEdges,
  readAnimationMergeInputCount,
} from "../nodes/animation/animation-merge-inputs";
import {
  ANIMATION_MIX_NORMALIZE_WEIGHTS_KEY,
  ANIMATION_MIX_OUTPUT_HANDLE,
  ANIMATION_MIX_WEIGHTS_KEY,
  animationMixWeightHandleId,
  computeAnimationMixInputHandles,
  defaultEqualMixWeights,
  ensureMixWeightsForCount,
  pruneAnimationMixEdges,
  readAnimationMixInputCount,
  readMixWeights,
  readNormalizeMixWeights,
} from "../nodes/animation/animation-mix-inputs";
import type { FlowWireTransformV1 } from "../nodes/transform/flow-wire-transform";
import {
  coerceFlowWireTransformV1,
  flowWireTransformFromEulerRad,
  readFlowWireTransformEulerMapping,
  flowWireTransformFromNodeDefaultConfig,
  isFlowWireTransformV1,
} from "../nodes/transform/flow-wire-transform";
import type { FlowWirePhysicsSceneV1 } from "../nodes/physics/flow-wire-physics-scene";
import {
  flowWireStagePickFromDetail,
  type FlowWireStagePickV1,
} from "../nodes/events/flow-wire-stage-pick";
import {
  coerceFlowWirePhysicsSceneV1,
  isFlowWirePhysicsSceneV1,
} from "../nodes/physics/flow-wire-physics-scene";
import {
  computeAggregatedEnvironmentWire,
  computeEnvironmentInputHandles,
  mergeEnvironmentVisibilityWithIncomingEdges,
  readEnvironmentInputSocketVisibility,
} from "../nodes/environment/environment-node-inputs";
import { coerceNumberConstantValue } from "../nodes/constants/number-constant-helpers";
import {
  readGlbMaterialTextureUrl,
  STUDIO_GLB_MATERIAL_TEXTURE_SLOT_KEY,
  STUDIO_TEXTURE_ASSET_ID_KEY,
  STUDIO_TEXTURE_URL_KEY,
} from "../gltf/studio-glb-material-texture";
import {
  defaultGlbMaterialParamValue,
  STUDIO_GLB_MATERIAL_PARAM_KEY,
} from "../gltf/studio-glb-material-param";
import { readGlbMaterialColorRgbFromConfig } from "../gltf/studio-glb-material-color";
import {
  readSourceModelNodeId,
  reconcileStudioModelGeneratedChildIds,
  remapSourceModelNodeIdAfterDuplicate,
  resolveStudioSourceModelGlbUrl,
  STUDIO_GLB_EVENT_ACTION_CATALOG_ID_SET,
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_HANDLE_MODEL,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
  catalogNodeHasStudioModelInput,
  readGlbExtractTag,
  resolveWiredStudioModelSelectNodeId,
} from "../model/model-generated-bindings";
import {
  buildLayoutFlowNode,
  buildRerouteFlowNode,
} from "../layout/layout-flow-node-builders";
import {
  splitEdgeWithReroute,
  applyRerouteBridgeOnEdgeRemoves,
  removeFlowNodesFromGraph,
} from "../layout/reroute-graph-ops";
import {
  connectWithPolicy,
  mergeReconnectConnection,
  reconnectWithPolicy,
} from "../connect/socket-connection-policy";
import { applyFlowAutoLayout as runFlowAutoLayout } from "../layout/flow-auto-layout";
import {
  applyFlowFrameDragStop,
  createFrameAroundNodes,
  detachNodesFromFrame,
  dissolveStudioFrames,
  fitFramesToContents,
  isLayoutOnlyForFrame,
  isStudioFrameNode,
  sortFlowNodesParentFirst,
} from "../layout/frame-flow-nodes";
import {
  nextBodyControlsVisibleForBatch,
  nextSocketValuesVisibleForBatch,
  nextSocketsExpandedForBatch,
  patchStudioNodeUiBodyControlsVisible,
  patchStudioNodeUiSocketDisplay,
  studioNodeHasHideableBody,
  studioNodeUiWithoutDisplayOverrides,
} from "../nodes/flow-node/socket-display";
import {
  clearStudioNodeChromeLayoutWidths,
  copyChromeLayoutWidthToAllKeys,
  migrateStudioNodeChromeLayoutWidth,
  patchStudioNodeChromeLayoutWidth,
  resolveFitWidthFromContentMeasure,
  resolveStudioNodeChromeLayoutKey,
  studioNodeChromeLayoutKeysForData,
  type StudioNodeChromeLayoutKey,
} from "../nodes/flow-node/studio-node-chrome-layout";
import { studioNodeDefaultAllowBodyCollapse } from "../nodes/flow-node/studio-body-collapse";
import { flowNodeDimensionChanges } from "../nodes/flow-node/FlowNodeEdgeResize";
import {
  clampStudioFlowNodeLayoutDimension,
  readStudioFlowNodeLayoutSize,
} from "../nodes/flow-node/studio-node-layout-size";
import {
  applyStudioNodeMinDimensionsToUi,
  resolveStudioNodeMinDimensionFloor,
  resolveStudioNodeInitialLayoutHeight,
  studioNodeDefaultResizable,
} from "../nodes/flow-node/studio-node-resize-defaults";
import {
  computeViewportPreviewNodeDimensions,
  coerceStudioViewportPreviewAspect,
  coerceStudioViewportPreviewSizeTier,
  patchViewportPreviewHeadHeight,
  resolveViewportPreviewChromeFromNode,
  STUDIO_VIEWPORT_PREVIEW_DEFAULT_ASPECT,
  STUDIO_VIEWPORT_PREVIEW_DEFAULT_SIZE_TIER,
  STUDIO_VIEWPORT_PREVIEW_PANEL_CHROME_HEIGHT_PX,
  stripViewportPreviewLayoutUi,
  type StudioViewportPreviewAspect,
  type StudioViewportPreviewSizeTier,
} from "../nodes/flow-node/studio-viewport-preview-layout";
import { isScene3dInspectorNodeId } from "../nodes/scene3d/scene3d-inspector-node-ids";
import type {
  LayoutFlowNode,
  LayoutMenuEntryId,
} from "../layout/layout-flow-nodes.types";
import {
  isLayoutFlowNode,
  splitOutputHandleIds,
} from "../layout/layout-flow-nodes.types";
import {
  isStudioFlowNode,
  patchLayoutNodesAfterConnect,
  resolveFlowSourcePortType,
} from "../layout/layout-port-resolution";

export type {
  FlowWireQuaternion,
  FlowWireVec3,
} from "../../../core/live/flow-wire-types";
export type { FlowWireEnvironmentV1 } from "../nodes/environment/flow-wire-environment";
export type { FlowWireCameraV1 } from "../nodes/camera-view/flow-wire-camera";
export type { FlowWireAnimationV1 } from "../nodes/animation/flow-wire-animation";
export type { FlowWireTransformV1 } from "../nodes/transform/flow-wire-transform";
export type { FlowWireFogV1 } from "../nodes/scene-fx/flow-wire-fog";
export type { FlowWireStudioLightV1 } from "../nodes/scene-fx/flow-wire-studio-light";
export type { FlowWirePostProcessingV1 } from "../nodes/scene-fx/flow-wire-post-processing";
export type { FlowWireContactShadowsV1 } from "../nodes/scene-fx/flow-wire-contact-shadows";
export type { FlowWireParticleEmitterV1 } from "../nodes/scene-fx/flow-wire-particle-emitter";

import type { StudioPortType } from "../flow-graph-types";
export type { StudioPortType } from "../flow-graph-types";

/** Present only while Bitstream provides a matching hardware sample for this node. */
export type SensorHardwareStreamLive = "live";
export type SensorHealthStatus = "live" | "stale" | "offline" | "sim";

/** Catalog-derived output pin (React Flow handle `id` = `id`). */
export type StudioOutputHandleDef = {
  id: string;
  portType: StudioPortType;
  label: string;
};

import {
  STUDIO_HANDLE_IN,
  STUDIO_HANDLE_OUT,
  STUDIO_HANDLE_ANIM,
  STUDIO_HANDLE_CAM,
  STUDIO_HANDLE_ENV,
  STUDIO_HANDLE_MODELS,
  STUDIO_HANDLE_PHYS,
  STUDIO_HANDLE_XF,
} from "../studio-handle-ids";
export {
  STUDIO_HANDLE_IN,
  STUDIO_HANDLE_OUT,
  STUDIO_HANDLE_ENV,
  STUDIO_HANDLE_CAM,
  STUDIO_HANDLE_ANIM,
  STUDIO_HANDLE_XF,
  STUDIO_HANDLE_MODELS,
  STUDIO_HANDLE_PHYS,
};
/** Optional exposure override on 3D canvas nodes (from **Scene Settings** `out`). */
export const STUDIO_HANDLE_SETTINGS = "settings";
/** Optional fog override on 3D canvas nodes. */
export const STUDIO_HANDLE_FOG = "fog";
/** Optional studio rig light override on 3D canvas nodes. */
export const STUDIO_HANDLE_LITE = "lite";
/** Optional bloom post-processing on 3D canvas nodes. */
export const STUDIO_HANDLE_POST = "post";
/** Optional contact-shadow disc on 3D canvas nodes. */
export const STUDIO_HANDLE_CSHADOW = "cshadow";
/** Optional particle VFX on 3D canvas nodes. */
export const STUDIO_HANDLE_EMITTER = "emitter";

/** Single-output nodes that mirror one BMI270 stream (live hardware or synthesized feed). */
export const BMI270_TAP_NODE_IDS = [
  "bmi270-tap-quaternion",
  "bmi270-tap-euler",
  "bmi270-tap-accel",
  "bmi270-tap-gyro",
  "bmi270-tap-temp",
  "bmi270-tap-samples",
] as const;

export const BMI270_TAP_NODE_ID_SET = new Set<string>(BMI270_TAP_NODE_IDS);

/** Single-output tap nodes for DPS368 / SHT40 / BMM350 (same bundles as `*-input`). */
export const ENVIRONMENT_SENSOR_TAP_NODE_IDS = [
  "dps368-tap-pressure",
  "dps368-tap-temp",
  "dps368-tap-samples",
  "sht40-tap-humidity",
  "sht40-tap-temp",
  "sht40-tap-samples",
  "bmm350-tap-magnetic",
  "bmm350-tap-temp",
  "bmm350-tap-samples",
] as const;

export const ENVIRONMENT_SENSOR_TAP_NODE_ID_SET = new Set<string>(
  ENVIRONMENT_SENSOR_TAP_NODE_IDS,
);

/** True for any BMI270 or environment sensor *tap* node (single `out` handle). */
export function isStudioSensorTapNodeId(nodeId: string): boolean {
  return (
    BMI270_TAP_NODE_ID_SET.has(nodeId) ||
    ENVIRONMENT_SENSOR_TAP_NODE_ID_SET.has(nodeId)
  );
}

/** Multi-pin live sensor sources with aligned inspector Live readings matrix. */
export const STUDIO_LIVE_READINGS_INPUT_NODE_IDS = [
  "bmi270-input",
  "bmm350-input",
  "dps368-input",
  "sht40-input",
] as const;

export type StudioLiveReadingsInputNodeId =
  (typeof STUDIO_LIVE_READINGS_INPUT_NODE_IDS)[number];

const STUDIO_LIVE_READINGS_INPUT_NODE_ID_SET = new Set<string>(
  STUDIO_LIVE_READINGS_INPUT_NODE_IDS,
);

export function isStudioLiveReadingsInputNodeId(nodeId: string): boolean {
  return STUDIO_LIVE_READINGS_INPUT_NODE_ID_SET.has(nodeId);
}

/** Multi-output sensor sources — shared subgrid label column on socket rows. */
export const STUDIO_ALIGNED_OUTPUT_SOCKET_NODE_IDS = [
  "bmi270-input",
  "bmm350-input",
  "dps368-input",
  "sht40-input",
] as const;

const STUDIO_ALIGNED_OUTPUT_SOCKET_NODE_ID_SET = new Set<string>(
  STUDIO_ALIGNED_OUTPUT_SOCKET_NODE_IDS,
);

export function isStudioAlignedOutputSocketColumnsNodeId(
  nodeId: string,
): boolean {
  return STUDIO_ALIGNED_OUTPUT_SOCKET_NODE_ID_SET.has(nodeId);
}

/** Live hardware / tap sensor nodes — previews on output socket rows, no card ReadingPanel. */
export function isStudioSensorSocketPreviewNodeId(nodeId: string): boolean {
  return (
    isStudioAlignedOutputSocketColumnsNodeId(nodeId) ||
    isStudioSensorTapNodeId(nodeId)
  );
}

/** Sensor nodes with a dedicated **Live readings** card in the Node Inspector Live tab. */
export function isStudioLiveInspectorReadingsNodeId(nodeId: string): boolean {
  return isStudioSensorSocketPreviewNodeId(nodeId);
}

/** Header chip label for sensor source nodes (BMI270 family + environment sensors). */
export const STUDIO_FLOW_SENSOR_HEADER_TAG_BY_NODE_ID: Record<string, string> =
  {
    "bmi270-input": "BMI270",
    "bmi270-tap-quaternion": "BMI270",
    "bmi270-tap-euler": "BMI270",
    "bmi270-tap-accel": "BMI270",
    "bmi270-tap-gyro": "BMI270",
    "bmi270-tap-temp": "BMI270",
    "bmi270-tap-samples": "BMI270",
    "dps368-input": "DPS368",
    "dps368-tap-pressure": "DPS368",
    "dps368-tap-temp": "DPS368",
    "dps368-tap-samples": "DPS368",
    "sht40-input": "SHT40",
    "sht40-tap-humidity": "SHT40",
    "sht40-tap-temp": "SHT40",
    "sht40-tap-samples": "SHT40",
    "bmm350-input": "BMM350",
    "bmm350-tap-magnetic": "BMM350",
    "bmm350-tap-temp": "BMM350",
    "bmm350-tap-samples": "BMM350",
  };

/** Stable key for multi-pin flow values: `nodeId::handleId`. */
export function studioFlowPinKey(nodeId: string, handleId: string): string {
  return `${nodeId}::${handleId}`;
}

export type StudioNodeData = {
  label: string;
  category: NodeCatalogEntry["category"];
  nodeId: string;
  defaultConfig: Record<string, unknown>;
  ui?: {
    resizable?: boolean;
    minWidth?: number;
    minHeight?: number;
    /** Hide unwired socket rows when `false`. */
    socketsExpanded?: boolean;
    /** Hide Policy A socket live previews when `false`. */
    socketValuesVisible?: boolean;
    /** Hide card body panels when `false`. */
    bodyControlsVisible?: boolean;
    /**
     * When `false`, canvas toolbar cannot collapse the body (visual nodes default off).
     * Enable per node in Inspector → Node → Body panel.
     */
    allowBodyCollapse?: boolean;
    /** Live content-driven minimum from canvas measure (see `StudioNodeCard`). */
    contentMinWidth?: number;
    contentMinHeight?: number;
    /** Persisted RF width per socket/body chrome profile (`studio-node-chrome-layout.ts`). */
    layoutWidthByChrome?: Partial<Record<StudioNodeChromeLayoutKey, number>>;
    /** Last 3D preview aspect preset (Inspector → Node → Card size). */
    previewAspect?: "4:3" | "16:9" | "1:1";
    /** Last 3D preview size tier (`studio-viewport-preview-layout.ts`). */
    previewSizeTier?: "sm" | "md" | "lg";
    /** Measured header + sockets + panel chrome above viewport (px). */
    viewportPreviewHeadHeight?: number;
  };
  inputType?: StudioPortType;
  /** Single-output nodes (legacy); omit when `outputHandles` is set. */
  outputType?: StudioPortType;
  outputHandles?: StudioOutputHandleDef[];
  /** Multi-input nodes (target handle id = `id`); same shape as output handles. */
  inputHandles?: StudioOutputHandleDef[];
  liveValue?: number | boolean | string | null;
  /** Populated for multi-output nodes with `vector3` pins (e.g. BMI270 accel/gyro). */
  liveVector3ByHandle?: Record<string, { x: number; y: number; z: number }>;
  /** Populated for multi-output nodes with scalar pins (e.g. BMI270 temp). */
  liveNumberByHandle?: Record<string, number>;
  /** Populated for boolean output pins (Policy A socket preview). */
  liveBooleanByHandle?: Record<string, boolean>;
  /** Populated for string output pins (Policy A socket preview). */
  liveStringByHandle?: Record<string, string>;
  /** Populated for scalar **input** pins (wired incoming values). */
  liveInputNumberByHandle?: Record<string, number>;
  liveInputBooleanByHandle?: Record<string, boolean>;
  liveInputStringByHandle?: Record<string, string>;
  liveInputVector3ByHandle?: Record<
    string,
    { x: number; y: number; z: number }
  >;
  /** Upstream semantic tint hints for wired scalar inputs (temp / humidity / pressure). */
  liveInputScalarHintsByHandle?: Record<
    string,
    {
      handleId?: string;
      nodeId?: string;
      unit?: string;
      label?: string;
      streamMode: "live" | "idle";
    }
  >;
  /** BMI270 quaternion pin snapshot for the aligned readings panel. */
  liveQuaternionWire?: FlowWireQuaternion;
  /** Single vector3 from BMI270 tap nodes (Euler / Accel / Gyro). */
  liveVector3Wire?: FlowWireVec3;
  /** Incoming `env` pin snapshot for 3D canvas nodes (HDRI / background / IBL). */
  liveEnvironmentWire?: FlowWireEnvironmentV1;
  /** Incoming `cam` pin snapshot for 3D canvas nodes (camera + orbit limits). */
  liveCameraWire?: FlowWireCameraV1;
  /** Wired **`videoTexture`** on **`material-video`**. */
  liveVideoTextureWire?: FlowWireVideoTextureV1;
  /** Wired **`videoBus`** on **`css3d-camera-feed`**. */
  liveVideoBusWire?: FlowWireVideoBusV1;
  /** Incoming **`anim`** pin snapshot on **`model-viewer`** (structured clip times + speed). */
  liveAnimationWire?: FlowWireAnimationV1;
  /** Incoming **`xf`** pin snapshot for 3D canvas nodes (model transform). */
  liveTransformWire?: FlowWireTransformV1;
  /** Incoming **`phys`** pin snapshot on **scene-output** (physics-world wire). */
  livePhysicsWire?: FlowWirePhysicsSceneV1;
  /** Last Stage pick on **on-stage-pick** source nodes (Domain C). */
  liveStagePickWire?: FlowWireStagePickV1;
  /** Incoming **`settings`** pin snapshot (renderer exposure). */
  liveSettingsExposure?: number;
  /** Incoming **`fog`** pin snapshot for 3D canvas nodes. */
  liveFogWire?: FlowWireFogV1;
  /** Incoming **`lite`** pin snapshot for 3D canvas nodes (studio rig light). */
  liveStudioLightWire?: FlowWireStudioLightV1;
  /** Incoming **`post`** pin snapshot for 3D canvas nodes (bloom). */
  livePostProcessingWire?: FlowWirePostProcessingV1;
  /** Incoming **`cshadow`** pin snapshot for 3D canvas nodes. */
  liveContactShadowsWire?: FlowWireContactShadowsV1;
  /** Incoming **`emitter`** pin snapshot for 3D canvas nodes. */
  liveParticleEmitterWire?: FlowWireParticleEmitterV1;
  liveHistory?: number[];
  /** Multi-channel numeric history for plotter (`handleId` → samples). */
  livePlotHistory?: Record<string, number[]>;
  lastUpdatedAt?: string;
  /** Transient pulse timestamp for event source nodes (not persisted). */
  flowEventLastFiredAtMs?: number;
  /** Set only when this node is driven by a matching Bitstream sample this tick. */
  sensorStreamMode?: SensorHardwareStreamLive;
  /** Freshness status derived from live-store timestamps. */
  sensorHealth?: SensorHealthStatus;
  /** Field-level issues when live payload is partially missing; shown for debugging. */
  sensorInvalidReason?: string;
  /** Last valid live timestamp per pin/handle (ISO string). */
  sensorLastValidAtByHandle?: Record<string, string>;
  /** Pin-level invalid reasons (handle -> reason). */
  sensorInvalidByHandle?: Record<string, string>;
  /** Populated when `defaultConfig` fails schema validation for this node type. */
  configErrors?: string[];
};

export type StudioNode = Node<StudioNodeData>;

export type FlowGraphNode = StudioNode | LayoutFlowNode | SubgraphFlowNode;

/** Built-in canvas presets from **Run Demo Template** (toolbar + shortcuts). */
export type StudioDemoTemplateId =
  | "basic-indicator"
  | "gauge-monitor"
  | "signal-chain"
  | "vector-magnitude"
  | "bmi270-gauge-z"
  | "rotation-glb-anim"
  | "animation-clip-blend"
  | "animation-mix-demo"
  | "part-spin-demo"
  | "material-glb-drives"
  | "audio-lab"
  | "audio-file-playback"
  | "audio-oscillator-tone"
  | "audio-machine-rpm"
  | "audio-machine-map-range"
  | "audio-machine-fault-lab"
  | "camera-video-texture"
  | "stage-camera-vision"
  | "stage-scene-output";

export type FlowSnapshot = {
  nodes: FlowGraphNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  /** Present on snapshots after multi-select support; older snapshots omit this. */
  selectedNodeIds?: string[];
  subgraphs?: Record<string, StudioSubgraphDocument>;
  activeGraphId?: StudioGraphId;
  graphStack?: StudioGraphId[];
  rootNodes?: FlowGraphNode[];
  rootEdges?: Edge[];
};

function selectionFromIds(ids: readonly string[]): {
  selectedNodeId: string | null;
  selectedNodeIds: string[];
} {
  const seen = new Set<string>();
  const selectedNodeIds: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0 || seen.has(id)) {
      continue;
    }
    seen.add(id);
    selectedNodeIds.push(id);
  }
  return {
    selectedNodeIds,
    selectedNodeId: selectedNodeIds[0] ?? null,
  };
}

function selectionIdsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const seen = new Set(a);
  if (seen.size !== a.length) {
    return false;
  }
  return b.every((id) => seen.has(id));
}

function nodesSelectionMatches(
  nodes: readonly FlowGraphNode[],
  selectedIds: readonly string[],
): boolean {
  const selected = new Set(selectedIds);
  if (selected.size !== selectedIds.length) {
    return false;
  }
  for (const node of nodes) {
    if (Boolean(node.selected) !== selected.has(node.id)) {
      return false;
    }
  }
  return true;
}

function normalizeFlowSnapshotSelection(snapshot: {
  selectedNodeId: string | null;
  selectedNodeIds?: string[];
}): { selectedNodeId: string | null; selectedNodeIds: string[] } {
  const raw =
    snapshot.selectedNodeIds != null && snapshot.selectedNodeIds.length > 0
      ? snapshot.selectedNodeIds
      : snapshot.selectedNodeId != null
        ? [snapshot.selectedNodeId]
        : [];
  return selectionFromIds(raw);
}

function applyStudioFlowSelection(
  nodes: StudioNode[],
  selectedIds: readonly string[],
): StudioNode[] {
  const set = new Set(selectedIds);
  return nodes.map((n) => ({ ...n, selected: set.has(n.id) }));
}

/**
 * When two or more flow nodes are selected and every one shares the same catalog `nodeId`,
 * inspector may apply label / typed config / plotter changes to the whole set in one undo step.
 */
function getHomogeneousMultiSelectionIds(state: {
  nodes: StudioNode[];
  selectedNodeIds: string[];
}): string[] | null {
  const ids = state.selectedNodeIds;
  if (ids.length < 2) {
    return null;
  }
  const picked: StudioNode[] = [];
  for (const id of ids) {
    const n = state.nodes.find((x) => x.id === id);
    if (n == null) {
      return null;
    }
    picked.push(n);
  }
  const nodeId = picked[0]?.data.nodeId;
  if (nodeId == null || !picked.every((n) => n.data.nodeId === nodeId)) {
    return null;
  }
  return [...ids];
}

const MAX_UNDO = 40;

/** Coalesce rapid layout-only changes (drag/resize) into one undo step. */
let layoutUndoPrimed = false;
let layoutUndoIdleTimer: ReturnType<typeof setTimeout> | undefined;

let structuralUndoCoalescer: ReturnType<typeof createFlowUndoCoalescer> | null = null;

function structuralUndoCoalescerFor(get: () => { pushUndoSnapshot: () => void }) {
  if (structuralUndoCoalescer == null) {
    structuralUndoCoalescer = createFlowUndoCoalescer(() => {
      get().pushUndoSnapshot();
    });
  }
  return structuralUndoCoalescer;
}
const oscillatorSweepOnceAnchorMsByNodeId = new Map<string, number>();
const sfxTriggerWasHighByNodeId = new Map<string, boolean>();
const machineTriggerWasHighByNodeId = new Map<string, boolean>();

function nodeChangesAreLayoutOnly(
  changes: Parameters<typeof applyNodeChanges<StudioNode>>[0],
): boolean {
  if (changes.length === 0) {
    return false;
  }
  return changes.every(
    (ch) => ch.type === "position" || ch.type === "dimensions",
  );
}

/** Keep RF wrapper style in sync when edge-resize sets explicit width/height. */
function syncStudioNodeLayoutStyleFromDimensionChanges(
  nodes: StudioNode[],
  changes: Parameters<typeof applyNodeChanges<StudioNode>>[0],
): StudioNode[] {
  const dimById = new Map<string, { width: number; height: number }>();
  for (const ch of changes) {
    if (ch.type !== "dimensions" || ch.dimensions == null) {
      continue;
    }
    const { width, height } = ch.dimensions;
    if (
      typeof width === "number" &&
      Number.isFinite(width) &&
      typeof height === "number" &&
      Number.isFinite(height)
    ) {
      dimById.set(ch.id, {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      });
    }
  }
  if (dimById.size === 0) {
    return nodes;
  }
  return nodes.map((node) => {
    const dim = dimById.get(node.id);
    if (dim == null) {
      return node;
    }
    return {
      ...node,
      width: dim.width,
      height: dim.height,
      style: {
        ...(node.style ?? {}),
        width: dim.width,
        height: dim.height,
      },
    };
  });
}

/** Re-run the pin solver so config-driven sources (e.g. `model-select`) refresh downstream `liveValue` without waiting for UART ticks. */
function flushFlowSimulationPins(
  get: () => { tickSimulation: () => void },
): void {
  get().tickSimulation();
}

function resolveRootGraphBuffer(state: StudioSubgraphStoreSlice): {
  rootNodes: FlowGraphNode[];
  rootEdges: Edge[];
} {
  if (state.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    return { rootNodes: state.nodes, rootEdges: state.edges };
  }
  if (state.rootNodes.length > 0) {
    return { rootNodes: state.rootNodes, rootEdges: state.rootEdges };
  }
  return { rootNodes: state.nodes, rootEdges: state.edges };
}

function applyGroupHostDuplicateToStore(
  set: (
    partial:
      | Partial<FlowEditorState>
      | ((state: FlowEditorState) => Partial<FlowEditorState>),
  ) => void,
  state: StudioSubgraphStoreSlice,
  result: DuplicateGroupInstanceResult,
): void {
  const { rootNodes, rootEdges } = resolveRootGraphBuffer(state);
  const appended = appendGroupHostToRootGraph(
    rootNodes,
    rootEdges,
    result.hostNode,
  );
  const attached = attachConfigErrorsWithModelChildRegistry(
    appended.rootNodes as FlowGraphNode[],
    appended.rootEdges,
  );

  if (state.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    const committed = commitActiveGraphMutation(
      { ...state, subgraphs: result.subgraphs },
      attached,
      appended.rootEdges,
    );
    set({
      ...committed,
      nodes: attached,
      edges: appended.rootEdges,
      ...selectionFromIds([result.hostNode.id]),
    });
    return;
  }

  set({
    ...state,
    subgraphs: result.subgraphs,
    rootNodes: attached,
    rootEdges: appended.rootEdges,
  });
}

type FlowEditorState = {
  nodes: FlowGraphNode[];
  edges: Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  activeGraphId: StudioGraphId;
  graphStack: StudioGraphId[];
  rootNodes: FlowGraphNode[];
  rootEdges: Edge[];
  selectedNodeId: string | null;
  /** React Flow multi-selection order (primary inspector target is `selectedNodeId`, kept in sync). */
  selectedNodeIds: string[];
  undoStack: FlowSnapshot[];
  redoStack: FlowSnapshot[];
  pushUndoSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  hydrateFlowDocument: (snapshot: FlowSnapshot) => void;
  exportFlowGraphJson: (options?: {
    viewport?: StudioPersistedViewport | null;
    canvasPreferences?: FlowCanvasPreferences;
    workbenchLayout?: WorkbenchFlowAttachmentV1;
  }) => string;
  importFlowGraphJson: (json: string) =>
    | {
        ok: true;
        viewport?: StudioPersistedViewport;
        canvasPreferences?: FlowCanvasPreferences;
        workbenchLayout?: WorkbenchFlowAttachmentV1;
      }
    | { ok: false; message: string };
  duplicateSelection: () => void;
  copyFlowSelectionToClipboard: () => Promise<boolean>;
  pasteFlowFromClipboard: () => Promise<{
    ok: boolean;
    message?: string;
    pendingFlowPreset?: StudioFlowPresetFile;
    pendingRawFlowDocument?: string;
  }>;
  createGroupFromSelection: () => void;
  ungroupSelection: () => void;
  enterGroup: (groupId: string) => void;
  exitGroup: () => void;
  jumpToGraph: (graphId: StudioGraphId) => void;
  updateNodeGroupInterface: (
    hostNodeId: string,
    nextInterface: StudioGroupInterface,
  ) => void;
  syncGroupInterfaceFromWires: (hostNodeId: string) => void;
  updateNodeGroupTitle: (hostNodeId: string, title: string) => void;
  ungroupNodeGroup: (hostNodeId: string) => void;
  duplicateGroupLinked: (hostNodeId: string) => void;
  duplicateGroupDeepCopy: (hostNodeId: string) => void;
  /** Synced from {@link useStudioAssetDescriptors} for GLB fetch resolution in store-side helpers. */
  studioAssetDescriptors: readonly StudioAssetDescriptor[];
  setStudioAssetDescriptors: (
    descriptors: readonly StudioAssetDescriptor[],
  ) => void;
  nodeGroupLibrary: StudioNodeAssetFile[];
  flowPresetLibrary: StudioFlowPresetFile[];
  remoteNodeGraphAssets: Record<string, StudioNodeAssetFile>;
  registerRemoteNodeGraphAsset: (asset: StudioNodeAssetFile) => void;
  clearRemoteNodeGraphAssets: () => void;
  resolveNodeGroupAsset: (assetId: string) => StudioNodeAssetFile | undefined;
  saveGroupToNodeLibrary: (
    hostNodeId: string,
    name?: string,
  ) => StudioLibrarySaveResult | null;
  removeNodeAssetFromLibrary: (assetId: string) => void;
  importNodeAssetToLibrary: (asset: StudioNodeAssetFile) => string;
  exportNodeAssetById: (assetId: string) => boolean;
  exportGroupAsNodeAssetFile: (hostNodeId: string) => boolean;
  saveToLibrary: (args: {
    name: string;
    category?: StudioFlowPresetCategory;
    description?: string;
    tags?: string[];
  }) => { target: SaveToLibraryTarget } & (FlowPresetSaveResult | StudioLibrarySaveResult) | null;
  loadFlowPresetFromLibrary: (
    presetId: string,
    mode: "replace" | "merge",
  ) => boolean;
  removeFlowPresetFromLibrary: (presetId: string) => void;
  importFlowPresetToLibrary: (preset: StudioFlowPresetFile) => string;
  exportFlowPresetById: (presetId: string) => boolean;
  mergeFlowPresetDocument: (document: StudioFlowPresetFile["document"]) => boolean;
  importNodeAssetIntoGroup: (
    hostNodeId: string,
    asset: StudioNodeAssetFile,
  ) => boolean;
  updateGroupFromLibrary: (hostNodeId: string) => boolean;
  breakGroupLibraryLink: (hostNodeId: string) => void;
  instantiateNodeAssetAt: (
    asset: StudioNodeAssetFile,
    position: { x: number; y: number },
  ) => boolean;
  deleteSelection: () => void;
  selectAllNodes: () => void;
  clearNodeSelection: () => void;
  /** Blender-style **A** — select all when not fully selected; deselect all when every node is selected. */
  toggleSelectAllNodes: () => void;
  /** Programmatic selection (e.g. jump from Model card to a linked node). Does not push undo. */
  selectStudioNodesByIds: (nodeIds: string[]) => void;
  onNodesChange: (
    changes: Parameters<typeof applyNodeChanges<StudioNode>>[0],
  ) => void;
  onEdgesChange: (
    changes: Parameters<typeof applyEdgeChanges<Edge>>[0],
  ) => void;
  onConnect: (
    connection: Connection,
    options?: { skipUndoSnapshot?: boolean; excludeEdgeId?: string },
  ) => void;
  /** Drag an existing wire end to another socket (React Flow `onReconnect`). */
  onReconnect: (
    oldEdge: Edge,
    newConnection: Connection,
    options?: { skipUndoSnapshot?: boolean },
  ) => void;
  /** Remove edges before reconnect drag (single-input pop-on-start). */
  popEdgesForSocketReconnect: (
    edgeIds: readonly string[],
    options?: { recordUndo?: boolean },
  ) => void;
  onSelectionChange: (selectedNodeIds: string[]) => void;
  addNodeFromCatalog: (
    entry: NodeCatalogEntry,
    options?: { ui?: StudioNodeData["ui"] },
  ) => void;
  addNodeFromCatalogAt: (
    entry: NodeCatalogEntry,
    position: { x: number; y: number },
    options?: {
      ui?: StudioNodeData["ui"];
      flowNodeLabel?: string;
      mergeDefaultConfig?: Record<string, unknown>;
    },
  ) => string;
  addLayoutNodeAt: (
    kind: LayoutMenuEntryId,
    position: { x: number; y: number },
  ) => string;
  spawnRerouteAt: (position: { x: number; y: number }) => string;
  insertRerouteOnEdge: (
    edgeId: string,
    flowPosition: { x: number; y: number },
  ) => string | null;
  applyFlowFrameDragStop: (dragged: FlowGraphNode) => void;
  fitSelectedFramesToContents: (frameIds?: string[]) => boolean;
  dissolveSelectedFrames: (frameIds?: string[]) => boolean;
  createFrameAroundSelection: () => void;
  detachSelectionFromFrame: () => boolean;
  toggleSocketsExpandedForNodes: (nodeIds: string[]) => void;
  toggleSocketValuesVisibleForNodes: (nodeIds: string[]) => void;
  setSocketsExpandedForNodes: (nodeIds: string[], expanded: boolean) => void;
  setSocketValuesVisibleForNodes: (nodeIds: string[], visible: boolean) => void;
  setStudioNodeChromeLayoutWidth: (
    nodeIds: string[],
    chromeKey: StudioNodeChromeLayoutKey,
    widthPx: number,
  ) => void;
  copyStudioNodeCanvasWidthToAllChromeModes: (nodeIds: string[]) => void;
  fitStudioNodesWidthToContent: (nodeIds: string[]) => void;
  /** Measure-driven width sync when display mode changes (no undo). */
  syncStudioNodeWidthFromContentMeasure: (
    nodeId: string,
    measuredWidthPx: number,
  ) => void;
  /** @deprecated Use syncStudioNodeWidthFromContentMeasure */
  syncStudioNodeChromeWidthFromMeasureIfUnset: (
    nodeId: string,
    measuredWidthPx: number,
  ) => void;
  persistStudioNodeCanvasWidthForActiveChrome: (
    nodeId: string,
    widthPx: number,
  ) => void;
  toggleBodyControlsVisibleForNodes: (nodeIds: string[]) => void;
  /** Restore factory display (live values, all sockets) + auto content-fit size. Undoable. */
  resetStudioNodesToDefaults: (nodeIds: string[]) => void;
  applyFlowAutoLayout: (direction: "LR" | "TB") => void;
  updateLayoutNodeData: (
    flowNodeId: string,
    patch: Record<string, unknown>,
  ) => void;
  /** Update layout-node top-level props (style/zIndex/draggable/...). Undo is NOT pushed. */
  updateLayoutFlowNode: (
    flowNodeId: string,
    patch: Partial<FlowGraphNode>,
  ) => void;
  /** Raise/lower a layout node within the canvas stacking order. */
  raiseLayoutNode: (flowNodeId: string) => void;
  lowerLayoutNode: (flowNodeId: string) => void;
  /**
   * Create a node from the catalog and bind it to a **Model** (`model-select`) parent via
   * `sourceModelNodeId`. The store reconciles `generatedChildNodeIds` on the parent.
   */
  addNodeFromCatalogLinkedToModel: (
    entry: NodeCatalogEntry,
    position: { x: number; y: number },
    options: {
      parentModelNodeId: string;
      ui?: StudioNodeData["ui"];
      /** Overrides `data.label` after creation (e.g. GLB extraction row title). */
      flowNodeLabel?: string;
      mergeDefaultConfig?: Record<string, unknown>;
    },
  ) => void;
  /**
   * Create a GLB-scoped catalog node with inline catalog model binding (no `model-select` wire).
   * Caller supplies `selectedStudioAssetId` / `selectedModelUrl` inside `mergeDefaultConfig`.
   */
  addNodeFromCatalogWithInlineGlbModel: (
    entry: NodeCatalogEntry,
    position: { x: number; y: number },
    options: {
      ui?: StudioNodeData["ui"];
      flowNodeLabel?: string;
      mergeDefaultConfig: Record<string, unknown>;
    },
  ) => void;
  updateNodeConfigFieldByNodeId: (
    nodeId: string,
    key: string,
    value: unknown,
  ) => void;
  /** Collapse/expand utility node bodies and sync React Flow height (header-only when collapsed). */
  setStudioUtilityNodeBodyExpanded: (
    flowNodeId: string,
    field: StudioUtilityBodyExpandedField,
    expanded: boolean,
  ) => void;
  resetCanvas: () => void;
  /** Turn off all audio gates and silence monitor paths (undoable). */
  muteAllAudio: () => void;
  fireAudioSfxNode: (nodeId: string) => void;
  runDemoTemplate: (
    templateId: StudioDemoTemplateId,
    catalog: NodeCatalogEntry[],
  ) => void;
  /** Library wizard: spawn Model-linked clip(s) + Merge/Mix/Blend + Model Viewer. */
  spawnGlbAnimationSetupGraph: (
    parentModelFlowNodeId: string,
    clipRefs: readonly string[],
    catalog: NodeCatalogEntry[],
    combinerMode?: import("../components/node-palette/glb-animation-setup-combiner").GlbAnimationSetupCombinerMode,
  ) => void;
  updateSelectedNodeLabel: (nextLabel: string) => void;
  updateSelectedNodeConfigField: (key: string, value: unknown) => boolean;
  /** Patch multiple config keys on the selected node in one undo step. */
  patchSelectedNodeConfigFields: (fields: Record<string, unknown>) => boolean;
  updateSelectedNodeUiResizable: (resizable: boolean) => void;
  updateSelectedNodeUiAllowBodyCollapse: (allow: boolean) => void;
  /** Sync measured content minimums (no undo — updated by `StudioNodeCard`). */
  syncStudioNodeContentMinDimensions: (
    nodeId: string,
    contentMinWidth: number,
    contentMinHeight: number,
  ) => void;
  /** Live header + socket + panel chrome for 3D preview node sizing (no undo). */
  syncStudioNodeViewportPreviewHeadHeight: (
    nodeId: string,
    headHeightPx: number,
  ) => void;
  /** Set explicit RF width/height for the current homogeneous selection (or single node). */
  updateSelectedStudioNodeLayoutDimensions: (patch: {
    width?: number;
    height?: number;
  }) => void;
  /** Apply 3D preview aspect + size tier to the current selection (enables manual resize). */
  applySelectedViewportPreviewLayout: (patch: {
    aspect?: StudioViewportPreviewAspect;
    sizeTier?: StudioViewportPreviewSizeTier;
  }) => void;
  /**
   * Single-selection config patch without pushing an undo snapshot (e.g. animation playback ticks).
   * Returns **false** for multi-edit or when nothing is selected.
   */
  applySelectedNodeConfigFieldLive: (key: string, value: unknown) => boolean;
  /** Live config patch by flow node id (no undo) — used when inspector session outlives selection. */
  applyNodeConfigFieldsLiveByNodeId: (
    nodeId: string,
    fields: Record<string, unknown>,
  ) => boolean;
  updateSelectedNodeConfigFromJson: (
    nextJson: string,
  ) => { ok: true } | { ok: false; message: string };
  /** Replace plotter `defaultConfig` in one undo step (coerced + persisted). */
  updateSelectedNodePlotterConfig: (next: PlotterConfig) => void;
  /** Clear live trace buffers on the selected plotter node(s). */
  clearSelectedPlotterHistory: () => void;
  tickSimulation: () => void;
  /** Domain C — keyboard event sources → wired action nodes. Returns true when consumed. */
  dispatchFlowKeyboardEvent: (event: {
    code: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey?: boolean;
  }) => boolean;
  dispatchFlowPanePointerEvent: (event: { button: number }) => boolean;
  /** Domain C — Stage viewport model pick → **on-stage-pick** event sources. */
  dispatchStagePickEvent: (event: {
    button: number;
    modelIndex: number;
    sourceNodeId: string;
    hitPoint: { x: number; y: number; z: number };
    objectPath: string;
  }) => boolean;
};

function inferPortTypes(entry: NodeCatalogEntry): {
  inputType?: StudioPortType;
  outputType?: StudioPortType;
  outputHandles?: StudioOutputHandleDef[];
  inputHandles?: StudioOutputHandleDef[];
} {
  if (
    entry.id === "environment" &&
    entry.outputPorts != null &&
    entry.outputPorts.length > 0
  ) {
    return {
      outputHandles: entry.outputPorts.map((p) => ({
        id: p.id,
        portType: p.portType as StudioPortType,
        label: p.label,
      })),
      inputHandles: [],
    };
  }
  if (entry.id === "math") {
    return {
      inputHandles: computeMathInputHandles(entry.defaultConfig),
      outputHandles: [MATH_OUTPUT_HANDLE],
    };
  }
  if (entry.id === "logic-gate") {
    return {
      inputHandles: computeLogicGateInputHandles(entry.defaultConfig),
      outputHandles: [LOGIC_GATE_OUTPUT_HANDLE],
    };
  }
  if (entry.id === "animation-merge") {
    return {
      inputHandles: computeAnimationMergeInputHandles(entry.defaultConfig),
      outputHandles: [ANIMATION_MERGE_OUTPUT_HANDLE],
    };
  }
  if (entry.id === "animation-mix") {
    return {
      inputHandles: computeAnimationMixInputHandles(entry.defaultConfig),
      outputHandles: [ANIMATION_MIX_OUTPUT_HANDLE],
    };
  }
  if (entry.inputPorts != null && entry.inputPorts.length > 0) {
    const inputHandles = entry.inputPorts.map((p) => ({
      id: p.id,
      portType: p.portType as StudioPortType,
      label: p.label,
    }));
    const outputHandles =
      entry.outputPorts != null && entry.outputPorts.length > 0
        ? entry.outputPorts.map((p) => ({
            id: p.id,
            portType: p.portType as StudioPortType,
            label: p.label,
          }))
        : undefined;
    return {
      inputHandles,
      ...(outputHandles != null ? { outputHandles } : {}),
    };
  }
  if (entry.outputPorts != null && entry.outputPorts.length > 0) {
    return {
      outputHandles: entry.outputPorts.map((p) => ({
        id: p.id,
        portType: p.portType as StudioPortType,
        label: p.label,
      })),
    };
  }
  if (entry.id === "quat-input") {
    return { outputType: "quaternion" };
  }
  if (entry.id === "sensor-input") {
    return { outputType: "number" };
  }
  if (entry.id === "number-average") {
    return { inputType: "number", outputType: "number" };
  }
  if (entry.id === "threshold") {
    return { inputType: "number", outputType: "boolean" };
  }
  if (entry.id === "indicator") {
    return { inputType: "boolean" };
  }
  if (entry.id === "sparkline") {
    return { inputType: "number" };
  }
  if (entry.category === "input" || entry.category === "sensor") {
    return { outputType: "number" };
  }
  if (entry.category === "output") {
    return { inputType: "number" };
  }
  if (entry.category === "utility") {
    return { inputType: "number", outputType: "number" };
  }
  return { inputType: "number", outputType: "number" };
}

/** Legacy handle id before split Euler vs quaternion outputs. */
function migrateStudioEdgesFusionQuat(edges: Edge[]): Edge[] {
  return edges.map((e) => ({
    ...e,
    sourceHandle:
      e.sourceHandle === "fusionQuat" ? "quaternion" : e.sourceHandle,
    targetHandle:
      e.targetHandle === "fusionQuat" ? "quaternion" : e.targetHandle,
  }));
}

function migrateStudioEdgesMapRange(
  nodes: StudioNode[],
  edges: Edge[],
): Edge[] {
  const mapRangeIds = new Set(
    nodes
      .filter((n) => n.type === "studio" && n.data.nodeId === "map-range")
      .map((n) => n.id),
  );
  const clampIds = new Set(
    nodes
      .filter((n) => n.type === "studio" && n.data.nodeId === "clamp")
      .map((n) => n.id),
  );
  if (mapRangeIds.size === 0 && clampIds.size === 0) {
    return edges;
  }
  return edges.map((e) => {
    if (mapRangeIds.has(e.target)) {
      const handle = e.targetHandle ?? STUDIO_HANDLE_IN;
      if (handle === STUDIO_HANDLE_IN) {
        return { ...e, targetHandle: "value" };
      }
    }
    if (clampIds.has(e.target)) {
      const handle = e.targetHandle ?? STUDIO_HANDLE_IN;
      if (handle === STUDIO_HANDLE_IN) {
        return { ...e, targetHandle: "value" };
      }
    }
    return e;
  });
}

/** Legacy graph migration before catalog refresh (e.g. oscilloscope → plotter, gauge → bar-meter). */
function migrateFlowNodeFromLegacy(node: StudioNode): StudioNode {
  let data = migrateLegacyPlotterNodeData(node.data) as StudioNodeData;
  data = migrateLegacyGaugeNodeData(data) as StudioNodeData;
  const rawDefaultConfig = data.defaultConfig;
  if (
    rawDefaultConfig != null &&
    typeof rawDefaultConfig === "object" &&
    !Array.isArray(rawDefaultConfig)
  ) {
    const dc = migrateLegacyPackModelInDefaultConfig(
      rawDefaultConfig as Record<string, unknown>,
      data.nodeId,
    );
    if (dc !== rawDefaultConfig) {
      data = { ...data, defaultConfig: dc };
    }
  }
  const stageMigrated = migrateStageSceneFlowNode({
    data: {
      nodeId: data.nodeId,
      defaultConfig: (data.defaultConfig ?? {}) as Record<string, unknown>,
    },
  });
  if (stageMigrated != null) {
    data = { ...data, defaultConfig: stageMigrated.data.defaultConfig };
  }
  return { ...node, data };
}

/** Refresh input/output pin definitions from the bundled catalog (catalog updates, import). */
function refreshCatalogOutputHandles(node: StudioNode): StudioNode {
  const entry = NODE_CATALOG_DEFAULTS.payload.nodes.find(
    (n) => n.id === node.data.nodeId,
  );
  if (entry == null) {
    return node;
  }
  if (entry.id === "animation-merge") {
    return {
      ...node,
      data: {
        ...node.data,
        inputHandles: computeAnimationMergeInputHandles(node.data.defaultConfig),
        outputHandles: [ANIMATION_MERGE_OUTPUT_HANDLE],
        inputType: undefined,
        outputType: undefined,
        category: entry.category,
      },
    };
  }
  if (entry.id === "animation-mix") {
    const mixWeights = ensureMixWeightsForCount(
      node.data.defaultConfig,
      readAnimationMixInputCount(node.data.defaultConfig),
    );
    const defaultConfig = { ...node.data.defaultConfig, mixWeights };
    return {
      ...node,
      data: {
        ...node.data,
        defaultConfig,
        inputHandles: computeAnimationMixInputHandles(defaultConfig),
        outputHandles: [ANIMATION_MIX_OUTPUT_HANDLE],
        inputType: undefined,
        outputType: undefined,
        category: entry.category,
      },
    };
  }
  const inferred = inferPortTypes(entry);
  return {
    ...node,
    data: {
      ...node.data,
      ...inferred,
      category: entry.category,
    },
  };
}

function getSourcePortType(
  node: FlowGraphNode,
  sourceHandle: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): StudioPortType | null {
  const groupType = resolveStudioGroupNodePortType(
    node,
    sourceHandle,
    "output",
    subgraphs,
  );
  if (groupType != null) {
    return groupType;
  }
  return resolveFlowSourcePortType(node, sourceHandle);
}

function getTargetPortType(
  node: FlowGraphNode,
  targetHandle: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): StudioPortType | null {
  const groupType = resolveStudioGroupNodePortType(
    node,
    targetHandle,
    "input",
    subgraphs,
  );
  if (groupType != null) {
    return groupType;
  }
  if (!isStudioFlowNode(node)) {
    return null;
  }
  const inputHandles = node.data.inputHandles;
  if (inputHandles != null && inputHandles.length > 0) {
    return inputHandles.find((h) => h.id === targetHandle)?.portType ?? null;
  }
  if (targetHandle !== STUDIO_HANDLE_IN) {
    return null;
  }
  return node.data.inputType ?? null;
}

function edgeLabelForSource(
  sourceNode: FlowGraphNode,
  sourceHandle: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): string {
  const t = getSourcePortType(sourceNode, sourceHandle, subgraphs);
  return t ?? "";
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function flowValueAsVec3(v: unknown): FlowWireVec3 {
  if (v != null && typeof v === "object" && "x" in v && "y" in v && "z" in v) {
    const o = v as Record<string, unknown>;
    return {
      x: asFiniteNumber(o.x, 0),
      y: asFiniteNumber(o.y, 0),
      z: asFiniteNumber(o.z, 0),
    };
  }
  return { x: 0, y: 0, z: 0 };
}

function cloneFlowSnapshot(state: {
  nodes: FlowGraphNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedNodeIds?: string[];
  subgraphs?: Record<string, StudioSubgraphDocument>;
  activeGraphId?: StudioGraphId;
  graphStack?: StudioGraphId[];
  rootNodes?: FlowGraphNode[];
  rootEdges?: Edge[];
}): FlowSnapshot {
  const sel = normalizeFlowSnapshotSelection(state);
  return {
    nodes: JSON.parse(JSON.stringify(state.nodes)) as FlowGraphNode[],
    edges: JSON.parse(JSON.stringify(state.edges)) as Edge[],
    selectedNodeId: sel.selectedNodeId,
    selectedNodeIds: sel.selectedNodeIds,
    ...(state.subgraphs != null
      ? { subgraphs: JSON.parse(JSON.stringify(state.subgraphs)) }
      : {}),
    ...(state.activeGraphId != null
      ? { activeGraphId: state.activeGraphId }
      : {}),
    ...(state.graphStack != null ? { graphStack: [...state.graphStack] } : {}),
    ...(state.rootNodes != null
      ? {
          rootNodes: JSON.parse(
            JSON.stringify(state.rootNodes),
          ) as FlowGraphNode[],
        }
      : {}),
    ...(state.rootEdges != null
      ? { rootEdges: JSON.parse(JSON.stringify(state.rootEdges)) as Edge[] }
      : {}),
  };
}

/** Title bar only — keeps sliders / sockets from starting a canvas node drag (see `nodrag` on body + sockets). */
function dragHandleSelectorForNodeId(_nodeId: string): string {
  return ".studio-node-drag-handle";
}

/** Drop legacy persisted non-live markers (e.g. old `"demo"`); only `"live"` may be stored. */
function coercePersistedSensorStreamMode(data: StudioNodeData): StudioNodeData {
  const marker = (data as StudioNodeData & { sensorStreamMode?: unknown })
    .sensorStreamMode;
  if (marker === undefined || marker === "live") {
    return data;
  }
  const { sensorStreamMode: _, ...rest } = data as StudioNodeData & {
    sensorStreamMode?: unknown;
  };
  return rest as StudioNodeData;
}

function attachConfigErrors(
  nodes: FlowGraphNode[],
  edges?: Edge[],
): FlowGraphNode[] {
  return nodes.map((node) => {
    if (!isStudioFlowNode(node)) {
      return node;
    }
    const coercedData = migrateLegacyPlotterNodeData(
      coercePersistedSensorStreamMode(node.data),
    ) as StudioNodeData;
    const withScene3d: StudioNodeData =
      coercedData.nodeId === "scene-output"
        ? (() => {
            const dc = coercedData.defaultConfig as Record<string, unknown>;
            const showGrid =
              typeof dc.showGrid === "boolean"
                ? dc.showGrid
                : STAGE_DEFAULT_SHOW_GRID;
            const base =
              dc.scene3d != null
                ? coerceScene3DConfigV1(dc.scene3d)
                : stageSceneOutputDefaultScene3d();
            return {
              ...coercedData,
              defaultConfig: {
                ...dc,
                showGrid,
                scene3d: persistScene3DConfig(
                  applyStageScene3dPresentation(base, { showGrid }),
                ),
              },
            };
          })()
        : coercedData.nodeId === "rotation-3d-euler" ||
            coercedData.nodeId === "rotation-3d-quaternion" ||
            coercedData.nodeId === "model-viewer"
          ? (() => {
              const dc = coercedData.defaultConfig as Record<string, unknown>;
              if (dc.scene3d != null) {
                const normalized = coerceScene3DConfigV1(dc.scene3d);
                return {
                  ...coercedData,
                  defaultConfig: {
                    ...dc,
                    scene3d: normalized,
                  },
                };
              }
              const next = defaultScene3DConfig();
              const legacyShowGrid = dc.showGrid;
              if (typeof legacyShowGrid === "boolean") {
                next.helpers.grid.enabled = legacyShowGrid;
              }
              const legacyEnvIdx = dc.environmentPresetIndex;
              if (
                typeof legacyEnvIdx === "number" &&
                Number.isFinite(legacyEnvIdx)
              ) {
                next.environment.presetIndex = Math.max(
                  0,
                  Math.round(legacyEnvIdx),
                );
              }
              const legacyBg = dc.showBackgroundTexture;
              if (typeof legacyBg === "boolean") {
                next.environment.showBackgroundTexture = legacyBg;
              }
              const legacyIbl = dc.useCubemapIbl;
              if (typeof legacyIbl === "boolean") {
                next.environment.useCubemapIbl = legacyIbl;
              }
              const migrated: StudioNodeData = {
                ...coercedData,
                defaultConfig: {
                  ...dc,
                  scene3d: persistScene3DConfig(next),
                },
              };
              return migrated;
            })()
          : coercedData;
    let piped: StudioNodeData = withScene3d;
    // Default: auto content-fit sizing; edge resize is opt-in per node (Inspector → Node → Card size).
    const uiWithFloors = applyStudioNodeMinDimensionsToUi(piped.nodeId, {
      ...piped.ui,
      resizable:
        typeof piped.ui?.resizable === "boolean"
          ? piped.ui.resizable
          : studioNodeDefaultResizable(piped.nodeId),
      allowBodyCollapse:
        piped.ui?.allowBodyCollapse ??
        studioNodeDefaultAllowBodyCollapse(piped.nodeId),
    });
    const rfWidth =
      typeof node.width === "number" && node.width > 0 ? node.width : undefined;
    piped = {
      ...piped,
      ui: migrateStudioNodeChromeLayoutWidth(
        piped.nodeId,
        uiWithFloors,
        rfWidth,
      ),
    };
    if (piped.nodeId === "plotter") {
      const plotterCfg = persistPlotterConfig(piped.defaultConfig);
      piped = {
        ...piped,
        defaultConfig: {
          ...(plotterCfg as unknown as Record<string, unknown>),
        },
      };
    }
    if (piped.nodeId === "environment") {
      const dc0 = piped.defaultConfig as Record<string, unknown>;
      const vis0 = readEnvironmentInputSocketVisibility(dc0);
      const vis =
        edges == null
          ? vis0
          : mergeEnvironmentVisibilityWithIncomingEdges(node.id, vis0, edges);
      const expanded =
        typeof dc0.environmentControlsExpanded === "boolean"
          ? dc0.environmentControlsExpanded
          : true;
      const w = flowWireEnvironmentFromNodeDefaultConfig({
        ...dc0,
        inputSocketVisibility: vis,
        environmentControlsExpanded: expanded,
      });
      const dcNext: Record<string, unknown> = {
        ...(w as unknown as Record<string, unknown>),
        inputSocketVisibility: vis,
        environmentControlsExpanded: expanded,
      };
      piped = {
        ...piped,
        defaultConfig: dcNext,
        inputHandles: computeEnvironmentInputHandles(vis),
        outputHandles: [
          {
            id: STUDIO_HANDLE_OUT,
            portType: "environment",
            label: "Environment",
          },
        ],
        inputType: undefined,
        outputType: undefined,
      };
    }
    if (piped.nodeId === "camera-view") {
      const dcCam = piped.defaultConfig as Record<string, unknown>;
      const expanded =
        typeof dcCam.cameraViewControlsExpanded === "boolean"
          ? dcCam.cameraViewControlsExpanded
          : true;
      const w = flowWireCameraFromNodeDefaultConfig(dcCam);
      piped = {
        ...piped,
        defaultConfig: {
          ...dcCam,
          ...(w as unknown as Record<string, unknown>),
          cameraViewControlsExpanded: expanded,
        },
      };
    }
    if (piped.nodeId === "glb-animation-bundle") {
      const dcAnim = piped.defaultConfig as Record<string, unknown>;
      const w = flowAnimationWireFromBundleDefaultConfig(dcAnim);
      piped = {
        ...piped,
        defaultConfig: {
          ...dcAnim,
          clips: w.clips,
        },
      };
    }
    if (piped.nodeId === "math") {
      piped = {
        ...piped,
        inputHandles: computeMathInputHandles(piped.defaultConfig),
        outputHandles: [MATH_OUTPUT_HANDLE],
        inputType: undefined,
        outputType: undefined,
      };
    }
    if (piped.nodeId === "logic-gate") {
      piped = {
        ...piped,
        inputHandles: computeLogicGateInputHandles(piped.defaultConfig),
        outputHandles: [LOGIC_GATE_OUTPUT_HANDLE],
        inputType: undefined,
        outputType: undefined,
      };
    }
    if (piped.nodeId === "animation-merge") {
      piped = {
        ...piped,
        inputHandles: computeAnimationMergeInputHandles(piped.defaultConfig),
        outputHandles: [ANIMATION_MERGE_OUTPUT_HANDLE],
        inputType: undefined,
        outputType: undefined,
      };
    }
    if (piped.nodeId === "animation-mix") {
      const mixCount = readAnimationMixInputCount(piped.defaultConfig);
      const mixWeights = ensureMixWeightsForCount(piped.defaultConfig, mixCount);
      const defaultConfig = {
        ...piped.defaultConfig,
        mixWeights,
        normalizeWeights: readNormalizeMixWeights(piped.defaultConfig),
      };
      piped = {
        ...piped,
        defaultConfig,
        inputHandles: computeAnimationMixInputHandles(defaultConfig),
        outputHandles: [ANIMATION_MIX_OUTPUT_HANDLE],
        inputType: undefined,
        outputType: undefined,
      };
    }
    const errors = validateStudioNodeConfig(piped.nodeId, piped.defaultConfig);
    const dragHandle = dragHandleSelectorForNodeId(piped.nodeId);
    let layoutNode: StudioNode = {
      ...node,
      dragHandle,
      data: {
        ...piped,
        configErrors: errors.length > 0 ? errors : undefined,
      },
    };
    layoutNode = syncStudioUtilityNodeLayoutFromConfig(layoutNode, piped);
    return layoutNode;
  });
}

function attachConfigErrorsWithModelChildRegistry(
  nodes: FlowGraphNode[],
  edges?: Edge[],
): FlowGraphNode[] {
  return attachConfigErrors(
    reconcileStudioModelGeneratedChildIds(nodes as StudioNode[]),
    edges,
  );
}

function applyNodeGroupInterfaceToState(
  state: StudioSubgraphStoreSlice,
  hostNodeId: string,
  nextInterface: StudioGroupInterface,
): Partial<FlowEditorState> | null {
  const host =
    state.rootNodes.find(
      (n) => n.id === hostNodeId && isStudioNodeGroupNode(n),
    ) ?? state.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
  if (host == null) {
    return null;
  }
  const subgraphId = host.data.subgraphId ?? hostNodeId;
  const subgraph = state.subgraphs[subgraphId];
  if (subgraph == null) {
    return null;
  }

  const base = subgraphForInterfaceEdit(
    subgraphId,
    subgraph,
    state.activeGraphId,
    state.nodes,
    state.edges,
  );
  if (base == null) {
    return null;
  }

  const ensured = ensureDefaultGroupSockets(nextInterface);
  const updatedSub = applyGroupInterfaceToSubgraph(base, ensured);
  const filteredRootEdges = filterParentEdgesForGroupInterface(
    state.rootEdges,
    hostNodeId,
    ensured,
  );
  const newSubgraphs = { ...state.subgraphs, [subgraphId]: updatedSub };

  if (state.activeGraphId === subgraphId) {
    const attached = attachConfigErrorsWithModelChildRegistry(
      updatedSub.nodes as FlowGraphNode[],
      updatedSub.edges,
    );
    const committed = commitActiveGraphMutation(
      { ...state, subgraphs: newSubgraphs, rootEdges: filteredRootEdges },
      attached,
      updatedSub.edges,
    );
    return { ...committed, rootEdges: filteredRootEdges };
  }
  if (state.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    const filteredEdges = filterParentEdgesForGroupInterface(
      state.edges,
      hostNodeId,
      ensured,
    );
    return {
      subgraphs: newSubgraphs,
      edges: filteredEdges,
      rootEdges: filteredEdges,
    };
  }
  return {
    subgraphs: newSubgraphs,
    rootEdges: filteredRootEdges,
  };
}

/** When **Studio Model** wires into **model-viewer** or GLB event nodes, persist `sourceModelNodeId`. */
function patchStudioModelScopeOnConnect(
  nodes: FlowGraphNode[],
  connection: Connection,
): FlowGraphNode[] {
  const target = nodes.find((n) => n.id === connection.target);
  const source = nodes.find((n) => n.id === connection.source);
  if (
    target == null ||
    !isStudioFlowNode(target) ||
    !isStudioFlowNode(source) ||
    source.data.nodeId !== "model-select"
  ) {
    return nodes;
  }
  const targetHandle = connection.targetHandle ?? STUDIO_HANDLE_IN;
  const parentId = source.id;

  if (
    catalogNodeHasStudioModelInput(target.data.nodeId) &&
    targetHandle === STUDIO_HANDLE_MODEL
  ) {
    const prevId = readSourceModelNodeId(target.data.defaultConfig);
    if (prevId === parentId) {
      return nodes;
    }
    return nodes.map((n) => {
      if (n.id !== target.id) {
        return n;
      }
      const nextConfig: Record<string, unknown> = {
        ...n.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: parentId,
      };
      if (readGlbExtractTag(n.data.defaultConfig) != null) {
        delete nextConfig[STUDIO_GLB_EXTRACT_KIND_KEY];
        delete nextConfig[STUDIO_GLB_EXTRACT_REF_KEY];
      }
      if (n.data.nodeId === "animation-clip") {
        delete nextConfig[ANIMATION_CLIP_NAME_KEY];
      }
      return {
        ...n,
        data: {
          ...n.data,
          defaultConfig: nextConfig,
        },
      };
    });
  }

  if (
    target.data.nodeId !== "model-viewer" ||
    targetHandle !== STUDIO_HANDLE_IN
  ) {
    return nodes;
  }

  let changed = false;
  const next = nodes.map((n) => {
    if (n.id === target.id) {
      if (readSourceModelNodeId(n.data.defaultConfig) === parentId) {
        return n;
      }
      changed = true;
      return {
        ...n,
        data: {
          ...n.data,
          defaultConfig: {
            ...n.data.defaultConfig,
            [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: parentId,
          },
        },
      };
    }
    if (!STUDIO_GLB_EVENT_ACTION_CATALOG_ID_SET.has(n.data.nodeId)) {
      return n;
    }
    if (readSourceModelNodeId(n.data.defaultConfig) != null) {
      return n;
    }
    if (readGlbExtractTag(n.data.defaultConfig) == null) {
      return n;
    }
    changed = true;
    return {
      ...n,
      data: {
        ...n.data,
        defaultConfig: {
          ...n.data.defaultConfig,
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: parentId,
        },
      },
    };
  });
  return changed ? next : nodes;
}

/** Keep GLB model-input nodes aligned with a wired **Model** socket (scope + stale binding cleanup). */
function reconcileGlbEventModelScopeFromEdges(
  nodes: StudioNode[],
  edges: Edge[],
): StudioNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (!catalogNodeHasStudioModelInput(node.data.nodeId)) {
      return node;
    }
    const wiredModelId = resolveWiredStudioModelSelectNodeId({
      targetFlowNodeId: node.id,
      targetHandle: STUDIO_HANDLE_MODEL,
      edges,
      nodes,
    });
    if (wiredModelId == null) {
      return node;
    }
    const prevId = readSourceModelNodeId(node.data.defaultConfig);
    if (prevId === wiredModelId) {
      return node;
    }
    const nextConfig: Record<string, unknown> = {
      ...node.data.defaultConfig,
      [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: wiredModelId,
    };
    if (readGlbExtractTag(node.data.defaultConfig) != null) {
      delete nextConfig[STUDIO_GLB_EXTRACT_KIND_KEY];
      delete nextConfig[STUDIO_GLB_EXTRACT_REF_KEY];
    }
    if (node.data.nodeId === "animation-clip") {
      delete nextConfig[ANIMATION_CLIP_NAME_KEY];
    }
    changed = true;
    return {
      ...node,
      data: {
        ...node.data,
        defaultConfig: nextConfig,
      },
    };
  });
  return changed ? next : nodes;
}

const STUDIO_UTILITY_BODY_EXPANDED_KEYS = {
  cameraViewControlsExpanded: "cameraViewLayoutHeight",
  environmentControlsExpanded: "environmentLayoutHeight",
} as const;

export type StudioUtilityBodyExpandedField =
  keyof typeof STUDIO_UTILITY_BODY_EXPANDED_KEYS;

/** Read explicit flow-node height (resize handle, style, or last measured). */
function readStudioNodeLayoutHeightPx(node: StudioNode): number | undefined {
  if (
    typeof node.height === "number" &&
    Number.isFinite(node.height) &&
    node.height > 0
  ) {
    return Math.round(node.height);
  }
  const styleHeight = node.style?.height;
  if (
    typeof styleHeight === "number" &&
    Number.isFinite(styleHeight) &&
    styleHeight > 0
  ) {
    return Math.round(styleHeight);
  }
  if (typeof styleHeight === "string") {
    const match = /^([\d.]+)\s*px$/i.exec(styleHeight.trim());
    if (match != null) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.round(parsed);
      }
    }
  }
  const measuredHeight = node.measured?.height;
  if (
    typeof measuredHeight === "number" &&
    Number.isFinite(measuredHeight) &&
    measuredHeight > 0
  ) {
    return Math.round(measuredHeight);
  }
  return undefined;
}

/** Drop fixed height so auto-height shells can remeasure (socket toggles, utility collapse). */
function stripStudioNodeFixedHeight(node: StudioNode): StudioNode {
  const { height: _height, measured, style, ...rest } = node;
  let nextStyle: StudioNode["style"];
  if (style != null) {
    const { height: _styleHeight, ...styleRest } = style;
    nextStyle = Object.keys(styleRest).length > 0 ? styleRest : undefined;
  }
  let nextMeasured: StudioNode["measured"];
  if (measured != null) {
    const { height: _measuredHeight, ...measuredRest } = measured;
    nextMeasured =
      Object.keys(measuredRest).length > 0 ? measuredRest : undefined;
  }
  return {
    ...rest,
    style: nextStyle,
    measured: nextMeasured,
  };
}

/** Drop fixed width/height so auto content-fit can grow and shrink (socket chrome toggles). */
function stripStudioNodeFixedLayout(node: StudioNode): StudioNode {
  const { width: _width, height: _height, measured, style, ...rest } = node;
  let nextStyle: StudioNode["style"];
  if (style != null) {
    const { width: _sw, height: _sh, ...styleRest } = style;
    nextStyle = Object.keys(styleRest).length > 0 ? styleRest : undefined;
  }
  let nextMeasured: StudioNode["measured"];
  if (measured != null) {
    const { width: _mw, height: _mh, ...measuredRest } = measured;
    nextMeasured =
      Object.keys(measuredRest).length > 0 ? measuredRest : undefined;
  }
  return {
    ...rest,
    style: nextStyle,
    measured: nextMeasured,
  };
}

/** Auto-sized nodes drop fixed RF dimensions so content-fit can remeasure after chrome toggles. */
function prepareStudioNodeShellRemeasure(node: StudioNode): StudioNode {
  if (node.type !== "studio") {
    return node;
  }
  const data = node.data as StudioNodeData;
  if (data.ui?.resizable === true) {
    return node;
  }
  return stripStudioNodeFixedLayout(node);
}

function applyStudioNodeLayoutHeight(
  node: StudioNode,
  heightPx: number,
): StudioNode {
  const rounded = Math.max(1, Math.round(heightPx));
  return {
    ...node,
    height: rounded,
    style: {
      ...(node.style ?? {}),
      height: rounded,
    },
  };
}

function applyStudioNodeLayoutDimensions(
  node: StudioNode,
  widthPx: number,
  heightPx: number,
): StudioNode {
  const width = Math.max(1, Math.round(widthPx));
  const height = Math.max(1, Math.round(heightPx));
  const cleared = clearStudioNodeMeasuredBox(node);
  return {
    ...cleared,
    width,
    height,
    style: {
      ...(cleared.style ?? {}),
      width,
      height,
    },
  };
}

function clearStudioNodeMeasuredBox(node: StudioNode): StudioNode {
  const measured = node.measured;
  if (measured?.width == null && measured?.height == null) {
    return node;
  }
  if (measured == null) {
    return node;
  }
  const { width: _mw, height: _mh, ...measuredRest } = measured;
  const nextMeasured =
    Object.keys(measuredRest).length > 0 ? measuredRest : undefined;
  return { ...node, measured: nextMeasured };
}

function applyStudioNodeLayoutWidth(
  node: StudioNode,
  widthPx: number,
): StudioNode {
  const rounded = Math.max(1, Math.round(widthPx));
  const cleared = clearStudioNodeMeasuredBox(node);
  return {
    ...cleared,
    width: rounded,
    style: {
      ...(cleared.style ?? {}),
      width: rounded,
    },
  };
}

/** After chrome/UI patch: remeasure auto-sized nodes; keep manual RF size when resizable. */
function applyStudioNodeChromeLayoutSwitch(
  node: StudioNode,
  data: StudioNodeData,
): StudioNode {
  return prepareStudioNodeShellRemeasure({ ...node, data });
}

/** Keep React Flow node height aligned with utility collapse state (including after hydrate). */
function syncStudioUtilityNodeLayoutFromConfig(
  layoutNode: StudioNode,
  piped: StudioNodeData,
): StudioNode {
  if (piped.nodeId === "camera-view") {
    const dc = piped.defaultConfig as Record<string, unknown>;
    const expanded =
      typeof dc.cameraViewControlsExpanded === "boolean"
        ? dc.cameraViewControlsExpanded
        : true;
    if (!expanded) {
      return stripStudioNodeFixedHeight(layoutNode);
    }
    const saved = dc.cameraViewLayoutHeight;
    if (typeof saved === "number" && Number.isFinite(saved) && saved > 0) {
      return applyStudioNodeLayoutHeight(layoutNode, saved);
    }
    return layoutNode;
  }
  if (piped.nodeId === "environment") {
    const dc = piped.defaultConfig as Record<string, unknown>;
    const expanded =
      typeof dc.environmentControlsExpanded === "boolean"
        ? dc.environmentControlsExpanded
        : true;
    if (!expanded) {
      return stripStudioNodeFixedHeight(layoutNode);
    }
    const saved = dc.environmentLayoutHeight;
    if (typeof saved === "number" && Number.isFinite(saved) && saved > 0) {
      return applyStudioNodeLayoutHeight(layoutNode, saved);
    }
    return layoutNode;
  }
  return layoutNode;
}

function patchStudioUtilityNodeBodyExpanded(
  node: StudioNode,
  field: StudioUtilityBodyExpandedField,
  nextExpanded: boolean,
): StudioNode {
  const layoutHeightKey = STUDIO_UTILITY_BODY_EXPANDED_KEYS[field];
  const dc = { ...node.data.defaultConfig, [field]: nextExpanded };
  if (nextExpanded) {
    const saved = dc[layoutHeightKey];
    const savedPx =
      typeof saved === "number" && Number.isFinite(saved) && saved > 0
        ? Math.round(saved)
        : undefined;
    const nextNode =
      savedPx != null ? applyStudioNodeLayoutHeight(node, savedPx) : node;
    return {
      ...nextNode,
      data: {
        ...nextNode.data,
        defaultConfig: dc,
      },
    };
  }
  const currentHeight = readStudioNodeLayoutHeightPx(node);
  if (currentHeight != null) {
    dc[layoutHeightKey] = currentHeight;
  }
  const nextNode = stripStudioNodeFixedHeight(node);
  return {
    ...nextNode,
    data: {
      ...nextNode.data,
      defaultConfig: dc,
    },
  };
}

function createStudioNodeFromCatalogEntry(
  entry: NodeCatalogEntry,
  position: { x: number; y: number },
  options?: {
    ui?: StudioNodeData["ui"];
  },
): StudioNode {
  const id = `${entry.id}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const inferred = inferPortTypes(entry);
  const ui: StudioNodeData["ui"] = {
    allowBodyCollapse: studioNodeDefaultAllowBodyCollapse(entry.id),
    resizable: studioNodeDefaultResizable(entry.id),
    ...options?.ui,
  };
  const catalogFloor = resolveStudioNodeMinDimensionFloor(entry.id);
  const seedLayoutBox =
    ui.resizable === true || isStudioFlexPlotCanvasNodeId(entry.id);
  const initialHeight = seedLayoutBox
    ? resolveStudioNodeInitialLayoutHeight(entry.id, catalogFloor)
    : undefined;
  const base: StudioNode = {
    id,
    type: "studio",
    position,
    width: catalogFloor.minWidth,
    ...(seedLayoutBox && initialHeight != null
      ? {
          height: initialHeight,
          style: {
            width: catalogFloor.minWidth,
            height: initialHeight,
          },
        }
      : { style: { width: catalogFloor.minWidth } }),
    dragHandle: dragHandleSelectorForNodeId(entry.id),
    data: {
      label: entry.title,
      category: entry.category,
      nodeId: entry.id,
      defaultConfig:
        entry.id === "glb-animation-bundle"
          ? mergeLabDefaultsIntoGlbAnimationBundleConfig({
              ...entry.defaultConfig,
            })
          : { ...entry.defaultConfig },
      ui,
      inputType: inferred.inputType,
      outputType: inferred.outputType,
      outputHandles: inferred.outputHandles,
      inputHandles: inferred.inputHandles,
      liveValue: null,
      liveHistory: [],
      livePlotHistory: {},
    },
  };
  return attachConfigErrors([base], undefined)[0] ?? base;
}

function stripTransientStudioNodeData(data: StudioNodeData): StudioNodeData {
  return {
    label: data.label,
    category: data.category,
    nodeId: data.nodeId,
    defaultConfig: { ...data.defaultConfig },
    ui: data.ui != null ? { ...data.ui } : undefined,
    inputType: data.inputType,
    outputType: data.outputType,
    outputHandles: data.outputHandles?.map((h) => ({ ...h })),
    inputHandles: data.inputHandles?.map((h) => ({ ...h })),
    liveValue: null,
    liveHistory: [],
    livePlotHistory: {},
    configErrors: data.configErrors,
  };
}

function studioDupNodeId(): string {
  return `studio-dup-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneStudioNodeForDuplicate(
  source: StudioNode,
  newId: string,
  position: { x: number; y: number },
): StudioNode {
  const dragHandle = dragHandleSelectorForNodeId(source.data.nodeId);
  const base: StudioNode = {
    ...source,
    id: newId,
    position,
    selected: false,
    dragHandle,
    data: stripTransientStudioNodeData(source.data),
  };
  return attachConfigErrors([base], undefined)[0] ?? base;
}

function flowValueAsQuaternion(v: unknown): FlowWireQuaternion {
  if (v != null && typeof v === "object" && "w" in v && "x" in v) {
    const o = v as Record<string, unknown>;
    return {
      x: asFiniteNumber(o.x, 0),
      y: asFiniteNumber(o.y, 0),
      z: asFiniteNumber(o.z, 0),
      w: asFiniteNumber(o.w, 1),
    };
  }
  return { x: 0, y: 0, z: 0, w: 1 };
}

function flowValueAsEnvironment(v: unknown): FlowWireEnvironmentV1 | null {
  if (!isFlowWireEnvironmentV1(v)) {
    return null;
  }
  return coerceFlowWireEnvironmentV1(v);
}

function flowValueAsCamera(v: unknown): FlowWireCameraV1 | null {
  if (!isFlowWireCameraV1(v)) {
    return null;
  }
  return coerceFlowWireCameraV1(v);
}

function flowValueAsVideoBus(v: unknown): ReturnType<typeof makeFlowWireVideoBusV1> | null {
  return isFlowWireVideoBusV1(v) ? v : null;
}

function flowValueAsVideoTexture(v: unknown): FlowWireVideoTextureV1 | null {
  return isFlowWireVideoTextureV1(v) ? v : null;
}

function flowValueAsAnimation(v: unknown): FlowWireAnimationV1 | null {
  if (!isFlowWireAnimationV1(v)) {
    return null;
  }
  return coerceFlowWireAnimationV1(v);
}

function flowValueAsTransform(v: unknown): FlowWireTransformV1 | null {
  if (!isFlowWireTransformV1(v)) {
    return null;
  }
  return coerceFlowWireTransformV1(v);
}

function flowValueAsPhysicsScene(v: unknown): FlowWirePhysicsSceneV1 | null {
  if (!isFlowWirePhysicsSceneV1(v)) {
    return null;
  }
  return coerceFlowWirePhysicsSceneV1(v);
}

function flowValueAsFog(v: unknown): FlowWireFogV1 | null {
  if (!isFlowWireFogV1(v)) {
    return null;
  }
  return coerceFlowWireFogV1(v);
}

function flowValueAsStudioLight(v: unknown): FlowWireStudioLightV1 | null {
  if (!isFlowWireStudioLightV1(v)) {
    return null;
  }
  return coerceFlowWireStudioLightV1(v);
}

function flowValueAsPostProcessing(
  v: unknown,
): FlowWirePostProcessingV1 | null {
  if (!isFlowWirePostProcessingV1(v)) {
    return null;
  }
  return coerceFlowWirePostProcessingV1(v);
}

function flowValueAsContactShadows(
  v: unknown,
): FlowWireContactShadowsV1 | null {
  if (!isFlowWireContactShadowsV1(v)) {
    return null;
  }
  return coerceFlowWireContactShadowsV1(v);
}

function flowValueAsParticleEmitter(
  v: unknown,
): FlowWireParticleEmitterV1 | null {
  if (!isFlowWireParticleEmitterV1(v)) {
    return null;
  }
  return coerceFlowWireParticleEmitterV1(v);
}

function narrowNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  return null;
}

function applyIncomingSceneFxWires(
  base: StudioNodeData,
  nodeId: string,
  readIncomingForNode: (handle: string) => unknown,
): void {
  const exp = narrowNumber(readIncomingForNode(STUDIO_HANDLE_SETTINGS));
  if (exp != null) {
    base.liveSettingsExposure = exp;
  } else {
    delete base.liveSettingsExposure;
  }
  const fogWire = flowValueAsFog(readIncomingForNode(STUDIO_HANDLE_FOG));
  if (fogWire != null) {
    base.liveFogWire = fogWire;
  } else {
    delete base.liveFogWire;
  }
  const liteWire = flowValueAsStudioLight(
    readIncomingForNode(STUDIO_HANDLE_LITE),
  );
  if (liteWire != null) {
    base.liveStudioLightWire = liteWire;
  } else {
    delete base.liveStudioLightWire;
  }
  const postWire = flowValueAsPostProcessing(
    readIncomingForNode(STUDIO_HANDLE_POST),
  );
  if (postWire != null) {
    base.livePostProcessingWire = postWire;
  } else {
    delete base.livePostProcessingWire;
  }
  const cshadowWire = flowValueAsContactShadows(
    readIncomingForNode(STUDIO_HANDLE_CSHADOW),
  );
  if (cshadowWire != null) {
    base.liveContactShadowsWire = cshadowWire;
  } else {
    delete base.liveContactShadowsWire;
  }
  const emitterWire = flowValueAsParticleEmitter(
    readIncomingForNode(STUDIO_HANDLE_EMITTER),
  );
  if (emitterWire != null) {
    base.liveParticleEmitterWire = emitterWire;
  } else {
    delete base.liveParticleEmitterWire;
  }
}

type StudioSimulationPinValue =
  | number
  | boolean
  | string
  | FlowWireVec3
  | FlowWireQuaternion
  | FlowWireEnvironmentV1
  | FlowWireCameraV1
  | FlowWireAnimationV1
  | FlowWireTransformV1
  | null;

function readPinForEdgeTarget(
  edges: Edge[],
  targetNodeId: string,
  targetHandle: string,
  pinValues: Map<string, StudioSimulationPinValue>,
): StudioSimulationPinValue | null {
  const edge = edges.find(
    (e) =>
      e.target === targetNodeId &&
      (e.targetHandle ?? STUDIO_HANDLE_IN) === targetHandle,
  );
  if (edge == null) {
    return null;
  }
  const sh = edge.sourceHandle ?? STUDIO_HANDLE_OUT;
  return pinValues.get(studioFlowPinKey(edge.source, sh)) ?? null;
}

function hasLiveBmi270QuaternionFields(
  sample: BitstreamSensorSampleV2 | null,
): boolean {
  if (sample == null) {
    return false;
  }
  return (
    typeof sample.fusionQuatWBucketX10000 === "number" &&
    typeof sample.fusionQuatXX10000 === "number" &&
    typeof sample.fusionQuatYX10000 === "number" &&
    typeof sample.fusionQuatZX10000 === "number"
  );
}

function hasLiveBmi270EulerFields(
  sample: BitstreamSensorSampleV2 | null,
): boolean {
  if (sample == null) {
    return false;
  }
  return (
    typeof sample.fusionRollRadX100 === "number" &&
    typeof sample.fusionPitchRadX100 === "number" &&
    typeof sample.fusionHeadingRadX100 === "number"
  );
}

function hasLiveBmi270AccelFields(
  sample: BitstreamSensorSampleV2 | null,
): boolean {
  if (sample == null) {
    return false;
  }
  return (
    typeof sample.accelXMs2X100 === "number" &&
    typeof sample.accelYMs2X100 === "number" &&
    typeof sample.accelZMs2X100 === "number"
  );
}

function hasLiveBmi270GyroFields(
  sample: BitstreamSensorSampleV2 | null,
): boolean {
  if (sample == null) {
    return false;
  }
  return (
    typeof sample.gyroXRadSX100 === "number" &&
    typeof sample.gyroYRadSX100 === "number" &&
    typeof sample.gyroZRadSX100 === "number"
  );
}

function hasLiveBmi270TempFields(
  sample: BitstreamSensorSampleV2 | null,
): boolean {
  if (sample == null) {
    return false;
  }
  return (
    typeof sample.temperatureCx100 === "number" &&
    Number.isFinite(sample.temperatureCx100)
  );
}

function inferSensorHintFromNode(
  node: StudioNode,
): BitstreamSensorSourceHint | null {
  switch (node.data.nodeId) {
    case "bmi270-input":
    case "bmi270-tap-quaternion":
    case "bmi270-tap-euler":
    case "bmi270-tap-accel":
    case "bmi270-tap-gyro":
    case "bmi270-tap-temp":
    case "bmi270-tap-samples":
      return "bmi270";
    case "dps368-input":
    case "dps368-tap-pressure":
    case "dps368-tap-temp":
    case "dps368-tap-samples":
      return "dps368";
    case "sht40-input":
    case "sht40-tap-humidity":
    case "sht40-tap-temp":
    case "sht40-tap-samples":
      return "sht40";
    case "bmm350-input":
    case "bmm350-tap-magnetic":
    case "bmm350-tap-temp":
    case "bmm350-tap-samples":
      return "bmm350";
    case "sensor-input": {
      const sk = node.data.defaultConfig.sourceKey;
      return typeof sk === "string"
        ? inferSensorTelemetryHintFromSourceKey(sk)
        : null;
    }
    default:
      return null;
  }
}

function computeSensorHealthStatus(
  hardwareStreamLive: boolean,
  hint: BitstreamSensorSourceHint | null,
  lastAtByHint: Record<BitstreamSensorSourceHint, number | null>,
  /** Verified device rows keyed by firmware `sensor.cfg` `sourceId` (sparse). */
  deviceSensorCfgBySourceId: Partial<Record<number, DeviceSensorConfigRow>>,
): SensorHealthStatus {
  if (!hardwareStreamLive || hint == null) {
    return "sim";
  }
  const lastAt = lastAtByHint[hint];
  if (lastAt == null) {
    return "offline";
  }
  const sourceId = bitstreamSensorHintToSourceId(hint);
  const row =
    sourceId != null ? (deviceSensorCfgBySourceId[sourceId] ?? null) : null;
  const { liveMaxAgeMs, staleMaxAgeMs } = sensorHealthAgeThresholdsMs(row);
  const ageMs = Date.now() - lastAt;
  if (ageMs <= liveMaxAgeMs) {
    return "live";
  }
  if (ageMs <= staleMaxAgeMs) {
    return "stale";
  }
  return "offline";
}

function keepLastFiniteNumber(
  next: unknown,
  previous: number | undefined,
  fallback: number,
): number {
  if (typeof next === "number" && Number.isFinite(next)) {
    return next;
  }
  if (typeof previous === "number" && Number.isFinite(previous)) {
    return previous;
  }
  return fallback;
}

function invalidReasonForRequiredNumber(
  sample: BitstreamSensorSampleV2 | null,
  value: unknown,
  label: string,
): string | undefined {
  if (sample == null) {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return undefined;
  }
  return `${label} missing in live payload`;
}

function computeNodeInvalidReason(
  node: StudioNode,
  latestByHint: Record<
    BitstreamSensorSourceHint,
    BitstreamSensorSampleV2 | null
  >,
): string | undefined {
  switch (node.data.nodeId) {
    case "dps368-input":
    case "dps368-tap-pressure":
      return invalidReasonForRequiredNumber(
        latestByHint.dps368,
        latestByHint.dps368?.secondaryX100,
        "Pressure",
      );
    case "dps368-tap-temp":
      return invalidReasonForRequiredNumber(
        latestByHint.dps368,
        latestByHint.dps368?.temperatureCx100,
        "Temperature",
      );
    case "sht40-input":
    case "sht40-tap-humidity":
      return invalidReasonForRequiredNumber(
        latestByHint.sht40,
        latestByHint.sht40?.secondaryX100,
        "Humidity",
      );
    case "sht40-tap-temp":
      return invalidReasonForRequiredNumber(
        latestByHint.sht40,
        latestByHint.sht40?.temperatureCx100,
        "Temperature",
      );
    case "bmm350-input":
    case "bmm350-tap-magnetic": {
      const s = latestByHint.bmm350;
      if (s == null) {
        return undefined;
      }
      const hasMag =
        typeof s.magneticXUtX100 === "number" &&
        typeof s.magneticYUtX100 === "number" &&
        typeof s.magneticZUtX100 === "number";
      return hasMag ? undefined : "Magnetic vector missing in live payload";
    }
    case "bmm350-tap-temp":
      return invalidReasonForRequiredNumber(
        latestByHint.bmm350,
        latestByHint.bmm350?.temperatureCx100,
        "Temperature",
      );
    case "bmi270-tap-temp":
      return invalidReasonForRequiredNumber(
        latestByHint.bmi270,
        latestByHint.bmi270?.temperatureCx100,
        "Temperature",
      );
    default:
      return undefined;
  }
}

function mergeValidHandleTimestamp(
  previous: Record<string, string> | undefined,
  handle: string,
  isValid: boolean,
  nowIso: string,
): Record<string, string> | undefined {
  if (!isValid) {
    return previous;
  }
  return {
    ...(previous ?? {}),
    [handle]: nowIso,
  };
}

function scheduleGlbExtractAutoBindForNodes(
  get: () => FlowEditorState,
  set: (
    partial:
      | Partial<FlowEditorState>
      | ((state: FlowEditorState) => Partial<FlowEditorState>),
  ) => void,
  targetFlowNodeIds: readonly string[],
): void {
  if (targetFlowNodeIds.length === 0) {
    return;
  }
  const catalog = get().studioAssetDescriptors;
  void Promise.all([
    resolveSingleClipAutoBindPatchesForGlbAnimNodes({
      nodes: get().nodes,
      edges: get().edges,
      targetFlowNodeIds,
      catalog,
    }),
    resolvePartSpinAutoBindPatches({
      nodes: get().nodes,
      edges: get().edges,
      targetFlowNodeIds,
      catalog,
    }),
  ]).then(([animPatches, spinPatches]) => {
    if (animPatches.size === 0 && spinPatches.size === 0) {
      return;
    }
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) => {
          const patch = animPatches.get(node.id) ?? spinPatches.get(node.id);
          if (patch == null) {
            return node;
          }
          return {
            ...node,
            data: {
              ...node.data,
              defaultConfig: {
                ...node.data.defaultConfig,
                ...patch,
              },
            },
          };
        }),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
  });
}

function dispatchFlowEventSourcesWithGlbAnimAutoBind(
  get: () => FlowEditorState,
  set: (
    partial:
      | Partial<FlowEditorState>
      | ((state: FlowEditorState) => Partial<FlowEditorState>),
  ) => void,
  sourceNodeIds: readonly string[],
): void {
  const { nodes, edges } = get();
  const targetIds: string[] = [];
  for (const sourceId of sourceNodeIds) {
    targetIds.push(...collectFlowEventTargetNodeIds(edges, sourceId));
  }
  const nextNodes = runFlowEventDispatch({ nodes, edges, sourceNodeIds });
  set((state) => ({
    nodes: attachConfigErrorsWithModelChildRegistry(nextNodes, state.edges),
  }));
  get().tickSimulation();
  scheduleGlbExtractAutoBindForNodes(get, set, targetIds);
}

function dispatchFlowEventSourcesFromHandle(
  get: () => FlowEditorState,
  set: (
    partial:
      | Partial<FlowEditorState>
      | ((state: FlowEditorState) => Partial<FlowEditorState>),
  ) => void,
  sourceNodeIds: readonly string[],
  sourceHandle: string,
): void {
  if (sourceNodeIds.length === 0) {
    return;
  }
  const { nodes, edges } = get();
  const targetIds: string[] = [];
  for (const sourceId of sourceNodeIds) {
    targetIds.push(...collectFlowEventTargetNodeIds(edges, sourceId, sourceHandle));
  }
  if (targetIds.length === 0) {
    return;
  }
  const nextNodes = runFlowEventDispatch({ nodes, edges, sourceNodeIds, sourceHandle });
  set((state) => ({
    nodes: attachConfigErrorsWithModelChildRegistry(nextNodes, state.edges),
  }));
  scheduleGlbExtractAutoBindForNodes(get, set, targetIds);
}

function applyConfigFieldPatch(
  base: Record<string, unknown>,
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...base };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return next;
}

export const useFlowEditorStore = create<FlowEditorState>((set, get) => ({
  nodes: [],
  edges: [],
  ...initialSubgraphStoreSlice(),
  selectedNodeId: null,
  selectedNodeIds: [],
  undoStack: [],
  redoStack: [],
  studioAssetDescriptors: [],
  setStudioAssetDescriptors: (descriptors) => {
    set({ studioAssetDescriptors: descriptors });
  },
  nodeGroupLibrary: readPersistedNodeGroupLibrary(),
  flowPresetLibrary: readPersistedFlowPresetLibrary(),
  remoteNodeGraphAssets: {},
  pushUndoSnapshot: () => {
    const st = get();
    const snap = cloneFlowSnapshot({
      nodes: st.nodes,
      edges: st.edges,
      selectedNodeId: st.selectedNodeId,
      selectedNodeIds: st.selectedNodeIds,
      subgraphs: st.subgraphs,
      activeGraphId: st.activeGraphId,
      graphStack: st.graphStack,
      rootNodes: st.rootNodes,
      rootEdges: st.rootEdges,
    });
    set((s) => ({
      undoStack: [...s.undoStack, snap].slice(-MAX_UNDO),
      redoStack: [],
    }));
  },
  undo: () => {
    const st = get();
    if (st.undoStack.length === 0) {
      return;
    }
    const prev = st.undoStack[st.undoStack.length - 1];
    const cur = cloneFlowSnapshot({
      nodes: st.nodes,
      edges: st.edges,
      selectedNodeId: st.selectedNodeId,
      selectedNodeIds: st.selectedNodeIds,
      subgraphs: st.subgraphs,
      activeGraphId: st.activeGraphId,
      graphStack: st.graphStack,
      rootNodes: st.rootNodes,
      rootEdges: st.rootEdges,
    });
    const prevSel = normalizeFlowSnapshotSelection(prev);
    set({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(prev.nodes, prevSel.selectedNodeIds),
        prev.edges,
      ),
      edges: prev.edges,
      selectedNodeId: prevSel.selectedNodeId,
      selectedNodeIds: prevSel.selectedNodeIds,
      subgraphs: prev.subgraphs ?? st.subgraphs,
      activeGraphId: prev.activeGraphId ?? STUDIO_ROOT_GRAPH_ID,
      graphStack: prev.graphStack ?? [],
      rootNodes: prev.rootNodes ?? prev.nodes,
      rootEdges: prev.rootEdges ?? prev.edges,
      undoStack: st.undoStack.slice(0, -1),
      redoStack: [cur, ...st.redoStack].slice(0, MAX_UNDO),
    });
    flushFlowSimulationPins(get);
  },
  redo: () => {
    const st = get();
    if (st.redoStack.length === 0) {
      return;
    }
    const next = st.redoStack[0];
    const cur = cloneFlowSnapshot({
      nodes: st.nodes,
      edges: st.edges,
      selectedNodeId: st.selectedNodeId,
      selectedNodeIds: st.selectedNodeIds,
      subgraphs: st.subgraphs,
      activeGraphId: st.activeGraphId,
      graphStack: st.graphStack,
      rootNodes: st.rootNodes,
      rootEdges: st.rootEdges,
    });
    const nextSel = normalizeFlowSnapshotSelection(next);
    set({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(next.nodes, nextSel.selectedNodeIds),
        next.edges,
      ),
      edges: next.edges,
      selectedNodeId: nextSel.selectedNodeId,
      selectedNodeIds: nextSel.selectedNodeIds,
      subgraphs: next.subgraphs ?? st.subgraphs,
      activeGraphId: next.activeGraphId ?? STUDIO_ROOT_GRAPH_ID,
      graphStack: next.graphStack ?? [],
      rootNodes: next.rootNodes ?? next.nodes,
      rootEdges: next.rootEdges ?? next.edges,
      undoStack: [...st.undoStack, cur].slice(-MAX_UNDO),
      redoStack: st.redoStack.slice(1),
    });
    flushFlowSimulationPins(get);
  },
  hydrateFlowDocument: (snapshot) => {
    const migrateStudioFlowNode = (n: StudioNode) =>
      refreshCatalogOutputHandles(migrateFlowNodeFromLegacy(n));
    const nodesRaw = (snapshot.nodes as StudioNode[]).map(migrateStudioFlowNode);
    const sel = normalizeFlowSnapshotSelection(snapshot);
    const rootNodes = (
      snapshot.rootNodes != null
        ? (snapshot.rootNodes as StudioNode[])
        : (snapshot.nodes as StudioNode[])
    ).map(migrateStudioFlowNode) as FlowGraphNode[];
    const subgraphs = repairOrphanedNodeGroupSubgraphs(
      snapshot.subgraphs ?? {},
      rootNodes,
    );
    const rootEdges = snapshot.rootEdges ?? snapshot.edges;
    const canvasView = resolveRootCanvasViewOnHydrate({ rootNodes, rootEdges });
    set({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(canvasView.nodes, sel.selectedNodeIds),
        canvasView.edges,
      ),
      edges: canvasView.edges,
      selectedNodeId: sel.selectedNodeId,
      selectedNodeIds: sel.selectedNodeIds,
      subgraphs,
      activeGraphId: canvasView.activeGraphId,
      graphStack: canvasView.graphStack,
      rootNodes,
      rootEdges,
      undoStack: [],
      redoStack: [],
    });
    flushFlowSimulationPins(get);
  },
  exportFlowGraphJson: (options) => {
    const st = persistActiveGraphBuffer(get());
    const exportNodes =
      st.activeGraphId === STUDIO_ROOT_GRAPH_ID ? st.nodes : st.rootNodes;
    const exportEdges =
      st.activeGraphId === STUDIO_ROOT_GRAPH_ID ? st.edges : st.rootEdges;
    const viewportArg = options?.viewport;
    const viewportPayload =
      viewportArg != null && isValidStudioPersistedViewport(viewportArg)
        ? viewportArg
        : undefined;
    const canvasPreferences = options?.canvasPreferences;
    const workbenchLayout = options?.workbenchLayout;
    return JSON.stringify(
      {
        version: 1 as const,
        updatedAt: new Date().toISOString(),
        nodes: exportNodes,
        edges: exportEdges,
        selectedNodeId: st.selectedNodeId,
        selectedNodeIds: st.selectedNodeIds,
        ...(Object.keys(st.subgraphs).length > 0
          ? { subgraphs: st.subgraphs }
          : {}),
        ...(st.activeGraphId !== STUDIO_ROOT_GRAPH_ID
          ? { activeGraphId: st.activeGraphId }
          : {}),
        ...(st.graphStack.length > 0 ? { graphStack: st.graphStack } : {}),
        ...(st.rootNodes.length > 0
          ? { rootNodes: st.rootNodes, rootEdges: st.rootEdges }
          : {}),
        ...(viewportPayload != null ? { viewport: viewportPayload } : {}),
        ...(canvasPreferences != null ? { canvasPreferences } : {}),
        ...(workbenchLayout != null ? { workbenchLayout } : {}),
      },
      null,
      2,
    );
  },
  importFlowGraphJson: (json) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return { ok: false, message: "Invalid JSON." };
    }
    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, message: "Flow document must be an object." };
    }
    const o = parsed as Record<string, unknown>;
    if (o.version !== 1) {
      return { ok: false, message: "Flow document version must be 1." };
    }
    if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) {
      return {
        ok: false,
        message: "Flow document must include nodes and edges arrays.",
      };
    }
    const sel = o.selectedNodeId;
    const selectedNodeId =
      typeof sel === "string"
        ? sel
        : sel === null || sel === undefined
          ? null
          : null;
    const rawMulti = o.selectedNodeIds;
    const selectedNodeIdsFromFile = Array.isArray(rawMulti)
      ? rawMulti.filter(
          (x): x is string => typeof x === "string" && x.length > 0,
        )
      : undefined;
    const selection = normalizeFlowSnapshotSelection({
      selectedNodeId,
      selectedNodeIds: selectedNodeIdsFromFile,
    });
    get().pushUndoSnapshot();
    const migratedNodes = (o.nodes as StudioNode[]).map((n) =>
      refreshCatalogOutputHandles(migrateFlowNodeFromLegacy(n)),
    );
    const migratedEdges = migrateStudioEdgesMapRange(
      migratedNodes,
      migrateStudioEdgesFusionQuat(o.edges as Edge[]),
    );
    const vpRaw = o.viewport;
    const viewport =
      vpRaw != null && isValidStudioPersistedViewport(vpRaw)
        ? vpRaw
        : undefined;
    const canvasPreferences =
      o.canvasPreferences != null
        ? coerceFlowCanvasPreferences(o.canvasPreferences)
        : undefined;
    const workbenchLayout = coerceWorkbenchFlowAttachment(o.workbenchLayout);
    const subgraphsRaw = o.subgraphs;
    const subgraphsParsed =
      subgraphsRaw != null &&
      typeof subgraphsRaw === "object" &&
      !Array.isArray(subgraphsRaw)
        ? (subgraphsRaw as Record<string, StudioSubgraphDocument>)
        : {};
    const rootNodesRaw = o.rootNodes;
    const rootNodesForImport = Array.isArray(rootNodesRaw)
      ? (rootNodesRaw as FlowGraphNode[])
      : (migratedNodes as FlowGraphNode[]);
    const subgraphs = repairOrphanedNodeGroupSubgraphs(
      subgraphsParsed,
      rootNodesForImport,
    );
    const activeGraphId =
      typeof o.activeGraphId === "string"
        ? (o.activeGraphId as StudioGraphId)
        : STUDIO_ROOT_GRAPH_ID;
    const graphStack = Array.isArray(o.graphStack)
      ? o.graphStack.filter((x): x is StudioGraphId => typeof x === "string")
      : [];
    const rootEdgesRaw = o.rootEdges;
    const rootNodes = (
      Array.isArray(rootNodesRaw)
        ? (rootNodesRaw as StudioNode[]).map((n) =>
            refreshCatalogOutputHandles(migrateFlowNodeFromLegacy(n)),
          )
        : migratedNodes
    ) as FlowGraphNode[];
    const rootEdges = Array.isArray(rootEdgesRaw)
      ? (rootEdgesRaw as Edge[])
      : migratedEdges;
    const canvasView = resolveSubgraphCanvasViewOnRestore({
      rootNodes,
      rootEdges,
      subgraphs,
      activeGraphId,
      graphStack,
    });
    set({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(
          canvasView.nodes.map((n) => ({ ...n, selected: false })),
          selection.selectedNodeIds,
        ),
        canvasView.edges,
      ),
      edges: canvasView.edges,
      selectedNodeId: selection.selectedNodeId,
      selectedNodeIds: selection.selectedNodeIds,
      subgraphs,
      activeGraphId: canvasView.activeGraphId,
      graphStack: canvasView.graphStack,
      rootNodes,
      rootEdges,
      redoStack: [],
    });
    flushFlowSimulationPins(get);
    if (
      viewport != null ||
      canvasPreferences != null ||
      workbenchLayout != null
    ) {
      return {
        ok: true,
        ...(viewport != null ? { viewport } : {}),
        ...(canvasPreferences != null ? { canvasPreferences } : {}),
        ...(workbenchLayout != null ? { workbenchLayout } : {}),
      };
    }
    return { ok: true };
  },
  duplicateSelection: () => {
    const st = get();
    const fromRfSelection = st.nodes.filter((n) => n.selected).map((n) => n.id);
    const sourceIds =
      fromRfSelection.length > 0
        ? fromRfSelection
        : st.selectedNodeId != null
          ? [st.selectedNodeId]
          : [];
    if (sourceIds.length === 0) {
      return;
    }
    const OFFSET = 36;
    const idMap = new Map<string, string>();
    for (const id of sourceIds) {
      idMap.set(id, studioDupNodeId());
    }
    const sourceSet = new Set(sourceIds);
    const oldNodes = st.nodes.filter((n) => sourceSet.has(n.id));
    const newNodesRaw: FlowGraphNode[] = oldNodes.map((n) => {
      const newId = idMap.get(n.id) ?? studioDupNodeId();
      const position = { x: n.position.x + OFFSET, y: n.position.y + OFFSET };
      if (isStudioFlowNode(n)) {
        return cloneStudioNodeForDuplicate(n, newId, position);
      }
      return {
        ...n,
        id: newId,
        position,
        selected: true,
        data: { ...n.data },
      };
    });
    const newNodes = remapSourceModelNodeIdAfterDuplicate(
      newNodesRaw as StudioNode[],
      idMap,
    );
    const { nodes: dupNodesWithSubs, subgraphs: dupSubgraphs } =
      attachSubgraphsForPastedNodeGroups(
        newNodes as FlowGraphNode[],
        st.subgraphs,
        undefined,
        idMap,
      );
    for (const nn of dupNodesWithSubs) {
      nn.selected = true;
    }
    const dupEdges: Edge[] = [];
    for (const e of st.edges) {
      if (!sourceSet.has(e.source) || !sourceSet.has(e.target)) {
        continue;
      }
      const srcNew = idMap.get(e.source);
      const tgtNew = idMap.get(e.target);
      if (srcNew == null || tgtNew == null) {
        continue;
      }
      const srcHandle = e.sourceHandle ?? STUDIO_HANDLE_OUT;
      const sourceStub =
        dupNodesWithSubs.find((n) => n.id === srcNew) ??
        st.nodes.find((n) => n.id === e.source);
      const label =
        sourceStub != null
          ? edgeLabelForSource(sourceStub, srcHandle, dupSubgraphs)
          : "";
      dupEdges.push({
        ...e,
        id: `studio-edge-${studioDupNodeId()}`,
        source: srcNew,
        target: tgtNew,
        sourceHandle: e.sourceHandle ?? STUDIO_HANDLE_OUT,
        targetHandle: e.targetHandle ?? STUDIO_HANDLE_IN,
        animated: true,
        label,
        style: { ...(e.style ?? {}), strokeWidth: 2 },
      });
    }
    get().pushUndoSnapshot();
    const mergedNodes = [
      ...st.nodes.map((n) => ({ ...n, selected: false })),
      ...dupNodesWithSubs,
    ];
    const dupIds = dupNodesWithSubs.map((n) => n.id);
    const mergedEdges = [...st.edges, ...dupEdges];
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(
      mergedNodes,
      mergedEdges,
    );
    const committed = commitActiveGraphMutation(
      { ...st, subgraphs: dupSubgraphs },
      attachedNodes,
      mergedEdges,
    );
    set({
      ...committed,
      nodes: attachedNodes,
      edges: mergedEdges,
      ...selectionFromIds(dupIds),
    });
    flushFlowSimulationPins(get);
  },
  copyFlowSelectionToClipboard: async () => {
    const st = get();
    if (st.nodes.length === 0) {
      return false;
    }
    const payload = buildFlowClipboardPayload(st.nodes, st.edges, st.subgraphs);
    if (payload.nodes.length === 0) {
      return false;
    }
    return writeClipboardText(serializeFlowClipboard(payload));
  },
  pasteFlowFromClipboard: async () => {
    const text = await readClipboardText();
    if (text == null) {
      return { ok: false, message: "Clipboard is empty or unavailable." };
    }

    const importPayload = parseFlowImportPayload(text);
    if (importPayload?.kind === "node-asset") {
      get().instantiateNodeAssetAt(importPayload.asset, { x: 96, y: 96 });
      return { ok: true };
    }
    if (importPayload?.kind === "flow-preset") {
      return { ok: false, pendingFlowPreset: importPayload.preset };
    }
    if (importPayload?.kind === "raw-flow-document") {
      return { ok: false, pendingRawFlowDocument: importPayload.text };
    }

    const payload =
      importPayload?.kind === "flow-clipboard"
        ? parseFlowClipboard(text)
        : parseFlowClipboard(text);
    if (payload == null || payload.nodes.length === 0) {
      return {
        ok: false,
        message: "Clipboard does not contain a Sensor Studio flow selection.",
      };
    }
    const st = get();
    get().pushUndoSnapshot();
    const {
      nodes: pastedRaw,
      edges: pastedEdgesRaw,
      idMap,
    } = remapFlowPaste(payload);
    const pastedNodesRaw: FlowGraphNode[] = pastedRaw.map((n) => {
      if (isStudioFlowNode(n)) {
        const migrated = refreshCatalogOutputHandles(
          migrateFlowNodeFromLegacy(n as StudioNode),
        );
        return {
          ...migrated,
          selected: true,
          dragHandle: dragHandleSelectorForNodeId(migrated.data.nodeId),
          data: stripTransientStudioNodeData(migrated.data),
        };
      }
      return { ...n, selected: true };
    });
    const pastedNodes = remapSourceModelNodeIdAfterDuplicate(
      pastedNodesRaw as StudioNode[],
      idMap,
    ) as FlowGraphNode[];
    const { nodes: pastedWithGroups, subgraphs: mergedSubgraphs } =
      attachSubgraphsForPastedNodeGroups(
        pastedNodes,
        st.subgraphs,
        payload.subgraphs,
        idMap,
      );
    for (const nn of pastedWithGroups) {
      nn.selected = true;
    }
    const pastedEdges: Edge[] = pastedEdgesRaw.map((e) => {
      const srcHandle = e.sourceHandle ?? STUDIO_HANDLE_OUT;
      const sourceStub = pastedWithGroups.find((n) => n.id === e.source);
      const label =
        sourceStub != null
          ? edgeLabelForSource(sourceStub, srcHandle, mergedSubgraphs)
          : "";
      return {
        ...e,
        animated: true,
        label,
        style: { ...(e.style ?? {}), strokeWidth: 2 },
      };
    });
    const mergedNodes = [
      ...st.nodes.map((n) => ({ ...n, selected: false })),
      ...pastedWithGroups,
    ];
    const pastedIds = pastedWithGroups.map((n) => n.id);
    const mergedEdges = [...st.edges, ...pastedEdges];
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(
      mergedNodes,
      mergedEdges,
    );
    const committed = commitActiveGraphMutation(
      { ...st, subgraphs: mergedSubgraphs },
      attachedNodes,
      mergedEdges,
    );
    set({
      ...committed,
      nodes: attachedNodes,
      edges: mergedEdges,
      ...selectionFromIds(pastedIds),
    });
    flushFlowSimulationPins(get);
    return { ok: true };
  },
  createGroupFromSelection: () => {
    const s = get();
    const selected = s.nodes.filter(
      (n) => n.selected && !isExcludedFromNodeGroup(n),
    );
    if (selected.length < 1) {
      return;
    }
    get().pushUndoSnapshot();
    const groupId = `group_${Date.now()}`;
    const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
      groupId,
      selected,
      s.edges,
      s.nodes,
      s.subgraphs,
    );
    const selectedIds = new Set(selected.map((n) => n.id));
    const { nodes: parentNodes, edges: parentEdges } =
      rewireParentGraphForStudioGroup(
        s.nodes,
        s.edges,
        groupNode,
        selectedIds,
        subgraph.interface,
        s.subgraphs,
      );
    const nextSubgraphs = { ...s.subgraphs, [groupId]: subgraph };
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(
      parentNodes as FlowGraphNode[],
      parentEdges,
    );

    if (s.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
      set({
        nodes: attachedNodes,
        edges: parentEdges,
        rootNodes: attachedNodes,
        rootEdges: parentEdges,
        subgraphs: nextSubgraphs,
        ...selectionFromIds([groupId]),
      });
    } else {
      const parentSub = s.subgraphs[s.activeGraphId];
      set({
        nodes: attachedNodes,
        edges: parentEdges,
        subgraphs: {
          ...nextSubgraphs,
          [s.activeGraphId]: {
            ...parentSub,
            nodes: parentNodes,
            edges: parentEdges,
            interface: parentSub?.interface ?? { inputs: [], outputs: [] },
          },
        },
        ...selectionFromIds([groupId]),
      });
    }
    flushFlowSimulationPins(get);
  },
  ungroupSelection: () => {
    const s = get();
    const selectedGroups = s.nodes.filter(
      (n) => n.selected && isStudioNodeGroupNode(n),
    );
    if (selectedGroups.length !== 1) {
      return;
    }
    get().pushUndoSnapshot();
    const groupNode = selectedGroups[0]!;
    const rootNodesForCount =
      s.activeGraphId === STUDIO_ROOT_GRAPH_ID ? s.nodes : s.rootNodes;
    const result = dissolveStudioNodeGroupInParent(
      s.nodes,
      s.edges,
      groupNode,
      s.subgraphs,
      rootNodesForCount,
    );
    if (result == null) {
      return;
    }
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(
      result.nodes as FlowGraphNode[],
      result.edges,
    );
    const expandedIds = result.nodes.filter((n) => n.selected).map((n) => n.id);
    const committed = commitActiveGraphMutation(
      { ...s, subgraphs: result.subgraphs },
      attachedNodes,
      result.edges,
    );
    set({
      ...committed,
      nodes: attachedNodes,
      edges: result.edges,
      ...selectionFromIds(expandedIds),
    });
    flushFlowSimulationPins(get);
  },
  enterGroup: (groupId: string) => {
    let s = get();
    const rootNodesForRepair =
      s.rootNodes.length > 0 ? s.rootNodes : s.nodes;
    const repairedSubgraphs = repairOrphanedNodeGroupSubgraphs(
      s.subgraphs,
      rootNodesForRepair,
    );
    if (repairedSubgraphs !== s.subgraphs) {
      set({ subgraphs: repairedSubgraphs });
      s = get();
    }
    const sub = s.subgraphs[groupId];
    if (sub == null) {
      return;
    }
    if (s.activeGraphId === groupId) {
      return;
    }
    get().pushUndoSnapshot();
    const persisted = persistActiveGraphBuffer(s);
    const nextStack =
      persisted.activeGraphId === STUDIO_ROOT_GRAPH_ID
        ? [STUDIO_ROOT_GRAPH_ID, groupId]
        : persisted.graphStack[persisted.graphStack.length - 1] === groupId
          ? persisted.graphStack
          : [...persisted.graphStack, groupId];
    set({
      ...persisted,
      activeGraphId: groupId,
      graphStack: nextStack,
      nodes: attachConfigErrorsWithModelChildRegistry(
        (sub.nodes as FlowGraphNode[]).map((node) =>
          applyStudioGroupBoundaryNodeChrome(node),
        ),
        sub.edges,
      ),
      edges: sub.edges,
      selectedNodeId: null,
      selectedNodeIds: [],
    });
  },
  exitGroup: () => {
    const s = get();
    if (s.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
      return;
    }
    get().pushUndoSnapshot();
    const persisted = persistActiveGraphBuffer(s);
    const stack = [...persisted.graphStack];
    stack.pop();
    const parentId = stack[stack.length - 1] ?? STUDIO_ROOT_GRAPH_ID;
    let nodes: FlowGraphNode[];
    let edges: Edge[];
    if (parentId === STUDIO_ROOT_GRAPH_ID) {
      nodes = persisted.rootNodes;
      edges = persisted.rootEdges;
    } else {
      const parentSub = persisted.subgraphs[parentId];
      nodes = (parentSub?.nodes as FlowGraphNode[]) ?? [];
      edges = parentSub?.edges ?? [];
    }
    set({
      ...persisted,
      activeGraphId: parentId,
      graphStack: stack,
      nodes: attachConfigErrorsWithModelChildRegistry(nodes, edges),
      edges,
      selectedNodeId: null,
      selectedNodeIds: [],
    });
  },
  updateNodeGroupInterface: (hostNodeId, nextInterface) => {
    get().pushUndoSnapshot();
    const patch = applyNodeGroupInterfaceToState(get(), hostNodeId, nextInterface);
    if (patch == null) {
      return;
    }
    set(patch);
    flushFlowSimulationPins(get);
  },
  syncGroupInterfaceFromWires: (hostNodeId) => {
    const s = get();
    const host =
      s.rootNodes.find(
        (n) => n.id === hostNodeId && isStudioNodeGroupNode(n),
      ) ?? s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
    if (host == null) {
      return;
    }
    const subgraphId = host.data.subgraphId ?? hostNodeId;
    const subgraph = s.subgraphs[subgraphId];
    if (subgraph == null) {
      return;
    }
    const nextInterface = syncGroupInterfaceFromHostWires({
      hostNodeId,
      rootNodes: s.rootNodes,
      rootEdges: s.rootEdges,
      subgraph,
      subgraphs: s.subgraphs,
    });
    get().pushUndoSnapshot();
    const patch = applyNodeGroupInterfaceToState(s, hostNodeId, nextInterface);
    if (patch == null) {
      return;
    }
    set(patch);
    flushFlowSimulationPins(get);
  },
  updateNodeGroupTitle: (hostNodeId, title) => {
    const s = get();
    const host =
      s.rootNodes.find(
        (n) => n.id === hostNodeId && isStudioNodeGroupNode(n),
      ) ?? s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
    if (host == null) {
      return;
    }
    const subgraphId = host.data.subgraphId ?? hostNodeId;
    const subgraph = s.subgraphs[subgraphId];
    if (subgraph == null) {
      return;
    }

    get().pushUndoSnapshot();
    const trimmed = title.trim();
    const graphTitle = trimmed.length > 0 ? trimmed : undefined;
    const patchHostTitle = (nodes: FlowGraphNode[]) =>
      nodes.map((node) =>
        node.id === hostNodeId && isStudioNodeGroupNode(node)
          ? { ...node, data: { ...node.data, graphTitle } }
          : node,
      );

    set({
      nodes: patchHostTitle(s.nodes),
      rootNodes: patchHostTitle(s.rootNodes),
      subgraphs: {
        ...s.subgraphs,
        [subgraphId]: {
          ...subgraph,
          graphTitle,
        },
      },
    });
  },
  ungroupNodeGroup: (hostNodeId) => {
    const initial = persistActiveGraphBuffer(get());
    const host =
      initial.rootNodes.find(
        (n) => n.id === hostNodeId && isStudioNodeGroupNode(n),
      ) ??
      initial.nodes.find(
        (n) => n.id === hostNodeId && isStudioNodeGroupNode(n),
      );
    if (host == null) {
      return;
    }

    get().pushUndoSnapshot();

    let s = initial;
    if (s.activeGraphId !== STUDIO_ROOT_GRAPH_ID) {
      s = {
        ...s,
        activeGraphId: STUDIO_ROOT_GRAPH_ID,
        graphStack: [],
        nodes: s.rootNodes,
        edges: s.rootEdges,
      };
    }

    const groupNode = s.nodes.find(
      (n) => n.id === hostNodeId && isStudioNodeGroupNode(n),
    );
    if (groupNode == null) {
      return;
    }

    const rootNodesForCount = s.rootNodes.length > 0 ? s.rootNodes : s.nodes;
    const result = dissolveStudioNodeGroupInParent(
      s.nodes,
      s.edges,
      groupNode,
      s.subgraphs,
      rootNodesForCount,
    );
    if (result == null) {
      return;
    }

    const attachedNodes = attachConfigErrorsWithModelChildRegistry(
      result.nodes as FlowGraphNode[],
      result.edges,
    );
    const expandedIds = result.nodes.filter((n) => n.selected).map((n) => n.id);
    const committed = commitActiveGraphMutation(
      { ...s, subgraphs: result.subgraphs },
      attachedNodes,
      result.edges,
    );
    set({
      ...committed,
      activeGraphId: STUDIO_ROOT_GRAPH_ID,
      graphStack: [],
      nodes: attachedNodes,
      edges: result.edges,
      rootNodes: attachedNodes,
      rootEdges: result.edges,
      ...selectionFromIds(expandedIds),
    });
    flushFlowSimulationPins(get);
  },
  duplicateGroupLinked: (hostNodeId) => {
    const s = persistActiveGraphBuffer(get());
    const source =
      s.rootNodes.find(
        (n) => n.id === hostNodeId && isStudioNodeGroupNode(n),
      ) ?? s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
    if (source == null) {
      return;
    }
    const result = duplicateStudioGroupLinked(source, s.subgraphs);
    if (result == null) {
      return;
    }
    get().pushUndoSnapshot();
    applyGroupHostDuplicateToStore(set, s, result);
  },
  duplicateGroupDeepCopy: (hostNodeId) => {
    const s = persistActiveGraphBuffer(get());
    const source =
      s.rootNodes.find(
        (n) => n.id === hostNodeId && isStudioNodeGroupNode(n),
      ) ?? s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
    if (source == null) {
      return;
    }
    const result = duplicateStudioGroupDeepCopy(source, s.subgraphs);
    if (result == null) {
      return;
    }
    get().pushUndoSnapshot();
    applyGroupHostDuplicateToStore(set, s, result);
  },
  saveGroupToNodeLibrary: (hostNodeId, name) => {
    const s = persistActiveGraphBuffer(get());
    const hostCtx = findStudioNodeGroupHost(hostNodeId, s);
    if (hostCtx == null) {
      return null;
    }
    const asset = buildStudioNodeAssetFromGroup(
      hostNodeId,
      hostCtx.parentNodes,
      hostCtx.parentEdges,
      s.subgraphs,
      name != null ? { name } : undefined,
    );
    if (asset == null) {
      return null;
    }
    const { library, result } = upsertStudioLibraryPreset(
      get().nodeGroupLibrary,
      asset,
      {
        sourceNodeId: hostNodeId,
        presetKind: "nodeGraph",
      },
    );
    writePersistedNodeGroupLibrary(library);

    const patchHost = (nodes: FlowGraphNode[]) =>
      nodes.map((n) =>
        n.id === hostNodeId && isStudioNodeGroupNode(n)
          ? {
              ...n,
              data: {
                ...n.data,
                libraryAssetId: result.id,
              },
            }
          : n,
      );

    set({
      nodeGroupLibrary: library,
      rootNodes: patchHost(s.rootNodes),
      nodes:
        s.activeGraphId === STUDIO_ROOT_GRAPH_ID ? patchHost(s.nodes) : s.nodes,
    });
    return result;
  },
  removeNodeAssetFromLibrary: (assetId) => {
    const next = get().nodeGroupLibrary.filter((a) => a.meta.id !== assetId);
    writePersistedNodeGroupLibrary(next);
    set({ nodeGroupLibrary: next });
  },
  registerRemoteNodeGraphAsset: (asset) => {
    set((state) => ({
      remoteNodeGraphAssets: {
        ...state.remoteNodeGraphAssets,
        [asset.meta.id]: asset,
      },
    }));
  },
  clearRemoteNodeGraphAssets: () => {
    set({ remoteNodeGraphAssets: {} });
  },
  resolveNodeGroupAsset: (assetId) => {
    const st = get();
    return (
      st.nodeGroupLibrary.find((a) => a.meta.id === assetId) ??
      st.remoteNodeGraphAssets[assetId]
    );
  },
  updateGroupFromLibrary: (hostNodeId) => {
    const s = persistActiveGraphBuffer(get());
    const hostCtx = findStudioNodeGroupHost(hostNodeId, s);
    if (hostCtx == null) {
      return false;
    }
    const data = hostCtx.host.data;
    const asset =
      (typeof data.libraryAssetId === "string"
        ? (get().nodeGroupLibrary.find(
            (a) => a.meta.id === data.libraryAssetId,
          ) ?? get().remoteNodeGraphAssets[data.libraryAssetId])
        : undefined) ??
      findLinkedStudioLibraryPreset(get().nodeGroupLibrary, {
        sourceNodeId: hostNodeId,
        presetKind: "nodeGraph",
      });
    if (asset == null) {
      return false;
    }
    return get().importNodeAssetIntoGroup(hostNodeId, asset);
  },
  breakGroupLibraryLink: (hostNodeId) => {
    const patchHost = (nodes: FlowGraphNode[]) =>
      nodes.map((n) =>
        n.id === hostNodeId && isStudioNodeGroupNode(n)
          ? {
              ...n,
              data: {
                ...n.data,
                libraryAssetId: undefined,
              },
            }
          : n,
      );
    const s = get();
    set({
      rootNodes: patchHost(s.rootNodes),
      nodes: patchHost(s.nodes),
    });
  },
  importNodeAssetToLibrary: (asset) => {
    const keyed = rekeyStudioNodeAssetMeta(asset);
    const next = [...get().nodeGroupLibrary, keyed];
    writePersistedNodeGroupLibrary(next);
    set({ nodeGroupLibrary: next });
    return keyed.meta.id;
  },
  exportNodeAssetById: (assetId) => {
    const asset = get().nodeGroupLibrary.find((a) => a.meta.id === assetId);
    if (asset == null) {
      return false;
    }
    downloadStudioNodeAssetFile(asset);
    return true;
  },
  exportGroupAsNodeAssetFile: (hostNodeId) => {
    const s = persistActiveGraphBuffer(get());
    const hostCtx = findStudioNodeGroupHost(hostNodeId, s);
    if (hostCtx == null) {
      return false;
    }
    const asset = buildStudioNodeAssetFromGroup(
      hostNodeId,
      hostCtx.parentNodes,
      hostCtx.parentEdges,
      s.subgraphs,
    );
    if (asset == null) {
      return false;
    }
    downloadStudioNodeAssetFile(asset);
    return true;
  },
  saveToLibrary: (args) => {
    const s = persistActiveGraphBuffer(get());
    const target = resolveSaveToLibraryTarget(s.nodes);
    if (target === "group") {
      const host = s.nodes.find((n) => n.selected && isStudioNodeGroupNode(n));
      if (host == null) {
        return null;
      }
      const result = get().saveGroupToNodeLibrary(host.id, args.name);
      if (result == null) {
        return null;
      }
      return { target, ...result };
    }

    const presetKind = target === "flow-full" ? "flowFull" : "flowPartial";
    const existing = findLinkedFlowPreset(get().flowPresetLibrary, {
      sourceScopeId:
        presetKind === "flowFull"
          ? s.activeGraphId === STUDIO_ROOT_GRAPH_ID
            ? "__root__"
            : s.activeGraphId
          : [...s.nodes.filter((n) => n.selected).map((n) => n.id)].sort().join("|"),
      presetKind,
    });

    const preset = buildFlowPresetFromCanvas({
      name: args.name,
      presetKind,
      nodes: s.nodes,
      edges: s.edges,
      subgraphs: s.subgraphs,
      activeGraphId: s.activeGraphId,
      rootNodes: s.rootNodes,
      rootEdges: s.rootEdges,
      category: args.category,
      description: args.description,
      tags: args.tags,
      existingMeta: existing?.meta,
    });

    const { library, result } = upsertFlowPreset(get().flowPresetLibrary, preset, {
      sourceScopeId: preset.meta.sourceScopeId ?? "__root__",
      presetKind,
    });
    writePersistedFlowPresetLibrary(library);
    set({ flowPresetLibrary: library });
    return { target, ...result };
  },
  mergeFlowPresetDocument: (document) => {
    const st = get();
    get().pushUndoSnapshot();
    const clipboardPayload = {
      marker: FLOW_CLIPBOARD_MARKER,
      version: FLOW_CLIPBOARD_VERSION,
      nodes: document.nodes as FlowGraphNode[],
      edges: document.edges as Edge[],
      ...(document.subgraphs != null ? { subgraphs: document.subgraphs } : {}),
    };
    const {
      nodes: pastedRaw,
      edges: pastedEdgesRaw,
      idMap,
    } = remapFlowDocumentForMerge(document);
    const pastedNodesRaw: FlowGraphNode[] = pastedRaw.map((n) => {
      if (isStudioFlowNode(n)) {
        const migrated = refreshCatalogOutputHandles(
          migrateFlowNodeFromLegacy(n as StudioNode),
        );
        return {
          ...migrated,
          selected: true,
          dragHandle: dragHandleSelectorForNodeId(migrated.data.nodeId),
          data: stripTransientStudioNodeData(migrated.data),
        };
      }
      return { ...n, selected: true };
    });
    const pastedNodes = remapSourceModelNodeIdAfterDuplicate(
      pastedNodesRaw as StudioNode[],
      idMap,
    ) as FlowGraphNode[];
    const { nodes: pastedWithGroups, subgraphs: mergedSubgraphs } =
      attachSubgraphsForPastedNodeGroups(
        pastedNodes,
        st.subgraphs,
        clipboardPayload.subgraphs,
        idMap,
      );
    for (const nn of pastedWithGroups) {
      nn.selected = true;
    }
    const pastedEdges: Edge[] = pastedEdgesRaw.map((e) => {
      const srcHandle = e.sourceHandle ?? STUDIO_HANDLE_OUT;
      const sourceStub = pastedWithGroups.find((n) => n.id === e.source);
      const label =
        sourceStub != null
          ? edgeLabelForSource(sourceStub, srcHandle, mergedSubgraphs)
          : "";
      return {
        ...e,
        animated: true,
        label,
        style: { ...(e.style ?? {}), strokeWidth: 2 },
      };
    });
    const mergedNodes = [
      ...st.nodes.map((n) => ({ ...n, selected: false })),
      ...pastedWithGroups,
    ];
    const pastedIds = pastedWithGroups.map((n) => n.id);
    const mergedEdges = [...st.edges, ...pastedEdges];
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(
      mergedNodes,
      mergedEdges,
    );
    const committed = commitActiveGraphMutation(
      { ...st, subgraphs: mergedSubgraphs },
      attachedNodes,
      mergedEdges,
    );
    set({
      ...committed,
      nodes: attachedNodes,
      edges: mergedEdges,
      ...selectionFromIds(pastedIds),
    });
    flushFlowSimulationPins(get);
    return true;
  },
  loadFlowPresetFromLibrary: (presetId, mode) => {
    const preset = get().flowPresetLibrary.find((p) => p.meta.id === presetId);
    if (preset == null) {
      return false;
    }
    if (mode === "merge") {
      return get().mergeFlowPresetDocument(preset.document);
    }
    const json = JSON.stringify({
      version: 1,
      nodes: preset.document.nodes,
      edges: preset.document.edges,
      selectedNodeId: null,
      ...(preset.document.subgraphs != null ? { subgraphs: preset.document.subgraphs } : {}),
      ...(preset.document.rootNodes != null
        ? { rootNodes: preset.document.rootNodes, rootEdges: preset.document.rootEdges }
        : {}),
      activeGraphId: STUDIO_ROOT_GRAPH_ID,
      graphStack: [],
    });
    const result = get().importFlowGraphJson(json);
    return result.ok;
  },
  removeFlowPresetFromLibrary: (presetId) => {
    const next = get().flowPresetLibrary.filter((p) => p.meta.id !== presetId);
    writePersistedFlowPresetLibrary(next);
    set({ flowPresetLibrary: next });
  },
  importFlowPresetToLibrary: (preset) => {
    const keyed = rekeyStudioFlowPresetMeta(preset);
    const next = [...get().flowPresetLibrary, keyed];
    writePersistedFlowPresetLibrary(next);
    set({ flowPresetLibrary: next });
    return keyed.meta.id;
  },
  exportFlowPresetById: (presetId) => {
    const preset = get().flowPresetLibrary.find((p) => p.meta.id === presetId);
    if (preset == null) {
      return false;
    }
    downloadStudioFlowPresetFile(preset);
    return true;
  },
  importNodeAssetIntoGroup: (hostNodeId, asset) => {
    const s = persistActiveGraphBuffer(get());
    const hostCtx = findStudioNodeGroupHost(hostNodeId, s);
    if (hostCtx == null) {
      return false;
    }
    const data = hostCtx.host.data;
    const subgraphKey = data.subgraphId ?? hostNodeId;
    const nextSubgraphs = replaceStudioNodeGroupFromAsset(
      subgraphKey,
      asset,
      s.subgraphs,
    );
    if (nextSubgraphs == null) {
      return false;
    }

    get().pushUndoSnapshot();
    const graphTitle = asset.meta.name.trim() || "Node Group";
    const patchHost = (n: FlowGraphNode) =>
      n.id === hostNodeId && isStudioNodeGroupNode(n)
        ? {
            ...n,
            data: { ...n.data, graphTitle, libraryAssetId: asset.meta.id },
          }
        : n;

    const rootNodes = s.rootNodes.map(patchHost);
    const subgraphs = nextSubgraphs;
    const activeSub = subgraphs[s.activeGraphId];

    if (s.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
      const committed = commitActiveGraphMutation(
        { ...s, subgraphs, rootNodes },
        rootNodes,
        s.rootEdges,
      );
      set(committed);
    } else if (activeSub != null) {
      set({
        subgraphs,
        rootNodes,
        nodes: activeSub.nodes.map(patchHost) as FlowGraphNode[],
        edges: activeSub.edges,
      });
    } else {
      set({ subgraphs, rootNodes });
    }
    flushFlowSimulationPins(get);
    return true;
  },
  instantiateNodeAssetAt: (asset, position) => {
    const st = persistActiveGraphBuffer(get());
    get().pushUndoSnapshot();
    const {
      nodes: pastedRaw,
      edges: pastedEdgesRaw,
      subgraphs: mergedSubgraphs,
    } = instantiateStudioNodeAsset(asset, position, st.subgraphs);
    if (pastedRaw.length === 0) {
      return false;
    }

    const pastedNodesRaw: FlowGraphNode[] = pastedRaw.map((n) => {
      if (isStudioFlowNode(n)) {
        const migrated = refreshCatalogOutputHandles(
          migrateFlowNodeFromLegacy(n as StudioNode),
        );
        return {
          ...migrated,
          selected: true,
          dragHandle: dragHandleSelectorForNodeId(migrated.data.nodeId),
          data: stripTransientStudioNodeData(migrated.data),
        };
      }
      return { ...n, selected: true };
    });
    const pastedNodes = pastedNodesRaw;

    const pastedEdges: Edge[] = pastedEdgesRaw.map((e) => {
      const srcHandle = e.sourceHandle ?? STUDIO_HANDLE_OUT;
      const sourceStub = pastedNodes.find((n) => n.id === e.source);
      const label =
        sourceStub != null
          ? edgeLabelForSource(sourceStub, srcHandle, mergedSubgraphs)
          : "";
      return {
        ...e,
        animated: true,
        label,
        style: { ...(e.style ?? {}), strokeWidth: 2 },
      };
    });

    const rootNodes = [
      ...st.rootNodes.map((n) => ({ ...n, selected: false })),
      ...pastedNodes,
    ];
    const rootEdges = [...st.rootEdges, ...pastedEdges];
    const attachedRoot = attachConfigErrorsWithModelChildRegistry(
      rootNodes,
      rootEdges,
    );
    const pastedIds = pastedNodes.map((n) => n.id);
    const committed = commitActiveGraphMutation(
      { ...st, subgraphs: mergedSubgraphs },
      attachedRoot,
      rootEdges,
    );
    set({
      ...committed,
      activeGraphId: STUDIO_ROOT_GRAPH_ID,
      graphStack: [],
      nodes: attachedRoot,
      edges: rootEdges,
      rootNodes: attachedRoot,
      rootEdges,
      ...selectionFromIds(pastedIds),
    });
    flushFlowSimulationPins(get);
    return true;
  },
  jumpToGraph: (graphId: StudioGraphId) => {
    const s = get();
    if (graphId === s.activeGraphId) {
      return;
    }
    get().pushUndoSnapshot();
    const persisted = persistActiveGraphBuffer(s);
    let nodes: FlowGraphNode[];
    let edges: Edge[];
    if (graphId === STUDIO_ROOT_GRAPH_ID) {
      nodes = persisted.rootNodes;
      edges = persisted.rootEdges;
    } else {
      const sub = persisted.subgraphs[graphId];
      if (sub == null) {
        return;
      }
      nodes = (sub.nodes as FlowGraphNode[]).map((node) =>
        applyStudioGroupBoundaryNodeChrome(node),
      );
      edges = sub.edges;
    }
    const stackIndex = persisted.graphStack.indexOf(graphId);
    const nextStack =
      graphId === STUDIO_ROOT_GRAPH_ID
        ? []
        : stackIndex >= 0
          ? persisted.graphStack.slice(0, stackIndex + 1)
          : [STUDIO_ROOT_GRAPH_ID, graphId];
    set({
      ...persisted,
      activeGraphId: graphId,
      graphStack: nextStack,
      nodes: attachConfigErrorsWithModelChildRegistry(nodes, edges),
      edges,
      selectedNodeId: null,
      selectedNodeIds: [],
    });
  },
  deleteSelection: () => {
    const st = get();
    const fromRf = st.nodes
      .filter(
        (n) =>
          n.selected &&
          n.type !== "studio-group-input" &&
          n.type !== "studio-group-output",
      )
      .map((n) => n.id);
    const ids =
      fromRf.length > 0
        ? new Set(fromRf)
        : st.selectedNodeId != null
          ? new Set([st.selectedNodeId])
          : null;
    if (ids == null || ids.size === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const removedGroupIds = [...ids].filter((id) => {
      const node = st.nodes.find((n) => n.id === id);
      return isStudioNodeGroupNode(node);
    });
    const frameIds = [...ids].filter(
      (id) => get().nodes.find((n) => n.id === id)?.type === "studio-frame",
    );
    let workingNodes = st.nodes;
    if (frameIds.length > 0) {
      const dissolved = dissolveStudioFrames(frameIds, workingNodes);
      workingNodes = dissolved.nodes;
    }
    const removed = removeFlowNodesFromGraph([...ids], workingNodes, st.edges);
    let nextNodes = removed.nodes;
    const nextEdges = removed.edges;
    let nextSubgraphs = { ...st.subgraphs };
    for (const groupId of removedGroupIds) {
      const node = st.nodes.find((n) => n.id === groupId);
      const subKey = isStudioNodeGroupNode(node)
        ? (node.data.subgraphId ?? groupId)
        : groupId;
      delete nextSubgraphs[subKey];
    }
    const priorSelection =
      st.selectedNodeIds.length > 0
        ? st.selectedNodeIds
        : st.selectedNodeId != null
          ? [st.selectedNodeId]
          : [];
    const survivingSelectedIds = priorSelection.filter((id) =>
      nextNodes.some((n) => n.id === id),
    );
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(
      nextNodes,
      nextEdges,
    );
    const committed = commitActiveGraphMutation(
      { ...st, subgraphs: nextSubgraphs },
      attachedNodes,
      nextEdges,
    );
    set({
      ...committed,
      nodes: attachedNodes,
      ...selectionFromIds(survivingSelectedIds),
    });
    flushFlowSimulationPins(get);
  },
  selectAllNodes: () => {
    set((state) => {
      const allIds = state.nodes.map((n) => n.id);
      return {
        nodes: attachConfigErrorsWithModelChildRegistry(
          state.nodes.map((n) => ({
            ...n,
            selected: true,
          })),
          state.edges,
        ),
        ...selectionFromIds(allIds),
      };
    });
  },
  clearNodeSelection: () => {
    set((state) => ({
      nodes: state.nodes.map((n) => ({
        ...n,
        selected: false,
      })),
      selectedNodeId: null,
      selectedNodeIds: [],
    }));
  },
  toggleSelectAllNodes: () => {
    const { nodes } = get();
    if (nodes.length === 0) {
      return;
    }
    const allSelected = nodes.every((n) => n.selected);
    if (allSelected) {
      get().clearNodeSelection();
    } else {
      get().selectAllNodes();
    }
  },
  selectStudioNodesByIds: (nodeIds) => {
    const sel = selectionFromIds(nodeIds);
    set((state) => ({
      ...sel,
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(state.nodes, sel.selectedNodeIds),
        state.edges,
      ),
    }));
  },
  onNodesChange: (changes) => {
    if (changes.length === 0) {
      return;
    }
    const filteredChanges = filterNodeChangesForStore(changes, get().nodes);
    if (filteredChanges.length === 0) {
      return;
    }
    const layoutOnly = nodeChangesAreLayoutOnly(filteredChanges);
    if (layoutOnly) {
      if (!layoutUndoPrimed) {
        get().pushUndoSnapshot();
        layoutUndoPrimed = true;
      }
      if (layoutUndoIdleTimer != null) {
        window.clearTimeout(layoutUndoIdleTimer);
      }
      layoutUndoIdleTimer = window.setTimeout(() => {
        layoutUndoPrimed = false;
        layoutUndoIdleTimer = undefined;
      }, 450);
    } else {
      structuralUndoCoalescerFor(get).pushCoalesced();
    }
    set((state) => {
      let nextNodes = applyNodeChanges(filteredChanges, state.nodes);
      if (layoutOnly) {
        nextNodes = syncStudioNodeLayoutStyleFromDimensionChanges(
          nextNodes,
          filteredChanges,
        );
      }
      const reconciled = layoutOnly
        ? nextNodes
        : reconcileStudioModelGeneratedChildIds(nextNodes);
      return {
        nodes: layoutOnly
          ? reconciled
          : attachConfigErrors(reconciled, state.edges),
      };
    });
    if (!layoutOnly) {
      flushFlowSimulationPins(get);
    }
  },
  onEdgesChange: (changes) => {
    if (changes.length === 0) {
      return;
    }
    const structural = changes.some((ch) => ch.type === "remove");
    if (structural) {
      structuralUndoCoalescerFor(get).pushCoalesced();
    }
    set((state) => {
      const bridged = applyRerouteBridgeOnEdgeRemoves(
        changes,
        state.nodes,
        state.edges,
      );
      const nextEdges =
        bridged.changes.length > 0
          ? applyEdgeChanges(bridged.changes, bridged.edges)
          : bridged.edges;
      return {
        edges: nextEdges,
        nodes: attachConfigErrorsWithModelChildRegistry(
          reconcileGlbEventModelScopeFromEdges(state.nodes, nextEdges),
          nextEdges,
        ),
      };
    });
    flushFlowSimulationPins(get);
  },
  popEdgesForSocketReconnect: (edgeIds, options) => {
    if (edgeIds.length === 0) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushUndoSnapshot();
    }
    const removeIds = new Set(edgeIds);
    set((state) => {
      const nextEdges = state.edges.filter((e) => !removeIds.has(e.id));
      return {
        edges: nextEdges,
        nodes: attachConfigErrorsWithModelChildRegistry(
          reconcileGlbEventModelScopeFromEdges(state.nodes, nextEdges),
          nextEdges,
        ),
      };
    });
    flushFlowSimulationPins(get);
  },
  onConnect: (connection, options) => {
    const st = get();
    const promoted = promoteGroupConnection(
      connection,
      {
        nodes: st.nodes,
        edges: st.edges,
        subgraphs: st.subgraphs,
      },
      st.rootNodes,
    );
    let connectionToUse = connection;
    if (promoted != null) {
      connectionToUse = promoted.connection;
      if (options?.skipUndoSnapshot !== true) {
        get().pushUndoSnapshot();
      }
      const ifacePatch = applyNodeGroupInterfaceToState(
        get(),
        promoted.hostNodeId,
        promoted.nextInterface,
      );
      if (ifacePatch != null) {
        set(ifacePatch);
      }
    }
    const graphState = get();
    const result = connectWithPolicy(
      connectionToUse,
      {
        nodes: graphState.nodes,
        edges: graphState.edges,
        subgraphs: graphState.subgraphs,
      },
      { excludeEdgeId: options?.excludeEdgeId },
    );
    if (!result.ok) {
      return;
    }
    const sourceNode = graphState.nodes.find((n) => n.id === connectionToUse.source);
    const srcHandle = connectionToUse.sourceHandle ?? STUDIO_HANDLE_OUT;
    const label =
      sourceNode != null
        ? edgeLabelForSource(sourceNode, srcHandle, graphState.subgraphs)
        : "";
    const priorEdgeIds = new Set(graphState.edges.map((e) => e.id));
    if (promoted == null && options?.skipUndoSnapshot !== true) {
      get().pushUndoSnapshot();
    }
    set((state) => {
      const nextEdges = result.edges.map((edge) => {
        if (priorEdgeIds.has(edge.id)) {
          return edge;
        }
        return {
          ...edge,
          id: `${connectionToUse.source}-${connectionToUse.target}-${Date.now()}`,
          animated: true,
          label,
          style: { strokeWidth: 2 },
        };
      });
      return {
        edges: nextEdges,
        nodes: attachConfigErrorsWithModelChildRegistry(
          patchLayoutNodesAfterConnect(
            reconcileGlbEventModelScopeFromEdges(
              patchStudioModelScopeOnConnect(state.nodes, connectionToUse),
              nextEdges,
            ),
            connectionToUse,
          ),
          nextEdges,
        ),
      };
    });
    flushFlowSimulationPins(get);
  },
  onReconnect: (oldEdge, newConnection, options) => {
    const st = get();
    const storeEdge = st.edges.find((e) => e.id === oldEdge.id);
    if (storeEdge == null) {
      return;
    }
    let merged = mergeReconnectConnection(storeEdge, newConnection);
    const promoted = promoteGroupConnection(
      merged,
      {
        nodes: st.nodes,
        edges: st.edges,
        subgraphs: st.subgraphs,
      },
      st.rootNodes,
    );
    if (promoted != null) {
      merged = promoted.connection;
      if (options?.skipUndoSnapshot !== true) {
        get().pushUndoSnapshot();
      }
      const ifacePatch = applyNodeGroupInterfaceToState(
        get(),
        promoted.hostNodeId,
        promoted.nextInterface,
      );
      if (ifacePatch != null) {
        set(ifacePatch);
      }
    }
    const graphState = get();
    const result = reconnectWithPolicy(storeEdge, merged, {
      nodes: graphState.nodes,
      edges: graphState.edges,
      subgraphs: graphState.subgraphs,
    });
    if (!result.ok) {
      return;
    }
    const connection = merged;
    const sourceNode = st.nodes.find((n) => n.id === connection.source);
    const srcHandle = connection.sourceHandle ?? STUDIO_HANDLE_OUT;
    const label =
      sourceNode != null
        ? edgeLabelForSource(sourceNode, srcHandle, st.subgraphs)
        : "";
    if (promoted == null && options?.skipUndoSnapshot !== true) {
      get().pushUndoSnapshot();
    }
    set((state) => {
      const nextEdges = result.edges.map((edge) =>
        edge.id === storeEdge.id
          ? {
              ...edge,
              label,
              animated: edge.animated ?? true,
              style: { ...(edge.style ?? {}), strokeWidth: 2 },
            }
          : edge,
      );
      return {
        edges: nextEdges,
        nodes: attachConfigErrorsWithModelChildRegistry(
          patchLayoutNodesAfterConnect(
            reconcileGlbEventModelScopeFromEdges(
              patchStudioModelScopeOnConnect(state.nodes, connection),
              nextEdges,
            ),
            connection,
          ),
          nextEdges,
        ),
      };
    });
    flushFlowSimulationPins(get);
  },
  onSelectionChange: (selectedNodeIds) => {
    const sel = selectionFromIds(selectedNodeIds);
    const current = get();
    if (
      selectionIdsEqual(current.selectedNodeIds, sel.selectedNodeIds) &&
      nodesSelectionMatches(current.nodes, sel.selectedNodeIds)
    ) {
      return;
    }
    set((state) => ({
      ...sel,
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(state.nodes, sel.selectedNodeIds),
        state.edges,
      ),
    }));
  },
  addNodeFromCatalog: (entry, options) => {
    get().pushUndoSnapshot();
    const x = 80 + Math.round(Math.random() * 280);
    const y = 80 + Math.round(Math.random() * 220);
    const nextNode = createStudioNodeFromCatalogEntry(entry, { x, y }, options);
    nextNode.selected = true;
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection([...state.nodes, nextNode], [nextNode.id]),
        state.edges,
      ),
      ...selectionFromIds([nextNode.id]),
    }));
    flushFlowSimulationPins(get);
  },
  addNodeFromCatalogAt: (entry, position, options) => {
    get().pushUndoSnapshot();
    const nextNode = createStudioNodeFromCatalogEntry(entry, position, options);
    const flowLabel = options?.flowNodeLabel?.trim();
    if (flowLabel != null && flowLabel.length > 0) {
      nextNode.data.label = flowLabel;
    }
    if (options?.mergeDefaultConfig != null) {
      nextNode.data.defaultConfig = {
        ...nextNode.data.defaultConfig,
        ...options.mergeDefaultConfig,
      };
    }
    nextNode.selected = true;
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection([...state.nodes, nextNode], [nextNode.id]),
        state.edges,
      ),
      ...selectionFromIds([nextNode.id]),
    }));
    flushFlowSimulationPins(get);
    return nextNode.id;
  },
  addLayoutNodeAt: (kind, position) => {
    get().pushUndoSnapshot();
    const nextNode = buildLayoutFlowNode(kind, position);
    nextNode.selected = true;
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection([...state.nodes, nextNode], [nextNode.id]),
        state.edges,
      ),
      ...selectionFromIds([nextNode.id]),
    }));
    flushFlowSimulationPins(get);
    return nextNode.id;
  },
  spawnRerouteAt: (position) => {
    get().pushUndoSnapshot();
    const nextNode = buildRerouteFlowNode(position);
    nextNode.selected = true;
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection([...state.nodes, nextNode], [nextNode.id]),
        state.edges,
      ),
      ...selectionFromIds([nextNode.id]),
    }));
    return nextNode.id;
  },
  insertRerouteOnEdge: (edgeId, flowPosition) => {
    const st = get();
    const split = splitEdgeWithReroute(
      edgeId,
      flowPosition,
      st.nodes,
      st.edges,
    );
    if (split == null) {
      return null;
    }
    const edge = st.edges.find((e) => e.id === edgeId);
    if (edge?.source == null || edge.target == null) {
      return null;
    }
    const sourceHandle = edge.sourceHandle ?? STUDIO_HANDLE_OUT;
    const targetHandle = edge.targetHandle ?? STUDIO_HANDLE_IN;
    const upstreamConnection = {
      source: edge.source,
      sourceHandle,
      target: split.rerouteId,
      targetHandle: "in",
    };
    const downstreamConnection = {
      source: split.rerouteId,
      sourceHandle: "out",
      target: edge.target,
      targetHandle,
    };
    get().pushUndoSnapshot();
    set((state) => {
      let nextNodes = split.nodes.map((n) =>
        n.id === split.rerouteId
          ? { ...n, selected: true }
          : { ...n, selected: false },
      );
      nextNodes = patchLayoutNodesAfterConnect(nextNodes, upstreamConnection);
      nextNodes = patchLayoutNodesAfterConnect(nextNodes, downstreamConnection);
      nextNodes = patchStudioModelScopeOnConnect(nextNodes, upstreamConnection);
      nextNodes = patchStudioModelScopeOnConnect(
        nextNodes,
        downstreamConnection,
      );
      const nextEdges = split.edges;
      nextNodes = reconcileGlbEventModelScopeFromEdges(nextNodes, nextEdges);
      return {
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(nextNodes, [split.rerouteId]),
          nextEdges,
        ),
        edges: nextEdges,
        ...selectionFromIds([split.rerouteId]),
      };
    });
    flushFlowSimulationPins(get);
    return split.rerouteId;
  },
  applyFlowFrameDragStop: (dragged) => {
    const st = get();
    const result = applyFlowFrameDragStop(dragged, st.nodes);
    if (!result.changed) {
      return;
    }
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        result.nodes,
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
  },
  fitSelectedFramesToContents: (frameIds) => {
    const st = get();
    const ids =
      frameIds ??
      (st.nodes
        .filter((n) => n.selected && n.type === "studio-frame")
        .map((n) => n.id).length > 0
        ? st.nodes
            .filter((n) => n.selected && n.type === "studio-frame")
            .map((n) => n.id)
        : st.selectedNodeId != null &&
            st.nodes.find((n) => n.id === st.selectedNodeId)?.type ===
              "studio-frame"
          ? [st.selectedNodeId]
          : []);
    if (ids.length === 0) {
      return false;
    }
    const result = fitFramesToContents(ids, st.nodes);
    if (!result.changed) {
      return false;
    }
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        result.nodes,
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
    return true;
  },
  dissolveSelectedFrames: (frameIds) => {
    const st = get();
    const ids =
      frameIds ??
      (st.nodes
        .filter((n) => n.selected && n.type === "studio-frame")
        .map((n) => n.id).length > 0
        ? st.nodes
            .filter((n) => n.selected && n.type === "studio-frame")
            .map((n) => n.id)
        : st.selectedNodeId != null &&
            st.nodes.find((n) => n.id === st.selectedNodeId)?.type ===
              "studio-frame"
          ? [st.selectedNodeId]
          : []);
    if (ids.length === 0) {
      return false;
    }
    const dissolved = dissolveStudioFrames(ids, st.nodes);
    if (!dissolved.changed) {
      return false;
    }
    get().pushUndoSnapshot();
    const survivingSelectedIds = st.selectedNodeIds.filter(
      (id) => !ids.includes(id),
    );
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        dissolved.nodes,
        state.edges,
      ),
      ...selectionFromIds(survivingSelectedIds),
    }));
    flushFlowSimulationPins(get);
    return true;
  },
  createFrameAroundSelection: () => {
    const st = get();
    const selected = st.nodes.filter(
      (n) =>
        n.selected &&
        !isStudioFrameNode(n) &&
        n.type !== "studio-note" &&
        n.type !== "studio-node-group" &&
        n.type !== "studio-group-input" &&
        n.type !== "studio-group-output" &&
        !isLayoutOnlyForFrame(n) &&
        n.parentId == null,
    );
    if (selected.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const { frame, children } = createFrameAroundNodes(selected);
    const selectedIds = new Set(selected.map((n) => n.id));
    const childById = new Map(children.map((c) => [c.id, c]));
    const merged = st.nodes.map((n) => {
      if (!selectedIds.has(n.id)) {
        return { ...n, selected: false };
      }
      return { ...(childById.get(n.id) ?? n), selected: true };
    });
    const nextNodes = sortFlowNodesParentFirst([
      { ...frame, selected: false },
      ...merged,
    ]);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(nextNodes, state.edges),
      ...selectionFromIds([...selectedIds]),
    }));
    flushFlowSimulationPins(get);
  },
  detachSelectionFromFrame: () => {
    const st = get();
    const selectedIds = st.nodes.filter((n) => n.selected).map((n) => n.id);
    if (selectedIds.length === 0) {
      return false;
    }
    const result = detachNodesFromFrame(selectedIds, st.nodes);
    if (!result.changed) {
      return false;
    }
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        result.nodes,
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
    return true;
  },
  toggleSocketsExpandedForNodes: (nodeIds) => {
    if (nodeIds.length === 0) {
      return;
    }
    const st = get();
    const nextExpanded = nextSocketsExpandedForBatch(st.nodes, nodeIds);
    get().setSocketsExpandedForNodes(nodeIds, nextExpanded);
  },
  toggleSocketValuesVisibleForNodes: (nodeIds) => {
    if (nodeIds.length === 0) {
      return;
    }
    const st = get();
    const nextVisible = nextSocketValuesVisibleForBatch(st.nodes, nodeIds);
    get().setSocketValuesVisibleForNodes(nodeIds, nextVisible);
  },
  setSocketsExpandedForNodes: (nodeIds, expanded) => {
    if (nodeIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(nodeIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          const nextData: StudioNodeData = {
            ...data,
            ui: patchStudioNodeUiSocketDisplay(data.ui, {
              socketsExpanded: expanded,
            }),
          };
          return applyStudioNodeChromeLayoutSwitch(n as StudioNode, nextData);
        }),
        state.edges,
      ),
    }));
  },
  setSocketValuesVisibleForNodes: (nodeIds, visible) => {
    if (nodeIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(nodeIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          const nextData: StudioNodeData = {
            ...data,
            ui: patchStudioNodeUiSocketDisplay(data.ui, {
              socketValuesVisible: visible,
            }),
          };
          return applyStudioNodeChromeLayoutSwitch(n as StudioNode, nextData);
        }),
        state.edges,
      ),
    }));
  },
  toggleBodyControlsVisibleForNodes: (nodeIds) => {
    if (nodeIds.length === 0) {
      return;
    }
    const st = get();
    const nextVisible = nextBodyControlsVisibleForBatch(st.nodes, nodeIds);
    get().pushUndoSnapshot();
    const idSet = new Set(nodeIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          const nextData: StudioNodeData = {
            ...data,
            ui: patchStudioNodeUiBodyControlsVisible(data.ui, nextVisible),
          };
          return applyStudioNodeChromeLayoutSwitch(n as StudioNode, nextData);
        }),
        state.edges,
      ),
    }));
  },
  setStudioNodeChromeLayoutWidth: (nodeIds, chromeKey, widthPx) => {
    if (nodeIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(nodeIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          const nextUi = patchStudioNodeChromeLayoutWidth(
            data.ui,
            chromeKey,
            widthPx,
          );
          const nextData: StudioNodeData = { ...data, ui: nextUi };
          const activeKey = resolveStudioNodeChromeLayoutKey(
            nextData.ui,
            studioNodeHasHideableBody(nextData),
          );
          if (activeKey !== chromeKey) {
            return { ...n, data: nextData };
          }
          return applyStudioNodeChromeLayoutSwitch(n as StudioNode, nextData);
        }),
        state.edges,
      ),
    }));
  },
  copyStudioNodeCanvasWidthToAllChromeModes: (nodeIds) => {
    if (nodeIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(nodeIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          const width = readStudioFlowNodeLayoutSize(n as StudioNode).width;
          const keys = studioNodeChromeLayoutKeysForData(data);
          const nextUi = copyChromeLayoutWidthToAllKeys(data.ui, keys, width);
          return { ...n, data: { ...data, ui: nextUi } };
        }),
        state.edges,
      ),
    }));
  },
  fitStudioNodesWidthToContent: (nodeIds) => {
    if (nodeIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(nodeIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          const fitW = resolveFitWidthFromContentMeasure(data.nodeId, data.ui);
          return applyStudioNodeLayoutWidth({ ...n, data } as StudioNode, fitW);
        }),
        state.edges,
      ),
    }));
  },
  syncStudioNodeWidthFromContentMeasure: (nodeId, measuredWidthPx) => {
    const id = nodeId.trim();
    if (id.length === 0 || !Number.isFinite(measuredWidthPx)) {
      return;
    }
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id !== id || n.type !== "studio") {
          return n;
        }
        const data = n.data as StudioNodeData;
        const floor = resolveStudioNodeMinDimensionFloor(data.nodeId).minWidth;
        const fitW = Math.max(floor, Math.round(measuredWidthPx));
        const currentW = readStudioFlowNodeLayoutSize(n as StudioNode).width;
        if (currentW === fitW) {
          return n;
        }
        return applyStudioNodeLayoutWidth({ ...n, data } as StudioNode, fitW);
      }),
    }));
  },
  syncStudioNodeChromeWidthFromMeasureIfUnset: (nodeId, measuredWidthPx) => {
    get().syncStudioNodeWidthFromContentMeasure(nodeId, measuredWidthPx);
  },
  persistStudioNodeCanvasWidthForActiveChrome: (_nodeId, _widthPx) => {
    // Width lives on the React Flow node only; display-mode auto-fit handles toggles.
  },
  resetStudioNodesToDefaults: (nodeIds) => {
    if (nodeIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(nodeIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          const stripped = stripStudioNodeFixedLayout(n as StudioNode);
          const clearedUi = clearStudioNodeChromeLayoutWidths(
            studioNodeUiWithoutDisplayOverrides(data.ui),
          );
          const fitW = resolveFitWidthFromContentMeasure(
            data.nodeId,
            clearedUi,
          );
          return applyStudioNodeLayoutWidth(
            {
              ...stripped,
              data: { ...data, ui: clearedUi },
            } as StudioNode,
            fitW,
          );
        }),
        state.edges,
      ),
    }));
  },
  applyFlowAutoLayout: (direction) => {
    const st = get();
    if (st.nodes.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const layouted = runFlowAutoLayout(st.nodes, st.edges, direction);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(layouted, state.edges),
    }));
    flushFlowSimulationPins(get);
  },
  updateLayoutNodeData: (flowNodeId, patch) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === flowNodeId && isLayoutFlowNode(node)
          ? { ...node, data: { ...node.data, ...patch } }
          : node,
      ),
    }));
  },
  updateLayoutFlowNode: (flowNodeId, patch) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== flowNodeId || !isLayoutFlowNode(node)) {
          return node;
        }
        const next = { ...node, ...patch } as typeof node;
        if (patch.style != null) {
          next.style = {
            ...(node.style ?? {}),
            ...(patch.style as any),
          } as any;
        }
        return next;
      }),
    }));
  },
  raiseLayoutNode: (flowNodeId) => {
    const st = get();
    const maxZ = Math.max(0, ...st.nodes.map((n) => n.zIndex ?? 0));
    get().updateLayoutFlowNode(flowNodeId, { zIndex: maxZ + 1 });
  },
  lowerLayoutNode: (flowNodeId) => {
    // Frames use zIndex = -1; keep layout nodes above frames by default.
    get().updateLayoutFlowNode(flowNodeId, { zIndex: 0 });
  },
  addNodeFromCatalogLinkedToModel: (entry, position, options) => {
    const parentId = options.parentModelNodeId.trim();
    if (parentId.length === 0) {
      return;
    }
    const parent = get().nodes.find((n) => n.id === parentId);
    if (
      parent == null ||
      !isStudioFlowNode(parent) ||
      parent.data.nodeId !== "model-select"
    ) {
      return;
    }
    get().pushUndoSnapshot();
    const nextNode = createStudioNodeFromCatalogEntry(entry, position, {
      ui: options.ui,
    });
    nextNode.selected = true;
    const flowLabel = options.flowNodeLabel?.trim();
    if (flowLabel != null && flowLabel.length > 0) {
      nextNode.data.label = flowLabel;
    }
    nextNode.data.defaultConfig = {
      ...nextNode.data.defaultConfig,
      ...(options.mergeDefaultConfig ?? {}),
      [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: parentId,
    };
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection([...state.nodes, nextNode], [nextNode.id]),
        state.edges,
      ),
      ...selectionFromIds([nextNode.id]),
    }));
    flushFlowSimulationPins(get);
  },
  addNodeFromCatalogWithInlineGlbModel: (entry, position, options) => {
    get().pushUndoSnapshot();
    const nextNode = createStudioNodeFromCatalogEntry(entry, position, {
      ui: options.ui,
    });
    nextNode.selected = true;
    const flowLabel = options.flowNodeLabel?.trim();
    if (flowLabel != null && flowLabel.length > 0) {
      nextNode.data.label = flowLabel;
    }
    nextNode.data.defaultConfig = {
      ...nextNode.data.defaultConfig,
      ...options.mergeDefaultConfig,
    };
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection([...state.nodes, nextNode], [nextNode.id]),
        state.edges,
      ),
      ...selectionFromIds([nextNode.id]),
    }));
    flushFlowSimulationPins(get);
  },
  updateNodeConfigFieldByNodeId: (nodeId, key, value) => {
    get().pushUndoSnapshot();
    set((state) => {
      const nodes = attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  defaultConfig: {
                    ...node.data.defaultConfig,
                    [key]: value,
                  },
                },
              }
            : node,
        ),
        state.edges,
      );
      const touched = nodes.find((n) => n.id === nodeId);
      let edges = state.edges;
      if (
        key === ANIMATION_MERGE_INPUT_COUNT_KEY &&
        touched != null &&
        touched.type === "studio"
      ) {
        if (touched.data.nodeId === "animation-merge") {
          edges = pruneAnimationMergeEdges(nodes, edges);
        }
        if (touched.data.nodeId === "animation-mix") {
          edges = pruneAnimationMixEdges(nodes, edges);
        }
      }
      return { nodes, edges };
    });
    flushFlowSimulationPins(get);
  },
  setStudioUtilityNodeBodyExpanded: (flowNodeId, field, expanded) => {
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          node.id === flowNodeId
            ? patchStudioUtilityNodeBodyExpanded(node, field, expanded)
            : node,
        ),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
  },
  resetCanvas: () => {
    get().pushUndoSnapshot();
    clearPersistedFlowDocument();
    set({
      nodes: [],
      edges: [],
      ...initialSubgraphStoreSlice(),
      selectedNodeId: null,
      selectedNodeIds: [],
    });
  },
  muteAllAudio: () => {
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) => {
          if (node.type !== "studio") {
            return node;
          }
          const catalogId = node.data.nodeId;
          if (
            catalogId !== "audio-output" &&
            catalogId !== "audio-oscillator" &&
            catalogId !== "audio-file-player" &&
            catalogId !== "audio-sfx" &&
            catalogId !== "audio-machine"
          ) {
            return node;
          }
          const patch: Record<string, unknown> = { gate: false };
          if (catalogId === "audio-machine") {
            patch.enabled = false;
          }
          if (catalogId === "audio-output") {
            patch.gain = 0;
          }
          return {
            ...node,
            data: {
              ...node.data,
              defaultConfig: {
                ...node.data.defaultConfig,
                ...patch,
              },
            },
          };
        }),
        state.edges,
      ),
    }));
    studioAudioRuntime.panicMuteAll();
    flushFlowSimulationPins(get);
  },
  fireAudioSfxNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (node?.type !== "studio" || node.data.nodeId !== "audio-sfx") {
      return;
    }
    const cfg = node.data.defaultConfig as Record<string, unknown>;
    if (cfg.enabled === false) {
      return;
    }
    const preset = resolveAudioSfxPreset(cfg.preset);
    const gainRaw = typeof cfg.gain === "number" ? cfg.gain : Number(cfg.gain);
    const gain = Number.isFinite(gainRaw) ? gainRaw : preset.gain;
    void studioAudioRuntime.triggerSfx(nodeId, {
      waveform:
        typeof cfg.waveform === "string" ? cfg.waveform : preset.waveform,
      sourceKind: cfg.sourceKind === "noise" ? "noise" : preset.sourceKind,
      startHz:
        typeof cfg.startHz === "number" ? cfg.startHz : preset.startHz,
      endHz: typeof cfg.endHz === "number" ? cfg.endHz : preset.endHz,
      durationS:
        typeof cfg.durationS === "number" ? cfg.durationS : preset.durationS,
      curve: cfg.curve === "log" ? "log" : preset.curve,
      direction:
        cfg.direction === "up" || cfg.direction === "down" || cfg.direction === "up-down"
          ? cfg.direction
          : preset.direction,
      gain: Number.isFinite(gain) ? Math.max(0, Math.min(1, gain)) : preset.gain,
      attackMs:
        typeof cfg.attackMs === "number" ? cfg.attackMs : preset.attackMs,
      releaseMs:
        typeof cfg.releaseMs === "number" ? cfg.releaseMs : preset.releaseMs,
    });
    get().tickSimulation();
  },
  runDemoTemplate: (templateId, catalog) => {
    const makeNode = (
      entry: NodeCatalogEntry,
      id: string,
      x: number,
      y: number,
    ): StudioNode => {
      const inferred = inferPortTypes(entry);
      return {
        id,
        type: "studio",
        position: { x, y },
        data: {
          label: entry.title,
          category: entry.category,
          nodeId: entry.id,
          defaultConfig: { ...entry.defaultConfig },
          inputType: inferred.inputType,
          outputType: inferred.outputType,
          outputHandles: inferred.outputHandles,
          inputHandles: inferred.inputHandles,
          liveValue: null,
          liveHistory: [],
          livePlotHistory: {},
        },
      };
    };

    if (templateId === "stage-scene-output") {
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const outputEntry = catalog.find((entry) => entry.id === "scene-output");
      const envEntry = catalog.find((entry) => entry.id === "environment");
      if (modelEntry == null || outputEntry == null) {
        return;
      }

      const modelFlowId = "demo-stage-model-select";

      const modelNode = makeNode(modelEntry, modelFlowId, 80, 300);
      modelNode.data.label = "Model Source (PSoC E84)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
        selectedModelUrl: DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
      };

      const outputNode = makeNode(outputEntry, "demo-scene-output", 460, 200);
      outputNode.data.label = "Scene Output";
      outputNode.data.defaultConfig = {
        ...outputNode.data.defaultConfig,
        showGrid: STAGE_DEFAULT_SHOW_GRID,
        scene3d: stageSceneOutputDefaultScene3d(),
      };

      const templateNodes: StudioNode[] = [modelNode, outputNode];
      const templateEdges: Edge[] = [
        {
          id: "demo-stage-e1",
          source: modelNode.id,
          target: outputNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_MODELS,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
      ];

      if (envEntry != null) {
        const envNode = makeNode(envEntry, "demo-stage-environment", 80, 120);
        envNode.data.label = "Environment (Park)";
        envNode.data.defaultConfig = {
          ...envNode.data.defaultConfig,
          ...stageEnvironmentNodeDefaultConfig(),
        };
        templateNodes.push(envNode);
        templateEdges.push({
          id: "demo-stage-e2",
          source: envNode.id,
          target: outputNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_ENV,
          animated: true,
          label: getSourcePortType(envNode, STUDIO_HANDLE_OUT) ?? "environment",
          style: { strokeWidth: 2 },
        });
      }

      get().pushUndoSnapshot();
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(templateNodes, [outputNode.id]),
          templateEdges,
        ),
        edges: templateEdges,
        ...selectionFromIds([outputNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "stage-camera-vision") {
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const outputEntry = catalog.find((entry) => entry.id === "scene-output");
      const envEntry = catalog.find((entry) => entry.id === "environment");
      const cameraEntry = catalog.find((entry) => entry.id === "camera-input");
      const css3dEntry = catalog.find((entry) => entry.id === "css3d-camera-feed");
      const poseEntry = catalog.find((entry) => entry.id === "vision-pose");
      if (modelEntry == null || outputEntry == null || cameraEntry == null) {
        return;
      }

      const modelFlowId = "demo-stage-cam-model";
      const modelNode = makeNode(modelEntry, modelFlowId, 80, 420);
      modelNode.data.label = "Model Source (PSoC E84)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
        selectedModelUrl: DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
      };

      const outputNode = makeNode(outputEntry, "demo-stage-cam-out", 460, 320);
      outputNode.data.label = "Scene Output";
      outputNode.data.defaultConfig = {
        ...outputNode.data.defaultConfig,
        showGrid: STAGE_DEFAULT_SHOW_GRID,
        scene3d: stageSceneOutputDefaultScene3d(),
      };

      const cameraNode = makeNode(cameraEntry, "demo-stage-cam-in", 80, 80);
      cameraNode.data.label = "Webcam";
      cameraNode.data.defaultConfig = {
        ...cameraNode.data.defaultConfig,
        enabled: true,
        width: 1280,
        height: 720,
        targetFps: 30,
        facingMode: "user",
        mirrorPreview: true,
      };

      const templateNodes: StudioNode[] = [modelNode, outputNode, cameraNode];
      const templateEdges: Edge[] = [
        {
          id: "demo-stage-cam-e1",
          source: modelNode.id,
          target: outputNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_MODELS,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
      ];

      if (envEntry != null) {
        const envNode = makeNode(envEntry, "demo-stage-cam-env", 80, 240);
        envNode.data.label = "Environment (Park)";
        envNode.data.defaultConfig = {
          ...envNode.data.defaultConfig,
          ...stageEnvironmentNodeDefaultConfig(),
        };
        templateNodes.push(envNode);
        templateEdges.push({
          id: "demo-stage-cam-e3",
          source: envNode.id,
          target: outputNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_ENV,
          animated: true,
          label: getSourcePortType(envNode, STUDIO_HANDLE_OUT) ?? "environment",
          style: { strokeWidth: 2 },
        });
      }

      if (css3dEntry != null) {
        const css3dNode = makeNode(css3dEntry, "demo-stage-cam-hud", 380, 80);
        css3dNode.data.label = "Camera HUD";
        css3dNode.data.defaultConfig = {
          ...css3dNode.data.defaultConfig,
          anchorMode: "screen",
          anchor: { x: 0.12, y: 0.14, z: 0 },
          sizePx: { w: 240, h: 135 },
        };
        templateNodes.push(css3dNode);
        templateEdges.push({
          id: "demo-stage-cam-e4",
          source: cameraNode.id,
          target: css3dNode.id,
          sourceHandle: "video",
          targetHandle: "in",
          animated: true,
          label: getSourcePortType(cameraNode, "video", {}) ?? "videoBus",
          style: { strokeWidth: 2 },
        });
      }

      if (poseEntry != null) {
        const poseNode = makeNode(poseEntry, "demo-stage-cam-pose", 380, 240);
        poseNode.data.label = "Vision Pose";
        templateNodes.push(poseNode);
        templateEdges.push({
          id: "demo-stage-cam-e5",
          source: cameraNode.id,
          target: poseNode.id,
          sourceHandle: "video",
          targetHandle: "in",
          animated: true,
          label: getSourcePortType(cameraNode, "video", {}) ?? "videoBus",
          style: { strokeWidth: 2 },
        });
      }

      get().pushUndoSnapshot();
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(templateNodes, [outputNode.id]),
          templateEdges,
        ),
        edges: templateEdges,
        ...selectionFromIds([outputNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "material-glb-drives") {
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const viewerEntry = catalog.find((entry) => entry.id === "model-viewer");
      const paramEntry = catalog.find(
        (entry) => entry.id === "glb-material-param",
      );
      const texEntry = catalog.find(
        (entry) => entry.id === "glb-material-texture",
      );
      if (
        modelEntry == null ||
        viewerEntry == null ||
        paramEntry == null ||
        texEntry == null
      ) {
        return;
      }

      const modelFlowId = "demo-model-select";
      const matRef = "Material";

      const modelNode = makeNode(modelEntry, modelFlowId, 72, 280);
      modelNode.data.label = "Model Source (PSoC E84)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
        selectedModelUrl: DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
        generatedChildNodeIds: ["demo-mat-param", "demo-mat-tex"],
      };

      const viewerNode = makeNode(viewerEntry, "demo-model-viewer", 420, 120);
      viewerNode.data.label = "Model Viewer (material drives)";
      viewerNode.data.defaultConfig = {
        ...viewerNode.data.defaultConfig,
        showGrid: true,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      };
      const paramNode = makeNode(paramEntry, "demo-mat-param", 420, 320);
      paramNode.data.label = "Roughness drive";
      paramNode.data.defaultConfig = {
        ...paramNode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
        [STUDIO_GLB_EXTRACT_KIND_KEY]: "material",
        [STUDIO_GLB_EXTRACT_REF_KEY]: matRef,
        [STUDIO_GLB_MATERIAL_PARAM_KEY]: "roughness",
        value: defaultGlbMaterialParamValue("roughness"),
        numberMode: "float",
      };

      const texNode = makeNode(texEntry, "demo-mat-tex", 420, 480);
      texNode.data.label = "Base color texture";
      texNode.data.defaultConfig = {
        ...texNode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
        [STUDIO_GLB_EXTRACT_KIND_KEY]: "material",
        [STUDIO_GLB_EXTRACT_REF_KEY]: matRef,
        [STUDIO_GLB_MATERIAL_TEXTURE_SLOT_KEY]: "map",
        [STUDIO_TEXTURE_ASSET_ID_KEY]: "texture.cubemap.bridge.posx",
        [STUDIO_TEXTURE_URL_KEY]: "textures/cubemap/bridge/posx.jpg",
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-mat-e1",
          source: modelNode.id,
          target: viewerNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
      ];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [modelNode, viewerNode, paramNode, texNode],
            [viewerNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([viewerNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "audio-lab") {
      const micEntry = catalog.find((entry) => entry.id === "mic-input");
      const scopeEntry = catalog.find((entry) => entry.id === "audio-scope");
      const outEntry = catalog.find((entry) => entry.id === "audio-output");
      const plotterEntry = catalog.find((entry) => entry.id === "plotter");
      const fileEntry = catalog.find(
        (entry) => entry.id === "audio-file-player",
      );
      if (
        micEntry == null ||
        scopeEntry == null ||
        outEntry == null ||
        plotterEntry == null
      ) {
        return;
      }

      const micNode = makeNode(micEntry, "demo-audio-mic", 72, 160);
      micNode.data.label = "Microphone";
      micNode.data.defaultConfig = {
        ...micNode.data.defaultConfig,
        enabled: false,
        fftSize: 2048,
        smoothing: 0.8,
        gateEnabled: true,
        gateThreshold: 0.02,
        peakHoldMs: 150,
      };

      const scopeNode = makeNode(scopeEntry, "demo-audio-scope", 420, 80);
      scopeNode.data.label = "Audio Scope";
      scopeNode.data.defaultConfig = {
        ...scopeNode.data.defaultConfig,
        enabled: true,
        mode: "waveform",
        sourceMode: "auto",
        sourceNodeId: "",
      };

      const outNode = makeNode(outEntry, "demo-audio-out", 420, 250);
      outNode.data.label = "Audio Output";
      outNode.data.defaultConfig = {
        ...outNode.data.defaultConfig,
        enabled: false,
        gate: false,
        gain: 0.15,
        maxGain: 0.25,
        limiterEnabled: true,
        sourceMode: "auto",
        sourceNodeId: "",
      };

      const plotterNode = makeNode(
        plotterEntry,
        "demo-audio-plotter",
        420,
        420,
      );
      plotterNode.data.label = "Audio Features (Plotter)";

      const fileNode =
        fileEntry != null
          ? makeNode(fileEntry, "demo-audio-file", 72, 360)
          : null;
      if (fileNode != null) {
        fileNode.data.label = "Audio File Player";
        fileNode.data.defaultConfig = {
          ...fileNode.data.defaultConfig,
          enabled: false,
          gate: false,
          loop: false,
          gain: 0.5,
          url: "",
        };
      }

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-audio-e-mic-scope",
          source: micNode.id,
          target: scopeNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(micNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-audio-e-mic-out",
          source: micNode.id,
          target: outNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(micNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-audio-e1",
          source: micNode.id,
          target: plotterNode.id,
          sourceHandle: "rms",
          targetHandle: "ch1",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-audio-e2",
          source: micNode.id,
          target: plotterNode.id,
          sourceHandle: "peak",
          targetHandle: "ch2",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-audio-e3",
          source: micNode.id,
          target: plotterNode.id,
          sourceHandle: "centroidHz",
          targetHandle: "ch3",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
      ];

      const allNodes =
        fileNode != null
          ? [micNode, fileNode, scopeNode, outNode, plotterNode]
          : [micNode, scopeNode, outNode, plotterNode];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(allNodes, [outNode.id]),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([outNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "audio-file-playback") {
      const fileEntry = catalog.find(
        (entry) => entry.id === "audio-file-player",
      );
      const scopeEntry = catalog.find((entry) => entry.id === "audio-scope");
      const outEntry = catalog.find((entry) => entry.id === "audio-output");
      const plotterEntry = catalog.find((entry) => entry.id === "plotter");
      if (
        fileEntry == null ||
        scopeEntry == null ||
        outEntry == null ||
        plotterEntry == null
      ) {
        return;
      }

      const fileNode = makeNode(fileEntry, "demo-file-player", 72, 200);
      fileNode.data.label = "Audio File Player";
      fileNode.data.defaultConfig = {
        ...fileNode.data.defaultConfig,
        enabled: false,
        gate: false,
        loop: false,
        gain: 0.5,
        url: "",
      };

      const scopeNode = makeNode(scopeEntry, "demo-file-scope", 420, 80);
      scopeNode.data.label = "Audio Scope";
      scopeNode.data.defaultConfig = {
        ...scopeNode.data.defaultConfig,
        enabled: true,
        mode: "waveform",
        sourceMode: "node",
        sourceNodeId: fileNode.id,
      };

      const outNode = makeNode(outEntry, "demo-file-out", 420, 250);
      outNode.data.label = "Audio Output";
      outNode.data.defaultConfig = {
        ...outNode.data.defaultConfig,
        enabled: false,
        gate: false,
        gain: 0.15,
        maxGain: 0.25,
        limiterEnabled: true,
        sourceMode: "node",
        sourceNodeId: fileNode.id,
      };

      const plotterNode = makeNode(plotterEntry, "demo-file-plotter", 420, 420);
      plotterNode.data.label = "File Transport (Plotter)";

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-file-e-audio-scope",
          source: fileNode.id,
          target: scopeNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(fileNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-file-e-audio-out",
          source: fileNode.id,
          target: outNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(fileNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-file-e1",
          source: fileNode.id,
          target: plotterNode.id,
          sourceHandle: "time",
          targetHandle: "ch1",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-file-e2",
          source: fileNode.id,
          target: plotterNode.id,
          sourceHandle: "duration",
          targetHandle: "ch2",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
      ];

      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [fileNode, scopeNode, outNode, plotterNode],
            [fileNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([fileNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "audio-oscillator-tone") {
      const oscEntry = catalog.find((entry) => entry.id === "audio-oscillator");
      const scopeEntry = catalog.find((entry) => entry.id === "audio-scope");
      const outEntry = catalog.find((entry) => entry.id === "audio-output");
      if (oscEntry == null || scopeEntry == null || outEntry == null) {
        return;
      }

      const oscNode = makeNode(oscEntry, "demo-osc", 72, 200);
      oscNode.data.label = "Oscillator (sweep)";
      oscNode.data.defaultConfig = {
        ...oscNode.data.defaultConfig,
        waveform: "sine",
        freqHz: 440,
        detuneCents: 0,
        sweepEnabled: true,
        sweepStartHz: 220,
        sweepEndHz: 880,
        sweepPeriodS: 4,
        gain: 0.05,
        gate: false,
      };

      const scopeNode = makeNode(scopeEntry, "demo-osc-scope", 420, 80);
      scopeNode.data.label = "Audio Scope";
      scopeNode.data.defaultConfig = {
        ...scopeNode.data.defaultConfig,
        enabled: true,
        mode: "waveform",
        sourceMode: "node",
        sourceNodeId: oscNode.id,
      };

      const outNode = makeNode(outEntry, "demo-osc-out", 420, 250);
      outNode.data.label = "Audio Output";
      outNode.data.defaultConfig = {
        ...outNode.data.defaultConfig,
        enabled: false,
        gate: false,
        gain: 0.15,
        maxGain: 0.25,
        limiterEnabled: true,
        sourceMode: "node",
        sourceNodeId: oscNode.id,
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-osc-e1",
          source: oscNode.id,
          target: scopeNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(oscNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-osc-e2",
          source: oscNode.id,
          target: outNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(oscNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
      ];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection([oscNode, scopeNode, outNode], [oscNode.id]),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([oscNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "audio-machine-rpm") {
      const rampEntry = catalog.find((entry) => entry.id === "ramp-sim");
      const machineEntry = catalog.find((entry) => entry.id === "audio-machine");
      const scopeEntry = catalog.find((entry) => entry.id === "audio-scope");
      const outEntry = catalog.find((entry) => entry.id === "audio-output");
      if (rampEntry == null || machineEntry == null || scopeEntry == null || outEntry == null) {
        return;
      }

      const rampNode = makeNode(rampEntry, "demo-rpm-ramp", 72, 200);
      rampNode.data.label = "RPM ramp";
      rampNode.data.defaultConfig = {
        ...rampNode.data.defaultConfig,
        rate: 0.12,
        min: 0,
        max: 1,
        wrap: true,
      };

      const machineNode = makeNode(machineEntry, "demo-rpm-machine", 320, 200);
      machineNode.data.label = "Audio Machine (EV motor)";
      machineNode.data.defaultConfig = {
        ...machineNode.data.defaultConfig,
        family: "motor",
        preset: "ev-motor",
        enabled: true,
        speed: 0,
        load: 0.35,
        gain: 0.11,
      };

      const scopeNode = makeNode(scopeEntry, "demo-rpm-scope", 600, 80);
      scopeNode.data.label = "Audio Scope";
      scopeNode.data.defaultConfig = {
        ...scopeNode.data.defaultConfig,
        enabled: true,
        mode: "spectrum",
      };

      const outNode = makeNode(outEntry, "demo-rpm-out", 600, 250);
      outNode.data.label = "Audio Output";
      outNode.data.defaultConfig = {
        ...outNode.data.defaultConfig,
        enabled: false,
        gate: false,
        gain: 0.18,
        maxGain: 0.25,
        limiterEnabled: true,
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-rpm-e1",
          source: rampNode.id,
          target: machineNode.id,
          sourceHandle: "out",
          targetHandle: "speed",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-rpm-e2",
          source: machineNode.id,
          target: scopeNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(machineNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-rpm-e3",
          source: machineNode.id,
          target: outNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(machineNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
      ];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [rampNode, machineNode, scopeNode, outNode],
            [machineNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([machineNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "audio-machine-map-range") {
      const sineEntry = catalog.find((entry) => entry.id === "sine-wave");
      const mapEntry = catalog.find((entry) => entry.id === "map-range");
      const machineEntry = catalog.find((entry) => entry.id === "audio-machine");
      const scopeEntry = catalog.find((entry) => entry.id === "audio-scope");
      const outEntry = catalog.find((entry) => entry.id === "audio-output");
      if (
        sineEntry == null ||
        mapEntry == null ||
        machineEntry == null ||
        scopeEntry == null ||
        outEntry == null
      ) {
        return;
      }

      const sineNode = makeNode(sineEntry, "demo-map-sine", 72, 200);
      sineNode.data.label = "Speed proxy (sine)";
      sineNode.data.defaultConfig = {
        ...sineNode.data.defaultConfig,
        frequency: 0.07,
        amplitude: 1,
        offset: 0,
        phase: 0,
      };

      const mapNode = makeNode(mapEntry, "demo-map-range", 280, 200);
      mapNode.data.label = "Map to 0..1";
      mapNode.data.defaultConfig = {
        ...mapNode.data.defaultConfig,
        inMin: -1,
        inMax: 1,
        outMin: 0,
        outMax: 1,
        clamp: true,
      };

      const machineNode = makeNode(machineEntry, "demo-map-machine", 500, 200);
      machineNode.data.label = "Audio Machine (conveyor)";
      machineNode.data.defaultConfig = {
        ...machineNode.data.defaultConfig,
        family: "machine",
        preset: "conveyor",
        enabled: true,
        speed: 0.35,
        load: 0.4,
        gain: 0.1,
      };

      const scopeNode = makeNode(scopeEntry, "demo-map-scope", 760, 80);
      scopeNode.data.label = "Audio Scope";
      scopeNode.data.defaultConfig = {
        ...scopeNode.data.defaultConfig,
        enabled: true,
        mode: "spectrum",
      };

      const outNode = makeNode(outEntry, "demo-map-out", 760, 250);
      outNode.data.label = "Audio Output";
      outNode.data.defaultConfig = {
        ...outNode.data.defaultConfig,
        enabled: false,
        gate: false,
        gain: 0.18,
        maxGain: 0.25,
        limiterEnabled: true,
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-map-e1",
          source: sineNode.id,
          target: mapNode.id,
          sourceHandle: "out",
          targetHandle: "value",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-map-e2",
          source: mapNode.id,
          target: machineNode.id,
          sourceHandle: "out",
          targetHandle: "speed",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-map-e3",
          source: machineNode.id,
          target: scopeNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(machineNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-map-e4",
          source: machineNode.id,
          target: outNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(machineNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
      ];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [sineNode, mapNode, machineNode, scopeNode, outNode],
            [machineNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([machineNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "audio-machine-fault-lab") {
      const sineEntry = catalog.find((entry) => entry.id === "sine-wave");
      const mapEntry = catalog.find((entry) => entry.id === "map-range");
      const thresholdEntry = catalog.find((entry) => entry.id === "threshold");
      const machineEntry = catalog.find((entry) => entry.id === "audio-machine");
      const sfxEntry = catalog.find((entry) => entry.id === "audio-sfx");
      const scopeEntry = catalog.find((entry) => entry.id === "audio-scope");
      const outEntry = catalog.find((entry) => entry.id === "audio-output");
      if (
        sineEntry == null ||
        mapEntry == null ||
        thresholdEntry == null ||
        machineEntry == null ||
        sfxEntry == null ||
        scopeEntry == null ||
        outEntry == null
      ) {
        return;
      }

      const sineNode = makeNode(sineEntry, "demo-fault-sine", 40, 220);
      sineNode.data.label = "Speed proxy";
      sineNode.data.defaultConfig = {
        ...sineNode.data.defaultConfig,
        frequency: 0.05,
        amplitude: 1,
        offset: 0,
      };

      const mapNode = makeNode(mapEntry, "demo-fault-map", 240, 220);
      mapNode.data.label = "Map to 0..1";
      mapNode.data.defaultConfig = {
        ...mapNode.data.defaultConfig,
        inMin: -1,
        inMax: 1,
        outMin: 0,
        outMax: 1,
        clamp: true,
      };

      const thresholdNode = makeNode(thresholdEntry, "demo-fault-threshold", 440, 120);
      thresholdNode.data.label = "High speed fault";
      thresholdNode.data.defaultConfig = {
        ...thresholdNode.data.defaultConfig,
        operator: ">",
        value: 0.88,
      };

      const machineNode = makeNode(machineEntry, "demo-fault-machine", 440, 260);
      machineNode.data.label = "Press (clank)";
      machineNode.data.defaultConfig = {
        ...machineNode.data.defaultConfig,
        family: "machine",
        preset: "press",
        enabled: true,
        load: 0.45,
        gain: 0.12,
      };

      const sfxNode = makeNode(sfxEntry, "demo-fault-sfx", 440, 400);
      sfxNode.data.label = "Fault beep";
      sfxNode.data.defaultConfig = {
        ...sfxNode.data.defaultConfig,
        preset: "beep",
        enabled: true,
        gain: 0.15,
      };

      const scopeNode = makeNode(scopeEntry, "demo-fault-scope", 700, 80);
      scopeNode.data.defaultConfig = {
        ...scopeNode.data.defaultConfig,
        enabled: true,
        mode: "waveform",
      };

      const outNode = makeNode(outEntry, "demo-fault-out", 700, 260);
      outNode.data.defaultConfig = {
        ...outNode.data.defaultConfig,
        enabled: false,
        gate: false,
        gain: 0.18,
        maxGain: 0.25,
        limiterEnabled: true,
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-fault-e1",
          source: sineNode.id,
          target: mapNode.id,
          sourceHandle: "out",
          targetHandle: "value",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-fault-e2",
          source: mapNode.id,
          target: machineNode.id,
          sourceHandle: "out",
          targetHandle: "speed",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-fault-e3",
          source: mapNode.id,
          target: thresholdNode.id,
          sourceHandle: "out",
          targetHandle: "in",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-fault-e4",
          source: thresholdNode.id,
          target: machineNode.id,
          sourceHandle: "out",
          targetHandle: "trigger",
          animated: true,
          label: "boolean",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-fault-e5",
          source: thresholdNode.id,
          target: sfxNode.id,
          sourceHandle: "out",
          targetHandle: "trigger",
          animated: true,
          label: "boolean",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-fault-e6",
          source: machineNode.id,
          target: scopeNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(machineNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-fault-e7",
          source: machineNode.id,
          target: outNode.id,
          sourceHandle: "audio",
          targetHandle: "audio",
          animated: true,
          label: getSourcePortType(machineNode, "audio", {}) ?? "audioBus",
          style: { strokeWidth: 2 },
        },
      ];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [sineNode, mapNode, thresholdNode, machineNode, sfxNode, scopeNode, outNode],
            [machineNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([machineNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "camera-video-texture") {
      const cameraEntry = catalog.find((entry) => entry.id === "camera-input");
      const textureEntry = catalog.find((entry) => entry.id === "video-texture");
      const poseEntry = catalog.find((entry) => entry.id === "vision-pose");
      if (cameraEntry == null || textureEntry == null) {
        return;
      }

      const cameraNode = makeNode(cameraEntry, "demo-cam-in", 80, 200);
      cameraNode.data.label = "Webcam";
      cameraNode.data.defaultConfig = {
        ...cameraNode.data.defaultConfig,
        enabled: true,
        width: 1280,
        height: 720,
        targetFps: 30,
        facingMode: "user",
        mirrorPreview: true,
      };

      const textureNode = makeNode(textureEntry, "demo-cam-tex", 380, 200);
      textureNode.data.label = "Video Texture";

      const demoNodes: StudioNode[] = [cameraNode, textureNode];
      const demoEdges: Edge[] = [
        {
          id: "demo-cam-e1",
          source: cameraNode.id,
          target: textureNode.id,
          sourceHandle: "video",
          targetHandle: "in",
          animated: true,
          label: getSourcePortType(cameraNode, "video", {}) ?? "videoBus",
          style: { strokeWidth: 2 },
        },
      ];

      if (poseEntry != null) {
        const poseNode = makeNode(poseEntry, "demo-cam-pose", 380, 380);
        poseNode.data.label = "Vision Pose";
        demoNodes.push(poseNode);
        demoEdges.push({
          id: "demo-cam-e2",
          source: cameraNode.id,
          target: poseNode.id,
          sourceHandle: "video",
          targetHandle: "in",
          animated: true,
          label: getSourcePortType(cameraNode, "video", {}) ?? "videoBus",
          style: { strokeWidth: 2 },
        });
      }

      get().pushUndoSnapshot();
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(demoNodes, [cameraNode.id]),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([cameraNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "animation-clip-blend") {
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const viewerEntry = catalog.find((entry) => entry.id === "model-viewer");
      const clipEntry = catalog.find((entry) => entry.id === "animation-clip");
      const blendEntry = catalog.find((entry) => entry.id === "animation-blend");
      const sineEntry = catalog.find((entry) => entry.id === "sine-wave");
      const mapEntry = catalog.find((entry) => entry.id === "map-range");
      if (
        modelEntry == null ||
        viewerEntry == null ||
        clipEntry == null ||
        blendEntry == null ||
        sineEntry == null ||
        mapEntry == null
      ) {
        return;
      }

      const modelFlowId = "demo-model-select";
      const clipAId = "demo-clip-a";
      const clipBId = "demo-clip-b";

      const modelNode = makeNode(modelEntry, modelFlowId, 72, 480);
      modelNode.data.label = "Model Source (PSoC E84)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
        selectedModelUrl: DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
        generatedChildNodeIds: [clipAId, clipBId],
      };

      const viewerNode = makeNode(viewerEntry, "demo-model-viewer", 720, 200);
      viewerNode.data.label = "Model Viewer (clip blend)";
      viewerNode.data.defaultConfig = {
        ...viewerNode.data.defaultConfig,
        showGrid: true,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      };

      const clipANode = makeNode(clipEntry, clipAId, 72, 280);
      clipANode.data.label = "Animation Clip A";
      clipANode.data.defaultConfig = {
        ...clipANode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
        loopMode: "loop",
        weight: 1,
        enabled: true,
      };

      const clipBNode = makeNode(clipEntry, clipBId, 72, 400);
      clipBNode.data.label = "Animation Clip B";
      clipBNode.data.defaultConfig = {
        ...clipBNode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
        loopMode: "loop",
        weight: 1,
        enabled: true,
      };

      const blendNode = makeNode(blendEntry, "demo-anim-blend", 480, 320);
      blendNode.data.label = "Animation Blend";
      blendNode.data.defaultConfig = {
        ...blendNode.data.defaultConfig,
        factor: 0.5,
        crossfadeS: 0.35,
      };

      const sineNode = makeNode(sineEntry, "demo-blend-sine", 72, 120);
      sineNode.data.label = "Blend driver (sine)";
      sineNode.data.defaultConfig = {
        ...sineNode.data.defaultConfig,
        frequency: 0.05,
        amplitude: 1,
        offset: 0,
        phase: 0,
      };

      const mapNode = makeNode(mapEntry, "demo-blend-map", 280, 120);
      mapNode.data.label = "Map to 0..1";
      mapNode.data.defaultConfig = {
        ...mapNode.data.defaultConfig,
        inMin: -1,
        inMax: 1,
        outMin: 0,
        outMax: 1,
        clamp: true,
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-clip-blend-e1",
          source: modelNode.id,
          target: viewerNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-clip-blend-e1a",
          source: modelNode.id,
          target: clipANode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_MODEL,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-clip-blend-e1b",
          source: modelNode.id,
          target: clipBNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_MODEL,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-clip-blend-e2",
          source: clipANode.id,
          target: blendNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: "a",
          animated: true,
          label: getSourcePortType(clipANode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-clip-blend-e3",
          source: clipBNode.id,
          target: blendNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: "b",
          animated: true,
          label: getSourcePortType(clipBNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-clip-blend-e4",
          source: blendNode.id,
          target: viewerNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_ANIM,
          animated: true,
          label: getSourcePortType(blendNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-clip-blend-e5",
          source: sineNode.id,
          target: mapNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: "value",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-clip-blend-e6",
          source: mapNode.id,
          target: blendNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: "factor",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
      ];

      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [modelNode, viewerNode, clipANode, clipBNode, blendNode, sineNode, mapNode],
            [viewerNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([viewerNode.id]),
      });
      flushFlowSimulationPins(get);
      scheduleGlbExtractAutoBindForNodes(get, set, [clipAId, clipBId]);
      return;
    }

    if (templateId === "part-spin-demo") {
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const viewerEntry = catalog.find((entry) => entry.id === "model-viewer");
      const spinEntry = catalog.find((entry) => entry.id === "part-spin");
      const sineEntry = catalog.find((entry) => entry.id === "sine-wave");
      const mapEntry = catalog.find((entry) => entry.id === "map-range");
      if (
        modelEntry == null ||
        viewerEntry == null ||
        spinEntry == null ||
        sineEntry == null ||
        mapEntry == null
      ) {
        return;
      }

      const modelFlowId = "demo-model-select";
      const spinAId = "demo-part-spin-a";
      const spinBId = "demo-part-spin-b";
      const partSpinDemoAssetId = "model.tesa-drone";
      const partSpinDemoModelPath = "models/tesa-drone/tesa-drone.glb";

      const modelNode = makeNode(modelEntry, modelFlowId, 72, 480);
      modelNode.data.label = "Model Source (TESA drone)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: partSpinDemoAssetId,
        selectedModelUrl: partSpinDemoModelPath,
        generatedChildNodeIds: [spinAId, spinBId],
      };

      const viewerNode = makeNode(viewerEntry, "demo-model-viewer", 720, 280);
      viewerNode.data.label = "Model Viewer (part spin)";
      viewerNode.data.defaultConfig = {
        ...viewerNode.data.defaultConfig,
        showGrid: true,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      };

      const spinANode = makeNode(spinEntry, spinAId, 72, 280);
      spinANode.data.label = "Part Spin A";
      spinANode.data.defaultConfig = {
        ...spinANode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
        spinAxis: "y",
        speedRadS: Math.PI * 4,
        enabled: true,
      };

      const spinBNode = makeNode(spinEntry, spinBId, 72, 400);
      spinBNode.data.label = "Part Spin B";
      spinBNode.data.defaultConfig = {
        ...spinBNode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
        spinAxis: "y",
        speedRadS: Math.PI * 2,
        reverse: true,
        enabled: true,
      };

      const sineNode = makeNode(sineEntry, "demo-spin-sine", 72, 120);
      sineNode.data.label = "Speed driver (sine)";
      sineNode.data.defaultConfig = {
        ...sineNode.data.defaultConfig,
        frequency: 0.08,
        amplitude: 3,
        offset: 4,
        phase: 0,
      };

      const mapNode = makeNode(mapEntry, "demo-spin-map", 280, 120);
      mapNode.data.label = "Map to rad/s";
      mapNode.data.defaultConfig = {
        ...mapNode.data.defaultConfig,
        inMin: 1,
        inMax: 7,
        outMin: 0.5,
        outMax: 12,
        clamp: true,
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-part-spin-e1",
          source: modelNode.id,
          target: viewerNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-part-spin-e2",
          source: sineNode.id,
          target: mapNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: "value",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-part-spin-e3",
          source: mapNode.id,
          target: spinANode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: "speed",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
      ];

      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [modelNode, viewerNode, spinANode, spinBNode, sineNode, mapNode],
            [viewerNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([viewerNode.id]),
      });
      flushFlowSimulationPins(get);
      scheduleGlbExtractAutoBindForNodes(get, set, [spinAId, spinBId]);
      return;
    }

    if (templateId === "animation-mix-demo") {
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const viewerEntry = catalog.find((entry) => entry.id === "model-viewer");
      const clipEntry = catalog.find((entry) => entry.id === "animation-clip");
      const mixEntry = catalog.find((entry) => entry.id === "animation-mix");
      const sineEntry = catalog.find((entry) => entry.id === "sine-wave");
      const mapEntry = catalog.find((entry) => entry.id === "map-range");
      if (
        modelEntry == null ||
        viewerEntry == null ||
        clipEntry == null ||
        mixEntry == null ||
        sineEntry == null ||
        mapEntry == null
      ) {
        return;
      }

      const modelFlowId = "demo-model-select";
      const clipAId = "demo-mix-clip-a";
      const clipBId = "demo-mix-clip-b";
      const clipCId = "demo-mix-clip-c";
      const mixDemoAssetId = "model.tesa-drone";
      const mixDemoModelPath = "models/tesa-drone/tesa-drone.glb";
      const mixInputCount = 3;

      const modelNode = makeNode(modelEntry, modelFlowId, 72, 520);
      modelNode.data.label = "Model Source (TESA drone)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: mixDemoAssetId,
        selectedModelUrl: mixDemoModelPath,
        generatedChildNodeIds: [clipAId, clipBId, clipCId],
      };

      const viewerNode = makeNode(viewerEntry, "demo-model-viewer", 760, 240);
      viewerNode.data.label = "Model Viewer (animation mix)";
      viewerNode.data.defaultConfig = {
        ...viewerNode.data.defaultConfig,
        showGrid: true,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      };

      const clipNodes = [clipAId, clipBId, clipCId].map((id, index) => {
        const clipNode = makeNode(clipEntry, id, 72, 200 + index * 110);
        clipNode.data.label = `Animation Clip ${String.fromCharCode(65 + index)}`;
        clipNode.data.defaultConfig = {
          ...clipNode.data.defaultConfig,
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
          loopMode: "loop",
          weight: 1,
          enabled: true,
        };
        return clipNode;
      });

      const mixNode = makeNode(mixEntry, "demo-anim-mix", 500, 300);
      mixNode.data.label = "Animation Mix";
      mixNode.data.defaultConfig = {
        ...mixNode.data.defaultConfig,
        [ANIMATION_MERGE_INPUT_COUNT_KEY]: mixInputCount,
        [ANIMATION_MIX_WEIGHTS_KEY]: defaultEqualMixWeights(mixInputCount),
        [ANIMATION_MIX_NORMALIZE_WEIGHTS_KEY]: true,
      };
      mixNode.data.inputHandles = computeAnimationMixInputHandles(mixNode.data.defaultConfig);
      mixNode.data.outputHandles = [ANIMATION_MIX_OUTPUT_HANDLE];

      const sineNode = makeNode(sineEntry, "demo-mix-sine", 72, 80);
      sineNode.data.label = "Mix weight driver (sine)";
      sineNode.data.defaultConfig = {
        ...sineNode.data.defaultConfig,
        frequency: 0.04,
        amplitude: 1,
        offset: 0,
        phase: 0,
      };

      const mapNode = makeNode(mapEntry, "demo-mix-map", 280, 80);
      mapNode.data.label = "Map to 0..1";
      mapNode.data.defaultConfig = {
        ...mapNode.data.defaultConfig,
        inMin: -1,
        inMax: 1,
        outMin: 0,
        outMax: 1,
        clamp: true,
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-mix-e-model-viewer",
          source: modelNode.id,
          target: viewerNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
        ...clipNodes.map((clipNode, index) => ({
          id: `demo-mix-e-model-clip-${index}`,
          source: modelNode.id,
          target: clipNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_MODEL,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        })),
        ...clipNodes.map((clipNode, index) => ({
          id: `demo-mix-e-clip-${index}`,
          source: clipNode.id,
          target: mixNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: animationMergeInputHandleId(index),
          animated: true,
          label: getSourcePortType(clipNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
          style: { strokeWidth: 2 },
        })),
        {
          id: "demo-mix-e-mix-viewer",
          source: mixNode.id,
          target: viewerNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_ANIM,
          animated: true,
          label: getSourcePortType(mixNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-mix-e-sine-map",
          source: sineNode.id,
          target: mapNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: "value",
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-mix-e-map-weight",
          source: mapNode.id,
          target: mixNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: animationMixWeightHandleId(0),
          animated: true,
          label: "number",
          style: { strokeWidth: 2 },
        },
      ];

      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [modelNode, viewerNode, ...clipNodes, mixNode, sineNode, mapNode],
            [viewerNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([viewerNode.id]),
      });
      flushFlowSimulationPins(get);
      scheduleGlbExtractAutoBindForNodes(get, set, [clipAId, clipBId, clipCId]);
      return;
    }

    if (templateId === "rotation-glb-anim") {
      const eulerTapEntry = catalog.find(
        (entry) => entry.id === "bmi270-tap-euler",
      );
      const rotEulerEntry = catalog.find(
        (entry) => entry.id === "rotation-3d-euler",
      );
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const bundleEntry = catalog.find(
        (entry) => entry.id === "glb-animation-bundle",
      );
      const onClickEntry = catalog.find((entry) => entry.id === "on-click");
      const triggerEntry = catalog.find(
        (entry) => entry.id === "event-trigger-glb-anim",
      );
      if (
        eulerTapEntry == null ||
        rotEulerEntry == null ||
        modelEntry == null ||
        bundleEntry == null ||
        onClickEntry == null ||
        triggerEntry == null
      ) {
        return;
      }

      const modelFlowId = "demo-model-select";
      const rotScene3d = persistScene3DConfig({
        ...defaultScene3DConfig(),
        model: {
          ...defaultScene3DConfig().model,
          url: DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
          studioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
        },
      });

      const eulerTapNode = makeNode(eulerTapEntry, "demo-euler-tap", 72, 180);
      const rotNode = makeNode(rotEulerEntry, "demo-rot-euler", 380, 80);
      rotNode.data.label = "3D Rotation (IMU + GLB anim)";
      rotNode.data.defaultConfig = {
        ...rotNode.data.defaultConfig,
        showGrid: true,
        scene3d: rotScene3d,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      };
      const modelNode = makeNode(modelEntry, modelFlowId, 72, 360);
      modelNode.data.label = "Model Source (PSoC E84)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
        selectedModelUrl: DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
        generatedChildNodeIds: ["demo-anim-bundle", "demo-glb-anim-trigger"],
      };

      const bundleNode = makeNode(bundleEntry, "demo-anim-bundle", 72, 480);
      bundleNode.data.defaultConfig = mergeLabDefaultsIntoGlbAnimationBundleConfig({
        ...bundleNode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      });

      const onClickNode = makeNode(onClickEntry, "demo-on-click", 72, 600);
      const triggerNode = makeNode(
        triggerEntry,
        "demo-glb-anim-trigger",
        260,
        600,
      );
      triggerNode.data.defaultConfig = {
        ...triggerNode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
        loopMode: "once",
      };

      get().pushUndoSnapshot();
      const demoEdges: Edge[] = [
        {
          id: "demo-rot-e1",
          source: eulerTapNode.id,
          target: rotNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label:
            getSourcePortType(eulerTapNode, STUDIO_HANDLE_OUT) ?? "vector3",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-rot-e2",
          source: bundleNode.id,
          target: rotNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_ANIM,
          animated: true,
          label:
            getSourcePortType(bundleNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-rot-e3",
          source: onClickNode.id,
          target: triggerNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(onClickNode, STUDIO_HANDLE_OUT) ?? "event",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-rot-e4",
          source: modelNode.id,
          target: triggerNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_MODEL,
          animated: true,
          label: getSourcePortType(modelNode, STUDIO_HANDLE_OUT) ?? "string",
          style: { strokeWidth: 2 },
        },
      ];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [
              eulerTapNode,
              rotNode,
              modelNode,
              bundleNode,
              onClickNode,
              triggerNode,
            ],
            [rotNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([rotNode.id]),
      });
      flushFlowSimulationPins(get);
      scheduleGlbExtractAutoBindForNodes(get, set, [triggerNode.id]);
      return;
    }

    if (templateId === "vector-magnitude") {
      const vectorEntry = catalog.find(
        (entry) => entry.id === "vector-constant",
      );
      const lengthEntry = catalog.find((entry) => entry.id === "vector-length");
      const barMeterEntry = catalog.find((entry) => entry.id === "bar-meter");
      if (vectorEntry == null || lengthEntry == null || barMeterEntry == null) {
        return;
      }
      const vecNode = makeNode(vectorEntry, "demo-vector-const", 72, 156);
      vecNode.data.label = "Vector (3, 4, 0)";
      vecNode.data.defaultConfig = {
        ...vecNode.data.defaultConfig,
        x: 3,
        y: 4,
        z: 0,
      };
      const lenNode = makeNode(lengthEntry, "demo-vector-length", 360, 156);
      const gaugeNode = makeNode(
        barMeterEntry,
        "demo-vector-length-gauge",
        660,
        156,
      );
      gaugeNode.data.label = "Bar meter (|v|)";
      gaugeNode.data.defaultConfig = {
        ...gaugeNode.data.defaultConfig,
        min: 0,
        max: 10,
        decimals: 2,
        unit: "",
        orientation: "horizontal",
      };
      get().pushUndoSnapshot();
      const vecDemoEdges: Edge[] = [
        {
          id: "demo-vec-len-e1",
          source: vecNode.id,
          target: lenNode.id,
          sourceHandle: "out",
          targetHandle: "in",
          animated: true,
          label: getSourcePortType(vecNode, "out") ?? "vector3",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-vec-len-e2",
          source: lenNode.id,
          target: gaugeNode.id,
          sourceHandle: "out",
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(lenNode, "out") ?? "number",
          style: { strokeWidth: 2 },
        },
      ];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [vecNode, lenNode, gaugeNode],
            [gaugeNode.id],
          ),
          vecDemoEdges,
        ),
        edges: vecDemoEdges,
        ...selectionFromIds([gaugeNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    if (templateId === "bmi270-gauge-z") {
      const bmi270Entry = catalog.find((entry) => entry.id === "bmi270-input");
      const vectorSplitterEntry = catalog.find(
        (entry) => entry.id === "vector-splitter",
      );
      const barMeterEntry = catalog.find((entry) => entry.id === "bar-meter");
      if (
        bmi270Entry == null ||
        vectorSplitterEntry == null ||
        barMeterEntry == null
      ) {
        return;
      }
      const bmiNode = makeNode(bmi270Entry, "demo-bmi270", 72, 156);
      const splitNode = makeNode(
        vectorSplitterEntry,
        "demo-vec-split",
        360,
        156,
      );
      const gaugeNode = makeNode(barMeterEntry, "demo-bar-meter-bmi", 660, 156);
      gaugeNode.data.label = "Bar meter (accel Z)";
      gaugeNode.data.defaultConfig = {
        ...gaugeNode.data.defaultConfig,
        min: -5,
        max: 5,
        decimals: 3,
        unit: " m/s²",
        orientation: "horizontal",
      };
      get().pushUndoSnapshot();
      const bmiDemoEdges: Edge[] = [
        {
          id: "demo-bmi-e1",
          source: bmiNode.id,
          target: splitNode.id,
          sourceHandle: "accel",
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(bmiNode, "accel") ?? "vector3",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-bmi-e2",
          source: splitNode.id,
          target: gaugeNode.id,
          sourceHandle: "z",
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: getSourcePortType(splitNode, "z") ?? "number",
          style: { strokeWidth: 2 },
        },
      ];
      set({
        nodes: attachConfigErrorsWithModelChildRegistry(
          applyStudioFlowSelection(
            [bmiNode, splitNode, gaugeNode],
            [gaugeNode.id],
          ),
          bmiDemoEdges,
        ),
        edges: bmiDemoEdges,
        ...selectionFromIds([gaugeNode.id]),
      });
      flushFlowSimulationPins(get);
      return;
    }

    const sensor = catalog.find((entry) => entry.id === "sensor-input");
    const lowPass = catalog.find((entry) => entry.id === "low-pass");
    const threshold = catalog.find((entry) => entry.id === "threshold");
    const indicator = catalog.find((entry) => entry.id === "indicator");
    const barMeter = catalog.find((entry) => entry.id === "bar-meter");
    const sparkline = catalog.find((entry) => entry.id === "sparkline");

    if (
      sensor == null ||
      lowPass == null ||
      threshold == null ||
      indicator == null ||
      barMeter == null ||
      sparkline == null
    ) {
      return;
    }

    const typeFor = (node: StudioNode) => node.data.outputType ?? "";
    const sensorNode = makeNode(sensor, "demo-sensor", 80, 140);
    const lowPassNode = makeNode(lowPass, "demo-lowpass", 330, 140);
    const thresholdNode = makeNode(threshold, "demo-threshold", 580, 140);
    const indicatorNode = makeNode(indicator, "demo-indicator", 840, 120);
    const gaugeNode = makeNode(barMeter, "demo-bar-meter", 840, 220);
    gaugeNode.data.defaultConfig = {
      ...gaugeNode.data.defaultConfig,
      orientation: "horizontal",
    };
    const sparklineNode = makeNode(sparkline, "demo-sparkline", 580, 300);

    let templateNodes: StudioNode[] = [];
    let templateEdges: Edge[] = [];
    let selectedNodeId = sensorNode.id;

    if (templateId === "basic-indicator") {
      templateNodes = [sensorNode, thresholdNode, indicatorNode];
      templateEdges = [
        {
          id: "demo-e1",
          source: sensorNode.id,
          target: thresholdNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(sensorNode),
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-e2",
          source: thresholdNode.id,
          target: indicatorNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(thresholdNode),
          style: { strokeWidth: 2 },
        },
      ];
      selectedNodeId = thresholdNode.id;
    } else if (templateId === "gauge-monitor") {
      templateNodes = [sensorNode, gaugeNode, sparklineNode];
      templateEdges = [
        {
          id: "demo-e1",
          source: sensorNode.id,
          target: gaugeNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(sensorNode),
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-e2",
          source: sensorNode.id,
          target: sparklineNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(sensorNode),
          style: { strokeWidth: 2 },
        },
      ];
      selectedNodeId = gaugeNode.id;
    } else {
      templateNodes = [
        sensorNode,
        lowPassNode,
        thresholdNode,
        indicatorNode,
        gaugeNode,
        sparklineNode,
      ];
      templateEdges = [
        {
          id: "demo-e1",
          source: sensorNode.id,
          target: lowPassNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(sensorNode),
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-e2",
          source: lowPassNode.id,
          target: thresholdNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(lowPassNode),
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-e3",
          source: thresholdNode.id,
          target: indicatorNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(thresholdNode),
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-e4",
          source: lowPassNode.id,
          target: gaugeNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(lowPassNode),
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-e5",
          source: lowPassNode.id,
          target: sparklineNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
          animated: true,
          label: typeFor(lowPassNode),
          style: { strokeWidth: 2 },
        },
      ];
      selectedNodeId = lowPassNode.id;
    }

    get().pushUndoSnapshot();
    set({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(templateNodes, [selectedNodeId]),
        templateEdges,
      ),
      edges: templateEdges,
      ...selectionFromIds([selectedNodeId]),
    });
    flushFlowSimulationPins(get);
  },
  spawnGlbAnimationSetupGraph: (parentModelFlowNodeId, clipRefs, catalog, combinerMode = "merge") => {
    const clips = clipRefs
      .map((ref) => ref.trim())
      .filter((ref) => ref.length > 0);
    if (clips.length === 0 || clips.length > 8) {
      return;
    }

    const st = get();
    const parent = st.nodes.find((n) => n.id === parentModelFlowNodeId);
    if (parent == null || parent.data.nodeId !== "model-select") {
      return;
    }

    const clipEntry = catalog.find((entry) => entry.id === "animation-clip");
    const mergeEntry = catalog.find((entry) => entry.id === "animation-merge");
    const mixEntry = catalog.find((entry) => entry.id === "animation-mix");
    const blendEntry = catalog.find((entry) => entry.id === "animation-blend");
    const viewerEntry = catalog.find((entry) => entry.id === "model-viewer");
    if (clipEntry == null || viewerEntry == null) {
      return;
    }
    if (clips.length === 2 && blendEntry == null) {
      return;
    }
    if (clips.length >= 3) {
      if (combinerMode === "mix" && mixEntry == null) {
        return;
      }
      if (combinerMode !== "mix" && mergeEntry == null) {
        return;
      }
    }

    const makeSetupNode = (
      entry: NodeCatalogEntry,
      id: string,
      x: number,
      y: number,
    ): StudioNode => {
      const inferred = inferPortTypes(entry);
      return {
        id,
        type: "studio",
        position: { x, y },
        data: {
          label: entry.title,
          category: entry.category,
          nodeId: entry.id,
          defaultConfig: { ...entry.defaultConfig },
          inputType: inferred.inputType,
          outputType: inferred.outputType,
          outputHandles: inferred.outputHandles,
          inputHandles: inferred.inputHandles,
          liveValue: null,
          liveHistory: [],
          livePlotHistory: {},
        },
      };
    };

    const stamp = Date.now();
    const px = parent.position.x;
    const py = parent.position.y;

    const clipNodes = clips.map((ref, index) => {
      const node = makeSetupNode(
        clipEntry,
        `setup-clip-${stamp}-${index}`,
        px + 280,
        py + index * 120,
      );
      node.data.label = `Clip: ${ref}`;
      node.data.defaultConfig = {
        ...node.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: parentModelFlowNodeId,
        [STUDIO_GLB_EXTRACT_KIND_KEY]: "animation",
        [STUDIO_GLB_EXTRACT_REF_KEY]: ref,
        [ANIMATION_CLIP_NAME_KEY]: ref,
        loopMode: "loop",
        enabled: true,
      };
      return node;
    });

    const edges: Edge[] = [];
    clipNodes.forEach((clipNode, index) => {
      edges.push({
        id: `setup-e-${stamp}-model-${index}`,
        source: parentModelFlowNodeId,
        target: clipNode.id,
        sourceHandle: STUDIO_HANDLE_OUT,
        targetHandle: STUDIO_HANDLE_MODEL,
        animated: true,
        label: getSourcePortType(parent, STUDIO_HANDLE_OUT) ?? "string",
        style: { strokeWidth: 2 },
      });
    });
    let animSourceNode = clipNodes[0]!;
    let combinerNode: StudioNode | null = null;

    if (clips.length === 2) {
      combinerNode = makeSetupNode(blendEntry!, `setup-blend-${stamp}`, px + 560, py + 60);
      combinerNode.data.label = "Animation Blend";
      animSourceNode = combinerNode;
      clipNodes.forEach((clipNode, index) => {
        edges.push({
          id: `setup-e-${stamp}-clip-${index}`,
          source: clipNode.id,
          target: combinerNode!.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: index === 0 ? "a" : "b",
          animated: true,
          label: getSourcePortType(clipNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
          style: { strokeWidth: 2 },
        });
      });
    } else if (clips.length >= 3) {
      if (combinerMode === "mix") {
        combinerNode = makeSetupNode(mixEntry!, `setup-mix-${stamp}`, px + 560, py + 120);
        combinerNode.data.label = "Animation Mix";
        combinerNode.data.defaultConfig = {
          ...combinerNode.data.defaultConfig,
          [ANIMATION_MERGE_INPUT_COUNT_KEY]: clips.length,
          [ANIMATION_MIX_WEIGHTS_KEY]: defaultEqualMixWeights(clips.length),
          [ANIMATION_MIX_NORMALIZE_WEIGHTS_KEY]: true,
        };
        combinerNode.data.inputHandles = computeAnimationMixInputHandles(
          combinerNode.data.defaultConfig,
        );
        combinerNode.data.outputHandles = [ANIMATION_MIX_OUTPUT_HANDLE];
      } else {
        combinerNode = makeSetupNode(mergeEntry!, `setup-merge-${stamp}`, px + 560, py + 120);
        combinerNode.data.label = "Animation Merge";
        combinerNode.data.defaultConfig = {
          ...combinerNode.data.defaultConfig,
          [ANIMATION_MERGE_INPUT_COUNT_KEY]: clips.length,
        };
        combinerNode.data.inputHandles = computeAnimationMergeInputHandles(
          combinerNode.data.defaultConfig,
        );
        combinerNode.data.outputHandles = [ANIMATION_MERGE_OUTPUT_HANDLE];
      }
      animSourceNode = combinerNode;
      clipNodes.forEach((clipNode, index) => {
        edges.push({
          id: `setup-e-${stamp}-clip-${index}`,
          source: clipNode.id,
          target: combinerNode!.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: animationMergeInputHandleId(index),
          animated: true,
          label: getSourcePortType(clipNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
          style: { strokeWidth: 2 },
        });
      });
    }

    const viewerNode = makeSetupNode(viewerEntry, `setup-viewer-${stamp}`, px + 840, py + 60);
    viewerNode.data.label = "Model Viewer";
    viewerNode.data.defaultConfig = {
      ...viewerNode.data.defaultConfig,
      showGrid: true,
      [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: parentModelFlowNodeId,
    };

    edges.push({
      id: `setup-e-${stamp}-model`,
      source: parentModelFlowNodeId,
      target: viewerNode.id,
      sourceHandle: STUDIO_HANDLE_OUT,
      targetHandle: STUDIO_HANDLE_IN,
      animated: true,
      label: getSourcePortType(parent, STUDIO_HANDLE_OUT) ?? "string",
      style: { strokeWidth: 2 },
    });
    edges.push({
      id: `setup-e-${stamp}-anim`,
      source: animSourceNode.id,
      target: viewerNode.id,
      sourceHandle: STUDIO_HANDLE_OUT,
      targetHandle: STUDIO_HANDLE_ANIM,
      animated: true,
      label: getSourcePortType(animSourceNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
      style: { strokeWidth: 2 },
    });

    const newNodes = [
      ...clipNodes,
      ...(combinerNode != null ? [combinerNode] : []),
      viewerNode,
    ];

    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection([...state.nodes, ...newNodes], [viewerNode.id]),
        [...state.edges, ...edges],
      ),
      edges: [...state.edges, ...edges],
      ...selectionFromIds([viewerNode.id]),
    }));
    flushFlowSimulationPins(get);
  },
  updateSelectedNodeLabel: (nextLabel) => {
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    if (multiIds != null) {
      get().pushUndoSnapshot();
      const idSet = new Set(multiIds);
      set((state) => ({
        nodes: attachConfigErrorsWithModelChildRegistry(
          state.nodes.map((node) =>
            idSet.has(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    label: nextLabel,
                  },
                }
              : node,
          ),
          state.edges,
        ),
      }));
      return;
    }
    const selectedNodeId = st.selectedNodeId;
    if (selectedNodeId == null) {
      return;
    }
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: nextLabel,
                },
              }
            : node,
        ),
        state.edges,
      ),
    }));
  },
  updateSelectedNodeConfigField: (key, value) => {
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    if (multiIds != null) {
      const ref = st.nodes.find((node) => node.id === multiIds[0]);
      if (
        key === "sourceKey" &&
        ref?.data.nodeId === "sensor-input" &&
        typeof value === "string" &&
        !isValidStudioSensorSourceKey(value)
      ) {
        return false;
      }
      const normalizedValue =
        key === "sourceKey" && typeof value === "string" ? value.trim() : value;
      get().pushUndoSnapshot();
      const idSet = new Set(multiIds);
      set((state) => ({
        nodes: attachConfigErrorsWithModelChildRegistry(
          state.nodes.map((node) =>
            idSet.has(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    defaultConfig: {
                      ...node.data.defaultConfig,
                      [key]: normalizedValue,
                    },
                  },
                }
              : node,
          ),
          state.edges,
        ),
      }));
      flushFlowSimulationPins(get);
      return true;
    }
    const selectedNodeId = st.selectedNodeId;
    if (selectedNodeId == null) {
      return false;
    }
    const selected = st.nodes.find((node) => node.id === selectedNodeId);
    if (
      key === "sourceKey" &&
      selected?.data.nodeId === "sensor-input" &&
      typeof value === "string" &&
      !isValidStudioSensorSourceKey(value)
    ) {
      return false;
    }
    const normalizedValue =
      key === "sourceKey" && typeof value === "string" ? value.trim() : value;
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  defaultConfig: {
                    ...node.data.defaultConfig,
                    [key]: normalizedValue,
                  },
                },
              }
            : node,
        ),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
    return true;
  },
  patchSelectedNodeConfigFields: (fields) => {
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return false;
    }
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    if (multiIds != null) {
      get().pushUndoSnapshot();
      const idSet = new Set(multiIds);
      set((state) => ({
        nodes: attachConfigErrorsWithModelChildRegistry(
          state.nodes.map((node) =>
            idSet.has(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    defaultConfig: applyConfigFieldPatch(
                      node.data.defaultConfig,
                      fields,
                    ),
                  },
                }
              : node,
          ),
          state.edges,
        ),
      }));
      flushFlowSimulationPins(get);
      return true;
    }
    const selectedNodeId = st.selectedNodeId;
    if (selectedNodeId == null) {
      return false;
    }
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  defaultConfig: applyConfigFieldPatch(
                    node.data.defaultConfig,
                    fields,
                  ),
                },
              }
            : node,
        ),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
    return true;
  },
  updateSelectedNodeUiResizable: (resizable) => {
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    const targetIds =
      multiIds ??
      (st.selectedNodeIds.length > 0
        ? st.selectedNodeIds
        : st.selectedNodeId != null
          ? [st.selectedNodeId]
          : []);
    if (targetIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(targetIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) => {
          if (!idSet.has(node.id) || node.type !== "studio") {
            return node;
          }
          const data = node.data as StudioNodeData;
          if (!resizable) {
            const stripped = stripStudioNodeFixedLayout(node as StudioNode);
            const clearedUi = clearStudioNodeChromeLayoutWidths(
              studioNodeUiWithoutDisplayOverrides(data.ui),
            );
            const fitW = resolveFitWidthFromContentMeasure(data.nodeId, clearedUi);
            return applyStudioNodeLayoutWidth(
              {
                ...stripped,
                data: {
                  ...data,
                  ui: { ...clearedUi, resizable: false },
                },
              } as StudioNode,
              fitW,
            );
          }
          return {
            ...node,
            data: {
              ...data,
              ui: {
                ...data.ui,
                resizable: true,
              },
            },
          };
        }),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
  },
  updateSelectedNodeUiAllowBodyCollapse: (allow) => {
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    const targetIds =
      multiIds != null
        ? multiIds
        : st.selectedNodeId != null
          ? [st.selectedNodeId]
          : [];
    if (targetIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(targetIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          idSet.has(node.id)
            ? {
                ...node,
                data: {
                  ...node.data,
                  ui: {
                    ...node.data.ui,
                    allowBodyCollapse: allow,
                    ...(allow ? {} : { bodyControlsVisible: true }),
                  },
                },
              }
            : node,
        ),
        state.edges,
      ),
    }));
  },
  syncStudioNodeContentMinDimensions: (
    nodeId,
    contentMinWidth,
    contentMinHeight,
  ) => {
    const w = Math.max(0, Math.round(contentMinWidth));
    const h = Math.max(0, Math.round(contentMinHeight));
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }
        const ui = node.data.ui ?? {};
        if (ui.contentMinWidth === w && ui.contentMinHeight === h) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            ui: {
              ...ui,
              contentMinWidth: w,
              contentMinHeight: h,
            },
          },
        };
      }),
    }));
  },
  syncStudioNodeViewportPreviewHeadHeight: (nodeId, headHeightPx) => {
    const id = nodeId.trim();
    if (id.length === 0 || !Number.isFinite(headHeightPx)) {
      return;
    }
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== id || node.type !== "studio") {
          return node;
        }
        if (!isScene3dInspectorNodeId(node.data.nodeId)) {
          return node;
        }
        const nextUi = patchViewportPreviewHeadHeight(node.data.ui, headHeightPx);
        if (nextUi === node.data.ui) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            ui: nextUi,
          },
        };
      }),
    }));
  },
  updateSelectedStudioNodeLayoutDimensions: (patch) => {
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    const targetIds =
      multiIds != null
        ? multiIds
        : st.selectedNodeId != null
          ? [st.selectedNodeId]
          : [];
    if (targetIds.length === 0) {
      return;
    }
    if (patch.width != null || patch.height != null) {
      get().pushUndoSnapshot();
    }
    const changes: Parameters<typeof applyNodeChanges<StudioNode>>[0] = [];
    const widthPatches: Array<{ id: string; width: number }> = [];
    const idSet = new Set(targetIds);
    for (const id of targetIds) {
      const node = st.nodes.find((n) => n.id === id);
      if (node == null) {
        continue;
      }
      const current = readStudioFlowNodeLayoutSize(node);
      const width = clampStudioFlowNodeLayoutDimension(
        patch.width ?? current.width,
      );
      const height = clampStudioFlowNodeLayoutDimension(
        patch.height ?? current.height,
      );
      changes.push(...flowNodeDimensionChanges(id, width, height));
      if (patch.width != null) {
        widthPatches.push({ id, width });
      }
    }
    if (changes.length === 0) {
      return;
    }
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          const nextUi = stripViewportPreviewLayoutUi(data.ui);
          if (nextUi === data.ui) {
            return n;
          }
          return { ...n, data: { ...data, ui: nextUi } };
        }),
        state.edges,
      ),
    }));
    get().onNodesChange(changes);
    for (const { id, width } of widthPatches) {
      get().persistStudioNodeCanvasWidthForActiveChrome(id, width);
    }
  },
  applySelectedViewportPreviewLayout: (patch) => {
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    const targetIds =
      multiIds != null
        ? multiIds
        : st.selectedNodeId != null
          ? [st.selectedNodeId]
          : [];
    if (targetIds.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(targetIds);
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((n) => {
          if (n.type !== "studio" || !idSet.has(n.id)) {
            return n;
          }
          const data = n.data as StudioNodeData;
          if (!isScene3dInspectorNodeId(data.nodeId)) {
            return n;
          }
          const aspect =
            patch.aspect ??
            coerceStudioViewportPreviewAspect(data.ui?.previewAspect) ??
            STUDIO_VIEWPORT_PREVIEW_DEFAULT_ASPECT;
          const sizeTier =
            patch.sizeTier ??
            coerceStudioViewportPreviewSizeTier(data.ui?.previewSizeTier) ??
            STUDIO_VIEWPORT_PREVIEW_DEFAULT_SIZE_TIER;
          const chrome = resolveViewportPreviewChromeFromNode(n as StudioNode);
          const layout = computeViewportPreviewNodeDimensions(
            aspect,
            sizeTier,
            data.nodeId,
            chrome,
          );
          const nextUi = {
            ...data.ui,
            resizable: true,
            previewAspect: aspect,
            previewSizeTier: sizeTier,
          };
          return applyStudioNodeLayoutDimensions(
            { ...n, data: { ...data, ui: nextUi } } as StudioNode,
            layout.width,
            layout.height,
          );
        }),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
  },
  applySelectedNodeConfigFieldLive: (key, value) => {
    const st = get();
    if (getHomogeneousMultiSelectionIds(st) != null) {
      return false;
    }
    const selectedNodeId = st.selectedNodeId;
    if (selectedNodeId == null) {
      return false;
    }
    const normalizedValue =
      key === "sourceKey" && typeof value === "string" ? value.trim() : value;
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  defaultConfig: {
                    ...node.data.defaultConfig,
                    [key]: normalizedValue,
                  },
                },
              }
            : node,
        ),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
    return true;
  },
  applyNodeConfigFieldsLiveByNodeId: (nodeId, fields) => {
    const id = nodeId.trim();
    if (id.length === 0 || Object.keys(fields).length === 0) {
      return false;
    }
    set((state) => {
      const target = state.nodes.find((n) => n.id === id);
      if (target == null) {
        return state;
      }
      return {
        nodes: attachConfigErrorsWithModelChildRegistry(
          state.nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    defaultConfig: {
                      ...node.data.defaultConfig,
                      ...fields,
                    },
                  },
                }
              : node,
          ),
          state.edges,
        ),
      };
    });
    flushFlowSimulationPins(get);
    return true;
  },
  updateSelectedNodePlotterConfig: (next) => {
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    if (multiIds != null) {
      const ref = st.nodes.find((node) => node.id === multiIds[0]);
      if (ref == null || !isPlotterNodeId(ref.data.nodeId)) {
        return;
      }
      const persisted = persistPlotterConfig(next);
      get().pushUndoSnapshot();
      const idSet = new Set(multiIds);
      set((state) => ({
        nodes: attachConfigErrorsWithModelChildRegistry(
          state.nodes.map((node) =>
            idSet.has(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    defaultConfig: {
                      ...(persisted as unknown as Record<string, unknown>),
                    },
                  },
                }
              : node,
          ),
          state.edges,
        ),
      }));
      flushFlowSimulationPins(get);
      return;
    }
    const selectedNodeId = st.selectedNodeId;
    if (selectedNodeId == null) {
      return;
    }
    const selected = st.nodes.find((node) => node.id === selectedNodeId);
    if (selected == null || !isPlotterNodeId(selected.data.nodeId)) {
      return;
    }
    const persisted = persistPlotterConfig(next);
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  defaultConfig: {
                    ...(persisted as unknown as Record<string, unknown>),
                  },
                },
              }
            : node,
        ),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
  },
  clearSelectedPlotterHistory: () => {
    const st = get();
    const multiIds = getHomogeneousMultiSelectionIds(st);
    const targetIds =
      multiIds != null
        ? multiIds.filter((id) => {
            const node = st.nodes.find((n) => n.id === id);
            return node != null && isPlotterNodeId(node.data.nodeId);
          })
        : st.selectedNodeId != null
          ? [st.selectedNodeId]
          : [];
    if (targetIds.length === 0) {
      return;
    }
    const ref = st.nodes.find((node) => node.id === targetIds[0]);
    if (ref == null || !isPlotterNodeId(ref.data.nodeId)) {
      return;
    }
    get().pushUndoSnapshot();
    const idSet = new Set(targetIds);
    set((state) => ({
      nodes: state.nodes.map((node) =>
        idSet.has(node.id)
          ? {
              ...node,
              data: {
                ...node.data,
                livePlotHistory: {},
              },
            }
          : node,
      ),
    }));
  },
  updateSelectedNodeConfigFromJson: (nextJson) => {
    const st = get();
    if (getHomogeneousMultiSelectionIds(st) != null) {
      return {
        ok: false,
        message: "Select a single node to edit JSON configuration.",
      };
    }
    const selectedNodeId = st.selectedNodeId;
    if (selectedNodeId == null) {
      return { ok: false, message: "No selected node." };
    }
    const selected = st.nodes.find((node) => node.id === selectedNodeId);
    try {
      const parsed = JSON.parse(nextJson) as Record<string, unknown>;
      if (selected?.data.nodeId === "sensor-input" && "sourceKey" in parsed) {
        const sk = parsed.sourceKey;
        if (sk === null) {
          delete parsed.sourceKey;
        } else if (sk !== undefined && !isValidStudioSensorSourceKey(sk)) {
          return {
            ok: false,
            message:
              "Invalid sourceKey: use one of the hardware paths from the Sensor Input dropdown list.",
          };
        } else if (typeof sk === "string" && isValidStudioSensorSourceKey(sk)) {
          parsed.sourceKey = sk.trim();
        }
      }
      get().pushUndoSnapshot();
      set((state) => ({
        nodes: attachConfigErrorsWithModelChildRegistry(
          state.nodes.map((node) =>
            node.id === selectedNodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    defaultConfig: parsed,
                  },
                }
              : node,
          ),
          state.edges,
        ),
      }));
      flushFlowSimulationPins(get);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      return { ok: false, message };
    }
  },
  tickSimulation: () => {
    if (isFlowNodeDragActive()) {
      return;
    }
    const state = get();
    const { nodes, edges } = resolveEvaluationGraph(state);
    if (nodes.length === 0) {
      useStageSceneStore.getState().resetSnapshot();
      return;
    }

    advanceFlowClock();

    type FlowValue =
      | number
      | boolean
      | string
      | FlowWireVec3
      | FlowWireQuaternion
      | FlowWireEnvironmentV1
      | FlowWireCameraV1
      | FlowWireAnimationV1
      | FlowWireTransformV1
      | null;

    const nowIso = new Date().toISOString();

    const incomingByTarget = new Map<
      string,
      { source: string; sourceHandle: string; targetHandle: string }[]
    >();
    for (const edge of edges) {
      const list = incomingByTarget.get(edge.target) ?? [];
      list.push({
        source: edge.source,
        sourceHandle: edge.sourceHandle ?? STUDIO_HANDLE_OUT,
        targetHandle: edge.targetHandle ?? STUDIO_HANDLE_IN,
      });
      incomingByTarget.set(edge.target, list);
    }

    const pinValues = new Map<string, FlowValue>();
    applyUnwiredGroupInputDefaults({
      rootNodes: state.rootNodes.length > 0 ? state.rootNodes : state.nodes,
      rootEdges:
        state.activeGraphId === STUDIO_ROOT_GRAPH_ID ? state.edges : state.rootEdges,
      subgraphs: state.subgraphs,
      pinValues,
    });
    const liveStore = useBitstreamLiveStore.getState();
    const deviceSensorCfgBySourceId =
      useBitstreamDeviceSensorConfigStore.getState().bySourceId;
    const quatOrient = useBmi270FusionQuatOrientationStore.getState();
    const eulerWireTap = useBmi270FusionEulerWireTapStore.getState();
    const hasQuatWireTap = quatOrient.seq > 0;
    const hasEulerWireTap = eulerWireTap.seq > 0;
    const quatFromWireTap: FlowWireQuaternion = {
      w: quatOrient.qw,
      x: quatOrient.qx,
      y: quatOrient.qy,
      z: quatOrient.qz,
    };
    const eulerFromWireTap: FlowWireVec3 = {
      // Align with Sensor Studio convention: x=roll, y=pitch, z=heading(yaw).
      x: eulerWireTap.rollRad,
      y: eulerWireTap.pitchRad,
      z: eulerWireTap.yawRad,
    };
    const latestByHint = liveStore.latestByHint;
    const lastAtByHint = {
      ...liveStore.lastAtByHint,
      bmi270: Math.max(
        liveStore.lastAtByHint.bmi270 ?? 0,
        quatOrient.lastAtMs ?? 0,
        eulerWireTap.lastAtMs ?? 0,
      ),
    };
    const sensorHardwareLiveNodeIds = new Set<string>();
    const visionTriggerSourceIds: string[] = [];

    const readIncoming = (
      targetId: string,
      targetHandle?: string,
    ): FlowValue | null => {
      const list = incomingByTarget.get(targetId);
      if (list == null || list.length === 0) {
        return null;
      }
      const targetNode = nodes.find((n) => n.id === targetId);
      if (
        isStudioFlowNode(targetNode) &&
        targetNode.data.nodeId === "number-average"
      ) {
        const nums: number[] = [];
        for (const inc of list) {
          if (inc.targetHandle !== STUDIO_HANDLE_IN) {
            continue;
          }
          const v = pinValues.get(
            studioFlowPinKey(inc.source, inc.sourceHandle),
          );
          if (typeof v === "number" && Number.isFinite(v)) {
            nums.push(v);
          }
        }
        if (nums.length === 0) {
          return null;
        }
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      }
      const chosen =
        targetHandle != null
          ? list.find((e) => e.targetHandle === targetHandle)
          : list.length === 1
            ? list[0]
            : (list.find((e) => e.targetHandle === STUDIO_HANDLE_IN) ??
              list[0]);
      if (chosen == null) {
        return null;
      }
      return (
        pinValues.get(studioFlowPinKey(chosen.source, chosen.sourceHandle)) ??
        null
      );
    };

    const narrowNumber = (v: FlowValue | null): number =>
      typeof v === "number" && Number.isFinite(v) ? v : 0;

    // Audio routing + scalar feature extraction
    // - Routing is handled by Web Audio graph (not pins).
    // - Pins carry only scalar features and control values.
    const nowMs = Date.now();

    const anyEnabledAudioOutput = nodes.some((n) => {
      if (!isStudioFlowNode(n)) return false;
      if (n.data.nodeId !== "audio-output") return false;
      const cfg = n.data.defaultConfig as Record<string, unknown>;
      return cfg.enabled === true;
    });
    studioAudioRuntime.enableMaster(anyEnabledAudioOutput);

    for (let pass = 0; pass < 3; pass += 1) {
      for (const node of nodes) {
        if (node.type === "studio-reroute") {
          const v = readIncoming(node.id, STUDIO_HANDLE_IN);
          if (v != null) {
            pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), v);
          }
          continue;
        }
        if (node.type === "studio-split") {
          const v = readIncoming(node.id, STUDIO_HANDLE_IN);
          if (v != null) {
            for (const handleId of splitOutputHandleIds(
              node.data.outputCount,
            )) {
              pinValues.set(studioFlowPinKey(node.id, handleId), v);
            }
          }
          continue;
        }
        if (!isStudioFlowNode(node)) {
          continue;
        }

        if (node.data.nodeId === "mic-input") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const enabled = cfg.enabled === true;
          const deviceId =
            typeof cfg.deviceId === "string" ? cfg.deviceId : "default";
          const fftSizeRaw =
            typeof cfg.fftSize === "number" ? cfg.fftSize : 2048;
          const fftSize = Number.isFinite(fftSizeRaw) ? clampAnalyserFftSize(fftSizeRaw) : 2048;
          const smoothingRaw =
            typeof cfg.smoothing === "number" ? cfg.smoothing : 0.8;
          const smoothing = Number.isFinite(smoothingRaw) ? smoothingRaw : 0.8;
          const gateEnabled = cfg.gateEnabled === true;
          const gateThresholdRaw =
            typeof cfg.gateThreshold === "number" ? cfg.gateThreshold : 0.02;
          const gateThreshold = Number.isFinite(gateThresholdRaw)
            ? Math.max(0, gateThresholdRaw)
            : 0.02;
          const peakHoldMsRaw =
            typeof cfg.peakHoldMs === "number" ? cfg.peakHoldMs : 150;
          const peakHoldMs = Number.isFinite(peakHoldMsRaw)
            ? Math.max(0, peakHoldMsRaw)
            : 150;

          studioAudioRuntime.enableMic(node.id, enabled);
          if (enabled) {
            void studioAudioRuntime.ensureMicActive(node.id, {
              deviceId,
              fftSize,
              smoothing,
            });
          }

          const buffers = studioAudioRuntime.readMicBuffers(node.id);
          if (buffers == null) {
            pinValues.set(studioFlowPinKey(node.id, "active"), false);
            pinValues.set(studioFlowPinKey(node.id, "rms"), 0);
            pinValues.set(studioFlowPinKey(node.id, "peak"), 0);
            pinValues.set(studioFlowPinKey(node.id, "zcr"), 0);
            pinValues.set(studioFlowPinKey(node.id, "centroidHz"), 0);
            continue;
          }

          // Time domain: 0..255 centered at 128.
          const time = buffers.time;
          let sumSq = 0;
          let peak = 0;
          let prevSign = 0;
          let zc = 0;
          for (let i = 0; i < time.length; i += 1) {
            const v = (time[i] - 128) / 128;
            sumSq += v * v;
            const a = Math.abs(v);
            if (a > peak) peak = a;
            const sign = v > 0.0001 ? 1 : v < -0.0001 ? -1 : 0;
            if (i > 0 && sign !== 0 && prevSign !== 0 && sign !== prevSign) {
              zc += 1;
            }
            if (sign !== 0) prevSign = sign;
          }
          const rms = Math.sqrt(sumSq / Math.max(1, time.length));
          const zcr = Math.min(1, zc / Math.max(1, time.length - 1));

          // Frequency domain centroid.
          const freq = buffers.freq;
          let weighted = 0;
          let total = 0;
          for (let i = 0; i < freq.length; i += 1) {
            const mag = freq[i];
            total += mag;
            weighted += mag * i;
          }
          const nyquist = (buffers.analyser.context.sampleRate ?? 48000) / 2;
          const centroidHz =
            total > 0
              ? (weighted / total) * (nyquist / Math.max(1, freq.length - 1))
              : 0;

          const gatedRms = gateEnabled && rms < gateThreshold ? 0 : rms;
          const gatedPeak = gateEnabled && peak < gateThreshold ? 0 : peak;
          const peakHold = studioAudioRuntime.updateMicPeakHold(node.id, {
            peak: gatedPeak,
            peakHoldMs,
            nowMs,
          });

          pinValues.set(studioFlowPinKey(node.id, "active"), true);
          pinValues.set(studioFlowPinKey(node.id, "rms"), gatedRms);
          pinValues.set(studioFlowPinKey(node.id, "peak"), peakHold);
          pinValues.set(studioFlowPinKey(node.id, "zcr"), zcr);
          pinValues.set(studioFlowPinKey(node.id, "centroidHz"), centroidHz);
          continue;
        }

        if (node.data.nodeId === "camera-input") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const enabledIncoming = readIncoming(node.id, "enabled");
          const enabled =
            typeof enabledIncoming === "boolean" ? enabledIncoming : cfg.enabled === true;
          const deviceId =
            typeof cfg.deviceId === "string" ? cfg.deviceId : "default";
          const facingMode = cfg.facingMode === "environment" ? "environment" : "user";
          const widthRaw = typeof cfg.width === "number" ? cfg.width : 1280;
          const heightRaw = typeof cfg.height === "number" ? cfg.height : 720;
          const targetFpsRaw = typeof cfg.targetFps === "number" ? cfg.targetFps : 30;

          studioCameraRuntime.enableCamera(node.id, enabled);
          if (enabled) {
            void studioCameraRuntime.ensureCameraActive(node.id, {
              deviceId,
              facingMode,
              width: widthRaw,
              height: heightRaw,
              targetFps: targetFpsRaw,
              mirrorPreview: cfg.mirrorPreview !== false,
            });
          }

          const ui = studioCameraRuntime.getCameraUiState(node.id);
          const active = ui.status === "active";
          if (active) {
            pinValues.set(
              studioFlowPinKey(node.id, "video"),
              makeFlowWireVideoBusV1(node.id),
            );
          }
          const dims = studioCameraRuntime.getCameraDimensions(node.id);
          const fps = active ? studioCameraRuntime.tickCameraFps(node.id, nowMs) : 0;
          pinValues.set(studioFlowPinKey(node.id, "active"), active);
          pinValues.set(studioFlowPinKey(node.id, "fps"), fps);
          pinValues.set(studioFlowPinKey(node.id, "width"), dims.width);
          pinValues.set(studioFlowPinKey(node.id, "height"), dims.height);
          continue;
        }

        if (node.data.nodeId === "video-texture") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const flipY = cfg.flipY === true;
          const incoming = readIncoming(node.id, "in");
          const bus = flowValueAsVideoBus(incoming);
          if (bus == null) {
            studioCameraRuntime.releaseVideoTexture(node.id);
            pinValues.set(studioFlowPinKey(node.id, "ready"), false);
            continue;
          }

          studioCameraRuntime.ensureVideoTexture(node.id, bus.sourceNodeId, { flipY });
          const ready = studioCameraRuntime.isVideoTextureReady(node.id);
          if (ready) {
            pinValues.set(
              studioFlowPinKey(node.id, "out"),
              makeFlowWireVideoTextureV1({
                sourceNodeId: node.id,
                cameraNodeId: bus.sourceNodeId,
              }),
            );
          }
          pinValues.set(studioFlowPinKey(node.id, "ready"), ready);
          continue;
        }

        if (node.data.nodeId === "material-video") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const texIncoming = readIncoming(node.id, "tex");
          const wire = flowValueAsVideoTexture(texIncoming);
          const gainIncoming = readIncoming(node.id, "gain");
          const blendRaw = typeof cfg.blend === "number" ? cfg.blend : 1;
          const gain =
            typeof gainIncoming === "number" && Number.isFinite(gainIncoming)
              ? Math.max(0, gainIncoming)
              : Math.max(0, blendRaw);
          const ready =
            wire != null && studioCameraRuntime.isVideoTextureReady(wire.sourceNodeId);
          pinValues.set(studioFlowPinKey(node.id, "active"), ready && gain > 0);
          continue;
        }

        if (node.data.nodeId === "css3d-camera-feed") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const busIncoming = readIncoming(node.id, "in");
          const bus = flowValueAsVideoBus(busIncoming);
          const visibleIncoming = readIncoming(node.id, "visible");
          const visible =
            typeof visibleIncoming === "boolean"
              ? visibleIncoming
              : cfg.visible !== false;
          const opacityIncoming = readIncoming(node.id, "opacity");
          const opacityRaw =
            typeof opacityIncoming === "number" && Number.isFinite(opacityIncoming)
              ? opacityIncoming
              : typeof cfg.opacity === "number"
                ? cfg.opacity
                : 1;
          const opacity = Math.max(0, Math.min(1, opacityRaw));
          const streamActive =
            bus != null &&
            studioCameraRuntime.getCameraUiState(bus.sourceNodeId).status === "active";
          pinValues.set(
            studioFlowPinKey(node.id, "visible"),
            visible && streamActive && opacity > 0,
          );
          continue;
        }

        if (isVisionInferenceNodeId(node.data.nodeId)) {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const busIncoming = readIncoming(node.id, "in");
          const bus = flowValueAsVideoBus(busIncoming);
          const enabledIncoming = readIncoming(node.id, "enabled");
          const evalResult = evaluateVisionFlowNode({
            catalogNodeId: node.data.nodeId,
            nodeInstanceId: node.id,
            config: cfg,
            cameraNodeId: bus?.sourceNodeId ?? null,
            enabledIncoming,
            nowMs,
          });
          if (evalResult != null) {
            for (const [handle, value] of Object.entries(evalResult.pinValues)) {
              pinValues.set(studioFlowPinKey(node.id, handle), value);
            }
            if (evalResult.triggerEdge) {
              visionTriggerSourceIds.push(node.id);
            }
          }
          continue;
        }

        if (node.data.nodeId === "audio-oscillator") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const waveform =
            typeof cfg.waveform === "string" ? cfg.waveform : "sine";
          const detune =
            typeof cfg.detuneCents === "number" ? cfg.detuneCents : 0;
          const freqIncoming = readIncoming(node.id, "freqHz");
          const sweepEnabled = cfg.sweepEnabled === true;
          const baseFreqHz = readSimInput(null, cfg.freqHz, 440);
          const gain = readSimInput(readIncoming(node.id, "gain"), cfg.gain, 0);
          const gateIncoming = readIncoming(node.id, "gate");
          const gate =
            typeof gateIncoming === "boolean"
              ? gateIncoming
              : cfg.gate === true;

          let sweepAnchorMs = oscillatorSweepOnceAnchorMsByNodeId.get(node.id) ?? null;
          if (!sweepEnabled || cfg.sweepMode === "once") {
            if (!gate) {
              sweepAnchorMs = null;
              oscillatorSweepOnceAnchorMsByNodeId.delete(node.id);
            }
          }
          const sweepResolved =
            typeof freqIncoming === "number" && Number.isFinite(freqIncoming)
              ? { freqHz: Math.max(0, freqIncoming), nextSweepOnceAnchorMs: sweepAnchorMs }
              : resolveOscillatorSweepHz({
                  nowMs,
                  baseFreqHz: Math.max(0, baseFreqHz),
                  gate,
                  sweepOnceAnchorMs: sweepAnchorMs,
                  params: {
                    sweepEnabled,
                    sweepStartHz:
                      typeof cfg.sweepStartHz === "number" ? cfg.sweepStartHz : 220,
                    sweepEndHz:
                      typeof cfg.sweepEndHz === "number" ? cfg.sweepEndHz : 880,
                    sweepPeriodS:
                      typeof cfg.sweepPeriodS === "number" ? cfg.sweepPeriodS : 4,
                    sweepCurve: cfg.sweepCurve,
                    sweepDirection: cfg.sweepDirection,
                    sweepMode: cfg.sweepMode,
                  },
                });
          if (sweepResolved.nextSweepOnceAnchorMs != null) {
            oscillatorSweepOnceAnchorMsByNodeId.set(
              node.id,
              sweepResolved.nextSweepOnceAnchorMs,
            );
          }
          const freqHz = sweepResolved.freqHz;

          studioAudioRuntime.setOscillator(node.id, {
            waveform,
            detuneCents: detune,
            freqHz,
            gain,
            gate,
          });
          pinValues.set(studioFlowPinKey(node.id, "level"), gate ? gain : 0);
          continue;
        }

        if (node.data.nodeId === "audio-sfx") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const enabled = cfg.enabled !== false;
          const preset = resolveAudioSfxPreset(cfg.preset);
          const triggerIncoming = readIncoming(node.id, "trigger");
          const triggerHigh = triggerIncoming === true;
          const wasHigh = sfxTriggerWasHighByNodeId.get(node.id) ?? false;
          if (triggerHigh && !wasHigh && enabled) {
            get().fireAudioSfxNode(node.id);
          }
          sfxTriggerWasHighByNodeId.set(node.id, triggerHigh);

          const transport = studioAudioRuntime.getSfxTransport(node.id);
          const level = transport.level;
          pinValues.set(studioFlowPinKey(node.id, "playing"), transport.playing);
          pinValues.set(studioFlowPinKey(node.id, "level"), level);
          continue;
        }

        if (node.data.nodeId === "audio-machine") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const enabled = cfg.enabled !== false;
          const family = readMachineFamilyId(cfg.family);
          const speed = clampMachineSpeed(
            readSimInput(readIncoming(node.id, "speed"), cfg.speed, 0.35),
          );
          const load = clampMachineLoad(
            readSimInput(readIncoming(node.id, "load"), cfg.load, 0.25),
          );

          let gain = 0.1;
          let machineArgs: Parameters<typeof studioAudioRuntime.setMachineSound>[1];

          if (family === "engine") {
            const preset = resolveEnginePreset(cfg.preset);
            const gainRaw = readSimInput(readIncoming(node.id, "gain"), cfg.gain, preset.gain);
            gain =
              typeof gainRaw === "number" && Number.isFinite(gainRaw)
                ? Math.max(0, Math.min(1, gainRaw))
                : preset.gain;
            const rumbleBaseHz =
              typeof cfg.rumbleBaseHz === "number" ? cfg.rumbleBaseHz : preset.rumbleBaseHz;
            const rumbleSpanHz =
              typeof cfg.rumbleSpanHz === "number" ? cfg.rumbleSpanHz : preset.rumbleSpanHz;
            const cylinders =
              typeof cfg.cylinders === "number" ? cfg.cylinders : preset.cylinders;
            const roughness =
              typeof cfg.roughness === "number" ? cfg.roughness : preset.roughness;
            const turboMix =
              typeof cfg.turboMix === "number" ? cfg.turboMix : preset.turboMix;
            const rumbleHz = resolveEngineRumbleHz({ speed, rumbleBaseHz, rumbleSpanHz });
            const fireHz = resolveEngineFireHz({ speed, cylinders });
            machineArgs = {
              family: "engine",
              enabled: false,
              speed,
              load,
              gain,
              whineHz: 0,
              harmonicMix: 0,
              rippleMix: 0,
              noiseMix: 0,
              rumbleHz,
              fireHz,
              turboMix,
              roughness,
              motorHz: 0,
              motorDetuneHz: 0,
              washMix: 0,
              cycleHz: 0,
              frictionMix: 0,
              clankMix: 0,
            };
          } else if (family === "drone") {
            const preset = resolveDronePreset(cfg.preset);
            const gainRaw = readSimInput(readIncoming(node.id, "gain"), cfg.gain, preset.gain);
            gain =
              typeof gainRaw === "number" && Number.isFinite(gainRaw)
                ? Math.max(0, Math.min(1, gainRaw))
                : preset.gain;
            const motorBaseHz =
              typeof cfg.motorBaseHz === "number" ? cfg.motorBaseHz : preset.motorBaseHz;
            const motorSpanHz =
              typeof cfg.motorSpanHz === "number" ? cfg.motorSpanHz : preset.motorSpanHz;
            const detuneCents =
              typeof cfg.detuneCents === "number" ? cfg.detuneCents : preset.detuneCents;
            const washMix =
              typeof cfg.washMix === "number" ? cfg.washMix : preset.washMix;
            const motorHz = resolveDroneMotorHz({ speed, motorBaseHz, motorSpanHz });
            const motorDetuneHz = resolveDroneDetuneHz(motorHz, detuneCents);
            machineArgs = {
              family: "drone",
              enabled: false,
              speed,
              load,
              gain,
              whineHz: 0,
              harmonicMix: 0,
              rippleMix: 0,
              noiseMix: 0,
              rumbleHz: 0,
              fireHz: 0,
              turboMix: 0,
              roughness: 0,
              motorHz,
              motorDetuneHz,
              washMix,
              cycleHz: 0,
              frictionMix: 0,
              clankMix: 0,
            };
          } else if (family === "machine") {
            const preset = resolveIndustrialPreset(cfg.preset);
            const gainRaw = readSimInput(readIncoming(node.id, "gain"), cfg.gain, preset.gain);
            gain =
              typeof gainRaw === "number" && Number.isFinite(gainRaw)
                ? Math.max(0, Math.min(1, gainRaw))
                : preset.gain;
            const cycleBaseHz =
              typeof cfg.cycleBaseHz === "number" ? cfg.cycleBaseHz : preset.cycleBaseHz;
            const cycleSpanHz =
              typeof cfg.cycleSpanHz === "number" ? cfg.cycleSpanHz : preset.cycleSpanHz;
            const frictionMix =
              typeof cfg.frictionMix === "number" ? cfg.frictionMix : preset.frictionMix;
            const clankMix =
              typeof cfg.clankMix === "number" ? cfg.clankMix : preset.clankMix;
            const cycleHz = resolveIndustrialCycleHz({ speed, cycleBaseHz, cycleSpanHz });

            const triggerIncoming = readIncoming(node.id, "trigger");
            const triggerHigh = triggerIncoming === true;
            const wasHigh = machineTriggerWasHighByNodeId.get(node.id) ?? false;
            if (triggerHigh && !wasHigh && enabled) {
              void studioAudioRuntime.triggerMachineClank(node.id, { gain, clankMix });
            }
            machineTriggerWasHighByNodeId.set(node.id, triggerHigh);

            machineArgs = {
              family: "machine",
              enabled: false,
              speed,
              load,
              gain,
              whineHz: 0,
              harmonicMix: 0,
              rippleMix: 0,
              noiseMix: 0,
              rumbleHz: 0,
              fireHz: 0,
              turboMix: 0,
              roughness: 0,
              motorHz: 0,
              motorDetuneHz: 0,
              washMix: 0,
              cycleHz,
              frictionMix,
              clankMix,
            };
          } else {
            const preset = resolveMotorPreset(cfg.preset);
            const gainRaw = readSimInput(readIncoming(node.id, "gain"), cfg.gain, preset.gain);
            gain =
              typeof gainRaw === "number" && Number.isFinite(gainRaw)
                ? Math.max(0, Math.min(1, gainRaw))
                : preset.gain;
            const whineBaseHz =
              typeof cfg.whineBaseHz === "number" ? cfg.whineBaseHz : preset.whineBaseHz;
            const whineSpanHz =
              typeof cfg.whineSpanHz === "number" ? cfg.whineSpanHz : preset.whineSpanHz;
            const harmonicMix =
              typeof cfg.harmonicMix === "number" ? cfg.harmonicMix : preset.harmonicMix;
            const rippleMix =
              typeof cfg.rippleMix === "number" ? cfg.rippleMix : preset.rippleMix;
            const noiseMix =
              typeof cfg.noiseMix === "number" ? cfg.noiseMix : preset.noiseMix;
            const whineHz = resolveMotorWhineHz({ speed, whineBaseHz, whineSpanHz });
            machineArgs = {
              family: "motor",
              enabled: false,
              speed,
              load,
              gain,
              whineHz,
              harmonicMix,
              rippleMix,
              noiseMix,
              rumbleHz: 0,
              fireHz: 0,
              turboMix: 0,
              roughness: 0,
              motorHz: 0,
              motorDetuneHz: 0,
              washMix: 0,
              cycleHz: 0,
              frictionMix: 0,
              clankMix: 0,
            };
          }

          const active = enabled && speed > 0.001 && gain > 0.001;
          machineArgs.enabled = active;
          studioAudioRuntime.setMachineSound(node.id, machineArgs);

          pinValues.set(studioFlowPinKey(node.id, "active"), active);
          pinValues.set(studioFlowPinKey(node.id, "level"), active ? gain * speed : 0);
          continue;
        }

        if (node.data.nodeId === "audio-output") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const enabled = cfg.enabled === true;
          if (!enabled) {
            // Ensure microphone monitor paths are always muted when output is disabled.
            for (const n of nodes) {
              if (isStudioFlowNode(n) && n.data.nodeId === "mic-input") {
                studioAudioRuntime.setMicMonitorGain(n.id, 0);
              }
              if (isStudioFlowNode(n) && n.data.nodeId === "audio-oscillator") {
                studioAudioRuntime.setOscillatorMonitorGain(n.id, 0);
              }
              if (
                isStudioFlowNode(n) &&
                n.data.nodeId === "audio-file-player"
              ) {
                studioAudioRuntime.setFilePlayerMonitorGain(n.id, 0);
              }
              if (isStudioFlowNode(n) && n.data.nodeId === "audio-sfx") {
                studioAudioRuntime.setSfxMonitorGain(n.id, 0);
              }
              if (isStudioFlowNode(n) && n.data.nodeId === "audio-machine") {
                studioAudioRuntime.setMachineMonitorGain(n.id, 0);
              }
            }
            studioAudioRuntime.setMasterControls({
              gate: false,
              gain: 0,
              maxGain: typeof cfg.maxGain === "number" ? cfg.maxGain : 0.25,
              limiterEnabled: cfg.limiterEnabled !== false,
            });
            continue;
          }
          const gain = readSimInput(readIncoming(node.id, "gain"), cfg.gain, 0);
          const gateIncoming = readIncoming(node.id, "gate");
          const gate =
            typeof gateIncoming === "boolean"
              ? gateIncoming
              : cfg.gate === true;
          studioAudioRuntime.setMasterControls({
            gate,
            gain,
            maxGain: typeof cfg.maxGain === "number" ? cfg.maxGain : 0.25,
            limiterEnabled: cfg.limiterEnabled !== false,
          });

          // v0.1 routing: pick exactly one source node to pass into master output.
          // Always reset all monitor gains first to prevent "stuck on" audio when switching sources.
          for (const n of nodes) {
            if (isStudioFlowNode(n) && n.data.nodeId === "mic-input") {
              studioAudioRuntime.setMicMonitorGain(n.id, 0);
            }
            if (isStudioFlowNode(n) && n.data.nodeId === "audio-oscillator") {
              studioAudioRuntime.setOscillatorMonitorGain(n.id, 0);
            }
            if (isStudioFlowNode(n) && n.data.nodeId === "audio-file-player") {
              studioAudioRuntime.setFilePlayerMonitorGain(n.id, 0);
            }
            if (isStudioFlowNode(n) && n.data.nodeId === "audio-sfx") {
              studioAudioRuntime.setSfxMonitorGain(n.id, 0);
            }
            if (isStudioFlowNode(n) && n.data.nodeId === "audio-machine") {
              studioAudioRuntime.setMachineMonitorGain(n.id, 0);
            }
          }

          const wiredSourceId = findWiredAudioBusSourceNodeId(node.id, edges);
          const srcId =
            wiredSourceId ??
            (readMonitorModeEnabled(cfg)
              ? resolveAudioMonitorSourceNodeId({
                  forNodeId: node.id,
                  monitorModeEnabled: true,
                  sourceMode: cfg.sourceMode,
                  explicitSourceNodeId: cfg.sourceNodeId,
                  nodes,
                })
              : null);
          if (srcId != null) {
            const srcNode = nodes.find((n) => n.id === srcId);
            if (
              isStudioFlowNode(srcNode) &&
              srcNode.data.nodeId === "mic-input"
            ) {
              // When gate is on, pass selected source into master (master gain handles volume).
              studioAudioRuntime.setMicMonitorGain(srcId, gate ? 1 : 0);
            }
            if (
              isStudioFlowNode(srcNode) &&
              srcNode.data.nodeId === "audio-oscillator"
            ) {
              studioAudioRuntime.setOscillatorMonitorGain(srcId, gate ? 1 : 0);
            }
            if (
              isStudioFlowNode(srcNode) &&
              srcNode.data.nodeId === "audio-file-player"
            ) {
              studioAudioRuntime.setFilePlayerMonitorGain(srcId, gate ? 1 : 0);
            }
            if (isStudioFlowNode(srcNode) && srcNode.data.nodeId === "audio-sfx") {
              studioAudioRuntime.setSfxMonitorGain(srcId, gate ? 1 : 0);
            }
            if (isStudioFlowNode(srcNode) && srcNode.data.nodeId === "audio-machine") {
              studioAudioRuntime.setMachineMonitorGain(srcId, gate ? 1 : 0);
            }
          }
          continue;
        }

        if (node.data.nodeId === "audio-scope") {
          // No pin evaluation needed here (canvas reads analyser via runtime).
          continue;
        }

        if (node.data.nodeId === "audio-file-player") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const enabled = cfg.enabled === true;
          const url = typeof cfg.url === "string" ? cfg.url : "";
          const loop = cfg.loop === true;
          const gain = readSimInput(
            readIncoming(node.id, "gain"),
            cfg.gain,
            0.5,
          );
          const gateIncoming = readIncoming(node.id, "gate");
          const gate =
            typeof gateIncoming === "boolean"
              ? gateIncoming
              : cfg.gate === true;

          studioAudioRuntime.setFilePlayer(node.id, {
            enabled,
            url,
            loop,
            gain,
            gate,
          });

          const t = studioAudioRuntime.getFilePlayerTransport(node.id);
          pinValues.set(studioFlowPinKey(node.id, "playing"), t.playing);
          pinValues.set(studioFlowPinKey(node.id, "time"), t.timeS);
          pinValues.set(studioFlowPinKey(node.id, "duration"), t.durationS);
          continue;
        }
        if (node.data.nodeId === "sine-wave") {
          const cfg = node.data.defaultConfig;
          const t = Date.now() / 1000;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateSineWave(
              t,
              readSimInput(
                readIncoming(node.id, "amplitude"),
                cfg.amplitude,
                1,
              ),
              readSimInput(
                readIncoming(node.id, "frequency"),
                cfg.frequency,
                1,
              ),
              readSimInput(readIncoming(node.id, "phase"), cfg.phase, 0),
              readSimInput(readIncoming(node.id, "offset"), cfg.offset, 0),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "ramp-sim") {
          const cfg = node.data.defaultConfig;
          const t = Date.now() / 1000;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateRampSim(
              t,
              readSimInput(readIncoming(node.id, "rate"), cfg.rate, 0.1),
              readSimInput(readIncoming(node.id, "min"), cfg.min, 0),
              readSimInput(readIncoming(node.id, "max"), cfg.max, 1),
              cfg.wrap !== false,
            ),
          );
          continue;
        }

        if (node.data.nodeId === "step-sim") {
          const cfg = node.data.defaultConfig;
          const t = Date.now() / 1000;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateStepSim(
              t,
              readSimInput(readIncoming(node.id, "interval"), cfg.interval, 1),
              readSimInput(readIncoming(node.id, "low"), cfg.low, 0),
              readSimInput(readIncoming(node.id, "high"), cfg.high, 1),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "noise-sim") {
          const cfg = node.data.defaultConfig;
          const t = Date.now() / 1000;
          const smoothRaw = cfg.smooth;
          const smooth =
            typeof smoothRaw === "number" && Number.isFinite(smoothRaw)
              ? smoothRaw
              : 0.25;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateNoiseSim(
              t,
              readSimInput(readIncoming(node.id, "seed"), cfg.seed, 1),
              readSimInput(
                readIncoming(node.id, "amplitude"),
                cfg.amplitude,
                1,
              ),
              readSimInput(readIncoming(node.id, "offset"), cfg.offset, 0),
              smooth,
            ),
          );
          continue;
        }

        if (node.data.nodeId === "vector-constant") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateVectorConstant(
              readVectorAxisInput(
                readIncoming(node.id, "x"),
                cfg.x,
                VECTOR_CONSTANT_DEFAULTS.x,
              ),
              readVectorAxisInput(
                readIncoming(node.id, "y"),
                cfg.y,
                VECTOR_CONSTANT_DEFAULTS.y,
              ),
              readVectorAxisInput(
                readIncoming(node.id, "z"),
                cfg.z,
                VECTOR_CONSTANT_DEFAULTS.z,
              ),
            ),
          );
          continue;
        }

        if (
          node.data.nodeId === "quaternion-constant" ||
          node.data.nodeId === "quat-input"
        ) {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateQuaternionConstant(
              readQuaternionAxisInput(
                readIncoming(node.id, "w"),
                cfg.w,
                QUATERNION_CONSTANT_DEFAULTS.w,
              ),
              readQuaternionAxisInput(
                readIncoming(node.id, "x"),
                cfg.x,
                QUATERNION_CONSTANT_DEFAULTS.x,
              ),
              readQuaternionAxisInput(
                readIncoming(node.id, "y"),
                cfg.y,
                QUATERNION_CONSTANT_DEFAULTS.y,
              ),
              readQuaternionAxisInput(
                readIncoming(node.id, "z"),
                cfg.z,
                QUATERNION_CONSTANT_DEFAULTS.z,
              ),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "scene-time") {
          const t = evaluateSceneTime();
          pinValues.set(studioFlowPinKey(node.id, "seconds"), t.seconds);
          pinValues.set(studioFlowPinKey(node.id, "frames"), t.frames);
          continue;
        }

        if (node.data.nodeId === "frame-delta") {
          const d = evaluateFrameDelta();
          pinValues.set(studioFlowPinKey(node.id, "delta"), d.delta);
          pinValues.set(studioFlowPinKey(node.id, "fps"), d.fps);
          continue;
        }

        if (node.data.nodeId === "debug") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateDebugValue(readIncoming(node.id, "value"), cfg.value, 0),
          );
          continue;
        }

        if (node.data.nodeId === "position") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateTransformPartialVec3(
              readTransformAxisInput(readIncoming(node.id, "x"), cfg.px, 0),
              readTransformAxisInput(readIncoming(node.id, "y"), cfg.py, 0),
              readTransformAxisInput(readIncoming(node.id, "z"), cfg.pz, 0),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "rotation") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateTransformPartialVec3(
              readTransformAxisInput(readIncoming(node.id, "x"), cfg.rx, 0),
              readTransformAxisInput(readIncoming(node.id, "y"), cfg.ry, 0),
              readTransformAxisInput(readIncoming(node.id, "z"), cfg.rz, 0),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "scale") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateTransformPartialVec3(
              readTransformAxisInput(readIncoming(node.id, "x"), cfg.sx, 1),
              readTransformAxisInput(readIncoming(node.id, "y"), cfg.sy, 1),
              readTransformAxisInput(readIncoming(node.id, "z"), cfg.sz, 1),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "scene-settings") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateSceneSettingsExposure(
              readIncoming(node.id, "exposure"),
              cfg.exposure,
              1,
            ),
          );
          continue;
        }

        if (node.data.nodeId === "fog") {
          const cfg = node.data.defaultConfig;
          const out = evaluateFogOutputs(
            readIncoming(node.id, "near"),
            cfg.near,
            readIncoming(node.id, "far"),
            cfg.far,
            readIncoming(node.id, "density"),
            cfg.density,
          );
          pinValues.set(studioFlowPinKey(node.id, "near"), out.near);
          pinValues.set(studioFlowPinKey(node.id, "far"), out.far);
          pinValues.set(studioFlowPinKey(node.id, "density"), out.density);
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            flowWireFogFromEval(out, cfg as Record<string, unknown>),
          );
          continue;
        }

        if (node.data.nodeId === "morph-target") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateMorphWeight(readIncoming(node.id, "value"), cfg.value),
          );
          continue;
        }

        if (node.data.nodeId === "scene-light") {
          const cfg = node.data.defaultConfig;
          const light = evaluateSceneLightOutputs(
            readIncoming(node.id, "intensity"),
            cfg.intensity,
            readIncoming(node.id, "r"),
            cfg.r,
            readIncoming(node.id, "g"),
            cfg.g,
            readIncoming(node.id, "b"),
            cfg.b,
            readIncoming(node.id, "x"),
            cfg.x,
            readIncoming(node.id, "y"),
            cfg.y,
            readIncoming(node.id, "z"),
            cfg.z,
          );
          pinValues.set(
            studioFlowPinKey(node.id, "intensity"),
            light.intensity,
          );
          pinValues.set(studioFlowPinKey(node.id, "r"), light.r);
          pinValues.set(studioFlowPinKey(node.id, "g"), light.g);
          pinValues.set(studioFlowPinKey(node.id, "b"), light.b);
          pinValues.set(studioFlowPinKey(node.id, "x"), light.x);
          pinValues.set(studioFlowPinKey(node.id, "y"), light.y);
          pinValues.set(studioFlowPinKey(node.id, "z"), light.z);
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            flowWireStudioLightFromEval(light, cfg as Record<string, unknown>),
          );
          continue;
        }

        if (node.data.nodeId === "camera-switch") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateCameraSwitchIndex(
              readIncoming(node.id, "index"),
              cfg.index,
            ),
          );
          continue;
        }

        if (node.data.nodeId === "post-processing") {
          const cfg = node.data.defaultConfig;
          const pp = evaluatePostProcessingOutputs(
            readIncoming(node.id, "bloomIntensity"),
            cfg.bloomIntensity,
            readIncoming(node.id, "bloomThreshold"),
            cfg.bloomThreshold,
          );
          pinValues.set(
            studioFlowPinKey(node.id, "bloomIntensity"),
            pp.bloomIntensity,
          );
          pinValues.set(
            studioFlowPinKey(node.id, "bloomThreshold"),
            pp.bloomThreshold,
          );
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            flowWirePostProcessingFromEval(pp, cfg as Record<string, unknown>),
          );
          continue;
        }

        if (node.data.nodeId === "contact-shadows") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const cs = evaluateContactShadowsOutputs(cfg);
          pinValues.set(studioFlowPinKey(node.id, "opacity"), cs.opacity);
          pinValues.set(studioFlowPinKey(node.id, "blur"), cs.blur);
          pinValues.set(studioFlowPinKey(node.id, "far"), cs.far);
          pinValues.set(studioFlowPinKey(node.id, "scale"), cs.scale);
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            flowWireContactShadowsFromEval(cs, cfg),
          );
          continue;
        }

        if (node.data.nodeId === "box-collider") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateBoxColliderOutput(node),
          );
          continue;
        }

        if (node.data.nodeId === "sphere-collider") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateSphereColliderOutput(node),
          );
          continue;
        }

        if (node.data.nodeId === "rigid-body") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const label =
            typeof node.data.label === "string" &&
            node.data.label.trim().length > 0
              ? node.data.label.trim()
              : "rigid-body";
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            flowWirePhysicsRigidBodyFromConfig(node.id, label, cfg),
          );
          continue;
        }

        if (node.data.nodeId === "physics-world") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const colliders = collectPhysicsCollidersForWorld({
            nodes,
            edges,
            physicsWorldNodeId: node.id,
            pinValues,
            includeUnwiredGraphNodes: cfg.enabled !== false,
          });
          const rigidBodies = collectPhysicsRigidBodiesForWorld({
            edges,
            physicsWorldNodeId: node.id,
            pinValues,
          });
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluatePhysicsWorldOutput(cfg, colliders, rigidBodies),
          );
          continue;
        }

        if (
          node.data.nodeId != null &&
          isPhysicsDomainStubNodeId(node.data.nodeId)
        ) {
          continue;
        }

        if (node.data.nodeId === "particle-emitter") {
          const cfg = node.data.defaultConfig;
          const em = evaluateEmitterOutputs(
            readIncoming(node.id, "trigger"),
            cfg.trigger,
            readIncoming(node.id, "rate"),
            cfg.rate,
          );
          pinValues.set(studioFlowPinKey(node.id, "trigger"), em.trigger);
          pinValues.set(studioFlowPinKey(node.id, "rate"), em.rate);
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            flowWireParticleEmitterFromEval(em, cfg as Record<string, unknown>),
          );
          continue;
        }

        if (node.data.nodeId === "uv-transform") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const uv = evaluateUvTransformOutputs(cfg, (key) =>
            readIncoming(node.id, key),
          );
          for (const key of UV_TRANSFORM_KEYS) {
            pinValues.set(studioFlowPinKey(node.id, key), uv[key]);
          }
          continue;
        }

        if (node.data.nodeId === "material-variant") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateMaterialVariantName(
              readIncoming(node.id, "variant"),
              cfg.variant,
            ),
          );
          continue;
        }

        if (node.data.nodeId === "boolean-constant") {
          const raw = node.data.defaultConfig.value;
          let b = false;
          if (typeof raw === "boolean") {
            b = raw;
          } else if (typeof raw === "number" && Number.isFinite(raw)) {
            b = raw !== 0;
          } else if (typeof raw === "string") {
            const s = raw.trim().toLowerCase();
            b = s === "true" || s === "1" || s === "yes";
          }
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), b);
          continue;
        }

        if (node.data.nodeId === "event-toggle-boolean") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            readEventBooleanValue(
              node.data.defaultConfig as Record<string, unknown>,
            ),
          );
          continue;
        }

        if (node.data.nodeId === "event-set-boolean") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            readEventBooleanValue(
              node.data.defaultConfig as Record<string, unknown>,
            ),
          );
          continue;
        }

        if (
          node.data.nodeId === "number-constant" ||
          node.data.nodeId === "float-constant" ||
          node.data.nodeId === "integer-constant"
        ) {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const v = coerceNumberConstantValue(dc, dc.value);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), v);
          continue;
        }

        if (node.data.nodeId === "glb-material-param") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const wired = readIncoming(node.id, STUDIO_HANDLE_IN);
          const v =
            wired != null && typeof wired === "number" && Number.isFinite(wired)
              ? wired
              : coerceNumberConstantValue(dc, dc.value);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), v);
          continue;
        }

        if (node.data.nodeId === "material-mix") {
          const a = narrowNumber(readIncoming(node.id, "a"));
          const b = narrowNumber(readIncoming(node.id, "b"));
          const factor = clampNumber(
            asFiniteNumber(node.data.defaultConfig.factor, 0.5),
            0,
            1,
          );
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            a * (1 - factor) + b * factor,
          );
          continue;
        }

        if (node.data.nodeId === "math") {
          const a = narrowNumber(readIncoming(node.id, "a"));
          const b = narrowNumber(readIncoming(node.id, "b"));
          const operation =
            typeof node.data.defaultConfig.operation === "string"
              ? node.data.defaultConfig.operation
              : undefined;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateMathOperation(operation, a, b),
          );
          continue;
        }

        if (node.data.nodeId === "compare") {
          const a = narrowNumber(readIncoming(node.id, "a"));
          const b = narrowNumber(readIncoming(node.id, "b"));
          const operation =
            typeof node.data.defaultConfig.operation === "string"
              ? node.data.defaultConfig.operation
              : undefined;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateCompareOperation(operation, a, b),
          );
          continue;
        }

        if (node.data.nodeId === "lerp") {
          const a = readLerpInputValue(
            readIncoming(node.id, "a"),
            LERP_INPUT_DEFAULTS.a,
          );
          const b = readLerpInputValue(
            readIncoming(node.id, "b"),
            LERP_INPUT_DEFAULTS.b,
          );
          const t = readLerpInputValue(
            readIncoming(node.id, "t"),
            LERP_INPUT_DEFAULTS.t,
          );
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateLerp(a, b, t),
          );
          continue;
        }

        if (node.data.nodeId === "switch") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateSwitchNumber(
              readIncoming(node.id, "condition"),
              readIncoming(node.id, "ifTrue"),
              readIncoming(node.id, "ifFalse"),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "combine-xyz") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateCombineXyz(
              narrowNumber(readIncoming(node.id, "x")),
              narrowNumber(readIncoming(node.id, "y")),
              narrowNumber(readIncoming(node.id, "z")),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "combine-quaternion") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateCombineQuaternion(
              narrowNumber(readIncoming(node.id, "w")),
              narrowNumber(readIncoming(node.id, "x")),
              narrowNumber(readIncoming(node.id, "y")),
              narrowNumber(readIncoming(node.id, "z")),
            ),
          );
          continue;
        }

        if (isVectorQuaternionMathNodeId(node.data.nodeId)) {
          const result = evaluateVectorQuaternionMathNode(
            node.data.nodeId,
            (handleId) => readIncoming(node.id, handleId),
            node.data.defaultConfig,
          );
          if (result != null) {
            pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), result);
          }
          continue;
        }

        if (node.data.nodeId === "logic-gate") {
          const operation =
            typeof node.data.defaultConfig.operation === "string"
              ? node.data.defaultConfig.operation
              : undefined;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateLogicGateOperation(
              operation,
              readIncoming(node.id, "a"),
              readIncoming(node.id, "b"),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "multiplexer") {
          const paths = readMultiplexerPaths(node.data.defaultConfig);
          const results = evaluateMultiplexer(
            readIncoming(node.id, "payload"),
            paths,
          );
          for (const [handleId, value] of Object.entries(results)) {
            pinValues.set(studioFlowPinKey(node.id, handleId), value);
          }
          continue;
        }

        if (node.data.nodeId === "value-normalizer") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateValueNormalizer(
              readValueNormalizerInput(
                readIncoming(node.id, "value"),
                cfg.value,
                0,
              ),
              readValueNormalizerInput(
                readIncoming(node.id, "inMin"),
                cfg.inMin,
                0,
              ),
              readValueNormalizerInput(
                readIncoming(node.id, "inMax"),
                cfg.inMax,
                1,
              ),
              readValueNormalizerInput(
                readIncoming(node.id, "outMin"),
                cfg.outMin,
                0,
              ),
              readValueNormalizerInput(
                readIncoming(node.id, "outMax"),
                cfg.outMax,
                1,
              ),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "map-range") {
          const cfg = node.data.defaultConfig;
          const wiredValue =
            readIncoming(node.id, "value") ??
            readIncoming(node.id, STUDIO_HANDLE_IN);
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateMapRange(
              readMapRangeInput(
                wiredValue,
                cfg.value,
                MAP_RANGE_INPUT_DEFAULTS.value,
              ),
              readMapRangeInput(
                readIncoming(node.id, "inMin"),
                cfg.inMin,
                MAP_RANGE_INPUT_DEFAULTS.inMin,
              ),
              readMapRangeInput(
                readIncoming(node.id, "inMax"),
                cfg.inMax,
                MAP_RANGE_INPUT_DEFAULTS.inMax,
              ),
              readMapRangeInput(
                readIncoming(node.id, "outMin"),
                cfg.outMin,
                MAP_RANGE_INPUT_DEFAULTS.outMin,
              ),
              readMapRangeInput(
                readIncoming(node.id, "outMax"),
                cfg.outMax,
                MAP_RANGE_INPUT_DEFAULTS.outMax,
              ),
              cfg.clamp !== false,
            ),
          );
          continue;
        }

        if (node.data.nodeId === "clamp") {
          const cfg = node.data.defaultConfig;
          const wiredValue =
            readIncoming(node.id, "value") ??
            readIncoming(node.id, STUDIO_HANDLE_IN);
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateClamp(
              readClampInput(wiredValue, cfg.value, CLAMP_INPUT_DEFAULTS.value),
              readClampInput(
                readIncoming(node.id, "min"),
                cfg.min,
                CLAMP_INPUT_DEFAULTS.min,
              ),
              readClampInput(
                readIncoming(node.id, "max"),
                cfg.max,
                CLAMP_INPUT_DEFAULTS.max,
              ),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "glb-material-texture") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const url = readGlbMaterialTextureUrl(dc);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), url);
          continue;
        }

        if (node.data.nodeId === "sensor-input") {
          const rawKey = node.data.defaultConfig.sourceKey;
          const sourceKey =
            typeof rawKey === "string" && rawKey.trim().length > 0
              ? rawKey.trim()
              : "bmi270.accel.x";
          const live = resolveLiveNumericFromLatestByHint(
            latestByHint,
            sourceKey,
          );
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            live != null && Number.isFinite(live) ? Number(live.toFixed(6)) : 0,
          );
          if (live != null && Number.isFinite(live)) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "dps368-input") {
          const bundle = computeDps368PinBundle(latestByHint);
          pinValues.set(
            studioFlowPinKey(node.id, "pressure"),
            bundle.pressureHpa,
          );
          pinValues.set(studioFlowPinKey(node.id, "temp"), bundle.tempC);
          pinValues.set(studioFlowPinKey(node.id, "samples"), bundle.counter);
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "sht40-input") {
          const bundle = computeSht40PinBundle(latestByHint);
          pinValues.set(
            studioFlowPinKey(node.id, "humidity"),
            bundle.humidityPct,
          );
          pinValues.set(studioFlowPinKey(node.id, "temp"), bundle.tempC);
          pinValues.set(studioFlowPinKey(node.id, "samples"), bundle.counter);
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "bmm350-input") {
          const bundle = computeBmm350PinBundle(latestByHint);
          pinValues.set(
            studioFlowPinKey(node.id, "magnetic"),
            bundle.magneticUt,
          );
          pinValues.set(studioFlowPinKey(node.id, "temp"), bundle.tempC);
          pinValues.set(studioFlowPinKey(node.id, "samples"), bundle.counter);
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "bmi270-input") {
          const bundle = computeBmi270PinBundle(latestByHint);
          const bmiSample = latestByHint.bmi270;
          const prevQuat = node.data.liveQuaternionWire ?? {
            x: 0,
            y: 0,
            z: 0,
            w: 1,
          };
          const prevEuler = node.data.liveVector3ByHandle?.euler ?? {
            x: 0,
            y: 0,
            z: 0,
          };
          const prevAccel = node.data.liveVector3ByHandle?.accel ?? {
            x: 0,
            y: 0,
            z: 0,
          };
          const prevGyro = node.data.liveVector3ByHandle?.gyro ?? {
            x: 0,
            y: 0,
            z: 0,
          };
          pinValues.set(
            studioFlowPinKey(node.id, "accel"),
            hasLiveBmi270AccelFields(bmiSample) ? bundle.accel : prevAccel,
          );
          pinValues.set(
            studioFlowPinKey(node.id, "gyro"),
            hasLiveBmi270GyroFields(bmiSample) ? bundle.gyro : prevGyro,
          );
          pinValues.set(studioFlowPinKey(node.id, "temp"), bundle.temp);
          pinValues.set(
            studioFlowPinKey(node.id, "euler"),
            hasEulerWireTap
              ? eulerFromWireTap
              : hasLiveBmi270EulerFields(bmiSample)
                ? bundle.euler
                : prevEuler,
          );
          pinValues.set(
            studioFlowPinKey(node.id, "quaternion"),
            hasQuatWireTap
              ? quatFromWireTap
              : hasLiveBmi270QuaternionFields(bmiSample)
                ? bundle.quaternion
                : prevQuat,
          );
          pinValues.set(studioFlowPinKey(node.id, "samples"), bundle.counter);
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (BMI270_TAP_NODE_ID_SET.has(node.data.nodeId)) {
          const bundle = computeBmi270PinBundle(latestByHint);
          const bmiSample = latestByHint.bmi270;
          const prevQuat = node.data.liveQuaternionWire ?? {
            x: 0,
            y: 0,
            z: 0,
            w: 1,
          };
          const prevEuler = node.data.liveVector3Wire ?? { x: 0, y: 0, z: 0 };
          const prevVec = node.data.liveVector3Wire ?? { x: 0, y: 0, z: 0 };
          let out: FlowValue;
          switch (node.data.nodeId) {
            case "bmi270-tap-accel":
              out = hasLiveBmi270AccelFields(bmiSample)
                ? bundle.accel
                : prevVec;
              break;
            case "bmi270-tap-gyro":
              out = hasLiveBmi270GyroFields(bmiSample) ? bundle.gyro : prevVec;
              break;
            case "bmi270-tap-temp": {
              const prevScalar =
                typeof node.data.liveValue === "number" &&
                Number.isFinite(node.data.liveValue)
                  ? node.data.liveValue
                  : 0;
              out = hasLiveBmi270TempFields(bmiSample)
                ? bundle.temp
                : prevScalar;
              break;
            }
            case "bmi270-tap-samples": {
              const prevScalar =
                typeof node.data.liveValue === "number" &&
                Number.isFinite(node.data.liveValue)
                  ? node.data.liveValue
                  : 0;
              out = hasLiveBmi270TempFields(bmiSample)
                ? bundle.counter
                : prevScalar;
              break;
            }
            case "bmi270-tap-euler":
              out = hasEulerWireTap
                ? eulerFromWireTap
                : hasLiveBmi270EulerFields(bmiSample)
                  ? bundle.euler
                  : prevEuler;
              break;
            case "bmi270-tap-quaternion":
              out = hasQuatWireTap
                ? quatFromWireTap
                : hasLiveBmi270QuaternionFields(bmiSample)
                  ? bundle.quaternion
                  : prevQuat;
              break;
            default:
              out = bundle.accel;
          }
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), out);
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (ENVIRONMENT_SENSOR_TAP_NODE_ID_SET.has(node.data.nodeId)) {
          let out: FlowValue = 0;
          let streamLive = false;
          switch (node.data.nodeId) {
            case "dps368-tap-pressure": {
              const b = computeDps368PinBundle(latestByHint);
              out = b.pressureHpa;
              streamLive = b.streamLive;
              break;
            }
            case "dps368-tap-temp": {
              const b = computeDps368PinBundle(latestByHint);
              out = b.tempC;
              streamLive = b.streamLive;
              break;
            }
            case "dps368-tap-samples": {
              const b = computeDps368PinBundle(latestByHint);
              out = b.counter;
              streamLive = b.streamLive;
              break;
            }
            case "sht40-tap-humidity": {
              const b = computeSht40PinBundle(latestByHint);
              out = b.humidityPct;
              streamLive = b.streamLive;
              break;
            }
            case "sht40-tap-temp": {
              const b = computeSht40PinBundle(latestByHint);
              out = b.tempC;
              streamLive = b.streamLive;
              break;
            }
            case "sht40-tap-samples": {
              const b = computeSht40PinBundle(latestByHint);
              out = b.counter;
              streamLive = b.streamLive;
              break;
            }
            case "bmm350-tap-magnetic": {
              const b = computeBmm350PinBundle(latestByHint);
              out = b.magneticUt;
              streamLive = b.streamLive;
              break;
            }
            case "bmm350-tap-temp": {
              const b = computeBmm350PinBundle(latestByHint);
              out = b.tempC;
              streamLive = b.streamLive;
              break;
            }
            case "bmm350-tap-samples": {
              const b = computeBmm350PinBundle(latestByHint);
              out = b.counter;
              streamLive = b.streamLive;
              break;
            }
            default:
              break;
          }
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), out);
          if (streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "vector-splitter") {
          const incomingValue = readIncoming(node.id, STUDIO_HANDLE_IN);
          const vec = flowValueAsVec3(incomingValue);
          pinValues.set(studioFlowPinKey(node.id, "x"), vec.x);
          pinValues.set(studioFlowPinKey(node.id, "y"), vec.y);
          pinValues.set(studioFlowPinKey(node.id, "z"), vec.z);
          continue;
        }

        if (node.data.nodeId === "quaternion-splitter") {
          const incomingValue = readIncoming(node.id, STUDIO_HANDLE_IN);
          const q = flowValueAsQuaternion(incomingValue);
          pinValues.set(studioFlowPinKey(node.id, "x"), q.x);
          pinValues.set(studioFlowPinKey(node.id, "y"), q.y);
          pinValues.set(studioFlowPinKey(node.id, "z"), q.z);
          pinValues.set(studioFlowPinKey(node.id, "w"), q.w);
          continue;
        }

        if (isPlotterNodeId(node.data.nodeId)) {
          continue;
        }

        if (
          node.data.nodeId === "model-viewer" ||
          node.data.nodeId === "scene-output"
        ) {
          continue;
        }

        if (node.data.nodeId === "model-select") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const url =
            typeof dc.selectedModelUrl === "string" ? dc.selectedModelUrl : "";
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), url);
          continue;
        }

        if (node.data.nodeId === "environment") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const wire = computeAggregatedEnvironmentWire(
            node.id,
            dc,
            edges,
            (tid, th) => readIncoming(tid, th),
          );
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "camera-view") {
          const wire = flowWireCameraFromNodeDefaultConfig(
            node.data.defaultConfig as Record<string, unknown>,
          );
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "object-transform") {
          const wire = flowWireTransformFromNodeDefaultConfig(
            node.data.defaultConfig as Record<string, unknown>,
          );
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "transform-from-euler") {
          const euler = flowValueAsVec3(
            readIncoming(node.id, STUDIO_HANDLE_IN),
          );
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const eulerMapping = readFlowWireTransformEulerMapping(
            dc.eulerMapping,
          );
          const wire = flowWireTransformFromEulerRad(
            euler,
            undefined,
            eulerMapping,
          );
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "glb-animation-bundle") {
          const wire = flowAnimationWireFromBundleDefaultConfig(
            node.data.defaultConfig as Record<string, unknown>,
          );
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "animation-clip") {
          const wiredTime = readIncoming(node.id, "time");
          const wiredSpeed = readIncoming(node.id, "speed");
          const wiredWeight = readIncoming(node.id, "weight");
          const wiredEnabled = readIncoming(node.id, "enabled");
          const wire = flowAnimationWireFromAnimationClipEval({
            defaultConfig: node.data.defaultConfig as Record<string, unknown>,
            wired: {
              timeS:
                typeof wiredTime === "number" && Number.isFinite(wiredTime)
                  ? wiredTime
                  : undefined,
              speed:
                typeof wiredSpeed === "number" && Number.isFinite(wiredSpeed)
                  ? wiredSpeed
                  : undefined,
              weight:
                typeof wiredWeight === "number" && Number.isFinite(wiredWeight)
                  ? wiredWeight
                  : undefined,
              enabled:
                typeof wiredEnabled === "boolean" ? wiredEnabled : undefined,
            },
          });
          if (wire != null) {
            pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          }
          continue;
        }

        if (node.data.nodeId === "animation-merge") {
          const mergeCount = readAnimationMergeInputCount(node.data.defaultConfig);
          const mergeWires = [];
          for (let i = 0; i < mergeCount; i += 1) {
            mergeWires.push(
              flowValueAsAnimation(readIncoming(node.id, animationMergeInputHandleId(i))),
            );
          }
          const wire = mergeFlowWireAnimationsV1(mergeWires);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "animation-mix") {
          const mixDc = node.data.defaultConfig as Record<string, unknown>;
          const mixCount = readAnimationMixInputCount(mixDc);
          const configWeights = readMixWeights(mixDc, mixCount);
          const mixWires = [];
          const mixWeights = [];
          for (let i = 0; i < mixCount; i += 1) {
            mixWires.push(
              flowValueAsAnimation(readIncoming(node.id, animationMergeInputHandleId(i))),
            );
            const wiredWeight = readIncoming(node.id, animationMixWeightHandleId(i));
            mixWeights.push(
              typeof wiredWeight === "number" && Number.isFinite(wiredWeight)
                ? wiredWeight
                : configWeights[i] ?? 0,
            );
          }
          const wire = mixFlowWireAnimationsV1({
            wires: mixWires,
            weights: mixWeights,
            normalize: readNormalizeMixWeights(mixDc),
          });
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "animation-blend") {
          const wiredFactor = readIncoming(node.id, "factor");
          const dcBlend = node.data.defaultConfig as Record<string, unknown>;
          const factorRaw =
            typeof wiredFactor === "number" && Number.isFinite(wiredFactor)
              ? wiredFactor
              : dcBlend.factor;
          const factor =
            typeof factorRaw === "number" && Number.isFinite(factorRaw)
              ? Math.min(1, Math.max(0, factorRaw))
              : 0.5;
          const crossfadeRaw = dcBlend.crossfadeS;
          const crossfadeS =
            typeof crossfadeRaw === "number" && Number.isFinite(crossfadeRaw)
              ? Math.max(0, crossfadeRaw)
              : 0.3;
          const wire = blendFlowWireAnimationsV1({
            wireA: flowValueAsAnimation(readIncoming(node.id, "a")),
            wireB: flowValueAsAnimation(readIncoming(node.id, "b")),
            factor,
            crossfadeS,
          });
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        const incomingValue = readIncoming(node.id, STUDIO_HANDLE_IN);

        if (node.data.nodeId === "number-average") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            narrowNumber(incomingValue),
          );
          continue;
        }

        if (node.data.nodeId === "threshold") {
          const rawThreshold = node.data.defaultConfig.value;
          const threshold =
            typeof rawThreshold === "number"
              ? rawThreshold
              : Number(rawThreshold ?? 0.5);
          const operator = node.data.defaultConfig.operator === "<" ? "<" : ">";
          const numericIncoming = narrowNumber(incomingValue);
          const result =
            operator === ">"
              ? numericIncoming > threshold
              : numericIncoming < threshold;
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), result);
          continue;
        }

        if (node.data.nodeId === "low-pass") {
          const alpha = clampNumber(
            asFiniteNumber(node.data.defaultConfig.alpha, 0.2),
            0,
            1,
          );
          const numericIncoming = narrowNumber(incomingValue);
          const prev = pinValues.get(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
          );
          const prevNumber = typeof prev === "number" ? prev : numericIncoming;
          const smoothed = prevNumber + alpha * (numericIncoming - prevNumber);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), smoothed);
          continue;
        }

        if (node.data.nodeId === "indicator") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            typeof incomingValue === "boolean" ? incomingValue : false,
          );
          continue;
        }

        pinValues.set(
          studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
          incomingValue,
        );
      }
    }

    const plotterHistUpdates = new Map<string, Record<string, number[]>>();
    for (const node of nodes) {
      if (!isPlotterNodeId(node.data.nodeId)) {
        continue;
      }
      const plotterCfg = coercePlotterConfig(node.data.defaultConfig);
      if (plotterCfg.pauseAcquisition) {
        continue;
      }
      const handles = node.data.inputHandles ?? [];
      const cap = plotterCfg.historyLength;
      const prev = node.data.livePlotHistory ?? {};
      const nextCh: Record<string, number[]> = {};
      for (const h of handles) {
        const pinVal = readPinForEdgeTarget(edges, node.id, h.id, pinValues);
        const sample =
          typeof pinVal === "number" && Number.isFinite(pinVal)
            ? pinVal
            : Number.NaN;
        const series = [...(prev[h.id] ?? [])];
        series.push(sample);
        nextCh[h.id] = series.slice(-cap);
      }
      plotterHistUpdates.set(node.id, nextCh);
    }

    const nodeById = new Map(
      nodes.map((n) => [n.id, { id: n.id, type: n.type, data: n.data }]),
    );

    const patchSceneOutputLiveWires = (
      base: StudioNodeData,
      nodeId: string,
    ): void => {
      const envVal = readIncoming(nodeId, STUDIO_HANDLE_ENV);
      const envWire = flowValueAsEnvironment(envVal);
      if (envWire != null) {
        base.liveEnvironmentWire = envWire;
      } else {
        delete base.liveEnvironmentWire;
      }
      const camVal = readIncoming(nodeId, STUDIO_HANDLE_CAM);
      const camWire = flowValueAsCamera(camVal);
      if (camWire != null) {
        base.liveCameraWire = camWire;
      } else {
        delete base.liveCameraWire;
      }
      const animVal = readIncoming(nodeId, STUDIO_HANDLE_ANIM);
      const animWire = flowValueAsAnimation(animVal);
      if (animWire != null) {
        base.liveAnimationWire = animWire;
      } else {
        delete base.liveAnimationWire;
      }
      const xfVal = readIncoming(nodeId, STUDIO_HANDLE_XF);
      const xfWire = flowValueAsTransform(xfVal);
      if (xfWire != null) {
        base.liveTransformWire = xfWire;
      } else {
        delete base.liveTransformWire;
      }
      const physVal = readIncoming(nodeId, STUDIO_HANDLE_PHYS);
      const physWire = flowValueAsPhysicsScene(physVal);
      if (physWire != null) {
        base.livePhysicsWire = physWire;
      } else {
        delete base.livePhysicsWire;
      }
      applyIncomingSceneFxWires(base, nodeId, (handle) =>
        readIncoming(nodeId, handle),
      );
    };

    const patchNodeGroupHostLive = (
      node: FlowGraphNode,
      parentEdges: Edge[],
      subgraphs: Record<string, StudioSubgraphDocument>,
    ): FlowGraphNode => {
      if (!isStudioNodeGroupNode(node)) {
        return node;
      }
      const groupData = node.data as StudioNodeGroupData;
      const subKey = groupData.subgraphId ?? node.id;
      const sub = subgraphs[subKey];
      if (sub == null) {
        return node;
      }
      const live = buildStudioNodeGroupHostLiveFields({
        hostNodeId: node.id,
        subgraphKey: subKey,
        iface: sub.interface,
        parentEdges,
        subgraph: sub,
        flattenedEdges: edges,
        pinValues,
      });
      return {
        ...node,
        data: {
          ...groupData,
          liveNumberByHandle: live.liveNumberByHandle,
          liveBooleanByHandle: live.liveBooleanByHandle,
          liveStringByHandle: live.liveStringByHandle,
          liveVector3ByHandle: live.liveVector3ByHandle,
        },
      };
    };

    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (isStudioNodeGroupNode(node)) {
          return patchNodeGroupHostLive(node, state.edges, state.subgraphs);
        }
        if (isStudioGroupBoundaryNode(node)) {
          if (state.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
            return node;
          }
          const host = state.rootNodes.find(
            (n) =>
              isStudioNodeGroupNode(n) &&
              (n.data.subgraphId ?? n.id) === state.activeGraphId,
          );
          if (host == null) {
            return node;
          }
          const boundaryData = node.data as StudioGroupBoundaryData;
          const role = node.type === "studio-group-input" ? "input" : "output";
          const live = buildStudioGroupBoundaryLiveFields({
            role,
            boundaryNodeId: node.id,
            iface: boundaryData.interface,
            subgraphEdges: state.edges,
            flattenedEdges: edges,
            hostNodeId: host.id,
            pinValues,
          });
          return {
            ...node,
            data: {
              ...boundaryData,
              liveNumberByHandle: live.liveNumberByHandle,
              liveBooleanByHandle: live.liveBooleanByHandle,
              liveStringByHandle: live.liveStringByHandle,
              liveVector3ByHandle: live.liveVector3ByHandle,
            },
          };
        }

        if (node.type !== "studio") {
          return node;
        }

        const dataWithoutSensorMode: StudioNodeData = { ...node.data };
        delete dataWithoutSensorMode.sensorStreamMode;
        delete dataWithoutSensorMode.sensorHealth;
        delete dataWithoutSensorMode.sensorInvalidReason;
        delete dataWithoutSensorMode.sensorLastValidAtByHandle;
        delete dataWithoutSensorMode.sensorInvalidByHandle;
        delete dataWithoutSensorMode.liveVector3ByHandle;
        delete dataWithoutSensorMode.liveNumberByHandle;
        delete dataWithoutSensorMode.liveBooleanByHandle;
        delete dataWithoutSensorMode.liveStringByHandle;
        delete dataWithoutSensorMode.liveInputNumberByHandle;
        delete dataWithoutSensorMode.liveInputBooleanByHandle;
        delete dataWithoutSensorMode.liveInputStringByHandle;
        delete dataWithoutSensorMode.liveInputVector3ByHandle;
        delete dataWithoutSensorMode.liveInputScalarHintsByHandle;
        if (
          node.data.nodeId !== "bmi270-tap-euler" &&
          node.data.nodeId !== "bmi270-tap-accel" &&
          node.data.nodeId !== "bmi270-tap-gyro" &&
          node.data.nodeId !== "bmm350-tap-magnetic" &&
          node.data.nodeId !== "rotation-3d-euler" &&
          node.data.nodeId !== "glb-material-color"
        ) {
          delete dataWithoutSensorMode.liveVector3Wire;
        }
        if (
          node.data.nodeId !== "bmi270-input" &&
          node.data.nodeId !== "quat-input" &&
          node.data.nodeId !== "bmi270-tap-quaternion" &&
          node.data.nodeId !== "rotation-3d-quaternion"
        ) {
          delete dataWithoutSensorMode.liveQuaternionWire;
        }
        if (
          node.data.nodeId !== "rotation-3d-euler" &&
          node.data.nodeId !== "rotation-3d-quaternion" &&
          node.data.nodeId !== "model-viewer"
        ) {
          delete dataWithoutSensorMode.liveEnvironmentWire;
        }
        if (
          node.data.nodeId !== "rotation-3d-euler" &&
          node.data.nodeId !== "rotation-3d-quaternion" &&
          node.data.nodeId !== "model-viewer"
        ) {
          delete dataWithoutSensorMode.liveCameraWire;
        }
        if (
          node.data.nodeId !== "rotation-3d-euler" &&
          node.data.nodeId !== "rotation-3d-quaternion" &&
          node.data.nodeId !== "model-viewer" &&
          node.data.nodeId !== "scene-output" &&
          node.data.nodeId !== "animation-clip" &&
          node.data.nodeId !== "glb-animation-bundle" &&
          node.data.nodeId !== "animation-merge" &&
          node.data.nodeId !== "animation-mix" &&
          node.data.nodeId !== "animation-blend"
        ) {
          delete dataWithoutSensorMode.liveAnimationWire;
        }
        if (
          node.data.nodeId !== "rotation-3d-euler" &&
          node.data.nodeId !== "rotation-3d-quaternion" &&
          node.data.nodeId !== "model-viewer"
        ) {
          delete dataWithoutSensorMode.liveTransformWire;
        }
        if (
          node.data.nodeId !== "rotation-3d-euler" &&
          node.data.nodeId !== "rotation-3d-quaternion" &&
          node.data.nodeId !== "model-viewer"
        ) {
          delete dataWithoutSensorMode.liveSettingsExposure;
          delete dataWithoutSensorMode.liveFogWire;
          delete dataWithoutSensorMode.liveStudioLightWire;
          delete dataWithoutSensorMode.livePostProcessingWire;
          delete dataWithoutSensorMode.liveContactShadowsWire;
          delete dataWithoutSensorMode.liveParticleEmitterWire;
        }
        if (!isPlotterNodeId(node.data.nodeId)) {
          delete dataWithoutSensorMode.livePlotHistory;
        }

        const outPin = pinValues.get(
          studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
        );
        let nextLive: number | boolean | string | null = null;
        if (
          node.data.nodeId === "bmi270-input" ||
          node.data.nodeId === "dps368-input" ||
          node.data.nodeId === "sht40-input" ||
          node.data.nodeId === "bmm350-input" ||
          node.data.nodeId === "quat-input" ||
          node.data.nodeId === "quaternion-constant" ||
          node.data.nodeId === "vector-splitter" ||
          node.data.nodeId === "quaternion-splitter" ||
          node.data.nodeId === "combine-quaternion" ||
          node.data.nodeId === "combine-xyz" ||
          node.data.nodeId === "vector-constant" ||
          isVectorQuaternionMathNodeId(node.data.nodeId) ||
          node.data.nodeId === "rotation-3d-euler" ||
          node.data.nodeId === "rotation-3d-quaternion" ||
          node.data.nodeId === "model-viewer" ||
          node.data.nodeId === "environment" ||
          node.data.nodeId === "camera-view" ||
          node.data.nodeId === "object-transform" ||
          node.data.nodeId === "transform-from-euler" ||
          node.data.nodeId === "fog" ||
          node.data.nodeId === "scene-light" ||
          node.data.nodeId === "post-processing" ||
          node.data.nodeId === "contact-shadows" ||
          node.data.nodeId === "particle-emitter" ||
          isPlotterNodeId(node.data.nodeId) ||
          BMI270_TAP_NODE_ID_SET.has(node.data.nodeId) ||
          ENVIRONMENT_SENSOR_TAP_NODE_ID_SET.has(node.data.nodeId)
        ) {
          nextLive = null;
        } else if (
          typeof outPin === "number" ||
          typeof outPin === "boolean" ||
          typeof outPin === "string"
        ) {
          nextLive = outPin;
        }

        const nextHistory = isPlotterNodeId(node.data.nodeId)
          ? []
          : typeof nextLive === "number"
            ? [
                ...(node.data.liveHistory ?? []).slice(
                  -Math.max(
                    1,
                    node.data.nodeId === "sparkline"
                      ? Math.min(
                          512,
                          Math.round(
                            asFiniteNumber(
                              node.data.defaultConfig.historySize,
                              64,
                            ),
                          ),
                        )
                      : 64,
                  ) + 1,
                ),
                nextLive,
              ]
            : (node.data.liveHistory ?? []).slice(-64);

        const base: StudioNodeData = {
          ...dataWithoutSensorMode,
          liveValue: nextLive,
          liveHistory: nextHistory,
          lastUpdatedAt: nowIso,
        };

        if (isPlotterNodeId(node.data.nodeId)) {
          base.livePlotHistory = plotterHistUpdates.get(node.id) ?? {};
          base.liveValue = null;
          base.liveHistory = [];
        }

        if (
          node.data.nodeId === "event-toggle-glb-part" ||
          node.data.nodeId === "event-set-glb-part"
        ) {
          base.liveValue = readGlbPartVisibilityScalar(
            node.data.defaultConfig as Record<string, unknown>,
          );
          base.liveHistory = [];
        }

        if (node.data.nodeId === "event-trigger-glb-anim") {
          base.liveValue = readGlbAnimTriggerNonce(
            node.data.defaultConfig as Record<string, unknown>,
          );
          base.liveHistory = [];
        }

        if (node.data.nodeId === "glb-material-color") {
          const wired = readIncoming(node.id, STUDIO_HANDLE_IN);
          base.liveVector3Wire =
            wired != null
              ? flowValueAsVec3(wired)
              : (() => {
                  const rgb = readGlbMaterialColorRgbFromConfig(
                    node.data.defaultConfig as Record<string, unknown>,
                  );
                  return { x: rgb.r, y: rgb.g, z: rgb.b };
                })();
          base.liveValue = null;
          base.liveHistory = [];
        }

        if (
          node.data.nodeId === "animation-clip" ||
          node.data.nodeId === "glb-animation-bundle" ||
          node.data.nodeId === "animation-merge" ||
          node.data.nodeId === "animation-mix" ||
          node.data.nodeId === "animation-blend"
        ) {
          const animOut = flowValueAsAnimation(
            pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT)),
          );
          if (animOut != null && Object.keys(animOut.clips).length > 0) {
            base.liveAnimationWire = animOut;
          } else {
            delete base.liveAnimationWire;
          }
        }

        if (node.data.nodeId === "part-spin") {
          const wiredSpeed = readIncoming(node.id, "speed");
          const wiredEnabled = readIncoming(node.id, "enabled");
          if (typeof wiredSpeed === "number" && Number.isFinite(wiredSpeed)) {
            base.liveInputNumberByHandle = {
              ...(node.data.liveInputNumberByHandle ?? {}),
              speed: wiredSpeed,
            };
          }
          if (typeof wiredEnabled === "boolean") {
            base.liveInputBooleanByHandle = {
              ...(node.data.liveInputBooleanByHandle ?? {}),
              enabled: wiredEnabled,
            };
          }
          base.liveValue = null;
          base.liveHistory = [];
        }

        if (node.data.nodeId === "material-video") {
          const wiredTex = readIncoming(node.id, "tex");
          const wiredGain = readIncoming(node.id, "gain");
          const texWire = flowValueAsVideoTexture(wiredTex);
          if (texWire != null) {
            base.liveVideoTextureWire = texWire;
          } else {
            delete base.liveVideoTextureWire;
          }
          if (typeof wiredGain === "number" && Number.isFinite(wiredGain)) {
            base.liveInputNumberByHandle = {
              ...(node.data.liveInputNumberByHandle ?? {}),
              gain: wiredGain,
            };
          }
          base.liveValue = null;
          base.liveHistory = [];
        }

        if (node.data.nodeId === "css3d-camera-feed") {
          const wiredBus = readIncoming(node.id, "in");
          const wiredVisible = readIncoming(node.id, "visible");
          const wiredOpacity = readIncoming(node.id, "opacity");
          const busWire = flowValueAsVideoBus(wiredBus);
          if (busWire != null) {
            base.liveVideoBusWire = busWire;
          } else {
            delete base.liveVideoBusWire;
          }
          if (typeof wiredVisible === "boolean") {
            base.liveInputBooleanByHandle = {
              ...(node.data.liveInputBooleanByHandle ?? {}),
              visible: wiredVisible,
            };
          }
          if (typeof wiredOpacity === "number" && Number.isFinite(wiredOpacity)) {
            base.liveInputNumberByHandle = {
              ...(node.data.liveInputNumberByHandle ?? {}),
              opacity: wiredOpacity,
            };
          }
          base.liveValue = null;
          base.liveHistory = [];
        }

        if (isVisionInferenceNodeId(node.data.nodeId)) {
          const wiredBus = readIncoming(node.id, "in");
          const wiredEnabled = readIncoming(node.id, "enabled");
          const busWire = flowValueAsVideoBus(wiredBus);
          if (busWire != null) {
            base.liveVideoBusWire = busWire;
          } else {
            delete base.liveVideoBusWire;
          }
          if (typeof wiredEnabled === "boolean") {
            base.liveInputBooleanByHandle = {
              ...(node.data.liveInputBooleanByHandle ?? {}),
              enabled: wiredEnabled,
            };
          }
          base.liveValue = null;
          base.liveHistory = [];
        }

        if (ENVIRONMENT_SENSOR_TAP_NODE_ID_SET.has(node.data.nodeId)) {
          if (node.data.nodeId === "bmm350-tap-magnetic") {
            const vecOut = pinValues.get(
              studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            );
            const isValidVec =
              vecOut != null && typeof vecOut === "object" && "x" in vecOut;
            const prev = node.data.liveVector3Wire;
            if (isValidVec) {
              base.liveVector3Wire = flowValueAsVec3(vecOut);
            } else if (prev != null) {
              base.liveVector3Wire = prev;
            } else {
              base.liveVector3Wire = { x: 0, y: 0, z: 0 };
            }
            base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
              node.data.sensorLastValidAtByHandle,
              "out",
              isValidVec,
              nowIso,
            );
            if (!isValidVec && latestByHint.bmm350 != null) {
              base.sensorInvalidByHandle = {
                out: "Magnetic vector missing in live payload",
              };
            }
          } else {
            const scalarOut = pinValues.get(
              studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            );
            const prevLive =
              typeof node.data.liveValue === "number"
                ? node.data.liveValue
                : undefined;
            const reason = computeNodeInvalidReason(node, latestByHint);
            const isValidScalar =
              reason == null &&
              typeof scalarOut === "number" &&
              Number.isFinite(scalarOut);
            base.liveValue = keepLastFiniteNumber(
              isValidScalar ? scalarOut : undefined,
              prevLive,
              0,
            );
            base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
              node.data.sensorLastValidAtByHandle,
              "out",
              isValidScalar,
              nowIso,
            );
            if (!isValidScalar) {
              if (reason != null) {
                base.sensorInvalidByHandle = { out: reason };
              }
            }
          }
        }

        if (
          node.data.nodeId === "bmi270-tap-temp" ||
          node.data.nodeId === "bmi270-tap-samples"
        ) {
          const scalarOut = pinValues.get(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
          );
          const prevLive =
            typeof node.data.liveValue === "number"
              ? node.data.liveValue
              : undefined;
          const reason = computeNodeInvalidReason(node, latestByHint);
          const isValidScalar =
            reason == null &&
            typeof scalarOut === "number" &&
            Number.isFinite(scalarOut);
          base.liveValue = keepLastFiniteNumber(
            isValidScalar ? scalarOut : undefined,
            prevLive,
            0,
          );
          base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
            node.data.sensorLastValidAtByHandle,
            "out",
            isValidScalar,
            nowIso,
          );
          if (!isValidScalar && reason != null) {
            base.sensorInvalidByHandle = { out: reason };
          }
        }

        if (node.data.nodeId === "dps368-input") {
          const pressure = pinValues.get(studioFlowPinKey(node.id, "pressure"));
          const temp = pinValues.get(studioFlowPinKey(node.id, "temp"));
          const samples = pinValues.get(studioFlowPinKey(node.id, "samples"));
          const prev = node.data.liveNumberByHandle;
          const dpsSample = latestByHint.dps368;
          const pressureValid =
            dpsSample == null ||
            (typeof dpsSample.secondaryX100 === "number" &&
              Number.isFinite(dpsSample.secondaryX100));
          const tempValid =
            dpsSample == null ||
            (typeof dpsSample.temperatureCx100 === "number" &&
              Number.isFinite(dpsSample.temperatureCx100));
          const samplesValid =
            dpsSample != null &&
            typeof dpsSample.counter === "number" &&
            Number.isFinite(dpsSample.counter);
          base.liveNumberByHandle = {
            pressure: keepLastFiniteNumber(
              pressureValid ? pressure : undefined,
              prev?.pressure,
              0,
            ),
            temp: keepLastFiniteNumber(
              tempValid ? temp : undefined,
              prev?.temp,
              0,
            ),
            samples: keepLastFiniteNumber(
              samplesValid ? samples : undefined,
              prev?.samples,
              0,
            ),
          };
          base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
            mergeValidHandleTimestamp(
              node.data.sensorLastValidAtByHandle,
              "pressure",
              pressureValid,
              nowIso,
            ),
            "temp",
            tempValid,
            nowIso,
          );
          if (latestByHint.dps368 != null) {
            const invalidByHandle: Record<string, string> = {};
            if (!pressureValid) {
              invalidByHandle.pressure = "Pressure missing in live payload";
            }
            if (!tempValid) {
              invalidByHandle.temp = "Temperature missing in live payload";
            }
            if (Object.keys(invalidByHandle).length > 0) {
              base.sensorInvalidByHandle = invalidByHandle;
            }
          }
        }

        if (node.data.nodeId === "sht40-input") {
          const humidity = pinValues.get(studioFlowPinKey(node.id, "humidity"));
          const temp = pinValues.get(studioFlowPinKey(node.id, "temp"));
          const samples = pinValues.get(studioFlowPinKey(node.id, "samples"));
          const prev = node.data.liveNumberByHandle;
          const shtSample = latestByHint.sht40;
          const humidityValid =
            shtSample == null ||
            (typeof shtSample.secondaryX100 === "number" &&
              Number.isFinite(shtSample.secondaryX100));
          const tempValid =
            shtSample == null ||
            (typeof shtSample.temperatureCx100 === "number" &&
              Number.isFinite(shtSample.temperatureCx100));
          const samplesValid =
            shtSample != null &&
            typeof shtSample.counter === "number" &&
            Number.isFinite(shtSample.counter);
          base.liveNumberByHandle = {
            humidity: keepLastFiniteNumber(
              humidityValid ? humidity : undefined,
              prev?.humidity,
              0,
            ),
            temp: keepLastFiniteNumber(
              tempValid ? temp : undefined,
              prev?.temp,
              0,
            ),
            samples: keepLastFiniteNumber(
              samplesValid ? samples : undefined,
              prev?.samples,
              0,
            ),
          };
          base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
            mergeValidHandleTimestamp(
              node.data.sensorLastValidAtByHandle,
              "humidity",
              humidityValid,
              nowIso,
            ),
            "temp",
            tempValid,
            nowIso,
          );
          if (latestByHint.sht40 != null) {
            const invalidByHandle: Record<string, string> = {};
            if (!humidityValid) {
              invalidByHandle.humidity = "Humidity missing in live payload";
            }
            if (!tempValid) {
              invalidByHandle.temp = "Temperature missing in live payload";
            }
            if (Object.keys(invalidByHandle).length > 0) {
              base.sensorInvalidByHandle = invalidByHandle;
            }
          }
        }

        if (node.data.nodeId === "bmm350-input") {
          const mag = pinValues.get(studioFlowPinKey(node.id, "magnetic"));
          const temp = pinValues.get(studioFlowPinKey(node.id, "temp"));
          const samples = pinValues.get(studioFlowPinKey(node.id, "samples"));
          const prevVec = node.data.liveVector3ByHandle?.magnetic;
          const bmmSample = latestByHint.bmm350;
          const magValid =
            bmmSample == null ||
            (typeof bmmSample.magneticXUtX100 === "number" &&
              typeof bmmSample.magneticYUtX100 === "number" &&
              typeof bmmSample.magneticZUtX100 === "number");
          const tempValid =
            bmmSample == null ||
            (typeof bmmSample.temperatureCx100 === "number" &&
              Number.isFinite(bmmSample.temperatureCx100));
          const samplesValid =
            bmmSample != null &&
            typeof bmmSample.counter === "number" &&
            Number.isFinite(bmmSample.counter);
          const nextMag = magValid
            ? flowValueAsVec3(mag)
            : (prevVec ?? { x: 0, y: 0, z: 0 });
          base.liveVector3ByHandle = {
            magnetic: nextMag,
          };
          base.liveNumberByHandle = {
            temp: keepLastFiniteNumber(
              tempValid ? temp : undefined,
              node.data.liveNumberByHandle?.temp,
              0,
            ),
            samples: keepLastFiniteNumber(
              samplesValid ? samples : undefined,
              node.data.liveNumberByHandle?.samples,
              0,
            ),
          };
          base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
            mergeValidHandleTimestamp(
              node.data.sensorLastValidAtByHandle,
              "magnetic",
              magValid,
              nowIso,
            ),
            "temp",
            tempValid,
            nowIso,
          );
          if (latestByHint.bmm350 != null) {
            const invalidByHandle: Record<string, string> = {};
            if (!magValid) {
              invalidByHandle.magnetic =
                "Magnetic vector missing in live payload";
            }
            if (!tempValid) {
              invalidByHandle.temp = "Temperature missing in live payload";
            }
            if (Object.keys(invalidByHandle).length > 0) {
              base.sensorInvalidByHandle = invalidByHandle;
            }
          }
        }

        if (node.data.nodeId === "bmi270-input") {
          const accel = pinValues.get(studioFlowPinKey(node.id, "accel"));
          const gyro = pinValues.get(studioFlowPinKey(node.id, "gyro"));
          const euler = pinValues.get(studioFlowPinKey(node.id, "euler"));
          const temp = pinValues.get(studioFlowPinKey(node.id, "temp"));
          const samples = pinValues.get(studioFlowPinKey(node.id, "samples"));
          base.liveVector3ByHandle = {
            accel:
              accel != null &&
              typeof accel === "object" &&
              accel !== null &&
              "x" in accel
                ? (accel as { x: number; y: number; z: number })
                : { x: 0, y: 0, z: 0 },
            gyro:
              gyro != null &&
              typeof gyro === "object" &&
              gyro !== null &&
              "x" in gyro
                ? (gyro as { x: number; y: number; z: number })
                : { x: 0, y: 0, z: 0 },
            euler:
              euler != null &&
              typeof euler === "object" &&
              euler !== null &&
              "x" in euler
                ? (euler as { x: number; y: number; z: number })
                : { x: 0, y: 0, z: 0 },
          };
          base.liveNumberByHandle = {
            temp: typeof temp === "number" && Number.isFinite(temp) ? temp : 0,
            samples:
              typeof samples === "number" && Number.isFinite(samples)
                ? samples
                : 0,
          };
          const quatWire = pinValues.get(
            studioFlowPinKey(node.id, "quaternion"),
          );
          base.liveQuaternionWire = flowValueAsQuaternion(quatWire);
        }

        if (
          node.data.nodeId === "sensor-input" ||
          node.data.nodeId === "bmi270-input" ||
          node.data.nodeId === "dps368-input" ||
          node.data.nodeId === "sht40-input" ||
          node.data.nodeId === "bmm350-input" ||
          BMI270_TAP_NODE_ID_SET.has(node.data.nodeId) ||
          ENVIRONMENT_SENSOR_TAP_NODE_ID_SET.has(node.data.nodeId)
        ) {
          if (sensorHardwareLiveNodeIds.has(node.id)) {
            base.sensorStreamMode = "live";
          } else {
            delete base.sensorStreamMode;
          }
        }

        if (
          node.data.nodeId === "quat-input" ||
          node.data.nodeId === "quaternion-constant"
        ) {
          const qOut = pinValues.get(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
          );
          base.liveQuaternionWire = flowValueAsQuaternion(qOut);
        }

        if (node.data.nodeId === "vector-splitter") {
          const incomingValue = readIncoming(node.id, STUDIO_HANDLE_IN);
          base.liveInputVector3ByHandle = {
            [STUDIO_HANDLE_IN]: flowValueAsVec3(incomingValue),
          };
        }

        if (node.data.nodeId === "quaternion-splitter") {
          const incomingValue = readIncoming(node.id, STUDIO_HANDLE_IN);
          base.liveQuaternionWire = flowValueAsQuaternion(incomingValue);
        }

        if (
          node.data.nodeId === "bmi270-tap-euler" ||
          node.data.nodeId === "bmi270-tap-accel" ||
          node.data.nodeId === "bmi270-tap-gyro"
        ) {
          const vecOut = pinValues.get(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
          );
          base.liveVector3Wire = flowValueAsVec3(vecOut);
        }

        if (node.data.nodeId === "bmi270-tap-quaternion") {
          const qTap = pinValues.get(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
          );
          base.liveQuaternionWire = flowValueAsQuaternion(qTap);
        }

        if (node.data.nodeId === "rotation-3d-euler") {
          const incomingValue = readIncoming(node.id, STUDIO_HANDLE_IN);
          base.liveVector3Wire = flowValueAsVec3(incomingValue);
          const envVal = readIncoming(node.id, STUDIO_HANDLE_ENV);
          const envWire = flowValueAsEnvironment(envVal);
          if (envWire != null) {
            base.liveEnvironmentWire = envWire;
          } else {
            delete base.liveEnvironmentWire;
          }
          const camVal = readIncoming(node.id, STUDIO_HANDLE_CAM);
          const camWire = flowValueAsCamera(camVal);
          if (camWire != null) {
            base.liveCameraWire = camWire;
          } else {
            delete base.liveCameraWire;
          }
          const xfVal = readIncoming(node.id, STUDIO_HANDLE_XF);
          const xfWire = flowValueAsTransform(xfVal);
          if (xfWire != null) {
            base.liveTransformWire = xfWire;
          } else {
            delete base.liveTransformWire;
          }
          const animVal = readIncoming(node.id, STUDIO_HANDLE_ANIM);
          const animWire = flowValueAsAnimation(animVal);
          if (animWire != null) {
            base.liveAnimationWire = animWire;
          } else {
            delete base.liveAnimationWire;
          }
          applyIncomingSceneFxWires(base, node.id, (handle) =>
            readIncoming(node.id, handle),
          );
        }

        if (node.data.nodeId === "rotation-3d-quaternion") {
          const incomingValue = readIncoming(node.id, STUDIO_HANDLE_IN);
          base.liveQuaternionWire = flowValueAsQuaternion(incomingValue);
          const envVal = readIncoming(node.id, STUDIO_HANDLE_ENV);
          const envWire = flowValueAsEnvironment(envVal);
          if (envWire != null) {
            base.liveEnvironmentWire = envWire;
          } else {
            delete base.liveEnvironmentWire;
          }
          const camVal = readIncoming(node.id, STUDIO_HANDLE_CAM);
          const camWire = flowValueAsCamera(camVal);
          if (camWire != null) {
            base.liveCameraWire = camWire;
          } else {
            delete base.liveCameraWire;
          }
          const xfVal = readIncoming(node.id, STUDIO_HANDLE_XF);
          const xfWire = flowValueAsTransform(xfVal);
          if (xfWire != null) {
            base.liveTransformWire = xfWire;
          } else {
            delete base.liveTransformWire;
          }
          const animVal = readIncoming(node.id, STUDIO_HANDLE_ANIM);
          const animWire = flowValueAsAnimation(animVal);
          if (animWire != null) {
            base.liveAnimationWire = animWire;
          } else {
            delete base.liveAnimationWire;
          }
          applyIncomingSceneFxWires(base, node.id, (handle) =>
            readIncoming(node.id, handle),
          );
        }

        if (node.data.nodeId === "scene-output") {
          patchSceneOutputLiveWires(base, node.id);
        }

        if (node.data.nodeId === "model-viewer") {
          const incomingValue = readIncoming(node.id, STUDIO_HANDLE_IN);
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const fbRaw = dc.fallbackModelUrl;
          const fb = typeof fbRaw === "string" ? fbRaw.trim() : "";
          const linkedUrl = resolveStudioSourceModelGlbUrl(
            nodes,
            readSourceModelNodeId(dc),
          );
          base.liveValue =
            typeof incomingValue === "string" && incomingValue.trim().length > 0
              ? incomingValue.trim()
              : linkedUrl != null && linkedUrl.length > 0
                ? linkedUrl
                : fb.length > 0
                  ? fb
                  : null;
          base.liveHistory = [];
          const envVal = readIncoming(node.id, STUDIO_HANDLE_ENV);
          const envWire = flowValueAsEnvironment(envVal);
          if (envWire != null) {
            base.liveEnvironmentWire = envWire;
          } else {
            delete base.liveEnvironmentWire;
          }
          const camVal = readIncoming(node.id, STUDIO_HANDLE_CAM);
          const camWire = flowValueAsCamera(camVal);
          if (camWire != null) {
            base.liveCameraWire = camWire;
          } else {
            delete base.liveCameraWire;
          }
          const animVal = readIncoming(node.id, STUDIO_HANDLE_ANIM);
          const animWire = flowValueAsAnimation(animVal);
          if (animWire != null) {
            base.liveAnimationWire = animWire;
          } else {
            delete base.liveAnimationWire;
          }
          const xfVal = readIncoming(node.id, STUDIO_HANDLE_XF);
          const xfWire = flowValueAsTransform(xfVal);
          if (xfWire != null) {
            base.liveTransformWire = xfWire;
          } else {
            delete base.liveTransformWire;
          }
          applyIncomingSceneFxWires(base, node.id, (handle) =>
            readIncoming(node.id, handle),
          );
          const physVal = readIncoming(node.id, STUDIO_HANDLE_PHYS);
          const physWire = flowValueAsPhysicsScene(physVal);
          if (physWire != null) {
            base.livePhysicsWire = physWire;
          } else {
            delete base.livePhysicsWire;
          }
        }

        syncSocketLivePreviewHandlesFromPinValues({
          nodeId: node.data.nodeId,
          flowNodeId: node.id,
          data: node.data,
          pinValues,
          base,
        });

        syncSocketLivePreviewInputHandlesFromIncoming({
          nodeId: node.data.nodeId,
          flowNodeId: node.id,
          readIncoming: (handle) => readIncoming(node.id, handle),
          data: node.data,
          base,
          incomingByTarget,
          nodeById,
        });

        const sensorTelemetryHint = inferSensorHintFromNode(node);
        const caresAboutSensorHealth =
          sensorTelemetryHint != null || node.data.nodeId === "sensor-input";
        if (caresAboutSensorHealth) {
          const hardwareLive = sensorHardwareLiveNodeIds.has(node.id);
          base.sensorHealth = computeSensorHealthStatus(
            hardwareLive,
            sensorTelemetryHint,
            lastAtByHint,
            deviceSensorCfgBySourceId,
          );
          if (hardwareLive && sensorTelemetryHint != null) {
            base.sensorInvalidReason = computeNodeInvalidReason(
              node,
              latestByHint,
            );
          }
        }

        return {
          ...node,
          data: base,
        };
      });
      const rootNodes =
        state.activeGraphId === STUDIO_ROOT_GRAPH_ID
          ? nodes
          : state.rootNodes.map((node) =>
              isStudioNodeGroupNode(node)
                ? patchNodeGroupHostLive(node, state.rootEdges, state.subgraphs)
                : node,
            );
      return { nodes, rootNodes };
    });
    if (visionTriggerSourceIds.length > 0) {
      dispatchFlowEventSourcesFromHandle(
        get,
        set,
        visionTriggerSourceIds,
        "trigger",
      );
    }
    const stageNodes = nodes.map((node) => {
      if (node.data.nodeId !== "scene-output") {
        return node;
      }
      const base: StudioNodeData = { ...node.data };
      patchSceneOutputLiveWires(base, node.id);
      return { ...node, data: base };
    });
    useStageSceneStore
      .getState()
      .setSnapshot(
        evaluateStageSceneSnapshot({
          nodes: stageNodes,
          edges,
        }),
      );
  },
  dispatchFlowKeyboardEvent: (event) => {
    const { nodes } = get();
    const matchingSources = nodes.filter(
      (n) =>
        n.data.nodeId === "on-key" &&
        keyboardEventMatchesOnKeyConfig(
          event,
          n.data.defaultConfig as Record<string, unknown>,
        ),
    );
    if (matchingSources.length === 0) {
      return false;
    }
    dispatchFlowEventSourcesWithGlbAnimAutoBind(
      get,
      set,
      matchingSources.map((s) => s.id),
    );
    return true;
  },
  dispatchFlowPanePointerEvent: (event) => {
    const { nodes } = get();
    const matchingSources = nodes.filter(
      (n) =>
        n.data.nodeId === "on-click" &&
        pointerEventMatchesOnClickConfig(
          event,
          n.data.defaultConfig as Record<string, unknown>,
        ),
    );
    if (matchingSources.length === 0) {
      return false;
    }
    dispatchFlowEventSourcesWithGlbAnimAutoBind(
      get,
      set,
      matchingSources.map((s) => s.id),
    );
    return true;
  },
  dispatchStagePickEvent: (event) => {
    const { nodes } = get();
    const matchingSources = nodes.filter(
      (n) =>
        n.data.nodeId === "on-stage-pick" &&
        pointerEventMatchesOnClickConfig(
          event,
          n.data.defaultConfig as Record<string, unknown>,
        ),
    );
    if (matchingSources.length === 0) {
      return false;
    }
    const firedAtMs = Date.now();
    const pickWire = flowWireStagePickFromDetail({
      modelIndex: event.modelIndex,
      sourceNodeId: event.sourceNodeId,
      hitPoint: event.hitPoint,
      objectPath: event.objectPath,
      firedAtMs,
    });
    const matchingIds = new Set(matchingSources.map((s) => s.id));
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (!matchingIds.has(n.id)) {
          return n;
        }
        return {
          ...n,
          data: {
            ...n.data,
            liveStagePickWire: pickWire,
            flowEventLastFiredAtMs: firedAtMs,
          },
        };
      }),
    }));
    useStageSceneStore.getState().setPrimaryModelIndex(event.modelIndex);
    dispatchFlowEventSourcesWithGlbAnimAutoBind(
      get,
      set,
      matchingSources.map((s) => s.id),
    );
    return true;
  },
}));

/**
 * Resets module-level drag/resize undo coalescing. Call between node:test cases that
 * exercise `onNodesChange` so order does not leak state.
 */
export function resetLayoutUndoCoalescingForTests(): void {
  if (layoutUndoIdleTimer != null) {
    window.clearTimeout(layoutUndoIdleTimer);
  }
  layoutUndoIdleTimer = undefined;
  layoutUndoPrimed = false;
}
