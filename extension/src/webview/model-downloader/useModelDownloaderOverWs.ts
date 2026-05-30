import { useCallback, useEffect, useRef, useState } from "react";
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { getModelLoaderWsClientUrl } from "../runtimeWsUrls";
import {
  MODEL_DOWNLOADER_TOPICS,
  type ModelDownloaderRequestConfig,
  type ListResponse,
  type InfoResponse,
  type DownloadResponse,
  type DownloadProgressPayload,
  type DownloadBrowserFilePayload,
  type DownloadBrowserCompletePayload,
  type DownloadedFile,
  type DownloadedFileContent,
  type DownloadJobStartResponse,
  type DownloadJobStatusResponse,
  type DownloadJobCancelResponse,
  type DownloadJobEventPayload,
  type DownloadJobState,
  type CatalogListDownloadedResponse,
  type CatalogListDownloadedEntry,
  type CatalogModelPropertiesResponse,
  type CatalogModelProperties,
  type ModelDownloaderDefaultOutputResponse,
} from "../../model-downloader/protocol";

const DEFAULT_REQUEST_TIMEOUT_MS = 60000;
const DOWNLOAD_REQUEST_TIMEOUT_MS = 300000; // 5 min for large model downloads

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface DownloadResult {
  productId: string;
  downloadedFiles: DownloadedFile[];
  totalSize: number;
  outputDir: string;
}

export interface DownloadBrowserResult {
  productId: string;
  files: DownloadedFileContent[];
  totalSize: number;
}

export interface UseModelDownloaderOverWsOptions {
  wsUrl?: string;
}

export interface UseModelDownloaderOverWsResult {
  connectionState: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  listModels: (
    config: ModelDownloaderRequestConfig,
    page?: number,
    limit?: number
  ) => Promise<{ data: unknown[]; pagination: Record<string, unknown> }>;
  getModelInfo: (
    config: ModelDownloaderRequestConfig,
    productId: string
  ) => Promise<unknown>;
  downloadModel: (
    config: ModelDownloaderRequestConfig,
    productId: string,
    outputDir: string,
    options?: { metadataOnly?: boolean }
  ) => Promise<DownloadResult>;
  downloadModelToBrowser: (
    config: ModelDownloaderRequestConfig,
    productId: string
  ) => Promise<DownloadBrowserResult>;
  startDownloadJob: (
    config: ModelDownloaderRequestConfig,
    productId: string,
    outputDir?: string,
    includeSourceZip?: boolean
  ) => Promise<{ jobId: string; state: DownloadJobState }>;
  getDownloadJobStatus: (jobId: string) => Promise<DownloadJobStatusResponse>;
  cancelDownloadJob: (jobId: string) => Promise<DownloadJobCancelResponse>;
  /** List local GLB/GLTF under downloads folders (bridge FS scan). Browser + bridge only. */
  listCatalogDownloadedModels: (
    options?: { silent?: boolean }
  ) => Promise<CatalogListDownloadedEntry[]>;
  getCatalogModelProperties: (webPath: string) => Promise<CatalogModelProperties>;
  /** Bridge-resolved absolute base folder for Model Loader downloads (extension globalStorage or dev tree). */
  fetchDefaultModelLoaderOutputDir: () => Promise<string>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  downloadProgress: DownloadProgressPayload | null;
  latestJobEvent: DownloadJobEventPayload | null;
  lastListData: unknown[] | null;
  lastPagination: Record<string, unknown> | null;
  lastModelInfo: unknown | null;
  lastDownloadResult: DownloadResult | null;
}

