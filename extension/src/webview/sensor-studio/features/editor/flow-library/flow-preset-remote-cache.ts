const STORAGE_KEY = "sensor-studio:flow-preset-remote-cache:v1";

export type RemoteFlowPresetCacheSnapshot = {
  fetchedAtMs: number;
  indexJson: string;
  presetsById: Record<string, string>;
};

export function readRemoteFlowPresetCache(): RemoteFlowPresetCacheSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw == null) {
      return null;
    }
    const parsed = JSON.parse(raw) as RemoteFlowPresetCacheSnapshot;
    if (
      parsed == null ||
      typeof parsed !== "object" ||
      typeof parsed.fetchedAtMs !== "number" ||
      typeof parsed.indexJson !== "string" ||
      parsed.presetsById == null ||
      typeof parsed.presetsById !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeRemoteFlowPresetCache(snapshot: RemoteFlowPresetCacheSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota errors
  }
}

export function clearRemoteFlowPresetCache(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export { formatRemoteCacheAge } from "../subgraphs/node-library/node-group-remote-cache";
