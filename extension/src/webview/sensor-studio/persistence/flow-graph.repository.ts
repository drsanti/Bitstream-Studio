const STORAGE_KEY = "sensor-studio:flow-graph:v1";

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

/** React Flow viewport (canvas pan and zoom). Optional on persisted graphs. */
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
  viewport?: StudioPersistedViewport;
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
    return { ...parsed, viewport };
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
