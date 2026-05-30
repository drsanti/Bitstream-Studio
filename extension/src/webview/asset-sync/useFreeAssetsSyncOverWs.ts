import { useCallback, useEffect, useRef, useState } from "react";
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { getModelLoaderWsClientUrl } from "../runtimeWsUrls";
import {
  FREE_ASSETS_SYNC_TOPICS,
  type FreeAssetIndexEntry,
  type FreeAssetsDefaultPathResponse,
  type FreeAssetsListResponse,
  type FreeAssetsLocalListResponse,
  type FreeAssetsSyncProgressPayload,
  type FreeAssetsSyncResponse,
  type FreeLocalAssetEntry,
} from "../../model-downloader/protocol";

const SYNC_TIMEOUT_MS = 45 * 60 * 1000;

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface UseFreeAssetsSyncOverWsOptions {
  wsUrl?: string;
}

export interface FreeAssetsListResult {
  entries: FreeAssetIndexEntry[];
  defaultOutputRootDir?: string;
}

export interface FreeAssetsLocalListResult {
  entries: FreeLocalAssetEntry[];
  rootFs?: string;
}

export interface UseFreeAssetsSyncOverWsResult {
  connectionState: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  syncFreeAssets: (
    outputDir?: string,
    onlyRepoPaths?: string[]
  ) => Promise<FreeAssetsSyncResponse>;
  listFreeAssets: () => Promise<FreeAssetsListResult>;
  listLocalFreeAssets: () => Promise<FreeAssetsLocalListResult>;
  /** Resolves bridge default folder without listing GitHub (browser dev). */
  fetchDefaultBridgeOutputDir: () => Promise<string>;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  downloadProgress: FreeAssetsSyncProgressPayload | null;
}

