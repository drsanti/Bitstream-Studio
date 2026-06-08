import type { Node } from "@xyflow/react";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../store/flow-editor.store";
import { isStudioFlowNode, resolveFlowSourcePortType } from "../layout/layout-port-resolution";
import type {
  StudioGroupInterface,
  StudioGroupSocketDef,
  StudioSubgraphDocument,
} from "./studio-subgraph.types";
import {
  createGroupSocketId,
  emptyGroupInterface,
  ensureDefaultGroupSockets,
  isStudioNodeGroupNode,
} from "./studio-subgraph.types";

function boundarySocketKey(
  nodeId: string | undefined,
  nodeType: string | undefined,
  handle: string,
  portType: string,
): string {
  return `${nodeId ?? "?"}:${nodeType ?? "unknown"}:${handle}:${portType}`;
}

function resolveNodeGroupSocket(
  node: Node | undefined,
  handle: string,
  direction: "input" | "output",
  subgraphs: Record<string, StudioSubgraphDocument> | undefined,
): StudioGroupSocketDef | undefined {
  if (!isStudioNodeGroupNode(node) || subgraphs == null) {
    return undefined;
  }
  const subKey = node.data.subgraphId ?? node.id;
  const iface = subgraphs[subKey]?.interface;
  if (iface == null) {
    return undefined;
  }
  const list = direction === "input" ? iface.inputs : iface.outputs;
  return list.find((s) => s.id === handle);
}

export function boundarySocketKeyForNode(
  node: Node | undefined,
  handle: string,
  direction: "input" | "output",
  subgraphs?: Record<string, StudioSubgraphDocument>,
): string {
  if (isStudioNodeGroupNode(node) && subgraphs != null) {
    const sock = resolveNodeGroupSocket(node, handle, direction, subgraphs);
    if (sock != null) {
      return `nodeGroup:${direction}:${sock.portType}:${sock.label}`;
    }
  }
  const portType =
    direction === "output" && node != null
      ? resolveFlowSourcePortType(node, handle) ?? "number"
      : inferTargetPortType(node, handle);
  return boundarySocketKey(node?.id, node?.type, handle, portType);
}

function inferTargetPortType(node: Node | undefined, handle: string): string {
  if (node == null || !isStudioFlowNode(node)) {
    return "number";
  }
  const inputs = node.data.inputHandles;
  if (inputs != null && inputs.length > 0) {
    const match = inputs.find((h) => h.id === handle);
    if (match != null) {
      return match.portType;
    }
  }
  if (handle === STUDIO_HANDLE_IN && node.data.inputType != null) {
    return node.data.inputType;
  }
  return "number";
}

export function inferBoundarySocketType(
  node: Node | undefined,
  handle: string,
  direction: "input" | "output",
  subgraphs?: Record<string, StudioSubgraphDocument>,
): StudioGroupSocketDef["portType"] {
  const fromGroupHost = resolveNodeGroupSocket(node, handle, direction, subgraphs);
  if (fromGroupHost != null) {
    return fromGroupHost.portType;
  }
  if (direction === "output" && node != null) {
    return resolveFlowSourcePortType(node, handle) ?? "number";
  }
  return inferTargetPortType(node, handle) as StudioGroupSocketDef["portType"];
}

