/**
 * Studio asset manifest — **remote-first** list of {@link StudioAssetDescriptor} rows (models,
 * environments, textures). Host the JSON next to your online asset tree, for example:
 * `${ONLINE_ASSETS_BASE_URI}/studio-asset-manifest.v1.json` (same host as `GlobalConfig.ONLINE_ASSETS_BASE_URI`).
 * Override with `window.STUDIO_ASSET_MANIFEST_URL`. The webview merges remote over the bundled
 * `studio-asset-manifest.v1.json` (by `id`) and refreshes when downloads change or `bumpRefresh()` runs.
 *
 * Publish the canonical JSON to **`ternion-3d-assets-free`** with **`npm run publish:studio-asset-manifest`**
 * (requires `GITHUB_TOKEN` with `repo` scope).
 */
import type { StudioAssetCategory, StudioAssetDescriptor, StudioAssetSource } from "./studio-asset.types";
import bundledStudioAssetManifestJson from "./studio-asset-manifest.v1.json";

const MANIFEST_FILE = "studio-asset-manifest.v1.json";

function trimSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/**
 * Optional full URL to a manifest JSON. When set, overrides the default derived from
 * `window.ONLINE_ASSETS_BASE_URI`.
 */
export function resolveStudioAssetManifestUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const win = window as Window & {
    STUDIO_ASSET_MANIFEST_URL?: string;
    ONLINE_ASSETS_BASE_URI?: string;
  };
  const direct = win.STUDIO_ASSET_MANIFEST_URL?.trim();
  if (direct != null && direct.length > 0) {
    return direct;
  }
  const online = win.ONLINE_ASSETS_BASE_URI?.trim();
  if (online == null || online.length === 0) {
    return null;
  }
  return `${trimSlash(online)}/${MANIFEST_FILE}`;
}

function isStudioAssetSource(s: unknown): s is StudioAssetSource {
  return s === "bundled" || s === "pack" || s === "downloaded" || s === "external";
}

function isStudioAssetCategory(s: unknown): s is StudioAssetCategory {
  return s === "model" || s === "environment" || s === "texture";
}

function asOptionalString(v: unknown): string | undefined {
  if (typeof v !== "string") {
    return undefined;
  }
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Parse manifest JSON: `{ "version": 1, "assets": [ ... ] }` or a bare array of descriptors.
 */
export function parseStudioAssetManifestPayload(data: unknown): StudioAssetDescriptor[] {
  const root = data;
  const rows: unknown =
    root != null && typeof root === "object" && !Array.isArray(root) && "assets" in root
      ? (root as { assets?: unknown }).assets
      : root;
  if (!Array.isArray(rows)) {
    return [];
  }
  const out: StudioAssetDescriptor[] = [];
  for (const raw of rows) {
    if (raw == null || typeof raw !== "object") {
      continue;
    }
    const o = raw as Record<string, unknown>;
    const id = asOptionalString(o.id);
    const label = asOptionalString(o.label);
    const summary = asOptionalString(o.summary);
    const category = o.category;
    const source = o.source;
    if (id == null || label == null || summary == null || !isStudioAssetCategory(category) || !isStudioAssetSource(source)) {
      continue;
    }
    const row: StudioAssetDescriptor = {
      id,
      category,
      source,
      label,
      summary,
      relativePath: asOptionalString(o.relativePath),
      cubemapSetId: asOptionalString(o.cubemapSetId),
      externalUrl: asOptionalString(o.externalUrl),
      onlineFallbackUrl: asOptionalString(o.onlineFallbackUrl),
      primaryUrlOverride: asOptionalString(o.primaryUrlOverride),
      cubemapFaceBasePath: asOptionalString(o.cubemapFaceBasePath),
    };
    out.push(row);
  }
  return out;
}

export async function fetchStudioAssetManifestFromUrl(
  url: string,
  cacheBust: string,
): Promise<StudioAssetDescriptor[]> {
  const u = url.includes("?") ? `${url}&cb=${encodeURIComponent(cacheBust)}` : `${url}?cb=${encodeURIComponent(cacheBust)}`;
  try {
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const json: unknown = await res.json();
    return parseStudioAssetManifestPayload(json);
  } catch {
    return [];
  }
}

/** Bundled fallback (same schema as remote) when the online manifest is missing or unreachable. */
export async function fetchBundledStudioAssetManifest(): Promise<StudioAssetDescriptor[]> {
  return parseStudioAssetManifestPayload(bundledStudioAssetManifestJson);
}

/**
 * Remote-first: tries {@link resolveStudioAssetManifestUrl}, then bundled JSON.
 * Merges by `id` (remote wins over bundled when both define the same id).
 */
export async function loadStudioAssetManifestOverlay(cacheBust: string): Promise<StudioAssetDescriptor[]> {
  const remoteUrl = resolveStudioAssetManifestUrl();
  const remote = remoteUrl != null ? await fetchStudioAssetManifestFromUrl(remoteUrl, cacheBust) : [];
  const local = await fetchBundledStudioAssetManifest();
  const byId = new Map<string, StudioAssetDescriptor>();
  for (const row of local) {
    byId.set(row.id, row);
  }
  for (const row of remote) {
    byId.set(row.id, row);
  }
  return [...byId.values()];
}
