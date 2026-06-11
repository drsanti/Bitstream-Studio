import type { Edge } from "@xyflow/react";
import {
  STUDIO_HANDLE_MESHES,
  STUDIO_HANDLE_MODELS,
  STUDIO_HANDLE_OUT,
} from "../../features/editor/studio-handle-ids";
import { collectFlowMeshEntries } from "./collect-flow-mesh-entries";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import type { StudioAssetDescriptor } from "../../features/asset-browser/studio-asset.types";
import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
} from "../../features/asset-browser/studio-model-scene-bindings";
import { resolveStudioSourceModelGlbUrl } from "../../features/editor/model/model-generated-bindings";
import { mergeFlowWireEnvironmentIntoScene3d } from "../../features/editor/nodes/environment/flow-wire-environment";
import { mergeFlowWireCameraIntoScene3d } from "../../features/editor/nodes/camera-view/flow-wire-camera";
import {
  coerceFlowWirePhysicsSceneV1,
  type FlowWirePhysicsSceneV1,
} from "../../features/editor/nodes/physics/flow-wire-physics-scene";
import { mergeFlowWireTransformIntoScene3d } from "../../features/editor/nodes/transform/flow-wire-transform";
import { isFlowWireTransformV1 } from "../../features/editor/nodes/transform/flow-wire-transform";
import {
  coerceScene3DConfigV1,
  type Scene3DConfigV1,
} from "../scene3d/scene3d-config";
import { buildGlbAnimationPreviewSceneProps } from "../../features/editor/gltf/build-glb-animation-preview-scene-props";
import {
  applyStageScene3dPresentation,
  STAGE_DEFAULT_SHOW_GRID,
  stageSceneOutputDefaultScene3d,
} from "./stage-scene-defaults";
import { mergeFlowSceneWiresIntoScene3d } from "../../features/editor/nodes/scene-fx/merge-flow-scene-wires";
import {
  mergeFlowWirePhysicsIntoScene3d,
  physicsCollidersFromWire,
} from "../../features/editor/nodes/physics/merge-flow-physics-into-scene3d";
import { collectStagePhysicsCollidersFromGraph } from "./stage-physics-colliders";
import type { StagePhysicsColliderV1 } from "./stage-physics-colliders";
import type { StageViewportModelInstance } from "../viewport/studio-viewport-stage-multi-models";
import type { StageMeshEntryV1, StageSceneModelEntryV1, StageSceneSnapshotV1 } from "./stage-scene-snapshot";
import {
  clearScene3dModelForMeshesOnly,
  isMeshesOnlyCommittedStage,
} from "./stage-meshes-only-scene";

export const SCENE_OUTPUT_NODE_ID = "scene-output";
export const SCENE_OUTPUT_HANDLE_MODELS = STUDIO_HANDLE_MODELS;
export const SCENE_OUTPUT_HANDLE_MESHES = STUDIO_HANDLE_MESHES;

function readBoolean(cfg: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = cfg[key];
  return typeof v === "boolean" ? v : fallback;
}

function resolveModelUrlFromSourceNode(
  node: FlowGraphNode,
  catalog?: readonly StudioAssetDescriptor[],
): string | null {
  if (node.data.nodeId === "model-select") {
    const dc = node.data.defaultConfig as Record<string, unknown>;
    const direct = dc.selectedModelUrl;
    if (typeof direct === "string" && direct.trim().length > 0) {
      return direct.trim();
    }
    const assetId =
      typeof dc.selectedStudioAssetId === "string" ? dc.selectedStudioAssetId.trim() : "";
    if (assetId.length > 0 && catalog != null && catalog.length > 0) {
      const descriptor = getStudioModelDescriptorById(assetId, catalog);
      if (descriptor != null) {
        const persisted = persistedModelUrlFromStudioDescriptor(descriptor);
        if (persisted.trim().length > 0) {
          return persisted.trim();
        }
      }
    }
    const live = node.data.liveValue;
    if (typeof live === "string" && live.trim().length > 0) {
      return live.trim();
    }
    return resolveStudioSourceModelGlbUrl([node], node.id);
  }
  const live = node.data.liveValue;
  if (typeof live === "string" && live.trim().length > 0) {
    return live.trim();
  }
  return null;
}

function resolveStudioAssetIdFromSourceNode(node: FlowGraphNode): string | undefined {
  if (node.data.nodeId !== "model-select") {
    return undefined;
  }
  const dc = node.data.defaultConfig as Record<string, unknown>;
  const assetId =
    typeof dc.selectedStudioAssetId === "string" ? dc.selectedStudioAssetId.trim() : "";
  return assetId.length > 0 ? assetId : undefined;
}

