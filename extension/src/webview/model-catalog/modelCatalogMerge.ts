import type { ModelEntry } from "./modelCatalog-types";
import {
  BROWSER_USER_FREE_URL_RELATIVE_PREFIX,
  BROWSER_USER_MODELS_URL_RELATIVE_PREFIX,
  DEV_SRC_ASSETS_PREFIX,
  TESAIOT_MODELS_WEB_PREFIX,
  TESAIOT_TEXTURES_WEB_PREFIX,
  FREE_MODELS_WEB_PREFIX,
} from "../../assetLayout";
import {
  projectRelativePathToDevUrl,
  resolveTesaiotTexturesToFetchableUrl,
} from "../logical-asset-url";
import { resolveWebviewModelAssetUrl } from "../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl";

/** Re-export for Model Loader and other callers that imported from this module. */
export { projectRelativePathToDevUrl } from "../logical-asset-url";

/**
 * Same logical GLB often exists under both `assets/models/...` (mirrored tree)
 * and `assets/free/models/...` (free-pack layout). Use the path after the last
 * `/models/` so those listings dedupe. Excludes tesaiot download trees.
 */
/**
 * Path segment for {@link resolveWebviewModelAssetUrl} / free-pack layout under globalStorage
 * (`models/...`, `tesaiot/models/...`). Used when VSIX must not load bundled `?url` URIs.
 */
export function catalogDedupeKeyToResolveRelativePath(dedupeKey: string): string | null {
  const k = dedupeKey.replace(/\\/g, "/").trim();
  if (k.length === 0) {
    return null;
  }
  if (k.startsWith("mirror:")) {
    const rest = k.slice("mirror:".length);
    return rest.length > 0 ? `models/${rest}` : null;
  }
  const lower = k.toLowerCase();
  if (lower.startsWith(FREE_MODELS_WEB_PREFIX)) {
    return k.slice("free/".length);
  }
  if (lower.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
    return k;
  }
  if (lower.startsWith(DEV_SRC_ASSETS_PREFIX.toLowerCase())) {
    const idx = lower.indexOf("/models/");
    if (idx >= 0) {
      return k.slice(idx + 1);
    }
  }
  return null;
}

/**
 * VS Code webview: resolve catalog model via injected asset bases (globalStorage free pack, online).
 */
export function resolveCatalogModelUrlInExtensionWebview(
  dedupeKey: string,
): string | null {
  if (typeof window === "undefined" || window.WEBVIEW_READY !== true) {
    return null;
  }
  const rel = catalogDedupeKeyToResolveRelativePath(dedupeKey);
  if (rel == null || rel.length === 0) {
    return null;
  }
  return resolveWebviewModelAssetUrl(rel);
}

export function mirrorPackagedModelsDedupeSuffix(pathOrPosix: string): string | null {
  const n = pathOrPosix.replace(/\\/g, "/").toLowerCase();
  if (n.includes("/tesaiot/models/")) {
    return null;
  }
  const idx = n.lastIndexOf("/models/");
  if (idx < 0) return null;
  const rest = n.slice(idx + "/models/".length);
  if (rest.startsWith("downloads/")) return null;
  return rest;
}

function mirrorPackagedLocationScore(pathOrPosix: string): number {
  const n = pathOrPosix.replace(/\\/g, "/").toLowerCase();
  if (n.includes("/assets/models/") && !n.includes("/assets/free/")) return 3;
  if (n.includes("/assets/free/models/") || n.includes("/free/models/")) return 2;
  return 0;
}

/**
 * Normalize paths so `tesaiot/models/...` keys match between glob and bridge listings.
 */
export function canonicalCatalogDedupeKey(pathOrPosix: string): string {
  const n = pathOrPosix.replace(/\\/g, "/").toLowerCase();
  const tailTesaiot = TESAIOT_MODELS_WEB_PREFIX.toLowerCase();
  const idxT = n.lastIndexOf(tailTesaiot);
  if (idxT >= 0) {
    return n.slice(idxT);
  }
  const mirror = mirrorPackagedModelsDedupeSuffix(n);
  if (mirror) {
    return `mirror:${mirror}`;
  }
  return n;
}

/**
 * Merge static glob entries with dynamically listed downloaded models.
 * Packaged mirror paths (`assets/models` vs `assets/free/models`) dedupe to one card,
 * preferring the mirrored `assets/models` URL when multiple **static** sources exist.
 * For the same `mirror:` key, **downloaded** models (globalStorage / scan roots) override
 * static bundle URLs so the catalog loads from the user's download location in VSIX,
 * not only from `out/webview/assets` (which may omit large GLBs).
 */