export function useModelDownloaderOverWs(
  options: UseModelDownloaderOverWsOptions = {}
): UseModelDownloaderOverWsResult {
  const { wsUrl = getModelLoaderWsClientUrl() } = options;

  const [connectionState, setConnectionState] = useState<string>("disconnected");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastListData, setLastListData] = useState<unknown[] | null>(null);
  const [lastPagination, setLastPagination] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [lastModelInfo, setLastModelInfo] = useState<unknown | null>(null);
  const [lastDownloadResult, setLastDownloadResult] =
    useState<DownloadResult | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressPayload | null>(null);
  const [latestJobEvent, setLatestJobEvent] = useState<DownloadJobEventPayload | null>(null);
  /** True only after broker handshake and local subscribe batch (avoids lost response messages). */
  const [subscriptionsReady, setSubscriptionsReady] = useState(false);

  const clientRef = useRef<T3DWebSocketClient | null>(null);
  const pendingBrowserRef = useRef<
    Map<
      string,
      {
        resolve: (v: DownloadBrowserResult) => void;
        reject: (e: Error) => void;
        files: DownloadedFileContent[];
        timeoutId: ReturnType<typeof setTimeout>;
      }
    >
  >(new Map());
  const pendingRef = useRef<
    Map<
      string,
      {
        resolve: (v: unknown) => void;
        reject: (e: Error) => void;
      }
    >
  >(new Map());

  const connect = useCallback(async () => {
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
        onConnect: () => {
          /* socket open; stay "connecting" until subscribe batch completes */
        },
        onDisconnect: () => {
          setSubscriptionsReady(false);
          setConnectionState("disconnected");
        },
        onStateChange: (s) => {
          setConnectionState(s);
          if (s !== "connected") {
            setSubscriptionsReady(false);
          }
        },
        onMessage: (topic, payload) => {
          if (topic === MODEL_DOWNLOADER_TOPICS.LIST_RESPONSE) {
            const res = payload as ListResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error) {
                p.reject(new Error(res.error));
              } else {
                setLastListData(res.data ?? []);
                setLastPagination(res.pagination ?? null);
                setLastModelInfo(null);
                setLastDownloadResult(null);
                p.resolve({
                  data: res.data ?? [],
                  pagination: res.pagination ?? {},
                });
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.INFO_RESPONSE) {
            const res = payload as InfoResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error) {
                p.reject(new Error(res.error));
              } else {
                setLastModelInfo(res.modelInfo ?? null);
                setLastListData(null);
                setLastDownloadResult(null);
                p.resolve(res.modelInfo);
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_PROGRESS) {
            setDownloadProgress(payload as DownloadProgressPayload);
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_RESPONSE) {
            setDownloadProgress(null);
            const res = payload as DownloadResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error) {
                p.reject(new Error(res.error));
              } else if (res.downloadResult) {
                setLastDownloadResult(res.downloadResult);
                setLastListData(null);
                setLastModelInfo(null);
                p.resolve(res.downloadResult);
              } else {
                p.reject(new Error("No download result"));
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER_FILE) {
            const res = payload as DownloadBrowserFilePayload;
            const pending = pendingBrowserRef.current.get(res.requestId);
            if (pending) {
              pending.files.push(res.file);
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER_COMPLETE) {
            setDownloadProgress(null);
            const res = payload as DownloadBrowserCompletePayload;
            const pending = pendingBrowserRef.current.get(res.requestId);
            if (pending) {
              clearTimeout(pending.timeoutId);
              pendingBrowserRef.current.delete(res.requestId);
              if (res.error) {
                setError(res.error);
                pending.reject(new Error(res.error));
              } else {
                pending.resolve({
                  productId: res.productId,
                  files: pending.files,
                  totalSize: res.totalSize,
                });
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_EVENT) {
            setLatestJobEvent(payload as DownloadJobEventPayload);
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_START_RESPONSE) {
            const res = payload as DownloadJobStartResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error || !res.jobId || !res.state) {
                p.reject(new Error(res.error ?? "Invalid job start response"));
              } else {
                p.resolve({ jobId: res.jobId, state: res.state });
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_STATUS_RESPONSE) {
            const res = payload as DownloadJobStatusResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error) {
                p.reject(new Error(res.error));
              } else {
                p.resolve(res);
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_CANCEL_RESPONSE) {
            const res = payload as DownloadJobCancelResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error) {
                p.reject(new Error(res.error));
              } else {
                p.resolve(res);
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.CATALOG_LIST_DOWNLOADED_RESPONSE) {
            const res = payload as CatalogListDownloadedResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error) {
                p.reject(new Error(res.error));
              } else {
                p.resolve(res.models ?? []);
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.CATALOG_MODEL_PROPERTIES_RESPONSE) {
            const res = payload as CatalogModelPropertiesResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error) {
                p.reject(new Error(res.error));
              } else if (res.properties) {
                p.resolve(res.properties);
              } else {
                p.reject(new Error("No model properties returned"));
              }
            }
            return;
          }
          if (topic === MODEL_DOWNLOADER_TOPICS.DEFAULT_OUTPUT_RESPONSE) {
            const res = payload as ModelDownloaderDefaultOutputResponse;
            const p = pendingRef.current.get(res.requestId);
            if (p) {
              pendingRef.current.delete(res.requestId);
              if (res.error) {
                p.reject(new Error(res.error));
              } else if (res.defaultOutputBaseDir) {
                p.resolve(res.defaultOutputBaseDir);
              } else {
                p.reject(new Error("No default output dir"));
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
    setSubscriptionsReady(false);
    setError(null);
    try {
      await client.connect();
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.LIST_RESPONSE, 0, "json");
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.INFO_RESPONSE, 0, "json");
      await client.subscribe(
        MODEL_DOWNLOADER_TOPICS.DOWNLOAD_RESPONSE,
        0,
        "json"
      );
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_PROGRESS, 0, "json");
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER_FILE, 0, "json");
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER_COMPLETE, 0, "json");
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_EVENT, 0, "json");
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_START_RESPONSE, 0, "json");
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_STATUS_RESPONSE, 0, "json");
      await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_CANCEL_RESPONSE, 0, "json");
      await client.subscribe(
        MODEL_DOWNLOADER_TOPICS.CATALOG_LIST_DOWNLOADED_RESPONSE,
        0,
        "json"
      );
      await client.subscribe(
        MODEL_DOWNLOADER_TOPICS.CATALOG_MODEL_PROPERTIES_RESPONSE,
        0,
        "json"
      );
      await client.subscribe(
        MODEL_DOWNLOADER_TOPICS.DEFAULT_OUTPUT_RESPONSE,
        0,
        "json"
      );
      setSubscriptionsReady(true);
    } catch (e) {
      setSubscriptionsReady(false);
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
    setSubscriptionsReady(false);
    setError(null);
    setDownloadProgress(null);
    setLastListData(null);
    setLastPagination(null);
    setLastModelInfo(null);
    setLastDownloadResult(null);
    setLatestJobEvent(null);
    pendingRef.current.clear();
    for (const [, pending] of pendingBrowserRef.current) {
      clearTimeout(pending.timeoutId);
    }
    pendingBrowserRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect().catch(() => {});
      }
    };
  }, []);

  const sendRequest = useCallback(
    <T>(
      topic: string,
      payload: Record<string, unknown>,
      options?: { timeoutMs?: number }
    ): Promise<T> => {
      const client = clientRef.current;
      if (!client?.isConnected()) {
        throw new Error("Not connected");
      }
      const requestId = nextRequestId();
      const timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
      return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const p = pendingRef.current.get(requestId);
          if (p) {
            pendingRef.current.delete(requestId);
            reject(new Error("Request timeout"));
          }
        }, timeoutMs);

        pendingRef.current.set(requestId, {
          resolve: (v) => {
            clearTimeout(timeout);
            resolve(v as T);
          },
          reject: (e) => {
            clearTimeout(timeout);
            reject(e);
          },
        });

        client
          .publish(topic, { ...payload, requestId }, 0)
          .catch((err) => {
            clearTimeout(timeout);
            pendingRef.current.delete(requestId);
            reject(err);
          });
      });
    },
    []
  );

  const listModels = useCallback(
    async (
      config: ModelDownloaderRequestConfig,
      page = 1,
      limit = 100
    ): Promise<{ data: unknown[]; pagination: Record<string, unknown> }> => {
      setLoading(true);
      setError(null);
      try {
        const result = await sendRequest<{
          data: unknown[];
          pagination: Record<string, unknown>;
        }>(MODEL_DOWNLOADER_TOPICS.LIST, {
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          caCertPath: config.caCertPath,
          page,
          limit,
        });
        return result;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendRequest]
  );

  const getModelInfo = useCallback(
    async (
      config: ModelDownloaderRequestConfig,
      productId: string
    ): Promise<unknown> => {
      setLoading(true);
      setError(null);
      try {
        const result = await sendRequest<unknown>(
          MODEL_DOWNLOADER_TOPICS.INFO,
          {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            caCertPath: config.caCertPath,
            productId,
          }
        );
        return result;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendRequest]
  );

  const downloadModel = useCallback(
    async (
      config: ModelDownloaderRequestConfig,
      productId: string,
      outputDir: string,
      options?: { metadataOnly?: boolean; includeSourceZip?: boolean }
    ): Promise<DownloadResult> => {
      setLoading(true);
      setError(null);
      try {
        const result = await sendRequest<DownloadResult>(
          MODEL_DOWNLOADER_TOPICS.DOWNLOAD,
          {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            caCertPath: config.caCertPath,
            productId,
            outputDir,
            metadataOnly: options?.metadataOnly === true,
            includeSourceZip: options?.includeSourceZip !== false,
          },
          { timeoutMs: DOWNLOAD_REQUEST_TIMEOUT_MS }
        );
        return result;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendRequest]
  );

  const downloadModelToBrowser = useCallback(
    async (
      config: ModelDownloaderRequestConfig,
      productId: string
    ): Promise<DownloadBrowserResult> => {
      const client = clientRef.current;
      if (!client?.isConnected()) {
        throw new Error("Not connected");
      }
      setLoading(true);
      setError(null);
      const requestId = nextRequestId();
      return new Promise<DownloadBrowserResult>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          const p = pendingBrowserRef.current.get(requestId);
          if (p) {
            pendingBrowserRef.current.delete(requestId);
            reject(new Error("Request timeout"));
          }
        }, DOWNLOAD_REQUEST_TIMEOUT_MS);
        pendingBrowserRef.current.set(requestId, {
          resolve,
          reject,
          files: [],
          timeoutId,
        });
        client
          .publish(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_BROWSER, {
            requestId,
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            caCertPath: config.caCertPath,
            productId,
          }, 0)
          .catch((err) => {
            clearTimeout(timeoutId);
            const p = pendingBrowserRef.current.get(requestId);
            if (p) {
              pendingBrowserRef.current.delete(requestId);
              setDownloadProgress(null);
              p.reject(err);
            }
          });
      }).finally(() => {
        setLoading(false);
      });
    },
    []
  );

  const startDownloadJob = useCallback(
    async (
      config: ModelDownloaderRequestConfig,
      productId: string,
      outputDir?: string,
      includeSourceZip = true
    ): Promise<{ jobId: string; state: DownloadJobState }> => {
      setLoading(true);
      setError(null);
      try {
        return await sendRequest<{ jobId: string; state: DownloadJobState }>(
          MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_START,
          {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            caCertPath: config.caCertPath,
            productId,
            outputDir,
            includeSourceZip,
          },
          { timeoutMs: DOWNLOAD_REQUEST_TIMEOUT_MS }
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendRequest]
  );

  const getDownloadJobStatus = useCallback(
    async (jobId: string): Promise<DownloadJobStatusResponse> => {
      return sendRequest<DownloadJobStatusResponse>(
        MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_STATUS,
        { jobId }
      );
    },
    [sendRequest]
  );

  const cancelDownloadJob = useCallback(
    async (jobId: string): Promise<DownloadJobCancelResponse> => {
      return sendRequest<DownloadJobCancelResponse>(
        MODEL_DOWNLOADER_TOPICS.DOWNLOAD_JOB_CANCEL,
        { jobId }
      );
    },
    [sendRequest]
  );

  const listCatalogDownloadedModels = useCallback(
    async (
      options?: { silent?: boolean }
    ): Promise<CatalogListDownloadedEntry[]> => {
      const silent = options?.silent === true;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const models = await sendRequest<CatalogListDownloadedEntry[]>(
          MODEL_DOWNLOADER_TOPICS.CATALOG_LIST_DOWNLOADED,
          {},
          { timeoutMs: 30000 }
        );
        return models;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (!silent) {
          setError(errMsg);
        }
        throw err;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [sendRequest]
  );

  const getCatalogModelProperties = useCallback(
    async (webPath: string): Promise<CatalogModelProperties> => {
      setLoading(true);
      setError(null);
      try {
        return await sendRequest<CatalogModelProperties>(
          MODEL_DOWNLOADER_TOPICS.CATALOG_MODEL_PROPERTIES,
          { webPath },
          { timeoutMs: 30000 }
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendRequest]
  );

  const fetchDefaultModelLoaderOutputDir = useCallback(async (): Promise<string> => {
    const delaysMs = [0, 150, 400];
    let lastErr: Error | undefined;
    for (let i = 0; i < delaysMs.length; i++) {
      if (delaysMs[i]! > 0) {
        await new Promise((r) => setTimeout(r, delaysMs[i]));
      }
      try {
        return await sendRequest<string>(
          MODEL_DOWNLOADER_TOPICS.DEFAULT_OUTPUT,
          {},
          { timeoutMs: 10000 }
        );
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
      }
    }
    throw lastErr ?? new Error("Default output path request failed");
  }, [sendRequest]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const socketConnected = connectionState === "connected";
  const protocolReady = socketConnected && subscriptionsReady;
  const connectionStateForUi = socketConnected && !subscriptionsReady ? "connecting" : connectionState;

  return {
    connectionState: connectionStateForUi,
    connect,
    disconnect,
    isConnected: protocolReady,
    listModels,
    getModelInfo,
    downloadModel,
    downloadModelToBrowser,
    startDownloadJob,
    getDownloadJobStatus,
    cancelDownloadJob,
    listCatalogDownloadedModels,
    getCatalogModelProperties,
    fetchDefaultModelLoaderOutputDir,
    loading,
    error,
    clearError,
    downloadProgress,
    latestJobEvent,
    lastListData,
    lastPagination,
    lastModelInfo,
    lastDownloadResult,
  };
}
