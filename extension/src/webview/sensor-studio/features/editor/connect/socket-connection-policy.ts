import {
  addEdge,
  reconnectEdge,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import type { StudioPortType } from "../flow-graph-types";
import {
  STUDIO_HANDLE_IN,
  STUDIO_HANDLE_OUT,
} from "../studio-handle-ids";
import type { StudioSubgraphDocument } from "../subgraphs/studio-subgraph.types";
import {
  isStudioFlowNode,
  layoutNodeAcceptsInput,
  resolveFlowSourcePortType,
} from "../layout/layout-port-resolution";
import { isLayoutFlowNode } from "../layout/layout-flow-nodes.types";
import { resolveStudioGroupNodePortType } from "../subgraphs/resolve-studio-group-port";
import { isStudioNodeGroupNode } from "../subgraphs/studio-subgraph.types";

export type StudioConnectionGraph = {
  nodes: Node[];
  edges: Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
};

export type ConnectionRejectReason =
  | "missing_endpoints"
  | "self_loop"
  | "duplicate_edge"
  | "type_mismatch";

export function connectionRejectMessage(reason: ConnectionRejectReason): string {
  switch (reason) {
    case "missing_endpoints":
      return "Connection needs both sockets.";
    case "self_loop":
      return "Cannot connect a node to itself.";
    case "duplicate_edge":
      return "This connection already exists.";
    case "type_mismatch":
      return "Socket types are not compatible.";
    default:
      return "Connection not allowed.";
  }
}

/** Inputs that accept multiple incoming wires (no replace on connect; no pop on drag-start). */
export const MULTI_INPUT_SOCKETS: Record<string, ReadonlySet<string>> = {
  "number-average": new Set([STUDIO_HANDLE_IN]),
};

/**
 * Outputs that allow only one outgoing wire (pop on drag-start; replace on reconnect).
 * Empty in v0.1 — all catalog outputs fan out unless listed here.
 */
export const SINGLE_OUTPUT_SOCKETS: Record<string, ReadonlySet<string>> = {};

export type SocketRole = "source" | "target";

function studioCatalogNodeId(node: Node): string | null {
  if (node.type === "studio" || node.type == null) {
    return node.data.nodeId ?? null;
  }
  if (node.type === "studio-reroute" || node.type === "studio-split") {
    return node.type;
  }
  return null;
}

function groupOutputSocketPortType(node: Node, handleId: string): StudioPortType | null {
  if (node.type !== "studio-group-output") {
    return null;
  }
  const iface = (node.data as { interface?: { outputs: { id: string; portType: StudioPortType }[] } })
    .interface;
  return iface?.outputs.find((s) => s.id === handleId)?.portType ?? null;
}

export function getSocketCardinality(
  node: Node | undefined,
  handleId: string,
  role: SocketRole,
): "single" | "multi" {
  if (role === "source") {
    const catalogId = node != null ? studioCatalogNodeId(node) : null;
    if (catalogId != null && SINGLE_OUTPUT_SOCKETS[catalogId]?.has(handleId)) {
      return "single";
    }
    return "multi";
  }
  if (node != null) {
    if (groupOutputSocketPortType(node, handleId) === "glbAnimation") {
      return "multi";
    }
  }
  const catalogId = node != null ? studioCatalogNodeId(node) : null;
  if (catalogId != null && MULTI_INPUT_SOCKETS[catalogId]?.has(handleId)) {
    return "multi";
  }
  return "single";
}

function getSourcePortType(
  node: Node,
  sourceHandle: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): StudioPortType | null {
  const groupType = resolveStudioGroupNodePortType(node, sourceHandle, "output", subgraphs);
  if (groupType != null) {
    return groupType;
  }
  return resolveFlowSourcePortType(node, sourceHandle);
}

function getTargetPortType(
  node: Node,
  targetHandle: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): StudioPortType | null {
  const groupType = resolveStudioGroupNodePortType(node, targetHandle, "input", subgraphs);
  if (groupType != null) {
    return groupType;
  }
  if (!isStudioFlowNode(node)) {
    return null;
  }
  const inputHandles = node.data.inputHandles;
  if (inputHandles != null && inputHandles.length > 0) {
    return inputHandles.find((h) => h.id === targetHandle)?.portType ?? null;
  }
  if (targetHandle !== STUDIO_HANDLE_IN) {
    return null;
  }
  return node.data.inputType ?? null;
}

function isDuplicateEdge(
  connection: Connection | Edge,
  edges: Edge[],
  excludeEdgeId?: string,
): boolean {
  const { source, target, sourceHandle, targetHandle } = connection;
  if (source == null || target == null || sourceHandle == null || targetHandle == null) {
    return false;
  }
  return edges.some(
    (e) =>
      e.id !== excludeEdgeId &&
      e.source === source &&
      e.target === target &&
      e.sourceHandle === sourceHandle &&
      e.targetHandle === targetHandle,
  );
}

/** Incoming wires removed when connecting to a single-input socket (replace policy). */
export function incomingEdgesToReplace(
  connection: Connection,
  nodes: Node[],
  edges: Edge[],
  excludeEdgeId?: string,
): string[] {
  const { target, targetHandle } = connection;
  if (target == null || targetHandle == null) {
    return [];
  }
  const targetNode = nodes.find((n) => n.id === target);
  if (getSocketCardinality(targetNode, targetHandle, "target") !== "single") {
    return [];
  }
  return edges
    .filter(
      (e) =>
        e.id !== excludeEdgeId &&
        e.target === target &&
        (e.targetHandle ?? STUDIO_HANDLE_IN) === targetHandle,
    )
    .map((e) => e.id);
}

/** Pop existing wires when starting a drag from a wired socket (reconnect UX). */
export function edgesToPopOnConnectStart(
  nodeId: string,
  handleId: string,
  handleType: SocketRole,
  nodes: Node[],
  edges: Edge[],
): string[] {
  const node = nodes.find((n) => n.id === nodeId);
  if (handleType === "target") {
    if (getSocketCardinality(node, handleId, "target") !== "single") {
      return [];
    }
    return edges
      .filter(
        (e) =>
          e.target === nodeId && (e.targetHandle ?? STUDIO_HANDLE_IN) === handleId,
      )
      .map((e) => e.id);
  }
  if (getSocketCardinality(node, handleId, "source") !== "single") {
    return [];
  }
  return edges
    .filter(
      (e) =>
        e.source === nodeId && (e.sourceHandle ?? STUDIO_HANDLE_OUT) === handleId,
    )
    .map((e) => e.id);
}

export type ValidateConnectionOptions = {
  excludeEdgeId?: string;
  /** Allow incomplete connections during drag preview. Default true. */
  allowIncomplete?: boolean;
};

export function validateStudioConnection(
  connection: Connection | Edge,
  graph: StudioConnectionGraph,
  options: ValidateConnectionOptions = {},
): { ok: true } | { ok: false; reason: ConnectionRejectReason } {
  const { allowIncomplete = true, excludeEdgeId } = options;
  const { nodes, edges, subgraphs } = graph;
  const { source, sourceHandle, target, targetHandle } = connection;

  if (source == null || target == null || sourceHandle == null || targetHandle == null) {
    return allowIncomplete ? { ok: true } : { ok: false, reason: "missing_endpoints" };
  }

  if (source === target) {
    return { ok: false, reason: "self_loop" };
  }

  if (isDuplicateEdge(connection, edges, excludeEdgeId)) {
    return { ok: false, reason: "duplicate_edge" };
  }

  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);
  if (sourceNode == null || targetNode == null) {
    return allowIncomplete ? { ok: true } : { ok: false, reason: "missing_endpoints" };
  }

  const sourceType = getSourcePortType(
    sourceNode,
    sourceHandle ?? STUDIO_HANDLE_OUT,
    subgraphs,
  );
  if (sourceType == null) {
    return allowIncomplete ? { ok: true } : { ok: false, reason: "type_mismatch" };
  }

  if (isStudioNodeGroupNode(targetNode)) {
    const targetType = getTargetPortType(targetNode, targetHandle, subgraphs);
    return targetType != null && sourceType === targetType
      ? { ok: true }
      : { ok: false, reason: "type_mismatch" };
  }

  if (isLayoutFlowNode(targetNode)) {
    if (targetNode.type === "studio-note" || targetNode.type === "studio-frame") {
      return { ok: false, reason: "type_mismatch" };
    }
    return layoutNodeAcceptsInput(targetNode, targetHandle, sourceType)
      ? { ok: true }
      : { ok: false, reason: "type_mismatch" };
  }

  if (!isStudioFlowNode(targetNode)) {
    if (targetNode.type === "studio-group-output") {
      const targetType = getTargetPortType(targetNode, targetHandle, subgraphs);
      return targetType != null && sourceType === targetType
        ? { ok: true }
        : { ok: false, reason: "type_mismatch" };
    }
    return { ok: false, reason: "type_mismatch" };
  }

  const targetType = getTargetPortType(targetNode, targetHandle, subgraphs);
  if (targetType == null || sourceType !== targetType) {
    return { ok: false, reason: "type_mismatch" };
  }

  return { ok: true };
}

