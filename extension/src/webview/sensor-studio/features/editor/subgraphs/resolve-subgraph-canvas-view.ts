import type { Edge } from "@xyflow/react";
import { applyStudioGroupBoundaryNodeChrome } from "../layout-nodes/studio-group-boundary-node-chrome";
import type { FlowGraphNode } from "../store/flow-editor.store";
import {
  STUDIO_ROOT_GRAPH_ID,
  type StudioGraphId,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

export type ResolvedSubgraphCanvasView = {
  activeGraphId: StudioGraphId;
  graphStack: StudioGraphId[];
  nodes: FlowGraphNode[];
  edges: Edge[];
};

function normalizeGraphStack(
  graphStack: readonly StudioGraphId[],
  activeGraphId: StudioGraphId,
): StudioGraphId[] {
  if (activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    return [];
  }
  const stackIndex = graphStack.indexOf(activeGraphId);
  if (stackIndex >= 0) {
    const sliced = graphStack.slice(0, stackIndex + 1);
    return sliced[0] === STUDIO_ROOT_GRAPH_ID
      ? sliced
      : [STUDIO_ROOT_GRAPH_ID, ...sliced.filter((id) => id !== STUDIO_ROOT_GRAPH_ID)];
  }
  return [STUDIO_ROOT_GRAPH_ID, activeGraphId];
}

/** Browser bootstrap / localStorage hydrate — always open the root graph. */
export function resolveRootCanvasViewOnHydrate(args: {
  rootNodes: FlowGraphNode[];
  rootEdges: Edge[];
  /** Top-level document nodes/edges when the root buffer lost wires (stale `rootEdges: []`). */
  canonicalNodes?: FlowGraphNode[];
  canonicalEdges?: Edge[];
}): ResolvedSubgraphCanvasView {
  const nodes =
    args.rootNodes.length > 0
      ? args.rootNodes
      : (args.canonicalNodes ?? args.rootNodes);
  const edges =
    args.rootEdges.length > 0
      ? args.rootEdges
      : (args.canonicalEdges ?? args.rootEdges);
  return {
    activeGraphId: STUDIO_ROOT_GRAPH_ID,
    graphStack: [],
    nodes,
    edges,
  };
}

/** Import / explicit drill restore — load subgraph canvas when navigation is valid. */
export function resolveSubgraphCanvasViewOnRestore(args: {
  rootNodes: FlowGraphNode[];
  rootEdges: Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  activeGraphId: StudioGraphId;
  graphStack: readonly StudioGraphId[];
}): ResolvedSubgraphCanvasView {
  const { rootNodes, rootEdges, subgraphs, activeGraphId, graphStack } = args;
  if (activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    return resolveRootCanvasViewOnHydrate({ rootNodes, rootEdges });
  }
  const sub = subgraphs[activeGraphId];
  if (sub == null) {
    return resolveRootCanvasViewOnHydrate({ rootNodes, rootEdges });
  }
  return {
    activeGraphId,
    graphStack: normalizeGraphStack(graphStack, activeGraphId),
    nodes: (sub.nodes as FlowGraphNode[]).map((node) =>
      applyStudioGroupBoundaryNodeChrome(node),
    ),
    edges: sub.edges,
  };
}
