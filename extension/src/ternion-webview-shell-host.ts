import * as vscode from "vscode";
import {
  TernionDigitalTwin,
  type StatusBarItemsFor3DPanel,
} from "./panels/TernionDigitalTwin";
import type { TernionWebviewEntry } from "./webview/ternion-webview-entry";
import type {
  BitstreamWorkspaceHostId,
  TernionShellHostToWebviewMessage,
} from "./ternion-shell-host-message";

export type { BitstreamWorkspaceHostId, TernionShellHostToWebviewMessage };

export function postShellNavigateToWebview(
  panel: vscode.WebviewPanel,
  workspace: BitstreamWorkspaceHostId,
): void {
  const msg: TernionShellHostToWebviewMessage = {
    type: "ternion-shell-navigate",
    workspace,
  };
  void panel.webview.postMessage(msg);
}

export type OpenTernionPanelOptions = {
  webviewApp?: TernionWebviewEntry;
  bitstreamWorkspace?: BitstreamWorkspaceHostId;
};

export function openTernionPanel(
  extensionUri: vscode.Uri,
  context: vscode.ExtensionContext,
  statusBar: StatusBarItemsFor3DPanel | undefined,
  options?: OpenTernionPanelOptions,
): void {
  const requestedApp: TernionWebviewEntry = options?.webviewApp ?? "digitalTwin";
  const workspace = options?.bitstreamWorkspace ?? "telemetry";

  const current = TernionDigitalTwin.currentPanel;
  if (current) {
    if (current.webviewApp !== requestedApp) {
      current.dispose();
    } else {
      if (requestedApp === "bitstream" && workspace) {
        current.navigateBitstreamWorkspace(workspace);
      }
      current.reveal();
      return;
    }
  }

  TernionDigitalTwin.createOrShow(extensionUri, context, {
    statusBar,
    webviewApp: requestedApp,
    bitstreamWorkspace:
      requestedApp === "bitstream" ? workspace : undefined,
  });
}

export async function pickTernionApplication(
  extensionUri: vscode.Uri,
  context: vscode.ExtensionContext,
  statusBar: StatusBarItemsFor3DPanel | undefined,
): Promise<void> {
  const panelOpen = TernionDigitalTwin.currentPanel != null;
  type PickId =
    | "digitalTwin"
    | "bitstreamTelemetry"
    | "bitstreamFlow"
    | "browser"
    | "reloadWebview"
    | "devTools";

  const items: Array<{
    label: string;
    description?: string;
    id: PickId;
  }> = [
    {
      label: "$(preview) TERNION Digital Twin",
      description: "3D engine, quick scenes, simulation",
      id: "digitalTwin",
    },
    {
      label: "$(pulse) Sensor Studio — Configure & Diagnostics",
      description: "Live telemetry and per-sensor setup",
      id: "bitstreamTelemetry",
    },
    {
      label: "$(sparkle) Sensor Studio — Flow editor",
      description: "Flow-based 2D/3D sensor visualization",
      id: "bitstreamFlow",
    },
    {
      label: "$(globe) Open in browser",
      description: "Unified web app with launcher (dev server)",
      id: "browser",
    },
  ];

  if (panelOpen) {
    items.push({
      label: "$(refresh) Reload webview",
      description: "Reload the active TERNION panel",
      id: "reloadWebview",
    });
  }

  items.push({
    label: "$(debug-console) Toggle Developer Tools",
    description: "Webview developer tools",
    id: "devTools",
  });

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: "Open a TERNION application",
    matchOnDescription: true,
  });
  if (!pick) {
    return;
  }

  switch (pick.id) {
    case "digitalTwin":
      openTernionPanel(extensionUri, context, statusBar, {
        webviewApp: "digitalTwin",
      });
      break;
    case "bitstreamTelemetry":
      openTernionPanel(extensionUri, context, statusBar, {
        webviewApp: "bitstream",
        bitstreamWorkspace: "telemetry",
      });
      break;
    case "bitstreamFlow":
      openTernionPanel(extensionUri, context, statusBar, {
        webviewApp: "bitstream",
        bitstreamWorkspace: "sensor-studio",
      });
      break;
    case "browser":
      await vscode.commands.executeCommand(
        "bitstream-studio.openInBrowser",
      );
      break;
    case "reloadWebview":
      await vscode.commands.executeCommand(
        "bitstream-studio.reloadWebview",
      );
      break;
    case "devTools":
      await vscode.commands.executeCommand(
        "bitstream-studio.toggleDevTools",
      );
      break;
    default:
      break;
  }
}
