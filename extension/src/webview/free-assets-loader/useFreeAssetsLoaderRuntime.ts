import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVsCodeApi } from "../extension-bridge/getVsCodeApi";
import type { FreeAssetIndexEntry, FreeLocalAssetEntry } from "../../model-downloader/protocol";
import type { SyncTernionFreeAssetsProgress } from "../../asset-sync/syncTernionFreeAssets";
import { useFreeAssetsSyncOverWs } from "../asset-sync/useFreeAssetsSyncOverWs";
import { isVsCodeExtensionWebview } from "../isVsCodeExtensionWebview";
import { useModelDownloaderExtension } from "../model-downloader/useModelDownloaderExtension";

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Extension postMessage round-trip (local disk scan can be slow on first antivirus pass). */
const EXTENSION_LOCAL_LIST_TIMEOUT_MS = 120_000;
const EXTENSION_PACK_LIST_TIMEOUT_MS = 120_000;

export interface DefaultDownloadPaths {
  freeGithubRootFs: string;
  modelDownloadsRootFs: string;
  tesaiotTexturesRootFs: string;
  userAssetsRootFs: string;
}

export interface UseFreeAssetsLoaderRuntimeResult {
  isExtension: boolean;
  /** Default free-pack root from host; use `downloadRootFs` for the active sync target. */
  freeGithubRootFs: string;
  /** Effective folder for the next sync: user override or default `freeGithubRootFs`. */
  downloadRootFs: string;
  /** VS Code: native folder dialog for choosing where free-pack files sync. */
  supportsFolderPicker: boolean;
  pickDownloadFolder: () => Promise<void>;
  clearDownloadFolderOverride: () => void;
  /** Set when the user picked a folder; next sync uses this path. */
  downloadFolderOverrideFs: string | null;
  listIndex: () => Promise<FreeAssetIndexEntry[]>;
  listLocalFreeAssets: () => Promise<{
    entries: FreeLocalAssetEntry[];
    rootFs?: string;
  }>;
  localListLoading: boolean;
  syncDownload: (onlyRepoPaths?: string[]) => Promise<{
    outputRootDir: string;
    downloaded: number;
    totalBytes: number;
    errors: string[];
  }>;
  revealFolder: (absolutePath: string) => Promise<void>;
  copyPathToClipboard: (path: string) => Promise<void>;
  busy: boolean;
  listLoading: boolean;
  error: string | null;
  clearError: () => void;
  progress: SyncTernionFreeAssetsProgress | null;
  /** Browser bridge status for badge (stable reference). */
  bridge: { connectionState: string };
}

/**
 * VS Code: postMessage + window messages. Browser dev: WebSocket bridge.
 */
