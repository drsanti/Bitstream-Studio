import type { StudioAssetDescriptor } from "../../asset-browser/studio-asset.types";
import { resolveStudioModelSelectGltfFetchUrl } from "../../asset-browser/studio-model-scene-bindings";
import { ANIMATION_CLIP_NAME_KEY, readAnimationClipName } from "../nodes/animation/animation-clip-config";
import { extractStudioGltfComponents } from "./studio-gltf-extract";
import {
  readGlbExtractTag,
  resolveNodeStudioModelScopeNodeId,
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
  type StudioFlowEdgeLike,
} from "../model/model-generated-bindings";

type FlowNodeLike = {
  id: string;
  data: { nodeId: string; defaultConfig: Record<string, unknown> };
};

function buildAnimationClipPatch(ref: string, modelFlowId: string): Record<string, unknown> {
  return {
    [STUDIO_GLB_EXTRACT_KIND_KEY]: "animation",
    [STUDIO_GLB_EXTRACT_REF_KEY]: ref,
    [ANIMATION_CLIP_NAME_KEY]: ref,
    [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
  };
}

function isUnboundGlbAnimTarget(node: FlowNodeLike): boolean {
  if (node.data.nodeId === "event-trigger-glb-anim") {
    return readGlbExtractTag(node.data.defaultConfig)?.kind !== "animation";
  }
  if (node.data.nodeId === "animation-clip") {
    return readAnimationClipName(node.data.defaultConfig).length === 0;
  }
  return false;
}

/**
 * Auto-bind GLB animation refs on **Trigger GLB Anim** and **Animation Clip** nodes when the
 * scoped model exposes known clips (single clip for triggers; sequential assignment for clip nodes).
 */
export async function resolveSingleClipAutoBindPatchesForGlbAnimNodes(args: {
  nodes: readonly FlowNodeLike[];
  edges: readonly StudioFlowEdgeLike[];
  targetFlowNodeIds: readonly string[];
  catalog: readonly StudioAssetDescriptor[];
}): Promise<Map<string, Record<string, unknown>>> {
  const patches = new Map<string, Record<string, unknown>>();
  const urlCache = new Map<string, string | null>();

  const clipNodesByModel = new Map<string, string[]>();
  for (const targetId of args.targetFlowNodeIds) {
    const node = args.nodes.find((n) => n.id === targetId);
    if (node == null || !isUnboundGlbAnimTarget(node)) {
      continue;
    }
    const modelFlowId = resolveNodeStudioModelScopeNodeId(node, args.nodes, args.edges);
    if (modelFlowId.trim().length === 0) {
      continue;
    }
    if (node.data.nodeId === "animation-clip") {
      const list = clipNodesByModel.get(modelFlowId) ?? [];
      list.push(node.id);
      clipNodesByModel.set(modelFlowId, list);
      continue;
    }
    let glbUrl = urlCache.get(modelFlowId);
    if (glbUrl === undefined) {
      glbUrl = resolveStudioModelSelectGltfFetchUrl(args.nodes, modelFlowId, args.catalog);
      urlCache.set(modelFlowId, glbUrl);
    }
    if (glbUrl == null || glbUrl.trim().length === 0) {
      continue;
    }
    try {
      const extraction = await extractStudioGltfComponents(glbUrl);
      if (extraction.animations.length !== 1) {
        continue;
      }
      const ref = extraction.animations[0]!.ref.trim();
      if (ref.length === 0) {
        continue;
      }
      patches.set(node.id, buildAnimationClipPatch(ref, modelFlowId));
    } catch {
      // GLB fetch/parse failed — leave unbound.
    }
  }

  for (const [modelFlowId, nodeIds] of clipNodesByModel) {
    if (nodeIds.length === 0) {
      continue;
    }
    let glbUrl = urlCache.get(modelFlowId);
    if (glbUrl === undefined) {
      glbUrl = resolveStudioModelSelectGltfFetchUrl(args.nodes, modelFlowId, args.catalog);
      urlCache.set(modelFlowId, glbUrl);
    }
    if (glbUrl == null || glbUrl.trim().length === 0) {
      continue;
    }
    try {
      const extraction = await extractStudioGltfComponents(glbUrl);
      const refs = extraction.animations
        .map((row) => row.ref.trim())
        .filter((ref) => ref.length > 0);
      if (refs.length === 0) {
        continue;
      }
      nodeIds.forEach((nodeId, index) => {
        const ref = refs[Math.min(index, refs.length - 1)]!;
        patches.set(nodeId, buildAnimationClipPatch(ref, modelFlowId));
      });
    } catch {
      // GLB fetch/parse failed — leave unbound.
    }
  }

  return patches;
}
