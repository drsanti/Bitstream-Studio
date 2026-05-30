/**
 * Standalone model-downloader / free-sync bridge: **no** automatic fallback to
 * `t3d-extension/src/assets`. Use monorepo `ternion-t3d/assets/**` or explicit env vars.
 *
 * VS Code extension mode injects `setBridgeUserAssetsRoot` / `setBridgeModelDownloadsRoot`
 * — those paths are always preferred when set.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  getBridgeModelDownloadsRoot,
  getBridgeUserAssetsRoot,
} from "./model-downloader/bridgeDefaultPaths";
import {
  resolveExtensionGlobalStorageFreePackRoot,
  resolveExtensionGlobalStorageTesaiotModelsRoot,
  resolveFreePackMirrorRootFromAssetsRoot,
} from "./extensionGlobalStoragePaths";
import {
  resolveMonorepoAssetsDir,
  resolveMonorepoFreePackRoot,
} from "./assetMonorepoRoots";

/** Shown when the bridge cannot resolve asset roots (browser / Node bridge without VS Code injection). */
export const STANDALONE_BRIDGE_ASSET_LAYOUT_GUIDE = [
  "The bridge no longer writes or scans under **t3d-extension/src/assets** by default.",
  "",
  "Pick one setup:",
  "",
  "**1) VS Code / Cursor (recommended)** — Activate this extension once so **globalStorage** exists. The bridge uses the same **…/globalStorage/…/terniondev.bitstream-studio/assets/** tree as the extension panel (including **free/** and **tesaiot/models/**).",
  "",
  "**2) Explicit directories** — Set env vars before starting the bridge:",
  "  • **TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR** — absolute path to the folder that should receive the free-pack mirror (typically …/assets/free).",
  "  • **TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR** — absolute path for Model Loader output (typically …/assets/tesaiot/models).",
  "",
  "**3) Monorepo (optional)** — **ternion-t3d/assets/** next to **t3d-extension/** is used only when globalStorage is unavailable and env vars are unset.",
  "",
  "Then restart **npm run dev:with-model-loader** (or your bridge script).",
].join("\n");

export class StandaloneBridgeAssetLayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StandaloneBridgeAssetLayoutError";
  }
}

function throwLayout(summary: string): never {
  throw new StandaloneBridgeAssetLayoutError(
    `${summary}\n\n${STANDALONE_BRIDGE_ASSET_LAYOUT_GUIDE}`
  );
}

/**
 * Free-pack default output when the bridge runs outside VS Code (browser dev).
 * Order: host-injected **assets** root → env → extension **globalStorage** `assets/free` → monorepo.
 */
export function resolveStandaloneBridgeFreePackOutputDir(): string {
  const injected = getBridgeUserAssetsRoot()?.trim();
  if (injected) {
    return resolveFreePackMirrorRootFromAssetsRoot(injected);
  }
  const fromEnv = process.env.TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR?.trim();
  if (fromEnv) {
    return resolveFreePackMirrorRootFromAssetsRoot(fromEnv);
  }
  const globalFree = resolveExtensionGlobalStorageFreePackRoot();
  if (globalFree != null) {
    return path.resolve(globalFree);
  }
  const monorepoFree = resolveMonorepoFreePackRoot();
  if (monorepoFree != null) {
    return monorepoFree;
  }
  return throwLayout(
    "Could not resolve a free-pack output directory (no host-injected assets root, no TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR, no extension globalStorage folder, and no monorepo **ternion-t3d/assets** detected from process.cwd())."
  );
}

/**
 * Default Model Loader output base when the bridge runs outside VS Code.
 * Order: injected downloads root → env → extension **globalStorage** → monorepo.
 */
export function resolveStandaloneModelLoaderBaseDir(): string {
  const bridge = getBridgeModelDownloadsRoot()?.trim();
  if (bridge) {
    return path.resolve(bridge);
  }
  const fromEnv = process.env.TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  const globalModels = resolveExtensionGlobalStorageTesaiotModelsRoot();
  if (globalModels != null) {
    return path.resolve(globalModels);
  }
  const assetsDir = resolveMonorepoAssetsDir();
  if (assetsDir != null) {
    return path.resolve(path.join(assetsDir, "tesaiot", "models"));
  }
  return throwLayout(
    "Could not resolve a Model Loader output directory (no host-injected model root, no TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR, no extension globalStorage folder, and no monorepo **ternion-t3d/assets** detected from process.cwd())."
  );
}

/**
 * Filesystem roots scanned for the browser catalog when the bridge is not driven by VS Code injection.
 */
export function getStandaloneModelCatalogScanRoots(): string[] {
  const roots: string[] = [];
  const bridge = getBridgeModelDownloadsRoot()?.trim();
  if (bridge) {
    roots.push(path.resolve(bridge));
    const userAssets = getBridgeUserAssetsRoot()?.trim();
    if (userAssets) {
      const freeModels = path.join(path.resolve(userAssets), "free", "models");
      if (fs.existsSync(freeModels)) {
        roots.push(freeModels);
      }
    }
    return roots;
  }

  const envModels = process.env.TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR?.trim();
  if (envModels) {
    roots.push(path.resolve(envModels));
  }

  const globalModels = resolveExtensionGlobalStorageTesaiotModelsRoot();
  if (globalModels) {
    roots.push(path.resolve(globalModels));
    const globalFreeModels = path.join(
      path.dirname(path.dirname(globalModels)),
      "free",
      "models"
    );
    if (fs.existsSync(globalFreeModels)) {
      roots.push(globalFreeModels);
    }
  }

  const assetsDir = resolveMonorepoAssetsDir();
  if (assetsDir != null) {
    roots.push(path.resolve(path.join(assetsDir, "tesaiot", "models")));
    const freeModels = path.join(assetsDir, "free", "models");
    if (fs.existsSync(freeModels)) {
      roots.push(path.resolve(freeModels));
    }
  }

  if (roots.length === 0) {
    return throwLayout(
      "No catalog scan roots (no host-injected model root, no TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR, and no monorepo **ternion-t3d/assets** detected from process.cwd())."
    );
  }

  const seen = new Set<string>();
  return roots.filter((r) => {
    const k = path.resolve(r).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
