import type { Edge, Node } from "@xyflow/react";
import {
  findGroupInputSocket,
  findGroupOutputSocket,
} from "./studio-group-boundary-sockets";
import type {
  StudioGroupInterface,
  StudioNodeGroupData,
  StudioSubgraphDocument,
} from "./studio-subgraph.types";
import {
  groupBoundaryNodeIds,
  isStudioGroupBoundaryNode,
  isStudioNodeGroupNode,
} from "./studio-subgraph.types";

export type DissolveStudioNodeGroupResult = {
  nodes: Node[];
  edges: Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
};

function isContentNode(node: Node): boolean {
  return !isStudioGroupBoundaryNode(node);
}

/** How many `studio-node-group` hosts reference this subgraph key. */
export function countSubgraphHosts(
  subgraphKey: string,
  rootNodes: Node[],
  subgraphs: Record<string, StudioSubgraphDocument>,
): number {
  let count = 0;
  const visit = (nodes: Node[]) => {
    for (const n of nodes) {
      if (!isStudioNodeGroupNode(n)) {
        continue;
      }
      const d = n.data as StudioNodeGroupData;
      if ((d.subgraphId ?? n.id) === subgraphKey) {
        count++;
      }
    }
  };
  visit(rootNodes);
  for (const sub of Object.values(subgraphs)) {
    visit(sub.nodes);
  }
  return count;
}

function contentCentroid(nodes: Node[]): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }
  const sum = nodes.reduce(
    (acc, n) => ({ x: acc.x + n.position.x, y: acc.y + n.position.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / nodes.length, y: sum.y / nodes.length };
}

function positionContentAtGroup(
  contentNodes: Node[],
  groupPosition: { x: number; y: number },
): Node[] {
  const c = contentCentroid(contentNodes);
  return contentNodes.map((n) => ({
    ...structuredClone(n),
    position: {
      x: groupPosition.x + (n.position.x - c.x),
      y: groupPosition.y + (n.position.y - c.y),
    },
    selected: true,
  }));
}

function buildIdMap(contentNodes: Node[], cloneIds: boolean, prefix: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const n of contentNodes) {
    map.set(n.id, cloneIds ? `${prefix}${n.id}` : n.id);
  }
  return map;
}

function remapContentNodes(contentNodes: Node[], idMap: Map<string, string>): Node[] {
  return contentNodes.map((n) => {
    const next: Node = {
      ...structuredClone(n),
      id: idMap.get(n.id) ?? n.id,
    };
    if (isStudioNodeGroupNode(next)) {
      const d = next.data as StudioNodeGroupData;
      next.data = { ...d, subgraphId: d.subgraphId ?? n.id };
    }
    return next;
  });
}

function resolveInputSocketId(
  targetHandle: string | null | undefined,
  iface: StudioGroupInterface,
  targetNode?: Node,
): string | undefined {
  if (targetHandle == null || targetHandle.length === 0) {
    return iface.inputs[0]?.id;
  }
  const byId = iface.inputs.find((s) => s.id === targetHandle);
  if (byId != null) {
    return byId.id;
  }
  return findGroupInputSocket(iface, targetNode, targetHandle)?.id ?? iface.inputs[0]?.id;
}

function resolveOutputSocketId(
  sourceHandle: string | null | undefined,
  iface: StudioGroupInterface,
  sourceNode?: Node,
): string | undefined {
  if (sourceHandle == null || sourceHandle.length === 0) {
    return iface.outputs[0]?.id;
  }
  const byId = iface.outputs.find((s) => s.id === sourceHandle);
  if (byId != null) {
    return byId.id;
  }
  return findGroupOutputSocket(iface, sourceNode, sourceHandle)?.id ?? iface.outputs[0]?.id;
}

function findBoundaryNode(subgraph: StudioSubgraphDocument, role: "input" | "output"): Node | undefined {
  const type = role === "input" ? "studio-group-input" : "studio-group-output";
  return subgraph.nodes.find((n) => n.type === type);
}

function bridgesFromGroupInput(
  subgraph: StudioSubgraphDocument,
  groupInputId: string | undefined,
  socketId: string | undefined,
): Edge[] {
  if (groupInputId == null || socketId == null) {
    return [];
  }
  return subgraph.edges.filter((e) => e.source === groupInputId && e.sourceHandle === socketId);
}

function bridgesToGroupOutput(
  subgraph: StudioSubgraphDocument,
  groupOutputId: string | undefined,
  socketId: string | undefined,
): Edge[] {
  if (groupOutputId == null || socketId == null) {
    return [];
  }
  return subgraph.edges.filter((e) => e.target === groupOutputId && e.targetHandle === socketId);
}

