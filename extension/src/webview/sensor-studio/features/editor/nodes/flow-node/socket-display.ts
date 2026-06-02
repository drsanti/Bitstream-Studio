import type { Edge } from "@xyflow/react";
import type { StudioNodeData, StudioOutputHandleDef } from "../../store/flow-editor.store";
import type { FlowGraphNode } from "../../store/flow-editor.store";
import { isStudioSensorSocketPreviewNodeId } from "../../store/flow-editor.store";
import { studioNodeAllowsBodyCollapse } from "./studio-body-collapse";

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

const STUDIO_NODES_WITHOUT_BODY_PANEL = new Set([
  "object-transform",
  "transform-from-euler",
  // Socket-only transform/utility nodes (controls live in Inspector).
  "number-average",
  "lerp",
  "switch",
  "combine-xyz",
  "value-normalizer",
  "vector-splitter",
  "quaternion-splitter",
  "material-mix",
  "clamp",
  "map-range",
  "low-pass",
  "threshold",
  "on-key",
  "on-click",
  "event-toggle-boolean",
  "event-set-boolean",
  "event-toggle-glb-part",
  "event-set-glb-part",
  "event-trigger-glb-anim",
]);

/** `true` when the node renders a `FlowNodeBody` region that can be hidden via `bodyControlsVisible`. */
export function studioNodeHasHideableBody(data: StudioNodeData): boolean {
  const dc = data.defaultConfig;
  if (data.nodeId === "environment") {
    return typeof dc.environmentControlsExpanded === "boolean"
      ? dc.environmentControlsExpanded
      : true;
  }
  if (data.nodeId === "camera-view") {
    return typeof dc.cameraViewControlsExpanded === "boolean"
      ? dc.cameraViewControlsExpanded
      : true;
  }
  if (STUDIO_NODES_WITHOUT_BODY_PANEL.has(data.nodeId)) {
    return false;
  }
  if (isStudioSensorSocketPreviewNodeId(data.nodeId)) {
    return false;
  }
  return true;
}

/** `true` when the selection contains at least one Studio node with a hideable body panel. */
export function selectionHasHideableBody(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  return nodes.some(
    (n) =>
      idSet.has(n.id) &&
      n.type === "studio" &&
      studioNodeHasHideableBody(n.data as StudioNodeData),
  );
}

/** `true` when the selection can use canvas toolbar / Shift+B to collapse the node body. */
export function selectionAllowsBodyCollapse(
  nodes: readonly FlowGraphNode[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  return nodes.some((n) => {
    if (!idSet.has(n.id) || n.type !== "studio") {
      return false;
    }
    const data = n.data as StudioNodeData;
    return studioNodeHasHideableBody(data) && studioNodeAllowsBodyCollapse(data);
  });
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

function nodeHasCollapsibleSockets(node: FlowGraphNode, edges: readonly Edge[]): boolean {
  if (node.type !== "studio") {
    return false;
  }
  const data = node.data as StudioNodeData;

  const inputHandles: StudioOutputHandleDef[] =
    data.inputHandles != null && data.inputHandles.length > 0
      ? data.inputHandles
      : data.inputType != null
        ? [{ id: "in", portType: data.inputType, label: "In" }]
        : [];

  const outputHandles: StudioOutputHandleDef[] =
    data.outputHandles != null && data.outputHandles.length > 0
      ? data.outputHandles
      : data.outputType != null
        ? [{ id: "out", portType: data.outputType, label: "Out" }]
        : [];

  const totalSockets = inputHandles.length + outputHandles.length;
  // New rule: nodes with only one socket must always show it — no-op for collapse/expand.
  if (totalSockets <= 1) {
    return false;
  }

  // Collapsing only has a visible effect if at least one socket would be hidden when collapsed.
  for (const h of inputHandles) {
    if (!shouldShowSocketRow(node.id, h.id, edges, "input", false, inputHandles)) {
      return true;
    }
  }
  for (const h of outputHandles) {
    if (!shouldShowSocketRow(node.id, h.id, edges, "output", false)) {
      return true;
    }
  }

  return false;
}

/** `true` when the selection contains at least one Studio node with sockets that can be collapsed. */
export function selectionSupportsSocketCollapse(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  nodeIds: readonly string[],
): boolean {
  const idSet = new Set(nodeIds);
  return nodes.some((n) => idSet.has(n.id) && nodeHasCollapsibleSockets(n, edges));
}

/** `true` when the graph contains at least one Studio node with sockets that can be collapsed. */
export function graphSupportsSocketCollapse(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): boolean {
  return nodes.some((n) => nodeHasCollapsibleSockets(n, edges));
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
  // These toggles only affect Studio flow nodes (layout nodes do not store `data.ui` flags).
  return nodes.some((n) => idSet.has(n.id) && n.type === "studio");
}

export function graphSocketToolbarNodeIds(nodes: readonly FlowGraphNode[]): string[] {
  // Global socket toggles target Studio flow nodes only.
  return nodes.filter((n) => n.type === "studio").map((n) => n.id);
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
