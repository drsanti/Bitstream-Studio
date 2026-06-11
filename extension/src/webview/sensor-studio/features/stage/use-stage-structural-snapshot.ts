import { useEffect } from "react";
import { refreshStageSceneSnapshotFromFlowState } from "../../core/stage/refresh-stage-scene-snapshot";
import { readStageStructuralRevision } from "../../core/stage/stage-structural-revision";
import { resolveEvaluationGraph } from "../editor/subgraphs/studio-subgraph-store-sync";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";

/**
 * Rebuilds the committed Stage scene snapshot when root-graph Stage structure
 * changes — not only on simulation ticks (which may be paused during flow edit).
 */
export function useStageStructuralSnapshot(): void {
  const stageStructuralRevision = useFlowEditorStore((s) => {
    const graph = resolveEvaluationGraph(s);
    return readStageStructuralRevision(graph.nodes, graph.edges);
  });

  useEffect(() => {
    refreshStageSceneSnapshotFromFlowState(useFlowEditorStore.getState());
  }, [stageStructuralRevision]);
}
