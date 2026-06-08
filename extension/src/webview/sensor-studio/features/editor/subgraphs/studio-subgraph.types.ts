import type { Edge, Node } from "@xyflow/react";
import type { StudioPortType } from "../store/flow-editor.store";

/** Root graph id — persisted as `"__root__"` in store snapshots. */
export const STUDIO_ROOT_GRAPH_ID = "__root__" as const;

export type StudioGraphId = typeof STUDIO_ROOT_GRAPH_ID | string;

export type StudioGroupSocketDefaultValue = number | boolean | string;

export type StudioGroupSocketDef = {
  id: string;
  label: string;
  portType: StudioPortType;
  direction: "input" | "output";
  /** Stable dedupe key from boundary crossing inference. */
  boundaryKey: string;
  /** Used when the parent graph leaves this input socket unwired (input sockets only). */
  defaultValue?: StudioGroupSocketDefaultValue;
};

export type StudioGroupInterface = {
  inputs: StudioGroupSocketDef[];
  outputs: StudioGroupSocketDef[];
};

export type StudioSubgraphDocument = {
  nodes: Node[];
  edges: Edge[];
  interface: StudioGroupInterface;
  /** Optional display title when editing inside the group. */
  graphTitle?: string;
};

export type StudioNodeGroupHostLiveFields = {
  /** Populated during simulation for collapsed shell socket readouts. */
  liveNumberByHandle?: Record<string, number>;
  liveBooleanByHandle?: Record<string, boolean>;
  liveStringByHandle?: Record<string, string>;
  liveVector3ByHandle?: Record<string, { x: number; y: number; z: number }>;
};

export type StudioNodeGroupData = StudioNodeGroupHostLiveFields & {
  graphTitle?: string;
  subgraphId: string;
  /** When set, this shell was spawned from or saved to the node group library. */
  libraryAssetId?: string;
};

export type StudioGroupBoundaryData = {
  role: "input" | "output";
  interface: StudioGroupInterface;
  /** Populated during simulation for Group Input output sockets. */
  liveNumberByHandle?: Record<string, number>;
  liveBooleanByHandle?: Record<string, boolean>;
  liveStringByHandle?: Record<string, string>;
  liveVector3ByHandle?: Record<string, { x: number; y: number; z: number }>;
};

export type StudioNodeGroupFlowNode = Node<StudioNodeGroupData, "studio-node-group">;
export type StudioGroupInputFlowNode = Node<StudioGroupBoundaryData, "studio-group-input">;
export type StudioGroupOutputFlowNode = Node<StudioGroupBoundaryData, "studio-group-output">;

export type SubgraphFlowNode =
  | StudioNodeGroupFlowNode
  | StudioGroupInputFlowNode
  | StudioGroupOutputFlowNode;

export const STUDIO_SUBGRAPH_FLOW_NODE_TYPES = [
  "studio-node-group",
  "studio-group-input",
  "studio-group-output",
] as const;

export type StudioSubgraphFlowNodeType = (typeof STUDIO_SUBGRAPH_FLOW_NODE_TYPES)[number];

export function isStudioNodeGroupNode(node: Node | undefined): node is StudioNodeGroupFlowNode {
  return node?.type === "studio-node-group";
}

export function isStudioGroupBoundaryNode(
  node: Node | undefined,
): node is StudioGroupInputFlowNode | StudioGroupOutputFlowNode {
  return node?.type === "studio-group-input" || node?.type === "studio-group-output";
}

export function isSubgraphFlowNode(node: Node): node is SubgraphFlowNode {
  return (
    node.type === "studio-node-group" ||
    node.type === "studio-group-input" ||
    node.type === "studio-group-output"
  );
}

export function createGroupSocketId(): string {
  return `gsock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyGroupInterface(): StudioGroupInterface {
  return { inputs: [], outputs: [] };
}

export function defaultGroupInterface(): StudioGroupInterface {
  const inId = createGroupSocketId();
  const outId = createGroupSocketId();
  return {
    inputs: [
      {
        id: inId,
        label: "Value",
        portType: "number",
        direction: "input",
        boundaryKey: "default:in:number:Value",
      },
    ],
    outputs: [
      {
        id: outId,
        label: "Value",
        portType: "number",
        direction: "output",
        boundaryKey: "default:out:number:Value",
      },
    ],
  };
}

/** Ensure at least one input and one output socket for empty groups. */
export function ensureDefaultGroupSockets(iface: StudioGroupInterface): StudioGroupInterface {
  if (iface.inputs.length > 0 && iface.outputs.length > 0) {
    return iface;
  }
  const next = {
    inputs: [...iface.inputs],
    outputs: [...iface.outputs],
  };
  if (next.inputs.length === 0) {
    next.inputs.push(defaultGroupInterface().inputs[0]!);
  }
  if (next.outputs.length === 0) {
    next.outputs.push(defaultGroupInterface().outputs[0]!);
  }
  return next;
}

export function findGroupBoundaryNode(
  nodes: readonly Node[],
  role: "input" | "output",
): Node | undefined {
  const type = role === "input" ? "studio-group-input" : "studio-group-output";
  return nodes.find((n) => n.type === type);
}

export function groupBoundaryNodeIds(subgraphKey: string): { input: string; output: string } {
  return {
    input: `${subgraphKey}_input`,
    output: `${subgraphKey}_output`,
  };
}

export function groupBoundaryNodeIdsForHost(
  hostNodeId: string,
  subgraphKey: string,
): { input: string; output: string } {
  const base = groupBoundaryNodeIds(subgraphKey);
  return {
    input: `${hostNodeId}__${base.input}`,
    output: `${hostNodeId}__${base.output}`,
  };
}

/** Nodes that must not be collapsed into a node group. */
export function isExcludedFromNodeGroup(node: Node): boolean {
  return (
    node.type === "studio-frame" ||
    node.type === "studio-note" ||
    node.type === "studio-group-input" ||
    node.type === "studio-group-output" ||
    node.type === "studio-node-group"
  );
}
