import { useEffect } from "react";
import { evaluateDashboardSnapshot } from "../../core/dashboard/evaluate-dashboard-snapshot";
import {
  graphHasDashboardOutputNode,
  readDashboardStructuralRevision,
} from "../../core/dashboard/dashboard-structural-revision";
import { useDashboardSceneStore } from "../../state/dashboard-scene.store";
import { mergeFlowGraphNodesWithLive } from "../editor/store/flow-node-live.store";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";

/**
 * Rebuilds the committed dashboard layout snapshot when graph structure changes —
 * not on every simulation tick (live values use {@link useDashboardWidgetLive}).
 */
export function useDashboardStructuralSnapshot(): void {
  const dashboardStructuralRevision = useFlowEditorStore((s) =>
    readDashboardStructuralRevision(s.nodes, s.edges),
  );

  useEffect(() => {
    const state = useFlowEditorStore.getState();
    if (!graphHasDashboardOutputNode(state.nodes)) {
      useDashboardSceneStore.getState().resetSnapshot();
      return;
    }
    const nodes = mergeFlowGraphNodesWithLive(state.nodes);
    const snapshot = evaluateDashboardSnapshot({
      nodes,
      edges: state.edges,
    });
    useDashboardSceneStore.getState().setSnapshot(snapshot);
  }, [dashboardStructuralRevision]);
}
