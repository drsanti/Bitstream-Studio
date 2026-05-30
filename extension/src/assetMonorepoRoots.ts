/**
 * Monorepo asset roots when `t3d-extension` lives next to `ternion-t3d/assets/`.
 * Node-only (fs). Used by the model-downloader bridge and `syncTernionFreeAssets`.
 *
 * Layout goal: **same pack layout as production** under `globalStorage/.../assets/` — **`free/`**
 * (`models/`, `textures/`, …) and **`tesaiot/`** (`models/`, `textures/`, …).
 *
 * @see `docs/ASSET_LAYOUT_DEV_PROD.md`
 */

import * as fs from "node:fs";
import * as path from "node:path";

function readPackageName(pkgPath: string): string | undefined {
  try {
    if (!fs.existsSync(pkgPath)) {
      return undefined;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { name?: string };
    return typeof pkg.name === "string" ? pkg.name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * `ternion-t3d` root when cwd is `t3d-extension` or the monorepo root containing `t3d-extension/`.
 */
export function resolveMonorepoRootFromProcessCwd(): string | null {
  const cwd = process.cwd();
  if (readPackageName(path.join(cwd, "package.json")) === "bitstream-studio") {
    return path.resolve(cwd, "..");
  }
  if (readPackageName(path.join(cwd, "t3d-extension", "package.json")) === "bitstream-studio") {
    return path.resolve(cwd);
  }
  return null;
}

/** `.../ternion-t3d/assets` when present (directory). */
export function resolveMonorepoAssetsDir(): string | null {
  const monoRoot = resolveMonorepoRootFromProcessCwd();
  if (monoRoot == null) {
    return null;
  }
  const assetsDir = path.join(monoRoot, "assets");
  try {
    if (fs.existsSync(assetsDir) && fs.statSync(assetsDir).isDirectory()) {
      return path.resolve(assetsDir);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** `.../ternion-t3d/assets/free` — same role as `globalStorage/.../assets/free`. */
export function resolveMonorepoFreePackRoot(): string | null {
  const assetsDir = resolveMonorepoAssetsDir();
  if (assetsDir == null) {
    return null;
  }
  return path.resolve(path.join(assetsDir, "free"));
}

/** `.../ternion-t3d/assets/tesaiot/models` — same role as production Model Loader root. */
export function resolveMonorepoTesaiotModelsRoot(): string | null {
  const assetsDir = resolveMonorepoAssetsDir();
  if (assetsDir == null) {
    return null;
  }
  return path.resolve(path.join(assetsDir, "tesaiot", "models"));
}

/** `.../ternion-t3d/assets/tesaiot/textures` — parallel to `free/textures/`. */
export function resolveMonorepoTesaiotTexturesRoot(): string | null {
  const assetsDir = resolveMonorepoAssetsDir();
  if (assetsDir == null) {
    return null;
  }
  return path.resolve(path.join(assetsDir, "tesaiot", "textures"));
}
