/**
 * True when the bundle runs in the VS Code extension webview (not Vite in a browser).
 * Prefer this over `T3DVSCodeUtils.isVsCodeMode()` for packaged VSIX — see workspace rules.
 */
export function isVsCodeExtensionWebview(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as Window & { WEBVIEW_READY?: boolean; __VSCODE_API__?: unknown };
  return w.WEBVIEW_READY === true || Boolean(w.__VSCODE_API__);
}
