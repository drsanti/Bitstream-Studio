import type { Edge, Node, NodeChange } from "@xyflow/react";

type FlowSyncNode = Node<Record<string, unknown>>;

function readNodeLayoutWidth(node: FlowSyncNode): number | undefined {
  if (typeof node.width === "number" && Number.isFinite(node.width)) {
    return Math.max(1, Math.round(node.width));
  }
  const styleWidth = node.style?.width;
  if (typeof styleWidth === "number" && Number.isFinite(styleWidth)) {
    return Math.max(1, Math.round(styleWidth));
  }
  return undefined;
}

function readNodeLayoutHeight(node: FlowSyncNode): number | undefined {
  if (typeof node.height === "number" && Number.isFinite(node.height)) {
    return Math.max(1, Math.round(node.height));
  }
  const styleHeight = node.style?.height;
  if (typeof styleHeight === "number" && Number.isFinite(styleHeight)) {
    return Math.max(1, Math.round(styleHeight));
  }
  return undefined;
}

/** React Flow shell fields — excludes simulation `data` and `selected` (selection synced separately). */
export function reactFlowShellSignature(node: FlowSyncNode): string {
  return [
    node.id,
    node.type ?? "",
    node.parentId ?? "",
    node.hidden === true ? 1 : 0,
    node.zIndex ?? "",
    node.dragging === true ? 1 : 0,
    Math.round(node.position.x),
    Math.round(node.position.y),
    readNodeLayoutWidth(node) ?? "",
    readNodeLayoutHeight(node) ?? "",
    node.dragHandle ?? "",
    node.draggable === false ? 0 : 1,
  ].join("|");
}

export function readFlowGraphStructuralKey(nodes: readonly FlowSyncNode[]): string {
  return nodes.map((node) => reactFlowShellSignature(node)).sort().join("\n");
}

export function flowGraphPropsStructurallyEqual(
  prevNodes: readonly FlowSyncNode[],
  prevEdges: readonly Edge[],
  nextNodes: readonly FlowSyncNode[],
  nextEdges: readonly Edge[],
): boolean {
  return (
    readFlowGraphStructuralKey(prevNodes) === readFlowGraphStructuralKey(nextNodes) &&
    readFlowEdgesStructuralKey(prevEdges) === readFlowEdgesStructuralKey(nextEdges)
  );
}

export function readFlowEdgesStructuralKey(edges: readonly Edge[]): string {
  return edges
    .map((edge) =>
      [
        edge.id,
        edge.source,
        edge.target,
        edge.sourceHandle ?? "",
        edge.targetHandle ?? "",
        edge.selected === true ? 1 : 0,
        edge.hidden === true ? 1 : 0,
      ].join("|"),
    )
    .sort()
    .join("\n");
}

/**
 * RF `measured` can lag after content auto-fit sets explicit `width`/`height` on the store node
 * (see `clearStudioNodeMeasuredBox`). Never resurrect stale `measured` over explicit layout.
 */
export function reconcileRenderNodeMeasured(
  incoming: FlowSyncNode,
  previous: FlowSyncNode | undefined,
): FlowSyncNode["measured"] {
  const layoutW = readNodeLayoutWidth(incoming);
  const layoutH = readNodeLayoutHeight(incoming);
  const prevMeasured = previous?.measured;

  if (layoutW != null || layoutH != null) {
    if (incoming.measured != null) {
      return incoming.measured;
    }
    if (layoutW != null && layoutH != null) {
      return { width: layoutW, height: layoutH };
    }
    return {
      width: layoutW ?? prevMeasured?.width,
      height: layoutH ?? prevMeasured?.height,
    };
  }

  // Chrome toggle remeasure strips explicit box on the store node — do not keep stale RF measure.
  return incoming.measured;
}

/** Keep RF wrapper bounds aligned with the store shell while preserving local RF-only fields. */
export function alignRenderNodeShellFromStore(
  renderNode: FlowSyncNode,
  storeNode: FlowSyncNode,
): FlowSyncNode {
  return {
    ...renderNode,
    width: storeNode.width,
    height: storeNode.height,
    style: storeNode.style,
    measured: reconcileRenderNodeMeasured(storeNode, renderNode),
  };
}

