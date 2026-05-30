import { useCallback, useEffect, useState } from "react";
import { useEngineInitializer, T3DAssetManager, useQuickSceneStore } from "@ternion/t3d";
import {
  LoadingProgress,
  ErrorDisplay,
  InitializationReport,
} from "@ternion/t3d/ui";
import { GlobalConfig } from "../GlobalConfig";
import { BROWSER_ONLINE_ASSETS_STORAGE_KEY, normalizeAssetBaseUrl } from "./assets-manager";
import { useSerialPortStore } from "./serialport/serial-port-store";
import App from "./App";
import { WebviewFlowShellBackground } from "./webview-launcher/WebviewFlowShellBackground";

export const MyApp = () => {
  // Note: Jolt baseUrl is now automatically resolved by T3DJoltLoader
  // for webviews (uses LOCAL_ASSETS_BASE_URI/jolt or WEBVIEW_BASE_URI/jolt) and browsers (uses /jolt)
  // LOCAL_ASSETS_BASE_URI and WEBVIEW_BASE_URI are assigned in extension.ts (check the _getHtmlForWebview method)
  const result = useEngineInitializer();
  const [isReportClosed, setIsReportClosed] = useState(false);

  /**
   * VS Code injects `window.ONLINE_ASSETS_BASE_URI` from extension globalState.
   * Browser dev can use localStorage (Assets Manager). Fallback: GlobalConfig default.
   */
  useEffect(() => {
    if (!GlobalConfig.IS_DEV_MODE) {
      const fromWindow =
        typeof window !== "undefined" && window.ONLINE_ASSETS_BASE_URI?.trim()
          ? window.ONLINE_ASSETS_BASE_URI.trim()
          : "";
      let fromStorage = "";
      if (
        typeof window !== "undefined" &&
        !window.WEBVIEW_READY &&
        typeof localStorage !== "undefined"
      ) {
        try {
          fromStorage =
            localStorage.getItem(BROWSER_ONLINE_ASSETS_STORAGE_KEY)?.trim() ??
            "";
        } catch {
          fromStorage = "";
        }
      }
      const fallback = GlobalConfig.ONLINE_ASSETS_BASE_URI;
      const online = normalizeAssetBaseUrl(
        fromWindow || fromStorage || fallback,
      );
      T3DAssetManager.setAssetsBaseUrlToOnline(online);
      console.log(
        "%c[MyApp] Using online assets:",
        "color: lightblue; font-weight: bold;",
        online,
      );
    } else {
      /**
       * Configure asset manager to use local assets from the webview's assets directory.
       * In dev mode (when IS_DEV_MODE is true), assets are loaded from local files.
       * Assets are stored in T3D/assets/ (models, textures, sounds) and copied to
       * apps/t3d-extension/out/webview/assets/ during build via viteStaticCopy plugin.
       * At runtime, LOCAL_ASSETS_BASE_URI ('assets') resolves to the webview's assets directory.
       */
      T3DAssetManager.setAssetsBaseUrlToLocal(
        GlobalConfig.LOCAL_ASSETS_BASE_URI, // 'apps/t3d-extension/out/webview/assets/'
      );
      console.log(
        `%c[MyApp] Using local assets: ${GlobalConfig.LOCAL_ASSETS_BASE_URI}`,
        "color: lightblue; font-weight: bold;",
      );
    }
  }, []);

  /**
   * Connect to the T3D WebSocket broker on load (extension spawns the combined bridge on activate).
   * Uses serial-port-store.connect so serial topics are subscribed once; harmless if the bridge is not up yet (client reconnects).
   */
  useEffect(() => {
    let cancelled = false;
    void useSerialPortStore
      .getState()
      .connect()
      .catch((e) => {
        if (!cancelled) {
          console.warn(
            "[MyApp] WebSocket bridge auto-connect failed (is the bridge running?):",
            e,
          );
        }
      });
    return () => {
      cancelled = true;
      void useSerialPortStore.getState().disconnect().catch(() => {
        // ignore — Bitstream or next MyApp mount will reconnect
      });
    };
  }, []);

  /** Command palette / Assets Manager updates from extension host */
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const d = event.data as { type?: string; baseUrl?: string };
      if (
        d?.type !== "asset-base-url-changed" ||
        typeof d.baseUrl !== "string"
      ) {
        return;
      }
      const url = d.baseUrl.trim();
      window.ONLINE_ASSETS_BASE_URI = url;
      if (!GlobalConfig.IS_DEV_MODE) {
        T3DAssetManager.setAssetsBaseUrlToOnline(normalizeAssetBaseUrl(url));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const isReady = !!result.engine && !result.isLoading;
  const currentApplicationComponent = useQuickSceneStore(
    (s) => s.currentApplicationComponent,
  );
  const loadingSceneId = useQuickSceneStore((s) => s.loadingSceneId);

  /** Nebula/bubbles only for init + welcome; 3D apps use the engine canvas on `body`. */
  const showAnimatedShellBackground =
    result.isLoading ||
    !isReportClosed ||
    (currentApplicationComponent == null && loadingSceneId == null);

  // Timeout for InitializationReport (5 seconds)
  const reportTimeout = 3000;

  const handleReportClose = useCallback(() => {
    setIsReportClosed(true);
  }, []);

  /** Hide static `body::before` (bg1.png) while Digital Twin uses the animated shell. */
  useEffect(() => {
    document.body.classList.add("webview-digital-twin-shell");
    return () => {
      document.body.classList.remove("webview-digital-twin-shell");
    };
  }, []);

  return (
    <div
      className={
        showAnimatedShellBackground
          ? "webview-engine-shell fixed inset-0 z-0 overflow-hidden"
          : "webview-engine-canvas-host fixed inset-0 z-0 overflow-hidden pointer-events-none"
      }
    >
      {showAnimatedShellBackground ? (
        <WebviewFlowShellBackground interactionRootClass="webview-engine-shell" />
      ) : null}

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col pointer-events-none">
        {/* Loading UI with progress information */}
        {result.isLoading && (
          <LoadingProgress
            isLoading={result.isLoading}
            infoMessage={result.infoMessage}
            title="Initializing Engine"
          />
        )}

        {/* Error display */}
        {result.error && <ErrorDisplay error={result.error} />}

        {/* Initialization Report */}
        {!isReportClosed && (
          <InitializationReport
            isReady={isReady}
            hasModel={!!result.model}
            timings={result.timings}
            environmentType={result.environmentType}
            threadCount={result.threadCount}
            autoHideDelay={reportTimeout}
            onDismiss={handleReportClose}
          />
        )}

        {/* App content — mount only after report is closed */}
        {isReportClosed && result.engine && !result.isLoading && (
          <App engine={result.engine} />
        )}
      </div>
    </div>
  );
};