export function useFreeAssetsLoaderRuntime(active: boolean): UseFreeAssetsLoaderRuntimeResult {
  const isExtension = isVsCodeExtensionWebview();
  const { pickFolder: vscodePickFolder, isAvailable: vscodePickerAvailable } =
    useModelDownloaderExtension();
  const [downloadFolderOverrideFs, setDownloadFolderOverrideFs] = useState<string | null>(null);

  const {
    connect: wsConnect,
    disconnect: wsDisconnect,
    listFreeAssets: wsListFreeAssets,
    listLocalFreeAssets: wsListLocalFreeAssets,
    fetchDefaultBridgeOutputDir,
    syncFreeAssets: wsSyncFreeAssets,
    connectionState: wsConnectionState,
    busy: wsBusy,
    error: wsError,
    downloadProgress: wsDownloadProgress,
    clearError: wsClearError,
  } = useFreeAssetsSyncOverWs();

  const bridgeForUi = useMemo(
    () => ({ connectionState: wsConnectionState }),
    [wsConnectionState]
  );

  const [freeGithubRootFs, setFreeGithubRootFs] = useState("");
  const [busy, setBusy] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [localListLoading, setLocalListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncTernionFreeAssetsProgress | null>(null);

  const pendingRef = useRef(
    new Map<
      string,
      {
        resolve: (v: unknown) => void;
        reject: (e: Error) => void;
        timeoutId?: ReturnType<typeof setTimeout>;
      }
    >()
  );
  const listLoadingGenRef = useRef(0);
  const localListLoadingGenRef = useRef(0);

  useEffect(() => {
    if (!isExtension) return;
    const onMsg = (event: MessageEvent) => {
      const d = event.data as {
        type?: string;
        requestId?: string;
        defaultDownloadPaths?: DefaultDownloadPaths;
        freeAssetIndexEntries?: FreeAssetIndexEntry[];
        freeLocalAssetEntries?: FreeLocalAssetEntry[];
        freeLocalRootFs?: string;
        /** List/sync/reveal error */
        error?: string;
        assetSyncProgress?: SyncTernionFreeAssetsProgress;
        assetSyncResult?: {
          downloaded: number;
          totalBytes: number;
          outputRootDir: string;
          errors: string[];
        };
        revealPathOk?: boolean;
        revealPathError?: string;
      };
      if (d.type === "asset-default-download-paths-response" && d.defaultDownloadPaths) {
        setFreeGithubRootFs(d.defaultDownloadPaths.freeGithubRootFs);
        return;
      }
      if (!d?.requestId) return;
      const pending = pendingRef.current.get(d.requestId);
      if (!pending) {
        return;
      }
      if (d.type === "asset-free-pack-list-response") {
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        const err = d.error;
        if (err) {
          pending.reject(new Error(err));
        } else {
          pending.resolve(d.freeAssetIndexEntries ?? []);
        }
        pendingRef.current.delete(d.requestId);
        return;
      }
      if (d.type === "asset-free-local-list-response") {
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        const err = d.error;
        if (err) {
          pending.reject(new Error(err));
        } else {
          pending.resolve({
            entries: d.freeLocalAssetEntries ?? [],
            rootFs: d.freeLocalRootFs,
          });
        }
        pendingRef.current.delete(d.requestId);
        return;
      }
      if (d.type === "asset-sync-free-pack-complete") {
        const err = (d as { error?: string }).error;
        if (err) {
          pending.reject(new Error(err));
        } else if (d.assetSyncResult) {
          pending.resolve(d.assetSyncResult);
        } else {
          pending.reject(new Error("Sync completed without result"));
        }
        pendingRef.current.delete(d.requestId);
        setBusy(false);
        setProgress(null);
        return;
      }
      if (d.type === "asset-reveal-path-result") {
        if (d.revealPathOk) {
          pending.resolve(undefined);
        } else {
          pending.reject(new Error(d.revealPathError ?? "Reveal failed"));
        }
        pendingRef.current.delete(d.requestId);
        return;
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [isExtension]);

  useEffect(() => {
    if (!isExtension || !active) return;
    const vscodeApi = getVsCodeApi();
    if (!vscodeApi) return;
    const requestId = nextRequestId();
    vscodeApi.postMessage({ type: "asset-get-default-download-paths", requestId });
  }, [isExtension, active]);

  useEffect(() => {
    if (!isExtension) return;
    const onProgress = (event: MessageEvent) => {
      const d = event.data as { type?: string; requestId?: string; assetSyncProgress?: SyncTernionFreeAssetsProgress };
      if (d.type === "asset-sync-free-pack-progress" && d.assetSyncProgress) {
        setProgress(d.assetSyncProgress);
      }
    };
    window.addEventListener("message", onProgress);
    return () => window.removeEventListener("message", onProgress);
  }, [isExtension]);

  const clearError = useCallback(() => {
    setError(null);
    wsClearError();
  }, [wsClearError]);

  const supportsFolderPicker = isExtension && vscodePickerAvailable;

  const pickDownloadFolder = useCallback(async () => {
    const selected = await vscodePickFolder();
    if (selected?.trim()) {
      setDownloadFolderOverrideFs(selected.trim());
    }
  }, [vscodePickFolder]);

  const clearDownloadFolderOverride = useCallback(() => {
    setDownloadFolderOverrideFs(null);
  }, []);

  const downloadRootFs = downloadFolderOverrideFs ?? freeGithubRootFs;

  const listIndex = useCallback(async (): Promise<FreeAssetIndexEntry[]> => {
    setError(null);
    const gen = ++listLoadingGenRef.current;
    if (isExtension) {
      const vscodeApi = getVsCodeApi();
      if (!vscodeApi) throw new Error("VS Code API not available");
      setListLoading(true);
      try {
        const requestId = nextRequestId();
        return await new Promise<FreeAssetIndexEntry[]>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            pendingRef.current.delete(requestId);
            reject(new Error("Catalog list timed out"));
          }, EXTENSION_PACK_LIST_TIMEOUT_MS);
          pendingRef.current.set(requestId, {
            resolve: resolve as (v: unknown) => void,
            reject,
            timeoutId,
          });
          vscodeApi.postMessage({ type: "asset-free-pack-list", requestId });
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("Superseded by newer catalog request")) {
          setError(msg);
        }
        throw e;
      } finally {
        if (listLoadingGenRef.current === gen) {
          setListLoading(false);
        }
      }
    }
    setListLoading(true);
    try {
      await wsConnect();
      const { entries, defaultOutputRootDir } = await wsListFreeAssets();
      if (defaultOutputRootDir?.trim()) {
        setFreeGithubRootFs(defaultOutputRootDir.trim());
      }
      return entries;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("Superseded by newer catalog request")) {
        setError(msg);
      }
      throw e;
    } finally {
      if (listLoadingGenRef.current === gen) {
        setListLoading(false);
      }
    }
  }, [isExtension, wsConnect, wsListFreeAssets]);

  const listLocalFreeAssets = useCallback(async () => {
    setError(null);
    const gen = ++localListLoadingGenRef.current;
    if (isExtension) {
      const vscodeApi = getVsCodeApi();
      if (!vscodeApi) throw new Error("VS Code API not available");
      setLocalListLoading(true);
      try {
        const requestId = nextRequestId();
        return await new Promise<{
          entries: FreeLocalAssetEntry[];
          rootFs?: string;
        }>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            pendingRef.current.delete(requestId);
            reject(new Error("Local scan timed out"));
          }, EXTENSION_LOCAL_LIST_TIMEOUT_MS);
          pendingRef.current.set(requestId, {
            resolve: resolve as (v: unknown) => void,
            reject,
            timeoutId,
          });
          vscodeApi.postMessage({ type: "asset-free-local-list", requestId });
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("Superseded by newer local scan request")) {
          setError(msg);
        }
        throw e;
      } finally {
        if (localListLoadingGenRef.current === gen) {
          setLocalListLoading(false);
        }
      }
    }
    await wsConnect();
    setLocalListLoading(true);
    try {
      return await wsListLocalFreeAssets();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("Superseded by newer local scan request")) {
        setError(msg);
      }
      throw e;
    } finally {
      if (localListLoadingGenRef.current === gen) {
        setLocalListLoading(false);
      }
    }
  }, [isExtension, wsConnect, wsListLocalFreeAssets]);

  const syncDownload = useCallback(
    async (onlyRepoPaths?: string[]) => {
      setError(null);
      setProgress(null);
      if (isExtension) {
        const vscodeApi = getVsCodeApi();
        if (!vscodeApi) throw new Error("VS Code API not available");
        setBusy(true);
        try {
          const requestId = nextRequestId();
          return await new Promise<{
            outputRootDir: string;
            downloaded: number;
            totalBytes: number;
            errors: string[];
          }>((resolve, reject) => {
            pendingRef.current.set(requestId, { resolve: resolve as (v: unknown) => void, reject });
            const payload: Record<string, unknown> = {
              type: "asset-sync-free-pack-start",
              requestId,
            };
            if (onlyRepoPaths && onlyRepoPaths.length > 0) {
              payload.onlyRepoPaths = onlyRepoPaths;
            }
            if (downloadFolderOverrideFs?.trim()) {
              payload.outputDir = downloadFolderOverrideFs.trim();
            }
            vscodeApi.postMessage(payload);
          });
        } finally {
          setBusy(false);
          setProgress(null);
        }
      }
      await wsConnect();
      setBusy(true);
      try {
        const res = await wsSyncFreeAssets(
          downloadFolderOverrideFs?.trim() || undefined,
          onlyRepoPaths
        );
        if (res.error) {
          throw new Error(res.error);
        }
        return {
          outputRootDir: res.outputRootDir ?? "",
          downloaded: res.downloaded ?? 0,
          totalBytes: res.totalBytes ?? 0,
          errors: res.errors ?? [],
        };
      } finally {
        setBusy(false);
      }
    },
    [isExtension, wsConnect, wsSyncFreeAssets, downloadFolderOverrideFs]
  );

  const revealFolder = useCallback(
    async (absolutePath: string) => {
      if (isExtension) {
        const vscodeApi = getVsCodeApi();
        if (!vscodeApi) throw new Error("VS Code API not available");
        const requestId = nextRequestId();
        await new Promise<void>((resolve, reject) => {
          pendingRef.current.set(requestId, { resolve: resolve as (v: unknown) => void, reject });
          vscodeApi.postMessage({
            type: "reveal-path-in-os",
            requestId,
            absolutePath,
          });
        });
        return;
      }
      throw new Error("Use copy path in browser dev");
    },
    [isExtension]
  );

  const copyPathToClipboard = useCallback(async (pathToCopy: string) => {
    await navigator.clipboard.writeText(pathToCopy);
  }, []);

  useEffect(() => {
    if (!active || isExtension) return;
    let cancelled = false;
    void (async () => {
      try {
        await wsConnect();
        if (cancelled) return;
        const dir = await fetchDefaultBridgeOutputDir();
        if (!cancelled && dir) {
          setFreeGithubRootFs(dir);
        }
      } catch {
        /* connection / fetch errors surfaced on list/sync */
      }
    })();
    return () => {
      cancelled = true;
      void wsDisconnect();
    };
  }, [active, isExtension, wsConnect, wsDisconnect, fetchDefaultBridgeOutputDir]);

  return {
    isExtension,
    freeGithubRootFs,
    downloadRootFs,
    supportsFolderPicker,
    pickDownloadFolder,
    clearDownloadFolderOverride,
    downloadFolderOverrideFs,
    listIndex,
    listLocalFreeAssets,
    localListLoading,
    syncDownload,
    revealFolder,
    copyPathToClipboard,
    busy: busy || wsBusy,
    listLoading,
    error: error ?? wsError,
    clearError,
    progress: progress ?? (wsDownloadProgress
      ? {
          phase: wsDownloadProgress.phase,
          percent: wsDownloadProgress.percent,
          currentPath: wsDownloadProgress.currentPath,
          fileIndex: wsDownloadProgress.fileIndex,
          totalFiles: wsDownloadProgress.totalFiles,
        }
      : null),
    bridge: bridgeForUi,
  };
}