export function mergeCatalogModels(
  staticEntries: ModelEntry[],
  dynamicDownloaded: ModelEntry[],
): ModelEntry[] {
  const map = new Map<string, ModelEntry>();

  const staticByKey = new Map<string, ModelEntry[]>();
  for (const m of staticEntries) {
    const k = canonicalCatalogDedupeKey(m.dedupeKey);
    // Downloads are runtime-managed (extension/bridge filesystem scan). Never keep
    // bundled static "downloads" entries, otherwise deleted local models can linger
    // as stale cards that fail thumbnail generation.
    if (
      k.startsWith(TESAIOT_MODELS_WEB_PREFIX) ||
      k.startsWith(FREE_MODELS_WEB_PREFIX)
    ) {
      continue;
    }
    let arr = staticByKey.get(k);
    if (!arr) {
      arr = [];
      staticByKey.set(k, arr);
    }
    arr.push(m);
  }

  for (const [k, arr] of staticByKey) {
    const best =
      k.startsWith("mirror:") && arr.length > 1
        ? arr.reduce((acc, m) =>
            mirrorPackagedLocationScore(m.dedupeKey) >
            mirrorPackagedLocationScore(acc.dedupeKey)
              ? m
              : acc,
          )
        : arr[0];
    map.set(k, { ...best, dedupeKey: k, modelSource: "static" });
  }

  for (const m of dynamicDownloaded) {
    const k = canonicalCatalogDedupeKey(m.dedupeKey);
    map.set(k, { ...m, dedupeKey: k, modelSource: "dynamic" });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Catalog `url` for a bridge `webPath`. Pack roots (`tesaiot/models`, `tesaiot/textures`, `free/models`)
 * map to **`/__ternion_user_*`** (extension `local-webapp-server` or Vite dev middleware).
 * Other keys (for example `src/assets/...`) fall through to {@link projectRelativePathToDevUrl} (`__extension_src_assets` in DEV).
 */
export function bridgeWebPathToCatalogModelUrl(webPath: string): string {
  const trimmed = webPath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (trimmed.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
    /** DEV and prod: extension `local-webapp-server` maps this to globalStorage `…/assets/tesaiot/models`. */
    const rest = trimmed.slice(TESAIOT_MODELS_WEB_PREFIX.length);
    const base = import.meta.env.BASE_URL ?? "/";
    const baseUrl =
      typeof window !== "undefined"
        ? new URL(base, window.location.origin).toString()
        : `http://localhost/${base}`;
    const root = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return new URL(`${BROWSER_USER_MODELS_URL_RELATIVE_PREFIX}${rest}`, root).toString();
  }
  if (trimmed.startsWith(TESAIOT_TEXTURES_WEB_PREFIX)) {
    return resolveTesaiotTexturesToFetchableUrl(webPath);
  }
  if (trimmed.startsWith(FREE_MODELS_WEB_PREFIX)) {
    /** Same as tesaiot: do not use `__extension_src_assets` for pack paths — downloads live under globalStorage. */
    const rest = trimmed.slice("free/".length);
    const base = import.meta.env.BASE_URL ?? "/";
    const baseUrl =
      typeof window !== "undefined"
        ? new URL(base, window.location.origin).toString()
        : `http://localhost/${base}`;
    const root = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return new URL(`${BROWSER_USER_FREE_URL_RELATIVE_PREFIX}${rest}`, root).toString();
  }
  return projectRelativePathToDevUrl(webPath);
}

/**
 * Vite dev: rebuild a fetchable model URL from the **canonical** catalog `dedupeKey`
 * (merged {@link ModelEntry.dedupeKey}, surfaced as `catalog-model:${dedupeKey}` in Studio).
 * Avoids GLTFLoader following a stale `primaryUrlOverride` that 404s to SPA `index.html`
 * (`Unexpected token '<' … is not valid JSON`).
 */
export function devViteModelUrlFromCanonicalDedupeKey(dedupeKey: string): string | null {
  if (!import.meta.env.DEV) {
    return null;
  }
  const k = dedupeKey.replace(/\\/g, "/").trim();
  if (k.length === 0) {
    return null;
  }
  if (k.startsWith("mirror:")) {
    const rest = k.slice("mirror:".length);
    if (rest.length === 0) {
      return null;
    }
    return bridgeWebPathToCatalogModelUrl(`${FREE_MODELS_WEB_PREFIX}${rest}`);
  }
  if (k.startsWith(FREE_MODELS_WEB_PREFIX)) {
    return bridgeWebPathToCatalogModelUrl(k);
  }
  if (k.startsWith(TESAIOT_MODELS_WEB_PREFIX)) {
    return bridgeWebPathToCatalogModelUrl(k);
  }
  const prefixLower = DEV_SRC_ASSETS_PREFIX.toLowerCase();
  if (k.toLowerCase().startsWith(prefixLower)) {
    return projectRelativePathToDevUrl(k);
  }
  return null;
}
