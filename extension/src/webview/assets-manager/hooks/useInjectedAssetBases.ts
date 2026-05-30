import { useCallback, useEffect, useRef, useState } from "react";
import { T3DAssetManager } from "@ternion/t3d";
import { T3DVSCodeUtils } from "@ternion/t3d/vscode-webview";
import { GlobalConfig } from "../../../GlobalConfig.js";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview.js";
import { normalizeAssetBaseUrl } from "../store/asset-presets.js";

export type InjectedAssetBasesSnapshot = {
  local: string;
  free: string;
  tesaiotTextures: string;
  online: string;
  /** Host echo of default online selection (same field as in `asset-config-response`). */
  currentBaseUrl: string;
};

function readBasesFromWindow(): InjectedAssetBasesSnapshot {
  if (typeof window === "undefined") {
    return { local: "", free: "", tesaiotTextures: "", online: "", currentBaseUrl: "" };
  }
  const local = window.LOCAL_ASSETS_BASE_URI?.trim() ?? "";
  const free = window.FREE_ASSETS_BASE_URI?.trim() ?? "";
  const tesaiotTextures = window.TESAIOT_TEXTURES_BASE_URI?.trim() ?? "";
  const online = window.ONLINE_ASSETS_BASE_URI?.trim() ?? "";
  return {
    local,
    free,
    tesaiotTextures,
    online,
    currentBaseUrl: online,
  };
}

function applySnapshotToWindow(snapshot: InjectedAssetBasesSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }
  window.LOCAL_ASSETS_BASE_URI = snapshot.local;
  window.FREE_ASSETS_BASE_URI = snapshot.free;
  window.TESAIOT_TEXTURES_BASE_URI = snapshot.tesaiotTextures;
  window.ONLINE_ASSETS_BASE_URI = snapshot.online;
}

function applySnapshotToEngine(snapshot: InjectedAssetBasesSnapshot): void {
  if (GlobalConfig.IS_DEV_MODE || !snapshot.online) {
    return;
  }
  try {
    T3DAssetManager.setAssetsBaseUrlToOnline(normalizeAssetBaseUrl(snapshot.online));
  } catch {
    // ignore if engine bundle not ready
  }
}

type AssetConfigPayload = {
  localAssetsBaseUrl: string;
  freeAssetsBaseUrl?: string;
  tesaiotTexturesBaseUrl?: string;
  onlineAssetsBaseUrl: string;
  currentBaseUrl: string;
};

function payloadToSnapshot(payload: AssetConfigPayload): InjectedAssetBasesSnapshot {
  return {
    local: payload.localAssetsBaseUrl.trim(),
    free: (payload.freeAssetsBaseUrl ?? "").trim(),
    tesaiotTextures: (payload.tesaiotTexturesBaseUrl ?? "").trim(),
    online: payload.onlineAssetsBaseUrl.trim(),
    currentBaseUrl: payload.currentBaseUrl.trim(),
  };
}

export type UseInjectedAssetBasesResult = {
  isExtensionHost: boolean;
  snapshot: InjectedAssetBasesSnapshot;
  /** True while waiting for `asset-config-response` after a refresh request. */
  refreshing: boolean;
  /** ISO timestamp of last successful host merge, or null. */
  lastHostRefreshAt: string | null;
  /** User-visible status after refresh or errors. */
  statusMessage: string | null;
  refreshFromHost: () => void;
};

/**
 * Tracks `window.LOCAL_ASSETS_BASE_URI` / `FREE` / `TESAIOT_TEXTURES` / `ONLINE` and refreshes them from the
 * extension host via `asset-config` → `asset-config-response` (same contract as a full reload).
 */
export function useInjectedAssetBases(): UseInjectedAssetBasesResult {
  const isExtensionHost = isVsCodeExtensionWebview();
  const [snapshot, setSnapshot] = useState<InjectedAssetBasesSnapshot>(readBasesFromWindow);
  const [refreshing, setRefreshing] = useState(false);
  const [lastHostRefreshAt, setLastHostRefreshAt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const awaitingHostRefreshRef = useRef(false);

  useEffect(() => {
    setSnapshot(readBasesFromWindow());
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const d = event.data as {
        type?: string;
        assetConfig?: AssetConfigPayload;
      };
      if (d.type !== "asset-config-response" || !d.assetConfig) {
        return;
      }
      const next = payloadToSnapshot(d.assetConfig);
      applySnapshotToWindow(next);
      applySnapshotToEngine(next);
      setSnapshot(next);
      if (awaitingHostRefreshRef.current) {
        awaitingHostRefreshRef.current = false;
        setRefreshing(false);
        setLastHostRefreshAt(new Date().toISOString());
        setStatusMessage("Runtime bases updated from host.");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const refreshFromHost = useCallback(() => {
    const vscodeApi = window.__VSCODE_API__ ?? T3DVSCodeUtils.getVsCodeApi();
    if (!isExtensionHost || vscodeApi == null) {
      setStatusMessage("Refresh is only available inside the VS Code / Cursor webview.");
      return;
    }
    awaitingHostRefreshRef.current = true;
    setRefreshing(true);
    setStatusMessage(null);
    vscodeApi.postMessage({ type: "asset-config" });
  }, [isExtensionHost]);

  useEffect(() => {
    if (!refreshing) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (awaitingHostRefreshRef.current) {
        awaitingHostRefreshRef.current = false;
        setRefreshing(false);
        setStatusMessage("Timed out waiting for asset-config response.");
      }
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [refreshing]);

  return {
    isExtensionHost,
    snapshot,
    refreshing,
    lastHostRefreshAt,
    statusMessage,
    refreshFromHost,
  };
}
