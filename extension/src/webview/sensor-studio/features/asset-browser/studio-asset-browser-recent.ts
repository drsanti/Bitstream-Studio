const STORAGE_KEY = "ternion.sensorStudio.assetBrowser.recentAssetIds.v1";
const SORT_STORAGE_KEY = "ternion.sensorStudio.assetBrowser.sortBy.v1";
const MAX_IDS = 32;

export type StudioAssetBrowserSortBy = "label" | "recent";

function readSortByRaw(): StudioAssetBrowserSortBy {
  if (typeof window === "undefined" || window.localStorage == null) {
    return "label";
  }
  const raw = window.localStorage.getItem(SORT_STORAGE_KEY);
  return raw === "recent" ? "recent" : "label";
}

export function readStudioAssetBrowserSortBy(): StudioAssetBrowserSortBy {
  return readSortByRaw();
}

export function writeStudioAssetBrowserSortBy(mode: StudioAssetBrowserSortBy): void {
  if (typeof window === "undefined" || window.localStorage == null) {
    return;
  }
  try {
    window.localStorage.setItem(SORT_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

function parseStored(raw: string | null): string[] {
  if (raw == null || raw.length === 0) {
    return [];
  }
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) {
      return [];
    }
    return v.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

/** Newest-first stable asset ids for Asset Browser MRU ordering. */
export function readRecentStudioAssetIds(): string[] {
  if (typeof window === "undefined" || window.localStorage == null) {
    return [];
  }
  return parseStored(window.localStorage.getItem(STORAGE_KEY)).slice(0, MAX_IDS);
}

/** Push `id` to the front of the MRU list (deduped, capped). Call only on explicit user picks. */
export function recordStudioAssetRecentPick(id: string): void {
  if (typeof window === "undefined" || window.localStorage == null) {
    return;
  }
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return;
  }
  const prev = parseStored(window.localStorage.getItem(STORAGE_KEY));
  const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, MAX_IDS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode — ignore.
  }
}
