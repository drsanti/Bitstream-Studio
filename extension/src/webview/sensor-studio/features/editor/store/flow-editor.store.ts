import { create } from "zustand";
import type { Connection, Edge, Node } from "@xyflow/react";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
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
import type { FlowWireQuaternion, FlowWireVec3 } from "../../../core/live/flow-wire-types";
import { useBitstreamLiveStore } from "../../../../bitstream-app/state/bitstreamLive.store";
import {
  useBitstreamDeviceSensorConfigStore,
  type DeviceSensorConfigRow,
} from "../../../../bitstream-app/state/bitstreamDeviceSensorConfig.store";
import { useBmi270FusionEulerWireTapStore } from "../../../../bitstream-app/state/bmi270FusionEulerWireTap.store";
import { useBmi270FusionQuatOrientationStore } from "../../../../bitstream-app/state/bmi270FusionQuatOrientation.store";
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
  evaluateFrameDelta,
  evaluateSceneTime,
} from "../../../core/flow/scene-time-operations";
import { evaluateSceneSettingsExposure } from "../../../core/flow/scene-settings-operations";
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
import { resolveSingleClipAutoBindPatchesForGlbAnimNodes } from "../gltf/glb-anim-clip-auto-bind";
import {
  buildFlowClipboardPayload,
  parseFlowClipboard,
  remapFlowPaste,
  serializeFlowClipboard,
} from "../clipboard/flow-clipboard";
import { createStudioNodeGroupFromSelection } from "../subgraphs/create-studio-node-group";
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
} from "../subgraphs/studio-subgraph-store-sync";
import {
  isExcludedFromNodeGroup,
  isStudioNodeGroupNode,
  STUDIO_ROOT_GRAPH_ID,
  ensureDefaultGroupSockets,
  type StudioGraphId,
  type StudioGroupInterface,
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
import { readPersistedNodeGroupLibrary, writePersistedNodeGroupLibrary } from "../../../persistence/node-group-library.repository";
import { resolveStudioGroupNodePortType } from "../subgraphs/resolve-studio-group-port";
import { pointerEventMatchesOnClickConfig } from "../nodes/events/on-click-config";
import { readGlbAnimTriggerNonce } from "../nodes/events/glb-anim-event-config";
import { readClipboardText, writeClipboardText } from "../../../../ui/utils/clipboard";
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
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  persistScene3DConfig,
} from "../nodes/rotation/scene3d-config";
import {
  coercePlotterConfig,
  isPlotterNodeId,
  migrateLegacyPlotterNodeData,
  persistPlotterConfig,
  type PlotterConfig,
} from "../nodes/plotter/plotter-config";
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
import type { FlowWireTransformV1 } from "../nodes/transform/flow-wire-transform";
import {
  coerceFlowWireTransformV1,
  flowWireTransformFromEulerRad,
  readFlowWireTransformEulerMapping,
  flowWireTransformFromNodeDefaultConfig,
  isFlowWireTransformV1,
} from "../nodes/transform/flow-wire-transform";
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
  readGlbExtractTag,
  resolveWiredStudioModelSelectNodeId,
} from "../model/model-generated-bindings";
import { buildLayoutFlowNode, buildRerouteFlowNode } from "../layout/layout-flow-node-builders";
import { splitEdgeWithReroute, applyRerouteBridgeOnEdgeRemoves, removeFlowNodesFromGraph } from "../layout/reroute-graph-ops";
import {
  applyFlowFrameDragStop,
  dissolveStudioFrames,
  fitFramesToContents,
  sortFlowNodesParentFirst,
} from "../layout/frame-flow-nodes";
import type { LayoutFlowNode, LayoutMenuEntryId } from "../layout/layout-flow-nodes.types";
import { isLayoutFlowNode, splitOutputHandleIds } from "../layout/layout-flow-nodes.types";
import {
  isStudioFlowNode,
  layoutNodeAcceptsInput,
  patchLayoutNodesAfterConnect,
  resolveFlowSourcePortType,
} from "../layout/layout-port-resolution";

export type { FlowWireQuaternion, FlowWireVec3 } from "../../../core/live/flow-wire-types";
export type { FlowWireEnvironmentV1 } from "../nodes/environment/flow-wire-environment";
export type { FlowWireCameraV1 } from "../nodes/camera-view/flow-wire-camera";
export type { FlowWireAnimationV1 } from "../nodes/animation/flow-wire-animation";
export type { FlowWireTransformV1 } from "../nodes/transform/flow-wire-transform";

export type StudioPortType =
  | "number"
  | "boolean"
  | "string"
  | "event"
  | "vector3"
  | "quaternion"
  | "environment"
  | "camera"
  | "glbAnimation"
  | "transform";

/** Present only while Bitstream provides a matching hardware sample for this node. */
export type SensorHardwareStreamLive = "live";
export type SensorHealthStatus = "live" | "stale" | "offline" | "sim";

/** Catalog-derived output pin (React Flow handle `id` = `id`). */
export type StudioOutputHandleDef = {
  id: string;
  portType: StudioPortType;
  label: string;
};

export const STUDIO_HANDLE_OUT = "out";
export const STUDIO_HANDLE_IN = "in";
/** Optional second input on 3D canvas nodes for wired HDRI / background settings. */
export const STUDIO_HANDLE_ENV = "env";
/** Optional third input on 3D canvas nodes for wired camera / orbit framing. */
export const STUDIO_HANDLE_CAM = "cam";
/** Optional fourth input on **`model-viewer`** for structured GLB animation clip drives. */
export const STUDIO_HANDLE_ANIM = "anim";
/** Optional transform input on 3D canvas nodes (model position / rotation / scale). */
export const STUDIO_HANDLE_XF = "xf";

/** Single-output nodes that mirror one BMI270 stream (live hardware or synthesized feed). */
export const BMI270_TAP_NODE_IDS = [
  "bmi270-tap-quaternion",
  "bmi270-tap-euler",
  "bmi270-tap-accel",
  "bmi270-tap-gyro",
  "bmi270-tap-temp",
] as const;

export const BMI270_TAP_NODE_ID_SET = new Set<string>(BMI270_TAP_NODE_IDS);

/** Single-output tap nodes for DPS368 / SHT40 / BMM350 (same bundles as `*-input`). */
export const ENVIRONMENT_SENSOR_TAP_NODE_IDS = [
  "dps368-tap-pressure",
  "dps368-tap-temp",
  "sht40-tap-humidity",
  "sht40-tap-temp",
  "bmm350-tap-magnetic",
  "bmm350-tap-temp",
] as const;

export const ENVIRONMENT_SENSOR_TAP_NODE_ID_SET = new Set<string>(ENVIRONMENT_SENSOR_TAP_NODE_IDS);