export function labelForBoundarySocket(
  node: Node | undefined,
  handle: string,
  direction: "input" | "output",
  subgraphs?: Record<string, StudioSubgraphDocument>,
): string {
  const fromGroupHost = resolveNodeGroupSocket(node, handle, direction, subgraphs);
  if (fromGroupHost?.label) {
    return fromGroupHost.label;
  }
  if (isStudioFlowNode(node)) {
    const catalogLabel = node.data.label?.trim();
    if (handle === STUDIO_HANDLE_OUT) {
      return catalogLabel != null && catalogLabel.length > 0 ? catalogLabel : "Output";
    }
    if (handle === STUDIO_HANDLE_IN) {
      return "Input";
    }
    const inputs = node.data.inputHandles;
    const match = inputs?.find((h) => h.id === handle);
    if (match?.label) {
      return match.label;
    }
  }
  if (handle === STUDIO_HANDLE_OUT) {
    return "Output";
  }
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

export function labelForGroupInputSocket(
  target: Node | undefined,
  handle: string,
  existingInputs: StudioGroupSocketDef[],
  subgraphs?: Record<string, StudioSubgraphDocument>,
): string {
  const base = labelForBoundarySocket(target, handle, "input", subgraphs);
  const dupes = existingInputs.filter((s) => s.label === base).length;
  if (dupes === 0 || target == null) {
    return base;
  }
  const title =
    (isStudioFlowNode(target) && target.data.label?.trim()) ||
    target.type ||
    "node";
  return dupes === 1 ? `${base} (${title})` : `${base} (${title} ${dupes + 1})`;
}

/**
 * Dedup key for wires that cross into a group from the same external source.
 * Fan-out from one route/parent pin to the same inner handle (e.g. Speed on many clips)
 * becomes one published group input.
 */
export function boundarySocketKeyForCrossingInput(
  externalSourceId: string,
  externalSourceHandle: string | null | undefined,
  targetNode: Node | undefined,
  targetHandle: string | null | undefined,
  subgraphs?: Record<string, StudioSubgraphDocument>,
): string {
  const handle = targetHandle ?? STUDIO_HANDLE_IN;
  const portType = inferBoundarySocketType(targetNode, handle, "input", subgraphs);
  const sourceHandle = externalSourceHandle ?? STUDIO_HANDLE_OUT;
  // One published input per upstream pin — fan-out to many inner targets shares one socket.
  return `crossIn:${externalSourceId}:${sourceHandle}:${portType}`;
}

export type GroupInputSocketLookup = {
  externalSourceId: string;
  externalSourceHandle?: string | null;
};

export function findGroupInputSocket(
  iface: StudioGroupInterface,
  targetNode: Node | undefined,
  targetHandle: string | null | undefined,
  subgraphs?: Record<string, StudioSubgraphDocument>,
  lookup?: GroupInputSocketLookup,
): StudioGroupSocketDef | undefined {
  const handle = targetHandle ?? STUDIO_HANDLE_IN;
  if (lookup != null) {
    const crossKey = boundarySocketKeyForCrossingInput(
      lookup.externalSourceId,
      lookup.externalSourceHandle,
      targetNode,
      handle,
      subgraphs,
    );
    const byCross = iface.inputs.find((s) => s.boundaryKey === crossKey);
    if (byCross != null) {
      return byCross;
    }
  }
  const key = boundarySocketKeyForNode(targetNode, handle, "input", subgraphs);
  return iface.inputs.find((s) => s.boundaryKey === key);
}

export function findGroupOutputSocket(
  iface: StudioGroupInterface,
  sourceNode: Node | undefined,
  sourceHandle: string | null | undefined,
  subgraphs?: Record<string, StudioSubgraphDocument>,
): StudioGroupSocketDef | undefined {
  const handle = sourceHandle ?? STUDIO_HANDLE_OUT;
  const key = boundarySocketKeyForNode(sourceNode, handle, "output", subgraphs);
  return iface.outputs.find((s) => s.boundaryKey === key);
}

export function inferGroupInterface(
  selectedIds: Set<string>,
  allNodes: Node[],
  allEdges: Edge[],
  subgraphs?: Record<string, StudioSubgraphDocument>,
): StudioGroupInterface {
  const iface = emptyGroupInterface();
  const inputKeys = new Set<string>();
  const outputKeys = new Set<string>();

  for (const edge of allEdges) {
    const srcIn = selectedIds.has(edge.source);
    const tgtIn = selectedIds.has(edge.target);
    if (srcIn === tgtIn) {
      continue;
    }

    if (!srcIn && tgtIn) {
      const handle = edge.targetHandle ?? STUDIO_HANDLE_IN;
      const target = allNodes.find((n) => n.id === edge.target);
      const key = boundarySocketKeyForCrossingInput(
        edge.source,
        edge.sourceHandle,
        target,
        handle,
        subgraphs,
      );
      if (!inputKeys.has(key)) {
        inputKeys.add(key);
        iface.inputs.push({
          id: createGroupSocketId(),
          label: labelForBoundarySocket(target, handle, "input", subgraphs),
          portType: inferBoundarySocketType(target, handle, "input", subgraphs),
          direction: "input",
          boundaryKey: key,
        });
      }
    }

    if (srcIn && !tgtIn) {
      const handle = edge.sourceHandle ?? STUDIO_HANDLE_OUT;
      const source = allNodes.find((n) => n.id === edge.source);
      const key = boundarySocketKeyForNode(source, handle, "output", subgraphs);
      if (!outputKeys.has(key)) {
        outputKeys.add(key);
        iface.outputs.push({
          id: createGroupSocketId(),
          label: labelForBoundarySocket(source, handle, "output", subgraphs),
          portType: inferBoundarySocketType(source, handle, "output", subgraphs),
          direction: "output",
          boundaryKey: key,
        });
      }
    }
  }

  return ensureDefaultGroupSockets(iface);
}
