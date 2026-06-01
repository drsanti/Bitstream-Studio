import type { Edge } from "@xyflow/react";
import type { StudioNodeData, StudioOutputHandleDef } from "../../store/flow-editor.store";
import type { FlowGraphNode } from "../../store/flow-editor.store";

export type StudioNodeUiFlags = NonNullable<StudioNodeData["ui"]>;

/** `true` or unset = expanded; `false` = hide unwired socket rows. */
export function isSocketsExpanded(ui: StudioNodeUiFlags | undefined): boolean {
  return ui?.socketsExpanded !== false;
}

/** `true` or unset = show live readouts on socket rows. */
export function isSocketValuesVisible(ui: StudioNodeUiFlags | undefined): boolean {
  return ui?.socketValuesVisible !== false;
}

/** `true` or unset = show card body controls / previews. */
export function isBodyControlsVisible(ui: StudioNodeUiFlags | undefined): boolean {
  return ui?.bodyControlsVisible !== false;
}

function edgeMatchesInput(
  edge: Edge,
  nodeId: string,
  handleId: string,
  visibleInputs: StudioOutputHandleDef[],
): boolean {
  if (edge.target !== nodeId) {
    return false;
  }
  const targetHandle = edge.targetHandle ?? "in";
  if (targetHandle === handleId) {
    return true;
  }
  if (!targetHandle && visibleInputs.length === 1 && visibleInputs[0]?.id === handleId) {
    return true;
  }
  return false;
}

function edgeMatchesOutput(edge: Edge, nodeId: string, handleId: string): boolean {
  if (edge.source !== nodeId) {
    return false;
  }
  const sourceHandle = edge.sourceHandle ?? "out";
  return sourceHandle === handleId;
}

export function shouldShowSocketRow(
  nodeId: string,
  handleId: string,
  edges: readonly Edge[],
  direction: "input" | "output",
  expanded: boolean,
  inputHandles?: StudioOutputHandleDef[],
): boolean {
  if (expanded) {
    return true;
  }
  if (direction === "input") {
    const visible = inputHandles ?? [];
    return edges.some((e) => edgeMatchesInput(e, nodeId, handleId, visible));
  }
  return edges.some((e) => edgeMatchesOutput(e, nodeId, handleId));
}

export function filterInputHandlesForDisplay(
  nodeId: string,
  handles: StudioOutputHandleDef[],
  edges: readonly Edge[],
  expanded: boolean,
): StudioOutputHandleDef[] {
  if (expanded) {
    return handles;
  }
  return handles.filter((h) =>
    shouldShowSocketRow(nodeId, h.id, edges, "input", expanded, handles),
  );
}

export function filterOutputHandlesForDisplay(
  nodeId: string,
  handles: StudioOutputHandleDef[],
  edges: readonly Edge[],
  expanded: boolean,
): StudioOutputHandleDef[] {
  if (expanded) {
    return handles;
  }
  return handles.filter((h) => shouldShowSocketRow(nodeId, h.id, edges, "output", expanded));
}

export function nextSocketsExpandedForBatch(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  const anyExpanded = nodes.some(
    (n) =>
      idSet.has(n.id) &&
      n.type === "studio" &&
      isSocketsExpanded((n.data as StudioNodeData).ui),
  );
  return !anyExpanded;
}

export function nextSocketValuesVisibleForBatch(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  const anyVisible = nodes.some(
    (n) =>
      idSet.has(n.id) &&
      n.type === "studio" &&
      isSocketValuesVisible((n.data as StudioNodeData).ui),
  );
  return !anyVisible;
}

export function nextBodyControlsVisibleForBatch(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  const anyVisible = nodes.some(
    (n) =>
      idSet.has(n.id) &&
      n.type === "studio" &&
      isBodyControlsVisible((n.data as StudioNodeData).ui),
  );
  return !anyVisible;
}

export function selectionSupportsSocketToolbar(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  return nodes.some(
    (n) =>
      idSet.has(n.id) &&
      n.type !== "studio-note" &&
      n.type !== "studio-frame",
  );
}

export function graphSocketToolbarNodeIds(nodes: readonly FlowGraphNode[]): string[] {
  return nodes.filter((n) => n.type !== "studio-note").map((n) => n.id);
}

export function selectionSupportsBodyControlsToolbar(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  return nodes.some((n) => idSet.has(n.id) && n.type === "studio");
}

export function getSocketsExpandedUIState(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  return nodes.some(
    (n) =>
      idSet.has(n.id) &&
      n.type === "studio" &&
      isSocketsExpanded((n.data as StudioNodeData).ui),
  );
}

export function getSocketValuesVisibleUIState(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  return nodes.some(
    (n) =>
      idSet.has(n.id) &&
      n.type === "studio" &&
      isSocketValuesVisible((n.data as StudioNodeData).ui),
  );
}

export function getBodyControlsVisibleUIState(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  return nodes.some(
    (n) =>
      idSet.has(n.id) &&
      n.type === "studio" &&
      isBodyControlsVisible((n.data as StudioNodeData).ui),
  );
}
