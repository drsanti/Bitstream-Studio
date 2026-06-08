import { evaluateCameraSwitchIndex, evaluateMorphWeight } from "../../../core/flow/scene-fx-operations";
import { buildGlbAnimEventPreviewDrive } from "../nodes/events/glb-anim-event-config";
import { readGlbPartDriveScalar } from "../nodes/events/glb-part-event-config";
import { coerceNumberConstantValue } from "../nodes/constants/number-constant-helpers";
import { readGlbExtractTag, resolveNodeStudioModelScopeNodeId, type StudioFlowEdgeLike } from "../model/model-generated-bindings";
import type { StudioGltfExtractKind } from "./studio-gltf-extract";
import type { GlbAnimationClipPreviewDrive } from "./studio-glb-animation-preview-mixer";
import {
  mergeGlbMaterialPbrDriveRow,
  readGlbMaterialParam,
  type GlbMaterialPbrDriveRow,
} from "./studio-glb-material-param";
import {
  mergeGlbMaterialTextureDriveRow,
  readGlbMaterialTextureSlot,
  readGlbMaterialTextureUrl,
  type GlbMaterialTextureDriveRow,
} from "./studio-glb-material-texture";
import type { GlbMaterialVideoDriveRow } from "./studio-glb-material-video";
import {
  mergeGlbMaterialVideoDriveRow,
  readMaterialVideoBlend,
  readMaterialVideoMapSlot,
  readMaterialVideoToneMapped,
} from "./studio-glb-material-video";
import type { FlowWireVideoTextureV1 } from "../../../core/camera/flow-wire-video";
import { isFlowWireVideoTextureV1 } from "../../../core/camera/flow-wire-video";
import {
  flowVec3ToGlbMaterialColorRgb,
  mergeGlbMaterialColorDriveRow,
  readGlbMaterialColorRgbFromConfig,
  readGlbMaterialColorTarget,
  type GlbMaterialColorDriveRow,
} from "./studio-glb-material-color";
import { evaluatePartSpinDrive } from "../nodes/scene/part-spin-config";
import {
  GLB_PART_TRANSFORM_NODE_ID,
  readGlbPartTransformFromConfig,
  readGlbPartTransformPath,
} from "../nodes/scene/glb-part-transform-config";
import type { FlowWireTransformV1 } from "../nodes/transform/flow-wire-transform";
import type { GlbPartSpinDriveRow } from "./studio-glb-preview-runtime";

const GLB_SCALAR_DRIVE_NODE_IDS = new Set<string>([
  "number-constant",
  "glb-material-param",
  "event-toggle-glb-part",
  "event-set-glb-part",
]);

type FlowNodeLike = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
    liveValue?: unknown;
    liveVector3Wire?: { x: number; y: number; z: number };
    liveVideoTextureWire?: FlowWireVideoTextureV1;
    liveInputNumberByHandle?: Record<string, number>;
  };
};

function nodeMatchesModelScope(
  n: FlowNodeLike,
  sourceModelNodeId: string,
  nodes: readonly FlowNodeLike[],
  edges?: readonly StudioFlowEdgeLike[],
): boolean {
  return resolveNodeStudioModelScopeNodeId(n, nodes, edges) === sourceModelNodeId;
}

const GLB_SCALAR_DRIVE_KINDS = new Set<StudioGltfExtractKind>([
  "morph",
  "light",
  "animation",
  "part",
  "material",
  "camera",
]);

function readGlbScalarDriveValue(n: FlowNodeLike): number {
  const rawCfg = n.data.defaultConfig;
  if (n.data.nodeId === "number-constant" || n.data.nodeId === "glb-material-param") {
    const v =
      typeof n.data.liveValue === "number" && Number.isFinite(n.data.liveValue)
        ? n.data.liveValue
        : coerceNumberConstantValue(rawCfg, rawCfg.value);
    const tag = readGlbExtractTag(rawCfg);
    if (tag?.kind === "part") {
      return readGlbPartDriveScalar({ ...rawCfg, value: v });
    }
    return v;
  }
  return readGlbPartDriveScalar(rawCfg);
}

/**
 * Aggregate GLB scalar drive nodes linked to `sourceModelNodeId` into maps the model viewer
 * preview can apply (morph, light, animation, part visibility, material PBR, embedded camera).
 */
