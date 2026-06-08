import type { Edge } from "@xyflow/react";
import {
  countGroupInputFanOutFromSubgraph,
  countGroupOutputFanInFromSubgraph,
} from "./studio-group-wire-counts";
import type { StudioSubgraphDocument } from "./studio-subgraph.types";

export function countGroupSocketWires(args: {
  direction: "input" | "output";
  hostNodeId: string;
  socketId: string;
  rootEdges: readonly Edge[];
  subgraph: StudioSubgraphDocument | undefined;
}): number {
  const { direction, hostNodeId, socketId, rootEdges, subgraph } = args;
  if (direction === "input") {
    const parent = rootEdges.filter(
      (e) => e.target === hostNodeId && e.targetHandle === socketId,
    ).length;
    const inner =
      subgraph != null
        ? countGroupInputFanOutFromSubgraph(subgraph, socketId)
        : 0;
    return parent + inner;
  }
  const parent = rootEdges.filter(
    (e) => e.source === hostNodeId && e.sourceHandle === socketId,
  ).length;
  const inner =
    subgraph != null
      ? countGroupOutputFanInFromSubgraph(subgraph, socketId)
      : 0;
  return parent + inner;
}
