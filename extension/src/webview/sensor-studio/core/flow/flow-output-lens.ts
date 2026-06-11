import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../features/editor/store/flow-editor.store";

export const FLOW_OUTPUT_LENS_CATALOG_ID = {
  dashboard: "dashboard-output",
  stage: "scene-output",
} as const;

export type FlowOutputLensKind = keyof typeof FLOW_OUTPUT_LENS_CATALOG_ID;

export function flowOutputLensAnchorCatalogId(lens: FlowOutputLensKind): string {
  return FLOW_OUTPUT_LENS_CATALOG_ID[lens];
}

export function flowOutputLensAnchorTitle(lens: FlowOutputLensKind): string {
  return lens === "dashboard" ? "Dashboard Output" : "Scene Output";
}

export type FlowOutputLensScope = {
  nodeIds: ReadonlySet<string>;
  edgeIds: ReadonlySet<string>;
};

function isStudioCatalogNode(node: FlowGraphNode, catalogNodeId: string): boolean {
  return (
    node.type === "studio" &&
    (node.data as { nodeId?: string } | undefined)?.nodeId === catalogNodeId
  );
}

/** Include layout frame ancestors so scoped lenses show group chrome around wired nodes. */
export function expandFlowLensScopeWithFrameAncestors(
  nodes: readonly FlowGraphNode[],
  nodeIds: ReadonlySet<string>,
): Set<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const expanded = new Set(nodeIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of expanded) {
      const parentId = byId.get(id)?.parentId;
      if (
        parentId != null &&
        parentId.length > 0 &&
        byId.has(parentId) &&
        !expanded.has(parentId)
      ) {
        expanded.add(parentId);
        changed = true;
      }
    }
  }
  return expanded;
}

function finalizeFlowOutputLensScope(
  nodes: readonly FlowGraphNode[],
  nodeIds: Set<string>,
  edges: readonly Edge[],
): FlowOutputLensScope {
  const expandedNodeIds = expandFlowLensScopeWithFrameAncestors(nodes, nodeIds);
  const edgeIds = new Set<string>();
  for (const edge of edges) {
    if (expandedNodeIds.has(edge.source) && expandedNodeIds.has(edge.target)) {
      edgeIds.add(edge.id);
    }
  }
  return { nodeIds: expandedNodeIds, edgeIds };
}

/**
 * Collect nodes and edges upstream of the given output catalog node (viewport lens only — one graph).
 */
export function collectFlowOutputUpstreamScope(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  outputCatalogId: string,
): FlowOutputLensScope | null {
  const seeds = nodes.filter((n) => isStudioCatalogNode(n, outputCatalogId)).map((n) => n.id);
  if (seeds.length === 0) {
    return null;
  }

  const knownNodeIds = new Set(nodes.map((n) => n.id));
  const nodeIds = new Set<string>(seeds);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const edge of edges) {
      if (!nodeIds.has(edge.target) || !knownNodeIds.has(edge.source)) {
        continue;
      }
      if (!nodeIds.has(edge.source)) {
        nodeIds.add(edge.source);
        expanded = true;
      }
    }
  }

  return finalizeFlowOutputLensScope(nodes, nodeIds, edges);
}

export function applyFlowOutputLensToGraph<T extends FlowGraphNode>(
  nodes: readonly T[],
  edges: readonly Edge[],
  lens: FlowOutputLensKind | "full" | null | undefined,
): { nodes: T[]; edges: Edge[]; scope: FlowOutputLensScope | null } {
  if (lens == null || lens === "full") {
    return { nodes: [...nodes], edges: [...edges], scope: null };
  }
  const scope = collectFlowOutputUpstreamScope(
    nodes,
    edges,
    FLOW_OUTPUT_LENS_CATALOG_ID[lens],
  );
  if (scope == null) {
    // Scoped panes must not mirror the full graph when their output anchor is missing.
    return { nodes: [], edges: [], scope: null };
  }
  return {
    nodes: nodes.filter((n) => scope.nodeIds.has(n.id)),
    edges: edges.filter((e) => scope.edgeIds.has(e.id)),
    scope,
  };
}
