import {
  T3D,
  T3DLogger,
  useQuickSceneStore,
  loadScene,
  getQuickSceneCatalog,
} from "@ternion/t3d";
import {
  QuickScenePanel,
  QuickToolbar,
  SettingsDialog,
  QuickActionDialog,
  useQuickAction,
  useSettingsUIStore,
  useCameraViewQuickAction,
  DevToolbar,
  LoadingProgress,
} from "@ternion/t3d/ui";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import {
  Package,
  Settings,
  Cpu,
  Download,
  CloudDownload,
  Activity,
  MessageSquare,
} from "lucide-react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { EnvironmentInfoCard, TailwindTestCard } from "./ui/components/demo";
import { ModelCatalogDashboard } from "./model-catalog/ModelCatalogDashboard";
import { ModelLoaderDashboard } from "./model-loader/ModelLoaderDashboard";
import { FreeAssetsLoaderDashboard } from "./free-assets-loader/FreeAssetsLoaderDashboard";
import { GlobalShellOverlays } from "./GlobalShellOverlays";
import { useAdminWebsocketActivityStore } from "./bitstream-app/system-tools/admin-websocket-activity.store";
import { usePostMessageTraceStore } from "./post-message-trace/post-message-trace.store";
import { DevModeBadge } from "./ui/components";
import { usePreviewMeshMissingUiStore } from "./bitstream-app/state/previewMeshMissingUi.store";

