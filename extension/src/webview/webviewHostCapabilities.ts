import { isVsCodeExtensionWebview } from "./isVsCodeExtensionWebview.js";
import { isViteDevMode } from "./utils/isViteDevMode.js";

/** True when the bundle runs outside the VS Code extension webview (Vite or local webapp server). */
export function isBrowserStandaloneHost(): boolean {
  return !isVsCodeExtensionWebview();
}

/** Vite dev origin (`localhost:5173`, etc.). */
export function isViteDevBrowserHost(): boolean {
  return isBrowserStandaloneHost() && isViteDevMode();
}

/**
 * Asset bootstrap, setup checklist, and TERNION pack sync/check commands.
 * Browser: requires `npm run start:bridge` (WebSocket free-assets sync).
 */
export function canUseHostedAssetBootstrap(): boolean {
  return isVsCodeExtensionWebview() || isBrowserStandaloneHost();
}

/**
 * Hard-block the workspace shell until assets are on disk (VSIX / globalStorage).
 * Browser uses the same checklist UI but does not hide the shell behind the overlay.
 */
export function shouldBlockShellUntilAssetsReady(): boolean {
  return isVsCodeExtensionWebview();
}

/** "Open in browser" is initiated from the VS Code extension host only. */
export function canOpenAppInSystemBrowser(): boolean {
  return isVsCodeExtensionWebview();
}