function collectModelsForSceneOutput(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  outputNodeId: string,
  catalog?: readonly StudioAssetDescriptor[],
): StageSceneModelEntryV1[] {
  const modelEdges = edges.filter(
    (e) =>
      e.target === outputNodeId &&
      (e.targetHandle ?? SCENE_OUTPUT_HANDLE_MODELS) === SCENE_OUTPUT_HANDLE_MODELS,
  );
  const entries: StageSceneModelEntryV1[] = [];
  for (const edge of modelEdges) {
    const src = nodes.find((n) => n.id === edge.source);
    if (src == null) {
      continue;
    }
    const modelUrl = resolveModelUrlFromSourceNode(src, catalog);
    if (modelUrl == null) {
      continue;
    }
    const label =
      typeof src.data.label === "string" && src.data.label.trim().length > 0
        ? src.data.label.trim()
        : src.data.nodeId;
    const xfWire = src.data.liveTransformWire ?? null;
    entries.push({
      sourceNodeId: src.id,
      label,
      modelUrl,
      studioAssetId: resolveStudioAssetIdFromSourceNode(src),
      transformWire: isFlowWireTransformV1(xfWire) ? xfWire : null,
    });
  }
  return entries;
}

/**
 * Evaluate graph → Stage snapshot (call after `tickSimulation`).
 *
 * **Independence:** reads only the **`scene-output`** node's `defaultConfig` / live wires
 * (models, env, camera, anim, transform). Does **not** read **Model Viewer** or rotation
 * preview nodes. GLB scalar drives are not collected from the graph (`nodes: []` in animation build).
 */
export function evaluateStageSceneSnapshot(args: {
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  catalog?: readonly StudioAssetDescriptor[];
}): StageSceneSnapshotV1 {
  const { nodes, edges, catalog } = args;
  const outputNode = nodes.find((n) => n.data.nodeId === SCENE_OUTPUT_NODE_ID);
  const nowMs = Date.now();

  if (outputNode == null) {
    return {
      version: 1,
      sceneOutputNodeId: null,
      updatedAtMs: nowMs,
      showGrid: STAGE_DEFAULT_SHOW_GRID,
      models: [],
      meshes: [],
      environmentWire: null,
      cameraWire: null,
      animationWire: null,
      transformWire: null,
      physicsWire: null,
      physicsColliders: [],
      scene3d: stageSceneOutputDefaultScene3d(),
    };
  }

  const dc = outputNode.data.defaultConfig as Record<string, unknown>;
  const showGrid = readBoolean(dc, "showGrid", STAGE_DEFAULT_SHOW_GRID);
  const baseScene =
    dc.scene3d != null
      ? coerceScene3DConfigV1(dc.scene3d)
      : stageSceneOutputDefaultScene3d();

  const models = collectModelsForSceneOutput(nodes, edges, outputNode.id, catalog);
  const meshes = collectFlowMeshEntries({
    nodes,
    edges,
    targetNodeId: outputNode.id,
    targetHandle: SCENE_OUTPUT_HANDLE_MESHES,
  });
  const primaryUrl = models[0]?.modelUrl ?? "";

  const environmentWire = outputNode.data.liveEnvironmentWire ?? null;
  const cameraWire = outputNode.data.liveCameraWire ?? null;
  const animationWire = outputNode.data.liveAnimationWire ?? null;
  const transformWire = outputNode.data.liveTransformWire ?? null;
  const physicsWireRaw = coerceFlowWirePhysicsSceneV1(outputNode.data.livePhysicsWire);
  const physicsWire = physicsWireRaw.enabled ? physicsWireRaw : null;
  const wiredColliders = physicsCollidersFromWire(physicsWire);
  const physicsColliders: StagePhysicsColliderV1[] =
    physicsWire != null
      ? wiredColliders.length > 0
        ? wiredColliders
        : collectStagePhysicsCollidersFromGraph(nodes)
      : [];

  const primaryModel = models[0];
  let scene3d: Scene3DConfigV1 = baseScene;
  if (primaryUrl.length > 0) {
    const wiredAssetId = primaryModel?.studioAssetId;
    scene3d = {
      ...baseScene,
      model: {
        ...baseScene.model,
        url: primaryUrl,
        studioAssetId:
          wiredAssetId != null && wiredAssetId.length > 0 ? wiredAssetId : undefined,
      },
    };
  }
  scene3d = mergeFlowWireEnvironmentIntoScene3d(scene3d, environmentWire);
  scene3d = mergeFlowWireCameraIntoScene3d(scene3d, cameraWire);
  scene3d = mergeFlowWireTransformIntoScene3d(scene3d, transformWire);
  scene3d = mergeFlowSceneWiresIntoScene3d(scene3d, {
    fog: outputNode.data.liveFogWire ?? null,
    exposure: outputNode.data.liveSettingsExposure ?? null,
    studioLight: outputNode.data.liveStudioLightWire ?? null,
    postProcessing: outputNode.data.livePostProcessingWire ?? null,
    contactShadows: outputNode.data.liveContactShadowsWire ?? null,
    particleEmitter: outputNode.data.liveParticleEmitterWire ?? null,
  });
  scene3d = mergeFlowWirePhysicsIntoScene3d(scene3d, physicsWire);
  scene3d = applyStageScene3dPresentation(scene3d, { showGrid });
  if (isMeshesOnlyCommittedStage({ models, meshesCount: meshes.length })) {
    scene3d = clearScene3dModelForMeshesOnly(scene3d);
  }

  return {
    version: 1,
    sceneOutputNodeId: outputNode.id,
    updatedAtMs: nowMs,
    showGrid,
    models,
    meshes,
    environmentWire,
    cameraWire,
    animationWire,
    transformWire,
    physicsWire,
    physicsColliders,
    scene3d,
  };
}

