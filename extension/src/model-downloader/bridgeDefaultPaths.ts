/**
 * When the model-downloader bridge runs inside the VS Code extension host,
 * `extension.ts` sets the default Model Loader download root to globalStorage
 * `.../assets/tesaiot/models` via **`setBridgeModelDownloadsRoot`**, and the free-pack
 * parent via **`setBridgeUserAssetsRoot`** (`.../assets`).
 *
 * Standalone bridge (browser / npm scripts) does **not** inject those paths: output and
 * catalog roots come from **`TERNION_BRIDGE_*`** env vars and/or monorepo **`ternion-t3d/assets/**`**
 * (see **`src/standaloneBridgeAssetLayout.ts`**). There is **no** automatic fallback to
 * **t3d-extension/src/assets**.
 */

let modelDownloadsRootFs: string | null = null;
let userAssetsRootFs: string | null = null;

export function setBridgeModelDownloadsRoot(fsPath: string | null): void {
  const t = fsPath?.trim();
  modelDownloadsRootFs = t && t.length > 0 ? t : null;
}

export function getBridgeModelDownloadsRoot(): string | null {
  return modelDownloadsRootFs;
}

export function setBridgeUserAssetsRoot(fsPath: string | null): void {
  const t = fsPath?.trim();
  userAssetsRootFs = t && t.length > 0 ? t : null;
}

export function getBridgeUserAssetsRoot(): string | null {
  return userAssetsRootFs;
}
