import type { StudioAssetDescriptor } from "./studio-asset.types";

/**
 * @deprecated Curated rows are loaded from **`studio-asset-manifest.v1.json`** (bundled + optional
 * remote `ONLINE_ASSETS_BASE_URI/studio-asset-manifest.v1.json` or `window.STUDIO_ASSET_MANIFEST_URL`).
 * Kept empty so legacy imports do not ship duplicate truth.
 */
export const STUDIO_ASSET_CATALOG: readonly StudioAssetDescriptor[] = [];
