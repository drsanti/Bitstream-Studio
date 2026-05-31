import type { Connection, Edge, XYPosition } from "@xyflow/react";
import type { FlowGraphNode, StudioPortType } from "../store/flow-editor.store";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../store/flow-editor.store";
import { buildRerouteFlowNode } from "./layout-flow-node-builders";
import { resolveFlowSourcePortType } from "./layout-port-resolution";

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

function makeStudioEdge(connection: Connection, label: string): Edge {
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
    makeStudioEdge(upstream, wireLabel),
    makeStudioEdge(downstream, wireLabel),
  ];

  return { nodes: nextNodes, edges: nextEdges, rerouteId: reroute.id };
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
