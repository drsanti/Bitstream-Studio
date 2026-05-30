import { useCallback, useEffect, useRef, useState } from "react";
import { getVsCodeApi } from "../../extension-bridge/getVsCodeApi.js";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview.js";

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type ExtensionDefaultDownloadPaths = {
  userAssetsRootFs: string;
  freeGithubRootFs: string;
  modelDownloadsRootFs: string;
  tesaiotTexturesRootFs: string;
};

export type RevealPathResult = { ok: true } | { ok: false; error: string };

/**
 * Fetches `globalStorage/.../assets` roots from the extension host (same contract as
 * Model Loader / Free assets loader). Copy / reveal use the returned absolute paths.
 */
export function useExtensionDefaultDownloadPaths() {
  const isExtensionHost = isVsCodeExtensionWebview();
  const [paths, setPaths] = useState<ExtensionDefaultDownloadPaths | null>(null);
  const [loading, setLoading] = useState(isExtensionHost);

  const pathsRequestIdRef = useRef<string | null>(null);
  const revealResolversRef = useRef(
    new Map<string, (result: RevealPathResult) => void>(),
  );

  const requestPaths = useCallback(() => {
    const vscodeApi = getVsCodeApi();
    if (!isExtensionHost || vscodeApi == null) {
      setLoading(false);
      return;
    }
    const requestId = nextRequestId();
    pathsRequestIdRef.current = requestId;
    setLoading(true);
    vscodeApi.postMessage({ type: "asset-get-default-download-paths", requestId });
  }, [isExtensionHost]);

  useEffect(() => {
    if (!isExtensionHost) {
      setLoading(false);
      return;
    }
    requestPaths();
  }, [isExtensionHost, requestPaths]);

  useEffect(() => {
    if (!isExtensionHost) {
      return;
    }
    const onMessage = (event: MessageEvent) => {
      const d = event.data as {
        type?: string;
        requestId?: string;
        defaultDownloadPaths?: ExtensionDefaultDownloadPaths;
        revealPathOk?: boolean;
        revealPathError?: string;
      };
      if (d.type === "asset-default-download-paths-response" && d.defaultDownloadPaths) {
        if (d.requestId !== pathsRequestIdRef.current) {
          return;
        }
        pathsRequestIdRef.current = null;
        setPaths(d.defaultDownloadPaths);
        setLoading(false);
        return;
      }
      if (d.type === "asset-reveal-path-result" && d.requestId) {
        const resolve = revealResolversRef.current.get(d.requestId);
        if (resolve == null) {
          return;
        }
        revealResolversRef.current.delete(d.requestId);
        if (d.revealPathOk) {
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: d.revealPathError ?? "Reveal failed" });
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isExtensionHost]);

  const revealAbsolutePath = useCallback((absolutePath: string) => {
    return new Promise<RevealPathResult>((resolve) => {
      const vscodeApi = getVsCodeApi();
      if (vscodeApi == null) {
        resolve({ ok: false, error: "VS Code API is not available" });
        return;
      }
      const trimmed = absolutePath.trim();
      if (!trimmed) {
        resolve({ ok: false, error: "Path is empty" });
        return;
      }
      const requestId = nextRequestId();
      revealResolversRef.current.set(requestId, resolve);
      vscodeApi.postMessage({
        type: "reveal-path-in-os",
        requestId,
        absolutePath: trimmed,
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      revealResolversRef.current.clear();
    };
  }, []);

  return {
    isExtensionHost,
    paths,
    loading,
    refreshPaths: requestPaths,
    revealAbsolutePath,
  };
}
