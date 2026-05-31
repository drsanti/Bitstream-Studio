import { buildGlbAnimEventPreviewDrive } from "../nodes/events/glb-anim-event-config";
import { readGlbPartVisibilityScalar } from "../nodes/events/glb-part-event-config";
import { coerceNumberConstantValue } from "../nodes/constants/number-constant-helpers";
import { readGlbExtractTag, resolveNodeStudioModelScopeNodeId, type StudioFlowEdgeLike } from "../model/model-generated-bindings";
import type { StudioGltfExtractKind } from "./studio-gltf-extract";
import type { GlbAnimationClipPreviewDrive } from "./studio-glb-animation-preview-mixer";

const GLB_SCALAR_DRIVE_NODE_IDS = new Set<string>([
  "number-constant",
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
  if (n.data.nodeId === "number-constant") {
    return typeof n.data.liveValue === "number" && Number.isFinite(n.data.liveValue)
      ? n.data.liveValue
      : coerceNumberConstantValue(rawCfg, rawCfg.value);
  }
  return readGlbPartVisibilityScalar(rawCfg);
}

/**
 * Aggregate GLB scalar drive nodes linked to `sourceModelNodeId` into maps the model viewer
 * preview can apply (morph, light, animation, part visibility, material emissive, embedded camera).
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
  materials: Record<string, number>;
  cameras: Record<string, number>;
} {
  const morphs: Record<string, number> = {};
  const lights: Record<string, number> = {};
  const anims: Record<string, number> = {};
  const parts: Record<string, number> = {};
  const materials: Record<string, number> = {};
  const cameras: Record<string, number> = {};

  if (sourceModelNodeId.trim().length === 0) {
    return { morphs, lights, anims, parts, materials, cameras };
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
      case "material":
        materials[tag.ref] = v;
        break;
      case "camera":
        cameras[tag.ref] = v;
        break;
      default:
        break;
    }
  }

  return { morphs, lights, anims, parts, materials, cameras };
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
