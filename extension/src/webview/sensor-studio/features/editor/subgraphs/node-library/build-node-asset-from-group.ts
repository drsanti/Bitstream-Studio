import type { Edge, Node } from "@xyflow/react";
import type { StudioNodeGroupData, StudioSubgraphDocument } from "../studio-subgraph.types";
import { isStudioNodeGroupNode } from "../studio-subgraph.types";
import {
  collectTransitiveSubgraphKeys,
  nodesInSubgraphKeys,
  pickSubgraphs,
} from "./collect-transitive-subgraphs";
import {
  createStudioNodeAssetMeta,
  STUDIO_NODE_ASSET_MARKER,
  STUDIO_NODE_ASSET_VERSION,
  type StudioNodeAssetFile,
  type StudioNodeAssetMeta,
} from "./studio-node-asset-file";

function cloneNodeForAsset(node: Node): Node {
  const { selected: _selected, dragging: _dragging, ...rest } = node;
  return {
    ...rest,
    selected: false,
    data: structuredClone(rest.data),
  };
}

export function scanStudioGraphDependencies(nodes: readonly Node[]): StudioNodeAssetFile["dependencies"] {
  const modelUrls = new Set<string>();
  const dataChannels = new Set<string>();

  for (const node of nodes) {
    if (node.type !== "studio") {
      continue;
    }
    const data = node.data as { nodeId?: string; defaultConfig?: Record<string, unknown> };
    const cfg = data.defaultConfig ?? {};
    const modelUrl = cfg.selectedModelUrl;
    if (typeof modelUrl === "string" && modelUrl.trim().length > 0) {
      modelUrls.add(modelUrl.trim());
    }
    if (data.nodeId === "sensor-input") {
      const sourceKey = cfg.sourceKey;
      if (typeof sourceKey === "string" && sourceKey.trim().length > 0) {
        dataChannels.add(sourceKey.trim());
      }
    }
  }

  return {
    modelUrls: [...modelUrls],
    dataChannels: [...dataChannels],
    hdriPresets: [],
  };
}

export function buildStudioNodeAssetFromGroup(
  hostNodeId: string,
  parentNodes: readonly Node[],
  _parentEdges: readonly Edge[],
  subgraphs: Record<string, StudioSubgraphDocument>,
  metaPatch?: Partial<StudioNodeAssetMeta>,
): StudioNodeAssetFile | null {
  const host = parentNodes.find((n) => n.id === hostNodeId && isStudioNodeGroupNode(n));
  if (host == null) {
    return null;
  }

  const data = host.data as StudioNodeGroupData;
  const rootSubgraphId = data.subgraphId ?? host.id;
  const keys = collectTransitiveSubgraphKeys(subgraphs, [rootSubgraphId]);
  const exportedSubgraphs = pickSubgraphs(subgraphs, keys);
  const innerNodes = nodesInSubgraphKeys(exportedSubgraphs, keys);
  const dependencies = scanStudioGraphDependencies([cloneNodeForAsset(host), ...innerNodes]);

  const title =
    typeof data.graphTitle === "string" && data.graphTitle.trim().length > 0
      ? data.graphTitle.trim()
      : exportedSubgraphs[rootSubgraphId]?.graphTitle?.trim() || "Node Group";

  const meta = createStudioNodeAssetMeta(metaPatch?.name ?? title, {
    ...metaPatch,
    name: metaPatch?.name ?? title,
  });

  return {
    marker: STUDIO_NODE_ASSET_MARKER,
    version: STUDIO_NODE_ASSET_VERSION,
    meta,
    nodes: [cloneNodeForAsset(host)],
    edges: [],
    subgraphs: exportedSubgraphs,
    dependencies,
  };
}
