import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ModelLoaderConfig,
  ModelLoaderDownloadResult,
  ModelLoaderJobEvent,
  ModelLoaderJobState,
  ModelLoaderListResult,
  ModelLoaderLocalEntry,
} from "../types";
import { useModelLoaderRuntimeVscode } from "../runtime/useModelLoaderRuntimeVscode";
import { useModelLoaderRuntimeBrowser } from "../runtime/useModelLoaderRuntimeBrowser";
import { readModelLoaderBrowserConfig } from "../modelLoaderBrowserStorage";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview";

const DEFAULT_CONFIG: ModelLoaderConfig = {
  baseUrl: "https://admin.tesaiot.com",
  apiKey: "",
  caCertPath: "",
};

function getInitialConfigState(): ModelLoaderConfig {
  if (typeof window !== "undefined" && !isVsCodeExtensionWebview()) {
    return readModelLoaderBrowserConfig();
  }
  return DEFAULT_CONFIG;
}
const JOB_HISTORY_STORAGE_KEY_BROWSER = "model-loader-job-history-browser";
const JOB_HISTORY_STORAGE_KEY_WEBVIEW = "model-loader-job-history-webview";

interface ModelLoaderJobHistoryItem {
  jobId: string;
  productId: string;
  outputDir: string;
  includeSourceZip: boolean;
  state: "queued" | "running" | "completed" | "failed" | "cancelled";
  startedAt: number;
  endedAt?: number;
  error?: string;
}

