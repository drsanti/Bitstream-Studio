import * as vscode from "vscode";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { GlobalConfig } from "../GlobalConfig";
import {
  syncTernionFreeAssets,
  getTernionFreeAssetsIndex,
} from "../asset-sync/syncTernionFreeAssets";
import { listFreeLocalAssetFiles } from "../asset-sync/listFreeLocalAssetFiles";
import {
  getFreeGithubMirrorRootUri,
  getModelDownloadsRootUri,
  getTesaiotTexturesRootUri,
  getUserAssetsRootUri,
  isRevealPathAllowed,
} from "../extensionAssetPaths";
import type { WebviewMessage } from "../types";
import {
  handleMqttWebviewMessage,
  sendBrokerStatus as sendMqttBrokerStatus,
  sendPortsChanged as sendMqttPortsChanged,
  sendBrokerRestarted as sendMqttBrokerRestarted,
} from "../mqtt-handle";
import { handleSerialBridgeWebviewMessage } from "../bridge-handle";
import { handleBitstreamSimulatorWebviewMessage } from "../bitstream-simulator-handle";
import { handleAiBridgeWebviewMessage } from "../ai-bridge-handle";
import { handleCaCertInstall } from "../ca-cert-handle";
import { handleModelDownloaderWebviewMessage } from "../model-downloader-handle";
import { resolveGithubTokenForAssetSync } from "../githubTokenForAssetSync";
import { getNonce } from "../webview-util";
import { getAiBridgePairingToken } from "../ai-bridge-pairing";
import type { TernionWebviewEntry } from "../webview/ternion-webview-entry";
import type {
  BitstreamWorkspaceHostId,
  TernionShellHostToWebviewMessage,
} from "../ternion-shell-host-message";

export interface StatusBarItemsFor3DPanel {
  launchMenu?: vscode.StatusBarItem;
  openProject4Twin?: vscode.StatusBarItem;
  reloadWebview?: vscode.StatusBarItem;
  reloadWindow?: vscode.StatusBarItem;
}

export interface TernionDigitalTwinCreateOptions {
  statusBar?: StatusBarItemsFor3DPanel;
  /** When set, overrides webview localStorage for the first paint only. Omit to use last tab. */
  bitstreamWorkspace?: BitstreamWorkspaceHostId;
}

export class TernionDigitalTwin {
  public static currentPanel: TernionDigitalTwin | undefined;
  public readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _context: vscode.ExtensionContext;
  private readonly _statusBar?: StatusBarItemsFor3DPanel;
  private readonly _bitstreamWorkspace: BitstreamWorkspaceHostId | undefined;
  private _disposables: vscode.Disposable[] = [];

  public get webviewApp(): TernionWebviewEntry
  {
    return "bitstream";
  }

  public reveal(column?: vscode.ViewColumn): void {
    this._panel.reveal(column);
  }

  public navigateBitstreamWorkspace(workspace: BitstreamWorkspaceHostId): void
  {
    const msg: TernionShellHostToWebviewMessage = {
      type: "ternion-shell-navigate",
      workspace,
    };
    void this._panel.webview.postMessage(msg);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    options?: TernionDigitalTwinCreateOptions,
  ): void
  {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const requestedWorkspace = options?.bitstreamWorkspace;

    if (TernionDigitalTwin.currentPanel)
    {
      if (requestedWorkspace != null)
      {
        TernionDigitalTwin.currentPanel.navigateBitstreamWorkspace(
          requestedWorkspace,
        );
      }
      TernionDigitalTwin.currentPanel.reveal(column);
      return;
    }

    const panelTitle =
      requestedWorkspace === "sensor-studio"
        ? "Bitstream Studio — Sensor Studio"
        : requestedWorkspace === "telemetry" ||
            requestedWorkspace === "sensor-telemetry"
          ? "Bitstream Studio — Sensor Telemetry"
          : "Bitstream Studio";

    const panel = vscode.window.createWebviewPanel(
      "ternionDigitalTwinPanel",
      panelTitle,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        // Configure local resource roots to allow webview access to local assets
        // VSCode webviews can only access files within these directories
        // Including extensionUri allows access to all subdirectories (out/webview/assets, etc.)
        // We also explicitly include 'out' and 'out/webview' to ensure proper path resolution
        localResourceRoots: [
          extensionUri, // Root directory - allows access to all subdirectories
          vscode.Uri.joinPath(extensionUri, "out"), // Explicitly include out directory
          vscode.Uri.joinPath(extensionUri, "out", "webview"), // Explicitly include webview directory
          context.globalStorageUri, // Extension storage (parent of assets/)
          getUserAssetsRootUri(context), // User downloads (globalStorage/.../assets)
        ],
      },
    );

