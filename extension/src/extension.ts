import * as vscode from "vscode";
import { GlobalConfig } from "./GlobalConfig";
import {
  startMqttBroker,
  stopMqttBroker,
  setGetCurrentPanelCallback,
} from "./mqtt-handle";
import {
  initializeSerialBridge,
  stopSerialBridge,
  setGetCurrentPanelCallback as setSerialBridgeGetCurrentPanelCallback,
} from "./bridge-handle";
import {
  setGetCurrentPanelCallback as setAiBridgeGetCurrentPanelCallback,
} from "./ai-bridge-handle";
import { registerDiagnoseFreePackStorageCommand } from "./commands/diagnoseFreePackStorageCommand";
import { registerSyncFreePackStorageCommand } from "./commands/syncFreePackStorageCommand";
import { PresentationPanel } from "./panels/PresentationPanel";

// Module-level status bar items for conditional visibility
let launchMenuStatusBarItem: vscode.StatusBarItem | undefined;
let reloadWebviewStatusBarItem: vscode.StatusBarItem | undefined;
let reloadWindowStatusBarItem: vscode.StatusBarItem | undefined;
let toggleDevToolsStatusBarItem: vscode.StatusBarItem | undefined;

function getPanelStatusBar(): StatusBarItemsFor3DPanel {
  return {
    launchMenu: launchMenuStatusBarItem,
    reloadWebview: reloadWebviewStatusBarItem,
    reloadWindow: reloadWindowStatusBarItem,
  };
}

