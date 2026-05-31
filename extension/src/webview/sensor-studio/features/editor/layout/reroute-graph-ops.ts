import type { Connection, Edge, EdgeChange, XYPosition } from "@xyflow/react";
import type { FlowGraphNode, StudioPortType } from "../store/flow-editor.store";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../store/flow-editor.store";
import { buildRerouteFlowNode } from "./layout-flow-node-builders";
import { resolveFlowSourcePortType } from "./layout-port-resolution";

export function isStudioRerouteNode(node: FlowGraphNode | undefined): boolean {
  return node?.type === "studio-reroute";
}

function studioEdgeId(source: string, target: string): string {
  return `${source}-${target}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sourcePortType(
  nodes: FlowGraphNode[],
  source: string,
  sourceHandle: string,
): StudioPortType | null {
  const sourceNode = nodes.find((n) => n.id === source);
  if (sourceNode == null) {
    return null;
  }
  return resolveFlowSourcePortType(sourceNode, sourceHandle);
}

export function makeStudioFlowEdge(connection: Connection, label: string): Edge {
  const source = connection.source!;
  const target = connection.target!;
  return {
    id: studioEdgeId(source, target),
    source,
    target,
    sourceHandle: connection.sourceHandle ?? STUDIO_HANDLE_OUT,
    targetHandle: connection.targetHandle ?? STUDIO_HANDLE_IN,
    animated: true,
    label,
    style: { strokeWidth: 2 },
  };
}

/** Insert a reroute on an existing wire: `source → target` becomes `source → reroute → target`. */
export function splitEdgeWithReroute(
  edgeId: string,
  flowPosition: XYPosition,
  nodes: FlowGraphNode[],
  edges: Edge[],
): { nodes: FlowGraphNode[]; edges: Edge[]; rerouteId: string } | null {
  const edge = edges.find((e) => e.id === edgeId);
  if (edge?.source == null || edge.target == null) {
    return null;
  }
  if (edge.source === edge.target) {
    return null;
  }

  const sourceHandle = edge.sourceHandle ?? STUDIO_HANDLE_OUT;
  const targetHandle = edge.targetHandle ?? STUDIO_HANDLE_IN;
  const portType = sourcePortType(nodes, edge.source, sourceHandle);
  const reroute = buildRerouteFlowNode(flowPosition, portType ?? undefined);

  const upstream: Connection = {
    source: edge.source,
    sourceHandle,
    target: reroute.id,
    targetHandle: "in",
  };
  const downstream: Connection = {
    source: reroute.id,
    sourceHandle: "out",
    target: edge.target,
    targetHandle,
  };

  const wireLabel = portType ?? "";
  const nextNodes = [...nodes, reroute];
  const nextEdges = [
    ...edges.filter((e) => e.id !== edgeId),
    makeStudioFlowEdge(upstream, wireLabel),
    makeStudioFlowEdge(downstream, wireLabel),
  ];

  return { nodes: nextNodes, edges: nextEdges, rerouteId: reroute.id };
}

function findRerouteInEdge(rerouteId: string, edges: Edge[]): Edge | undefined {
  return edges.find((e) => e.target === rerouteId);
}

function findRerouteOutEdge(rerouteId: string, edges: Edge[]): Edge | undefined {
  return edges.find((e) => e.source === rerouteId);
}

function findRerouteInEdgeInRemoveBatch(
  rerouteId: string,
  edges: Edge[],
  removeSet: Set<string>,
): Edge | undefined {
  return edges.find((e) => removeSet.has(e.id) && e.target === rerouteId);
}

function findRerouteOutEdgeInRemoveBatch(
  rerouteId: string,
  edges: Edge[],
  removeSet: Set<string>,
): Edge | undefined {
  return edges.find((e) => removeSet.has(e.id) && e.source === rerouteId);
}

function rerouteIdsWithBothArmsRemoved(
  removeSet: Set<string>,
  edges: Edge[],
  nodes: FlowGraphNode[],
): string[] {
  const candidateIds = new Set<string>();
  for (const edge of edges) {
    if (!removeSet.has(edge.id)) {
      continue;
    }
    const target = edge.target != null ? nodes.find((n) => n.id === edge.target) : undefined;
    const source = edge.source != null ? nodes.find((n) => n.id === edge.source) : undefined;
    if (isStudioRerouteNode(target)) {
      candidateIds.add(target.id);
    }
    if (isStudioRerouteNode(source)) {
      candidateIds.add(source.id);
    }
  }

  return [...candidateIds].filter((rerouteId) => {
    const inEdge = findRerouteInEdgeInRemoveBatch(rerouteId, edges, removeSet);
    const outEdge = findRerouteOutEdgeInRemoveBatch(rerouteId, edges, removeSet);
    return Boolean(inEdge?.source && outEdge?.target);
  });
}

function bridgeEdgeLabel(nodes: FlowGraphNode[], inEdge: Edge): string {
  const sourceHandle = inEdge.sourceHandle ?? STUDIO_HANDLE_OUT;
  return sourcePortType(nodes, inEdge.source, sourceHandle) ?? "";
}

/** `source → reroute → target` becomes `source → target` when the reroute is removed. */
export function bridgeReroutesOnNodeRemove(
  rerouteIds: string[],
  nodes: FlowGraphNode[],
  edges: Edge[],
): Edge[] {
  let nextEdges = edges;

  for (const rerouteId of rerouteIds) {
    const reroute = nodes.find((n) => n.id === rerouteId);
    if (!isStudioRerouteNode(reroute)) {
      continue;
    }

    const inEdge = findRerouteInEdge(rerouteId, nextEdges);
    const outEdge = findRerouteOutEdge(rerouteId, nextEdges);
    const removeIds = new Set(
      [inEdge?.id, outEdge?.id].filter((id): id is string => id != null),
    );
    if (removeIds.size === 0) {
      continue;
    }

    nextEdges = nextEdges.filter((e) => !removeIds.has(e.id));

    if (inEdge?.source != null && outEdge?.target != null) {
      const connection: Connection = {
        source: inEdge.source,
        sourceHandle: inEdge.sourceHandle ?? STUDIO_HANDLE_OUT,
        target: outEdge.target,
        targetHandle: outEdge.targetHandle ?? STUDIO_HANDLE_IN,
      };
      nextEdges = [...nextEdges, makeStudioFlowEdge(connection, bridgeEdgeLabel(nodes, inEdge))];
    }
  }

  return nextEdges;
}

/**
 * React Flow deletes connected edges before nodes. When both reroute arms are in
 * the same remove batch, bridge upstream→downstream instead of dropping the link.
 */
export function applyRerouteBridgeOnEdgeRemoves(
  changes: EdgeChange[],
  nodes: FlowGraphNode[],
  edges: Edge[],
): { changes: EdgeChange[]; edges: Edge[] } {
  const removeIds = changes
    .filter((c): c is EdgeChange & { type: "remove"; id: string } => c.type === "remove")
    .map((c) => c.id);
  if (removeIds.length === 0) {
    return { changes, edges };
  }

  const removeSet = new Set(removeIds);
  const rerouteIds = rerouteIdsWithBothArmsRemoved(removeSet, edges, nodes);
  if (rerouteIds.length === 0) {
    return { changes, edges };
  }

  const rerouteIdSet = new Set(rerouteIds);
  const sortedRerouteIds = [...rerouteIds].sort((a, b) => {
    const outA = findRerouteOutEdgeInRemoveBatch(a, edges, removeSet);
    const outB = findRerouteOutEdgeInRemoveBatch(b, edges, removeSet);
    const feedsReroute = (out: Edge | undefined) =>
      Boolean(out?.target != null && rerouteIdSet.has(out.target));
    return Number(feedsReroute(outA)) - Number(feedsReroute(outB));
  });

  let nextEdges = edges;
  const suppressRemoveIds = new Set<string>();

  for (const rerouteId of sortedRerouteIds) {
    const inEdge = findRerouteInEdgeInRemoveBatch(rerouteId, edges, removeSet);
    const outEdge = findRerouteOutEdgeInRemoveBatch(rerouteId, edges, removeSet);
    if (inEdge?.source == null || outEdge?.target == null) {
      continue;
    }

    suppressRemoveIds.add(inEdge.id);
    suppressRemoveIds.add(outEdge.id);

    const connection: Connection = {
      source: inEdge.source,
      sourceHandle: inEdge.sourceHandle ?? STUDIO_HANDLE_OUT,
      target: outEdge.target,
      targetHandle: outEdge.targetHandle ?? STUDIO_HANDLE_IN,
    };
    nextEdges = nextEdges.filter((e) => e.id !== inEdge.id && e.id !== outEdge.id);
    nextEdges = [...nextEdges, makeStudioFlowEdge(connection, bridgeEdgeLabel(nodes, inEdge))];
  }

  if (suppressRemoveIds.size === 0) {
    return { changes, edges };
  }

  const filteredChanges = changes.filter(
    (c) => !(c.type === "remove" && suppressRemoveIds.has(c.id)),
  );
  return { changes: filteredChanges, edges: nextEdges };
}

/** Remove nodes; fully wired reroutes bridge upstream→downstream. */
export function removeFlowNodesFromGraph(
  nodeIds: string[],
  nodes: FlowGraphNode[],
  edges: Edge[],
): { nodes: FlowGraphNode[]; edges: Edge[] } {
  if (nodeIds.length === 0) {
    return { nodes, edges };
  }

  const idSet = new Set(nodeIds);
  const rerouteIds = nodeIds.filter((id) => isStudioRerouteNode(nodes.find((n) => n.id === id)));
  const nonRerouteIds = new Set(nodeIds.filter((id) => !rerouteIds.includes(id)));

  let nextEdges = edges;
  if (rerouteIds.length > 0) {
    nextEdges = bridgeReroutesOnNodeRemove(rerouteIds, nodes, nextEdges);
  }
  if (nonRerouteIds.size > 0) {
    nextEdges = nextEdges.filter(
      (e) => !nonRerouteIds.has(e.source) && !nonRerouteIds.has(e.target),
    );
  }

  return {
    nodes: nodes.filter((n) => !idSet.has(n.id)),
    edges: nextEdges,
  };
}

/** Resolve edge id from pointer hit on the SVG edge path (React Flow 11+). */
export function findEdgeIdFromPointer(clientX: number, clientY: number): string | null {
  const hits = document.elementsFromPoint(clientX, clientY);
  for (const el of hits) {
    const edgeEl =
      el instanceof Element && el.classList.contains("react-flow__edge")
        ? el
        : el instanceof Element
          ? el.closest(".react-flow__edge")
          : null;
    if (edgeEl == null) {
      continue;
    }

    const dataId = edgeEl.getAttribute("data-id");
    if (dataId != null) {
      return dataId;
    }

    const idAttr = edgeEl.id;
    if (idAttr?.startsWith("react-flow__edge-")) {
      return idAttr.slice("react-flow__edge-".length);
    }
  }
  return null;
}
