import type {
  NodeCatalogEntry,
  NodeCatalogOutputPort,
} from "../../../core/config/config-types";
import {
  STUDIO_HANDLE_IN,
  STUDIO_HANDLE_OUT,
} from "../store/flow-editor.store";

export type SmartConnectPortType = NodeCatalogOutputPort["portType"];

export type SmartConnectDragContext = {
  nodeId: string;
  handleId: string;
  /** React Flow handle role at drag start. */
  handleType: "source" | "target";
  portType: SmartConnectPortType;
};

function entryAcceptsPortOnInput(
  entry: NodeCatalogEntry,
  portType: SmartConnectPortType,
): boolean {
  if (entry.inputPorts != null && entry.inputPorts.length > 0) {
    return entry.inputPorts.some((p) => p.portType === portType);
  }
  const legacy = (entry.defaultConfig as { inputType?: string } | undefined)
    ?.inputType;
  return legacy === portType;
}

function entryProvidesPortOnOutput(
  entry: NodeCatalogEntry,
  portType: SmartConnectPortType,
): boolean {
  if (entry.outputPorts != null && entry.outputPorts.length > 0) {
    return entry.outputPorts.some((p) => p.portType === portType);
  }
  const legacy = (entry.defaultConfig as { outputType?: string } | undefined)
    ?.outputType;
  return legacy === portType;
}

/** Catalog rows compatible with a socket drag (output → consumer, input → producer). */
export function filterCatalogEntriesForSmartConnect(
  entries: readonly NodeCatalogEntry[],
  ctx: SmartConnectDragContext,
): NodeCatalogEntry[] {
  return entries.filter((entry) => {
    if (entry.defaultVisible === false) {
      return false;
    }
    if (ctx.handleType === "source") {
      return entryAcceptsPortOnInput(entry, ctx.portType);
    }
    return entryProvidesPortOnOutput(entry, ctx.portType);
  });
}

export type SmartConnectAutoWire = {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
};

function pickInputHandle(
  entry: NodeCatalogEntry,
  portType: SmartConnectPortType,
): string {
  const ports = entry.inputPorts;
  if (ports != null && ports.length > 0) {
    return ports.find((p) => p.portType === portType)?.id ?? ports[0]!.id;
  }
  return STUDIO_HANDLE_IN;
}

function pickOutputHandle(
  entry: NodeCatalogEntry,
  portType: SmartConnectPortType,
): string {
  const ports = entry.outputPorts;
  if (ports != null && ports.length > 0) {
    return ports.find((p) => p.portType === portType)?.id ?? ports[0]!.id;
  }
  return STUDIO_HANDLE_OUT;
}

/** Build a connection from the drag origin to a newly spawned catalog node. */
export function buildSmartConnectAutoWire(
  ctx: SmartConnectDragContext,
  newNodeId: string,
  entry: NodeCatalogEntry,
): SmartConnectAutoWire | null {
  if (ctx.handleType === "source") {
    return {
      source: ctx.nodeId,
      sourceHandle: ctx.handleId,
      target: newNodeId,
      targetHandle: pickInputHandle(entry, ctx.portType),
    };
  }
  return {
    source: newNodeId,
    sourceHandle: pickOutputHandle(entry, ctx.portType),
    target: ctx.nodeId,
    targetHandle: ctx.handleId,
  };
}
