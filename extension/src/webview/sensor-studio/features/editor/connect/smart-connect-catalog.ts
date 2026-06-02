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
  /** Null when type is not locked yet (untyped reroute/split); menu shows all, wire type resolved on pick. */
  portType: SmartConnectPortType | null;
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
  return entries.filter((entry) => entryMatchesSmartConnect(ctx, entry));
}

export function entryMatchesSmartConnect(
  ctx: SmartConnectDragContext,
  entry: NodeCatalogEntry,
): boolean {
  if (entry.defaultVisible === false) {
    return false;
  }
  if (ctx.portType == null) {
    return true;
  }
  if (ctx.handleType === "source") {
    return entryAcceptsPortOnInput(entry, ctx.portType);
  }
  return entryProvidesPortOnOutput(entry, ctx.portType);
}

/** Obvious number sinks when dragging from a numeric output. */
const NUMBER_OUTPUT_SINK_IDS = [
  "plotter",
  "sparkline",
  "gauge",
  "radial-gauge",
  "bar-meter",
] as const;

export type SmartConnectRankHints = {
  recentCatalogIds?: readonly string[];
  /** When true (default), compatible entries sort above non-compatible (Shift full menu). */
  preferCompatible?: boolean;
};

function scoreSmartConnectEntry(
  entry: NodeCatalogEntry,
  ctx: SmartConnectDragContext,
  compatibleIds: ReadonlySet<string>,
  recentCatalogIds: readonly string[],
  preferCompatible: boolean,
): number {
  let score = 0;
  if (preferCompatible && compatibleIds.has(entry.id)) {
    score += 10_000;
  }
  const recentIndex = recentCatalogIds.indexOf(entry.id);
  if (recentIndex >= 0) {
    score += 1_000 - recentIndex;
  }
  if (ctx.portType != null && ctx.handleType === "source" && ctx.portType === "number") {
    const sinkIndex = NUMBER_OUTPUT_SINK_IDS.indexOf(
      entry.id as (typeof NUMBER_OUTPUT_SINK_IDS)[number],
    );
    if (sinkIndex >= 0) {
      score += 200 - sinkIndex;
    }
  }
  return score;
}

/** Stable sort: recent + compatible-first + obvious sinks at the top. */
export function rankCatalogEntriesForSmartConnect(
  entries: readonly NodeCatalogEntry[],
  ctx: SmartConnectDragContext,
  hints?: SmartConnectRankHints,
): NodeCatalogEntry[] {
  if (entries.length <= 1) {
    return [...entries];
  }
  const recentCatalogIds = hints?.recentCatalogIds ?? [];
  const preferCompatible =
    ctx.portType != null && hints?.preferCompatible !== false;
  const compatibleIds = new Set(
    filterCatalogEntriesForSmartConnect(entries, ctx).map((e) => e.id),
  );
  const scored = entries.map((entry, index) => ({
    entry,
    index,
    score: scoreSmartConnectEntry(
      entry,
      ctx,
      compatibleIds,
      recentCatalogIds,
      preferCompatible,
    ),
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((row) => row.entry);
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

function resolveSmartConnectWirePortType(
  ctx: SmartConnectDragContext,
  entry: NodeCatalogEntry,
): SmartConnectPortType | null {
  if (ctx.portType != null) {
    return ctx.portType;
  }
  if (ctx.handleType === "source") {
    const ports = entry.inputPorts;
    if (ports != null && ports.length > 0) {
      return ports[0]!.portType;
    }
    const legacy = (entry.defaultConfig as { inputType?: string } | undefined)
      ?.inputType;
    return legacy != null ? (legacy as SmartConnectPortType) : null;
  }
  const ports = entry.outputPorts;
  if (ports != null && ports.length > 0) {
    return ports[0]!.portType;
  }
  const legacy = (entry.defaultConfig as { outputType?: string } | undefined)
    ?.outputType;
  return legacy != null ? (legacy as SmartConnectPortType) : null;
}

/** Build a connection from the drag origin to a newly spawned catalog node. */
export function buildSmartConnectAutoWire(
  ctx: SmartConnectDragContext,
  newNodeId: string,
  entry: NodeCatalogEntry,
): SmartConnectAutoWire | null {
  const portType = resolveSmartConnectWirePortType(ctx, entry);
  if (portType == null) {
    return null;
  }
  if (ctx.handleType === "source") {
    return {
      source: ctx.nodeId,
      sourceHandle: ctx.handleId,
      target: newNodeId,
      targetHandle: pickInputHandle(entry, portType),
    };
  }
  return {
    source: newNodeId,
    sourceHandle: pickOutputHandle(entry, portType),
    target: ctx.nodeId,
    targetHandle: ctx.handleId,
  };
}
