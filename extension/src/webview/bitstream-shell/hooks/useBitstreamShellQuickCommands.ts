/*******************************************************************************
 * File Name : useBitstreamShellQuickCommands.ts
 *
 * Description : Registers Bitstream shell commands for the Ctrl+/ quick-action
 *               palette (workspace, connect, panels, assets).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useLayoutEffect } from "react";
import {
  Activity,
  ClipboardCheck,
  CloudDownload,
  Download,
  ExternalLink,
  Gauge,
  Link2,
  ListChecks,
  Package,
  PlugZap,
  RefreshCw,
  ScrollText,
  Stethoscope,
  Unplug,
  Wifi,
  Workflow,
} from "lucide-react";
import { useQuickAction } from "@/ui/quick-action/useQuickAction";
import { useBitstreamWorkspaceModeStore } from "../../bitstream-app/state/bitstreamWorkspaceMode.store.js";
import { appendTelemetryActivity } from "../../sensor-telemetry/store/telemetryActivity.store.js";
import { ensureBitstreamSimulatorReady } from "../../bitstream-app/bridge/requestBitstreamSimulatorHost.js";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store.js";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store.js";
import { useSerialPortStore } from "../../serialport/serial-port-store.js";
import type { BitstreamShellWindowsActions } from "../ui/shell/BitstreamShellWindowsHost.js";
import { getVsCodeApi } from "../../extension-bridge/getVsCodeApi.js";
import { useAssetBootstrapActionsStore } from "../../asset-bootstrap/assetBootstrapActions.store.js";
import { ternionFreeAssetPackCopy } from "../../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { canUseHostedAssetBootstrap, canOpenAppInSystemBrowser } from "../../webviewHostCapabilities.js";
import { useStartupChecklistStore } from "../../startup-checklist/startupChecklist.store.js";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview.js";

export interface UseBitstreamShellQuickCommandsOptions
{
  connected: boolean;
  connecting: boolean;
  handleReconnectTelemetry: () => void;
  connectSession: (
    port?: string,
    options?: {
      userInitiated?: boolean;
      forceUartFullBringUp?: boolean;
      preserveLiveTelemetry?: boolean;
    },
  ) => Promise<void>;
  disconnectSession: (options?: { userInitiated?: boolean }) => Promise<void>;
  windowActions: Pick<
    BitstreamShellWindowsActions,
    | "openWifiPanel"
    | "openSystemLogs"
    | "openSystemDiagnostics"
    | "openFirmwareLogLevel"
    | "openTelemetryLinkDiagnostics"
  >;
  openModelLoader: () => void;
  openFreeAssetsLoader: () => void;
  openModelCatalog: () => void;
}

/**
 * Registers shell quick commands once per mount (StrictMode-safe).
 */
