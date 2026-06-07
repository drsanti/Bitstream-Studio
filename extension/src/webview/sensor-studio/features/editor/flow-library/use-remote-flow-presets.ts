import { useCallback, useEffect, useState } from "react";
import { useFlowEditorStore } from "../store/flow-editor.store";
import {
  clearRemoteFlowPresetCache,
  readRemoteFlowPresetCache,
  writeRemoteFlowPresetCache,
} from "./flow-preset-remote-cache";
import {
  fetchRemoteFlowPresetAssetText,
  fetchRemoteFlowPresetIndex,
  parseRemoteFlowPresetIndex,
  type RemoteFlowPresetIndexEntry,
} from "./remote-flow-preset-index";
import {
  isStudioFlowPresetCategory,
  parseStudioFlowPresetFile,
} from "./studio-flow-preset-file";

export type RemoteFlowPresetLoadState = "idle" | "loading" | "ready" | "error";

export type RemoteFlowPresetSyncState = "idle" | "loading" | "fresh" | "cached" | "offline";

function registerParsedPreset(
  registerRemoteFlowPreset: ReturnType<typeof useFlowEditorStore.getState>["registerRemoteFlowPreset"],
  entry: RemoteFlowPresetIndexEntry,
  text: string,
): boolean {
  const parsed = parseStudioFlowPresetFile(text);
  if (parsed == null) {
    return false;
  }
  const category = isStudioFlowPresetCategory(entry.category) ? entry.category : parsed.meta.category;
  registerRemoteFlowPreset({
    ...parsed,
    meta: {
      ...parsed.meta,
      id: entry.id,
      name: entry.name,
      description: entry.description ?? parsed.meta.description,
      category,
    },
  });
  return true;
}

export function useRemoteFlowPresets(enabled: boolean): {
  state: RemoteFlowPresetLoadState;
  syncState: RemoteFlowPresetSyncState;
  entries: RemoteFlowPresetIndexEntry[];
  fetchedAtMs: number | null;
  retry: () => void;
  refreshFromNetwork: () => void;
} {
  const registerRemoteFlowPreset = useFlowEditorStore((s) => s.registerRemoteFlowPreset);
  const clearRemoteFlowPresets = useFlowEditorStore((s) => s.clearRemoteFlowPresets);
  const [state, setState] = useState<RemoteFlowPresetLoadState>("idle");
  const [syncState, setSyncState] = useState<RemoteFlowPresetSyncState>("idle");
  const [entries, setEntries] = useState<RemoteFlowPresetIndexEntry[]>([]);
  const [fetchedAtMs, setFetchedAtMs] = useState<number | null>(null);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [clearCacheOnSync, setClearCacheOnSync] = useState(false);

  const retry = useCallback(() => {
    setClearCacheOnSync(false);
    setSyncGeneration((n) => n + 1);
  }, []);

  const refreshFromNetwork = useCallback(() => {
    setClearCacheOnSync(true);
    setSyncGeneration((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState("idle");
      setSyncState("idle");
      setEntries([]);
      setFetchedAtMs(null);
      return;
    }
    let cancelled = false;

    const hydrateFromCache = (): boolean => {
      const cache = readRemoteFlowPresetCache();
      if (cache == null) {
        return false;
      }
      let index: ReturnType<typeof parseRemoteFlowPresetIndex>;
      try {
        index = parseRemoteFlowPresetIndex(JSON.parse(cache.indexJson));
      } catch {
        return false;
      }
      if (index == null) {
        return false;
      }
      clearRemoteFlowPresets();
      let loadedAny = false;
      for (const entry of index.entries) {
        const text = cache.presetsById[entry.id];
        if (text == null) {
          continue;
        }
        if (registerParsedPreset(registerRemoteFlowPreset, entry, text)) {
          loadedAny = true;
        }
      }
      if (!loadedAny) {
        return false;
      }
      setEntries(index.entries);
      setFetchedAtMs(cache.fetchedAtMs);
      setState("ready");
      setSyncState("cached");
      return true;
    };

    void (async () => {
      if (clearCacheOnSync) {
        clearRemoteFlowPresetCache();
      }
      setState("loading");
      setSyncState("loading");
      clearRemoteFlowPresets();

      const index = await fetchRemoteFlowPresetIndex();
      if (cancelled) {
        return;
      }

      if (index != null) {
        setEntries(index.entries);
        const presetsById: Record<string, string> = {};
        let loadedAny = false;

        for (const entry of index.entries) {
          const text = await fetchRemoteFlowPresetAssetText(entry.file);
          if (cancelled) {
            return;
          }
          if (text == null) {
            continue;
          }
          presetsById[entry.id] = text;
          if (registerParsedPreset(registerRemoteFlowPreset, entry, text)) {
            loadedAny = true;
          }
        }

        if (loadedAny) {
          const now = Date.now();
          writeRemoteFlowPresetCache({
            fetchedAtMs: now,
            indexJson: JSON.stringify(index),
            presetsById,
          });
          setFetchedAtMs(now);
          setState("ready");
          setSyncState("fresh");
          return;
        }
      }

      if (hydrateFromCache()) {
        return;
      }

      setEntries([]);
      setFetchedAtMs(null);
      setState("error");
      setSyncState("offline");
    })();

    return () => {
      cancelled = true;
    };
  }, [
    clearCacheOnSync,
    clearRemoteFlowPresets,
    enabled,
    registerRemoteFlowPreset,
    syncGeneration,
  ]);

  return { state, syncState, entries, fetchedAtMs, retry, refreshFromNetwork };
}