export function useFreeAssetsSyncOverWs(
  options: UseFreeAssetsSyncOverWsOptions = {}
): UseFreeAssetsSyncOverWsResult {
  const { wsUrl = getModelLoaderWsClientUrl() } = options;
  const [connectionState, setConnectionState] = useState<string>("disconnected");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState<FreeAssetsSyncProgressPayload | null>(null);
  const clientRef = useRef<T3DWebSocketClient | null>(null);
  const pendingRef = useRef<{
    requestId: string;
    resolve: (v: FreeAssetsSyncResponse) => void;
    reject: (e: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);
  const pendingListRef = useRef<{
    requestId: string;
    resolve: (v: FreeAssetsListResult) => void;
    reject: (e: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);
  const pendingDefaultPathRef = useRef<{
    requestId: string;
    resolve: (v: string) => void;
    reject: (e: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);
  const pendingLocalListRef = useRef<{
    requestId: string;
    resolve: (v: FreeAssetsLocalListResult) => void;
    reject: (e: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);

  const connect = useCallback(async () => {
    if (clientRef.current?.isConnected()) {
      return;
    }
    if (clientRef.current) {
      try {
        await clientRef.current.disconnect();
      } catch {
        /* ignore */
      }
      clientRef.current = null;
    }
    const client = new T3DWebSocketClient(
      { url: wsUrl, autoConnect: false },
      {
        onConnect: () => setConnectionState("connected"),
        onDisconnect: () => setConnectionState("disconnected"),
        onStateChange: (s) => setConnectionState(s),
        onMessage: (topic, payload) => {
          if (topic === FREE_ASSETS_SYNC_TOPICS.PROGRESS) {
            const p = payload as FreeAssetsSyncProgressPayload;
            const pending = pendingRef.current;
            if (pending && p.requestId === pending.requestId) {
              setDownloadProgress(p);
            }
            return;
          }
          if (topic === FREE_ASSETS_SYNC_TOPICS.RESPONSE) {
            const res = payload as FreeAssetsSyncResponse;
            const pending = pendingRef.current;
            if (pending && res.requestId === pending.requestId) {
              clearTimeout(pending.timeoutId);
              pendingRef.current = null;
              setBusy(false);
              setDownloadProgress(null);
              if (res.error) {
                setError(res.error);
                pending.reject(new Error(res.error));
              } else {
                pending.resolve(res);
              }
            }
            return;
          }
          if (topic === FREE_ASSETS_SYNC_TOPICS.LIST_RESPONSE) {
            const res = payload as FreeAssetsListResponse;
            const pending = pendingListRef.current;
            if (pending && res.requestId === pending.requestId) {
              clearTimeout(pending.timeoutId);
              pendingListRef.current = null;
              if (res.error) {
                pending.reject(new Error(res.error));
              } else {
                pending.resolve({
                  entries: res.entries ?? [],
                  defaultOutputRootDir: res.defaultOutputRootDir,
                });
              }
            }
            return;
          }
          if (topic === FREE_ASSETS_SYNC_TOPICS.LOCAL_LIST_RESPONSE) {
            const res = payload as FreeAssetsLocalListResponse;
            const pending = pendingLocalListRef.current;
            if (pending && res.requestId === pending.requestId) {
              clearTimeout(pending.timeoutId);
              pendingLocalListRef.current = null;
              if (res.error) {
                pending.reject(new Error(res.error));
              } else {
                pending.resolve({
                  entries: res.entries ?? [],
                  rootFs: res.rootFs,
                });
              }
            }
            return;
          }
          if (topic === FREE_ASSETS_SYNC_TOPICS.DEFAULT_PATH_RESPONSE) {
            const res = payload as FreeAssetsDefaultPathResponse;
            const pending = pendingDefaultPathRef.current;
            if (pending && res.requestId === pending.requestId) {
              clearTimeout(pending.timeoutId);
              pendingDefaultPathRef.current = null;
              if (res.error) {
                pending.reject(new Error(res.error));
              } else if (res.defaultOutputRootDir?.trim()) {
                pending.resolve(res.defaultOutputRootDir.trim());
              } else {
                pending.reject(new Error("Bridge did not return default output path"));
              }
            }
            return;
          }
        },
        onError: (err) => {
          setConnectionState("error");
          setError(err.message);
        },
      }
    );
    clientRef.current = client;
    setConnectionState("connecting");
    setError(null);
    try {
      await client.connect();
      await client.subscribe(FREE_ASSETS_SYNC_TOPICS.PROGRESS, 0, "json");
      await client.subscribe(FREE_ASSETS_SYNC_TOPICS.RESPONSE, 0, "json");
      await client.subscribe(FREE_ASSETS_SYNC_TOPICS.LIST_RESPONSE, 0, "json");
      await client.subscribe(FREE_ASSETS_SYNC_TOPICS.LOCAL_LIST_RESPONSE, 0, "json");
      await client.subscribe(FREE_ASSETS_SYNC_TOPICS.DEFAULT_PATH_RESPONSE, 0, "json");
    } catch (e) {
      setConnectionState("error");
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }, [wsUrl]);

  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    setConnectionState("disconnected");
    setError(null);
    setDownloadProgress(null);
    const p = pendingRef.current;
    if (p) {
      clearTimeout(p.timeoutId);
      pendingRef.current = null;
      p.reject(new Error("Disconnected"));
    }
    const pl = pendingListRef.current;
    if (pl) {
      clearTimeout(pl.timeoutId);
      pendingListRef.current = null;
      pl.reject(new Error("Disconnected"));
    }
    const pd = pendingDefaultPathRef.current;
    if (pd) {
      clearTimeout(pd.timeoutId);
      pendingDefaultPathRef.current = null;
      pd.reject(new Error("Disconnected"));
    }
    const ploc = pendingLocalListRef.current;
    if (ploc) {
      clearTimeout(ploc.timeoutId);
      pendingLocalListRef.current = null;
      ploc.reject(new Error("Disconnected"));
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        void clientRef.current.disconnect();
      }
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const listFreeAssets = useCallback(async () => {
    const client = clientRef.current;
    if (!client?.isConnected()) {
      throw new Error("Not connected to asset bridge (start dev:with-model-loader)");
    }
    const requestId = nextRequestId();
    return new Promise<FreeAssetsListResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (pendingListRef.current?.requestId === requestId) {
          pendingListRef.current = null;
          reject(new Error("List free assets timed out"));
        }
      }, 120_000);
      pendingListRef.current = { requestId, resolve, reject, timeoutId };
      void client
        .publish(FREE_ASSETS_SYNC_TOPICS.LIST, { requestId }, 0)
        .catch((err) => {
          clearTimeout(timeoutId);
          pendingListRef.current = null;
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    });
  }, []);

  const listLocalFreeAssets = useCallback(async () => {
    const client = clientRef.current;
    if (!client?.isConnected()) {
      throw new Error("Not connected to asset bridge (start dev:with-model-loader)");
    }
    const requestId = nextRequestId();
    return new Promise<FreeAssetsLocalListResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (pendingLocalListRef.current?.requestId === requestId) {
          pendingLocalListRef.current = null;
          reject(new Error("List local free assets timed out"));
        }
      }, 180_000);
      pendingLocalListRef.current = { requestId, resolve, reject, timeoutId };
      void client
        .publish(FREE_ASSETS_SYNC_TOPICS.LOCAL_LIST, { requestId }, 0)
        .catch((err) => {
          clearTimeout(timeoutId);
          pendingLocalListRef.current = null;
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    });
  }, []);

  const fetchDefaultBridgeOutputDir = useCallback(async () => {
    const client = clientRef.current;
    if (!client?.isConnected()) {
      throw new Error("Not connected to asset bridge (start dev:with-model-loader)");
    }
    const requestId = nextRequestId();
    return new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (pendingDefaultPathRef.current?.requestId === requestId) {
          pendingDefaultPathRef.current = null;
          reject(new Error("Default path request timed out"));
        }
      }, 30_000);
      pendingDefaultPathRef.current = { requestId, resolve, reject, timeoutId };
      void client
        .publish(FREE_ASSETS_SYNC_TOPICS.DEFAULT_PATH, { requestId }, 0)
        .catch((err) => {
          clearTimeout(timeoutId);
          pendingDefaultPathRef.current = null;
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    });
  }, []);

  const syncFreeAssets = useCallback(
    async (outputDir?: string, onlyRepoPaths?: string[]) => {
      const client = clientRef.current;
      if (!client?.isConnected()) {
        throw new Error("Not connected to asset bridge (start dev:with-model-loader)");
      }
      const requestId = nextRequestId();
      setBusy(true);
      setError(null);
      setDownloadProgress(null);
      return new Promise<FreeAssetsSyncResponse>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (pendingRef.current?.requestId === requestId) {
            pendingRef.current = null;
            setBusy(false);
            setDownloadProgress(null);
            reject(new Error("Free assets sync timed out"));
          }
        }, SYNC_TIMEOUT_MS);
        pendingRef.current = { requestId, resolve, reject, timeoutId };
        const payload: Record<string, unknown> = { requestId };
        if (outputDir?.trim()) {
          payload.outputDir = outputDir.trim();
        }
        if (onlyRepoPaths && onlyRepoPaths.length > 0) {
          payload.onlyRepoPaths = onlyRepoPaths;
        }
        void client
          .publish(FREE_ASSETS_SYNC_TOPICS.REQUEST, payload, 0)
          .catch((err) => {
            clearTimeout(timeoutId);
            pendingRef.current = null;
            setBusy(false);
            reject(err instanceof Error ? err : new Error(String(err)));
          });
      });
    },
    []
  );

  return {
    connectionState,
    connect,
    disconnect,
    isConnected: connectionState === "connected",
    syncFreeAssets,
    listFreeAssets,
    listLocalFreeAssets,
    fetchDefaultBridgeOutputDir,
    busy,
    error,
    clearError,
    downloadProgress,
  };
}