export function useBitstreamShellQuickCommands(
  options: UseBitstreamShellQuickCommandsOptions,
): void
{
  const { registerCommand, unregisterCommand } = useQuickAction();

  useLayoutEffect(() =>
  {
    const {
      connected,
      connecting,
      handleReconnectTelemetry,
      connectSession,
      disconnectSession,
      windowActions,
      openModelLoader,
      openFreeAssetsLoader,
      openModelCatalog,
    } = options;

    registerCommand({
      id: "bitstream-reconnect-telemetry",
      label: "Reconnect telemetry",
      category: "Telemetry",
      icon: RefreshCw,
      keywords: [
        "bitstream",
        "telemetry",
        "reconnect",
        "session",
        "serial",
        "refresh",
      ],
      action: () => {
        handleReconnectTelemetry();
      },
    });

    registerCommand({
      id: "bitstream-connect",
      label: "Connect telemetry session",
      category: "Telemetry",
      icon: PlugZap,
      keywords: ["connect", "session", "broker", "uart", "simulator"],
      disabled: connected || connecting,
      action: () => {
        appendTelemetryActivity({
          text: "Connection starting (Quick command)…",
          tone: "info",
        });
        void (async () =>
        {
          const ready = await ensureBitstreamSimulatorReady();
          if (!ready)
          {
            return;
          }
          const tel = useBitstreamTelemetrySourceStore.getState();
          const serial = useSerialPortStore.getState();
          const live = useBitstreamLiveStore.getState();
          await connectSession(undefined, {
            userInitiated: true,
            forceUartFullBringUp:
              tel.backend === "uart" &&
              (tel.uartBringUpPending ||
                live.handshakeState !== "passed" ||
                serial.status?.isOpen !== true),
          });
        })();
      },
    });

    registerCommand({
      id: "bitstream-disconnect",
      label: "Disconnect telemetry session",
      category: "Telemetry",
      icon: Unplug,
      keywords: ["disconnect", "stop", "session"],
      disabled: !connected && !connecting,
      action: () => {
        void disconnectSession({ userInitiated: true });
      },
    });

    registerCommand({
      id: "bitstream-workspace-telemetry",
      label: "Open Sensor Telemetry tab",
      category: "Workspace",
      icon: Activity,
      keywords: ["telemetry", "sensor", "tab", "deck", "bitstream"],
      action: () => {
        useBitstreamWorkspaceModeStore.getState().setWorkspace("sensor-telemetry");
      },
    });

    registerCommand({
      id: "bitstream-workspace-studio",
      label: "Open Sensor Studio tab",
      category: "Workspace",
      icon: Workflow,
      keywords: ["studio", "flow", "editor", "tab"],
      action: () => {
        useBitstreamWorkspaceModeStore.getState().setWorkspace("sensor-studio");
      },
    });

    registerCommand({
      id: "bitstream-open-wifi",
      label: "Open Wi‑Fi panel",
      category: "Device",
      icon: Wifi,
      keywords: ["wifi", "wlan", "network", "wcm"],
      action: () => {
        windowActions.openWifiPanel();
      },
    });

    registerCommand({
      id: "bitstream-open-system-logs",
      label: "Open system logs",
      category: "Diagnostics",
      icon: ScrollText,
      keywords: ["logs", "system", "firmware", "uart"],
      action: () => {
        windowActions.openSystemLogs();
      },
    });

    registerCommand({
      id: "bitstream-open-system-diagnostics",
      label: "Open system diagnostics",
      category: "Diagnostics",
      icon: Stethoscope,
      keywords: ["diagnostics", "health", "system"],
      action: () => {
        windowActions.openSystemDiagnostics();
      },
    });

    registerCommand({
      id: "bitstream-open-firmware-log-level",
      label: "Open firmware log level",
      category: "Diagnostics",
      icon: Gauge,
      keywords: ["log", "level", "firmware", "verbosity"],
      action: () => {
        windowActions.openFirmwareLogLevel();
      },
    });

    registerCommand({
      id: "bitstream-open-link-diagnostics",
      label: "Open telemetry link diagnostics",
      category: "Diagnostics",
      icon: Link2,
      keywords: ["link", "telemetry", "diagnostics", "latency"],
      action: () => {
        windowActions.openTelemetryLinkDiagnostics();
      },
    });

    registerCommand({
      id: "bitstream-model-loader",
      label: "Open Model Loader",
      category: "Assets",
      icon: Download,
      keywords: ["model", "loader", "glb", "gltf", "download"],
      action: () => {
        openModelLoader();
      },
    });

    registerCommand({
      id: "bitstream-model-catalog",
      label: "Browse Models",
      category: "Assets",
      icon: Package,
      keywords: ["catalog", "library", "models", "assets", "browse"],
      action: () => {
        openModelCatalog();
      },
    });

    registerCommand({
      id: "bitstream-free-assets-loader",
      label: "Open Free Assets Loader",
      category: "Assets",
      icon: CloudDownload,
      keywords: ["free", "ternion", "assets", "textures", "pack"],
      action: () => {
        openFreeAssetsLoader();
      },
    });

    registerCommand({
      id: "bitstream-check-required-assets",
      label: ternionFreeAssetPackCopy.quickCommandCheckLabel,
      category: "Assets",
      icon: ClipboardCheck,
      keywords: ["setup", "bootstrap", "assets", "glb", "cubemap", "check", "verify"],
      disabled: !canUseHostedAssetBootstrap(),
      action: () => {
        useAssetBootstrapActionsStore.getState().recheck();
        useStartupChecklistStore.getState().openPanel();
      },
    });

    registerCommand({
      id: "bitstream-download-required-assets",
      label: ternionFreeAssetPackCopy.quickCommandDownloadLabel,
      category: "Assets",
      icon: CloudDownload,
      keywords: ["setup", "bootstrap", "download", "sync", "free", "pack"],
      disabled: !canUseHostedAssetBootstrap(),
      action: () => {
        const snap = useAssetBootstrapActionsStore.getState().getSnapshot();
        if (!snap.internetReachable) {
          useStartupChecklistStore.getState().openPanel();
          return;
        }
        useAssetBootstrapActionsStore.getState().startRequiredSync();
        useStartupChecklistStore.getState().openPanel();
      },
    });

    registerCommand({
      id: "bitstream-open-setup-checklist",
      label: "Open setup checklist",
      category: "Workspace",
      icon: ListChecks,
      keywords: ["setup", "checklist", "startup", "link", "connection"],
      disabled: !canUseHostedAssetBootstrap(),
      action: () => {
        useStartupChecklistStore.getState().openPanel();
      },
    });

    registerCommand({
      id: "bitstream-open-in-browser",
      label: "Open in browser",
      category: "Workspace",
      icon: ExternalLink,
      keywords: ["browser", "chrome", "external", "localhost", "webapp"],
      disabled: !canOpenAppInSystemBrowser(),
      action: () => {
        getVsCodeApi()?.postMessage({ type: "execute-extension-command", commandId: "bitstream-studio.openInBrowser" });
      },
    });

    return () =>
    {
      const ids = [
        "bitstream-reconnect-telemetry",
        "bitstream-connect",
        "bitstream-disconnect",
        "bitstream-workspace-telemetry",
        "bitstream-workspace-studio",
        "bitstream-open-wifi",
        "bitstream-open-system-logs",
        "bitstream-open-system-diagnostics",
        "bitstream-open-firmware-log-level",
        "bitstream-open-link-diagnostics",
        "bitstream-model-loader",
        "bitstream-model-catalog",
        "bitstream-free-assets-loader",
        "bitstream-check-required-assets",
        "bitstream-download-required-assets",
        "bitstream-open-setup-checklist",
        "bitstream-open-in-browser",
      ];
      for (const id of ids)
      {
        unregisterCommand(id);
      }
    };
  }, [
    options.connected,
    options.connecting,
    options.handleReconnectTelemetry,
    options.connectSession,
    options.disconnectSession,
    options.windowActions,
    options.openModelLoader,
    options.openFreeAssetsLoader,
    options.openModelCatalog,
    registerCommand,
    unregisterCommand,
  ]);
}