export function useModelLoaderController(active: boolean) {
  const vscodeRuntime = useModelLoaderRuntimeVscode();
  const browserRuntime = useModelLoaderRuntimeBrowser(active);
  const isExtension =
    typeof window !== "undefined" && isVsCodeExtensionWebview();
  const runtime = isExtension ? vscodeRuntime : browserRuntime;

  const [config, setConfig] = useState<ModelLoaderConfig>(getInitialConfigState);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [results, setResults] = useState<ModelLoaderListResult>({
    data: [],
    pagination: {},
  });
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedModelInfo, setSelectedModelInfo] = useState<unknown | null>(null);
  const [lastDownloadResult, setLastDownloadResult] =
    useState<ModelLoaderDownloadResult | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentJobState, setCurrentJobState] = useState<ModelLoaderJobState | null>(
    null
  );
  const [jobEvents, setJobEvents] = useState<ModelLoaderJobEvent[]>([]);
  const [jobHistory, setJobHistory] = useState<ModelLoaderJobHistoryItem[]>([]);
  const [localModels, setLocalModels] = useState<ModelLoaderLocalEntry[]>([]);
  const [includeSourceZip, setIncludeSourceZip] = useState(true);
  const [localModelsError, setLocalModelsError] = useState<string | null>(null);
  const [localModelsLoading, setLocalModelsLoading] = useState(false);
  const hasLoadedConfigForOpenRef = useRef(false);
  const hasAutoListedForOpenRef = useRef(false);

  const historyStorageKey = isExtension
    ? JOB_HISTORY_STORAGE_KEY_WEBVIEW
    : JOB_HISTORY_STORAGE_KEY_BROWSER;

  const refreshLocalModels = useCallback(async () => {
    setLocalModelsLoading(true);
    setLocalModelsError(null);
    try {
      const rows = await runtime.listLocalDownloadedModels();
      setLocalModels(rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLocalModelsError(message);
      setLocalModels([]);
    } finally {
      setLocalModelsLoading(false);
    }
  }, [runtime.listLocalDownloadedModels]);

  const pageRef = useRef(page);
  const limitRef = useRef(limit);
  const refreshLocalModelsRef = useRef(refreshLocalModels);
  const runtimeRef = useRef(runtime);
  pageRef.current = page;
  limitRef.current = limit;
  refreshLocalModelsRef.current = refreshLocalModels;
  runtimeRef.current = runtime;

  /**
   * Load persisted config + auto-list **once per open** (`active` true).
   * Do NOT depend on `runtime.loadConfig` / `runtime.listModels` identities: those
   * callbacks can change when the VS Code extension config updates, which would
   * re-run this effect, reset refs, and `setConfig(loaded)` would wipe the API key
   * field while the user is typing.
   */
  useEffect(() => {
    if (!active) {
      hasLoadedConfigForOpenRef.current = false;
      hasAutoListedForOpenRef.current = false;
      return;
    }
    if (hasLoadedConfigForOpenRef.current) {
      return;
    }
    hasLoadedConfigForOpenRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await runtimeRef.current.loadConfig();
        if (!cancelled) {
          setConfig(loaded);
        }
        const maxAttempts = 3;
        for (let i = 0; i < maxAttempts; i++) {
          if (cancelled) {
            return;
          }
          try {
            const onlineList = runtimeRef.current.listModels(
              loaded,
              pageRef.current,
              limitRef.current
            );
            const localList = refreshLocalModelsRef.current();
            const [onlineResult] = await Promise.allSettled([onlineList, localList]);
            if (cancelled) {
              return;
            }
            if (onlineResult.status === "fulfilled") {
              hasAutoListedForOpenRef.current = true;
              const listed = onlineResult.value;
              setResults(listed);
              setSelectedModelInfo(null);
              setLastDownloadResult(null);
              setSelectedProductId((prev) => {
                if (prev.trim()) {
                  return prev;
                }
                return listed.data[0]?.productId ?? "";
              });
              return;
            }
          } catch {
            // Retry below; browser bridge may still be connecting.
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (!cancelled) {
          console.error("[ModelLoader] Auto-list on open exhausted retries");
        }
      } catch (err) {
        console.error("[ModelLoader] Failed to load config", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  const saveConfig = useCallback(async () => {
    await runtime.saveConfig(config);
  }, [runtime, config]);

  const listModels = useCallback(async () => {
    const listed = await runtime.listModels(config, page, limit);
    setResults(listed);
    setSelectedModelInfo(null);
    setLastDownloadResult(null);
    if (!selectedProductId && listed.data.length > 0) {
      setSelectedProductId(listed.data[0]!.productId);
    }
    void refreshLocalModels();
  }, [runtime, config, page, limit, selectedProductId, refreshLocalModels]);

  const getModelInfo = useCallback(async () => {
    if (!selectedProductId.trim()) return;
    const info = await runtime.getModelInfo(config, selectedProductId.trim());
    setSelectedModelInfo(info);
    setLastDownloadResult(null);
  }, [runtime, config, selectedProductId]);

  const runDownloadForProduct = useCallback(
    async (productId: string, outputDir: string, includeZip: boolean) => {
      const jobId = await runtime.startDownloadJob(
        config,
        productId,
        outputDir,
        includeZip
      );
      setCurrentJobId(jobId);
      setCurrentJobState({ jobId, state: "queued" });
      setJobHistory((prev) => [
        {
          jobId,
          productId,
          outputDir,
          includeSourceZip: includeZip,
          state: "queued",
          startedAt: Date.now(),
        },
        ...prev,
      ]);
      const maxAttempts = 300;
      for (let i = 0; i < maxAttempts; i++) {
        const status = await runtime.getDownloadJobStatus(jobId);
        setCurrentJobState(status);
        setJobHistory((prev) =>
          prev.map((item) =>
            item.jobId === jobId
              ? {
                  ...item,
                  state: status.state,
                  error: status.error,
                  endedAt:
                    status.state === "completed" ||
                    status.state === "failed" ||
                    status.state === "cancelled"
                      ? Date.now()
                      : item.endedAt,
                }
              : item
          )
        );
        if (status.state === "completed" && status.result) {
          setLastDownloadResult(status.result);
          void refreshLocalModels();
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
    },
    [runtime, config, refreshLocalModels]
  );

  const downloadModel = useCallback(
    async (outputDir: string, includeZip = includeSourceZip) => {
      if (!selectedProductId.trim()) return;
      const productId = selectedProductId.trim();
      return runDownloadForProduct(productId, outputDir, includeZip);
    },
    [selectedProductId, includeSourceZip, runDownloadForProduct]
  );

  const downloadAllModels = useCallback(
    async (outputDir: string, includeZip = includeSourceZip) => {
      const productIds = Array.from(
        new Set(
          results.data
            .map((row) => row.productId.trim())
            .filter((id) => id.length > 0)
        )
      );
      if (productIds.length === 0) {
        return { total: 0, succeeded: 0, failed: 0 };
      }
      let succeeded = 0;
      let failed = 0;
      for (const productId of productIds) {
        setSelectedProductId(productId);
        try {
          await runDownloadForProduct(productId, outputDir, includeZip);
          succeeded += 1;
        } catch {
          failed += 1;
        }
      }
      return {
        total: productIds.length,
        succeeded,
        failed,
      };
    },
    [results.data, includeSourceZip, runDownloadForProduct]
  );

  const downloadModelInfoJson = useCallback(
    async (outputDir: string) => {
      if (!selectedProductId.trim()) return;
      const result = await runtime.downloadModelInfoJson(
        config,
        selectedProductId.trim(),
        outputDir
      );
      setLastDownloadResult(result);
      void refreshLocalModels();
      return result;
    },
    [runtime, config, selectedProductId, refreshLocalModels]
  );

  const cancelDownload = useCallback(async () => {
    if (!currentJobId) return false;
    const cancelled = await runtime.cancelDownloadJob(currentJobId);
    if (cancelled) {
      setCurrentJobState((prev) =>
        prev ? { ...prev, state: "cancelled" } : { jobId: currentJobId, state: "cancelled" }
      );
      setJobHistory((prev) =>
        prev.map((item) =>
          item.jobId === currentJobId
            ? { ...item, state: "cancelled", endedAt: Date.now() }
            : item
        )
      );
    }
    return cancelled;
  }, [runtime, currentJobId]);

  const retryJob = useCallback(
    async (jobId: string) => {
      const target = jobHistory.find((item) => item.jobId === jobId);
      if (!target) return;
      setSelectedProductId(target.productId);
      await downloadModel(target.outputDir, target.includeSourceZip ?? true);
    },
    [jobHistory, downloadModel]
  );

  useEffect(() => {
    if (!runtime.latestJobEvent) return;
    const ev = runtime.latestJobEvent as ModelLoaderJobEvent;
    setJobEvents((prev) => {
      const head = prev[0];
      const key = `${ev.jobId}|${ev.state}|${ev.eventType ?? ""}`;
      const headKey = head
        ? `${head.jobId}|${head.state}|${head.eventType ?? ""}`
        : "";
      if (headKey === key) {
        return prev;
      }
      return [ev, ...prev].slice(0, 50);
    });
    if (ev.jobId) {
      setCurrentJobId(ev.jobId);
    }
  }, [runtime.latestJobEvent]);

  useEffect(() => {
    if (!active) {
      return;
    }
    try {
      const raw = localStorage.getItem(historyStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as ModelLoaderJobHistoryItem[];
      if (Array.isArray(parsed)) {
        setJobHistory(parsed.slice(0, 100));
      }
    } catch {
      // Ignore malformed persisted history
    }
  }, [active, historyStorageKey]);

  useEffect(() => {
    if (!active) {
      return;
    }
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(jobHistory.slice(0, 100)));
    } catch {
      // Ignore storage write failure
    }
  }, [active, historyStorageKey, jobHistory]);

  const clearJobHistory = useCallback(() => {
    setJobHistory([]);
    try {
      localStorage.removeItem(historyStorageKey);
    } catch {
      // Ignore storage remove failure
    }
  }, [historyStorageKey]);

  return useMemo(
    () => ({
      runtime,
      config,
      setConfig,
      page,
      setPage,
      limit,
      setLimit,
      results,
      selectedProductId,
      setSelectedProductId,
      selectedModelInfo,
      lastDownloadResult,
      currentJobId,
      currentJobState,
      jobEvents,
      jobHistory,
      localModels,
      includeSourceZip,
      setIncludeSourceZip,
      localModelsError,
      localModelsLoading,
      saveConfig,
      listModels,
      getModelInfo,
      downloadModel,
      downloadAllModels,
      downloadModelInfoJson,
      cancelDownload,
      retryJob,
      clearJobHistory,
      refreshLocalModels,
    }),
    [
      runtime,
      config,
      page,
      limit,
      results,
      selectedProductId,
      selectedModelInfo,
      lastDownloadResult,
      currentJobId,
      currentJobState,
      jobEvents,
      jobHistory,
      localModels,
      includeSourceZip,
      localModelsError,
      localModelsLoading,
      saveConfig,
      listModels,
      getModelInfo,
      downloadModel,
      downloadAllModels,
      downloadModelInfoJson,
      cancelDownload,
      retryJob,
      clearJobHistory,
      refreshLocalModels,
      setIncludeSourceZip,
    ]
  );
}
