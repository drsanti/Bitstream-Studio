import {
  BROWSER_USER_FREE_URL_RELATIVE_PREFIX,
  TESAIOT_TEXTURES_WEB_PREFIX,
} from "../../../../../assetLayout";
import { PSOC_E84_GLB_RELATIVE_PATH } from "./rotationPreviewConstants.js";
import { getAssetSourceStrategy, joinAssetBase } from "../../../../asset-source-strategy";
import { resolveTesaiotTexturesToFetchableUrl } from "../../../../logical-asset-url";

function devWebappOriginRoot(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const baseUrl =
    typeof window !== "undefined"
      ? new URL(base, window.location.origin).toString()
      : `http://localhost/${base}`;
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

/** Vite dev: pack GLBs live under globalStorage mirror, not `/assets/…` (SPA HTML trap). */
function resolveDevUserFreePackModelUrl(rel: string): string | null {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }
  if (!rel.startsWith("models/")) {
    return null;
  }
  return new URL(`${BROWSER_USER_FREE_URL_RELATIVE_PREFIX}${rel}`, devWebappOriginRoot()).toString();
}

/**
 * Build a fetchable URL for a **relative** webview asset path using injected bases and
 * {@link getAssetSourceStrategy} (free / local / online / user models).
 *
 * Repo-shipped JPEG cubemaps live under `out/webview/assets/textures/cubemap/...` in the VS Code
 * webview (`LOCAL_ASSETS_BASE_URI`). `FREE_ASSETS_BASE_URI` points at globalStorage; those faces
 * are often absent until a free-pack sync — so paths under **`textures/cubemap/**`** prefer
 * **local** before **free** while other assets keep the usual free-first order.
 *
 * Logical **`tesaiot/textures/...`** keys use the same resolver as the Model Catalog
 * (`resolveTesaiotTexturesToFetchableUrl`) and **`window.TESAIOT_TEXTURES_BASE_URI`**.
 */

/**
 * If a path already includes a Vite / webview user-mirror segment, strip it so
 * {@link joinAssetBase} with `FREE_ASSETS_BASE_URI` does not produce
 * `/__ternion_user_free/__ternion_user_free/...`.
 */
function stripRedundantUserMirrorPathPrefix(relativePathNoLeadingSlash: string): string {
  const p = relativePathNoLeadingSlash;
  const strip = (prefix: string): string | null => (p.startsWith(prefix) ? p.slice(prefix.length) : null);
  return (
    strip("__ternion_user_free/") ??
    strip("__ternion_user_models/") ??
    strip("__ternion_user_tesaiot_textures/") ??
    strip("__extension_src_assets/") ??
    p
  );
}

export function resolveWebviewModelAssetUrl(relativePath: string): string {
  const win = typeof window !== "undefined" ? window : undefined;
  const rel = stripRedundantUserMirrorPathPrefix(relativePath.replace(/^\//, ""));
  const strategy = getAssetSourceStrategy();

  const userModelsBase = (win as Window & { USER_MODELS_BASE_URI?: string })?.USER_MODELS_BASE_URI?.trim();
  const free = win?.FREE_ASSETS_BASE_URI?.trim();
  const local = win?.LOCAL_ASSETS_BASE_URI?.trim();
  const online = win?.ONLINE_ASSETS_BASE_URI?.trim();
  const preferLocalForCubemapTree = rel.startsWith("textures/cubemap/");

  if (rel.startsWith(TESAIOT_TEXTURES_WEB_PREFIX)) {
    return resolveTesaiotTexturesToFetchableUrl(rel);
  }

  if (strategy === "online-only") {
    if (online) {
      return joinAssetBase(online, rel);
    }
    if (preferLocalForCubemapTree && local) {
      return joinAssetBase(local, rel);
    }
    if (free) {
      return joinAssetBase(free, rel);
    }
    if (userModelsBase && rel.startsWith("models/")) {
      return joinAssetBase(userModelsBase, rel.slice("models/".length));
    }
    if (local) {
      return joinAssetBase(local, rel);
    }
    const devFree = resolveDevUserFreePackModelUrl(rel);
    if (devFree != null) {
      return devFree;
    }
    return `/assets/${rel}`;
  }

  if (preferLocalForCubemapTree && local) {
    return joinAssetBase(local, rel);
  }
  if (free) {
    return joinAssetBase(free, rel);
  }
  if (userModelsBase && rel.startsWith("models/")) {
    return joinAssetBase(userModelsBase, rel.slice("models/".length));
  }
  if (local) {
    return joinAssetBase(local, rel);
  }

  if (strategy === "local-only") {
    const devFree = resolveDevUserFreePackModelUrl(rel);
    if (devFree != null) {
      return devFree;
    }
    return `/assets/${rel}`;
  }
  if (online) {
    return joinAssetBase(online, rel);
  }
  const devFree = resolveDevUserFreePackModelUrl(rel);
  if (devFree != null) {
    return devFree;
  }
  return `/assets/${rel}`;
}

/**
 * Fetch URL for the default Bitstream / Sensor Studio **rotation preview body** GLB
 * (`PSOC_E84_GLB_RELATIVE_PATH` in `rotationPreviewConstants`).
 */
export function resolveDefaultPreviewMeshGlbUrl(): string {
  return resolveWebviewModelAssetUrl(PSOC_E84_GLB_RELATIVE_PATH);
}
