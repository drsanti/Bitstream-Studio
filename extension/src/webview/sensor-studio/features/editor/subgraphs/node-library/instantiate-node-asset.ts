import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../store/flow-editor.store";
import {
  buildFlowClipboardPayload,
  remapFlowPaste,
  type FlowClipboardPayload,
} from "../../clipboard/flow-clipboard";
import { attachSubgraphsForPastedNodeGroups } from "../paste-subgraph-groups";
import type { StudioNodeGroupData, StudioSubgraphDocument } from "../studio-subgraph.types";
import type { StudioNodeAssetFile } from "./studio-node-asset-file";

export type InstantiateStudioNodeAssetResult = {
  nodes: FlowGraphNode[];
  edges: Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
};

function assetToClipboardPayload(asset: StudioNodeAssetFile): FlowClipboardPayload {
  return buildFlowClipboardPayload(
    asset.nodes as FlowGraphNode[],
    asset.edges,
    asset.subgraphs,
  );
}

/**
 * Deep-copy a library asset onto the graph at `position` (flow coords).
 */
export function instantiateStudioNodeAsset(
  asset: StudioNodeAssetFile,
  position: { x: number; y: number },
  existingSubgraphs: Record<string, StudioSubgraphDocument>,
): InstantiateStudioNodeAssetResult {
  const payload = assetToClipboardPayload(asset);
  const host = payload.nodes[0];
  const origin = host?.position ?? { x: 0, y: 0 };
  const offset = {
    x: position.x - origin.x,
    y: position.y - origin.y,
  };

  let mergedSubgraphs = { ...existingSubgraphs, ...(payload.subgraphs ?? {}) };

  const { nodes: remappedNodes, edges, idMap } = remapFlowPaste(payload, offset);
  const { nodes, subgraphs } = attachSubgraphsForPastedNodeGroups(
    remappedNodes.map((n) => ({ ...n, selected: true })),
    mergedSubgraphs,
    payload.subgraphs,
    idMap,
  );

  const taggedNodes = nodes.map((node) => {
    if (node.type !== "studio-node-group") {
      return node;
    }
    return {
      ...node,
      data: {
        ...(node.data as StudioNodeGroupData),
        libraryAssetId: asset.meta.id,
      },
    };
  });

  return { nodes: taggedNodes, edges, subgraphs };
}
