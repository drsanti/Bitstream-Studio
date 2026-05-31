import type { StudioNodeAssetFile } from "../features/editor/subgraphs/node-library/studio-node-asset-file";
import {
  STUDIO_NODE_ASSET_MARKER,
  STUDIO_NODE_ASSET_VERSION,
} from "../features/editor/subgraphs/node-library/studio-node-asset-file";

const STORAGE_KEY = "sensor-studio:node-group-library:v1";

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

export type PersistedNodeGroupLibraryV1 = {
  version: 1;
  updatedAt: string;
  assets: StudioNodeAssetFile[];
};

function isValidAsset(raw: unknown): raw is StudioNodeAssetFile {
  if (raw == null || typeof raw !== "object") {
    return false;
  }
  const o = raw as Partial<StudioNodeAssetFile>;
  return (
    o.marker === STUDIO_NODE_ASSET_MARKER &&
    o.version === STUDIO_NODE_ASSET_VERSION &&
    o.meta != null &&
    typeof o.meta.name === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    o.subgraphs != null &&
    typeof o.subgraphs === "object"
  );
}

export function readPersistedNodeGroupLibrary(): StudioNodeAssetFile[] {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return [];
  }
  const raw = ls.getItem(STORAGE_KEY);
  if (raw == null) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedNodeGroupLibraryV1>;
    if (parsed.version !== 1 || !Array.isArray(parsed.assets)) {
      return [];
    }
    return parsed.assets.filter(isValidAsset);
  } catch {
    return [];
  }
}

export function writePersistedNodeGroupLibrary(assets: StudioNodeAssetFile[]): void {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return;
  }
  const payload: PersistedNodeGroupLibraryV1 = {
    version: 1,
    updatedAt: new Date().toISOString(),
    assets,
  };
  ls.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedNodeGroupLibrary(): void {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return;
  }
  ls.removeItem(STORAGE_KEY);
}
