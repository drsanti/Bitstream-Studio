import { useCallback, useEffect, useRef, useState } from "react";
import { getVsCodeApi } from "../extension-bridge/getVsCodeApi.js";
import { useFreeAssetsSyncOverWs } from "../asset-sync/useFreeAssetsSyncOverWs.js";
import { canUseHostedAssetBootstrap } from "../webviewHostCapabilities.js";
import { isVsCodeExtensionWebview } from "../isVsCodeExtensionWebview.js";
import { fetchBrowserAssetBootstrapHostCheck } from "./browserAssetBootstrapCheck.js";
import {
  runAssetBootstrapReadiness,
  type AssetBootstrapHostCheck,
  type AssetBootstrapReadiness,
} from "./runAssetBootstrapReadiness.js";
import { useAssetBootstrapActionsStore } from "./assetBootstrapActions.store.js";
import { scheduleWebviewReloadAfterAssetSync } from "./requestWebviewReloadAfterAssetSync.js";
import { ternionFreeAssetPackCopy } from "./ternionFreeAssetPackCopy.js";

export type AssetBootstrapPhase =
  | "idle"
  | "checking"
  | "ready"
  | "blocked"
  | "syncing"
  | "error";

export type AssetBootstrapSyncProgress = {
  percent: number | null;
  phase: "listing" | "downloading" | "done" | "error" | null;
  currentPath: string | null;
  fileIndex: number | null;
  totalFiles: number | null;
};

export type UseAssetBootstrapResult = {
  phase: AssetBootstrapPhase;
  readiness: AssetBootstrapReadiness | null;
  hostCheck: AssetBootstrapHostCheck | null;
  statusLine: string | null;
  syncPercent: number | null;
  syncProgress: AssetBootstrapSyncProgress | null;
  recheck: () => void;
  startRequiredSync: () => void;
};

function postBootstrapCheck(requestId: string): void {
  getVsCodeApi()?.postMessage({ type: "asset-bootstrap-check", requestId });
}