/** Validate, replace single-input wires, append new edge (caller adds label/style). */
export function connectWithPolicy(
  connection: Connection,
  graph: StudioConnectionGraph,
  options?: { excludeEdgeId?: string },
): { ok: true; edges: Edge[]; removedEdgeIds: string[] } | { ok: false; reason: ConnectionRejectReason } {
  const validation = validateStudioConnection(connection, graph, {
    allowIncomplete: false,
    excludeEdgeId: options?.excludeEdgeId,
  });
  if (!validation.ok) {
    return validation;
  }

  const removedEdgeIds = incomingEdgesToReplace(connection, graph.nodes, graph.edges);
  const replaceIds = new Set(removedEdgeIds);
  const nextBase = graph.edges.filter((e) => !replaceIds.has(e.id));
  const nextEdges = addEdge(
    {
      ...connection,
      sourceHandle: connection.sourceHandle ?? STUDIO_HANDLE_OUT,
      targetHandle: connection.targetHandle ?? STUDIO_HANDLE_IN,
    },
    nextBase,
  );

  return { ok: true, edges: nextEdges, removedEdgeIds };
}

/** Merge partial reconnect `Connection` with the edge being updated. */
export function mergeReconnectConnection(
  oldEdge: Edge,
  newConnection: Connection,
): Connection {
  return {
    source: newConnection.source ?? oldEdge.source,
    target: newConnection.target ?? oldEdge.target,
    sourceHandle:
      newConnection.sourceHandle ?? oldEdge.sourceHandle ?? STUDIO_HANDLE_OUT,
    targetHandle:
      newConnection.targetHandle ?? oldEdge.targetHandle ?? STUDIO_HANDLE_IN,
  };
}

/** Validate, apply single-input replace, and update an existing edge in place (keeps edge id). */
export function reconnectWithPolicy(
  oldEdge: Edge,
  newConnection: Connection,
  graph: StudioConnectionGraph,
): { ok: true; edges: Edge[]; removedEdgeIds: string[] } | { ok: false; reason: ConnectionRejectReason } {
  const connection = mergeReconnectConnection(oldEdge, newConnection);
  const validation = validateStudioConnection(connection, graph, {
    allowIncomplete: false,
    excludeEdgeId: oldEdge.id,
  });
  if (!validation.ok) {
    return validation;
  }

  const removedEdgeIds = incomingEdgesToReplace(
    connection,
    graph.nodes,
    graph.edges,
    oldEdge.id,
  );
  const replaceIds = new Set(removedEdgeIds);
  const baseEdges = graph.edges.filter((e) => !replaceIds.has(e.id));
  const nextEdges = reconnectEdge(oldEdge, connection, baseEdges, {
    shouldReplaceId: false,
  });

  return { ok: true, edges: nextEdges, removedEdgeIds };
}
