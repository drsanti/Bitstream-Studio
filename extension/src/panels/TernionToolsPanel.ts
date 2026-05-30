import * as vscode from "vscode";
import { getNonce } from "../webview-util";

/**
 * TERNION Tools panel — second panel for other tasks (separate from 3D World).
 * Uses its own command and viewType so both panels can be open at the same time.
 */
export class TernionToolsPanel {
  public static currentPanel: TernionToolsPanel | undefined;
  public readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (TernionToolsPanel.currentPanel) {
      TernionToolsPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "ternionToolsPanel",
      "TERNION Tools",
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          extensionUri,
          vscode.Uri.joinPath(extensionUri, "out"),
          vscode.Uri.joinPath(extensionUri, "out", "webview"),
        ],
      },
    );

    TernionToolsPanel.currentPanel = new TernionToolsPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._panel.webview.html = this._getHtmlForWebview();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message: { type: string }) => {
        if (message.type === "reload") {
          this._panel.webview.html = this._getHtmlForWebview();
        }
      },
      null,
      this._disposables,
    );
  }

  private _getHtmlForWebview(): string {
    const nonce = getNonce();
    const cspSource = this._panel.webview.cspSource;
    const cacheBuster = Date.now();
    const styleUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "webview", "index.css"),
    );
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self' ${cspSource};
    style-src 'self' ${cspSource} 'unsafe-inline' https:;
    script-src 'nonce-${nonce}' 'self' ${cspSource};
  ">
  <title>TERNION Tools</title>
  <link href="${styleUri}?v=${cacheBuster}" rel="stylesheet">
</head>
<body class="min-h-screen bg-(--vscode-editor-background) text-(--vscode-foreground) font-sans p-6">
  <div class="max-w-2xl space-y-4">
    <h1 class="text-2xl font-bold">TERNION Tools</h1>
    <p class="text-lime-500">
      This panel is for other tasks. You can open it alongside the 3D World panel.
    </p>
    <p class="text-sm text-(--vscode-descriptionForeground)">
      Replace this content in <code class="bg-(--vscode-textBlockQuote-background) px-1 rounded">panels/TernionToolsPanel.ts</code> (_getHtmlForWebview) or load your own webview assets.
    </p>
  </div>
</body>
</html>`;
  }

  public dispose(): void {
    TernionToolsPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
