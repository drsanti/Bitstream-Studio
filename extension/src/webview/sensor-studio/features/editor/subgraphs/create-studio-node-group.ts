import type { Edge, Node } from "@xyflow/react";
import { findGroupInputSocket, findGroupOutputSocket, inferGroupInterface } from "./studio-group-boundary-sockets";
import type { CreateStudioNodeGroupResult } from "./create-studio-node-group.types";
import {
  defaultGroupInterface,
  groupBoundaryNodeIds,
  isExcludedFromNodeGroup,
  type StudioGroupInterface,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

export type { CreateStudioNodeGroupResult } from "./create-studio-node-group.types";

const BOUNDARY_NODE_X = { input: 40, output: 520 };
const BOUNDARY_NODE_Y = 120;

function centroid(nodes: Node[]): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }
  const sum = nodes.reduce(
    (acc, n) => ({ x: acc.x + n.position.x, y: acc.y + n.position.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / nodes.length, y: sum.y / nodes.length };
}

function offsetNodes(nodes: Node[], dx: number, dy: number): Node[] {
  return nodes.map((n) => ({
    ...n,
    position: { x: n.position.x + dx, y: n.position.y + dy },
    selected: false,
  }));
}

function wireBoundaryNodes(
  groupId: string,
  iface: StudioGroupInterface,
  selectedIds: Set<string>,
  allEdges: Edge[],
  allNodes: Node[],
  subgraphEdges: Edge[],
  subgraphs?: Record<string, StudioSubgraphDocument>,
): void {
  for (const edge of allEdges) {
    const srcIn = selectedIds.has(edge.source);
    const tgtIn = selectedIds.has(edge.target);

    if (!srcIn && tgtIn) {
      const target = allNodes.find((n) => n.id === edge.target);
      const sock = findGroupInputSocket(iface, target, edge.targetHandle, subgraphs);
      if (sock == null) {
        continue;
      }
      subgraphEdges.push({
        ...edge,
        id: `${groupId}_e_in_${edge.id}`,
        source: `${groupId}_input`,
        sourceHandle: sock.id,
        target: edge.target,
        targetHandle: edge.targetHandle,
      });
    }

    if (srcIn && !tgtIn) {
      const source = allNodes.find((n) => n.id === edge.source);
      const sock = findGroupOutputSocket(iface, source, edge.sourceHandle, subgraphs);
      if (sock == null) {
        continue;
      }
      subgraphEdges.push({
        ...edge,
        id: `${groupId}_e_out_${edge.id}`,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: `${groupId}_output`,
        targetHandle: sock.id,
      });
    }
  }
}

export function createStudioNodeGroupFromSelection(
  groupId: string,
  selectedNodes: Node[],
  allEdges: Edge[],
  allNodes: Node[],
  subgraphs?: Record<string, StudioSubgraphDocument>,
): CreateStudioNodeGroupResult {
  const contentNodes = selectedNodes.filter((n) => !isExcludedFromNodeGroup(n));
  const selectedIds = new Set(contentNodes.map((n) => n.id));
  const iface = inferGroupInterface(selectedIds, allNodes, allEdges, subgraphs);

  const internalEdges = allEdges.filter(
    (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
  );

  const minX = Math.min(...contentNodes.map((n) => n.position.x));
  const minY = Math.min(...contentNodes.map((n) => n.position.y));
  const innerOffsetX = 180 - minX;
  const innerOffsetY = 40 - minY;

  const innerNodes = offsetNodes(contentNodes, innerOffsetX, innerOffsetY);

  const groupInputNode: Node = {
    id: `${groupId}_input`,
    type: "studio-group-input",
    position: { x: BOUNDARY_NODE_X.input, y: BOUNDARY_NODE_Y },
    data: { interface: iface, role: "input" },
    selectable: false,
    draggable: false,
  };

  const groupOutputNode: Node = {
    id: `${groupId}_output`,
    type: "studio-group-output",
    position: { x: BOUNDARY_NODE_X.output, y: BOUNDARY_NODE_Y },
    data: { interface: iface, role: "output" },
    selectable: false,
    draggable: false,
  };

  const subgraphNodes: Node[] = [groupInputNode, ...innerNodes, groupOutputNode];
  const subgraphEdges: Edge[] = [...internalEdges.map((e) => ({ ...e }))];

  wireBoundaryNodes(
    groupId,
    iface,
    selectedIds,
    allEdges,
    allNodes,
    subgraphEdges,
    subgraphs,
  );

  const center = centroid(contentNodes);
  const groupNode: Node = {
    id: groupId,
    type: "studio-node-group",
    position: { x: center.x, y: center.y },
    data: {
      graphTitle: "Node Group",
      subgraphId: groupId,
    },
    selected: true,
  };

  return {
    groupNode,
    subgraph: {
      nodes: subgraphNodes,
      edges: subgraphEdges,
      interface: iface,
      graphTitle: "Node Group",
    },
  };
}

export function createEmptyStudioNodeGroup(
  groupId: string,
  position: { x: number; y: number },
): CreateStudioNodeGroupResult {
  const iface = defaultGroupInterface();
  const ids = groupBoundaryNodeIds(groupId);

  const groupInputNode: Node = {
    id: ids.input,
    type: "studio-group-input",
    position: { x: BOUNDARY_NODE_X.input, y: BOUNDARY_NODE_Y },
    data: { interface: iface, role: "input" },
    selectable: false,
    draggable: false,
  };

  const groupOutputNode: Node = {
    id: ids.output,
    type: "studio-group-output",
    position: { x: BOUNDARY_NODE_X.output, y: BOUNDARY_NODE_Y },
    data: { interface: iface, role: "output" },
    selectable: false,
    draggable: false,
  };

  const groupNode: Node = {
    id: groupId,
    type: "studio-node-group",
    position,
    data: {
      graphTitle: "Node Group",
      subgraphId: groupId,
    },
    selected: true,
  };

  return {
    groupNode,
    subgraph: {
      nodes: [groupInputNode, groupOutputNode],
      edges: [],
      interface: iface,
      graphTitle: "Node Group",
    },
  };
}