import { TernionDigitalTwin, type StatusBarItemsFor3DPanel } from "./panels/TernionDigitalTwin";
import {
  openTernionPanel,
  pickTernionApplication,
} from "./ternion-webview-shell-host";
import { TernionToolsPanel } from "./panels/TernionToolsPanel";
import {
  ensureLocalWebappServer,
  setLocalWebappFreePackRoot,
  setLocalWebappTesaiotTexturesRoot,
  setLocalWebappUserModelsRoot,
  stopLocalWebappServer,
} from "./local-webapp-server";
import {
  getFreeGithubMirrorRootUri,
  getModelDownloadsRootUri,
  getTesaiotTexturesRootUri,
  getUserAssetsRootUri,
} from "./extensionAssetPaths";
import {
  setBridgeModelDownloadsRoot,
  setBridgeUserAssetsRoot,
} from "./model-downloader/bridgeDefaultPaths";
import {
  startAllBackendServices,
  stopAllBackendServices,
} from "./backend-services";
import {
  startBitstreamSimulatorExtension,
  stopBitstreamSimulatorExtension,
} from "./bitstream-simulator-host";

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("Bitstream Studio extension is now active");
  const modelDownloadsFs = getModelDownloadsRootUri(context).fsPath;
  setBridgeModelDownloadsRoot(modelDownloadsFs);
  setBridgeUserAssetsRoot(getUserAssetsRootUri(context).fsPath);
  setLocalWebappUserModelsRoot(modelDownloadsFs);
  setLocalWebappFreePackRoot(getFreeGithubMirrorRootUri(context).fsPath);
  setLocalWebappTesaiotTexturesRoot(
    getTesaiotTexturesRootUri(context).fsPath,
  );

  // Bitstream Studio panel host (legacy class name retained).
  launchMenuStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    2,
  );
  launchMenuStatusBarItem.text = "$(list-selection) Bitstream";
  launchMenuStatusBarItem.tooltip =
    "Open Bitstream Studio (last tab; use toolbar or command shortcuts for Sensor Telemetry / Studio)";
  launchMenuStatusBarItem.command = "bitstream-studio.open";
  launchMenuStatusBarItem.show();

  // Create status bar item for reload webview button (hidden initially)
  reloadWebviewStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0,
  );
  reloadWebviewStatusBarItem.text = "$(refresh) Refresh";
  reloadWebviewStatusBarItem.tooltip = "Reload Bitstream Studio panel";
  reloadWebviewStatusBarItem.command = "bitstream-studio.reloadWebview";
  // Don't show initially

  // Create status bar item for reload window button (hidden initially)
  reloadWindowStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0,
  );
  reloadWindowStatusBarItem.text = "$(sync~spin) Reload";
  reloadWindowStatusBarItem.tooltip = "Reload VSCode Window";
  reloadWindowStatusBarItem.command = "bitstream-studio.reloadWindow";
  // Don't show initially

  // Create status bar item for toggle developer tools button (always visible)
  toggleDevToolsStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0,
  );
  toggleDevToolsStatusBarItem.text = "$(debug-console) Dev";
  toggleDevToolsStatusBarItem.tooltip = "Toggle Developer Tools";
  toggleDevToolsStatusBarItem.command = "bitstream-studio.toggleDevTools";
  toggleDevToolsStatusBarItem.show();

  // Set callback to get current panel for MQTT event forwarding
  setGetCurrentPanelCallback(() => {
    return TernionDigitalTwin.currentPanel?._panel;
  });

  // Set callback for Serial Bridge event forwarding
  setSerialBridgeGetCurrentPanelCallback(() => {
    return TernionDigitalTwin.currentPanel?._panel;
  });

  // Set callback for AI Bridge status forwarding
  setAiBridgeGetCurrentPanelCallback(() => {
    return TernionDigitalTwin.currentPanel?._panel;
  });

  /**
   * Combined bridge (`out/combined-bridge-entry.js`) listens on **ternion.ws.brokerPort** (default 9998)
   * for Bitstream/serial and **ternion.ws.modelBrokerPort** (default 9999) for Model/Free Loader.
   */
  void (async () => {
    try {
      await startAllBackendServices(context.extensionPath);
    } catch (error) {
      console.error("Failed to start backend services:", error);
    }
  })();

  const pickApplicationDisposable = vscode.commands.registerCommand(
    "bitstream-studio.pickApplication",
    () => {
      void pickTernionApplication(
        context.extensionUri,
        context,
        getPanelStatusBar(),
      );
    },
  );

  const openStudioDisposable = vscode.commands.registerCommand(
    "bitstream-studio.open",
    () => {
      openTernionPanel(
        context.extensionUri,
        context,
        getPanelStatusBar(),
      );
    },
  );

  const openBitstreamDisposable = vscode.commands.registerCommand(
    "bitstream-studio.openBitstream",
    () => {
      openTernionPanel(
        context.extensionUri,
        context,
        getPanelStatusBar(),
        { bitstreamWorkspace: "telemetry" },
      );
    },
  );

  const openBitstreamSensorStudioDisposable =
    vscode.commands.registerCommand(
      "bitstream-studio.openBitstreamSensorStudio",
      () => {
        openTernionPanel(
          context.extensionUri,
          context,
          getPanelStatusBar(),
          { bitstreamWorkspace: "sensor-studio" },
        );
      },
    );

  const toggleQuickActionDisposable = vscode.commands.registerCommand(
    "bitstream-studio.toggleQuickAction",
    () => {
      const current = TernionDigitalTwin.currentPanel;
      if (!current) {
        void vscode.window.showInformationMessage(
          "Open a Bitstream Studio panel first (status bar → Bitstream).",
        );
        return;
      }
      void current._panel.webview.postMessage({
        type: "ternion-quick-action-toggle",
      });
    },
  );

  const configBaseUrlDisposable = vscode.commands.registerCommand(
    "bitstream-studio.configBaseUrl",
    async () => {
      const currentUrl = context.globalState.get(
        "ternion-base-url",
        GlobalConfig.ONLINE_ASSETS_BASE_URI,
      );

      const inputUrl = await vscode.window.showInputBox({
        prompt: "Enter Base URL for TERNION Digital Twin assets",
        placeHolder: GlobalConfig.ONLINE_ASSETS_BASE_URI,
        value: currentUrl as string,
        validateInput: (value) => {
          if (!value || value.trim() === "") {
            return "Base URL cannot be empty";
          }
          try {
            new URL(value);
            return null; // Valid URL
          } catch {
            return "Please enter a valid URL (e.g., https://example.com/assets)";
          }
        },
      });

      if (inputUrl !== undefined) {
        // Save the new base URL
        await context.globalState.update("ternion-base-url", inputUrl);

        // Show confirmation
        vscode.window.showInformationMessage(
          `Base URL updated to: ${inputUrl}`,
        );

        // If panel is open, notify it about the URL change
        if (TernionDigitalTwin.currentPanel) {
          TernionDigitalTwin.currentPanel._panel.webview.postMessage({
            type: "asset-base-url-changed",
            baseUrl: inputUrl,
          });
        }
      }
    },
  );

  const reloadWebviewDisposable = vscode.commands.registerCommand(
    "bitstream-studio.reloadWebview",
    () => {
      if (TernionDigitalTwin.currentPanel) {
        // Reload the webview by regenerating the HTML content
        TernionDigitalTwin.currentPanel._panel.webview.html =
          TernionDigitalTwin.currentPanel._getHtmlForWebview();
        vscode.window.showInformationMessage("Bitstream Studio panel refreshed");
      } else {
        vscode.window.showWarningMessage(
          "No Bitstream Studio panel is currently open",
        );
      }
    },
  );

  const reloadWindowDisposable = vscode.commands.registerCommand(
    "bitstream-studio.reloadWindow",
    () => {
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    },
  );

  const toggleDevToolsDisposable = vscode.commands.registerCommand(
    "bitstream-studio.toggleDevTools",
    () => {
      vscode.commands.executeCommand("workbench.action.toggleDevTools");
    },
  );

  const startMqttBrokerDisposable = vscode.commands.registerCommand(
    "bitstream-studio.startMqttBroker",
    () => {
      startMqttBroker().catch((error) => {
        console.error("Failed to start MQTT broker:", error);
        vscode.window.showErrorMessage(
          `Failed to start MQTT broker: ${error?.message || error}`,
        );
      });
    },
  );

  const stopMqttBrokerDisposable = vscode.commands.registerCommand(
    "bitstream-studio.stopMqttBroker",
    () => {
      stopMqttBroker();
    },
  );

  const startSerialBridgeDisposable = vscode.commands.registerCommand(
    "bitstream-studio.startSerialBridge",
    () => {
      void initializeSerialBridge(context.extensionPath).catch((error) => {
        console.error("Failed to start Serial Bridge:", error);
        void vscode.window.showErrorMessage(
          `Failed to start Serial Bridge: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    },
  );

  const stopSerialBridgeDisposable = vscode.commands.registerCommand(
    "bitstream-studio.stopSerialBridge",
    () => {
      void stopSerialBridge();
    },
  );

  const startAllBackendServicesDisposable = vscode.commands.registerCommand(
    "bitstream-studio.startAllBackendServices",
    () => {
      void startAllBackendServices(context.extensionPath).catch((error) => {
        console.error("Failed to start backend services:", error);
        void vscode.window.showErrorMessage(
          `Failed to start backend services: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    },
  );

  const stopAllBackendServicesDisposable = vscode.commands.registerCommand(
    "bitstream-studio.stopAllBackendServices",
    () => {
      void stopAllBackendServices();
    },
  );

  const startBitstreamSimulatorDisposable = vscode.commands.registerCommand(
    "bitstream-studio.startBitstreamSimulator",
    () => {
      void startBitstreamSimulatorExtension(context.extensionPath).then((result) =>
      {
        if (!result.ok)
        {
          void vscode.window.showErrorMessage(
            result.error ?? "Failed to start Bitstream Simulator.",
          );
        }
      });
    },
  );

  const stopBitstreamSimulatorDisposable = vscode.commands.registerCommand(
    "bitstream-studio.stopBitstreamSimulator",
    () => {
      void stopBitstreamSimulatorExtension().then((result) =>
      {
        if (!result.ok)
        {
          void vscode.window.showErrorMessage(
            result.error ?? "Failed to stop Bitstream Simulator.",
          );
        }
      });
    },
  );

  const openToolsPanelDisposable = vscode.commands.registerCommand(
    "bitstream-studio.openToolsPanel",
    () => {
      TernionToolsPanel.createOrShow(context.extensionUri);
    },
  );

  const openPresentationDisposable = vscode.commands.registerCommand(
    "bitstream-studio.openPresentation",
    () => {
      PresentationPanel.createOrShow(context.extensionUri, context);
    },
  );

  const openInBrowserDisposable = vscode.commands.registerCommand(
    "bitstream-studio.openInBrowser",
    async () => {
      try {
        await startAllBackendServices(context.extensionPath);
        const url = await ensureLocalWebappServer(context.extensionPath);
        const assetSourceStrategy = vscode.workspace
          .getConfiguration("ternion.assets")
          .get<string>("sourceStrategy", "local-first");
        const browserUrl = vscode.Uri.parse(url).with({
          query: `assetSourceStrategy=${encodeURIComponent(assetSourceStrategy)}`,
        });
        await vscode.env.openExternal(browserUrl);
        void vscode.window.showInformationMessage(
          `Bitstream Studio dev server opened at ${url} (browser mode).`,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(
          `Could not open web app in browser: ${msg}`,
        );
      }
    },
  );

  const setBrowserAppPortDisposable = vscode.commands.registerCommand(
    "bitstream-studio.setBrowserAppPort",
    async () => {
      const cfg = vscode.workspace.getConfiguration("ternion");
      const current = cfg.get<number>("browserApp.port", 0);
      const input = await vscode.window.showInputBox({
        title: "Browser app port",
        prompt:
          "Port for the local server (Open Digital Twin in Browser). Use 0 for a random free port each time.",
        value: String(current),
        validateInput: (value) => {
          const t = value.trim();
          if (t === "") {
            return "Port is required";
          }
          const n = Number(t);
          if (!Number.isInteger(n) || n < 0 || n > 65535) {
            return "Enter an integer from 0 to 65535";
          }
          return null;
        },
      });
      if (input === undefined) {
        return;
      }
      const port = Number(input.trim());
      await cfg.update(
        "browserApp.port",
        port,
        vscode.ConfigurationTarget.Global,
      );
      await stopLocalWebappServer();
      void vscode.window.showInformationMessage(
        port === 0
          ? "Browser app port: 0 (ephemeral). Run Open in browser to get the URL."
          : `Browser app port set to ${port}. Run Open in browser to use http://127.0.0.1:${port}/`,
      );
    },
  );

  const diagnoseFreePackStorageDisposable =
    registerDiagnoseFreePackStorageCommand(context);
  const syncFreePackStorageDisposable =
    registerSyncFreePackStorageCommand(context);

  context.subscriptions.push(
    pickApplicationDisposable,
    openStudioDisposable,
    toggleQuickActionDisposable,
    openBitstreamDisposable,
    openBitstreamSensorStudioDisposable,
    configBaseUrlDisposable,
    reloadWebviewDisposable,
    reloadWindowDisposable,
    toggleDevToolsDisposable,
    startMqttBrokerDisposable,
    stopMqttBrokerDisposable,
    startSerialBridgeDisposable,
    stopSerialBridgeDisposable,
    startAllBackendServicesDisposable,
    stopAllBackendServicesDisposable,
    startBitstreamSimulatorDisposable,
    stopBitstreamSimulatorDisposable,
    openToolsPanelDisposable,
    openPresentationDisposable,
    openInBrowserDisposable,
    setBrowserAppPortDisposable,
    diagnoseFreePackStorageDisposable,
    syncFreePackStorageDisposable,
    launchMenuStatusBarItem,
    reloadWebviewStatusBarItem,
    reloadWindowStatusBarItem,
    toggleDevToolsStatusBarItem,
  );
}

/**
 * Deactivate the extension
 */
export function deactivate() {
  setBridgeModelDownloadsRoot(null);
  setBridgeUserAssetsRoot(null);
  setLocalWebappUserModelsRoot(null);
  setLocalWebappFreePackRoot(null);
  setLocalWebappTesaiotTexturesRoot(null);
  void stopLocalWebappServer();
  void stopAllBackendServices({ warnIfPanelOpen: false });
}
