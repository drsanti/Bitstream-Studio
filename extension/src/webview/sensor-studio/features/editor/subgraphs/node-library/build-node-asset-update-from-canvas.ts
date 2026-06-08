import type { Edge, Node } from "@xyflow/react";
import type { StudioSubgraphDocument } from "../studio-subgraph.types";
import { buildStudioNodeAssetFromGroup } from "./build-node-asset-from-group";
import type { StudioNodeAssetFile } from "./studio-node-asset-file";

export function buildNodeAssetUpdateFromCanvas(args: {
  existing: StudioNodeAssetFile;
  hostNodeId: string;
  parentNodes: readonly Node[];
  parentEdges: readonly Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
}): StudioNodeAssetFile | null {
  const { existing, hostNodeId, parentNodes, parentEdges, subgraphs } = args;
  const rebuilt = buildStudioNodeAssetFromGroup(
    hostNodeId,
    parentNodes,
    parentEdges,
    subgraphs,
    {
      id: existing.meta.id,
      name: existing.meta.name,
      description: existing.meta.description,
      tags: existing.meta.tags,
      category: existing.meta.category,
      createdAt: existing.meta.createdAt,
      sourceNodeId: existing.meta.sourceNodeId ?? hostNodeId,
      presetKind: existing.meta.presetKind ?? "nodeGraph",
    },
  );
  if (rebuilt == null) {
    return null;
  }
  return {
    ...rebuilt,
    meta: {
      ...rebuilt.meta,
      id: existing.meta.id,
      createdAt: existing.meta.createdAt,
      updatedAt: new Date().toISOString(),
    },
  };
}
