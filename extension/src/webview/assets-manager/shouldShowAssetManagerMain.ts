/** Webview / browser: enable scaffold without Vite dev. Set to `"1"`, then reload. */
export const ASSET_MANAGER_SCAFFOLD_STORAGE_KEY = "ternion.assetManagerScaffold";

/**
 * Optional helper for experiments (not used for the default Asset Manager surface).
 * **Product entry:** Bitstream header **Menu → Asset Manager** (`useOpenAssetManager().openAssetManager()`).
 *
 * Returns true when:
 * - **Vite dev** — `import.meta.env.DEV` is true, or
 * - **Webview** — `localStorage.setItem(ASSET_MANAGER_SCAFFOLD_STORAGE_KEY, '1')` then reload.
 */
export function shouldShowAssetManagerMain(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(ASSET_MANAGER_SCAFFOLD_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
