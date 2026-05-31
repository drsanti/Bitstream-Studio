import { useEffect, useState } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  fetchRemoteNodeGraphAssetText,
  fetchRemoteNodeGraphIndex,
  type RemoteNodeGraphIndexEntry,
} from "./remote-node-graph-index";
import { parseStudioNodeAssetFile } from "./studio-node-asset-file";

export type RemoteNodeGraphLoadState = "idle" | "loading" | "ready" | "error";

export function useRemoteNodeGraphPresets(enabled: boolean): {
  state: RemoteNodeGraphLoadState;
  entries: RemoteNodeGraphIndexEntry[];
} {
  const registerRemoteNodeGraphAsset = useFlowEditorStore((s) => s.registerRemoteNodeGraphAsset);
  const clearRemoteNodeGraphAssets = useFlowEditorStore((s) => s.clearRemoteNodeGraphAssets);
  const [state, setState] = useState<RemoteNodeGraphLoadState>("idle");
  const [entries, setEntries] = useState<RemoteNodeGraphIndexEntry[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;

    void (async () => {
      setState("loading");
      clearRemoteNodeGraphAssets();
      const index = await fetchRemoteNodeGraphIndex();
      if (cancelled) {
        return;
      }
      if (index == null) {
        setEntries([]);
        setState("error");
        return;
      }
      setEntries(index.entries);

      for (const entry of index.entries) {
        const text = await fetchRemoteNodeGraphAssetText(entry.file);
        if (cancelled || text == null) {
          continue;
        }
        const parsed = parseStudioNodeAssetFile(text);
        if (parsed == null) {
          continue;
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
      }

      if (!cancelled) {
        setState("ready");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearRemoteNodeGraphAssets, enabled, registerRemoteNodeGraphAsset]);

  return { state, entries };
}
