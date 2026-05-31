import { extractStudioGltfComponents } from "./studio-gltf-extract";
import {
  readGlbExtractTag,
  resolveNodeStudioModelScopeNodeId,
  resolveStudioSourceModelGlbUrl,
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
  type StudioFlowEdgeLike,
} from "../model/model-generated-bindings";

type FlowNodeLike = {
  id: string;
  data: { nodeId: string; defaultConfig: Record<string, unknown> };
};

/**
 * When a **Trigger GLB Anim** node has no clip binding but its scoped GLB exposes exactly one
 * animation, persist that clip so event pulses can drive the Model viewer without opening the inspector.
 */
export async function resolveSingleClipAutoBindPatchesForGlbAnimNodes(args: {
  nodes: readonly FlowNodeLike[];
  edges: readonly StudioFlowEdgeLike[];
  targetFlowNodeIds: readonly string[];
}): Promise<Map<string, Record<string, unknown>>> {
  const patches = new Map<string, Record<string, unknown>>();
  const urlCache = new Map<string, string | null>();

  for (const targetId of args.targetFlowNodeIds) {
    const node = args.nodes.find((n) => n.id === targetId);
    if (node == null || node.data.nodeId !== "event-trigger-glb-anim") {
      continue;
    }
    const dc = node.data.defaultConfig;
    if (readGlbExtractTag(dc)?.kind === "animation") {
      continue;
    }
    const modelFlowId = resolveNodeStudioModelScopeNodeId(node, args.nodes, args.edges);
    if (modelFlowId.trim().length === 0) {
      continue;
    }
    let glbUrl = urlCache.get(modelFlowId);
    if (glbUrl === undefined) {
      glbUrl = resolveStudioSourceModelGlbUrl(args.nodes, modelFlowId);
      urlCache.set(modelFlowId, glbUrl);
    }
    if (glbUrl == null || glbUrl.trim().length === 0) {
      continue;
    }
    try {
      const extraction = await extractStudioGltfComponents(glbUrl.trim());
      if (extraction.animations.length !== 1) {
        continue;
      }
      const ref = extraction.animations[0]!.ref.trim();
      if (ref.length === 0) {
        continue;
      }
      patches.set(node.id, {
        [STUDIO_GLB_EXTRACT_KIND_KEY]: "animation",
        [STUDIO_GLB_EXTRACT_REF_KEY]: ref,
        [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
      });
    } catch {
      // GLB fetch/parse failed — leave unbound.
    }
  }

  return patches;
}
