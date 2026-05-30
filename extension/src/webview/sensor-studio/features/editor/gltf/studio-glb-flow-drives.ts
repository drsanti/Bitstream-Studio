import { coerceNumberConstantValue } from "../nodes/constants/number-constant-helpers";
import { readGlbExtractTag, readSourceModelNodeId } from "../model/model-generated-bindings";
import type { StudioGltfExtractKind } from "./studio-gltf-extract";

type FlowNodeLike = {
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
    liveValue?: unknown;
  };
};

const GLB_SCALAR_DRIVE_KINDS = new Set<StudioGltfExtractKind>([
  "morph",
  "light",
  "animation",
  "part",
  "material",
  "camera",
]);

/**
 * Aggregate **number-constant** GLB placeholders linked to `sourceModelNodeId` into maps the
 * model viewer preview can apply (morph, light, animation, part visibility, material emissive,
 * embedded camera).
 */
export function collectGlbScalarDrivesForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
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
    if (n.data.nodeId !== "number-constant") {
      continue;
    }
    const pid = readSourceModelNodeId(n.data.defaultConfig);
    if (pid !== sourceModelNodeId) {
      continue;
    }
    const tag = readGlbExtractTag(n.data.defaultConfig);
    if (tag == null || !GLB_SCALAR_DRIVE_KINDS.has(tag.kind)) {
      continue;
    }

    const rawCfg = n.data.defaultConfig;
    const v =
      typeof n.data.liveValue === "number" && Number.isFinite(n.data.liveValue)
        ? n.data.liveValue
        : coerceNumberConstantValue(rawCfg, rawCfg.value);

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
