import { useCallback, useEffect, useState } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  clearRemoteNodeGraphCache,
  readRemoteNodeGraphCache,
  writeRemoteNodeGraphCache,
} from "./node-group-remote-cache";
import {
  fetchRemoteNodeGraphAssetText,
  fetchRemoteNodeGraphIndex,
  parseRemoteNodeGraphIndex,
  type RemoteNodeGraphIndexEntry,
} from "./remote-node-graph-index";
import { parseStudioNodeAssetFile } from "./studio-node-asset-file";

export type RemoteNodeGraphLoadState = "idle" | "loading" | "ready" | "error";

export type RemoteNodeGraphSyncState = "idle" | "loading" | "fresh" | "cached" | "offline";

function registerParsedPreset(
  registerRemoteNodeGraphAsset: ReturnType<typeof useFlowEditorStore.getState>["registerRemoteNodeGraphAsset"],
  entry: RemoteNodeGraphIndexEntry,
  text: string,
): boolean {
  const parsed = parseStudioNodeAssetFile(text);
  if (parsed == null) {
    return false;
  }
  registerRemoteNodeGraphAsset({
    ...parsed,
    meta: {
      ...parsed.meta,
      id: entry.id,
      name: entry.name,
      description: entry.description ?? parsed.meta.description,
      category:
        entry.category != null
          ? (entry.category as typeof parsed.meta.category)
          : parsed.meta.category,
    },
  });
  return true;
}

export function useRemoteNodeGraphPresets(enabled: boolean): {
  state: RemoteNodeGraphLoadState;
  syncState: RemoteNodeGraphSyncState;
  entries: RemoteNodeGraphIndexEntry[];
  fetchedAtMs: number | null;
  retry: () => void;
  refreshFromNetwork: () => void;
} {
  const registerRemoteNodeGraphAsset = useFlowEditorStore((s) => s.registerRemoteNodeGraphAsset);
  const clearRemoteNodeGraphAssets = useFlowEditorStore((s) => s.clearRemoteNodeGraphAssets);
  const [state, setState] = useState<RemoteNodeGraphLoadState>("idle");
  const [syncState, setSyncState] = useState<RemoteNodeGraphSyncState>("idle");
  const [entries, setEntries] = useState<RemoteNodeGraphIndexEntry[]>([]);
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
      const cache = readRemoteNodeGraphCache();
      if (cache == null) {
        return false;
      }
      let index: ReturnType<typeof parseRemoteNodeGraphIndex>;
      try {
        index = parseRemoteNodeGraphIndex(JSON.parse(cache.indexJson));
      } catch {
        return false;
      }
      if (index == null) {
        return false;
      }
      clearRemoteNodeGraphAssets();
      let loadedAny = false;
      for (const entry of index.entries) {
        const text = cache.assetsById[entry.id];
        if (text == null) {
          continue;
        }
        if (registerParsedPreset(registerRemoteNodeGraphAsset, entry, text)) {
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
        clearRemoteNodeGraphCache();
      }
      setState("loading");
      setSyncState("loading");
      clearRemoteNodeGraphAssets();

      const index = await fetchRemoteNodeGraphIndex();
      if (cancelled) {
        return;
      }

      if (index != null) {
        setEntries(index.entries);
        const assetsById: Record<string, string> = {};
        let loadedAny = false;

        for (const entry of index.entries) {
          const text = await fetchRemoteNodeGraphAssetText(entry.file);
          if (cancelled) {
            return;
          }
          if (text == null) {
            continue;
          }
          assetsById[entry.id] = text;
          if (registerParsedPreset(registerRemoteNodeGraphAsset, entry, text)) {
            loadedAny = true;
          }
        }

        if (loadedAny) {
          const now = Date.now();
          writeRemoteNodeGraphCache({
            fetchedAtMs: now,
            indexJson: JSON.stringify(index),
            assetsById,
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
    clearRemoteNodeGraphAssets,
    enabled,
    registerRemoteNodeGraphAsset,
    syncGeneration,
  ]);

  return { state, syncState, entries, fetchedAtMs, retry, refreshFromNetwork };
}
