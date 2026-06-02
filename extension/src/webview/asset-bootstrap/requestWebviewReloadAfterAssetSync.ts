import { getVsCodeApi } from "../extension-bridge/getVsCodeApi.js";
import { isVsCodeExtensionWebview } from "../isVsCodeExtensionWebview.js";

/** Delay so the host can flush sync progress messages before the webview tears down. */
export const WEBVIEW_RELOAD_AFTER_ASSET_SYNC_MS = 400;

/**
 * Full webview reload after a successful free-pack sync.
 * VS Code: `reload-webview` → host resets panel HTML (clears R3F / useGLTF cache).
 * Browser dev: `location.reload()`.
 */
export function requestWebviewReloadAfterAssetSync(): void {
  if (isVsCodeExtensionWebview()) {
    getVsCodeApi()?.postMessage({ type: "reload-webview" });
    return;
  }
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      window.location.reload();
    }, WEBVIEW_RELOAD_AFTER_ASSET_SYNC_MS);
  }
}

export function scheduleWebviewReloadAfterAssetSync(
  delayMs: number = WEBVIEW_RELOAD_AFTER_ASSET_SYNC_MS,
): ReturnType<typeof window.setTimeout> {
  return window.setTimeout(() => {
    requestWebviewReloadAfterAssetSync();
  }, delayMs);
}
