import { useMemo } from "react";
import { useFlowEditorStore } from "../../features/editor/store/flow-editor.store";
import { resolveEvaluationGraph } from "../../features/editor/subgraphs/studio-subgraph-store-sync";

/** Flattened root + subgraph graph for Stage media / vision helpers while editing nested groups. */
export function useStageFlowEvaluationGraph() {
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const rootNodes = useFlowEditorStore((s) => s.rootNodes);
  const rootEdges = useFlowEditorStore((s) => s.rootEdges);
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);

  return useMemo(
    () =>
      resolveEvaluationGraph({
        nodes,
        edges,
        rootNodes,
        rootEdges,
        subgraphs,
        activeGraphId,
        graphStack: [],
      }),
    [activeGraphId, edges, nodes, rootEdges, rootNodes, subgraphs],
  );
}
