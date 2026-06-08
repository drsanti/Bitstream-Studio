import type { StudioAssetDescriptor } from "../../asset-browser/studio-asset.types";
import { resolveStudioModelGltfFetchUrl } from "../../asset-browser/studio-model-scene-bindings";
import { readPartSpinPath } from "../nodes/scene/part-spin-config";
import { extractStudioGltfComponents } from "./studio-gltf-extract";
import {
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

function resolveModelSelectFetchUrl(
  nodes: readonly FlowNodeLike[],
  modelFlowId: string,
  catalog: readonly StudioAssetDescriptor[],
): string | null {
  const logical = resolveStudioSourceModelGlbUrl(nodes, modelFlowId);
  if (logical == null || logical.trim().length === 0) {
    return null;
  }
  const n = nodes.find((x) => x.id === modelFlowId);
  const dc = n?.data.defaultConfig;
  const studioAssetId =
    dc != null && typeof dc.selectedStudioAssetId === "string"
      ? dc.selectedStudioAssetId.trim()
      : undefined;
  const fetchUrl = resolveStudioModelGltfFetchUrl(
    { url: logical.trim(), studioAssetId },
    catalog,
    "",
  );
  return fetchUrl.length > 0 ? fetchUrl : null;
}

function buildPartSpinPatch(ref: string, modelFlowId: string): Record<string, unknown> {
  return {
    [STUDIO_GLB_EXTRACT_KIND_KEY]: "part",
    [STUDIO_GLB_EXTRACT_REF_KEY]: ref,
    [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelFlowId,
  };
}

function isUnboundPartSpinNode(node: FlowNodeLike): boolean {
  if (node.data.nodeId !== "part-spin") {
    return false;
  }
  return readPartSpinPath(node.data.defaultConfig).length === 0;
}

/**
 * Auto-bind GLB part refs on **Part Spin** nodes when the scoped model exposes parts.
 */
export async function resolvePartSpinAutoBindPatches(args: {
  nodes: readonly FlowNodeLike[];
  edges: readonly StudioFlowEdgeLike[];
  targetFlowNodeIds: readonly string[];
  catalog: readonly StudioAssetDescriptor[];
}): Promise<Map<string, Record<string, unknown>>> {
  const patches = new Map<string, Record<string, unknown>>();
  const spinNodesByModel = new Map<string, string[]>();
  const urlCache = new Map<string, string | null>();

  for (const targetId of args.targetFlowNodeIds) {
    const node = args.nodes.find((n) => n.id === targetId);
    if (node == null || !isUnboundPartSpinNode(node)) {
      continue;
    }
    const modelFlowId = resolveNodeStudioModelScopeNodeId(node, args.nodes, args.edges);
    if (modelFlowId.trim().length === 0) {
      continue;
    }
    const list = spinNodesByModel.get(modelFlowId) ?? [];
    list.push(node.id);
    spinNodesByModel.set(modelFlowId, list);
  }

  for (const [modelFlowId, nodeIds] of spinNodesByModel) {
    if (nodeIds.length === 0) {
      continue;
    }
    let glbUrl = urlCache.get(modelFlowId);
    if (glbUrl === undefined) {
      glbUrl = resolveModelSelectFetchUrl(args.nodes, modelFlowId, args.catalog);
      urlCache.set(modelFlowId, glbUrl);
    }
    if (glbUrl == null || glbUrl.trim().length === 0) {
      continue;
    }
    try {
      const extraction = await extractStudioGltfComponents(glbUrl);
      const refs = extraction.parts
        .map((row) => row.ref.trim())
        .filter((ref) => ref.length > 0);
      if (refs.length === 0) {
        continue;
      }
      nodeIds.forEach((nodeId, index) => {
        const ref = refs[Math.min(index, refs.length - 1)]!;
        patches.set(nodeId, buildPartSpinPatch(ref, modelFlowId));
      });
    } catch {
      // GLB fetch/parse failed — leave unbound.
    }
  }

  return patches;
}
