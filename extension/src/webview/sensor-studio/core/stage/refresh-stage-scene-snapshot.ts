import type { StudioAssetDescriptor } from "../../features/asset-browser/studio-asset.types";
import { mergeFlowGraphNodesWithLive } from "../../features/editor/store/flow-node-live.store";
import { useFlowEditorStore } from "../../features/editor/store/flow-editor.store";
import {
  resolveEvaluationGraph,
  type StudioSubgraphStoreSlice,
} from "../../features/editor/subgraphs/studio-subgraph-store-sync";
import { useStageSceneStore } from "../../state/stage-scene.store";
import {
  evaluateStageSceneSnapshot,
  graphHasSceneOutputNodeInDocument,
} from "./evaluate-stage-scene-snapshot";

type FlowStateForStageSnapshot = StudioSubgraphStoreSlice & {
  studioAssetDescriptors?: readonly StudioAssetDescriptor[];
};

/** Rebuild committed Stage snapshot from the current flow document (structural + merged live slices). */
export function refreshStageSceneSnapshotFromFlowState(state: FlowStateForStageSnapshot): void {
  if (
    !graphHasSceneOutputNodeInDocument({
      nodes: state.nodes,
      rootNodes: state.rootNodes,
      subgraphs: state.subgraphs,
    })
  ) {
    useStageSceneStore.getState().resetSnapshot();
    return;
  }
  const graph = resolveEvaluationGraph(state);
  const catalog =
    state.studioAssetDescriptors ?? useFlowEditorStore.getState().studioAssetDescriptors;
  const snapshot = evaluateStageSceneSnapshot({
    nodes: mergeFlowGraphNodesWithLive(graph.nodes),
    edges: graph.edges,
    catalog,
  });
  useStageSceneStore.getState().setSnapshot(snapshot);
}
