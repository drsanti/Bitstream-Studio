import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVsCodeApi } from "../../extension-bridge/getVsCodeApi.js";
import { useModelDownloaderExtension } from "../../model-downloader/useModelDownloaderExtension";
import type { ModelLoaderRuntimePort } from "./loaderRuntimePort";
import type {
  ModelLoaderConfig,
  ModelLoaderDownloadResult,
  ModelLoaderJobEvent,
  ModelLoaderJobState,
  ModelLoaderJobStateValue,
  ModelLoaderListResult,
  ModelLoaderLocalEntry,
  ModelLoaderModelProperties,
} from "../types";
import { mapDownloadResult, mapListResult } from "./modelLoaderMappers";

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type ExtensionResponseMessage = {
  type: string;
  requestId?: string;
  error?: string;
  listData?: unknown[];
  pagination?: Record<string, unknown>;
  modelInfo?: unknown;
  downloadResult?: {
    productId: string;
    downloadedFiles: Array<{ label: string; filepath: string; size: number }>;
    totalSize: number;
    outputDir: string;
  };
  progress?: {
    phase: "listing" | "downloading" | "writing" | "done";
    percent: number;
    label?: string;
    fileIndex?: number;
    totalFiles?: number;
  };
  jobId?: string;
  jobState?: ModelLoaderJobStateValue;
  cancelled?: boolean;
  localModels?: Array<{
    id: string;
    productId: string;
    name: string;
    category: string;
    fileName: string;
    fileType: "glb" | "gltf";
    sizeBytes?: number;
    updatedAtMs?: number;
    metadataJson?: unknown;
    modelUrl?: string;
    modelWebPath?: string;
    thumbnailUrl?: string;
    thumbnailWebPath?: string;
    webPath: string;
  }>;
  modelProperties?: {
    cameraCount: number;
    lightCount: number;
    clipCount: number;
  };
};

