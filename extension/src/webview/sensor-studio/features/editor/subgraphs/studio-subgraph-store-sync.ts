import type { Edge, Node } from "@xyflow/react";
import type { FlowGraphNode } from "../store/flow-editor.store";
import { flattenFlowGraphForEvaluation } from "./flatten-flow-graph-for-evaluation";
import {
  STUDIO_ROOT_GRAPH_ID,
  type StudioGraphId,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

export type StudioSubgraphStoreSlice = {
  nodes: FlowGraphNode[];
  edges: Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  activeGraphId: StudioGraphId;
  graphStack: StudioGraphId[];
  rootNodes: FlowGraphNode[];
  rootEdges: Edge[];
};

export function initialSubgraphStoreSlice(): Pick<
  StudioSubgraphStoreSlice,
  "subgraphs" | "activeGraphId" | "graphStack" | "rootNodes" | "rootEdges"
> {
  return {
    subgraphs: {},
    activeGraphId: STUDIO_ROOT_GRAPH_ID,
    graphStack: [],
    rootNodes: [],
    rootEdges: [],
  };
}

/** Persist the active edit buffer into root or the current subgraph document. */
export function persistActiveGraphBuffer(state: StudioSubgraphStoreSlice): StudioSubgraphStoreSlice {
  if (state.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    return {
      ...state,
      rootNodes: state.nodes,
      rootEdges: state.edges,
    };
  }
  const current = state.subgraphs[state.activeGraphId];
  if (current == null) {
    return state;
  }
  return {
    ...state,
    subgraphs: {
      ...state.subgraphs,
      [state.activeGraphId]: {
        ...current,
        nodes: state.nodes as Node[],
        edges: state.edges,
      },
    },
  };
}

export function commitActiveGraphMutation(
  state: StudioSubgraphStoreSlice,
  nodes: FlowGraphNode[],
  edges: Edge[],
): StudioSubgraphStoreSlice {
  const next = { ...state, nodes, edges };
  if (state.activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    return { ...next, rootNodes: nodes, rootEdges: edges };
  }
  const current = state.subgraphs[state.activeGraphId];
  if (current == null) {
    return next;
  }
  return {
    ...next,
    subgraphs: {
      ...state.subgraphs,
      [state.activeGraphId]: {
        ...current,
        nodes: nodes as Node[],
        edges,
      },
    },
  };
}

export function resolveEvaluationGraph(state: StudioSubgraphStoreSlice): {
  nodes: FlowGraphNode[];
  edges: Edge[];
} {
  const rootNodes =
    state.activeGraphId === STUDIO_ROOT_GRAPH_ID ? state.nodes : state.rootNodes;
  const rootEdges =
    state.activeGraphId === STUDIO_ROOT_GRAPH_ID ? state.edges : state.rootEdges;
  if (Object.keys(state.subgraphs).length === 0) {
    return { nodes: rootNodes, edges: rootEdges };
  }
  return flattenFlowGraphForEvaluation(rootNodes as Node[], rootEdges, state.subgraphs) as {
    nodes: FlowGraphNode[];
    edges: Edge[];
  };
}
