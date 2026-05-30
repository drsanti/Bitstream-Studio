import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useModelDownloaderOverWs } from "../../model-downloader/useModelDownloaderOverWs";
import { getModelLoaderWsClientUrl } from "../../runtimeWsUrls";
import type { ModelLoaderRuntimePort } from "./loaderRuntimePort";
import type {
  ModelLoaderConfig,
  ModelLoaderDownloadResult,
  ModelLoaderJobEvent,
  ModelLoaderJobState,
  ModelLoaderListResult,
  ModelLoaderLocalEntry,
  ModelLoaderModelProperties,
} from "../types";
import { mapDownloadResult, mapListResult } from "./modelLoaderMappers";
import {
  MODEL_LOADER_BROWSER_STORAGE_KEY,
  readModelLoaderBrowserConfig,
  serializeModelLoaderBrowserConfig,
} from "../modelLoaderBrowserStorage";
import { projectRelativePathToDevUrl, bridgeWebPathToCatalogModelUrl } from "../../model-catalog/modelCatalogMerge";
import { DEV_MODEL_LOADER_BROWSER_RELATIVE } from "../../../assetLayout";

export function useModelLoaderRuntimeBrowser(active: boolean): ModelLoaderRuntimePort {
  const ws = useModelDownloaderOverWs({ wsUrl: getModelLoaderWsClientUrl() });
  const {
    connect,
    disconnect,
    listModels: wsListModels,
    getModelInfo: wsGetModelInfo,
    downloadModel: wsDownloadModel,
    startDownloadJob: wsStartDownloadJob,
    getDownloadJobStatus: wsGetDownloadJobStatus,
    cancelDownloadJob: wsCancelDownloadJob,
    listCatalogDownloadedModels: wsListCatalogDownloadedModels,
    getCatalogModelProperties: wsGetCatalogModelProperties,
    fetchDefaultModelLoaderOutputDir: wsFetchDefaultOutput,
  } = ws;
  const [defaultOutputDir, setDefaultOutputDir] = useState(
    DEV_MODEL_LOADER_BROWSER_RELATIVE
  );
  const runtimeConnectionState =
    ws.connectionState === "connected"
      ? "connected"
      : ws.connectionState === "connecting"
        ? "connecting"
        : ws.connectionState === "error"
          ? "error"
          : "disconnected";
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const isConnectedRef = useRef(ws.isConnected);
  const connectionStateRef = useRef(ws.connectionState);
  isConnectedRef.current = ws.isConnected;
  connectionStateRef.current = ws.connectionState;

  useEffect(() => {
    if (!active) {
      return;
    }
    connect().catch((err) => {
      console.error("[ModelLoader] Initial WebSocket connect failed", err);
    });
    return () => {
      disconnect().catch(() => undefined);
    };
  }, [active, connect, disconnect]);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (ws.isConnected || ws.connectionState === "connecting") {
      return;
    }
    const timer = setTimeout(() => {
      connect().catch(() => undefined);
    }, 1200);
    return () => {
      clearTimeout(timer);
    };
  }, [active, ws.isConnected, ws.connectionState, connect]);

  useEffect(() => {
    if (!active || !ws.isConnected) {
      return;
    }
    let cancelled = false;
    void wsFetchDefaultOutput()
      .then((dir) => {
        if (!cancelled && dir.trim() !== "") {
          setDefaultOutputDir(dir.trim());
        }
      })
      .catch((err) => {
        console.warn(
          "[ModelLoader] Could not resolve default download folder from bridge",
          err
        );
      });
    return () => {
      cancelled = true;
    };
  }, [active, ws.isConnected, wsFetchDefaultOutput]);

  const loadConfig = useCallback(async (): Promise<ModelLoaderConfig> => {
    return readModelLoaderBrowserConfig();
  }, []);

  const ensureConnected = useCallback(async (): Promise<void> => {
    if (isConnectedRef.current) {
      return;
    }
    if (connectionStateRef.current !== "connecting") {
      await connect();
    }
    const deadline = Date.now() + 2000;
    while (!isConnectedRef.current && Date.now() < deadline) {
      await wait(80);
    }
    if (isConnectedRef.current) {
      return;
    }
    throw new Error("Unable to connect to Model Downloader bridge");
  }, [connect]);

  const saveConfig = useCallback(async (config: ModelLoaderConfig): Promise<void> => {
    try {
      localStorage.setItem(
        MODEL_LOADER_BROWSER_STORAGE_KEY,
        serializeModelLoaderBrowserConfig(config)
      );
    } catch (err) {
      console.error("[ModelLoader] Failed to save config to localStorage", err);
      throw err;
    }
  }, []);

  const listModels = useCallback(
    async (
      config: ModelLoaderConfig,
      page: number,
      limit: number
    ): Promise<ModelLoaderListResult> => {
      await ensureConnected();
      const result = await wsListModels(
        {
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          caCertPath: config.caCertPath || undefined,
        },
        page,
        limit
      );
      return mapListResult(result.data ?? [], result.pagination ?? {});
    },
    [ensureConnected, wsListModels]
  );

  const getModelInfo = useCallback(
    async (config: ModelLoaderConfig, productId: string): Promise<unknown> => {
      return wsGetModelInfo(
        {
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          caCertPath: config.caCertPath || undefined,
        },
        productId
      );
    },
    [wsGetModelInfo]
  );

  const downloadModel = useCallback(
    async (
      config: ModelLoaderConfig,
      productId: string,
      outputDir: string,
      includeSourceZip = true
    ): Promise<ModelLoaderDownloadResult> => {
      const jobId = await (async () => {
        const started = await wsStartDownloadJob(
          {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            caCertPath: config.caCertPath || undefined,
          },
          productId,
          outputDir,
          includeSourceZip
        );
        return started.jobId;
      })();
      const maxAttempts = 300;
      for (let i = 0; i < maxAttempts; i++) {
        const status = await wsGetDownloadJobStatus(jobId);
        if (status.state === "completed" && status.result) {
          return mapDownloadResult(status.result);
        }
        if (status.state === "failed") {
          throw new Error(status.error ?? "Download job failed");
        }
        if (status.state === "cancelled") {
          throw new Error("Download job cancelled");
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      throw new Error("Download job timed out");
    },
    [wsStartDownloadJob, wsGetDownloadJobStatus]
  );

  const downloadModelInfoJson = useCallback(
    async (
      config: ModelLoaderConfig,
      productId: string,
      outputDir: string
    ): Promise<ModelLoaderDownloadResult> => {
      await ensureConnected();
      const result = await wsDownloadModel(
        {
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          caCertPath: config.caCertPath || undefined,
        },
        productId,
        outputDir,
        { metadataOnly: true }
      );
      return mapDownloadResult(result);
    },
    [ensureConnected, wsDownloadModel]
  );

  const getDownloadJobStatus = useCallback(
    async (jobId: string): Promise<ModelLoaderJobState> => {
      const status = await wsGetDownloadJobStatus(jobId);
      return {
        jobId,
        state: status.state ?? "queued",
        progress: status.progress
          ? {
              phase: status.progress.phase,
              percent: status.progress.percent,
              label: status.progress.label,
              fileIndex: status.progress.fileIndex,
              totalFiles: status.progress.totalFiles,
            }
          : undefined,
        result: status.result ? mapDownloadResult(status.result) : undefined,
        error: status.error,
      };
    },
    [wsGetDownloadJobStatus]
  );

  const cancelDownloadJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      const response = await wsCancelDownloadJob(jobId);
      return response.cancelled;
    },
    [wsCancelDownloadJob]
  );

  const startDownloadJob = useCallback(
    async (
      config: ModelLoaderConfig,
      productId: string,
      outputDir: string,
      includeSourceZip = true
    ): Promise<string> => {
      const started = await wsStartDownloadJob(
        {
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          caCertPath: config.caCertPath || undefined,
        },
        productId,
        outputDir,
        includeSourceZip
      );
      return started.jobId;
    },
    [wsStartDownloadJob]
  );

  const pickFolder = useCallback(async (): Promise<string | undefined> => {
    return defaultOutputDir;
  }, [defaultOutputDir]);

  const listLocalDownloadedModels = useCallback(async (): Promise<ModelLoaderLocalEntry[]> => {
    await ensureConnected();
    const entries = await wsListCatalogDownloadedModels({ silent: true });
    return entries.map((m) => {
      if (!m.productId || !m.name || !m.category) {
        console.warn("[ModelLoader] Incomplete local model row from bridge", m);
      }
      return {
        id: m.id,
        productId: m.productId || "-",
        name: m.name || m.productId || "-",
        category: m.category || "Uncategorized",
        fileName: m.fileName,
        fileType: m.fileType,
        sizeBytes: m.sizeBytes,
        updatedAtMs: m.updatedAtMs,
        metadataJson: m.metadataJson,
        modelUrl: m.modelWebPath ? bridgeWebPathToCatalogModelUrl(m.modelWebPath) : undefined,
        modelWebPath: m.modelWebPath,
        thumbnailUrl: m.thumbnailWebPath
          ? bridgeWebPathToCatalogModelUrl(m.thumbnailWebPath)
          : undefined,
        thumbnailWebPath: m.thumbnailWebPath,
        webPath: m.webPath,
      };
    });
  }, [ensureConnected, wsListCatalogDownloadedModels]);

  const getLocalModelProperties = useCallback(
    async (webPath: string): Promise<ModelLoaderModelProperties> => {
      await ensureConnected();
      return wsGetCatalogModelProperties(webPath);
    },
    [ensureConnected, wsGetCatalogModelProperties]
  );

  const revealFolder = useCallback(async (absolutePath: string) => {
    const t = absolutePath.trim();
    if (!t) {
      throw new Error("No folder path");
    }
    await navigator.clipboard.writeText(t);
  }, []);

  const downloadProgressPercent =
    ws.latestJobEvent?.progress?.percent ?? ws.downloadProgress?.percent ?? null;
  const latestJobEvent = (ws.latestJobEvent as ModelLoaderJobEvent | null) ?? null;

  return useMemo(
    () => ({
      status: {
        isExtension: false,
        supportsFolderPicker: false,
        defaultOutputDir,
        connectionState: runtimeConnectionState,
        isReady: runtimeConnectionState === "connected",
      },
      loading: ws.loading,
      error: ws.error,
      clearError: ws.clearError,
      downloadProgressPercent,
      latestJobEvent,
      loadConfig,
      saveConfig,
      listModels,
      getModelInfo,
      downloadModel,
      downloadModelInfoJson,
      startDownloadJob,
      getDownloadJobStatus,
      cancelDownloadJob,
      pickFolder,
      revealFolder,
      listLocalDownloadedModels,
      getLocalModelProperties,
    }),
    [
      runtimeConnectionState,
      ws.loading,
      ws.error,
      ws.clearError,
      downloadProgressPercent,
      latestJobEvent,
      loadConfig,
      saveConfig,
      listModels,
      getModelInfo,
      downloadModel,
      downloadModelInfoJson,
      startDownloadJob,
      getDownloadJobStatus,
      cancelDownloadJob,
      pickFolder,
      revealFolder,
      listLocalDownloadedModels,
      getLocalModelProperties,
      defaultOutputDir,
    ],
  );
}
