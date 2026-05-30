// Dev note: bump `THUMBNAIL_CACHE_VERSION` to force thumbnail regeneration
// after model content changes (e.g., after rebuilding/bundling assets).
const THUMBNAIL_CACHE_VERSION = 'v7';

interface StoredThumbnail {
  dataUrl: string;
  cachedAt: number;
}

function getCacheKey(modelId: string): string {
  // modelId is typically a Vite asset URL, so keep it as-is for uniqueness.
  return `t3d-model-catalog-thumb:${THUMBNAIL_CACHE_VERSION}:${modelId}`;
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

function isQuotaExceededError(err: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' &&
      err instanceof DOMException &&
      err.name === 'QuotaExceededError') ||
    (err instanceof Error && err.name === 'QuotaExceededError')
  );
}

/** Keys for the active cache version only (used for LRU eviction). */
const VERSIONED_KEY_PREFIX = `t3d-model-catalog-thumb:${THUMBNAIL_CACHE_VERSION}:`;

/**
 * Lists thumbnail entries for the current cache version, oldest first (LRU order).
 */
function listVersionedThumbnailEntriesSortedByAge(
  storage: Storage,
): Array<{ key: string; cachedAt: number }> {
  const out: Array<{ key: string; cachedAt: number }> = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key == null || !key.startsWith(VERSIONED_KEY_PREFIX)) {
      continue;
    }
    const raw = storage.getItem(key);
    if (!raw) {
      continue;
    }
    try {
      const parsed = JSON.parse(raw) as StoredThumbnail;
      const cachedAt =
        typeof parsed.cachedAt === 'number' ? parsed.cachedAt : 0;
      out.push({ key, cachedAt });
    } catch {
      storage.removeItem(key);
    }
  }
  return out.sort((a, b) => a.cachedAt - b.cachedAt);
}

/**
 * Removes every key for the current thumbnail cache version (not other versions).
 */
function removeAllCurrentVersionThumbnailKeys(storage: Storage): void {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key != null && key.startsWith(VERSIONED_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((k) => {
    try {
      storage.removeItem(k);
    } catch {
      // ignore
    }
  });
}

export async function getThumbnailFromCache(
  modelId: string,
): Promise<string | null> {
  const storage = safeLocalStorage();
  if (!storage) return null;

  const key = getCacheKey(modelId);
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredThumbnail;
    if (typeof parsed.dataUrl !== 'string') return null;
    return parsed.dataUrl;
  } catch {
    return null;
  }
}

export async function setThumbnailInCache(
  modelId: string,
  dataUrl: string,
): Promise<void> {
  const storage = safeLocalStorage();
  if (!storage) return;

  const key = getCacheKey(modelId);
  const payload: StoredThumbnail = {
    dataUrl,
    cachedAt: Date.now(),
  };
  const serialized = JSON.stringify(payload);

  try {
    storage.setItem(key, serialized);
    return;
  } catch (err) {
    if (!isQuotaExceededError(err)) {
      console.warn('[thumbnail-cache] Failed to persist thumbnail:', err);
      return;
    }
  }

  const candidates = listVersionedThumbnailEntriesSortedByAge(storage).filter(
    (e) => e.key !== key,
  );

  for (const candidate of candidates) {
    try {
      storage.removeItem(candidate.key);
    } catch {
      continue;
    }
    try {
      storage.setItem(key, serialized);
      return;
    } catch (err2) {
      if (!isQuotaExceededError(err2)) {
        console.warn('[thumbnail-cache] Failed to persist thumbnail:', err2);
        return;
      }
    }
  }

  // Last resort: drop entire current-version cache and try once (handles pathological single-key bloat).
  removeAllCurrentVersionThumbnailKeys(storage);
  try {
    storage.setItem(key, serialized);
    return;
  } catch (err3) {
    if (isQuotaExceededError(err3)) {
      // Single entry may exceed ~5MB localStorage limit; in-memory thumb still works for the session.
      console.debug(
        '[thumbnail-cache] Thumbnail too large for localStorage or quota still exceeded; skipped persist.',
        { modelId },
      );
    } else {
      console.warn('[thumbnail-cache] Failed to persist thumbnail:', err3);
    }
  }
}

export const thumbnailCacheVersion = THUMBNAIL_CACHE_VERSION;

const CACHE_KEY_PREFIX = 't3d-model-catalog-thumb:';

/**
 * Clears all model-catalog thumbnail entries from localStorage.
 * Useful during development when models change frequently.
 */
export function clearThumbnailCache(): void {
  const storage = safeLocalStorage();
  if (!storage) return;

  const keysToRemove: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key != null && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => storage.removeItem(k));
  } catch (err) {
    console.warn('[thumbnail-cache] Failed to clear cache:', err);
  }
}