export function mergeStoreNodesIntoRenderNodes(
  current: readonly FlowSyncNode[],
  incoming: readonly FlowSyncNode[],
): readonly FlowSyncNode[] {
  if (!shouldReplaceRenderNodesFromStore(current, incoming)) {
    return current;
  }
  const currentById = new Map(current.map((node) => [node.id, node]));
  return incoming.map((node) => {
    const previous = currentById.get(node.id);
    if (previous == null) {
      return { ...node };
    }
    return {
      ...node,
      measured: reconcileRenderNodeMeasured(node, previous),
    };
  });
}

export function shouldReplaceRenderNodesFromStore(
  current: readonly FlowSyncNode[],
  incoming: readonly FlowSyncNode[],
): boolean {
  if (current.length !== incoming.length) {
    return true;
  }
  const incomingById = new Map(incoming.map((node) => [node.id, node]));
  for (const node of current) {
    const next = incomingById.get(node.id);
    if (next == null) {
      return true;
    }
    if (reactFlowShellSignature(node) !== reactFlowShellSignature(next)) {
      return true;
    }
  }
  return false;
}

/** Selection is owned by `onSelectionChange` — never forward `select` to the store `onNodesChange`. */
export function nodeChangesIncludeSelection(
  changes: readonly NodeChange[],
): boolean {
  return changes.some((change) => change.type === "select");
}

/** Drop RF echo changes that would rewrite the store without meaningful graph edits. */
export function filterNodeChangesForStore(
  changes: readonly NodeChange[],
  nodes: readonly FlowSyncNode[],
): NodeChange[] {
  const out: NodeChange[] = [];
  for (const change of changes) {
    if (change.type === "select") {
      continue;
    }
    if (change.type === "dimensions") {
      const node = nodes.find((entry) => entry.id === change.id);
      const dim = change.dimensions;
      if (node != null && dim != null) {
        const width =
          typeof dim.width === "number" && Number.isFinite(dim.width)
            ? Math.max(1, Math.round(dim.width))
            : undefined;
        const height =
          typeof dim.height === "number" && Number.isFinite(dim.height)
            ? Math.max(1, Math.round(dim.height))
            : undefined;
        if (
          width === readNodeLayoutWidth(node) &&
          height === readNodeLayoutHeight(node)
        ) {
          continue;
        }
      }
    }
    out.push(change);
  }
  return out;
}

/** Apply store selection ids to RF render nodes without forcing a full structural merge. */
export function syncRenderNodeSelection(
  current: readonly FlowSyncNode[],
  selectedIds: readonly string[],
): readonly FlowSyncNode[] {
  const selected = new Set(selectedIds);
  let changed = false;
  const next = current.map((node) => {
    const shouldSelect = selected.has(node.id);
    if (node.selected === shouldSelect) {
      return node;
    }
    changed = true;
    return { ...node, selected: shouldSelect };
  });
  return changed ? next : current;
}

export function selectionIdsEqual(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const seen = new Set(a);
  if (seen.size !== a.length) {
    return false;
  }
  return b.every((id) => seen.has(id));
}

export function renderNodeSelectionMatches(
  nodes: readonly FlowSyncNode[],
  selectedIds: readonly string[],
): boolean {
  const selected = new Set(selectedIds);
  for (const node of nodes) {
    if (Boolean(node.selected) !== selected.has(node.id)) {
      return false;
    }
  }
  return true;
}

export function storeSelectionWillChange(
  storeSelectedNodeIds: readonly string[],
  storeSelectedNodeId: string | null,
  storeNodes: readonly FlowSyncNode[],
  nextSelectedIds: readonly string[],
): boolean {
  const currentIds =
    storeSelectedNodeIds.length > 0
      ? storeSelectedNodeIds
      : storeSelectedNodeId != null
        ? [storeSelectedNodeId]
        : [];
  return (
    !selectionIdsEqual(currentIds, nextSelectedIds) ||
    !renderNodeSelectionMatches(storeNodes, nextSelectedIds)
  );
}
