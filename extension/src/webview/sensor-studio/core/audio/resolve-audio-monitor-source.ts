import type { Node } from "@xyflow/react";

/** Monitor routing is opt-in via `monitorModeEnabled` (v0.2). Unwired sinks stay idle otherwise. */
export function readMonitorModeEnabled(cfg: Record<string, unknown>): boolean {
  return cfg.monitorModeEnabled === true;
}

function isAudioSourceCatalogId(nodeId: string | undefined): boolean {
  return (
    nodeId === "mic-input" ||
    nodeId === "audio-oscillator" ||
    nodeId === "audio-file-player" ||
    nodeId === "audio-sfx" ||
    nodeId === "audio-machine"
  );
}

export type AudioBusEdge = {
  target?: string | null;
  targetHandle?: string | null;
  source?: string | null;
};

/** Wired `audio` input on a sink (`audio-output`, `audio-scope`, …). */
export function findWiredAudioBusSourceNodeId(
  sinkNodeId: string,
  edges: ReadonlyArray<AudioBusEdge>,
): string | null {
  const edge = edges.find(
    (e) => e.target === sinkNodeId && (e.targetHandle ?? "in") === "audio",
  );
  const source = edge?.source;
  return typeof source === "string" && source.length > 0 ? source : null;
}

/**
 * Resolve monitor routing for audio-output / audio-scope when no `audioBus` edge is wired.
 * Returns null when monitor is off, mode is `none`, or no candidate source exists.
 * Does not use canvas selection — routing follows wires, explicit node id, or nearest source.
 */
export function resolveAudioMonitorSourceNodeId(args: {
  forNodeId: string;
  monitorModeEnabled: boolean;
  sourceMode: unknown;
  explicitSourceNodeId: unknown;
  nodes: Node[];
}): string | null {
  if (!args.monitorModeEnabled) {
    return null;
  }

  const mode = typeof args.sourceMode === "string" ? args.sourceMode : "none";
  if (mode === "none") {
    return null;
  }

  const explicit =
    typeof args.explicitSourceNodeId === "string" ? args.explicitSourceNodeId.trim() : "";
  if (mode === "node" && explicit.length > 0) {
    return explicit;
  }

  const anchor = args.nodes.find((n) => n.id === args.forNodeId);
  const ax = anchor?.position?.x ?? 0;
  const ay = anchor?.position?.y ?? 0;
  const candidates = args.nodes.filter(
    (n) => n.type === "studio" && isAudioSourceCatalogId(n.data.nodeId),
  );
  if (candidates.length === 0) {
    return null;
  }

  let best: { id: string; d: number } | null = null;
  for (const c of candidates) {
    const dx = (c.position?.x ?? 0) - ax;
    const dy = (c.position?.y ?? 0) - ay;
    const d = dx * dx + dy * dy;
    if (best == null || d < best.d) {
      best = { id: c.id, d };
    }
  }
  return best?.id ?? candidates[0]!.id;
}

/** Wired `audio` input wins; otherwise optional monitor resolution. */
export function resolveAudioSinkSourceNodeId(args: {
  sinkNodeId: string;
  cfg: Record<string, unknown>;
  nodes: Node[];
  edges: ReadonlyArray<AudioBusEdge>;
  wiredSourceNodeId?: string | null;
}): string | null {
  const wired = (args.wiredSourceNodeId ?? "").trim();
  if (wired.length > 0) {
    return wired;
  }
  const fromEdge = findWiredAudioBusSourceNodeId(args.sinkNodeId, args.edges);
  if (fromEdge != null) {
    return fromEdge;
  }
  return resolveAudioMonitorSourceNodeId({
    forNodeId: args.sinkNodeId,
    monitorModeEnabled: readMonitorModeEnabled(args.cfg),
    sourceMode: args.cfg.sourceMode,
    explicitSourceNodeId: args.cfg.sourceNodeId,
    nodes: args.nodes,
  });
}
