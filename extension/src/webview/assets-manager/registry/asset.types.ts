/**
 * Global asset catalog — stable keys and categories for Asset Manager / consumers.
 * URLs are resolved at runtime via {@link resolveAsset}.
 */

export type AssetCategory = "model" | "environment" | "texture" | "library";

/** Where the entry logically comes from (UI badge + filters). */
export type AssetSource = "bundled" | "pack" | "downloaded" | "external";

/**
 * Curated catalog entry. Persist `id` in flows/settings — not raw URLs —
 * so VSIX / browser / globalStorage resolution stays consistent.
 */
export type AssetDescriptor = {
  id: string;
  category: AssetCategory;
  source: AssetSource;
  label: string;
  summary: string;
  relativePath?: string;
  cubemapSetId?: string;
  externalUrl?: string;
  onlineFallbackUrl?: string;
  primaryUrlOverride?: string;
  cubemapFaceBasePath?: string;
};

/** @deprecated Use {@link AssetDescriptor} — kept for Sensor Studio migration. */
export type StudioAssetDescriptor = AssetDescriptor;

/** @deprecated Use {@link AssetCategory}. */
export type StudioAssetCategory = AssetCategory;

/** @deprecated Use {@link AssetSource}. */
export type StudioAssetSource = AssetSource;
