import type { ModelEntry } from "./modelCatalog-types";
import {
  DEV_SRC_ASSETS_PREFIX,
  FREE_MODELS_WEB_PREFIX,
  TESAIOT_MODELS_WEB_PREFIX,
} from "../../assetLayout";
import { projectRelativePathToDevUrl } from "../logical-asset-url";
import {
  bridgeWebPathToCatalogModelUrl,
  catalogDedupeKeyToResolveRelativePath,
  devViteModelUrlFromCanonicalDedupeKey,
  resolveCatalogModelUrlInExtensionWebview,
} from "./modelCatalogMerge";
import { resolveWebviewModelAssetUrl } from "../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl";

const LEGACY_VITE_EXTENSION_ASSETS = "/__extension_src_assets";

/**
 * Vite dev uses `/__extension_src_assets/...`; that origin path 403s in the VS Code webview.
 * Map to `window.LOCAL_ASSETS_BASE_URI` (`out/webview/assets/...`).
 */
export function rewriteLegacyViteAssetPathForWebview(modelUrl: string): string {
  if (typeof window === "undefined" || window.WEBVIEW_READY !== true) {
    return modelUrl;
  }

  const t = modelUrl.trim();
  const marker = "__extension_src_assets";
  const idx = t.indexOf(marker);
  if (idx < 0) {
    return modelUrl;
  }

  const base = window.LOCAL_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
  if (!base) {
    return modelUrl;
  }

  const tail = t
    .slice(idx + marker.length)
    .replace(/^\/+/, "")
    .replace(/^\.\//, "");
  return tail.length > 0 ? `${base}/${tail}` : base;
}

function catalogUrlFromDedupeKey(dedupeKey: string): string | null {
  const k = dedupeKey.replace(/\\/g, "/").trim();
  if (!k) {
    return null;
  }

  const fromDev = devViteModelUrlFromCanonicalDedupeKey(k);
  if (fromDev) {
    return fromDev;
  }

  const lower = k.toLowerCase();
  if (lower.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
    return bridgeWebPathToCatalogModelUrl(k);
  }
  if (lower.startsWith(FREE_MODELS_WEB_PREFIX)) {
    return bridgeWebPathToCatalogModelUrl(k);
  }
  if (lower.startsWith(DEV_SRC_ASSETS_PREFIX)) {
    return projectRelativePathToDevUrl(k);
  }

  return null;
}

function resolveRelativeUrlAgainstPageOrigin(url: string): string {
  const trimmed = url.trim();
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^vscode-webview:\/\//i.test(trimmed) ||
    /^blob:/i.test(trimmed)
  ) {
    return trimmed;
  }
  if (typeof window === "undefined") {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${window.location.origin}${trimmed}`;
  }
  try {
    return new URL(trimmed, window.location.href).toString();
  } catch {
    return trimmed;
  }
}

function isWebviewPackagedResourceUrl(url: string): boolean {
  const u = url.trim();
  return (
    u.startsWith("vscode-webview:") ||
    u.startsWith("vscode-webview-resource:") ||
    u.includes(".vscode-resource.vscode-cdn.net")
  );
}

/**
 * Fetchable preview URL for Model Catalog / Studio (avoids Vite `index.html` and stale glob URLs).
 */
export function resolveCatalogModelPreviewUrl(
  model: Pick<ModelEntry, "url" | "dedupeKey">,
): string {
  const rawUrl = model.url.trim();

  const fromWebview = resolveCatalogModelUrlInExtensionWebview(model.dedupeKey);
  if (fromWebview != null && fromWebview.length > 0) {
    return fromWebview;
  }

  if (isWebviewPackagedResourceUrl(rawUrl)) {
    const rel = catalogDedupeKeyToResolveRelativePath(model.dedupeKey);
    if (rel != null && rel.length > 0) {
      return resolveWebviewModelAssetUrl(rel);
    }
    return rawUrl;
  }

  const fromKey = catalogUrlFromDedupeKey(model.dedupeKey);
  if (fromKey) {
    return resolveRelativeUrlAgainstPageOrigin(
      rewriteLegacyViteAssetPathForWebview(fromKey),
    );
  }

  let url = rawUrl;
  url = rewriteLegacyViteAssetPathForWebview(url);

  const win = typeof window !== "undefined" ? window : undefined;
  const localBase = win?.LOCAL_ASSETS_BASE_URI?.trim();
  if (localBase) {
    const normalizedBase = localBase.endsWith("/") ? localBase : `${localBase}/`;
    const marker = "assets/";
    const markerIdx = url.indexOf(marker);
    if (markerIdx >= 0 && !url.includes("__extension_src_assets")) {
      const relativePath = url.slice(markerIdx + marker.length);
      url = `${normalizedBase}${relativePath}`;
    }
  }

  return resolveRelativeUrlAgainstPageOrigin(url);
}
