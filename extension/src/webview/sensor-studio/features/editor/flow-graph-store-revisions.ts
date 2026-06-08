import type { Edge, Node } from "@xyflow/react";
import { useFlowNodeLiveStore } from "./store/flow-node-live.store";
import {
  readFlowEdgesStructuralKey,
  readFlowGraphStructuralKey,
} from "./flow-react-flow-node-sync";

/** Graph shell + edges — ignores simulation `data.live*` churn. */
export function readFlowGraphStoreStructuralRevision(
  nodes: readonly Node[],
  edges: readonly Edge[],
): string {
  return `${readFlowGraphStructuralKey(nodes)}\n${readFlowEdgesStructuralKey(edges)}`;
}

/** Socket toolbar + collapse UI — ignores live telemetry fields. */
export function readFlowGraphSocketToolbarRevision(nodes: readonly Node[]): string {
  return nodes
    .map((node) => {
      if (node.type !== "studio") {
        return `${node.id}:${node.type ?? ""}`;
      }
      const data = node.data as Record<string, unknown>;
      const ui = data?.ui as Record<string, unknown> | undefined;
      return [
        node.id,
        typeof data?.nodeId === "string" ? data.nodeId : "",
        String(ui?.socketsExpanded ?? ""),
        String(ui?.socketValuesVisible ?? ""),
        String(ui?.bodyControlsVisible ?? ""),
        String(ui?.allowBodyCollapse ?? ""),
      ].join(":");
    })
    .sort()
    .join("|");
}

/** Live readout revision for the current flow selection only. */
export function readSelectedNodesLiveRevision(args: {
  selectedNodeIds: readonly string[];
  selectedNodeId: string | null;
  liveByNodeId?: Readonly<Record<string, { liveValue?: unknown; liveHistory?: readonly number[] }>>;
}): string {
  const ids =
    args.selectedNodeIds.length > 0
      ? args.selectedNodeIds
      : args.selectedNodeId != null
        ? [args.selectedNodeId]
        : [];
  if (ids.length === 0) {
    return "";
  }
  const liveByNodeId = args.liveByNodeId ?? useFlowNodeLiveStore.getState().byNodeId;
  return ids
    .map((id) => {
      const slice = liveByNodeId[id];
      const liveValue = slice?.liveValue;
      const hist = slice?.liveHistory;
      const histTail = hist != null && hist.length > 0 ? hist[hist.length - 1] : "";
      return `${id}:${String(liveValue)}:${String(histTail)}`;
    })
    .join("|");
}

/** Inspector store reads — structure + selection live values only. */
export function readFlowGraphInspectorStoreRevision(args: {
  nodes: readonly Node[];
  edges: readonly Edge[];
  selectedNodeIds: readonly string[];
  selectedNodeId: string | null;
}): string {
  return [
    readFlowGraphStoreStructuralRevision(args.nodes, args.edges),
    readSelectedNodesLiveRevision({
      selectedNodeIds: args.selectedNodeIds,
      selectedNodeId: args.selectedNodeId,
    }),
  ].join("\n");
}
