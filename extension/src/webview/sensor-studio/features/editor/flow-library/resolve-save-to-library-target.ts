import type { FlowGraphNode } from "../store/flow-editor.store";
import { isStudioNodeGroupNode } from "../subgraphs/studio-subgraph.types";

export type SaveToLibraryTarget = "flow-full" | "flow-partial" | "group";

/** Infer whether Save to library writes a flow preset or a group asset. */
export function resolveSaveToLibraryTarget(nodes: readonly FlowGraphNode[]): SaveToLibraryTarget {
  const selected = nodes.filter((n) => n.selected);
  if (selected.length === 0) {
    return "flow-full";
  }
  if (selected.length === 1 && isStudioNodeGroupNode(selected[0]!)) {
    return "group";
  }
  return "flow-partial";
}

export function saveToLibraryTargetLabel(target: SaveToLibraryTarget): string {
  switch (target) {
    case "flow-full":
      return "Full flow";
    case "flow-partial":
      return "Selection";
    case "group":
      return "Node group";
    default:
      return target;
  }
}
