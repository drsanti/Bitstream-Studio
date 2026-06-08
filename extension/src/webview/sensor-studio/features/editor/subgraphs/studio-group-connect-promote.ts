import type { Connection, Edge, Node } from "@xyflow/react";
import {
  boundarySocketKeyForNode,
  inferBoundarySocketType,
  labelForBoundarySocket,
  labelForGroupInputSocket,
} from "./studio-group-boundary-sockets";
import type { StudioConnectionGraph } from "../connect/socket-connection-policy";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../studio-handle-ids";
import { resolveFlowSourcePortType } from "../layout/layout-port-resolution";
import {
  createGroupSocketId,
  ensureDefaultGroupSockets,
  findGroupBoundaryNode,
  isStudioNodeGroupNode,
  type StudioGroupInterface,
  type StudioGroupSocketDef,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

export type GroupConnectPromotion = {
  hostNodeId: string;
  nextInterface: StudioGroupInterface;
  connection: Connection;
};

function findSubgraphForNode(
  nodeId: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): { subgraphId: string; doc: StudioSubgraphDocument } | null {
  for (const [subgraphId, doc] of Object.entries(subgraphs)) {
    if (doc.nodes.some((n) => n.id === nodeId)) {
      return { subgraphId, doc };
    }
  }
  return null;
}

function findHostForSubgraph(
  subgraphId: string,
  rootNodes: readonly Node[],
): Node | undefined {
  return rootNodes.find(
    (n) =>
      isStudioNodeGroupNode(n) &&
      (n.data.subgraphId ?? n.id) === subgraphId,
  );
}

function ensureSocketByBoundaryKey(
  list: StudioGroupSocketDef[],
  socket: StudioGroupSocketDef,
): { list: StudioGroupSocketDef[]; socketId: string } {
  const existing = list.find((s) => s.boundaryKey === socket.boundaryKey);
  if (existing != null) {
    return { list, socketId: existing.id };
  }
  return { list: [...list, socket], socketId: socket.id };
}

/** User dropped on an existing group-shell handle — wire as-is, do not auto-promote. */
function isExistingGroupShellSocket(
  sockets: StudioGroupSocketDef[],
  handleId: string,
): boolean {
  return sockets.some((s) => s.id === handleId);
}

function createOutputSocketFromSource(
  source: Node,
  sourceHandle: string,
  existingOutputs: StudioGroupSocketDef[],
  subgraphs?: Record<string, StudioSubgraphDocument>,
): StudioGroupSocketDef {
  const portType = inferBoundarySocketType(source, sourceHandle, "output", subgraphs);
  const label = labelForBoundarySocket(source, sourceHandle, "output", subgraphs);
  const boundaryKey = boundarySocketKeyForNode(source, sourceHandle, "output", subgraphs);
  return {
    id: createGroupSocketId(),
    label,
    portType,
    direction: "output",
    boundaryKey,
  };
}

function createInputSocketFromParentSource(
  source: Node,
  sourceHandle: string,
  existingInputs: StudioGroupSocketDef[],
  subgraphs?: Record<string, StudioSubgraphDocument>,
): StudioGroupSocketDef {
  const portType =
    resolveFlowSourcePortType(source, sourceHandle) ??
    inferBoundarySocketType(source, sourceHandle, "output", subgraphs);
  const label = labelForGroupInputSocket(
    source,
    sourceHandle,
    existingInputs,
    subgraphs,
  );
  const boundaryKey = `parent:in:${source.id}:${sourceHandle}:${portType}:${label}`;
  return {
    id: createGroupSocketId(),
    label,
    portType,
    direction: "input",
    boundaryKey,
  };
}

function createOutputSocketFromParentTarget(
  target: Node,
  targetHandle: string,
  existingOutputs: StudioGroupSocketDef[],
  subgraphs?: Record<string, StudioSubgraphDocument>,
): StudioGroupSocketDef {
  const portType = inferBoundarySocketType(target, targetHandle, "input", subgraphs);
  const label = labelForBoundarySocket(target, targetHandle, "input", subgraphs);
  const boundaryKey = `parent:out:${target.id}:${targetHandle}:${portType}:${label}`;
  return {
    id: createGroupSocketId(),
    label,
    portType,
    direction: "output",
    boundaryKey,
  };
}

/** Auto-create group interface sockets when wiring to Group Input/Output or the group shell. */
export function promoteGroupConnection(
  connection: Connection,
  graph: StudioConnectionGraph,
  rootNodes: readonly Node[],
): GroupConnectPromotion | null {
  const { source, target, sourceHandle, targetHandle } = connection;
  if (source == null || target == null || sourceHandle == null || targetHandle == null) {
    return null;
  }

  const sourceNode = graph.nodes.find((n) => n.id === source);
  const targetNode = graph.nodes.find((n) => n.id === target);
  if (sourceNode == null || targetNode == null) {
    return null;
  }

  if (targetNode.type === "studio-group-output") {
    const subCtx = findSubgraphForNode(target, graph.subgraphs);
    if (subCtx == null) {
      return null;
    }
    const host = findHostForSubgraph(subCtx.subgraphId, rootNodes);
    if (host == null) {
      return null;
    }
    const iface = subCtx.doc.interface;
    const newSock = createOutputSocketFromSource(
      sourceNode,
      sourceHandle,
      iface.outputs,
      graph.subgraphs,
    );
    const { list: nextOutputs, socketId: sockId } = ensureSocketByBoundaryKey(
      iface.outputs,
      newSock,
    );
    return {
      hostNodeId: host.id,
      nextInterface: { ...iface, outputs: nextOutputs },
      connection: { ...connection, targetHandle: sockId },
    };
  }

  if (targetNode.type === "studio-node-group" && isStudioNodeGroupNode(targetNode)) {
    const subgraphId = targetNode.data.subgraphId ?? targetNode.id;
    const sub = graph.subgraphs[subgraphId];
    if (sub == null) {
      return null;
    }
    const iface = sub.interface;
    if (isExistingGroupShellSocket(iface.inputs, targetHandle)) {
      return null;
    }
    const newSock = createInputSocketFromParentSource(
      sourceNode,
      sourceHandle,
      iface.inputs,
      graph.subgraphs,
    );
    const { list: nextInputs, socketId: sockId } = ensureSocketByBoundaryKey(
      iface.inputs,
      newSock,
    );
    return {
      hostNodeId: targetNode.id,
      nextInterface: { ...iface, inputs: nextInputs },
      connection: { ...connection, target: targetNode.id, targetHandle: sockId },
    };
  }

  if (sourceNode.type === "studio-node-group" && isStudioNodeGroupNode(sourceNode)) {
    const subgraphId = sourceNode.data.subgraphId ?? sourceNode.id;
    const sub = graph.subgraphs[subgraphId];
    if (sub == null) {
      return null;
    }
    const iface = sub.interface;
    if (isExistingGroupShellSocket(iface.outputs, sourceHandle)) {
      return null;
    }
    const newSock = createOutputSocketFromParentTarget(
      targetNode,
      targetHandle,
      iface.outputs,
      graph.subgraphs,
    );
    const { list: nextOutputs, socketId: sockId } = ensureSocketByBoundaryKey(
      iface.outputs,
      newSock,
    );
    return {
      hostNodeId: sourceNode.id,
      nextInterface: { ...iface, outputs: nextOutputs },
      connection: { ...connection, source: sourceNode.id, sourceHandle: sockId },
    };
  }

  return null;
}

function ensureInnerBoundaryInputSocket(
  inputs: StudioGroupSocketDef[],
  handleId: string,
  subgraph: StudioSubgraphDocument,
  subgraphs: Record<string, StudioSubgraphDocument>,
): StudioGroupSocketDef[] {
  if (inputs.some((s) => s.id === handleId)) {
    return inputs;
  }
  const inputNode = findGroupBoundaryNode(subgraph.nodes, "input");
  if (inputNode == null) {
    return inputs;
  }
  const bridge = subgraph.edges.find(
    (e) => e.source === inputNode.id && e.sourceHandle === handleId,
  );
  if (bridge == null) {
    return inputs;
  }
  const target = subgraph.nodes.find((n) => n.id === bridge.target);
  const targetHandle = bridge.targetHandle ?? STUDIO_HANDLE_IN;
  const sock: StudioGroupSocketDef = {
    id: handleId,
    label: labelForGroupInputSocket(target, targetHandle, inputs, subgraphs),
    portType: inferBoundarySocketType(target, targetHandle, "input", subgraphs),
    direction: "input",
    boundaryKey: boundarySocketKeyForNode(target, targetHandle, "input", subgraphs),
  };
  return ensureSocketByBoundaryKey(inputs, sock).list;
}

function ensureInnerBoundaryOutputSocket(
  outputs: StudioGroupSocketDef[],
  handleId: string,
  subgraph: StudioSubgraphDocument,
  subgraphs: Record<string, StudioSubgraphDocument>,
): StudioGroupSocketDef[] {
  if (outputs.some((s) => s.id === handleId)) {
    return outputs;
  }
  const outputNode = findGroupBoundaryNode(subgraph.nodes, "output");
  if (outputNode == null) {
    return outputs;
  }
  const bridge = subgraph.edges.find(
    (e) => e.target === outputNode.id && e.targetHandle === handleId,
  );
  if (bridge == null) {
    return outputs;
  }
  const source = subgraph.nodes.find((n) => n.id === bridge.source);
  const sourceHandle = bridge.sourceHandle ?? STUDIO_HANDLE_OUT;
  const sock: StudioGroupSocketDef = {
    id: handleId,
    label: labelForBoundarySocket(source, sourceHandle, "output", subgraphs),
    portType: inferBoundarySocketType(source, sourceHandle, "output", subgraphs),
    direction: "output",
    boundaryKey: boundarySocketKeyForNode(source, sourceHandle, "output", subgraphs),
  };
  return ensureSocketByBoundaryKey(outputs, sock).list;
}

/**
 * Merge interface sockets from inner Group Input/Output bridges and parent shell wires.
 * Preserves existing socket ids so parent edges and inner boundary edges stay connected.
 */
export function syncGroupInterfaceFromHostWires(args: {
  hostNodeId: string;
  rootNodes: readonly Node[];
  rootEdges: readonly Edge[];
  subgraph: StudioSubgraphDocument;
  subgraphs: Record<string, StudioSubgraphDocument>;
}): StudioGroupInterface {
  const { hostNodeId, rootNodes, rootEdges, subgraph, subgraphs } = args;
  let inputs = [...subgraph.interface.inputs];
  let outputs = [...subgraph.interface.outputs];

  const inputNode = findGroupBoundaryNode(subgraph.nodes, "input");
  const outputNode = findGroupBoundaryNode(subgraph.nodes, "output");

  if (inputNode != null) {
    for (const edge of subgraph.edges) {
      if (edge.source === inputNode.id && edge.sourceHandle != null) {
        inputs = ensureInnerBoundaryInputSocket(
          inputs,
          edge.sourceHandle,
          subgraph,
          subgraphs,
        );
      }
    }
  }

  if (outputNode != null) {
    for (const edge of subgraph.edges) {
      if (edge.target === outputNode.id && edge.targetHandle != null) {
        outputs = ensureInnerBoundaryOutputSocket(
          outputs,
          edge.targetHandle,
          subgraph,
          subgraphs,
        );
      }
    }
  }

  for (const edge of rootEdges) {
    if (edge.target === hostNodeId && edge.targetHandle != null) {
      if (inputs.some((s) => s.id === edge.targetHandle)) {
        continue;
      }
      const sourceNode = rootNodes.find((n) => n.id === edge.source);
      if (sourceNode == null) {
        continue;
      }
      const sock = createInputSocketFromParentSource(
        sourceNode,
        edge.sourceHandle ?? STUDIO_HANDLE_OUT,
        inputs,
        subgraphs,
      );
      inputs = ensureSocketByBoundaryKey(inputs, {
        ...sock,
        id: edge.targetHandle,
      }).list;
    }
    if (edge.source === hostNodeId && edge.sourceHandle != null) {
      if (outputs.some((s) => s.id === edge.sourceHandle)) {
        continue;
      }
      const targetNode = rootNodes.find((n) => n.id === edge.target);
      if (targetNode == null) {
        continue;
      }
      const sock = createOutputSocketFromParentTarget(
        targetNode,
        edge.targetHandle ?? STUDIO_HANDLE_IN,
        outputs,
        subgraphs,
      );
      outputs = ensureSocketByBoundaryKey(outputs, {
        ...sock,
        id: edge.sourceHandle,
      }).list;
    }
  }

  return ensureDefaultGroupSockets({ inputs, outputs });
}

export function listUnwiredGroupInterfaceSockets(args: {
  hostNodeId: string;
  iface: StudioGroupInterface;
  rootEdges: readonly Edge[];
  subgraph: StudioSubgraphDocument;
}): { inputs: string[]; outputs: string[] } {
  const { hostNodeId, iface, rootEdges, subgraph } = args;
  const inputNode = findGroupBoundaryNode(subgraph.nodes, "input");
  const outputNode = findGroupBoundaryNode(subgraph.nodes, "output");

  const unwiredInputs: string[] = [];
  for (const sock of iface.inputs) {
    const hasParent = rootEdges.some(
      (e) => e.target === hostNodeId && e.targetHandle === sock.id,
    );
    if (!hasParent) {
      unwiredInputs.push(sock.label);
    }
  }

  const unwiredOutputs: string[] = [];
  for (const sock of iface.outputs) {
    if (outputNode == null) {
      continue;
    }
    const hasInner = subgraph.edges.some(
      (e) => e.target === outputNode.id && e.targetHandle === sock.id,
    );
    if (!hasInner) {
      unwiredOutputs.push(sock.label);
    }
  }

  return { inputs: unwiredInputs, outputs: unwiredOutputs };
}
