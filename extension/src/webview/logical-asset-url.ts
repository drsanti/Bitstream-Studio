import {
  BROWSER_USER_FREE_URL_RELATIVE_PREFIX,
  BROWSER_USER_MODELS_URL_RELATIVE_PREFIX,
  BROWSER_USER_TESAIOT_TEXTURES_URL_RELATIVE_PREFIX,
  DEV_SRC_ASSETS_PREFIX,
  TESAIOT_MODELS_WEB_PREFIX,
  TESAIOT_TEXTURES_WEB_PREFIX,
} from "../assetLayout";
import { joinAssetBase } from "./asset-source-strategy";

function devWebappOriginRoot(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const baseUrl =
    typeof window !== "undefined"
      ? new URL(base, window.location.origin).toString()
      : `http://localhost/${base}`;
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

/**
 * Build dev-server URL for a path relative to the extension repo root (e.g. `src/assets/...`).
 * Vite `root` is `src/webview`, so `/assets/...` would map to `src/webview/assets`, not
 * `t3d-extension/src/assets`. In DEV, `vite.config.ts` serves `src/assets` at
 * `/__extension_src_assets/...`.
 *
 * **Pack paths** (`tesaiot/models/`, `tesaiot/textures/`, `free/…`) resolve under
 * `/__ternion_user_*` on the dev origin (same as production browser + {@link local-webapp-server.ts});
 * do not send them to `__extension_src_assets` (repo `src/assets` only).
 */
export function projectRelativePathToDevUrl(webPath: string): string {
  const trimmed = webPath.replace(/^\/+/, "").replace(/\\/g, "/");
  const root = devWebappOriginRoot();

  if (import.meta.env.DEV) {
    if (trimmed.startsWith(DEV_SRC_ASSETS_PREFIX)) {
      const rest = trimmed.slice(DEV_SRC_ASSETS_PREFIX.length);
      return new URL(`__extension_src_assets/${rest}`, root).toString();
    }
    if (trimmed.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
      const rest = trimmed.slice(TESAIOT_MODELS_WEB_PREFIX.length);
      return new URL(
        `${BROWSER_USER_MODELS_URL_RELATIVE_PREFIX}${rest}`,
        root,
      ).toString();
    }
    if (trimmed.startsWith(TESAIOT_TEXTURES_WEB_PREFIX)) {
      const rest = trimmed.slice(TESAIOT_TEXTURES_WEB_PREFIX.length);
      return new URL(
        `${BROWSER_USER_TESAIOT_TEXTURES_URL_RELATIVE_PREFIX}${rest}`,
        root,
      ).toString();
    }
    if (trimmed.startsWith("free/")) {
      const rest = trimmed.slice("free/".length);
      return new URL(`${BROWSER_USER_FREE_URL_RELATIVE_PREFIX}${rest}`, root).toString();
    }
  }

  let relativeToWebview: string;
  if (trimmed.startsWith(DEV_SRC_ASSETS_PREFIX)) {
    relativeToWebview = `../${trimmed.slice("src/".length)}`;
  } else if (trimmed.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
    relativeToWebview = `../assets/${trimmed}`;
  } else if (trimmed.startsWith(TESAIOT_TEXTURES_WEB_PREFIX)) {
    relativeToWebview = `../assets/${trimmed}`;
  } else if (trimmed.startsWith("free/")) {
    relativeToWebview = `../assets/${trimmed}`;
  } else {
    relativeToWebview = trimmed;
  }
  return new URL(relativeToWebview, root).toString();
}

/**
 * Maps logical keys `tesaiot/textures/...` to fetchable URLs.
 * Shared by Model Catalog bridge URLs and {@link resolveWebviewModelAssetUrl}.
 *
 * Priority: `window.TESAIOT_TEXTURES_BASE_URI` (webview / browser injection when set)
 * → localhost HTTP prefix (`/__ternion_user_tesaiot_textures/`), including Vite dev
 * (see `vite.config.ts` **serveExtensionLocalAssetsPlugin** user-mirror middleware).
 */
export function resolveTesaiotTexturesToFetchableUrl(webPath: string): string {
  const trimmed = webPath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!trimmed.startsWith(TESAIOT_TEXTURES_WEB_PREFIX)) {
    throw new Error(
      `resolveTesaiotTexturesToFetchableUrl: expected prefix "${TESAIOT_TEXTURES_WEB_PREFIX}"`,
    );
  }
  const rest = trimmed.slice(TESAIOT_TEXTURES_WEB_PREFIX.length);
  if (import.meta.env.DEV) {
    const root = devWebappOriginRoot();
    return new URL(
      `${BROWSER_USER_TESAIOT_TEXTURES_URL_RELATIVE_PREFIX}${rest}`,
      root,
    ).toString();
  }
  const win = typeof window !== "undefined" ? window : undefined;
  const injected = (
    win as Window & { TESAIOT_TEXTURES_BASE_URI?: string }
  )?.TESAIOT_TEXTURES_BASE_URI?.trim();
  if (injected) {
    return joinAssetBase(injected, rest);
  }
  const root = devWebappOriginRoot();
  return new URL(
    `${BROWSER_USER_TESAIOT_TEXTURES_URL_RELATIVE_PREFIX}${rest}`,
    root,
  ).toString();
}
