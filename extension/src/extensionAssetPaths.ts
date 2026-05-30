/**
 * User-writable asset roots under ExtensionContext.globalStorageUri (VS Code).
 * Layout segments are defined in `assetLayout.ts` (see `src/assets/NOTE.md`).
 */

import * as path from "node:path";
import * as vscode from "vscode";
import { GLOBAL_STORAGE_ASSET_DIRS } from "./assetLayout";

export {
  TESAIOT_MODELS_WEB_PREFIX,
  TESAIOT_TEXTURES_WEB_PREFIX,
} from "./assetLayout";

export function getUserAssetsRootUri(
  context: vscode.ExtensionContext
): vscode.Uri {
  return vscode.Uri.joinPath(context.globalStorageUri, "assets");
}

/**
 * Default directory for API / Model Loader downloads under globalStorage:
 * `<globalStorage>/assets/tesaiot/models`.
 */
export function getModelDownloadsRootUri(
  context: vscode.ExtensionContext
): vscode.Uri {
  return vscode.Uri.joinPath(
    getUserAssetsRootUri(context),
    ...GLOBAL_STORAGE_ASSET_DIRS.tesaiotModels
  );
}

/**
 * Tesaiot pack textures (parallel to `free/textures/`): `<globalStorage>/assets/tesaiot/textures`.
 */
export function getTesaiotTexturesRootUri(
  context: vscode.ExtensionContext
): vscode.Uri {
  return vscode.Uri.joinPath(
    getUserAssetsRootUri(context),
    ...GLOBAL_STORAGE_ASSET_DIRS.tesaiotTextures
  );
}

export function getFreeGithubMirrorRootUri(
  context: vscode.ExtensionContext
): vscode.Uri {
  return vscode.Uri.joinPath(
    getUserAssetsRootUri(context),
    ...GLOBAL_STORAGE_ASSET_DIRS.freePackGlobal
  );
}

/** True if `resolvedPath` is inside globalStorage `assets/` (free pack, tesaiot, …). */
export function pathIsUnderUserAssetsTree(
  context: vscode.ExtensionContext,
  resolvedPath: string
): boolean {
  const root = getUserAssetsRootUri(context).fsPath;
  const norm = path.resolve(resolvedPath);
  const rootResolved = path.resolve(root);
  return norm === rootResolved || norm.startsWith(rootResolved + path.sep);
}

/**
 * Paths we allow the webview to reveal in the OS file manager (no arbitrary paths).
 */
export function isRevealPathAllowed(
  context: vscode.ExtensionContext,
  resolvedPath: string
): boolean {
  const gs = context.globalStorageUri.fsPath;
  const norm = path.resolve(resolvedPath);
  const gsResolved = path.resolve(gs);
  if (norm === gsResolved || norm.startsWith(gsResolved + path.sep)) {
    return true;
  }
  const ext = path.resolve(context.extensionPath);
  if (norm === ext || norm.startsWith(ext + path.sep)) {
    return true;
  }
  return false;
}
