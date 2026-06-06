/**
 * Resolve per-user VS Code / Cursor `globalStorage` asset roots for this extension.
 * Same layout as `extensionAssetPaths.ts` (Node-only, no vscode import).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { GLOBAL_STORAGE_ASSET_DIRS } from "./assetLayout";

/** `${publisher}.${name}` lowercased — matches VS Code globalStorage folder name. */
export const EXTENSION_GLOBAL_STORAGE_FOLDER = "terniondev.bitstream-studio";

const EDITOR_APP_NAMES = ["Cursor", "Code", "VSCodium"] as const;

/**
 * Resolve editor `globalStorage` roots for a home directory and OS.
 * Used by CLI diagnostics and unit tests (Windows vs macOS vs Linux).
 */
export function listEditorGlobalStorageDirsForHome(
  home: string,
  platform: NodeJS.Platform,
): string[] {
  const out: string[] = [];
  if (platform === "win32") {
    for (const editor of EDITOR_APP_NAMES) {
      out.push(
        path.join(home, "AppData", "Roaming", editor, "User", "globalStorage"),
      );
    }
    return out;
  }
  if (platform === "darwin") {
    for (const editor of EDITOR_APP_NAMES) {
      out.push(
        path.join(
          home,
          "Library",
          "Application Support",
          editor,
          "User",
          "globalStorage",
        ),
      );
    }
    return out;
  }
  const configHome =
    process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  for (const editor of EDITOR_APP_NAMES) {
    out.push(path.join(configHome, editor, "User", "globalStorage"));
  }
  return out;
}

export function listEditorGlobalStorageDirs(): string[] {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) {
    return [];
  }
  return listEditorGlobalStorageDirsForHome(home, process.platform);
}

function extensionAssetsRootUnderGlobalStorage(gsBase: string): string {
  return path.join(gsBase, EXTENSION_GLOBAL_STORAGE_FOLDER, "assets");
}

/**
 * `<globalStorage>/terniondev.bitstream-studio/assets` when the extension folder exists,
 * or the first editor candidate path (even if not created yet) so sync targets match the extension.
 */
export function resolveExtensionGlobalStorageAssetsRoot(): string | null {
  for (const gs of listEditorGlobalStorageDirs()) {
    const extRoot = path.join(gs, EXTENSION_GLOBAL_STORAGE_FOLDER);
    try {
      if (fs.existsSync(extRoot)) {
        return extensionAssetsRootUnderGlobalStorage(gs);
      }
    } catch {
      /* ignore */
    }
  }
  const first = listEditorGlobalStorageDirs()[0];
  if (first) {
    return extensionAssetsRootUnderGlobalStorage(first);
  }
  return null;
}

/** Same as `getFreeGithubMirrorRootUri` — `…/assets/free`. */
export function resolveExtensionGlobalStorageFreePackRoot(): string | null {
  const assets = resolveExtensionGlobalStorageAssetsRoot();
  if (assets == null) {
    return null;
  }
  return path.join(assets, ...GLOBAL_STORAGE_ASSET_DIRS.freePackGlobal);
}

/** Same as `getModelDownloadsRootUri` — `…/assets/tesaiot/models`. */
export function resolveExtensionGlobalStorageTesaiotModelsRoot(): string | null {
  const assets = resolveExtensionGlobalStorageAssetsRoot();
  if (assets == null) {
    return null;
  }
  return path.join(assets, ...GLOBAL_STORAGE_ASSET_DIRS.tesaiotModels);
}

/** Same as `getTesaiotTexturesRootUri` — `…/assets/tesaiot/textures`. */
export function resolveExtensionGlobalStorageTesaiotTexturesRoot(): string | null {
  const assets = resolveExtensionGlobalStorageAssetsRoot();
  if (assets == null) {
    return null;
  }
  return path.join(assets, ...GLOBAL_STORAGE_ASSET_DIRS.tesaiotTextures);
}

/**
 * Normalize `…/assets` or `…/assets/free` to the free-pack mirror root.
 */
export function resolveFreePackMirrorRootFromAssetsRoot(
  assetsOrFreeRoot: string
): string {
  const base = path.resolve(assetsOrFreeRoot);
  if (path.basename(base).toLowerCase() === "free") {
    return base;
  }
  return path.join(base, "free");
}
