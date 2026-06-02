import type { Node } from "@xyflow/react";

/** v0.1 graphs used `sourceMode` alone; v0.2 adds an explicit monitor toggle. */
export function readMonitorModeEnabled(cfg: Record<string, unknown>): boolean {
  if (typeof cfg.monitorModeEnabled === "boolean") {
    return cfg.monitorModeEnabled;
  }
  const mode = typeof cfg.sourceMode === "string" ? cfg.sourceMode : "none";
  return mode !== "none";
}

function isAudioSourceCatalogId(nodeId: string | undefined): boolean {
  return (
    nodeId === "mic-input" ||
    nodeId === "audio-oscillator" ||
    nodeId === "audio-file-player"
  );
}

/**
 * Resolve monitor routing for audio-output / audio-scope when no `audioBus` edge is wired.
 * Returns null when monitor is off, mode is `none`, or no candidate source exists.
 */
export function resolveAudioMonitorSourceNodeId(args: {
  forNodeId: string;
  monitorModeEnabled: boolean;
  sourceMode: unknown;
  explicitSourceNodeId: unknown;
  nodes: Node[];
  selectedNodeId: string | null | undefined;
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

  const selectedId = args.selectedNodeId;
  if (typeof selectedId === "string" && selectedId.length > 0) {
    const selected = args.nodes.find((n) => n.id === selectedId);
    if (selected?.type === "studio" && isAudioSourceCatalogId(selected.data.nodeId)) {
      return selected.id;
    }
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
  edges: Array<{ target?: string | null; targetHandle?: string | null; source?: string | null }>;
  selectedNodeId: string | null | undefined;
  wiredSourceNodeId?: string | null;
}): string | null {
  const wired = (args.wiredSourceNodeId ?? "").trim();
  if (wired.length > 0) {
    return wired;
  }
  return resolveAudioMonitorSourceNodeId({
    forNodeId: args.sinkNodeId,
    monitorModeEnabled: readMonitorModeEnabled(args.cfg),
    sourceMode: args.cfg.sourceMode,
    explicitSourceNodeId: args.cfg.sourceNodeId,
    nodes: args.nodes,
    selectedNodeId: args.selectedNodeId,
  });
}
