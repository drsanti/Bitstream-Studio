import type { Edge } from "@xyflow/react";
import type { FlowGraphNode, SensorHealthStatus } from "../store/flow-editor.store";

export type FlowEdgeHealthTone = "live" | "stale" | "offline" | null;

/** Health of the wire's source node when it publishes sensor telemetry. */
export function resolveFlowEdgeSourceHealth(
  edge: Edge,
  nodeById: ReadonlyMap<string, FlowGraphNode>,
): FlowEdgeHealthTone {
  const sourceId = edge.source;
  if (sourceId == null) {
    return null;
  }
  const node = nodeById.get(sourceId);
  const health = node?.data?.sensorHealth;
  if (health === "live" || health === "stale" || health === "offline") {
    return health;
  }
  return null;
}

export function buildFlowNodeIdMap(nodes: readonly FlowGraphNode[]): Map<string, FlowGraphNode> {
  const map = new Map<string, FlowGraphNode>();
  for (const node of nodes) {
    map.set(node.id, node);
  }
  return map;
}

export function isSensorHealthStatus(value: unknown): value is SensorHealthStatus {
  return value === "live" || value === "stale" || value === "offline" || value === "sim";
}