    TernionDigitalTwin.currentPanel = new TernionDigitalTwin(
      panel,
      extensionUri,
      context,
      options?.statusBar,
      requestedWorkspace,
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    statusBar: StatusBarItemsFor3DPanel | undefined,
    bitstreamWorkspace: BitstreamWorkspaceHostId | undefined,
  )
  {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._context = context;
    this._statusBar = statusBar;
    this._bitstreamWorkspace = bitstreamWorkspace;

    // Hide launch menu and show reload buttons when panel opens
    if (this._statusBar?.launchMenu) this._statusBar.launchMenu.hide();
    if (this._statusBar?.openProject4Twin) this._statusBar.openProject4Twin.hide();
    if (this._statusBar?.reloadWebview) this._statusBar.reloadWebview.show();
    if (this._statusBar?.reloadWindow) this._statusBar.reloadWindow.show();

    this._panel.webview.html = this._getHtmlForWebview();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        this._handleWebviewMessage(message);
      },
      null,
      this._disposables,
    );
  }

  private async _handleWebviewMessage(message: WebviewMessage) {
    if (handleMqttWebviewMessage(message, this._panel)) {
      return; // Message was handled by MQTT handler
    }

    // Try to handle Serial Bridge messages
    if (handleSerialBridgeWebviewMessage(message, this._panel)) {
      return; // Message was handled by Bridge handler
    }

    if (
      handleBitstreamSimulatorWebviewMessage(
        message,
        this._panel,
        this._context.extensionPath,
      )
    ) {
      return;
    }

    if (handleAiBridgeWebviewMessage(message, this._context.extensionPath)) {
      return;
    }

    // Try to handle Model Downloader messages
    if (
      await handleModelDownloaderWebviewMessage(
        message,
        this._panel,
        this._context,
      )
    ) {
      return; // Message was handled by Model Downloader handler
    }

    // Handle non-MQTT messages
    switch (message.type) {
      case "open-panel":
        vscode.commands.executeCommand("bitstream-studio.openBitstream");
        break;

      case "reload-webview":
        // Reload the webview by regenerating the HTML content
        this._panel.webview.html = this._getHtmlForWebview();
        break;

      case "reload-window":
        vscode.commands.executeCommand("workbench.action.reloadWindow");
        break;

      case "toggle-dev-tools":
        vscode.commands.executeCommand("workbench.action.toggleDevTools");
        break;

      case "ca-cert-install": {
        handleCaCertInstall(this._panel, message);
        break;
      }

      case "asset-get-base-url": {
        const currentUrl = this._context.globalState.get(
          "ternion-base-url",
          GlobalConfig.ONLINE_ASSETS_BASE_URI,
        );
        this._panel.webview.postMessage({
          type: "asset-base-url-response",
          baseUrl: currentUrl as string,
        });
        break;
      }

      case "asset-update-base-url": {
        if (message.baseUrl) {
          // Validate URL
          try {
            new URL(message.baseUrl);
            // Save the new base URL
            await this._context.globalState.update(
              "ternion-base-url",
              message.baseUrl,
            );

            // Notify webview of the change
            this._panel.webview.postMessage({
              type: "asset-base-url-changed",
              baseUrl: message.baseUrl,
            });

            // Show confirmation
            vscode.window.showInformationMessage(
              `Asset base URL updated to: ${message.baseUrl}`,
            );
          } catch (error) {
            this._panel.webview.postMessage({
              type: "asset-base-url-response",
              baseUrl: this._context.globalState.get(
                "ternion-base-url",
                GlobalConfig.ONLINE_ASSETS_BASE_URI,
              ) as string,
              error: "Invalid URL format",
            });
          }
        }
        break;
      }

      case "asset-reload": {
        // Reload the webview by regenerating the HTML content
        this._panel.webview.html = this._getHtmlForWebview();
        break;
      }

      case "asset-get-default-download-paths": {
        const requestId = message.requestId;
        const userAssetsRootFs = getUserAssetsRootUri(this._context).fsPath;
        this._panel.webview.postMessage({
          type: "asset-default-download-paths-response",
          requestId,
          defaultDownloadPaths: {
            userAssetsRootFs,
            freeGithubRootFs: getFreeGithubMirrorRootUri(this._context).fsPath,
            modelDownloadsRootFs: getModelDownloadsRootUri(this._context).fsPath,
            tesaiotTexturesRootFs: getTesaiotTexturesRootUri(this._context).fsPath,
          },
        });
        break;
      }

      case "asset-free-pack-list": {
        const requestId = message.requestId ?? randomUUID();
        void (async () => {
          try {
            const rows = await getTernionFreeAssetsIndex({
              githubToken: resolveGithubTokenForAssetSync(),
            });
            this._panel.webview.postMessage({
              type: "asset-free-pack-list-response",
              requestId,
              freeAssetIndexEntries: rows,
            });
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            this._panel.webview.postMessage({
              type: "asset-free-pack-list-response",
              requestId,
              error: errMsg,
            });
          }
        })();
        break;
      }

      case "asset-free-local-list": {
        const requestId = message.requestId ?? randomUUID();
        void (async () => {
          try {
            const rootFs = getFreeGithubMirrorRootUri(this._context).fsPath;
            const rows = await listFreeLocalAssetFiles(rootFs);
            this._panel.webview.postMessage({
              type: "asset-free-local-list-response",
              requestId,
              freeLocalRootFs: rootFs,
              freeLocalAssetEntries: rows,
            });
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            this._panel.webview.postMessage({
              type: "asset-free-local-list-response",
              requestId,
              error: errMsg,
            });
          }
        })();
        break;
      }

      case "reveal-path-in-os": {
        const requestId = message.requestId;
        const raw = message.absolutePath?.trim();
        if (!raw) {
          this._panel.webview.postMessage({
            type: "asset-reveal-path-result",
            requestId,
            revealPathOk: false,
            revealPathError: "Path is required",
          });
          break;
        }
        const resolved = path.resolve(raw);
        if (!isRevealPathAllowed(this._context, resolved)) {
          this._panel.webview.postMessage({
            type: "asset-reveal-path-result",
            requestId,
            revealPathOk: false,
            revealPathError: "Path is not allowed",
          });
          break;
        }
        void (async () => {
          try {
            await fs.mkdir(resolved, { recursive: true });
            const uri = vscode.Uri.file(resolved);
            // revealFileInOS often no-ops for folders outside the workspace on Windows;
            // openExternal opens the OS file manager reliably for directory URIs.
            const opened = await vscode.env.openExternal(uri);
            if (!opened) {
              await vscode.commands.executeCommand("revealFileInOS", uri);
            }
            this._panel.webview.postMessage({
              type: "asset-reveal-path-result",
              requestId,
              revealPathOk: true,
            });
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            this._panel.webview.postMessage({
              type: "asset-reveal-path-result",
              requestId,
              revealPathOk: false,
              revealPathError: errMsg,
            });
          }
        })();
        break;
      }

      case "asset-sync-free-pack-start": {
        const requestId = message.requestId ?? randomUUID();
        const defaultFreeRoot = getFreeGithubMirrorRootUri(this._context).fsPath;
        const requested = message.outputDir?.trim();
        const outputRootDir = requested
          ? path.resolve(requested)
          : defaultFreeRoot;
        const onlyRepoPaths =
          message.onlyRepoPaths && message.onlyRepoPaths.length > 0
            ? message.onlyRepoPaths
            : undefined;
        void (async () => {
          try {
            const result = await syncTernionFreeAssets({
              outputRootDir,
              githubToken: resolveGithubTokenForAssetSync(),
              onlyRepoPaths,
              onProgress: (prog) => {
                this._panel.webview.postMessage({
                  type: "asset-sync-free-pack-progress",
                  requestId,
                  assetSyncProgress: {
                    phase: prog.phase,
                    percent: prog.percent,
                    currentPath: prog.currentPath,
                    fileIndex: prog.fileIndex,
                    totalFiles: prog.totalFiles,
                  },
                });
              },
            });
            this._panel.webview.postMessage({
              type: "asset-sync-free-pack-complete",
              requestId,
              assetSyncResult: {
                downloaded: result.downloaded,
                totalBytes: result.totalBytes,
                outputRootDir: result.outputRootDir,
                errors: result.errors,
              },
            });
            if (result.errors.length === 0) {
              void vscode.window.showInformationMessage(
                `Free assets synced: ${result.downloaded} file(s) → ${result.outputRootDir}`,
              );
            } else {
              void vscode.window.showWarningMessage(
                `Free assets sync finished with ${result.errors.length} error(s). Check the Assets Manager.`,
              );
            }
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            this._panel.webview.postMessage({
              type: "asset-sync-free-pack-complete",
              requestId,
              error: errMsg,
            });
            void vscode.window.showErrorMessage(`Free assets sync failed: ${errMsg}`);
          }
        })();
        break;
      }

      case "asset-config": {
        const onlineAssetsBaseUrl = this._context.globalState.get(
          "ternion-base-url",
          GlobalConfig.ONLINE_ASSETS_BASE_URI,
        ) as string;

        const localAssetsUri = this._panel.webview.asWebviewUri(
          vscode.Uri.joinPath(
            this._extensionUri,
            "out",
            "webview",
            GlobalConfig.LOCAL_ASSETS_BASE_URI,
          ),
        );

        const freeAssetsUri = this._panel.webview.asWebviewUri(
          getFreeGithubMirrorRootUri(this._context),
        );

        const tesaiotTexturesUri = this._panel.webview.asWebviewUri(
          getTesaiotTexturesRootUri(this._context),
        );

        this._panel.webview.postMessage({
          type: "asset-config-response",
          assetConfig: {
            localAssetsBaseUrl: localAssetsUri.toString(),
            freeAssetsBaseUrl: freeAssetsUri.toString(),
            tesaiotTexturesBaseUrl: tesaiotTexturesUri.toString(),
            onlineAssetsBaseUrl: onlineAssetsBaseUrl,
            currentBaseUrl: onlineAssetsBaseUrl, // Default to online
          },
        });
        break;
      }

      case "bitstream-dashboard-config-pull": {
        const configUri = vscode.Uri.joinPath(
          this._context.globalStorageUri,
          "bitstream-dashboard-config.json",
        );
        void (async () => {
          try {
            const raw = await fs.readFile(configUri.fsPath, "utf8");
            this._panel.webview.postMessage({
              type: "bitstream-dashboard-config-response",
              configJson: raw,
            });
          } catch (e: unknown) {
            const errno = e as NodeJS.ErrnoException;
            if (errno?.code === "ENOENT") {
              this._panel.webview.postMessage({
                type: "bitstream-dashboard-config-response",
                configJson: null,
              });
            } else {
              const errMsg = e instanceof Error ? e.message : String(e);
              this._panel.webview.postMessage({
                type: "bitstream-dashboard-config-response",
                configJson: null,
                error: errMsg,
              });
            }
          }
        })();
        break;
      }

      case "bitstream-dashboard-config-push": {
        const configUri = vscode.Uri.joinPath(
          this._context.globalStorageUri,
          "bitstream-dashboard-config.json",
        );
        const raw = typeof message.configJson === "string" ? message.configJson : "";
        void (async () => {
          try {
            await fs.mkdir(path.dirname(configUri.fsPath), { recursive: true });
            await fs.writeFile(configUri.fsPath, raw, "utf8");
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            void vscode.window.showWarningMessage(
              `Could not write Bitstream config mirror: ${errMsg}`,
            );
          }
        })();
        break;
      }

      case "workbench-layout-host-pull": {
        const appId =
          typeof message.appId === "string" && message.appId.trim().length > 0
            ? message.appId.trim()
            : "sensor-studio";
        const safeAppId = appId.replace(/[^a-zA-Z0-9_-]+/g, "-");
        const configUri = vscode.Uri.joinPath(
          this._context.globalStorageUri,
          `workbench-mirror-${safeAppId}.json`,
        );
        void (async () => {
          try {
            const raw = await fs.readFile(configUri.fsPath, "utf8");
            this._panel.webview.postMessage({
              type: "workbench-layout-host-response",
              appId,
              configJson: raw,
            });
          } catch (e: unknown) {
            const errno = e as NodeJS.ErrnoException;
            if (errno?.code === "ENOENT") {
              this._panel.webview.postMessage({
                type: "workbench-layout-host-response",
                appId,
                configJson: null,
              });
            } else {
              const errMsg = e instanceof Error ? e.message : String(e);
              this._panel.webview.postMessage({
                type: "workbench-layout-host-response",
                appId,
                configJson: null,
                error: errMsg,
              });
            }
          }
        })();
        break;
      }

      case "workbench-layout-host-push": {
        const appId =
          typeof message.appId === "string" && message.appId.trim().length > 0
            ? message.appId.trim()
            : "sensor-studio";
        const safeAppId = appId.replace(/[^a-zA-Z0-9_-]+/g, "-");
        const configUri = vscode.Uri.joinPath(
          this._context.globalStorageUri,
          `workbench-mirror-${safeAppId}.json`,
        );
        const raw = typeof message.configJson === "string" ? message.configJson : "";
        void (async () => {
          try {
            await fs.mkdir(path.dirname(configUri.fsPath), { recursive: true });
            await fs.writeFile(configUri.fsPath, raw, "utf8");
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            void vscode.window.showWarningMessage(
              `Could not write workbench layout mirror (${appId}): ${errMsg}`,
            );
          }
        })();
        break;
      }

      case "get-local-ips": {
        const os = await import("os");
        const ifaces = os.networkInterfaces();
        const ips: string[] = [];
        for (const addrs of Object.values(ifaces)) {
          if (!addrs) continue;
          for (const a of addrs) {
            const family = (a as { family: string | number }).family;
            const isIPv4 = family === "IPv4" || family === 4;
            if (isIPv4 && !a.internal && a.address) {
              ips.push(a.address);
            }
          }
        }
        this._panel.webview.postMessage({
          type: "get-local-ips-response",
          requestId: message.requestId,
          localIps: ips,
        });
        break;
      }
    }
  }

  private _sendBrokerStatus() {
    sendMqttBrokerStatus(this._panel);
  }

  public sendPortsChanged(mqttPort: number, wsPort: number) {
    sendMqttPortsChanged(this._panel, mqttPort, wsPort);
  }

  public sendToast(
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
  ) {
    this._panel.webview.postMessage({
      type: "toast",
      message,
      toastType: type,
    });
  }

  public sendBrokerRestarted() {
    sendMqttBrokerRestarted(this._panel);
  }

  public dispose(): void {
    TernionDigitalTwin.currentPanel = undefined;

    // Show launch menu and hide reload buttons when panel closes
    if (this._statusBar?.launchMenu) this._statusBar.launchMenu.show();
    if (this._statusBar?.openProject4Twin) this._statusBar.openProject4Twin.show();
    if (this._statusBar?.reloadWebview) this._statusBar.reloadWebview.hide();
    if (this._statusBar?.reloadWindow) this._statusBar.reloadWindow.hide();

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public _getHtmlForWebview() {
    // Cache buster to force VS Code webview to reload updated assets.
    // Webviews can aggressively cache `asWebviewUri` resources across reloads,
    // especially when `retainContextWhenHidden` is enabled.
    const cacheBuster = Date.now();
    // Get the script URI for the webview
    const scriptUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "webview", "index.js"),
    );

    // Get the style URI for the webview
    const styleUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "webview", "index.css"),
    );

    // Get the base URI for the webview directory
    const webviewBaseUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "webview"),
    );

    // Construct local assets URI pointing to out/webview/assets
    const localAssetsUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out",
        "webview",
        GlobalConfig.LOCAL_ASSETS_BASE_URI,
      ),
    );

    // Get URI for downloaded free assets (globalStorage/assets/free)
    const freeAssetsUri = this._panel.webview.asWebviewUri(
      getFreeGithubMirrorRootUri(this._context),
    );

    const tesaiotTexturesUri = this._panel.webview.asWebviewUri(
      getTesaiotTexturesRootUri(this._context),
    );

    // Get the stored base URL or use default
    const onlineAssetsBaseUrl = this._context.globalState.get(
      "ternion-base-url",
      GlobalConfig.ONLINE_ASSETS_BASE_URI,
    );

    const wsSection = vscode.workspace.getConfiguration("ternion.ws");
    const serialBrokerPort = Math.min(
      65535,
      Math.max(1, Math.trunc(wsSection.get<number>("brokerPort", 9998))),
    );
    const modelBrokerPort = Math.min(
      65535,
      Math.max(1, Math.trunc(wsSection.get<number>("modelBrokerPort", 9999))),
    );
    const aiBrokerPort = Math.min(
      65535,
      Math.max(1, Math.trunc(wsSection.get<number>("aiBrokerPort", 9987))),
    );
    const bitstreamWsUrl = `ws://127.0.0.1:${serialBrokerPort}`;
    const modelLoaderWsUrl = `ws://127.0.0.1:${modelBrokerPort}`;
    const aiBridgeWsUrl = `ws://127.0.0.1:${aiBrokerPort}`;

    const assetsSection = vscode.workspace.getConfiguration("ternion.assets");
    const assetSourceStrategy = assetsSection.get<"local-only" | "local-first" | "online-only">(
      "sourceStrategy",
      "local-first",
    );

    // Generate a random nonce for the webview
    const nonce = getNonce();

    // Get the Content Security Policy (CSP) source for the webview
    const cspSource = this._panel.webview.cspSource;

    /*html*/
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<title>Bitstream Studio</title>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self' ${cspSource} https: data: blob:;
    style-src 'self' ${cspSource} 'unsafe-inline' https:;
    script-src 'nonce-${nonce}' 'self' ${cspSource} https: 'wasm-unsafe-eval' 'unsafe-eval';
    img-src 'self' ${cspSource} data: blob: https:;
    font-src 'self' ${cspSource} data: https:;
    connect-src 'self' ${cspSource} ws: wss: http: https: blob: data:;
    worker-src 'self' ${cspSource} blob: https:;
  ">
  <meta http-equiv="Permissions-Policy" content="
    camera=(),
    microphone=(),
    geolocation=(),
    interest-cohort=(),
    payment=(),
    usb=(),
    serial=(),
    bluetooth=(),
    magnetometer=(),
    gyroscope=(),
    accelerometer=(),
    ambient-light-sensor=(),
    autoplay=(self),
    encrypted-media=(self),
    fullscreen=(self),
    picture-in-picture=(self),
    screen-wake-lock=(),
    web-share=(),
    xr-spatial-tracking=()
  ">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}?v=${cacheBuster}" rel="stylesheet">
  <script nonce="${nonce}">

    window.WEBVIEW_READY = true;
    window.TERNION_WEBVIEW_APP = "bitstream";
    ${this._bitstreamWorkspace != null ? `window.TERNION_BITSTREAM_WORKSPACE = ${JSON.stringify(this._bitstreamWorkspace)};` : ""}
    window.T3D_BITSTREAM_WS_URL = ${JSON.stringify(bitstreamWsUrl)};
    window.T3D_MODEL_LOADER_WS_URL = ${JSON.stringify(modelLoaderWsUrl)};
    window.T3D_AI_BRIDGE_WS_URL = ${JSON.stringify(aiBridgeWsUrl)};
    window.T3D_AI_BRIDGE_PAIRING_TOKEN = ${JSON.stringify(getAiBridgePairingToken())};
    window.ASSET_SOURCE_STRATEGY = ${JSON.stringify(assetSourceStrategy)};
    window.EXTENSION_PATH = ${JSON.stringify(this._context.extensionPath)};
    
    // Acquire VS Code API in traditional script context (before ES modules load).
    // ES modules may not have access to the global acquireVsCodeApi, so we capture it here.
    try {
      if (typeof acquireVsCodeApi !== 'undefined') {
        window.__VSCODE_API__ = acquireVsCodeApi();
      }
    } catch (e) {
      console.warn('[HTML] Could not acquire VS Code API:', e);
    }
    
    // Set webview base URI for local assets
    window.WEBVIEW_BASE_URI = "${webviewBaseUri}";
    
    // Local assets base URI (out/webview/assets)
    window.LOCAL_ASSETS_BASE_URI = "${localAssetsUri}";

    // Free assets base URI (globalStorage/assets/free)
    window.FREE_ASSETS_BASE_URI = "${freeAssetsUri}";

    // Tesaiot pack textures (globalStorage/assets/tesaiot/textures)
    window.TESAIOT_TEXTURES_BASE_URI = "${tesaiotTexturesUri}";
      
    // Set online assets base URI for T3D engine (fallback)
    window.ONLINE_ASSETS_BASE_URI = "${onlineAssetsBaseUrl}";

    const canUseThreads =
      globalThis.crossOriginIsolated === true &&
      typeof SharedArrayBuffer !== 'undefined';

    const isWebview = typeof window.location !== 'undefined' && window.location.origin.startsWith('vscode-webview://');

    window.IS_WEBVIEW = isWebview;
    window.CAN_USE_THREADS = canUseThreads;
    window.SHARED_ARRAY_BUFFER = typeof SharedArrayBuffer !== 'undefined';
    window.CROSS_ORIGIN_ISOLATED = globalThis.crossOriginIsolated;

    console.clear();
    console.group('🔧 [HTML] Debug Info');
    console.log('%c🔧 [HTML] Is Webview:', 'color: lime; font-weight: bold;', isWebview);
    console.log('%c🔧 [HTML] Can use threads:', 'color: lime; font-weight: bold;', canUseThreads);
    console.log('%c🔧 [HTML] SharedArrayBuffer:', 'color: lime; font-weight: bold;', typeof SharedArrayBuffer !== 'undefined');
    console.log('%c🔧 [HTML] CrossOriginIsolated:', 'color: lime; font-weight: bold;', globalThis.crossOriginIsolated);
    console.groupEnd();
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}?v=${cacheBuster}"></script>
</body>
</html>`;
  }
}