export function collectGlbScalarDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): {
  morphs: Record<string, number>;
  lights: Record<string, number>;
  anims: Record<string, number>;
  parts: Record<string, number>;
  materialPbr: Record<string, GlbMaterialPbrDriveRow>;
  cameras: Record<string, number>;
} {
  const morphs: Record<string, number> = {};
  const lights: Record<string, number> = {};
  const anims: Record<string, number> = {};
  const parts: Record<string, number> = {};
  const materialPbr: Record<string, GlbMaterialPbrDriveRow> = {};
  const cameras: Record<string, number> = {};

  if (sourceModelNodeId.trim().length === 0) {
    return { morphs, lights, anims, parts, materialPbr, cameras };
  }

  for (const n of nodes) {
    if (!GLB_SCALAR_DRIVE_NODE_IDS.has(n.data.nodeId)) {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const tag = readGlbExtractTag(n.data.defaultConfig);
    if (tag == null || !GLB_SCALAR_DRIVE_KINDS.has(tag.kind)) {
      continue;
    }
    if (
      (n.data.nodeId === "event-toggle-glb-part" || n.data.nodeId === "event-set-glb-part") &&
      tag.kind !== "part"
    ) {
      continue;
    }

    const v = readGlbScalarDriveValue(n);

    switch (tag.kind) {
      case "morph":
        morphs[tag.ref] = v;
        break;
      case "light":
        lights[tag.ref] = v;
        break;
      case "animation":
        anims[tag.ref] = v;
        break;
      case "part":
        parts[tag.ref] = v;
        break;
      case "material": {
        const param = readGlbMaterialParam(n.data.defaultConfig);
        materialPbr[tag.ref] = mergeGlbMaterialPbrDriveRow(materialPbr[tag.ref], param, v);
        break;
      }
      case "camera":
        cameras[tag.ref] = v;
        break;
      default:
        break;
    }
  }

  return { morphs, lights, anims, parts, materialPbr, cameras };
}

/**
 * Continuous part rotation from **`part-spin`** nodes scoped to the active Model.
 * Later nodes win when multiple drives target the same part path.
 */
export function collectGlbPartSpinDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): Record<string, GlbPartSpinDriveRow> {
  const spins: Record<string, GlbPartSpinDriveRow> = {};
  if (sourceModelNodeId.trim().length === 0) {
    return spins;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "part-spin") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const wiredSpeed = n.data.liveInputNumberByHandle?.speed;
    const wiredEnabled = n.data.liveInputBooleanByHandle?.enabled;
    const drive = evaluatePartSpinDrive({
      defaultConfig: n.data.defaultConfig,
      wired: {
        speedRadS:
          typeof wiredSpeed === "number" && Number.isFinite(wiredSpeed)
            ? wiredSpeed
            : undefined,
        enabled:
          typeof wiredEnabled === "boolean" ? wiredEnabled : undefined,
      },
    });
    if (drive == null) {
      continue;
    }
    spins[drive.partPath] = drive.row;
  }
  return spins;
}

/**
 * Authored local TRS from **`glb-part-transform`** nodes scoped to the active Model.
 * Later nodes win when multiple drives target the same part path.
 */
export function collectGlbPartTransformDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): Record<string, FlowWireTransformV1> {
  const transforms: Record<string, FlowWireTransformV1> = {};
  if (sourceModelNodeId.trim().length === 0) {
    return transforms;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== GLB_PART_TRANSFORM_NODE_ID) {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const partPath = readGlbPartTransformPath(n.data.defaultConfig);
    if (partPath.length === 0) {
      continue;
    }
    transforms[partPath] = readGlbPartTransformFromConfig(n.data.defaultConfig);
  }
  return transforms;
}

/**
 * Structured one-shot / loop playback drives from **`event-trigger-glb-anim`** nodes bound to
 * animation clips on the same Model.
 */
export function collectGlbEventAnimationDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): Record<string, GlbAnimationClipPreviewDrive> {
  const drives: Record<string, GlbAnimationClipPreviewDrive> = {};
  if (sourceModelNodeId.trim().length === 0) {
    return drives;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "event-trigger-glb-anim") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const tag = readGlbExtractTag(n.data.defaultConfig);
    if (tag == null || tag.kind !== "animation") {
      continue;
    }
    const drive = buildGlbAnimEventPreviewDrive(n.data.defaultConfig);
    if (drive == null) {
      continue;
    }
    drives[tag.ref] = drive;
  }
  return drives;
}

/**
 * Texture URL drives from **`glb-material-texture`** nodes linked to the same Model.
 */
export function collectGlbMaterialTextureDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): Record<string, GlbMaterialTextureDriveRow> {
  const textures: Record<string, GlbMaterialTextureDriveRow> = {};
  if (sourceModelNodeId.trim().length === 0) {
    return textures;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "glb-material-texture") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const tag = readGlbExtractTag(n.data.defaultConfig);
    if (tag == null || tag.kind !== "material") {
      continue;
    }
    const url = readGlbMaterialTextureUrl(n.data.defaultConfig, n.data.liveValue);
    if (url.length === 0) {
      continue;
    }
    const slot = readGlbMaterialTextureSlot(n.data.defaultConfig);
    textures[tag.ref] = mergeGlbMaterialTextureDriveRow(textures[tag.ref], slot, url);
  }
  return textures;
}

/**
 * Live camera **VideoTexture** drives from **`material-video`** nodes linked to the same Model.
 */
export function collectGlbMaterialVideoDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): Record<string, GlbMaterialVideoDriveRow> {
  const videos: Record<string, GlbMaterialVideoDriveRow> = {};
  if (sourceModelNodeId.trim().length === 0) {
    return videos;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "material-video") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const tag = readGlbExtractTag(n.data.defaultConfig);
    if (tag == null || tag.kind !== "material") {
      continue;
    }
    const wire = n.data.liveVideoTextureWire;
    if (!isFlowWireVideoTextureV1(wire)) {
      continue;
    }
    const slot = readMaterialVideoMapSlot(n.data.defaultConfig);
    const gain = readMaterialVideoBlend(
      n.data.defaultConfig,
      n.data.liveInputNumberByHandle?.gain,
    );
    if (gain <= 0) {
      continue;
    }
    videos[tag.ref] = mergeGlbMaterialVideoDriveRow(videos[tag.ref], slot, {
      textureNodeId: wire.sourceNodeId,
      gain,
      toneMapped: readMaterialVideoToneMapped(n.data.defaultConfig),
    });
  }
  return videos;
}

function readGlbMaterialColorDriveRgb(n: FlowNodeLike): { r: number; g: number; b: number } {
  const wired = n.data.liveVector3Wire;
  if (wired != null) {
    return flowVec3ToGlbMaterialColorRgb(wired);
  }
  return readGlbMaterialColorRgbFromConfig(n.data.defaultConfig);
}

/**
 * RGB color drives from **`glb-material-color`** nodes linked to the same Model.
 */
export function collectGlbMaterialColorDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): Record<string, GlbMaterialColorDriveRow> {
  const colors: Record<string, GlbMaterialColorDriveRow> = {};
  if (sourceModelNodeId.trim().length === 0) {
    return colors;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "glb-material-color") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const tag = readGlbExtractTag(n.data.defaultConfig);
    if (tag == null || tag.kind !== "material") {
      continue;
    }
    const target = readGlbMaterialColorTarget(n.data.defaultConfig);
    const rgb = readGlbMaterialColorDriveRgb(n);
    colors[tag.ref] = mergeGlbMaterialColorDriveRow(colors[tag.ref], target, rgb);
  }
  return colors;
}

function readMorphTargetId(cfg: Record<string, unknown>): string {
  const raw =
    typeof cfg.morphTargetId === "string"
      ? cfg.morphTargetId
      : typeof cfg.label === "string"
        ? cfg.label
        : "";
  return raw.trim();
}

function readSceneLightGlbTarget(cfg: Record<string, unknown>): string {
  const raw =
    typeof cfg.lightTarget === "string"
      ? cfg.lightTarget
      : typeof cfg.label === "string"
        ? cfg.label
        : "";
  return raw.trim();
}

/** Morph weights from **`morph-target`** nodes scoped to the active Model. */
export function collectFlowMorphTargetDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): Record<string, number> {
  const morphs: Record<string, number> = {};
  if (sourceModelNodeId.trim().length === 0) {
    return morphs;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "morph-target") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const ref = readMorphTargetId(n.data.defaultConfig);
    if (ref.length === 0) {
      continue;
    }
    const wired =
      typeof n.data.liveValue === "number" && Number.isFinite(n.data.liveValue)
        ? n.data.liveValue
        : n.data.defaultConfig.value;
    morphs[ref] = evaluateMorphWeight(wired, n.data.defaultConfig.value);
  }
  return morphs;
}

/** Embedded GLB light intensities from scoped **`scene-light`** nodes with a target name. */
export function collectFlowSceneLightGlbDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): Record<string, number> {
  const lights: Record<string, number> = {};
  if (sourceModelNodeId.trim().length === 0) {
    return lights;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "scene-light") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const name = readSceneLightGlbTarget(n.data.defaultConfig);
    if (name.length === 0) {
      continue;
    }
    const wired =
      typeof n.data.liveValue === "number" && Number.isFinite(n.data.liveValue)
        ? n.data.liveValue
        : n.data.defaultConfig.intensity;
    const v = typeof wired === "number" && Number.isFinite(wired) ? wired : Number(wired ?? 1);
    lights[name] = Math.max(0, v);
  }
  return lights;
}

function readCameraSwitchIndex(cfg: Record<string, unknown>, liveValue: unknown): number {
  const wired =
    typeof liveValue === "number" && Number.isFinite(liveValue) ? liveValue : cfg.index;
  return evaluateCameraSwitchIndex(null, wired);
}

/** Active GLB camera slot index from scoped **`camera-switch`** nodes (0–7). */
export function collectFlowCameraSwitchIndexForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): number | null {
  if (sourceModelNodeId.trim().length === 0) {
    return null;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "camera-switch") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    return readCameraSwitchIndex(n.data.defaultConfig, n.data.liveValue);
  }
  return null;
}

function readCameraRigNames(cfg: Record<string, unknown>): string[] {
  const raw = cfg.cameraRig;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
}

/** Optional explicit camera name ordering from **`camera-switch`** node config. */
export function collectFlowCameraSwitchRigForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): string[] | null {
  if (sourceModelNodeId.trim().length === 0) {
    return null;
  }
  for (const n of nodes) {
    if (n.data.nodeId !== "camera-switch") {
      continue;
    }
    if (!nodeMatchesModelScope(n, sourceModelNodeId, nodes, edges)) {
      continue;
    }
    const rig = readCameraRigNames(n.data.defaultConfig);
    return rig.length > 0 ? rig : null;
  }
  return null;
}
