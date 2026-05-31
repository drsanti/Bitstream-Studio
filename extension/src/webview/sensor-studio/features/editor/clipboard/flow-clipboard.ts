import type { Edge, Node } from "@xyflow/react";
import type { FlowGraphNode } from "../store/flow-editor.store";
import type { StudioNodeGroupData, StudioSubgraphDocument } from "../subgraphs/studio-subgraph.types";
import { isStudioNodeGroupNode } from "../subgraphs/studio-subgraph.types";

export const FLOW_CLIPBOARD_MARKER = "sensor-studio-flow-clipboard";
export const FLOW_CLIPBOARD_VERSION = 1 as const;

export interface FlowClipboardPayload {
  marker: typeof FLOW_CLIPBOARD_MARKER;
  version: typeof FLOW_CLIPBOARD_VERSION;
  nodes: FlowGraphNode[];
  edges: Edge[];
  /** Nested group graphs (keys = subgraphId / host id at copy time). */
  subgraphs?: Record<string, StudioSubgraphDocument>;
}

export interface FlowPasteResult {
  nodes: FlowGraphNode[];
  edges: Edge[];
  idMap: Map<string, string>;
}

const PASTE_OFFSET = { x: 48, y: 48 };

function cloneNodeForExport(node: FlowGraphNode): FlowGraphNode {
  const { selected: _selected, dragging: _dragging, ...rest } = node;
  return {
    ...rest,
    selected: false,
    data: structuredClone(rest.data),
  };
}

function cloneEdgeForExport(edge: Edge): Edge {
  return { ...edge, selected: false };
}

/** Selected nodes (or entire graph if none selected) and internal edges only. */
export function buildFlowClipboardPayload(
  nodes: FlowGraphNode[],
  edges: Edge[],
  subgraphs?: Record<string, StudioSubgraphDocument>,
): FlowClipboardPayload {
  const selected = nodes.filter((n) => n.selected);
  const exportNodes = (selected.length > 0 ? selected : nodes).map(cloneNodeForExport);
  const idSet = new Set(exportNodes.map((n) => n.id));
  const exportEdges = edges
    .filter((e) => idSet.has(e.source) && e.target != null && idSet.has(e.target))
    .map(cloneEdgeForExport);

  let exportedSubgraphs: Record<string, StudioSubgraphDocument> | undefined;
  if (subgraphs != null) {
    const subIds = new Set<string>();
    for (const node of exportNodes) {
      if (isStudioNodeGroupNode(node)) {
        const data = node.data as StudioNodeGroupData;
        subIds.add(data.subgraphId ?? node.id);
      }
    }
    if (subIds.size > 0) {
      exportedSubgraphs = {};
      for (const subId of subIds) {
        const doc = subgraphs[subId];
        if (doc != null) {
          exportedSubgraphs[subId] = structuredClone(doc);
        }
      }
    }
  }

  return {
    marker: FLOW_CLIPBOARD_MARKER,
    version: FLOW_CLIPBOARD_VERSION,
    nodes: exportNodes,
    edges: exportEdges,
    ...(exportedSubgraphs != null ? { subgraphs: exportedSubgraphs } : {}),
  };
}

export function serializeFlowClipboard(payload: FlowClipboardPayload): string {
  return JSON.stringify(payload);
}

export function parseFlowClipboard(text: string): FlowClipboardPayload | null {
  try {
    const raw = JSON.parse(text) as Partial<FlowClipboardPayload>;
    if (raw?.marker !== FLOW_CLIPBOARD_MARKER || raw.version !== FLOW_CLIPBOARD_VERSION) {
      return null;
    }
    if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
      return null;
    }
    const subgraphs =
      raw.subgraphs != null &&
      typeof raw.subgraphs === "object" &&
      !Array.isArray(raw.subgraphs)
        ? (raw.subgraphs as Record<string, StudioSubgraphDocument>)
        : undefined;
    return {
      marker: FLOW_CLIPBOARD_MARKER,
      version: FLOW_CLIPBOARD_VERSION,
      nodes: raw.nodes as FlowGraphNode[],
      edges: raw.edges as Edge[],
      ...(subgraphs != null ? { subgraphs } : {}),
    };
  } catch {
    return null;
  }
}

function newFlowNodeId(type: string | undefined): string {
  const prefix = type != null && type.length > 0 ? type.replace(/^studio-?/, "layout-") : "node";
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Duplicate clipboard nodes/edges with fresh ids and a position offset. */
export function remapFlowPaste(
  payload: FlowClipboardPayload,
  offset = PASTE_OFFSET,
): FlowPasteResult {
  const idMap = new Map<string, string>();

  for (const node of payload.nodes) {
    idMap.set(node.id, newFlowNodeId(node.type));
  }

  let nodes: FlowGraphNode[] = payload.nodes.map((node) => {
    const next: FlowGraphNode = {
      ...node,
      id: idMap.get(node.id)!,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      selected: true,
      data: structuredClone(node.data),
    };
    if (node.parentId != null) {
      const mappedParent = idMap.get(node.parentId);
      if (mappedParent != null) {
        next.parentId = mappedParent;
        next.extent = node.extent ?? "parent";
      }
    }
    return next;
  });

  const nodeIds = new Set(nodes.map((n) => n.id));
  nodes = nodes.map((node) => {
    if (node.parentId != null && !nodeIds.has(node.parentId)) {
      const { parentId: _parentId, extent: _extent, ...rest } = node;
      return rest as FlowGraphNode;
    }
    return node;
  });

  const edges: Edge[] = payload.edges
    .map((edge) => {
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);
      if (source == null || target == null) {
        return null;
      }
      const sourceHandle = edge.sourceHandle ?? undefined;
      const targetHandle = edge.targetHandle ?? undefined;
      return {
        ...edge,
        id: `studio-edge-${newFlowNodeId("edge")}`,
        source,
        target,
        sourceHandle: sourceHandle ?? null,
        targetHandle: targetHandle ?? null,
        selected: false,
      } as Edge;
    })
    .filter((e): e is Edge => e != null);

  return { nodes, edges, idMap };
}
