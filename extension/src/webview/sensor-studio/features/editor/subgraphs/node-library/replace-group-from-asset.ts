import type { StudioSubgraphDocument } from "../studio-subgraph.types";
import { isStudioNodeGroupNode, type StudioNodeGroupData } from "../studio-subgraph.types";
import { cloneStudioSubgraphDeep } from "../clone-studio-subgraph";
import type { StudioNodeAssetFile } from "./studio-node-asset-file";

/**
 * Replace the inner graph of an existing node group host (keeps host id / position on parent).
 * Linked copies that share `hostSubgraphKey` all see the new inner graph.
 */
export function replaceStudioNodeGroupFromAsset(
  hostSubgraphKey: string,
  asset: StudioNodeAssetFile,
  existingSubgraphs: Record<string, StudioSubgraphDocument>,
): Record<string, StudioSubgraphDocument> | null {
  const importedHost = asset.nodes.find((n) => isStudioNodeGroupNode(n));
  if (importedHost == null) {
    return null;
  }

  const importedData = importedHost.data as StudioNodeGroupData;
  const sourceSubgraphKey = importedData.subgraphId ?? importedHost.id;

  const pool: Record<string, StudioSubgraphDocument> = {
    ...existingSubgraphs,
    ...structuredClone(asset.subgraphs),
  };

  if (pool[sourceSubgraphKey] == null) {
    return null;
  }

  const next = cloneStudioSubgraphDeep(pool, sourceSubgraphKey, hostSubgraphKey);
  const cloned = next[hostSubgraphKey];
  if (cloned == null) {
    return null;
  }
  return {
    ...next,
    [hostSubgraphKey]: {
      ...cloned,
      graphTitle: asset.meta.name.trim() || cloned.graphTitle,
    },
  };
}
