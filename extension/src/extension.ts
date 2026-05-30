import * as vscode from "vscode";
import { GlobalConfig } from "./GlobalConfig";
import {
  initializeMqttBroker,
  startMqttBroker,
  stopMqttBroker,
  setGetCurrentPanelCallback,
} from "./mqtt-handle";
import {
  initializeSerialBridge,
  startSerialBridge,
  stopSerialBridge,
  setGetCurrentPanelCallback as setSerialBridgeGetCurrentPanelCallback,
} from "./bridge-handle";
import {
  setGetCurrentPanelCallback as setAiBridgeGetCurrentPanelCallback,
} from "./ai-bridge-handle";

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
  ensureEmbeddedModelLoaderBroker,
  stopEmbeddedModelLoaderBroker,
} from "./embedded-model-loader-broker";
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
    "Open Bitstream Studio (Sensor Telemetry, Sensor Studio, browser…)";
  launchMenuStatusBarItem.command = "bitstream-studio.pickApplication";
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

  // Initialize MQTT broker
  initializeMqttBroker().catch((error) => {
    console.error("Failed to initialize MQTT broker:", error);
  });

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
   * `initializeSerialBridge` waits until both TCP ports accept after spawn; then
   * `ensureEmbeddedModelLoaderBroker` binds or connects only on the model port.
   */
  void (async () => {
    try {
      await initializeSerialBridge(context.extensionPath);
    } catch (error) {
      console.error("Failed to initialize Serial Bridge:", error);
    }
    try {
      await ensureEmbeddedModelLoaderBroker();
    } catch (error) {
      console.error("Failed to start embedded model-loader broker:", error);
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
      startSerialBridge().catch((error) => {
        console.error("Failed to start Serial Bridge:", error);
        vscode.window.showErrorMessage(
          `Failed to start Serial Bridge: ${error?.message || error}`,
        );
      });
    },
  );

  const stopSerialBridgeDisposable = vscode.commands.registerCommand(
    "bitstream-studio.stopSerialBridge",
    () => {
      stopSerialBridge();
    },
  );

  const openToolsPanelDisposable = vscode.commands.registerCommand(
    "bitstream-studio.openToolsPanel",
    () => {
      TernionToolsPanel.createOrShow(context.extensionUri);
    },
  );

  const openInBrowserDisposable = vscode.commands.registerCommand(
    "bitstream-studio.openInBrowser",
    async () => {
      try {
        await initializeSerialBridge(context.extensionPath);
        await ensureEmbeddedModelLoaderBroker();
        const url = await ensureLocalWebappServer(context.extensionPath);
        const assetSourceStrategy = vscode.workspace
          .getConfiguration("ternion.assets")
          .get<string>("sourceStrategy", "local-first");
        const browserUrl = vscode.Uri.parse(url).with({
          query: [
            `assetSourceStrategy=${encodeURIComponent(assetSourceStrategy)}`,
            "app=bitstream",
          ].join("&"),
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
          : `Browser app port set to ${port}. Run Open in browser to use http://127.0.0.1:${port}/?app=bitstream`,
      );
    },
  );

  context.subscriptions.push(
    pickApplicationDisposable,
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
    openToolsPanelDisposable,
    openInBrowserDisposable,
    setBrowserAppPortDisposable,
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
  void stopEmbeddedModelLoaderBroker();
  // Stop MQTT broker
  stopMqttBroker();
  // Stop Serial Bridge
  stopSerialBridge();
}
