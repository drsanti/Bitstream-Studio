const STORAGE_KEY = "sensor-studio:node-group-remote-cache:v1";

export type RemoteNodeGraphCacheSnapshot = {
  fetchedAtMs: number;
  indexJson: string;
  assetsById: Record<string, string>;
};

export function readRemoteNodeGraphCache(): RemoteNodeGraphCacheSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw == null) {
      return null;
    }
    const parsed = JSON.parse(raw) as RemoteNodeGraphCacheSnapshot;
    if (
      parsed == null ||
      typeof parsed !== "object" ||
      typeof parsed.fetchedAtMs !== "number" ||
      typeof parsed.indexJson !== "string" ||
      parsed.assetsById == null ||
      typeof parsed.assetsById !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeRemoteNodeGraphCache(snapshot: RemoteNodeGraphCacheSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota errors
  }
}

export function clearRemoteNodeGraphCache(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function formatRemoteCacheAge(fetchedAtMs: number, nowMs = Date.now()): string {
  const deltaSec = Math.max(0, Math.round((nowMs - fetchedAtMs) / 1000));
  if (deltaSec < 60) {
    return `${deltaSec}s ago`;
  }
  const mins = Math.round(deltaSec / 60);
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hours = Math.round(mins / 60);
  return `${hours}h ago`;
}