// ===== App =====
function App({ engine }: { engine: T3D }) {
  /**
   * Set the log level to debug
   */
  T3DLogger.setLogLevel("error");

  /**
   * Quick Scene dialog - uses store directly
   */
  const setQuickSceneOpen = useQuickSceneStore((state) => state.setOpen);
  const currentApplicationComponent = useQuickSceneStore(
    (state) => state.currentApplicationComponent,
  );
  const currentModel = useQuickSceneStore((state) => state.currentModel);
  const loadingSceneId = useQuickSceneStore((state) => state.loadingSceneId);
  const setLoadingSceneId = useQuickSceneStore(
    (state) => state.setLoadingSceneId,
  );
  const recordExecution = useQuickSceneStore((state) => state.recordExecution);
  const setCurrentApplicationComponent = useQuickSceneStore(
    (state) => state.setCurrentApplicationComponent,
  );

  /**
   * Settings dialog - declared early for use in default Quick Action commands
   */
  const setSettingsDialogOpen = useSettingsUIStore(
    (state) => state.setDialogOpen,
  );

  /**
   * Quick Action commands management (for auto-load)
   */
  const { registerCommand, unregisterCommand } = useQuickAction();
  const registeredCommandIds = useQuickSceneStore(
    (state) => state.registeredCommandIds,
  );
  const setRegisteredCommandIds = useQuickSceneStore(
    (state) => state.setRegisteredCommandIds,
  );
  const autoLoadAttempted = useRef(false);

  /**
   * Default Quick Action commands (Model Catalog, Open Settings, Open Quick Scene).
   * Use a ref to avoid duplicate registration in React StrictMode.
   */
  const defaultCommandsRegisteredRef = useRef(false);
  const [modelCatalogOpen, setModelCatalogOpen] = useState(false);
  const modelLoaderOpen = usePreviewMeshMissingUiStore((s) => s.modelLoaderOpen);
  const setModelLoaderOpen = usePreviewMeshMissingUiStore(
    (s) => s.setModelLoaderOpen,
  );
  const freeAssetsLoaderOpen = usePreviewMeshMissingUiStore(
    (s) => s.freeAssetsLoaderOpen,
  );
  const setFreeAssetsLoaderOpen = usePreviewMeshMissingUiStore(
    (s) => s.setFreeAssetsLoaderOpen,
  );
  const openAdminWebsocketActivity = useAdminWebsocketActivityStore(
    (s) => s.open,
  );
  const openPostMessageTrace = usePostMessageTraceStore((s) => s.open);
  const [fatalStartupError, setFatalStartupError] = useState<string | null>(
    null,
  );

  useLayoutEffect(() => {
    if (defaultCommandsRegisteredRef.current) {
      return;
    }
    defaultCommandsRegisteredRef.current = true;

    registerCommand({
      id: "model-catalog-open",
      label: "Model Catalog",
      icon: Package,
      keywords: [
        "model",
        "catalog",
        "library",
        "assets",
        "glb",
        "gltf",
        "free",
        "preview",
      ],
      action: () => {
        setModelCatalogOpen(true);
      },
    });

    registerCommand({
      id: "open-settings",
      label: "Open Settings",
      icon: Settings,
      keywords: ["settings", "preferences", "config", "configuration"],
      action: () => {
        setSettingsDialogOpen(true);
      },
    });

    registerCommand({
      id: "open-quick-scene",
      label: "Open Quick Scene",
      icon: Cpu,
      keywords: ["scene", "quick", "load", "switch", "scenes"],
      action: () => {
        setQuickSceneOpen(true);
      },
    });

    registerCommand({
      id: "model-loader-open",
      label: "Model Loader",
      icon: Download,
      keywords: [
        "model",
        "loader",
        "download",
        "store",
        "assets",
        "glb",
        "gltf",
      ],
      action: () => {
        setModelLoaderOpen(true);
      },
    });

    registerCommand({
      id: "ws-broker-monitor-open",
      label: "WebSocket activity",
      icon: Activity,
      keywords: [
        "websocket",
        "ws",
        "broker",
        "monitor",
        "telemetry",
        "serial",
        "subscription",
      ],
      action: () => {
        openAdminWebsocketActivity();
      },
    });

    registerCommand({
      id: "post-message-trace-open",
      label: "Extension messaging trace",
      icon: MessageSquare,
      keywords: [
        "postmessage",
        "webview",
        "extension",
        "vscode",
        "host",
        "ipc",
        "message",
        "debug",
      ],
      action: () => {
        openPostMessageTrace();
      },
    });

    registerCommand({
      id: "free-assets-loader-open",
      label: "Free Loader",
      icon: CloudDownload,
      keywords: [
        "free",
        "github",
        "assets",
        "sync",
        "textures",
        "models",
        "ternion",
        "pack",
        "online",
        "cdn",
        "base url",
        "assets manager",
        "loader",
      ],
      action: () => {
        setFreeAssetsLoaderOpen(true);
      },
    });

    return () => {
      defaultCommandsRegisteredRef.current = false;
      unregisterCommand("model-catalog-open");
      unregisterCommand("open-settings");
      unregisterCommand("open-quick-scene");
      unregisterCommand("model-loader-open");
      unregisterCommand("ws-broker-monitor-open");
      unregisterCommand("post-message-trace-open");
      unregisterCommand("free-assets-loader-open");
    };
  }, [
    registerCommand,
    unregisterCommand,
    setSettingsDialogOpen,
    setQuickSceneOpen,
    openAdminWebsocketActivity,
    openPostMessageTrace,
  ]);

  const settingsDialogOpen = useSettingsUIStore((state) => state.dialogOpen);

  /**
   * Register camera view save/load quick action commands
   */
  useCameraViewQuickAction({ engine });

  /**
   * Auto-load scene: Check for pending scene (after COI reload) or load default
   */
  useEffect(() => {
    // Only attempt auto-load once and if engine is available
    if (autoLoadAttempted.current || !engine) {
      return;
    }

    // Only auto-load if no scene is currently loaded
    if (currentApplicationComponent !== null) {
      return;
    }

    autoLoadAttempted.current = true;

    // Always land on Welcome first. If a pending scene ID exists (e.g. after a COI reload),
    // clear it so we don't unexpectedly resume an old scene on startup.
    const pendingSceneId = useQuickSceneStore.getState().getPendingSceneId();
    if (pendingSceneId) {
      console.log(
        `[App] Clearing pending scene on startup (landing on Welcome): ${pendingSceneId}`,
      );
      useQuickSceneStore.getState().clearPendingSceneId();
    }

    const sceneIdToLoad = "landing-page";
    console.log(`[App] Auto-loading default scene: ${sceneIdToLoad}`);

    /**
     * Load scene (pending scene after COI reload, or default Welcome scene)
     */
    loadScene(sceneIdToLoad, engine, {
      registerCommand,
      unregisterCommand,
      setLoadingSceneId,
      recordExecution,
      setCurrentApplicationComponent,
      registeredCommandIds,
      setRegisteredCommandIds,
      showToast: false, // Don't show toasts for auto-load
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const isWebGlUnavailable =
        /webgl/i.test(message) ||
        (error instanceof Error &&
          "code" in error &&
          (error as Error & { code?: string }).code ===
            "T3D_WEBGL_UNAVAILABLE");

      if (isWebGlUnavailable) {
        console.error("[App] WebGL unavailable in current host:", error);
        setFatalStartupError(
          "WebGL is unavailable in this host environment. Please enable hardware acceleration or open the app in an external browser.",
        );
        return;
      }

      console.error("[App] Failed to auto-load scene:", error);
      // Reset the flag so it can be retried if needed
      autoLoadAttempted.current = false;
    });

    /**
     *
     */
  }, [
    engine,
    currentApplicationComponent,
    registerCommand,
    unregisterCommand,
    setLoadingSceneId,
    recordExecution,
    setCurrentApplicationComponent,
    registeredCommandIds,
  ]);

  /**
   * Cleanup commands on unmount
   */
  useEffect(() => {
    return () => {
      registeredCommandIds.forEach((cmdId) => {
        unregisterCommand(cmdId);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registeredCommandIds]);

  useEffect(() => {
    // toast.info(engine.getAssetsBaseUrl(), { position: 'top-center' });
  }, [engine]);

  /**
   * Get the current application component from store
   */
  const ApplicationComponent = currentApplicationComponent;

  /**
   * Get scene name for loading UI
   */
  const loadingSceneName = loadingSceneId
    ? getQuickSceneCatalog().find((scene) => scene.id === loadingSceneId)
        ?.name || "Loading scene..."
    : null;

  return (
    <>
      <DevModeBadge />

      {fatalStartupError && (
        <div className="pointer-events-none fixed inset-0 z-9999 flex items-center justify-center bg-black/70 p-6">
          <div className="pointer-events-auto max-w-xl rounded-lg border border-white/15 bg-neutral-900/95 p-5 text-neutral-100 shadow-2xl">
            <h2 className="mb-2 text-lg font-semibold">WebGL Unavailable</h2>
            <p className="text-sm leading-relaxed text-neutral-300">
              {fatalStartupError}
            </p>
          </div>
        </div>
      )}

      {/* Tailwind CSS Test Card */}
      {/* <TailwindTestCard />
      <EnvironmentInfoCard /> */}

      {/* Global Loading UI - shows when switching scenes */}
      {loadingSceneId && (
        <LoadingProgress
          title={`Loading ${loadingSceneName}...`}
          isLoading={true}
        />
      )}

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        engine={engine}
      />

      {/* Bottom Quick Toolbar */}
      <QuickToolbar onQuickSceneClick={() => setQuickSceneOpen(true)} />

      {/* Quick Scene Panel */}
      <QuickScenePanel engine={engine} />

      {/* Quick Action Dialog */}
      <QuickActionDialog />

      <ModelCatalogDashboard
        open={modelCatalogOpen}
        onClose={() => setModelCatalogOpen(false)}
      />
      <ModelLoaderDashboard
        open={modelLoaderOpen}
        onClose={() => setModelLoaderOpen(false)}
        onOpenModelCatalog={() => setModelCatalogOpen(true)}
      />
      <FreeAssetsLoaderDashboard
        open={freeAssetsLoaderOpen}
        onClose={() => setFreeAssetsLoaderOpen(false)}
      />

      {/* Render current application component from Quick Scene */}
      {ApplicationComponent && engine && currentModel && (
        <ApplicationComponent engine={engine} model={currentModel} />
      )}

      {/* Above fullscreen quick-scene apps (e.g. Bitstream `fixed inset-0`). */}
      <GlobalShellOverlays />

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        className="pointer-events-auto"
      />

      {/* Dev Toolbar - Only visible in DEV_MODE */}
      <DevToolbar engine={engine} />
    </>
  );
}

export default App;
