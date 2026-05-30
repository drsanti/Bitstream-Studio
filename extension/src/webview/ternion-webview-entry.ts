/**
 * Which React root the bundled webview mounts. The extension host sets
 * `window.TERNION_WEBVIEW_APP` in the inline preload script (before `index.js`).
 */
import type { WebviewShellEntry } from "./state/webviewEntryPersistence.js";
import { readShellBootstrapFromUrl, writeShellUrl } from "./state/webviewShellUrl.js";

export type TernionWebviewEntry = "digitalTwin" | "project4" | "bitstream";

export function resolveTernionWebviewEntry(): TernionWebviewEntry {
  if (typeof window !== "undefined" && window.WEBVIEW_READY === true) {
    const host = window.TERNION_WEBVIEW_APP;
    if (host === "project4" || host === "bitstream" || host === "digitalTwin") {
      return host;
    }
    return "digitalTwin";
  }

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    try {
      const app = new URLSearchParams(window.location.search).get("app");
      if (app === "digitalTwin" || app === "myApp") {
        return "digitalTwin";
      }
      if (app === "project4") {
        return "project4";
      }
      if (app === "bitstream" || app === "sensor-studio") {
        return "bitstream";
      }
    } catch {
      // ignore
    }
  }

  // Vite browser dev default when no `?app=` override.
  return "bitstream";
}

/**
 * Show the in-webview launcher (browser dev home).
 * True when `?launcher=1` or the URL has no `?app=` (root is the launcher).
 * Never shown when the VS Code host already selected an app via `TERNION_WEBVIEW_APP`.
 */
export function shouldShowWebviewLauncher(): boolean {
  if (typeof window !== "undefined" && window.WEBVIEW_READY === true) {
    return false;
  }
  return readShellBootstrapFromUrl().showLauncher;
}

/** Normalize browser dev home URL to `/?launcher=1` for bookmarks and sharing. */
export function syncDevLauncherHomeUrl(): void {
  const bootstrap = readShellBootstrapFromUrl();
  if (!bootstrap.showLauncher) {
    return;
  }
  writeShellUrl({
    showLauncher: true,
    entry: bootstrap.entry,
  });
}

/**
 * Initial React root: explicit URL query wins; otherwise persisted dev choice.
 */
export function resolveInitialWebviewEntry(): WebviewShellEntry {
  return readShellBootstrapFromUrl().entry;
}
