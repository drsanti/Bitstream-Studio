import type { Edge } from "@xyflow/react";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../studio-handle-ids";
import { studioFlowPinKey } from "../store/flow-editor.store";
import {
  groupBoundaryNodeIdsForHost,
  type StudioGroupBoundaryData,
  type StudioGroupInterface,
  type StudioGroupSocketDef,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

export type StudioGroupBoundaryLiveFields = Pick<
  StudioGroupBoundaryData,
  | "liveNumberByHandle"
  | "liveBooleanByHandle"
  | "liveStringByHandle"
  | "liveVector3ByHandle"
>;

function narrowNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function narrowVec3(v: unknown): { x: number; y: number; z: number } | null {
  if (v == null || typeof v !== "object" || !("x" in v)) {
    return null;
  }
  const o = v as { x: unknown; y: unknown; z: unknown };
  if (
    typeof o.x === "number" &&
    Number.isFinite(o.x) &&
    typeof o.y === "number" &&
    Number.isFinite(o.y) &&
    typeof o.z === "number" &&
    Number.isFinite(o.z)
  ) {
    return { x: o.x, y: o.y, z: o.z };
  }
  return null;
}

function applyPinToLiveFields(
  socket: StudioGroupSocketDef,
  pin: unknown,
  out: StudioGroupBoundaryLiveFields,
): void {
  if (socket.portType === "number") {
    const n = narrowNumber(pin);
    if (n != null) {
      out.liveNumberByHandle = { ...out.liveNumberByHandle, [socket.id]: n };
    }
    return;
  }
  if (socket.portType === "boolean" && typeof pin === "boolean") {
    out.liveBooleanByHandle = { ...out.liveBooleanByHandle, [socket.id]: pin };
    return;
  }
  if (socket.portType === "string" && typeof pin === "string") {
    out.liveStringByHandle = { ...out.liveStringByHandle, [socket.id]: pin };
    return;
  }
  if (socket.portType === "vector3") {
    const v = narrowVec3(pin);
    if (v != null) {
      out.liveVector3ByHandle = { ...out.liveVector3ByHandle, [socket.id]: v };
    }
  }
}

function remapInnerNodeId(hostNodeId: string, innerId: string): string {
  if (innerId.startsWith(`${hostNodeId}__`)) {
    return innerId;
  }
  return `${hostNodeId}__${innerId}`;
}

function readIncomingFlattenedPin(
  flattenedEdges: readonly Edge[],
  pinValues: Map<string, unknown>,
  targetNodeId: string,
  targetHandle: string,
): unknown {
  const edge = flattenedEdges.find(
    (e) =>
      e.target === targetNodeId &&
      (e.targetHandle ?? STUDIO_HANDLE_IN) === targetHandle,
  );
  if (edge == null) {
    return undefined;
  }
  const sourceHandle = edge.sourceHandle ?? STUDIO_HANDLE_OUT;
  return pinValues.get(studioFlowPinKey(edge.source, sourceHandle));
}

function resolveGroupInputSocketPin(args: {
  socket: StudioGroupSocketDef;
  boundaryNodeId: string;
  subgraphEdges: readonly Edge[];
  flattenedEdges: readonly Edge[];
  hostNodeId: string;
  pinValues: Map<string, unknown>;
}): unknown {
  const { socket, boundaryNodeId, subgraphEdges, flattenedEdges, hostNodeId, pinValues } =
    args;
  const bridge = subgraphEdges.find(
    (e) => e.source === boundaryNodeId && e.sourceHandle === socket.id,
  );
  if (bridge == null) {
    return undefined;
  }
  const remappedTarget = remapInnerNodeId(hostNodeId, bridge.target);
  const targetHandle = bridge.targetHandle ?? STUDIO_HANDLE_IN;
  const targetKey = studioFlowPinKey(remappedTarget, targetHandle);
  if (pinValues.has(targetKey)) {
    return pinValues.get(targetKey);
  }
  return readIncomingFlattenedPin(
    flattenedEdges,
    pinValues,
    remappedTarget,
    targetHandle,
  );
}

/** Resolve live socket readouts for Group Input / Group Output boundary nodes. */
export function buildStudioGroupBoundaryLiveFields(args: {
  role: "input" | "output";
  boundaryNodeId: string;
  iface: StudioGroupInterface;
  subgraphEdges: readonly Edge[];
  flattenedEdges: readonly Edge[];
  hostNodeId: string;
  pinValues: Map<string, unknown>;
}): StudioGroupBoundaryLiveFields {
  const {
    role,
    boundaryNodeId,
    iface,
    subgraphEdges,
    flattenedEdges,
    hostNodeId,
    pinValues,
  } = args;
  const out: StudioGroupBoundaryLiveFields = {};

  if (role === "input") {
    for (const socket of iface.inputs) {
      const pin = resolveGroupInputSocketPin({
        socket,
        boundaryNodeId,
        subgraphEdges,
        flattenedEdges,
        hostNodeId,
        pinValues,
      });
      applyPinToLiveFields(socket, pin, out);
    }
    return out;
  }

  for (const socket of iface.outputs) {
    const bridge = subgraphEdges.find(
      (e) => e.target === boundaryNodeId && e.targetHandle === socket.id,
    );
    if (bridge == null) {
      continue;
    }
    const remappedSource = remapInnerNodeId(hostNodeId, bridge.source);
    const handle = bridge.sourceHandle ?? "out";
    const pin = pinValues.get(studioFlowPinKey(remappedSource, handle));
    applyPinToLiveFields(socket, pin, out);
  }
  return out;
}

export function emptyStudioGroupBoundaryLiveFields(): StudioGroupBoundaryLiveFields {
  return {};
}

function mergeStudioGroupBoundaryLiveFields(
  ...parts: StudioGroupBoundaryLiveFields[]
): StudioGroupBoundaryLiveFields {
  const out: StudioGroupBoundaryLiveFields = {};
  for (const part of parts) {
    if (part.liveNumberByHandle != null) {
      out.liveNumberByHandle = { ...out.liveNumberByHandle, ...part.liveNumberByHandle };
    }
    if (part.liveBooleanByHandle != null) {
      out.liveBooleanByHandle = { ...out.liveBooleanByHandle, ...part.liveBooleanByHandle };
    }
    if (part.liveStringByHandle != null) {
      out.liveStringByHandle = { ...out.liveStringByHandle, ...part.liveStringByHandle };
    }
    if (part.liveVector3ByHandle != null) {
      out.liveVector3ByHandle = { ...out.liveVector3ByHandle, ...part.liveVector3ByHandle };
    }
  }
  return out;
}

/** Live readouts on the collapsed `studio-node-group` shell (parent graph). */
export function buildStudioNodeGroupHostLiveFields(args: {
  hostNodeId: string;
  subgraphKey: string;
  iface: StudioGroupInterface;
  parentEdges: readonly Edge[];
  subgraph: StudioSubgraphDocument;
  flattenedEdges: readonly Edge[];
  pinValues: Map<string, unknown>;
}): StudioGroupBoundaryLiveFields {
  const {
    hostNodeId,
    subgraphKey,
    iface,
    parentEdges,
    subgraph,
    flattenedEdges,
    pinValues,
  } = args;

  const inputLive: StudioGroupBoundaryLiveFields = {};
  for (const socket of iface.inputs) {
    const edge = parentEdges.find(
      (e) =>
        e.target === hostNodeId &&
        (e.targetHandle ?? STUDIO_HANDLE_IN) === socket.id,
    );
    const pin =
      edge != null
        ? pinValues.get(
            studioFlowPinKey(edge.source, edge.sourceHandle ?? STUDIO_HANDLE_OUT),
          )
        : socket.defaultValue;
    applyPinToLiveFields(socket, pin, inputLive);
  }

  const boundaryIds = groupBoundaryNodeIdsForHost(hostNodeId, subgraphKey);
  const outputLive = buildStudioGroupBoundaryLiveFields({
    role: "output",
    boundaryNodeId: boundaryIds.output,
    iface,
    subgraphEdges: subgraph.edges,
    flattenedEdges,
    hostNodeId,
    pinValues,
  });

  return mergeStudioGroupBoundaryLiveFields(inputLive, outputLive);
}
