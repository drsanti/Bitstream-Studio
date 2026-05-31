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
