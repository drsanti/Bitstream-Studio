import {
  BROWSER_USER_FREE_URL_RELATIVE_PREFIX,
  BROWSER_USER_MODELS_URL_RELATIVE_PREFIX,
  BROWSER_USER_TESAIOT_TEXTURES_URL_RELATIVE_PREFIX,
} from "../assetLayout";
import { isViteDevMode } from "./utils/isViteDevMode";

function devWebappOriginRoot(): string {
  const base = import.meta.env?.BASE_URL ?? "/";
  const baseUrl = new URL(base, window.location.origin).toString();
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

/**
 * Vite dev (`localhost:5173`) does not run the extension HTML bootstrap that injects
 * `FREE_ASSETS_BASE_URI` / user mirrors. Set the same HTTP prefixes the bridge uses so
 * {@link resolveWebviewModelAssetUrl} resolves pack GLBs under globalStorage mirrors.
 */
export function installDevAssetBaseUris(): void {
  if (!isViteDevMode() || typeof window === "undefined") {
    return;
  }
  if (window.WEBVIEW_READY === true) {
    return;
  }
  const root = devWebappOriginRoot();
  const win = window as Window & {
    FREE_ASSETS_BASE_URI?: string;
    USER_MODELS_BASE_URI?: string;
    TESAIOT_TEXTURES_BASE_URI?: string;
    LOCAL_ASSETS_BASE_URI?: string;
  };
  if (!win.FREE_ASSETS_BASE_URI?.trim()) {
    win.FREE_ASSETS_BASE_URI = new URL(BROWSER_USER_FREE_URL_RELATIVE_PREFIX, root).toString();
  }
  if (!win.USER_MODELS_BASE_URI?.trim()) {
    win.USER_MODELS_BASE_URI = new URL(
      BROWSER_USER_MODELS_URL_RELATIVE_PREFIX,
      root,
    ).toString();
  }
  if (!win.TESAIOT_TEXTURES_BASE_URI?.trim()) {
    win.TESAIOT_TEXTURES_BASE_URI = new URL(
      BROWSER_USER_TESAIOT_TEXTURES_URL_RELATIVE_PREFIX,
      root,
    ).toString();
  }
}
