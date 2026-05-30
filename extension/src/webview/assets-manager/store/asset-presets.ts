/**
 * Online asset roots for T3D `T3DAssetManager`: base URL must be the directory
 * that directly contains `models/`, `textures/`, `sounds/` (see T3D buildModelPath / texture paths).
 *
 * - Free public set: `github.com/drsanti/ternion-3d-assets-free` → `main/assets`
 * - Full set: `github.com/drsanti/ternion-3d-assets` → `main`
 */

export const ASSET_SOURCE_FREE =
  "https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets";

export const ASSET_SOURCE_FULL =
  "https://raw.githubusercontent.com/drsanti/ternion-3d-assets/main";

export type AssetPresetId = "free" | "full" | "custom";

export interface AssetPreset {
  id: AssetPresetId;
  label: string;
  /** Set when preset is not custom */
  url?: string;
  description?: string;
}

export const ASSET_PRESETS: AssetPreset[] = [
  {
    id: "free",
    label: "Free",
    url: ASSET_SOURCE_FREE,
    description: "ternion-3d-assets-free (textures + models subset on GitHub)",
  },
  {
    id: "full",
    label: "Full",
    url: ASSET_SOURCE_FULL,
    description: "ternion-3d-assets main branch (raw)",
  },
  { id: "custom", label: "Custom", description: "Any HTTPS base with models/textures layout" },
];

const PRESET_URLS: Record<string, string | undefined> = Object.fromEntries(
  ASSET_PRESETS.filter((p) => p.url).map((p) => [p.id, p.url]),
);

export function normalizeAssetBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Small file expected on both default remotes (cubemap readme). */
export const ASSET_CONNECTION_TEST_REL_PATH =
  "textures/cubemap/Yokohama/readme.txt";

export function buildAssetConnectionTestUrl(base: string): string {
  return `${normalizeAssetBaseUrl(base)}/${ASSET_CONNECTION_TEST_REL_PATH}`;
}

export function presetIdForUrl(url: string): AssetPresetId {
  const n = normalizeAssetBaseUrl(url);
  if (n === normalizeAssetBaseUrl(ASSET_SOURCE_FREE)) return "free";
  if (n === normalizeAssetBaseUrl(ASSET_SOURCE_FULL)) return "full";
  return "custom";
}

export function urlForPreset(id: AssetPresetId, customUrl: string): string {
  if (id === "custom") {
    return normalizeAssetBaseUrl(customUrl);
  }
  const presetUrl = PRESET_URLS[id];
  if (!presetUrl) {
    throw new Error(`No URL for preset: ${id}`);
  }
  return presetUrl;
}
