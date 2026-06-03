const STORAGE_KEY = "sensor-studio:flow-graph:v1";

import {
  coerceFlowCanvasPreferences,
  type FlowCanvasPreferences,
} from "./flow-canvas-preferences";
import { migrateStageSceneFlowNode } from "../core/stage/stage-scene-defaults";
import { migrateLegacyPackModelInDefaultConfig } from "./migrate-legacy-pack-model";

function migratePersistedFlowNode(raw: unknown): unknown {
  if (raw == null || typeof raw !== "object") {
    return raw;
  }
  const n = raw as {
    data?: { nodeId?: string; defaultConfig?: Record<string, unknown> };
  };
  const nodeId = n.data?.nodeId;
  const dc = n.data?.defaultConfig;
  if (nodeId == null || dc == null) {
    return raw;
  }
  let nextDc = migrateLegacyPackModelInDefaultConfig(dc, nodeId);
  const stageMigrated = migrateStageSceneFlowNode({
    data: { nodeId, defaultConfig: nextDc },
  });
  if (stageMigrated != null) {
    nextDc = stageMigrated.data.defaultConfig;
  }
  if (nextDc === dc) {
    return raw;
  }
  return {
    ...n,
    data: { ...n.data, defaultConfig: nextDc },
  };
}

function migratePersistedFlowNodes(nodes: unknown[]): unknown[] {
  return nodes.map((n) => migratePersistedFlowNode(n));
}

function migratePersistedSubgraphs(
  subgraphs: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (subgraphs == null) {
    return undefined;
  }
  let changed = false;
  const out: Record<string, unknown> = {};
  for (const [id, doc] of Object.entries(subgraphs)) {
    if (doc == null || typeof doc !== "object") {
      out[id] = doc;
      continue;
    }
    const d = doc as { nodes?: unknown[] };
    if (!Array.isArray(d.nodes)) {
      out[id] = doc;
      continue;
    }
    const nodes = migratePersistedFlowNodes(d.nodes);
    if (nodes !== d.nodes) {
      changed = true;
      out[id] = { ...d, nodes };
    } else {
      out[id] = doc;
    }
  }
  return changed ? out : subgraphs;
}

function getWebLocalStorage(): Storage | null {
  if (typeof globalThis === "undefined") {
    return null;
  }
  const g = globalThis as unknown as { localStorage?: Storage; window?: { localStorage?: Storage } };
  if (typeof g.window !== "undefined" && g.window?.localStorage != null) {
    return g.window.localStorage;
  }
  if (g.localStorage != null) {
    return g.localStorage;
  }
  return null;
}

export type StudioPersistedViewport = {
  x: number;
  y: number;
  zoom: number;
};

export function isValidStudioPersistedViewport(value: unknown): value is StudioPersistedViewport {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  const { x, y, zoom } = o;
  return (
    typeof x === "number" &&
    typeof y === "number" &&
    typeof zoom === "number" &&
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    Number.isFinite(zoom) &&
    zoom > 0
  );
}

export type PersistedFlowDocumentV1 = {
  version: 1;
  updatedAt: string;
  nodes: unknown[];
  edges: unknown[];
  selectedNodeId: string | null;
  /** Multi-selection from React Flow; omitted in older saves. */
  selectedNodeIds?: string[];
  /** Nested node-group documents keyed by group / subgraph id. */
  subgraphs?: Record<string, unknown>;
  activeGraphId?: string;
  graphStack?: string[];
  rootNodes?: unknown[];
  rootEdges?: unknown[];
  viewport?: StudioPersistedViewport;
  /** Optional flow canvas chrome (grid, minimap, edge routing, etc.). */
  canvasPreferences?: FlowCanvasPreferences;
};

export function readPersistedFlowDocument(): PersistedFlowDocumentV1 | null {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return null;
  }
  const raw = ls.getItem(STORAGE_KEY);
  if (raw == null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PersistedFlowDocumentV1;
    if (parsed.version !== 1 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null;
    }
    const viewport =
      parsed.viewport != null && isValidStudioPersistedViewport(parsed.viewport)
        ? parsed.viewport
        : undefined;
    const canvasPreferences =
      parsed.canvasPreferences != null
        ? coerceFlowCanvasPreferences(parsed.canvasPreferences)
        : undefined;
    const nodes = migratePersistedFlowNodes(parsed.nodes);
    const rootNodes =
      parsed.rootNodes != null ? migratePersistedFlowNodes(parsed.rootNodes) : undefined;
    const subgraphs = migratePersistedSubgraphs(
      parsed.subgraphs as Record<string, unknown> | undefined,
    );
    return {
      ...parsed,
      nodes,
      ...(rootNodes != null ? { rootNodes } : {}),
      ...(subgraphs != null ? { subgraphs } : {}),
      viewport,
      canvasPreferences,
    };
  } catch {
    return null;
  }
}

export function writePersistedFlowDocument(doc: Omit<PersistedFlowDocumentV1, "updatedAt">): void {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return;
  }
  const payload: PersistedFlowDocumentV1 = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };
  ls.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedFlowDocument(): void {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return;
  }
  ls.removeItem(STORAGE_KEY);
}