export function useModelLoaderRuntimeVscode(): ModelLoaderRuntimePort {
  const ext = useModelDownloaderExtension();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestJobEvent, setLatestJobEvent] = useState<ModelLoaderJobEvent | null>(null);
  const [downloadProgressPercent, setDownloadProgressPercent] = useState<number | null>(null);
  /** Throttle progress UI updates to reduce full-tree re-renders during polling. */
  const progressFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProgressPercentRef = useRef<number | null>(null);
  const pendingRef = useRef(
    new Map<
      string,
      {
        resolve: (value: unknown) => void;
        reject: (reason: Error) => void;
      }
    >()
  );

  /** Resolved from extension host: globalStorage `.../assets/tesaiot/models` (not extensionPath/src/...). */
  const [defaultOutputDir, setDefaultOutputDir] = useState("");

  useEffect(() => {
    const vscodeApi = getVsCodeApi();
    if (!vscodeApi) return;
    const requestId = nextRequestId();
    const onMsg = (event: MessageEvent) => {
      const d = event.data as {
        type?: string;
        requestId?: string;
        defaultDownloadPaths?: { modelDownloadsRootFs?: string };
      };
      if (d.type !== "asset-default-download-paths-response" || d.requestId !== requestId) {
        return;
      }
      const fsPath = d.defaultDownloadPaths?.modelDownloadsRootFs?.trim();
      if (fsPath) {
        setDefaultOutputDir(fsPath);
      }
      window.removeEventListener("message", onMsg);
    };
    window.addEventListener("message", onMsg);
    vscodeApi.postMessage({ type: "asset-get-default-download-paths", requestId });
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const revealFolder = useCallback(async (absolutePath: string) => {
    const vscodeApi = getVsCodeApi();
    if (!vscodeApi) {
      throw new Error("VS Code API not available");
    }
    const trimmed = absolutePath.trim();
    if (!trimmed) {
      throw new Error("No folder path");
    }
    const requestId = nextRequestId();
    await new Promise<void>((resolve, reject) => {
      const onMsg = (event: MessageEvent) => {
        const d = event.data as {
          type?: string;
          requestId?: string;
          revealPathOk?: boolean;
          revealPathError?: string;
        };
        if (d.type !== "asset-reveal-path-result" || d.requestId !== requestId) {
          return;
        }
        window.removeEventListener("message", onMsg);
        if (d.revealPathOk) {
          resolve();
        } else {
          reject(new Error(d.revealPathError ?? "Could not open folder"));
        }
      };
      window.addEventListener("message", onMsg);
      vscodeApi.postMessage({
        type: "reveal-path-in-os",
        requestId,
        absolutePath: trimmed,
      });
    });
  }, []);

  const sendRequest = useCallback(
    <T>(type: string, payload: Record<string, unknown>): Promise<T> => {
      const vscodeApi = getVsCodeApi();
      return new Promise<T>((resolve, reject) => {
        if (!vscodeApi) {
          reject(new Error("VS Code API not available"));
          return;
        }
        const requestId = nextRequestId();
        pendingRef.current.set(requestId, {
          resolve: resolve as (value: unknown) => void,
          reject,
        });
        vscodeApi.postMessage({ type, requestId, ...payload });
      });
    },
    []
  );

  const onWindowMessage = useCallback((event: MessageEvent<ExtensionResponseMessage>) => {
    const msg = event.data;
    if (!msg?.requestId) {
      return;
    }
    const pending = pendingRef.current.get(msg.requestId);
    if (!pending) {
      return;
    }
    pendingRef.current.delete(msg.requestId);

    if (msg.type === "model-loader-error") {
      pending.reject(new Error(msg.error ?? "Unknown error"));
      return;
    }
    pending.resolve(msg);
  }, []);

  useEffect(() => {
    window.addEventListener("message", onWindowMessage);
    return () => {
      window.removeEventListener("message", onWindowMessage);
    };
  }, [onWindowMessage]);

  useEffect(() => {
    return () => {
      if (progressFlushTimerRef.current !== null) {
        clearTimeout(progressFlushTimerRef.current);
        progressFlushTimerRef.current = null;
      }
    };
  }, []);

  const listModels = useCallback(
    async (
      config: ModelLoaderConfig,
      page: number,
      limit: number
    ): Promise<ModelLoaderListResult> => {
      setLoading(true);
      setError(null);
      try {
        const response = await sendRequest<ExtensionResponseMessage>(
          "model-loader-list",
          {
            page,
            limit,
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            caCertPath: config.caCertPath,
          }
        );
        return mapListResult(response.listData ?? [], response.pagination ?? {});
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendRequest]
  );

  const getModelInfo = useCallback(
    async (config: ModelLoaderConfig, productId: string): Promise<unknown> => {
      setLoading(true);
      setError(null);
      try {
        const response = await sendRequest<ExtensionResponseMessage>(
          "model-loader-info",
          {
            productId,
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            caCertPath: config.caCertPath,
          }
        );
        return response.modelInfo;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendRequest]
  );

  const startDownloadJob = useCallback(
    async (
      config: ModelLoaderConfig,
      productId: string,
      outputDir: string,
      includeSourceZip = true
    ): Promise<string> => {
      const response = await sendRequest<ExtensionResponseMessage>(
        "model-loader-download-start",
        {
          productId,
          outputDir,
          includeSourceZip,
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          caCertPath: config.caCertPath,
        }
      );
      if (!response.jobId) {
        throw new Error("No jobId returned");
      }
      if (progressFlushTimerRef.current !== null) {
        clearTimeout(progressFlushTimerRef.current);
        progressFlushTimerRef.current = null;
      }
      pendingProgressPercentRef.current = null;
      setDownloadProgressPercent(null);
      setLatestJobEvent({
        jobId: response.jobId,
        state: response.jobState ?? "queued",
        eventType: "started",
        message: "Job started in VS Code runtime",
      });
      return response.jobId;
    },
    [sendRequest]
  );

  const getDownloadJobStatus = useCallback(
    async (jobId: string): Promise<ModelLoaderJobState> => {
      const response = await sendRequest<ExtensionResponseMessage>(
        "model-loader-download-status",
        { jobId }
      );
      const state = response.jobState ?? "failed";
      const status: ModelLoaderJobState = {
        jobId,
        state,
        progress: response.progress
          ? {
              phase: response.progress.phase,
              percent: response.progress.percent,
              label: response.progress.label,
              fileIndex: response.progress.fileIndex,
              totalFiles: response.progress.totalFiles,
            }
          : undefined,
        result: response.downloadResult
          ? mapDownloadResult(response.downloadResult)
          : undefined,
        error: response.error,
      };
      const pct = response.progress?.percent ?? null;
      const terminal = state === "completed" || state === "failed" || state === "cancelled";
      if (terminal) {
        if (progressFlushTimerRef.current !== null) {
          clearTimeout(progressFlushTimerRef.current);
          progressFlushTimerRef.current = null;
        }
        setDownloadProgressPercent(pct);
      } else {
        pendingProgressPercentRef.current = pct;
        if (progressFlushTimerRef.current === null) {
          progressFlushTimerRef.current = setTimeout(() => {
            progressFlushTimerRef.current = null;
            setDownloadProgressPercent(pendingProgressPercentRef.current);
          }, 200);
        }
      }
      if (terminal) {
        setLatestJobEvent({
          jobId,
          state,
          eventType:
            state === "completed"
              ? "completed"
              : state === "failed"
                ? "failed"
                : "cancelled",
          result: status.result,
          error: status.error,
        });
      }
      return status;
    },
    [sendRequest]
  );

  const cancelDownloadJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      const response = await sendRequest<ExtensionResponseMessage>(
        "model-loader-download-cancel",
        { jobId }
      );
      const cancelled = response.cancelled === true;
      if (cancelled) {
        setLatestJobEvent({
          jobId,
          state: "cancelled",
          eventType: "cancelled",
          message: "Job cancelled",
        });
      }
      return cancelled;
    },
    [sendRequest]
  );

  const downloadModel = useCallback(
    async (
      config: ModelLoaderConfig,
      productId: string,
      outputDir: string,
      includeSourceZip = true
    ): Promise<ModelLoaderDownloadResult> => {
      setLoading(true);
      setError(null);
      try {
        const jobId = await startDownloadJob(
          config,
          productId,
          outputDir,
          includeSourceZip
        );
        const maxAttempts = 300;
        for (let i = 0; i < maxAttempts; i++) {
          const status = await getDownloadJobStatus(jobId);
          if (status.state === "completed" && status.result) {
            return status.result;
          }
          if (status.state === "failed") {
            throw new Error(status.error ?? "Download failed");
          }
          if (status.state === "cancelled") {
            throw new Error("Download cancelled");
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        throw new Error("Download timed out");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [startDownloadJob, getDownloadJobStatus]
  );

  const downloadModelInfoJson = useCallback(
    async (
      config: ModelLoaderConfig,
      productId: string,
      outputDir: string
    ): Promise<ModelLoaderDownloadResult> => {
      setLoading(true);
      setError(null);
      try {
        const response = await sendRequest<ExtensionResponseMessage>(
          "model-loader-download",
          {
            productId,
            outputDir,
            metadataOnly: true,
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            caCertPath: config.caCertPath,
          }
        );
        if (!response.downloadResult) {
          throw new Error("No download result");
        }
        return mapDownloadResult(response.downloadResult);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sendRequest]
  );

  const loadConfig = useCallback(async (): Promise<ModelLoaderConfig> => {
    const cfg = await ext.getConfig();
    return {
      baseUrl: cfg?.baseUrl ?? "https://admin.tesaiot.com",
      apiKey: "",
      caCertPath: cfg?.caCertPath ?? "",
      hasStoredApiKey: cfg?.hasApiKey ?? false,
    };
  }, [ext]);

  const saveConfig = useCallback(
    async (config: ModelLoaderConfig): Promise<void> => {
      await ext.setConfig({
        baseUrl: config.baseUrl,
        caCertPath: config.caCertPath,
        ...(config.apiKey.trim() !== "" ? { apiKey: config.apiKey } : {}),
      });
    },
    [ext]
  );

  const pickFolder = useCallback(async (): Promise<string | undefined> => {
    return ext.pickFolder();
  }, [ext]);

  const listLocalDownloadedModels = useCallback(async (): Promise<ModelLoaderLocalEntry[]> => {
    const response = await sendRequest<ExtensionResponseMessage>(
      "model-loader-list-local-models",
      {}
    );
    const raw = response.localModels;
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map((m) => {
      if (!m.productId || !m.name || !m.category) {
        console.warn("[ModelLoader] Incomplete local model row from extension host", m);
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
        modelUrl: m.modelUrl,
        modelWebPath: m.modelWebPath,
        thumbnailUrl: m.thumbnailUrl,
        thumbnailWebPath: m.thumbnailWebPath,
        webPath: m.webPath.replace(/\\/g, "/"),
      };
    });
  }, [sendRequest]);

  const getLocalModelProperties = useCallback(
    async (webPath: string): Promise<ModelLoaderModelProperties> => {
      const response = await sendRequest<ExtensionResponseMessage>(
        "model-loader-model-properties",
        { webPath }
      );
      if (!response.modelProperties) {
        throw new Error("No model properties returned");
      }
      return response.modelProperties;
    },
    [sendRequest]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(
    () => ({
      status: {
        isExtension: true,
        /** Native folder dialog via `model-downloader-pick-folder`. */
        supportsFolderPicker: true,
        defaultOutputDir,
        connectionState: "connected" as const,
        isReady: true,
      },
      loading,
      error,
      clearError,
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
      defaultOutputDir,
      loading,
      error,
      clearError,
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
    ],
  );
}
