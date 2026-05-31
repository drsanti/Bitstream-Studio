const STORAGE_KEY = "sensor-studio:recent-nodes";
const MAX_RECENT = 8;

function safeGet(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function readRecentCatalogNodeIds(): string[] {
  const raw = safeGet();
  if (raw == null || raw.length === 0) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string" || item.length === 0) {
        continue;
      }
      if (out.includes(item)) {
        continue;
      }
      out.push(item);
      if (out.length >= MAX_RECENT) {
        break;
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function pushRecentCatalogNodeId(nodeId: string): void {
  const trimmed = nodeId.trim();
  if (trimmed.length === 0) {
    return;
  }
  const prev = readRecentCatalogNodeIds().filter((id) => id !== trimmed);
  const next = [trimmed, ...prev].slice(0, MAX_RECENT);
  safeSet(JSON.stringify(next));
}

export function resolveRecentCatalogEntries<T extends { id: string }>(
  recentIds: readonly string[],
  entries: readonly T[],
): T[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const out: T[] = [];
  for (const id of recentIds) {
    const entry = byId.get(id);
    if (entry != null) {
      out.push(entry);
    }
  }
  return out;
}
