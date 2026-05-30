import * as vscode from "vscode";
import {
  TernionDigitalTwin,
  type StatusBarItemsFor3DPanel,
} from "./panels/TernionDigitalTwin";
import type { BitstreamWorkspaceHostId, TernionShellHostToWebviewMessage } from "./ternion-shell-host-message";

export type { BitstreamWorkspaceHostId, TernionShellHostToWebviewMessage };

export function postShellNavigateToWebview(
  panel: vscode.WebviewPanel,
  workspace: BitstreamWorkspaceHostId,
): void
{
  const msg: TernionShellHostToWebviewMessage = {
    type: "ternion-shell-navigate",
    workspace,
  };
  void panel.webview.postMessage(msg);
}

export type OpenTernionPanelOptions = {
  bitstreamWorkspace?: BitstreamWorkspaceHostId;
};

export function openTernionPanel(
  extensionUri: vscode.Uri,
  context: vscode.ExtensionContext,
  statusBar: StatusBarItemsFor3DPanel | undefined,
  options?: OpenTernionPanelOptions,
): void
{
  const workspace = options?.bitstreamWorkspace ?? "telemetry";

  const current = TernionDigitalTwin.currentPanel;
  if (current)
  {
    current.navigateBitstreamWorkspace(workspace);
    current.reveal();
    return;
  }

  TernionDigitalTwin.createOrShow(extensionUri, context, {
    statusBar,
    bitstreamWorkspace: workspace,
  });
}

export async function pickTernionApplication(
  extensionUri: vscode.Uri,
  context: vscode.ExtensionContext,
  statusBar: StatusBarItemsFor3DPanel | undefined,
): Promise<void>
{
  const panelOpen = TernionDigitalTwin.currentPanel != null;
  type PickId =
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
      label: "$(pulse) Sensor Telemetry",
      description: "Live BS2 telemetry and sensor configuration",
      id: "bitstreamTelemetry",
    },
    {
      label: "$(sparkle) Sensor Studio",
      description: "Flow-based 2D/3D sensor visualization",
      id: "bitstreamFlow",
    },
    {
      label: "$(globe) Open in browser",
      description: "Local dev server (Vite)",
      id: "browser",
    },
  ];

  if (panelOpen)
  {
    items.push({
      label: "$(refresh) Reload webview",
      description: "Reload the active Bitstream Studio panel",
      id: "reloadWebview",
    });
  }

  items.push({
    label: "$(debug-console) Toggle Developer Tools",
    description: "Webview developer tools",
    id: "devTools",
  });

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: "Open Bitstream Studio",
    matchOnDescription: true,
  });
  if (!pick)
  {
    return;
  }

  switch (pick.id)
  {
    case "bitstreamTelemetry":
      openTernionPanel(extensionUri, context, statusBar, {
        bitstreamWorkspace: "telemetry",
      });
      break;
    case "bitstreamFlow":
      openTernionPanel(extensionUri, context, statusBar, {
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
