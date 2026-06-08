import type { Edge } from "@xyflow/react";
import type { StudioSubgraphDocument } from "./studio-subgraph.types";

/** Wires leaving Group Input for a published input socket (fan-out inside the group). */
export function countGroupInputFanOut(
  boundaryNodeId: string,
  socketId: string,
  edges: readonly Edge[],
): number {
  return edges.filter(
    (e) => e.source === boundaryNodeId && (e.sourceHandle ?? "out") === socketId,
  ).length;
}

/** Wires into Group Output for a published output socket (fan-in inside the group). */
export function countGroupOutputFanIn(
  boundaryNodeId: string,
  socketId: string,
  edges: readonly Edge[],
): number {
  return edges.filter(
    (e) => e.target === boundaryNodeId && (e.targetHandle ?? "in") === socketId,
  ).length;
}

export function countGroupInputFanOutFromSubgraph(
  subgraph: StudioSubgraphDocument | undefined,
  socketId: string,
): number {
  if (subgraph == null) {
    return 0;
  }
  const groupInputId = subgraph.nodes.find((n) => n.type === "studio-group-input")?.id;
  if (groupInputId == null) {
    return 0;
  }
  return countGroupInputFanOut(groupInputId, socketId, subgraph.edges);
}

export function countGroupOutputFanInFromSubgraph(
  subgraph: StudioSubgraphDocument | undefined,
  socketId: string,
): number {
  if (subgraph == null) {
    return 0;
  }
  const groupOutputId = subgraph.nodes.find((n) => n.type === "studio-group-output")?.id;
  if (groupOutputId == null) {
    return 0;
  }
  return countGroupOutputFanIn(groupOutputId, socketId, subgraph.edges);
}