/** True for any BMI270 or environment sensor *tap* node (single `out` handle). */
export function isStudioSensorTapNodeId(nodeId: string): boolean {
  return BMI270_TAP_NODE_ID_SET.has(nodeId) || ENVIRONMENT_SENSOR_TAP_NODE_ID_SET.has(nodeId);
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

export function isStudioAlignedOutputSocketColumnsNodeId(nodeId: string): boolean {
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
export const STUDIO_FLOW_SENSOR_HEADER_TAG_BY_NODE_ID: Record<string, string> = {
  "bmi270-input": "BMI270",
  "bmi270-tap-quaternion": "BMI270",
  "bmi270-tap-euler": "BMI270",
  "bmi270-tap-accel": "BMI270",
  "bmi270-tap-gyro": "BMI270",
  "bmi270-tap-temp": "BMI270",
  "dps368-input": "DPS368",
  "dps368-tap-pressure": "DPS368",
  "dps368-tap-temp": "DPS368",
  "sht40-input": "SHT40",
  "sht40-tap-humidity": "SHT40",
  "sht40-tap-temp": "SHT40",
  "bmm350-input": "BMM350",
  "bmm350-tap-magnetic": "BMM350",
  "bmm350-tap-temp": "BMM350",
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
  /** BMI270 quaternion pin snapshot for the aligned readings panel. */
  liveQuaternionWire?: FlowWireQuaternion;
  /** Single vector3 from BMI270 tap nodes (Euler / Accel / Gyro). */
  liveVector3Wire?: FlowWireVec3;
  /** Incoming `env` pin snapshot for 3D canvas nodes (HDRI / background / IBL). */
  liveEnvironmentWire?: FlowWireEnvironmentV1;
  /** Incoming `cam` pin snapshot for 3D canvas nodes (camera + orbit limits). */
  liveCameraWire?: FlowWireCameraV1;
  /** Incoming **`anim`** pin snapshot on **`model-viewer`** (structured clip times + speed). */
  liveAnimationWire?: FlowWireAnimationV1;
  /** Incoming **`xf`** pin snapshot for 3D canvas nodes (model transform). */
  liveTransformWire?: FlowWireTransformV1;
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
  | "bmi270-gauge-z"
  | "rotation-glb-anim"
  | "material-glb-drives";

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

function nodeChangesAreLayoutOnly(
  changes: Parameters<typeof applyNodeChanges<StudioNode>>[0],
): boolean {
  if (changes.length === 0) {
    return false;
  }
  return changes.every((ch) => ch.type === "position" || ch.type === "dimensions");
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
function flushFlowSimulationPins(get: () => { tickSimulation: () => void }): void {
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
  set: (partial: Partial<FlowEditorState> | ((state: FlowEditorState) => Partial<FlowEditorState>)) => void,
  state: StudioSubgraphStoreSlice,
  result: DuplicateGroupInstanceResult,
): void {
  const { rootNodes, rootEdges } = resolveRootGraphBuffer(state);
  const appended = appendGroupHostToRootGraph(rootNodes, rootEdges, result.hostNode);
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
  }) => string;
  importFlowGraphJson: (
    json: string,
  ) =>
    | { ok: true; viewport?: StudioPersistedViewport; canvasPreferences?: FlowCanvasPreferences }
    | { ok: false; message: string };
  duplicateSelection: () => void;
  copyFlowSelectionToClipboard: () => Promise<boolean>;
  pasteFlowFromClipboard: () => Promise<{ ok: boolean; message?: string }>;
  createGroupFromSelection: () => void;
  ungroupSelection: () => void;
  enterGroup: (groupId: string) => void;
  exitGroup: () => void;
  jumpToGraph: (graphId: StudioGraphId) => void;
  updateNodeGroupInterface: (hostNodeId: string, nextInterface: StudioGroupInterface) => void;
  updateNodeGroupTitle: (hostNodeId: string, title: string) => void;
  ungroupNodeGroup: (hostNodeId: string) => void;
  duplicateGroupLinked: (hostNodeId: string) => void;
  duplicateGroupDeepCopy: (hostNodeId: string) => void;
  nodeGroupLibrary: StudioNodeAssetFile[];
  remoteNodeGraphAssets: Record<string, StudioNodeAssetFile>;
  registerRemoteNodeGraphAsset: (asset: StudioNodeAssetFile) => void;
  clearRemoteNodeGraphAssets: () => void;
  resolveNodeGroupAsset: (assetId: string) => StudioNodeAssetFile | undefined;
  saveGroupToNodeLibrary: (hostNodeId: string, name?: string) => StudioLibrarySaveResult | null;
  removeNodeAssetFromLibrary: (assetId: string) => void;
  importNodeAssetToLibrary: (asset: StudioNodeAssetFile) => string;
  exportNodeAssetById: (assetId: string) => boolean;
  exportGroupAsNodeAssetFile: (hostNodeId: string) => boolean;
  importNodeAssetIntoGroup: (hostNodeId: string, asset: StudioNodeAssetFile) => boolean;
  updateGroupFromLibrary: (hostNodeId: string) => boolean;
  breakGroupLibraryLink: (hostNodeId: string) => void;
  instantiateNodeAssetAt: (asset: StudioNodeAssetFile, position: { x: number; y: number }) => boolean;
  deleteSelection: () => void;
  selectAllNodes: () => void;
  clearNodeSelection: () => void;
  /** Programmatic selection (e.g. jump from Model card to a linked node). Does not push undo. */
  selectStudioNodesByIds: (nodeIds: string[]) => void;
  onNodesChange: (changes: Parameters<typeof applyNodeChanges<StudioNode>>[0]) => void;
  onEdgesChange: (changes: Parameters<typeof applyEdgeChanges<Edge>>[0]) => void;
  onConnect: (connection: Connection) => void;
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
  insertRerouteOnEdge: (edgeId: string, flowPosition: { x: number; y: number }) => string | null;
  applyFlowFrameDragStop: (dragged: FlowGraphNode) => void;
  fitSelectedFramesToContents: (frameIds?: string[]) => boolean;
  dissolveSelectedFrames: (frameIds?: string[]) => boolean;
  updateLayoutNodeData: (flowNodeId: string, patch: Record<string, unknown>) => void;
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
  updateNodeConfigFieldByNodeId: (nodeId: string, key: string, value: unknown) => void;
  /** Collapse/expand utility node bodies and sync React Flow height (header-only when collapsed). */
  setStudioUtilityNodeBodyExpanded: (
    flowNodeId: string,
    field: StudioUtilityBodyExpandedField,
    expanded: boolean,
  ) => void;
  resetCanvas: () => void;
  runDemoTemplate: (templateId: StudioDemoTemplateId, catalog: NodeCatalogEntry[]) => void;
  updateSelectedNodeLabel: (nextLabel: string) => void;
  updateSelectedNodeConfigField: (key: string, value: unknown) => boolean;
  /** Patch multiple config keys on the selected node in one undo step. */
  patchSelectedNodeConfigFields: (fields: Record<string, unknown>) => boolean;
  updateSelectedNodeUiResizable: (resizable: boolean) => void;
  /**
   * Single-selection config patch without pushing an undo snapshot (e.g. animation playback ticks).
   * Returns **false** for multi-edit or when nothing is selected.
   */
  applySelectedNodeConfigFieldLive: (key: string, value: unknown) => boolean;
  updateSelectedNodeConfigFromJson: (nextJson: string) => { ok: true } | { ok: false; message: string };
  /** Replace plotter `defaultConfig` in one undo step (coerced + persisted). */
  updateSelectedNodePlotterConfig: (next: PlotterConfig) => void;
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
};

function inferPortTypes(entry: NodeCatalogEntry): {
  inputType?: StudioPortType;
  outputType?: StudioPortType;
  outputHandles?: StudioOutputHandleDef[];
  inputHandles?: StudioOutputHandleDef[];
} {
  if (entry.id === "environment" && entry.outputPorts != null && entry.outputPorts.length > 0) {
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
  if (
    entry.id === "vector-splitter" &&
    entry.outputPorts != null &&
    entry.outputPorts.length > 0
  ) {
    return {
      inputType: "vector3",
      outputHandles: entry.outputPorts.map((p) => ({
        id: p.id,
        portType: p.portType as StudioPortType,
        label: p.label,
      })),
    };
  }
  if (
    entry.id === "quaternion-splitter" &&
    entry.outputPorts != null &&
    entry.outputPorts.length > 0
  ) {
    return {
      inputType: "quaternion",
      outputHandles: entry.outputPorts.map((p) => ({
        id: p.id,
        portType: p.portType as StudioPortType,
        label: p.label,
      })),
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
  if (entry.id === "gauge" || entry.id === "sparkline") {
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
    sourceHandle: e.sourceHandle === "fusionQuat" ? "quaternion" : e.sourceHandle,
    targetHandle: e.targetHandle === "fusionQuat" ? "quaternion" : e.targetHandle,
  }));
}

function migrateStudioEdgesMapRange(nodes: StudioNode[], edges: Edge[]): Edge[] {
  const mapRangeIds = new Set(
    nodes
      .filter((n) => n.type === "studio" && n.data.nodeId === "map-range")
      .map((n) => n.id),
  );
  const clampIds = new Set(
    nodes.filter((n) => n.type === "studio" && n.data.nodeId === "clamp").map((n) => n.id),
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

/** Legacy graph migration before catalog refresh (e.g. oscilloscope → plotter). */
function migrateFlowNodeFromLegacy(node: StudioNode): StudioNode {
  const data = migrateLegacyPlotterNodeData(node.data) as StudioNodeData;
  return { ...node, data };
}

/** Refresh input/output pin definitions from the bundled catalog (catalog updates, import). */
function refreshCatalogOutputHandles(node: StudioNode): StudioNode {
  const entry = NODE_CATALOG_DEFAULTS.payload.nodes.find((n) => n.id === node.data.nodeId);
  if (entry == null) {
    return node;
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
  const groupType = resolveStudioGroupNodePortType(node, sourceHandle, "output", subgraphs);
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
  const groupType = resolveStudioGroupNodePortType(node, targetHandle, "input", subgraphs);
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

function canConnect(
  connection: Connection,
  nodes: FlowGraphNode[],
  subgraphs: Record<string, StudioSubgraphDocument>,
): boolean {
  if (connection.source == null || connection.target == null) {
    return false;
  }
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);
  if (sourceNode == null || targetNode == null) {
    return false;
  }
  const sourceHandle = connection.sourceHandle ?? STUDIO_HANDLE_OUT;
  const targetHandle = connection.targetHandle ?? STUDIO_HANDLE_IN;
  const sourceType = getSourcePortType(sourceNode, sourceHandle, subgraphs);
  if (sourceType == null) {
    return false;
  }
  if (isStudioNodeGroupNode(targetNode)) {
    const targetType = getTargetPortType(targetNode, targetHandle, subgraphs);
    return targetType != null && sourceType === targetType;
  }
  if (isLayoutFlowNode(targetNode)) {
    if (targetNode.type === "studio-note" || targetNode.type === "studio-frame") {
      return false;
    }
    return layoutNodeAcceptsInput(targetNode, targetHandle, sourceType);
  }
  if (!isStudioFlowNode(targetNode)) {
    if (targetNode.type === "studio-group-output") {
      const targetType = getTargetPortType(targetNode, targetHandle, subgraphs);
      return targetType != null && sourceType === targetType;
    }
    return false;
  }
  const targetType = getTargetPortType(targetNode, targetHandle, subgraphs);
  if (targetType == null) {
    return false;
  }
  return sourceType === targetType;
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
    ...(state.subgraphs != null ? { subgraphs: JSON.parse(JSON.stringify(state.subgraphs)) } : {}),
    ...(state.activeGraphId != null ? { activeGraphId: state.activeGraphId } : {}),
    ...(state.graphStack != null ? { graphStack: [...state.graphStack] } : {}),
    ...(state.rootNodes != null
      ? { rootNodes: JSON.parse(JSON.stringify(state.rootNodes)) as FlowGraphNode[] }
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
  const marker = (data as StudioNodeData & { sensorStreamMode?: unknown }).sensorStreamMode;
  if (marker === undefined || marker === "live") {
    return data;
  }
  const { sensorStreamMode: _, ...rest } = data as StudioNodeData & { sensorStreamMode?: unknown };
  return rest as StudioNodeData;
}

function attachConfigErrors(nodes: FlowGraphNode[], edges?: Edge[]): FlowGraphNode[] {
  return nodes.map((node) => {
    if (!isStudioFlowNode(node)) {
      return node;
    }
    const coercedData = migrateLegacyPlotterNodeData(
      coercePersistedSensorStreamMode(node.data),
    ) as StudioNodeData;
    const withScene3d: StudioNodeData =
      coercedData.nodeId === "rotation-3d-euler" ||
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
            if (typeof legacyEnvIdx === "number" && Number.isFinite(legacyEnvIdx)) {
              next.environment.presetIndex = Math.max(0, Math.round(legacyEnvIdx));
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
    if (piped.nodeId === "plotter") {
      const plotterCfg = persistPlotterConfig(piped.defaultConfig);
      piped = {
        ...piped,
        defaultConfig: { ...(plotterCfg as unknown as Record<string, unknown>) },
        ui: {
          ...piped.ui,
          resizable: piped.ui?.resizable ?? true,
          minWidth: piped.ui?.minWidth ?? 280,
          minHeight: piped.ui?.minHeight ?? 168,
        },
      };
    }
    if (piped.nodeId === "model-viewer") {
      piped = {
        ...piped,
        ui: {
          ...piped.ui,
          resizable: piped.ui?.resizable ?? true,
          minWidth: piped.ui?.minWidth ?? 280,
          minHeight: piped.ui?.minHeight ?? 200,
        },
      };
    }
    if (
      piped.nodeId === "radial-gauge" ||
      piped.nodeId === "bar-meter" ||
      piped.nodeId === "knob"
    ) {
      piped = {
        ...piped,
        ui: {
          ...piped.ui,
          minWidth: piped.ui?.minWidth ?? 170,
          minHeight: piped.ui?.minHeight ?? 180,
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
        typeof dc0.environmentControlsExpanded === "boolean" ? dc0.environmentControlsExpanded : true;
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
        outputHandles: [{ id: STUDIO_HANDLE_OUT, portType: "environment", label: "Environment" }],
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
  return attachConfigErrors(reconcileStudioModelGeneratedChildIds(nodes as StudioNode[]), edges);
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
    STUDIO_GLB_EVENT_ACTION_CATALOG_ID_SET.has(target.data.nodeId) &&
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
      return {
        ...n,
        data: {
          ...n.data,
          defaultConfig: nextConfig,
        },
      };
    });
  }

  if (target.data.nodeId !== "model-viewer" || targetHandle !== STUDIO_HANDLE_IN) {
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

/** Keep GLB event nodes aligned with a wired **Model** input (scope + stale clip cleanup). */
function reconcileGlbEventModelScopeFromEdges(nodes: StudioNode[], edges: Edge[]): StudioNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (!STUDIO_GLB_EVENT_ACTION_CATALOG_ID_SET.has(node.data.nodeId)) {
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

export type StudioUtilityBodyExpandedField = keyof typeof STUDIO_UTILITY_BODY_EXPANDED_KEYS;

/** Read explicit flow-node height (resize handle, style, or last measured). */
function readStudioNodeLayoutHeightPx(node: StudioNode): number | undefined {
  if (typeof node.height === "number" && Number.isFinite(node.height) && node.height > 0)
  {
    return Math.round(node.height);
  }
  const styleHeight = node.style?.height;
  if (typeof styleHeight === "number" && Number.isFinite(styleHeight) && styleHeight > 0)
  {
    return Math.round(styleHeight);
  }
  if (typeof styleHeight === "string")
  {
    const match = /^([\d.]+)\s*px$/i.exec(styleHeight.trim());
    if (match != null)
    {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0)
      {
        return Math.round(parsed);
      }
    }
  }
  const measuredHeight = node.measured?.height;
  if (typeof measuredHeight === "number" && Number.isFinite(measuredHeight) && measuredHeight > 0)
  {
    return Math.round(measuredHeight);
  }
  return undefined;
}

/** Drop fixed height so the node can shrink to header + sockets when a utility body is collapsed. */
function stripStudioNodeFixedHeight(node: StudioNode): StudioNode {
  const { height: _height, measured, style, ...rest } = node;
  let nextStyle: StudioNode["style"];
  if (style != null)
  {
    const { height: _styleHeight, ...styleRest } = style;
    nextStyle = Object.keys(styleRest).length > 0 ? styleRest : undefined;
  }
  let nextMeasured: StudioNode["measured"];
  if (measured != null)
  {
    const { height: _measuredHeight, ...measuredRest } = measured;
    nextMeasured = Object.keys(measuredRest).length > 0 ? measuredRest : undefined;
  }
  return {
    ...rest,
    style: nextStyle,
    measured: nextMeasured,
  };
}

function applyStudioNodeLayoutHeight(node: StudioNode, heightPx: number): StudioNode {
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

/** Keep React Flow node height aligned with utility collapse state (including after hydrate). */
function syncStudioUtilityNodeLayoutFromConfig(
  layoutNode: StudioNode,
  piped: StudioNodeData,
): StudioNode {
  if (piped.nodeId === "camera-view")
  {
    const dc = piped.defaultConfig as Record<string, unknown>;
    const expanded =
      typeof dc.cameraViewControlsExpanded === "boolean"
        ? dc.cameraViewControlsExpanded
        : true;
    if (!expanded)
    {
      return stripStudioNodeFixedHeight(layoutNode);
    }
    const saved = dc.cameraViewLayoutHeight;
    if (typeof saved === "number" && Number.isFinite(saved) && saved > 0)
    {
      return applyStudioNodeLayoutHeight(layoutNode, saved);
    }
    return layoutNode;
  }
  if (piped.nodeId === "environment")
  {
    const dc = piped.defaultConfig as Record<string, unknown>;
    const expanded =
      typeof dc.environmentControlsExpanded === "boolean"
        ? dc.environmentControlsExpanded
        : true;
    if (!expanded)
    {
      return stripStudioNodeFixedHeight(layoutNode);
    }
    const saved = dc.environmentLayoutHeight;
    if (typeof saved === "number" && Number.isFinite(saved) && saved > 0)
    {
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
  if (nextExpanded)
  {
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
  if (currentHeight != null)
  {
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
  const base: StudioNode = {
    id,
    type: "studio",
    position,
    dragHandle: dragHandleSelectorForNodeId(entry.id),
    data: {
      label: entry.title,
      category: entry.category,
      nodeId: entry.id,
      defaultConfig: { ...entry.defaultConfig },
      ui: options?.ui,
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

function hasLiveBmi270QuaternionFields(sample: BitstreamSensorSampleV2 | null): boolean {
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

function hasLiveBmi270EulerFields(sample: BitstreamSensorSampleV2 | null): boolean {
  if (sample == null) {
    return false;
  }
  return (
    typeof sample.fusionRollRadX100 === "number" &&
    typeof sample.fusionPitchRadX100 === "number" &&
    typeof sample.fusionHeadingRadX100 === "number"
  );
}

function hasLiveBmi270AccelFields(sample: BitstreamSensorSampleV2 | null): boolean {
  if (sample == null) {
    return false;
  }
  return (
    typeof sample.accelXMs2X100 === "number" &&
    typeof sample.accelYMs2X100 === "number" &&
    typeof sample.accelZMs2X100 === "number"
  );
}

function hasLiveBmi270GyroFields(sample: BitstreamSensorSampleV2 | null): boolean {
  if (sample == null) {
    return false;
  }
  return (
    typeof sample.gyroXRadSX100 === "number" &&
    typeof sample.gyroYRadSX100 === "number" &&
    typeof sample.gyroZRadSX100 === "number"
  );
}

function hasLiveBmi270TempFields(sample: BitstreamSensorSampleV2 | null): boolean {
  if (sample == null) {
    return false;
  }
  return typeof sample.temperatureCx100 === "number" && Number.isFinite(sample.temperatureCx100);
}

function inferSensorHintFromNode(node: StudioNode): BitstreamSensorSourceHint | null {
  switch (node.data.nodeId) {
    case "bmi270-input":
    case "bmi270-tap-quaternion":
    case "bmi270-tap-euler":
    case "bmi270-tap-accel":
    case "bmi270-tap-gyro":
    case "bmi270-tap-temp":
      return "bmi270";
    case "dps368-input":
    case "dps368-tap-pressure":
    case "dps368-tap-temp":
      return "dps368";
    case "sht40-input":
    case "sht40-tap-humidity":
    case "sht40-tap-temp":
      return "sht40";
    case "bmm350-input":
    case "bmm350-tap-magnetic":
    case "bmm350-tap-temp":
      return "bmm350";
    case "sensor-input": {
      const sk = node.data.defaultConfig.sourceKey;
      return typeof sk === "string" ? inferSensorTelemetryHintFromSourceKey(sk) : null;
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
  const row = sourceId != null ? deviceSensorCfgBySourceId[sourceId] ?? null : null;
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

function keepLastFiniteNumber(next: unknown, previous: number | undefined, fallback: number): number {
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
  latestByHint: Record<BitstreamSensorSourceHint, BitstreamSensorSampleV2 | null>,
): string | undefined {
  switch (node.data.nodeId) {
    case "dps368-input":
    case "dps368-tap-pressure":
      return invalidReasonForRequiredNumber(latestByHint.dps368, latestByHint.dps368?.secondaryX100, "Pressure");
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

function dispatchFlowEventSourcesWithGlbAnimAutoBind(
  get: () => FlowEditorState,
  set: (
    partial: Partial<FlowEditorState> | ((state: FlowEditorState) => Partial<FlowEditorState>),
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
  if (targetIds.length === 0) {
    return;
  }
  void resolveSingleClipAutoBindPatchesForGlbAnimNodes({
    nodes: get().nodes,
    edges: get().edges,
    targetFlowNodeIds: targetIds,
  }).then((patches) => {
    if (patches.size === 0) {
      return;
    }
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) => {
          const patch = patches.get(node.id);
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
    get().tickSimulation();
  });
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
  nodeGroupLibrary: readPersistedNodeGroupLibrary(),
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
    const nodesRaw = (snapshot.nodes as StudioNode[]).map((n) =>
      refreshCatalogOutputHandles(migrateFlowNodeFromLegacy(n)),
    );
    const sel = normalizeFlowSnapshotSelection(snapshot);
    const subgraphs = snapshot.subgraphs ?? {};
    const activeGraphId = snapshot.activeGraphId ?? STUDIO_ROOT_GRAPH_ID;
    set({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(nodesRaw, sel.selectedNodeIds),
        snapshot.edges,
      ),
      edges: snapshot.edges,
      selectedNodeId: sel.selectedNodeId,
      selectedNodeIds: sel.selectedNodeIds,
      subgraphs,
      activeGraphId,
      graphStack: snapshot.graphStack ?? [],
      rootNodes: snapshot.rootNodes ?? nodesRaw,
      rootEdges: snapshot.rootEdges ?? snapshot.edges,
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
      viewportArg != null && isValidStudioPersistedViewport(viewportArg) ? viewportArg : undefined;
    const canvasPreferences = options?.canvasPreferences;
    return JSON.stringify(
      {
        version: 1 as const,
        updatedAt: new Date().toISOString(),
        nodes: exportNodes,
        edges: exportEdges,
        selectedNodeId: st.selectedNodeId,
        selectedNodeIds: st.selectedNodeIds,
        ...(Object.keys(st.subgraphs).length > 0 ? { subgraphs: st.subgraphs } : {}),
        ...(st.activeGraphId !== STUDIO_ROOT_GRAPH_ID ? { activeGraphId: st.activeGraphId } : {}),
        ...(st.graphStack.length > 0 ? { graphStack: st.graphStack } : {}),
        ...(st.rootNodes.length > 0 ? { rootNodes: st.rootNodes, rootEdges: st.rootEdges } : {}),
        ...(viewportPayload != null ? { viewport: viewportPayload } : {}),
        ...(canvasPreferences != null ? { canvasPreferences } : {}),
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
      return { ok: false, message: "Flow document must include nodes and edges arrays." };
    }
    const sel = o.selectedNodeId;
    const selectedNodeId =
      typeof sel === "string" ? sel : sel === null || sel === undefined ? null : null;
    const rawMulti = o.selectedNodeIds;
    const selectedNodeIdsFromFile = Array.isArray(rawMulti)
      ? rawMulti.filter((x): x is string => typeof x === "string" && x.length > 0)
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
    const subgraphsRaw = o.subgraphs;
    const subgraphs =
      subgraphsRaw != null && typeof subgraphsRaw === "object" && !Array.isArray(subgraphsRaw)
        ? (subgraphsRaw as Record<string, StudioSubgraphDocument>)
        : {};
    const activeGraphId =
      typeof o.activeGraphId === "string" ? (o.activeGraphId as StudioGraphId) : STUDIO_ROOT_GRAPH_ID;
    const graphStack = Array.isArray(o.graphStack)
      ? o.graphStack.filter((x): x is StudioGraphId => typeof x === "string")
      : [];
    const rootNodesRaw = o.rootNodes;
    const rootEdgesRaw = o.rootEdges;
    set({
      nodes: attachConfigErrorsWithModelChildRegistry(
        applyStudioFlowSelection(
          migratedNodes.map((n) => ({ ...n, selected: false })),
          selection.selectedNodeIds,
        ),
        migratedEdges,
      ),
      edges: migratedEdges,
      selectedNodeId: selection.selectedNodeId,
      selectedNodeIds: selection.selectedNodeIds,
      subgraphs,
      activeGraphId,
      graphStack,
      rootNodes: Array.isArray(rootNodesRaw)
        ? (rootNodesRaw as FlowGraphNode[])
        : (migratedNodes as FlowGraphNode[]),
      rootEdges: Array.isArray(rootEdgesRaw) ? (rootEdgesRaw as Edge[]) : migratedEdges,
      redoStack: [],
    });
    flushFlowSimulationPins(get);
    if (viewport != null || canvasPreferences != null) {
      return {
        ok: true,
        ...(viewport != null ? { viewport } : {}),
        ...(canvasPreferences != null ? { canvasPreferences } : {}),
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
    const newNodes = remapSourceModelNodeIdAfterDuplicate(newNodesRaw as StudioNode[], idMap);
    const { nodes: dupNodesWithSubs, subgraphs: dupSubgraphs } = attachSubgraphsForPastedNodeGroups(
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
        sourceStub != null ? edgeLabelForSource(sourceStub, srcHandle, dupSubgraphs) : "";
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
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(mergedNodes, mergedEdges);
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
    const payload = parseFlowClipboard(text);
    if (payload == null || payload.nodes.length === 0) {
      return { ok: false, message: "Clipboard does not contain a Sensor Studio flow selection." };
    }
    const st = get();
    get().pushUndoSnapshot();
    const { nodes: pastedRaw, edges: pastedEdgesRaw, idMap } = remapFlowPaste(payload);
    const pastedNodesRaw: FlowGraphNode[] = pastedRaw.map((n) => {
      if (isStudioFlowNode(n)) {
        const migrated = refreshCatalogOutputHandles(migrateFlowNodeFromLegacy(n as StudioNode));
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
    const { nodes: pastedWithGroups, subgraphs: mergedSubgraphs } = attachSubgraphsForPastedNodeGroups(
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
        sourceStub != null ? edgeLabelForSource(sourceStub, srcHandle, mergedSubgraphs) : "";
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
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(mergedNodes, mergedEdges);
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
    const selected = s.nodes.filter((n) => n.selected && !isExcludedFromNodeGroup(n));
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
    const { nodes: parentNodes, edges: parentEdges } = rewireParentGraphForStudioGroup(
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
    const selectedGroups = s.nodes.filter((n) => n.selected && isStudioNodeGroupNode(n));
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
    const s = get();
    const sub = s.subgraphs[groupId];
    if (sub == null) {
      return;
    }
    get().pushUndoSnapshot();
    const persisted = persistActiveGraphBuffer(s);
    const nextStack =
      persisted.activeGraphId === STUDIO_ROOT_GRAPH_ID
        ? [STUDIO_ROOT_GRAPH_ID, groupId]
        : [...persisted.graphStack, groupId];
    set({
      ...persisted,
      activeGraphId: groupId,
      graphStack: nextStack,
      nodes: attachConfigErrorsWithModelChildRegistry(sub.nodes as FlowGraphNode[], sub.edges),
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
    const s = get();
    const host =
      s.rootNodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n)) ??
      s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
    if (host == null) {
      return;
    }
    const subgraphId = host.data.subgraphId ?? hostNodeId;
    const subgraph = s.subgraphs[subgraphId];
    if (subgraph == null) {
      return;
    }

    get().pushUndoSnapshot();

    const base = subgraphForInterfaceEdit(
      subgraphId,
      subgraph,
      s.activeGraphId,
      s.nodes,
      s.edges,
    );
    if (base == null) {
      return;
    }

    const ensured = ensureDefaultGroupSockets(nextInterface);
    const updatedSub = applyGroupInterfaceToSubgraph(base, ensured);
    const filteredRootEdges = filterParentEdgesForGroupInterface(
      s.rootEdges,
      hostNodeId,
      ensured,
    );
    const newSubgraphs = { ...s.subgraphs, [subgraphId]: updatedSub };

    if (s.activeGraphId === subgraphId) {
      const attached = attachConfigErrorsWithModelChildRegistry(
        updatedSub.nodes as FlowGraphNode[],
        updatedSub.edges,
      );
      const committed = commitActiveGraphMutation(
        { ...s, subgraphs: newSubgraphs, rootEdges: filteredRootEdges },
        attached,
        updatedSub.edges,
      );
      set({ ...committed, rootEdges: filteredRootEdges });
    } else if (s.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
      const filteredEdges = filterParentEdgesForGroupInterface(s.edges, hostNodeId, ensured);
      set({
        subgraphs: newSubgraphs,
        edges: filteredEdges,
        rootEdges: filteredEdges,
      });
    } else {
      set({
        subgraphs: newSubgraphs,
        rootEdges: filteredRootEdges,
      });
    }
    flushFlowSimulationPins(get);
  },
  updateNodeGroupTitle: (hostNodeId, title) => {
    const s = get();
    const host =
      s.rootNodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n)) ??
      s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
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
      initial.rootNodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n)) ??
      initial.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
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

    const groupNode = s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
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
      s.rootNodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n)) ??
      s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
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
      s.rootNodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n)) ??
      s.nodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
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
    const { library, result } = upsertStudioLibraryPreset(get().nodeGroupLibrary, asset, {
      sourceNodeId: hostNodeId,
      presetKind: "nodeGraph",
    });
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
      nodes: s.activeGraphId === STUDIO_ROOT_GRAPH_ID ? patchHost(s.nodes) : s.nodes,
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
        ? get().nodeGroupLibrary.find((a) => a.meta.id === data.libraryAssetId) ??
          get().remoteNodeGraphAssets[data.libraryAssetId]
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
  importNodeAssetIntoGroup: (hostNodeId, asset) => {
    const s = persistActiveGraphBuffer(get());
    const hostCtx = findStudioNodeGroupHost(hostNodeId, s);
    if (hostCtx == null) {
      return false;
    }
    const data = hostCtx.host.data;
    const subgraphKey = data.subgraphId ?? hostNodeId;
    const nextSubgraphs = replaceStudioNodeGroupFromAsset(subgraphKey, asset, s.subgraphs);
    if (nextSubgraphs == null) {
      return false;
    }

    get().pushUndoSnapshot();
    const graphTitle = asset.meta.name.trim() || "Node Group";
    const patchHost = (n: FlowGraphNode) =>
      n.id === hostNodeId && isStudioNodeGroupNode(n)
        ? { ...n, data: { ...n.data, graphTitle, libraryAssetId: asset.meta.id } }
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
    const { nodes: pastedRaw, edges: pastedEdgesRaw, subgraphs: mergedSubgraphs } =
      instantiateStudioNodeAsset(asset, position, st.subgraphs);
    if (pastedRaw.length === 0) {
      return false;
    }

    const pastedNodesRaw: FlowGraphNode[] = pastedRaw.map((n) => {
      if (isStudioFlowNode(n)) {
        const migrated = refreshCatalogOutputHandles(migrateFlowNodeFromLegacy(n as StudioNode));
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
        sourceStub != null ? edgeLabelForSource(sourceStub, srcHandle, mergedSubgraphs) : "";
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
    const attachedRoot = attachConfigErrorsWithModelChildRegistry(rootNodes, rootEdges);
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
      nodes = sub.nodes as FlowGraphNode[];
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
      const subKey = isStudioNodeGroupNode(node) ? (node.data.subgraphId ?? groupId) : groupId;
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
    const attachedNodes = attachConfigErrorsWithModelChildRegistry(nextNodes, nextEdges);
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
    const layoutOnly = nodeChangesAreLayoutOnly(changes);
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
      get().pushUndoSnapshot();
    }
    set((state) => {
      let nextNodes = applyNodeChanges(changes, state.nodes);
      if (layoutOnly) {
        nextNodes = syncStudioNodeLayoutStyleFromDimensionChanges(nextNodes, changes);
      }
      const reconciled = layoutOnly
        ? nextNodes
        : reconcileStudioModelGeneratedChildIds(nextNodes);
      return {
        nodes: layoutOnly ? reconciled : attachConfigErrors(reconciled, state.edges),
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
      get().pushUndoSnapshot();
    }
    set((state) => {
      const bridged = applyRerouteBridgeOnEdgeRemoves(changes, state.nodes, state.edges);
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
  onConnect: (connection) => {
    const st = get();
    if (!canConnect(connection, st.nodes, st.subgraphs)) {
      return;
    }
    const hasDuplicate = get().edges.some(
      (edge) =>
        edge.source === connection.source &&
        edge.target === connection.target &&
        edge.sourceHandle === connection.sourceHandle &&
        edge.targetHandle === connection.targetHandle,
    );
    if (hasDuplicate) {
      return;
    }
    const sourceNode = get().nodes.find((n) => n.id === connection.source);
    const srcHandle = connection.sourceHandle ?? STUDIO_HANDLE_OUT;
    const label =
      sourceNode != null ? edgeLabelForSource(sourceNode, srcHandle, get().subgraphs) : "";
    get().pushUndoSnapshot();
    set((state) => {
      const nextEdges = addEdge(
        {
          ...connection,
          sourceHandle: connection.sourceHandle ?? STUDIO_HANDLE_OUT,
          targetHandle: connection.targetHandle ?? STUDIO_HANDLE_IN,
          id: `${connection.source}-${connection.target}-${Date.now()}`,
          animated: true,
          label,
          style: { strokeWidth: 2 },
        },
        state.edges,
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
    const split = splitEdgeWithReroute(edgeId, flowPosition, st.nodes, st.edges);
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
        n.id === split.rerouteId ? { ...n, selected: true } : { ...n, selected: false },
      );
      nextNodes = patchLayoutNodesAfterConnect(nextNodes, upstreamConnection);
      nextNodes = patchLayoutNodesAfterConnect(nextNodes, downstreamConnection);
      nextNodes = patchStudioModelScopeOnConnect(nextNodes, upstreamConnection);
      nextNodes = patchStudioModelScopeOnConnect(nextNodes, downstreamConnection);
      const nextEdges = reconcileGlbEventModelScopeFromEdges(nextNodes, split.edges);
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
      nodes: attachConfigErrorsWithModelChildRegistry(result.nodes, state.edges),
    }));
    flushFlowSimulationPins(get);
  },
  fitSelectedFramesToContents: (frameIds) => {
    const st = get();
    const ids =
      frameIds ??
      (st.nodes.filter((n) => n.selected && n.type === "studio-frame").map((n) => n.id).length > 0
        ? st.nodes.filter((n) => n.selected && n.type === "studio-frame").map((n) => n.id)
        : st.selectedNodeId != null &&
            st.nodes.find((n) => n.id === st.selectedNodeId)?.type === "studio-frame"
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
      nodes: attachConfigErrorsWithModelChildRegistry(result.nodes, state.edges),
    }));
    flushFlowSimulationPins(get);
    return true;
  },
  dissolveSelectedFrames: (frameIds) => {
    const st = get();
    const ids =
      frameIds ??
      (st.nodes.filter((n) => n.selected && n.type === "studio-frame").map((n) => n.id).length > 0
        ? st.nodes.filter((n) => n.selected && n.type === "studio-frame").map((n) => n.id)
        : st.selectedNodeId != null &&
            st.nodes.find((n) => n.id === st.selectedNodeId)?.type === "studio-frame"
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
    const survivingSelectedIds = st.selectedNodeIds.filter((id) => !ids.includes(id));
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(dissolved.nodes, state.edges),
      ...selectionFromIds(survivingSelectedIds),
    }));
    flushFlowSimulationPins(get);
    return true;
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
  addNodeFromCatalogLinkedToModel: (entry, position, options) => {
    const parentId = options.parentModelNodeId.trim();
    if (parentId.length === 0) {
      return;
    }
    const parent = get().nodes.find((n) => n.id === parentId);
    if (parent == null || !isStudioFlowNode(parent) || parent.data.nodeId !== "model-select") {
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
  updateNodeConfigFieldByNodeId: (nodeId, key, value) => {
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
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
      ),
    }));
    flushFlowSimulationPins(get);
  },
  setStudioUtilityNodeBodyExpanded: (flowNodeId, field, expanded) => {
    get().pushUndoSnapshot();
    set((state) => ({
      nodes: attachConfigErrorsWithModelChildRegistry(
        state.nodes.map((node) =>
          node.id === flowNodeId ? patchStudioUtilityNodeBodyExpanded(node, field, expanded) : node,
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

    if (templateId === "material-glb-drives") {
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const viewerEntry = catalog.find((entry) => entry.id === "model-viewer");
      const paramEntry = catalog.find((entry) => entry.id === "glb-material-param");
      const texEntry = catalog.find((entry) => entry.id === "glb-material-texture");
      if (modelEntry == null || viewerEntry == null || paramEntry == null || texEntry == null) {
        return;
      }

      const modelFlowId = "demo-model-select";
      const matRef = "Material";

      const modelNode = makeNode(modelEntry, modelFlowId, 72, 280);
      modelNode.data.label = "Studio Model (robot)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: "model.robot-4th-project",
        selectedModelUrl: "models/robot-4th-project/robot-4th-project.glb",
        generatedChildNodeIds: ["demo-mat-param", "demo-mat-tex"],
      };

      const viewerNode = makeNode(viewerEntry, "demo-model-viewer", 420, 120);
      viewerNode.data.label = "Model Viewer (material drives)";
      viewerNode.data.defaultConfig = {
        ...viewerNode.data.defaultConfig,
        showGrid: true,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      };
      viewerNode.data.ui = { resizable: true };

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
        cardValueControl: "slider",
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
          applyStudioFlowSelection([modelNode, viewerNode, paramNode, texNode], [viewerNode.id]),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([viewerNode.id]),
      });
      return;
    }

    if (templateId === "rotation-glb-anim") {
      const eulerTapEntry = catalog.find((entry) => entry.id === "bmi270-tap-euler");
      const rotEulerEntry = catalog.find((entry) => entry.id === "rotation-3d-euler");
      const modelEntry = catalog.find((entry) => entry.id === "model-select");
      const bundleEntry = catalog.find((entry) => entry.id === "glb-animation-bundle");
      const onClickEntry = catalog.find((entry) => entry.id === "on-click");
      const triggerEntry = catalog.find((entry) => entry.id === "event-trigger-glb-anim");
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
          url: "models/robot-4th-project/robot-4th-project.glb",
          studioAssetId: "model.robot-4th-project",
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
      rotNode.data.ui = { resizable: true };

      const modelNode = makeNode(modelEntry, modelFlowId, 72, 360);
      modelNode.data.label = "Studio Model (robot)";
      modelNode.data.defaultConfig = {
        ...modelNode.data.defaultConfig,
        selectedStudioAssetId: "model.robot-4th-project",
        selectedModelUrl: "models/robot-4th-project/robot-4th-project.glb",
        generatedChildNodeIds: ["demo-anim-bundle", "demo-glb-anim-trigger"],
      };

      const bundleNode = makeNode(bundleEntry, "demo-anim-bundle", 72, 480);
      bundleNode.data.defaultConfig = {
        ...bundleNode.data.defaultConfig,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      };

      const onClickNode = makeNode(onClickEntry, "demo-on-click", 72, 600);
      const triggerNode = makeNode(triggerEntry, "demo-glb-anim-trigger", 260, 600);
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
          label: getSourcePortType(eulerTapNode, STUDIO_HANDLE_OUT) ?? "vector3",
          style: { strokeWidth: 2 },
        },
        {
          id: "demo-rot-e2",
          source: bundleNode.id,
          target: rotNode.id,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_ANIM,
          animated: true,
          label: getSourcePortType(bundleNode, STUDIO_HANDLE_OUT) ?? "glbAnimation",
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
            [eulerTapNode, rotNode, modelNode, bundleNode, onClickNode, triggerNode],
            [rotNode.id],
          ),
          demoEdges,
        ),
        edges: demoEdges,
        ...selectionFromIds([rotNode.id]),
      });
      return;
    }

    if (templateId === "bmi270-gauge-z") {
      const bmi270Entry = catalog.find((entry) => entry.id === "bmi270-input");
      const vectorSplitterEntry = catalog.find((entry) => entry.id === "vector-splitter");
      const gaugeEntry = catalog.find((entry) => entry.id === "gauge");
      if (bmi270Entry == null || vectorSplitterEntry == null || gaugeEntry == null) {
        return;
      }
      const bmiNode = makeNode(bmi270Entry, "demo-bmi270", 72, 156);
      const splitNode = makeNode(vectorSplitterEntry, "demo-vec-split", 360, 156);
      const gaugeNode = makeNode(gaugeEntry, "demo-gauge-bmi", 660, 156);
      gaugeNode.data.label = "Gauge (accel Z)";
      gaugeNode.data.defaultConfig = {
        ...gaugeNode.data.defaultConfig,
        decimals: 3,
        unit: " m/s²",
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
          applyStudioFlowSelection([bmiNode, splitNode, gaugeNode], [gaugeNode.id]),
          bmiDemoEdges,
        ),
        edges: bmiDemoEdges,
        ...selectionFromIds([gaugeNode.id]),
      });
      return;
    }

    const sensor = catalog.find((entry) => entry.id === "sensor-input");
    const lowPass = catalog.find((entry) => entry.id === "low-pass");
    const threshold = catalog.find((entry) => entry.id === "threshold");
    const indicator = catalog.find((entry) => entry.id === "indicator");
    const gauge = catalog.find((entry) => entry.id === "gauge");
    const sparkline = catalog.find((entry) => entry.id === "sparkline");

    if (
      sensor == null ||
      lowPass == null ||
      threshold == null ||
      indicator == null ||
      gauge == null ||
      sparkline == null
    ) {
      return;
    }

    const typeFor = (node: StudioNode) => node.data.outputType ?? "";
    const sensorNode = makeNode(sensor, "demo-sensor", 80, 140);
    const lowPassNode = makeNode(lowPass, "demo-lowpass", 330, 140);
    const thresholdNode = makeNode(threshold, "demo-threshold", 580, 140);
    const indicatorNode = makeNode(indicator, "demo-indicator", 840, 120);
    const gaugeNode = makeNode(gauge, "demo-gauge", 840, 220);
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
                    defaultConfig: applyConfigFieldPatch(node.data.defaultConfig, fields),
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
                  defaultConfig: applyConfigFieldPatch(node.data.defaultConfig, fields),
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
                    resizable,
                  },
                },
              }
            : node,
        ),
        state.edges,
      ),
    }));
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
                    defaultConfig: { ...(persisted as unknown as Record<string, unknown>) },
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
                  defaultConfig: { ...(persisted as unknown as Record<string, unknown>) },
                },
              }
            : node,
        ),
        state.edges,
      ),
    }));
    flushFlowSimulationPins(get);
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
    const state = get();
    const { nodes, edges } = resolveEvaluationGraph(state);
    if (nodes.length === 0) {
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
    const liveStore = useBitstreamLiveStore.getState();
    const deviceSensorCfgBySourceId = useBitstreamDeviceSensorConfigStore.getState().bySourceId;
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

    const readIncoming = (targetId: string, targetHandle?: string): FlowValue | null => {
      const list = incomingByTarget.get(targetId);
      if (list == null || list.length === 0) {
        return null;
      }
      const targetNode = nodes.find((n) => n.id === targetId);
      if (isStudioFlowNode(targetNode) && targetNode.data.nodeId === "number-average") {
        const nums: number[] = [];
        for (const inc of list) {
          if (inc.targetHandle !== STUDIO_HANDLE_IN) {
            continue;
          }
          const v = pinValues.get(studioFlowPinKey(inc.source, inc.sourceHandle));
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
            : list.find((e) => e.targetHandle === STUDIO_HANDLE_IN) ?? list[0];
      if (chosen == null) {
        return null;
      }
      return pinValues.get(studioFlowPinKey(chosen.source, chosen.sourceHandle)) ?? null;
    };

    const narrowNumber = (v: FlowValue | null): number =>
      typeof v === "number" && Number.isFinite(v) ? v : 0;

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
            for (const handleId of splitOutputHandleIds(node.data.outputCount)) {
              pinValues.set(studioFlowPinKey(node.id, handleId), v);
            }
          }
          continue;
        }
        if (!isStudioFlowNode(node)) {
          continue;
        }
        if (node.data.nodeId === "sine-wave") {
          const cfg = node.data.defaultConfig;
          const t = Date.now() / 1000;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateSineWave(
              t,
              readSimInput(readIncoming(node.id, "amplitude"), cfg.amplitude, 1),
              readSimInput(readIncoming(node.id, "frequency"), cfg.frequency, 1),
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
            typeof smoothRaw === "number" && Number.isFinite(smoothRaw) ? smoothRaw : 0.25;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateNoiseSim(
              t,
              readSimInput(readIncoming(node.id, "seed"), cfg.seed, 1),
              readSimInput(readIncoming(node.id, "amplitude"), cfg.amplitude, 1),
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
              readVectorAxisInput(readIncoming(node.id, "x"), cfg.x, VECTOR_CONSTANT_DEFAULTS.x),
              readVectorAxisInput(readIncoming(node.id, "y"), cfg.y, VECTOR_CONSTANT_DEFAULTS.y),
              readVectorAxisInput(readIncoming(node.id, "z"), cfg.z, VECTOR_CONSTANT_DEFAULTS.z),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "scene-time") {
          const t = evaluateSceneTime();
          pinValues.set(studioFlowPinKey(node.id, "seconds"), t.seconds);
          pinValues.set(studioFlowPinKey(node.id, "frames"), t.frames);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), t.seconds);
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
            evaluateSceneSettingsExposure(readIncoming(node.id, "exposure"), cfg.exposure, 1),
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
          pinValues.set(studioFlowPinKey(node.id, "intensity"), light.intensity);
          pinValues.set(studioFlowPinKey(node.id, "r"), light.r);
          pinValues.set(studioFlowPinKey(node.id, "g"), light.g);
          pinValues.set(studioFlowPinKey(node.id, "b"), light.b);
          pinValues.set(studioFlowPinKey(node.id, "x"), light.x);
          pinValues.set(studioFlowPinKey(node.id, "y"), light.y);
          pinValues.set(studioFlowPinKey(node.id, "z"), light.z);
          continue;
        }

        if (node.data.nodeId === "camera-switch") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateCameraSwitchIndex(readIncoming(node.id, "index"), cfg.index),
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
          pinValues.set(studioFlowPinKey(node.id, "bloomIntensity"), pp.bloomIntensity);
          pinValues.set(studioFlowPinKey(node.id, "bloomThreshold"), pp.bloomThreshold);
          continue;
        }

        if (node.data.nodeId === "contact-shadows") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const cs = evaluateContactShadowsOutputs(cfg);
          pinValues.set(studioFlowPinKey(node.id, "opacity"), cs.opacity);
          pinValues.set(studioFlowPinKey(node.id, "blur"), cs.blur);
          pinValues.set(studioFlowPinKey(node.id, "far"), cs.far);
          pinValues.set(studioFlowPinKey(node.id, "scale"), cs.scale);
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
          continue;
        }

        if (node.data.nodeId === "uv-transform") {
          const cfg = node.data.defaultConfig as Record<string, unknown>;
          const uv = evaluateUvTransformOutputs(cfg, (key) => readIncoming(node.id, key));
          for (const key of UV_TRANSFORM_KEYS) {
            pinValues.set(studioFlowPinKey(node.id, key), uv[key]);
          }
          continue;
        }

        if (node.data.nodeId === "material-variant") {
          const cfg = node.data.defaultConfig;
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateMaterialVariantName(readIncoming(node.id, "variant"), cfg.variant),
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
            readEventBooleanValue(node.data.defaultConfig as Record<string, unknown>),
          );
          continue;
        }

        if (node.data.nodeId === "event-set-boolean") {
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            readEventBooleanValue(node.data.defaultConfig as Record<string, unknown>),
          );
          continue;
        }

        if (node.data.nodeId === "number-constant") {
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
          const factor = clampNumber(asFiniteNumber(node.data.defaultConfig.factor, 0.5), 0, 1);
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
          const a = readLerpInputValue(readIncoming(node.id, "a"), LERP_INPUT_DEFAULTS.a);
          const b = readLerpInputValue(readIncoming(node.id, "b"), LERP_INPUT_DEFAULTS.b);
          const t = readLerpInputValue(readIncoming(node.id, "t"), LERP_INPUT_DEFAULTS.t);
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
          const results = evaluateMultiplexer(readIncoming(node.id, "payload"), paths);
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
              readValueNormalizerInput(readIncoming(node.id, "value"), cfg.value, 0),
              readValueNormalizerInput(readIncoming(node.id, "inMin"), cfg.inMin, 0),
              readValueNormalizerInput(readIncoming(node.id, "inMax"), cfg.inMax, 1),
              readValueNormalizerInput(readIncoming(node.id, "outMin"), cfg.outMin, 0),
              readValueNormalizerInput(readIncoming(node.id, "outMax"), cfg.outMax, 1),
            ),
          );
          continue;
        }

        if (node.data.nodeId === "map-range") {
          const cfg = node.data.defaultConfig;
          const wiredValue =
            readIncoming(node.id, "value") ?? readIncoming(node.id, STUDIO_HANDLE_IN);
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateMapRange(
              readMapRangeInput(wiredValue, cfg.value, MAP_RANGE_INPUT_DEFAULTS.value),
              readMapRangeInput(readIncoming(node.id, "inMin"), cfg.inMin, MAP_RANGE_INPUT_DEFAULTS.inMin),
              readMapRangeInput(readIncoming(node.id, "inMax"), cfg.inMax, MAP_RANGE_INPUT_DEFAULTS.inMax),
              readMapRangeInput(readIncoming(node.id, "outMin"), cfg.outMin, MAP_RANGE_INPUT_DEFAULTS.outMin),
              readMapRangeInput(readIncoming(node.id, "outMax"), cfg.outMax, MAP_RANGE_INPUT_DEFAULTS.outMax),
              cfg.clamp !== false,
            ),
          );
          continue;
        }

        if (node.data.nodeId === "clamp") {
          const cfg = node.data.defaultConfig;
          const wiredValue =
            readIncoming(node.id, "value") ?? readIncoming(node.id, STUDIO_HANDLE_IN);
          pinValues.set(
            studioFlowPinKey(node.id, STUDIO_HANDLE_OUT),
            evaluateClamp(
              readClampInput(wiredValue, cfg.value, CLAMP_INPUT_DEFAULTS.value),
              readClampInput(readIncoming(node.id, "min"), cfg.min, CLAMP_INPUT_DEFAULTS.min),
              readClampInput(readIncoming(node.id, "max"), cfg.max, CLAMP_INPUT_DEFAULTS.max),
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
            typeof rawKey === "string" && rawKey.trim().length > 0 ? rawKey.trim() : "bmi270.accel.x";
          const live = resolveLiveNumericFromLatestByHint(latestByHint, sourceKey);
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
          pinValues.set(studioFlowPinKey(node.id, "pressure"), bundle.pressureHpa);
          pinValues.set(studioFlowPinKey(node.id, "temp"), bundle.tempC);
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "sht40-input") {
          const bundle = computeSht40PinBundle(latestByHint);
          pinValues.set(studioFlowPinKey(node.id, "humidity"), bundle.humidityPct);
          pinValues.set(studioFlowPinKey(node.id, "temp"), bundle.tempC);
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "bmm350-input") {
          const bundle = computeBmm350PinBundle(latestByHint);
          pinValues.set(studioFlowPinKey(node.id, "magnetic"), bundle.magneticUt);
          pinValues.set(studioFlowPinKey(node.id, "temp"), bundle.tempC);
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "bmi270-input") {
          const bundle = computeBmi270PinBundle(latestByHint);
          const bmiSample = latestByHint.bmi270;
          const prevQuat = node.data.liveQuaternionWire ?? { x: 0, y: 0, z: 0, w: 1 };
          const prevEuler = node.data.liveVector3ByHandle?.euler ?? { x: 0, y: 0, z: 0 };
          const prevAccel = node.data.liveVector3ByHandle?.accel ?? { x: 0, y: 0, z: 0 };
          const prevGyro = node.data.liveVector3ByHandle?.gyro ?? { x: 0, y: 0, z: 0 };
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
          if (bundle.streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (BMI270_TAP_NODE_ID_SET.has(node.data.nodeId)) {
          const bundle = computeBmi270PinBundle(latestByHint);
          const bmiSample = latestByHint.bmi270;
          const prevQuat = node.data.liveQuaternionWire ?? { x: 0, y: 0, z: 0, w: 1 };
          const prevEuler = node.data.liveVector3Wire ?? { x: 0, y: 0, z: 0 };
          const prevVec = node.data.liveVector3Wire ?? { x: 0, y: 0, z: 0 };
          let out: FlowValue;
          switch (node.data.nodeId) {
            case "bmi270-tap-accel":
              out = hasLiveBmi270AccelFields(bmiSample) ? bundle.accel : prevVec;
              break;
            case "bmi270-tap-gyro":
              out = hasLiveBmi270GyroFields(bmiSample) ? bundle.gyro : prevVec;
              break;
            case "bmi270-tap-temp": {
              const prevScalar =
                typeof node.data.liveValue === "number" && Number.isFinite(node.data.liveValue)
                  ? node.data.liveValue
                  : 0;
              out = hasLiveBmi270TempFields(bmiSample) ? bundle.temp : prevScalar;
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
            default:
              break;
          }
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), out);
          if (streamLive) {
            sensorHardwareLiveNodeIds.add(node.id);
          }
          continue;
        }

        if (node.data.nodeId === "quat-input") {
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), { x: 0, y: 0, z: 0, w: 1 });
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

        if (node.data.nodeId === "model-viewer") {
          continue;
        }

        if (node.data.nodeId === "model-select") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const url = typeof dc.selectedModelUrl === "string" ? dc.selectedModelUrl : "";
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), url);
          continue;
        }

        if (node.data.nodeId === "environment") {
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const wire = computeAggregatedEnvironmentWire(node.id, dc, edges, (tid, th) =>
            readIncoming(tid, th),
          );
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "camera-view") {
          const wire = flowWireCameraFromNodeDefaultConfig(node.data.defaultConfig as Record<string, unknown>);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "object-transform") {
          const wire = flowWireTransformFromNodeDefaultConfig(node.data.defaultConfig as Record<string, unknown>);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "transform-from-euler") {
          const euler = flowValueAsVec3(readIncoming(node.id, STUDIO_HANDLE_IN));
          const dc = node.data.defaultConfig as Record<string, unknown>;
          const eulerMapping = readFlowWireTransformEulerMapping(dc.eulerMapping);
          const wire = flowWireTransformFromEulerRad(euler, undefined, eulerMapping);
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), wire);
          continue;
        }

        if (node.data.nodeId === "glb-animation-bundle") {
          const wire = flowAnimationWireFromBundleDefaultConfig(node.data.defaultConfig as Record<string, unknown>);
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
            typeof rawThreshold === "number" ? rawThreshold : Number(rawThreshold ?? 0.5);
          const operator = node.data.defaultConfig.operator === "<" ? "<" : ">";
          const numericIncoming = narrowNumber(incomingValue);
          const result =
            operator === ">" ? numericIncoming > threshold : numericIncoming < threshold;
          pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), result);
          continue;
        }

        if (node.data.nodeId === "low-pass") {
          const alpha = clampNumber(asFiniteNumber(node.data.defaultConfig.alpha, 0.2), 0, 1);
          const numericIncoming = narrowNumber(incomingValue);
          const prev = pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT));
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

        pinValues.set(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT), incomingValue);
      }
    }

    const plotterHistUpdates = new Map<string, Record<string, number[]>>();
    for (const node of nodes) {
      if (!isPlotterNodeId(node.data.nodeId)) {
        continue;
      }
      const handles = node.data.inputHandles ?? [];
      const plotterCfg = coercePlotterConfig(node.data.defaultConfig);
      const cap = plotterCfg.historyLength;
      const prev = node.data.livePlotHistory ?? {};
      const nextCh: Record<string, number[]> = {};
      for (const h of handles) {
        const pinVal = readPinForEdgeTarget(edges, node.id, h.id, pinValues);
        const sample =
          typeof pinVal === "number" && Number.isFinite(pinVal) ? pinVal : Number.NaN;
        const series = [...(prev[h.id] ?? [])];
        series.push(sample);
        nextCh[h.id] = series.slice(-cap);
      }
      plotterHistUpdates.set(node.id, nextCh);
    }

    set((state) => ({
      nodes: state.nodes.map((node) => {
        const dataWithoutSensorMode: StudioNodeData = { ...node.data };
        delete dataWithoutSensorMode.sensorStreamMode;
        delete dataWithoutSensorMode.sensorHealth;
        delete dataWithoutSensorMode.sensorInvalidReason;
        delete dataWithoutSensorMode.sensorLastValidAtByHandle;
        delete dataWithoutSensorMode.sensorInvalidByHandle;
        if (node.data.nodeId !== "bmi270-input" && node.data.nodeId !== "bmm350-input") {
          delete dataWithoutSensorMode.liveVector3ByHandle;
        }
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
          node.data.nodeId !== "model-viewer"
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
          node.data.nodeId !== "bmi270-input" &&
          node.data.nodeId !== "dps368-input" &&
          node.data.nodeId !== "sht40-input" &&
          node.data.nodeId !== "bmm350-input" &&
          node.data.nodeId !== "vector-splitter" &&
          node.data.nodeId !== "quaternion-splitter"
        ) {
          delete dataWithoutSensorMode.liveNumberByHandle;
        }
        if (!isPlotterNodeId(node.data.nodeId)) {
          delete dataWithoutSensorMode.livePlotHistory;
        }

        const outPin = pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT));
        let nextLive: number | boolean | string | null = null;
        if (
          node.data.nodeId === "bmi270-input" ||
          node.data.nodeId === "dps368-input" ||
          node.data.nodeId === "sht40-input" ||
          node.data.nodeId === "bmm350-input" ||
          node.data.nodeId === "quat-input" ||
          node.data.nodeId === "vector-splitter" ||
          node.data.nodeId === "quaternion-splitter" ||
          node.data.nodeId === "rotation-3d-euler" ||
          node.data.nodeId === "rotation-3d-quaternion" ||
          node.data.nodeId === "model-viewer" ||
          node.data.nodeId === "environment" ||
          node.data.nodeId === "camera-view" ||
          node.data.nodeId === "object-transform" ||
          node.data.nodeId === "transform-from-euler" ||
          isPlotterNodeId(node.data.nodeId) ||
          BMI270_TAP_NODE_ID_SET.has(node.data.nodeId) ||
          ENVIRONMENT_SENSOR_TAP_NODE_ID_SET.has(node.data.nodeId)
        ) {
          nextLive = null;
        } else if (typeof outPin === "number" || typeof outPin === "boolean" || typeof outPin === "string") {
          nextLive = outPin;
        }

        const nextHistory =
          isPlotterNodeId(node.data.nodeId)
            ? []
            : typeof nextLive === "number"
              ? [
                  ...((node.data.liveHistory ?? []).slice(
                    -Math.max(
                      1,
                      node.data.nodeId === "sparkline"
                        ? Math.min(
                            512,
                            Math.round(asFiniteNumber(node.data.defaultConfig.historySize, 64)),
                          )
                        : 64,
                    ) + 1,
                  )),
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
          base.liveValue = readGlbAnimTriggerNonce(node.data.defaultConfig as Record<string, unknown>);
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

        if (ENVIRONMENT_SENSOR_TAP_NODE_ID_SET.has(node.data.nodeId)) {
          if (node.data.nodeId === "bmm350-tap-magnetic") {
            const vecOut = pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT));
            const isValidVec = vecOut != null && typeof vecOut === "object" && "x" in vecOut;
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
              base.sensorInvalidByHandle = { out: "Magnetic vector missing in live payload" };
            }
          } else {
            const scalarOut = pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT));
            const prevLive = typeof node.data.liveValue === "number" ? node.data.liveValue : undefined;
            const reason = computeNodeInvalidReason(node, latestByHint);
            const isValidScalar =
              reason == null && typeof scalarOut === "number" && Number.isFinite(scalarOut);
            base.liveValue = keepLastFiniteNumber(isValidScalar ? scalarOut : undefined, prevLive, 0);
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

        if (node.data.nodeId === "bmi270-tap-temp") {
          const scalarOut = pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT));
          const prevLive = typeof node.data.liveValue === "number" ? node.data.liveValue : undefined;
          const reason = computeNodeInvalidReason(node, latestByHint);
          const isValidScalar =
            reason == null && typeof scalarOut === "number" && Number.isFinite(scalarOut);
          base.liveValue = keepLastFiniteNumber(isValidScalar ? scalarOut : undefined, prevLive, 0);
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
          const prev = node.data.liveNumberByHandle;
          const dpsSample = latestByHint.dps368;
          const pressureValid =
            dpsSample == null ||
            (typeof dpsSample.secondaryX100 === "number" && Number.isFinite(dpsSample.secondaryX100));
          const tempValid =
            dpsSample == null ||
            (typeof dpsSample.temperatureCx100 === "number" &&
              Number.isFinite(dpsSample.temperatureCx100));
          base.liveNumberByHandle = {
            pressure: keepLastFiniteNumber(pressureValid ? pressure : undefined, prev?.pressure, 0),
            temp: keepLastFiniteNumber(tempValid ? temp : undefined, prev?.temp, 0),
          };
          base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
            mergeValidHandleTimestamp(node.data.sensorLastValidAtByHandle, "pressure", pressureValid, nowIso),
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
          const prev = node.data.liveNumberByHandle;
          const shtSample = latestByHint.sht40;
          const humidityValid =
            shtSample == null ||
            (typeof shtSample.secondaryX100 === "number" && Number.isFinite(shtSample.secondaryX100));
          const tempValid =
            shtSample == null ||
            (typeof shtSample.temperatureCx100 === "number" &&
              Number.isFinite(shtSample.temperatureCx100));
          base.liveNumberByHandle = {
            humidity: keepLastFiniteNumber(humidityValid ? humidity : undefined, prev?.humidity, 0),
            temp: keepLastFiniteNumber(tempValid ? temp : undefined, prev?.temp, 0),
          };
          base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
            mergeValidHandleTimestamp(node.data.sensorLastValidAtByHandle, "humidity", humidityValid, nowIso),
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
          const nextMag =
            magValid
              ? flowValueAsVec3(mag)
              : (prevVec ?? { x: 0, y: 0, z: 0 });
          base.liveVector3ByHandle = {
            magnetic: nextMag,
          };
          base.liveNumberByHandle = {
            temp: keepLastFiniteNumber(tempValid ? temp : undefined, node.data.liveNumberByHandle?.temp, 0),
          };
          base.sensorLastValidAtByHandle = mergeValidHandleTimestamp(
            mergeValidHandleTimestamp(node.data.sensorLastValidAtByHandle, "magnetic", magValid, nowIso),
            "temp",
            tempValid,
            nowIso,
          );
          if (latestByHint.bmm350 != null) {
            const invalidByHandle: Record<string, string> = {};
            if (!magValid) {
              invalidByHandle.magnetic = "Magnetic vector missing in live payload";
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
          base.liveVector3ByHandle = {
            accel:
              accel != null && typeof accel === "object" && accel !== null && "x" in accel
                ? (accel as { x: number; y: number; z: number })
                : { x: 0, y: 0, z: 0 },
            gyro:
              gyro != null && typeof gyro === "object" && gyro !== null && "x" in gyro
                ? (gyro as { x: number; y: number; z: number })
                : { x: 0, y: 0, z: 0 },
            euler:
              euler != null && typeof euler === "object" && euler !== null && "x" in euler
                ? (euler as { x: number; y: number; z: number })
                : { x: 0, y: 0, z: 0 },
          };
          base.liveNumberByHandle = {
            temp: typeof temp === "number" && Number.isFinite(temp) ? temp : 0,
          };
          const quatWire = pinValues.get(studioFlowPinKey(node.id, "quaternion"));
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

        if (node.data.nodeId === "quat-input") {
          const qOut = pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT));
          base.liveQuaternionWire = flowValueAsQuaternion(qOut);
        }

        if (
          node.data.nodeId === "bmi270-tap-euler" ||
          node.data.nodeId === "bmi270-tap-accel" ||
          node.data.nodeId === "bmi270-tap-gyro"
        ) {
          const vecOut = pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT));
          base.liveVector3Wire = flowValueAsVec3(vecOut);
        }

        if (node.data.nodeId === "bmi270-tap-quaternion") {
          const qTap = pinValues.get(studioFlowPinKey(node.id, STUDIO_HANDLE_OUT));
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
        }

        if (node.data.nodeId === "vector-splitter") {
          base.liveNumberByHandle = {
            x: narrowNumber(pinValues.get(studioFlowPinKey(node.id, "x")) ?? null),
            y: narrowNumber(pinValues.get(studioFlowPinKey(node.id, "y")) ?? null),
            z: narrowNumber(pinValues.get(studioFlowPinKey(node.id, "z")) ?? null),
          };
        }

        if (node.data.nodeId === "quaternion-splitter") {
          base.liveNumberByHandle = {
            x: narrowNumber(pinValues.get(studioFlowPinKey(node.id, "x")) ?? null),
            y: narrowNumber(pinValues.get(studioFlowPinKey(node.id, "y")) ?? null),
            z: narrowNumber(pinValues.get(studioFlowPinKey(node.id, "z")) ?? null),
            w: narrowNumber(pinValues.get(studioFlowPinKey(node.id, "w")) ?? null),
          };
        }

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
            base.sensorInvalidReason = computeNodeInvalidReason(node, latestByHint);
          }
        }

        return {
          ...node,
          data: base,
        };
      }),
    }));
  },
  dispatchFlowKeyboardEvent: (event) => {
    const { nodes } = get();
    const matchingSources = nodes.filter(
      (n) =>
        n.data.nodeId === "on-key" &&
        keyboardEventMatchesOnKeyConfig(event, n.data.defaultConfig as Record<string, unknown>),
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
        pointerEventMatchesOnClickConfig(event, n.data.defaultConfig as Record<string, unknown>),
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
