import dagre from "dagre";
import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../store/flow-editor.store";
import { getFlowNodeMeasuredSize } from "./frame-flow-nodes";

export type FlowAutoLayoutDirection = "LR" | "TB";

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 100;

export function applyFlowAutoLayout(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  direction: FlowAutoLayoutDirection = "LR",
): FlowGraphNode[] {
  if (nodes.length === 0) {
    return [];
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

  for (const node of nodes) {
    const { w, h } = getFlowNodeMeasuredSize(node);
    dagreGraph.setNode(node.id, {
      width: w > 0 ? w : DEFAULT_NODE_WIDTH,
      height: h > 0 ? h : DEFAULT_NODE_HEIGHT,
    });
  }

  for (const edge of edges) {
    if (edge.source && edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const positioned = dagreGraph.node(node.id);
    if (positioned == null) {
      return node;
    }
    const { w, h } = getFlowNodeMeasuredSize(node);
    const width = w > 0 ? w : DEFAULT_NODE_WIDTH;
    const height = h > 0 ? h : DEFAULT_NODE_HEIGHT;
    return {
      ...node,
      position: {
        x: positioned.x - width / 2,
        y: positioned.y - height / 2,
      },
    };
  });
}