function internalContentEdges(
  subgraph: StudioSubgraphDocument,
  idMap: Map<string, string>,
  subgraphKey: string,
): Edge[] {
  const ids = groupBoundaryNodeIds(subgraphKey);
  const inputId =
    subgraph.nodes.find((n) => n.type === "studio-group-input")?.id ?? ids.input;
  const outputId =
    subgraph.nodes.find((n) => n.type === "studio-group-output")?.id ?? ids.output;

  return subgraph.edges
    .filter((e) => {
      if (e.source === inputId || e.target === outputId) {
        return false;
      }
      if (e.target === inputId || e.source === outputId) {
        return false;
      }
      const src = subgraph.nodes.find((n) => n.id === e.source);
      const tgt = subgraph.nodes.find((n) => n.id === e.target);
      return src != null && tgt != null && isContentNode(src) && isContentNode(tgt);
    })
    .map((e) => ({
      ...e,
      id: `ung_${e.id}`,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
    }));
}

function rewireParentEdgesAfterDissolve(
  parentEdges: Edge[],
  groupNodeId: string,
  subgraph: StudioSubgraphDocument,
  idMap: Map<string, string>,
): Edge[] {
  const groupInput = findBoundaryNode(subgraph, "input");
  const groupOutput = findBoundaryNode(subgraph, "output");
  const iface = subgraph.interface;
  const out: Edge[] = [];

  for (const edge of parentEdges) {
    if (edge.source !== groupNodeId && edge.target !== groupNodeId) {
      out.push(edge);
      continue;
    }

    if (edge.target === groupNodeId) {
      const socketId = resolveInputSocketId(edge.targetHandle, iface);
      let bridges = bridgesFromGroupInput(subgraph, groupInput?.id, socketId);
      if (bridges.length === 0 && groupInput != null) {
        bridges = subgraph.edges.filter(
          (e) => e.source === groupInput.id && idMap.has(e.target),
        );
      }
      if (bridges.length === 0) {
        continue;
      }
      for (const bridge of bridges) {
        const mappedTarget = idMap.get(bridge.target);
        if (mappedTarget == null) {
          continue;
        }
        out.push({
          ...edge,
          id: `ung_in_${edge.id}_${bridge.id}`,
          target: mappedTarget,
          targetHandle: bridge.targetHandle,
        });
      }
      continue;
    }

    if (edge.source === groupNodeId) {
      const socketId = resolveOutputSocketId(edge.sourceHandle, iface);
      let bridges = bridgesToGroupOutput(subgraph, groupOutput?.id, socketId);
      if (bridges.length === 0 && groupOutput != null) {
        bridges = subgraph.edges.filter(
          (e) => e.target === groupOutput.id && idMap.has(e.source),
        );
      }
      for (const bridge of bridges) {
        const mappedSource = idMap.get(bridge.source);
        if (mappedSource == null) {
          continue;
        }
        out.push({
          ...edge,
          id: `ung_out_${edge.id}_${bridge.id}`,
          source: mappedSource,
          sourceHandle: bridge.sourceHandle,
        });
      }
    }
  }

  return out;
}

/**
 * Expand a `studio-node-group` host into its inner nodes on the parent graph.
 * Linked copies (shared subgraph) clone inner ids so other hosts stay valid.
 */
export function dissolveStudioNodeGroupInParent(
  parentNodes: Node[],
  parentEdges: Edge[],
  groupHostNode: Node,
  subgraphs: Record<string, StudioSubgraphDocument>,
  rootNodes: Node[],
): DissolveStudioNodeGroupResult | null {
  if (!isStudioNodeGroupNode(groupHostNode)) {
    return null;
  }

  const data = groupHostNode.data as StudioNodeGroupData;
  const subgraphKey = data.subgraphId ?? groupHostNode.id;
  const subgraph = subgraphs[subgraphKey];
  if (subgraph == null) {
    return null;
  }

  const rawContent = subgraph.nodes.filter(isContentNode);
  if (rawContent.length === 0) {
    return null;
  }

  const hostCount = countSubgraphHosts(subgraphKey, rootNodes, subgraphs);
  const cloneIds = hostCount > 1;
  const prefix = cloneIds ? `ung_${Date.now()}_` : "";

  const idMap = buildIdMap(rawContent, cloneIds, prefix);
  const expandedNodes = positionContentAtGroup(
    remapContentNodes(rawContent, idMap),
    groupHostNode.position,
  );

  const siblingNodes = parentNodes
    .filter((n) => n.id !== groupHostNode.id)
    .map((n) => ({ ...n, selected: false }));

  const internalEdges = internalContentEdges(subgraph, idMap, subgraphKey);
  const rewiredParent = rewireParentEdgesAfterDissolve(
    parentEdges,
    groupHostNode.id,
    subgraph,
    idMap,
  );
  const nextEdges = [...rewiredParent, ...internalEdges].filter(
    (e) => e.source !== groupHostNode.id && e.target !== groupHostNode.id,
  );

  let nextSubgraphs = { ...subgraphs };
  if (hostCount <= 1) {
    const { [subgraphKey]: _removed, ...rest } = nextSubgraphs;
    nextSubgraphs = rest;
  }

  return {
    nodes: [...siblingNodes, ...expandedNodes],
    edges: nextEdges,
    subgraphs: nextSubgraphs,
  };
}
