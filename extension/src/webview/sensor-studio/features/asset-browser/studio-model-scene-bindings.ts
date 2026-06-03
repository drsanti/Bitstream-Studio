import {
  resolveOnlineFallbackForGlobalDirectoryUrl,
  resolveWebviewPackAssetOnlineUrl,
} from "../../../asset-resolution/global-directory-online-fallback";
import { resolveWebviewModelAssetUrl } from "../../../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl";
import { PSOC_E84_GLB_RELATIVE_PATH } from "../../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants";
import {
  migrateLegacyPackModelAssetId,
  migrateLegacyPackModelUrl,
} from "../../persistence/migrate-legacy-pack-model";
import {
  devViteModelUrlFromCanonicalDedupeKey,
  resolveCatalogModelUrlInExtensionWebview,
} from "../../../model-catalog/modelCatalogMerge";
import { resolveStudioAsset } from "./resolveStudioAsset";
import type { StudioAssetDescriptor } from "./studio-asset.types";

const ABSOLUTE_FETCH_URL_RE = /^(https?:|blob:|data:)/i;

const CATALOG_MODEL_ID_PREFIX = "catalog-model:";

/**
 * Older flows / catalog snapshots stored `defaultScene3DConfig().model.url` as an absolute
 * `http://localhost:…` URL at authoring time. That URL returns HTML in other hosts (VS Code
 * webview). Re-anchor the bundled default PSoC preview to the logical path.
 */
function normalizeStaleLocalhostDefaultPsocUrl(url: string): string {
  const t = url.trim();
  if (t.length === 0 || !ABSOLUTE_FETCH_URL_RE.test(t)) {
    return t;
  }
  try {
    const u = new URL(t);
    const isLoopback = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    const path = u.pathname.replace(/\\/g, "/");
    if (isLoopback && path.includes("psoc-e84-ai") && path.endsWith(".glb")) {
      return PSOC_E84_GLB_RELATIVE_PATH;
    }
  } catch {
    // ignore malformed URLs
  }
  return t;
}

function primaryFetchUrlForStudioModelDescriptor(d: StudioAssetDescriptor): string {
  if (d.category !== "model") {
    return resolveStudioAsset(d).primaryUrl;
  }
  if (d.id.startsWith(CATALOG_MODEL_ID_PREFIX)) {
    const dedupeKey = d.id.slice(CATALOG_MODEL_ID_PREFIX.length);
    const fromWebview = resolveCatalogModelUrlInExtensionWebview(dedupeKey);
    if (fromWebview != null && fromWebview.length > 0) {
      return fromWebview;
    }
    const devFresh = devViteModelUrlFromCanonicalDedupeKey(dedupeKey);
    if (devFresh != null && devFresh.length > 0) {
      return devFresh;
    }
  }
  return resolveStudioAsset(d).primaryUrl;
}

export function isValidStudioModelAssetId(id: string, catalog: readonly StudioAssetDescriptor[]): boolean {
  return catalog.some((d) => d.id === id && d.category === "model");
}

export function listStudioModelDescriptors(catalog: readonly StudioAssetDescriptor[]): StudioAssetDescriptor[] {
  return catalog.filter((d) => d.category === "model");
}

export function getStudioModelDescriptorById(
  id: string,
  catalog: readonly StudioAssetDescriptor[],
): StudioAssetDescriptor | null {
  const d = catalog.find((x) => x.id === id);
  return d != null && d.category === "model" ? d : null;
}

/**
 * Value persisted on `Scene3DConfigV1.model.url` when choosing a catalog entry
 * (relative path, override, or absolute external URL — not the resolved dev URL).
 */
export function persistedModelUrlFromStudioDescriptor(d: StudioAssetDescriptor): string {
  if (d.category !== "model") {
    return "";
  }
  if (d.relativePath != null && d.relativePath.length > 0) {
    return d.relativePath;
  }
  if (d.externalUrl != null && d.externalUrl.length > 0) {
    return d.externalUrl;
  }
  if (d.primaryUrlOverride != null && d.primaryUrlOverride.length > 0) {
    return d.primaryUrlOverride;
  }
  return resolveStudioAsset(d).primaryUrl;
}

function urlMatchesDescriptorModel(urlTrimmed: string, d: StudioAssetDescriptor): boolean {
  if (d.category !== "model") {
    return false;
  }
  const persisted = persistedModelUrlFromStudioDescriptor(d);
  if (persisted.length > 0 && persisted === urlTrimmed) {
    return true;
  }
  const resolved = primaryFetchUrlForStudioModelDescriptor(d);
  return resolved.length > 0 && resolved === urlTrimmed;
}

/**
 * Resolve the catalog model row for the current persisted URL and optional `studioAssetId`.
 */
export function resolveStudioModelDescriptorForPersistedModel(
  url: string,
  studioAssetId: string | null | undefined,
  catalog: readonly StudioAssetDescriptor[],
): StudioAssetDescriptor | null {
  const trimmed = url.trim();
  if (studioAssetId != null && studioAssetId.length > 0) {
    const byId = getStudioModelDescriptorById(studioAssetId, catalog);
    if (byId != null && urlMatchesDescriptorModel(trimmed, byId)) {
      return byId;
    }
  }
  for (const d of catalog) {
    if (d.category === "model" && urlMatchesDescriptorModel(trimmed, d)) {
      return d;
    }
  }
  return null;
}

