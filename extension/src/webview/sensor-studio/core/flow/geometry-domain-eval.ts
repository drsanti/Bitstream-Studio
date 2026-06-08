import type { StudioFlowEdgeLike } from "../../features/editor/model/model-generated-bindings";

/** Domain B extension — procedural mesh primitive nodes (evaluated on graph tick). */
export const GEOMETRY_DOMAIN_NODE_IDS: ReadonlySet<string> = new Set([
  "mesh-box",
  "mesh-sphere",
  "mesh-plane",
  "mesh-cylinder",
  "mesh-cone",
  "mesh-torus",
  "mesh-capsule",
  "mesh-group",
]);

type FlowNodeLike = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
  };
};

export function graphNeedsGeometryDomainEval(
  nodes: ReadonlyArray<{ data: { nodeId: string } }>,
): boolean {
  return nodes.some((node) => GEOMETRY_DOMAIN_NODE_IDS.has(node.data.nodeId));
}

function collectStudioNodeIds(nodes: ReadonlyArray<{ type?: string; data?: unknown }>): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.type !== "studio") {
      continue;
    }
    const data = node.data as { nodeId?: string } | undefined;
    if (typeof data?.nodeId === "string") {
      ids.push(data.nodeId);
    }
  }
  return ids;
}

/** Scan root graph + nested subgraph documents for procedural mesh nodes. */
export function graphNeedsGeometryDomainEvalInGraph(args: {
  nodes: ReadonlyArray<{ type?: string; data?: unknown }>;
  rootNodes?: ReadonlyArray<{ type?: string; data?: unknown }>;
  subgraphs?: Record<string, { nodes: ReadonlyArray<{ type?: string; data?: unknown }> }>;
}): boolean {
  const buckets = [args.nodes, args.rootNodes ?? [], ...Object.values(args.subgraphs ?? {}).map((s) => s.nodes)];
  for (const list of buckets) {
    if (graphNeedsGeometryDomainEval(collectStudioNodeIds(list).map((nodeId) => ({ data: { nodeId } })))) {
      return true;
    }
  }
  return false;
}

/** Placeholder for Phase 3 Stage snapshot collection. */
export function evaluateGeometryGraphForStage(_args: {
  nodes: readonly FlowNodeLike[];
  edges: readonly StudioFlowEdgeLike[];
}): { meshes: [] } {
  return { meshes: [] };
}
