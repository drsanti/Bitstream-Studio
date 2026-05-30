/**
 * Sensor Studio Asset Browser — stable catalog keys and categories.
 * URLs are resolved at runtime via {@link resolveStudioAsset}.
 */

export type StudioAssetCategory = "model" | "environment" | "texture";

/** Where the entry logically comes from (UI badge + future filters). */
export type StudioAssetSource = "bundled" | "pack" | "downloaded" | "external";

/**
 * Curated catalog entry. Persist this shape (or `id` only) in flows/settings — not raw URLs —
 * so VSIX / browser / globalStorage resolution stays consistent.
 */
export type StudioAssetDescriptor = {
  /** Stable id (persist references by this). */
  id: string;
  category: StudioAssetCategory;
  source: StudioAssetSource;
  label: string;
  /** Short line shown in the list (not the long catalog description). */
  summary: string;
  /** Relative to free / local / online asset roots (see `resolveWebviewModelAssetUrl`). */
  relativePath?: string;
  /** Cubemap folder under `textures/cubemap/<id>/` (six JPEG faces). */
  cubemapSetId?: string;
  /** Absolute URL (e.g. GitHub raw) when `source === "external"`. */
  externalUrl?: string;
  /**
   * Optional online mirror when the pack / globalStorage file is missing (404).
   * Not listed as a separate Asset Browser row — used only at load time after preflight fails.
   */
  onlineFallbackUrl?: string;
  /**
   * Merged model-catalog / bridge URL — use as-is for **Copy URL** / loaders (already environment-specific).
   * When set, {@link resolveStudioAsset} returns this as `primaryUrl` (ignores `relativePath` / cubemap ids).
   */
  primaryUrlOverride?: string;
  /**
   * Cubemap faces live under this folder (posix, relative to asset roots), e.g. `free/textures/cubemap/Humus`.
   * When set, six face URLs are `resolveWebviewModelAssetUrl(\`${cubemapFaceBasePath}/${face}\`)`.
   * Omit when using {@link cubemapSetId} with the default `textures/cubemap/<id>/` layout.
   */
  cubemapFaceBasePath?: string;
};