export function useAssetBootstrap(): UseAssetBootstrapResult {
  const isExtension = isVsCodeExtensionWebview();
  const useBootstrap = canUseHostedAssetBootstrap();
  const useBrowserBridge = useBootstrap && !isExtension;

  const ws = useFreeAssetsSyncOverWs();

  const [phase, setPhase] = useState<AssetBootstrapPhase>(useBootstrap ? "checking" : "ready");
  const [readiness, setReadiness] = useState<AssetBootstrapReadiness | null>(null);
  const [hostCheck, setHostCheck] = useState<AssetBootstrapHostCheck | null>(null);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [syncPercent, setSyncPercent] = useState<number | null>(null);
  const [syncProgress, setSyncProgress] = useState<AssetBootstrapSyncProgress | null>(null);
  const bootstrapRequestIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const syncRequestIdRef = useRef<string | null>(null);
  const browserSyncActiveRef = useRef(false);

  const runReadinessFromHost = useCallback(async (host: AssetBootstrapHostCheck) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase("checking");
    setStatusLine(ternionFreeAssetPackCopy.verifying);
    try {
      const result = await runAssetBootstrapReadiness(host, ac.signal);
      if (ac.signal.aborted) {
        return;
      }
      setReadiness(result);
      if (result.status === "ready") {
        setPhase("ready");
        setStatusLine(null);
        return;
      }
      setPhase("blocked");
      setStatusLine(
        result.reason === "offline"
          ? ternionFreeAssetPackCopy.results.packMissingOffline
          : result.reason === "missing-disk"
            ? ternionFreeAssetPackCopy.results.packMissing
            : ternionFreeAssetPackCopy.results.verifyFailed,
      );
    } catch (e) {
      if (!ac.signal.aborted) {
        setPhase("error");
        setStatusLine(e instanceof Error ? e.message : String(e));
      }
    }
  }, []);

  const runBrowserBootstrapCheck = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase("checking");
    setStatusLine(ternionFreeAssetPackCopy.verifying);
    try {
      const host = await fetchBrowserAssetBootstrapHostCheck(
        {
          connect: ws.connect,
          listFreeAssets: ws.listFreeAssets,
          listLocalFreeAssets: ws.listLocalFreeAssets,
          fetchDefaultBridgeOutputDir: ws.fetchDefaultBridgeOutputDir,
        },
        ac.signal,
      );
      if (ac.signal.aborted) {
        return;
      }
      setHostCheck(host);
      await runReadinessFromHost(host);
    } catch (e) {
      if (!ac.signal.aborted) {
        setPhase("error");
        const msg = e instanceof Error ? e.message : String(e);
        setStatusLine(
          msg.includes("Not connected") || msg.includes("bridge")
            ? `${msg} — run npm run start:bridge in extension/`
            : msg,
        );
      }
    }
  }, [
    runReadinessFromHost,
    ws.connect,
    ws.fetchDefaultBridgeOutputDir,
    ws.listFreeAssets,
    ws.listLocalFreeAssets,
  ]);

  const recheck = useCallback(() => {
    if (!useBootstrap) {
      setPhase("ready");
      return;
    }
    if (useBrowserBridge) {
      void runBrowserBootstrapCheck();
      return;
    }
    const requestId = `bootstrap-${Date.now()}`;
    bootstrapRequestIdRef.current = requestId;
    postBootstrapCheck(requestId);
  }, [runBrowserBootstrapCheck, useBootstrap, useBrowserBridge]);

  const startRequiredSync = useCallback(() => {
    if (useBrowserBridge) {
      browserSyncActiveRef.current = true;
      setPhase("syncing");
      setSyncPercent(0);
      setSyncProgress({
        percent: 0,
        phase: "listing",
        currentPath: null,
        fileIndex: null,
        totalFiles: null,
      });
      setStatusLine(ternionFreeAssetPackCopy.downloading);
      void (async () => {
        try {
          await ws.connect();
          const res = await ws.syncFreeAssets();
          browserSyncActiveRef.current = false;
          const errs = res.errors?.length ?? 0;
          if (res.error || errs > 0) {
            setPhase("blocked");
            setStatusLine(res.error ?? ternionFreeAssetPackCopy.results.syncFailed);
            setSyncPercent(null);
            setSyncProgress(null);
            return;
          }
          setSyncPercent(100);
          setSyncProgress((prev) => ({
            percent: 100,
            phase: "done",
            currentPath: prev?.currentPath ?? null,
            fileIndex: prev?.fileIndex ?? null,
            totalFiles: prev?.totalFiles ?? null,
          }));
          setStatusLine(ternionFreeAssetPackCopy.results.reloadAfterSync);
          scheduleWebviewReloadAfterAssetSync();
          void runBrowserBootstrapCheck();
        } catch (e) {
          browserSyncActiveRef.current = false;
          setPhase("blocked");
          setStatusLine(e instanceof Error ? e.message : String(e));
          setSyncPercent(null);
          setSyncProgress(null);
        }
      })();
      return;
    }

    const vscodeApi = getVsCodeApi();
    if (vscodeApi == null) {
      return;
    }
    const requestId = `bootstrap-sync-${Date.now()}`;
    syncRequestIdRef.current = requestId;
    setPhase("syncing");
    setSyncPercent(0);
    setSyncProgress({
      percent: 0,
      phase: "listing",
      currentPath: null,
      fileIndex: null,
      totalFiles: null,
    });
    setStatusLine(ternionFreeAssetPackCopy.downloading);
    vscodeApi.postMessage({
      type: "asset-sync-free-pack-start",
      requestId,
    });
  }, [runBrowserBootstrapCheck, useBrowserBridge, ws]);

  useEffect(() => {
    if (!useBrowserBridge || !browserSyncActiveRef.current) {
      return;
    }
    const prog = ws.downloadProgress;
    if (prog == null) {
      return;
    }
    const pct = typeof prog.percent === "number" ? Math.round(prog.percent) : null;
    setSyncPercent(pct);
    setSyncProgress({
      percent: pct,
      phase: prog.phase ?? "downloading",
      currentPath: prog.currentPath ?? null,
      fileIndex: typeof prog.fileIndex === "number" ? prog.fileIndex : null,
      totalFiles: typeof prog.totalFiles === "number" ? prog.totalFiles : null,
    });
  }, [useBrowserBridge, ws.downloadProgress]);

  useEffect(() => {
    if (!isExtension) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      const d = event.data as {
        type?: string;
        requestId?: string;
        error?: string;
        assetBootstrapCheck?: AssetBootstrapHostCheck;
        assetSyncProgress?: {
          percent?: number;
          phase?: "listing" | "downloading" | "done" | "error";
          currentPath?: string;
          fileIndex?: number;
          totalFiles?: number;
        };
        assetSyncResult?: { errors?: string[] };
      };

      if (
        d.type === "asset-bootstrap-check-response" &&
        d.requestId != null &&
        d.requestId === bootstrapRequestIdRef.current
      ) {
        if (d.error) {
          setPhase("error");
          setStatusLine(d.error);
          return;
        }
        if (!d.assetBootstrapCheck) {
          return;
        }
        const host: AssetBootstrapHostCheck = {
          freeRootFs: d.assetBootstrapCheck.freeRootFs,
          allPresentOnDisk: d.assetBootstrapCheck.allPresentOnDisk,
          internetReachable: d.assetBootstrapCheck.internetReachable,
          internetProbeUrl: d.assetBootstrapCheck.internetProbeUrl,
          rows: d.assetBootstrapCheck.rows,
          freePackRemoteFileCount: d.assetBootstrapCheck.freePackRemoteFileCount,
          freePackLocalFileCount: d.assetBootstrapCheck.freePackLocalFileCount,
          freePackMissingSample: d.assetBootstrapCheck.freePackMissingSample,
          freePackIndexUnavailable: d.assetBootstrapCheck.freePackIndexUnavailable,
        };
        setHostCheck(host);
        void runReadinessFromHost(host);
        return;
      }

      if (
        d.type === "asset-sync-free-pack-progress" &&
        syncRequestIdRef.current != null &&
        d.requestId === syncRequestIdRef.current
      ) {
        const prog = d.assetSyncProgress;
        const pct =
          typeof prog?.percent === "number" ? Math.round(prog.percent) : null;
        setSyncPercent(pct);
        setSyncProgress({
          percent: pct,
          phase: prog?.phase ?? "downloading",
          currentPath: prog?.currentPath ?? null,
          fileIndex: typeof prog?.fileIndex === "number" ? prog.fileIndex : null,
          totalFiles: typeof prog?.totalFiles === "number" ? prog.totalFiles : null,
        });
        return;
      }

      if (
        d.type === "asset-sync-free-pack-complete" &&
        syncRequestIdRef.current != null &&
        d.requestId === syncRequestIdRef.current
      ) {
        syncRequestIdRef.current = null;
        const errs = d.assetSyncResult?.errors?.length ?? 0;
        if (d.error || errs > 0) {
          setPhase("blocked");
          setStatusLine(
            d.error ?? ternionFreeAssetPackCopy.results.syncFailed,
          );
          setSyncPercent(null);
          setSyncProgress(null);
          return;
        }
        setSyncPercent(100);
        setSyncProgress((prev) => ({
          percent: 100,
          phase: "done",
          currentPath: prev?.currentPath ?? null,
          fileIndex: prev?.fileIndex ?? null,
          totalFiles: prev?.totalFiles ?? null,
        }));
        setStatusLine(ternionFreeAssetPackCopy.results.reloadAfterSync);
        scheduleWebviewReloadAfterAssetSync();
      }
    };

    window.addEventListener("message", onMessage);
    recheck();

    const vscodeApi = getVsCodeApi();
    vscodeApi?.postMessage({ type: "asset-config" });

    return () => {
      window.removeEventListener("message", onMessage);
      abortRef.current?.abort();
    };
  }, [isExtension, recheck, runReadinessFromHost]);

  useEffect(() => {
    if (!useBrowserBridge) {
      return;
    }
    void runBrowserBootstrapCheck();
    return () => {
      abortRef.current?.abort();
      void ws.disconnect();
    };
  }, [runBrowserBootstrapCheck, useBrowserBridge, ws.disconnect]);

  useEffect(() => {
    useAssetBootstrapActionsStore.getState().register({ recheck, startRequiredSync });
    return () => {
      useAssetBootstrapActionsStore.getState().unregister();
    };
  }, [recheck, startRequiredSync]);

  useEffect(() => {
    useAssetBootstrapActionsStore.getState().setRuntime({
      phase,
      internetReachable: hostCheck?.internetReachable ?? false,
    });
  }, [phase, hostCheck?.internetReachable]);

  return {
    phase,
    readiness,
    hostCheck,
    statusLine,
    syncPercent,
    syncProgress,
    recheck,
    startRequiredSync,
  };
}
