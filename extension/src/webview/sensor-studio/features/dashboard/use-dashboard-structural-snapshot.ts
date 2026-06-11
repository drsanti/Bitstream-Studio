import { useEffect } from "react";
import { evaluateDashboardSnapshot } from "../../core/dashboard/evaluate-dashboard-snapshot";
import {
  graphHasDashboardOutputNode,
  readDashboardStructuralRevision,
} from "../../core/dashboard/dashboard-structural-revision";
import {
  resolveEvaluationGraph,
  resolveRootGraphBuffer,
} from "../editor/subgraphs/studio-subgraph-store-sync";
import { useDashboardSceneStore } from "../../state/dashboard-scene.store";
import { mergeFlowGraphNodesWithLive } from "../editor/store/flow-node-live.store";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";

/**
 * Rebuilds the committed dashboard layout snapshot when root-graph dashboard structure
 * changes — not on every simulation tick (live values use {@link useDashboardWidgetLive}).
 */
export function useDashboardStructuralSnapshot(): void {
  const dashboardStructuralRevision = useFlowEditorStore((s) => {
    const graph = resolveEvaluationGraph(s);
    return readDashboardStructuralRevision(graph.nodes, graph.edges);
  });

  useEffect(() => {
    const state = useFlowEditorStore.getState();
    const { rootNodes } = resolveRootGraphBuffer(state);
    if (!graphHasDashboardOutputNode(rootNodes)) {
      useDashboardSceneStore.getState().resetSnapshot();
      return;
    }
    const graph = resolveEvaluationGraph(state);
    const snapshot = evaluateDashboardSnapshot({
      nodes: mergeFlowGraphNodesWithLive(graph.nodes),
      edges: graph.edges,
    });
    useDashboardSceneStore.getState().setSnapshot(snapshot);
  }, [dashboardStructuralRevision]);
}
