/**
 * Extension-only helpers for Model Downloader.
 * Uses postMessage to extension host. Only available in VSCode/Cursor webview.
 * Use for: getConfig, setConfig, pickFolder (requires native folder picker).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVsCodeApi } from "../extension-bridge/getVsCodeApi";

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface ModelDownloaderExtensionConfig {
  baseUrl: string;
  hasApiKey: boolean;
  caCertPath?: string;
}

interface ExtensionMessageEvent {
  data: {
    type: string;
    requestId?: string;
    error?: string;
    modelDownloaderConfig?: ModelDownloaderExtensionConfig;
    selectedFolder?: string;
  };
}

export interface UseModelDownloaderExtensionResult {
  getConfig: () => Promise<ModelDownloaderExtensionConfig | null>;
  setConfig: (config: {
    baseUrl?: string;
    apiKey?: string;
    caCertPath?: string;
  }) => Promise<ModelDownloaderExtensionConfig | null>;
  pickFolder: () => Promise<string | undefined>;
  config: ModelDownloaderExtensionConfig | null;
  isAvailable: boolean;
}

export function useModelDownloaderExtension(): UseModelDownloaderExtensionResult {
  const vscodeApi = getVsCodeApi();
  const isAvailable = vscodeApi !== null && vscodeApi !== undefined;

  const [config, setConfigState] = useState<ModelDownloaderExtensionConfig | null>(null);
  const pendingRef = useRef<
    Map<
      string,
      {
        resolve: (value: unknown) => void;
        reject: (reason: Error) => void;
      }
    >
  >(new Map());

  const handleMessage = useCallback((event: ExtensionMessageEvent) => {
    const msg = event.data;
    const reqId = msg.requestId;
    if (!reqId) return;

    const pending = pendingRef.current.get(reqId);
    if (!pending) return;

    pendingRef.current.delete(reqId);

    if (msg.type === "model-downloader-error") {
      pending.reject(new Error(msg.error || "Unknown error"));
      return;
    }

    if (msg.type === "model-downloader-config-response") {
      setConfigState(msg.modelDownloaderConfig ?? null);
      pending.resolve(msg.modelDownloaderConfig);
      return;
    }

    if (msg.type === "model-downloader-pick-folder-response") {
      pending.resolve(msg.selectedFolder);
      return;
    }
  }, []);

  useEffect(() => {
    if (!isAvailable) return;
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isAvailable, handleMessage]);

  const sendRequest = useCallback(
    <T>(type: string, payload: Record<string, unknown>): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!vscodeApi) {
          reject(new Error("VS Code API not available (not running in webview)"));
          return;
        }
        const reqId = nextRequestId();
        pendingRef.current.set(reqId, {
          resolve: resolve as (v: unknown) => void,
          reject,
        });
        vscodeApi.postMessage({ type, requestId: reqId, ...payload });
      });
    },
    [vscodeApi]
  );

  const setConfig = useCallback(
    async (cfg: {
      baseUrl?: string;
      apiKey?: string;
      caCertPath?: string;
    }) => {
      const result = (await sendRequest("model-downloader-set-config", {
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        caCertPath: cfg.caCertPath,
      })) as ModelDownloaderExtensionConfig | null;
      return result;
    },
    [sendRequest]
  );

  const getConfig = useCallback(async () => {
    const result = (await sendRequest("model-downloader-get-config", {})) as
      | ModelDownloaderExtensionConfig
      | null;
    return result;
  }, [sendRequest]);

  const pickFolder = useCallback(async () => {
    const result = (await sendRequest("model-downloader-pick-folder", {})) as
      | string
      | undefined;
    return result;
  }, [sendRequest]);

  useEffect(() => {
    if (isAvailable) {
      getConfig().catch(() => {});
    }
  }, [isAvailable, getConfig]);

  return useMemo(
    () => ({
      getConfig,
      setConfig,
      pickFolder,
      config,
      isAvailable,
    }),
    [getConfig, setConfig, pickFolder, config, isAvailable],
  );
}