/** Stage-only animation extras — empty graph scope avoids Model Viewer GLB drive fallback. */
function buildStageAnimationPreviewSceneProps(
  snapshot: StageSceneSnapshotV1,
): ReturnType<typeof buildGlbAnimationPreviewSceneProps> {
  return buildGlbAnimationPreviewSceneProps({
    nodes: [],
    edges: [],
    flowNodeId: snapshot.sceneOutputNodeId ?? "stage",
    catalogNodeId: SCENE_OUTPUT_NODE_ID,
    defaultConfig: {},
    liveAnimationWire: snapshot.animationWire,
  });
}

/** Build {@link StudioSceneViewport} scene props from a Stage snapshot (workbench only). */
export function buildStagePreviewSceneProps(
  snapshot: StageSceneSnapshotV1,
  primaryModelIndex = 0,
): {
  scene3d: Scene3DConfigV1;
  showGrid: boolean;
  previewMeshGlbUrl: string | undefined;
  stageModelInstances: StageViewportModelInstance[];
  stagePrimaryModelIndex: number;
  glbAnimationSceneExtras: ReturnType<typeof buildGlbAnimationPreviewSceneProps>;
  stagePhysicsWire: FlowWirePhysicsSceneV1 | null;
  stagePhysicsColliders: StagePhysicsColliderV1[];
  stageProceduralMeshes: StageMeshEntryV1[];
} {
  const modelCount = snapshot.models.length;
  const idx =
    modelCount <= 0
      ? 0
      : Math.max(0, Math.min(primaryModelIndex, modelCount - 1));
  const primaryUrl = snapshot.models[idx]?.modelUrl;
  const glbAnimationSceneExtras = buildStageAnimationPreviewSceneProps(snapshot);

  const focused = snapshot.models[idx];
  let scene3d = applyStageScene3dPresentation(snapshot.scene3d, {
    showGrid: snapshot.showGrid,
  });
  if (focused != null && focused.modelUrl.trim().length > 0) {
    const wiredAssetId = focused.studioAssetId;
    scene3d = {
      ...scene3d,
      model: {
        ...scene3d.model,
        url: focused.modelUrl,
        studioAssetId:
          wiredAssetId != null && wiredAssetId.length > 0 ? wiredAssetId : undefined,
      },
    };
  } else if (modelCount === 0 && snapshot.meshes.length > 0) {
    // Meshes-only Stage: do not load Scene Output's baked-in demo GLB URL.
    scene3d = {
      ...scene3d,
      model: {
        ...scene3d.model,
        url: "",
        studioAssetId: undefined,
      },
    };
  }

  const stageModelInstances: StageViewportModelInstance[] = snapshot.models.map((m) => ({
    modelUrl: m.modelUrl,
    studioAssetId: m.studioAssetId,
    sourceNodeId: m.sourceNodeId,
    transformWire: m.transformWire,
  }));

  return {
    scene3d,
    showGrid: snapshot.showGrid,
    showBackgroundTexture: scene3d.environment.showBackgroundTexture,
    useCubemapIbl: scene3d.environment.useCubemapIbl,
    environmentPresetIndex: scene3d.environment.presetIndex,
    previewMeshGlbUrl: primaryUrl,
    stageModelInstances,
    stagePrimaryModelIndex: idx,
    glbAnimationSceneExtras,
    stagePhysicsWire: snapshot.physicsWire,
    stagePhysicsColliders: snapshot.physicsColliders,
    stageProceduralMeshes: snapshot.meshes,
  };
}

export function graphHasSceneOutputNode(
  nodes: ReadonlyArray<{ data: { nodeId: string } }>,
): boolean {
  return nodes.some((n) => n.data.nodeId === SCENE_OUTPUT_NODE_ID);
}

/** Scan root buffer, active canvas, and nested subgraph documents for Scene Output. */
export function graphHasSceneOutputNodeInDocument(args: {
  nodes: ReadonlyArray<{ data: { nodeId: string } }>;
  rootNodes?: ReadonlyArray<{ data: { nodeId: string } }>;
  subgraphs?: Record<string, { nodes: ReadonlyArray<{ data: { nodeId: string } }> }>;
}): boolean {
  const buckets = [
    args.nodes,
    args.rootNodes ?? [],
    ...Object.values(args.subgraphs ?? {}).map((subgraph) => subgraph.nodes),
  ];
  for (const list of buckets) {
    if (graphHasSceneOutputNode(list)) {
      return true;
    }
  }
  return false;
}