/**
 * Pack-relative path for online fallback (`models/...` under globalStorage / free mirror).
 */
export function resolveStudioModelPackRelativePath(
  model: { url: string; studioAssetId?: string },
  catalog: readonly StudioAssetDescriptor[],
): string | null {
  const inferred = resolveStudioModelDescriptorForPersistedModel(
    model.url,
    model.studioAssetId,
    catalog,
  );
  if (inferred?.relativePath != null && inferred.relativePath.trim().length > 0) {
    return inferred.relativePath.trim();
  }
  const trimmed = migrateLegacyPackModelUrl(
    normalizeStaleLocalhostDefaultPsocUrl(model.url),
  ).trim();
  if (trimmed.length > 0 && !ABSOLUTE_FETCH_URL_RE.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * First online mirror candidate for a studio model (used by loaders that pick URL themselves).
 * Prefer {@link preflightModelPreviewUrlWithGlobalDirectoryFallback} when verifying fetch.
 */
export function resolveStudioModelOnlineFallbackUrl(
  model: { url: string; studioAssetId?: string },
  catalog: readonly StudioAssetDescriptor[],
  primaryFetchUrl?: string,
): string | null {
  const inferred = resolveStudioModelDescriptorForPersistedModel(
    model.url,
    model.studioAssetId,
    catalog,
  );
  const explicit = inferred?.onlineFallbackUrl?.trim();
  if (explicit != null && explicit.length > 0) {
    return explicit;
  }
  const rel = resolveStudioModelPackRelativePath(model, catalog);
  if (rel != null) {
    const fromRel = resolveWebviewPackAssetOnlineUrl(rel);
    if (fromRel != null && fromRel.length > 0) {
      return fromRel;
    }
  }
  if (primaryFetchUrl != null && primaryFetchUrl.trim().length > 0) {
    return resolveOnlineFallbackForGlobalDirectoryUrl(primaryFetchUrl);
  }
  return null;
}

/**
 * URL passed to `GLTFLoader` / fetch — matches Asset Browser preview resolution
 * ({@link resolveStudioAsset}), not necessarily the raw string on `Scene3DConfigV1.model.url`.
 */
export function resolveStudioModelGltfFetchUrl(
  model: { url: string; studioAssetId?: string },
  catalog: readonly StudioAssetDescriptor[],
  fallbackUrl: string,
): string {
  const modelUrl = migrateLegacyPackModelUrl(
    normalizeStaleLocalhostDefaultPsocUrl(model.url),
  );
  const fallbackResolved = normalizeStaleLocalhostDefaultPsocUrl(fallbackUrl);
  const studioAssetId =
    model.studioAssetId != null && model.studioAssetId.length > 0
      ? migrateLegacyPackModelAssetId(model.studioAssetId)
      : model.studioAssetId;
  if (studioAssetId != null && studioAssetId.length > 0) {
    const byId = getStudioModelDescriptorById(studioAssetId, catalog);
    if (byId != null) {
      const primary = primaryFetchUrlForStudioModelDescriptor(byId);
      if (primary.length > 0) {
        return primary;
      }
    }
  }

  const inferred = resolveStudioModelDescriptorForPersistedModel(
    modelUrl,
    studioAssetId,
    catalog,
  );
  if (inferred != null) {
    const primary = primaryFetchUrlForStudioModelDescriptor(inferred);
    if (primary.length > 0) {
      return primary;
    }
  }

  const trimmed = modelUrl.trim();
  if (trimmed.length === 0) {
    const fb = fallbackResolved.trim();
    if (fb.length === 0) {
      return "";
    }
    return resolveStudioModelGltfFetchUrl(
      { url: fb, studioAssetId },
      catalog,
      "",
    );
  }
  if (ABSOLUTE_FETCH_URL_RE.test(trimmed)) {
    return trimmed;
  }
  return resolveWebviewModelAssetUrl(trimmed);
}

/** Select value for rotation inspector: catalog id or sentinel for free-form URL. */
export const STUDIO_MODEL_SELECT_CUSTOM = "__custom__";

export function rotationInspectorModelCatalogSelectValue(
  model: { url: string; studioAssetId?: string },
  catalog: readonly StudioAssetDescriptor[],
): string {
  const trimmed = model.url.trim();
  if (
    model.studioAssetId != null &&
    model.studioAssetId.length > 0 &&
    isValidStudioModelAssetId(model.studioAssetId, catalog)
  ) {
    const d = getStudioModelDescriptorById(model.studioAssetId, catalog);
    if (d != null && urlMatchesDescriptorModel(trimmed, d)) {
      return model.studioAssetId;
    }
  }
  const inferred = resolveStudioModelDescriptorForPersistedModel(trimmed, null, catalog);
  return inferred?.id ?? STUDIO_MODEL_SELECT_CUSTOM;
}
