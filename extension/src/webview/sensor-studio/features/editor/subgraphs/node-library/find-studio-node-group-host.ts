import type { Edge, Node } from "@xyflow/react";
import type { FlowGraphNode } from "../../store/flow-editor.store";
import {
  isStudioNodeGroupNode,
  STUDIO_ROOT_GRAPH_ID,
  type StudioGraphId,
  type StudioSubgraphDocument,
} from "../studio-subgraph.types";

export type StudioNodeGroupHostContext = {
  host: FlowGraphNode;
  parentNodes: FlowGraphNode[];
  parentEdges: Edge[];
};

/**
 * Locate a `studio-node-group` host and the parent graph buffer that contains it.
 * Searches the root graph first, then the active subgraph when drilled in.
 */
export function findStudioNodeGroupHost(
  hostNodeId: string,
  args: {
    rootNodes: readonly FlowGraphNode[];
    rootEdges: readonly Edge[];
    nodes: readonly FlowGraphNode[];
    edges: readonly Edge[];
    activeGraphId: StudioGraphId;
    subgraphs: Record<string, StudioSubgraphDocument>;
  },
): StudioNodeGroupHostContext | null {
  const rootHost = args.rootNodes.find((n) => n.id === hostNodeId);
  if (rootHost != null && isStudioNodeGroupNode(rootHost)) {
    return {
      host: rootHost,
      parentNodes: [...args.rootNodes],
      parentEdges: [...args.rootEdges],
    };
  }

  if (args.activeGraphId !== STUDIO_ROOT_GRAPH_ID) {
    const activeHost = args.nodes.find((n) => n.id === hostNodeId);
    if (activeHost != null && isStudioNodeGroupNode(activeHost)) {
      return {
        host: activeHost,
        parentNodes: [...args.nodes],
        parentEdges: [...args.edges],
      };
    }
  }

  for (const doc of Object.values(args.subgraphs)) {
    const nestedHost = doc.nodes.find((n) => n.id === hostNodeId);
    if (nestedHost != null && isStudioNodeGroupNode(nestedHost as Node)) {
      return {
        host: nestedHost as FlowGraphNode,
        parentNodes: doc.nodes as FlowGraphNode[],
        parentEdges: [...doc.edges],
      };
    }
  }

  return null;
}
