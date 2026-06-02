import * as fs from "node:fs";
import * as path from "node:path";
import { listFreeLocalAssetFiles } from "../asset-sync/listFreeLocalAssetFiles.js";
import { getTernionFreeAssetsIndex } from "../asset-sync/syncTernionFreeAssets.js";
import { resolveGithubTokenForAssetSync } from "../githubTokenForAssetSync.js";

const MAX_MISSING_SAMPLE = 32;

export type FreePackMirrorCheckResult = {
  complete: boolean;
  remoteFileCount: number;
  localFileCount: number;
  missingPackPaths: string[];
  /** True when GitHub index could not be fetched (offline / rate limit). */
  indexUnavailable: boolean;
};

function fileExistsNonEmpty(filePath: string): boolean {
  try {
    const st = fs.statSync(filePath);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

/**
 * Verifies the free-pack mirror under `freeRootFs` contains every file from the GitHub `assets/` tree.
 * When `syncedFileCountExpected` matches `localFileCount`, skips GitHub listing (fast path after sync).
 */
export async function checkFreePackMirrorComplete(options: {
  freeRootFs: string;
  syncedFileCountExpected?: number;
  skipRemoteIndex?: boolean;
}): Promise<FreePackMirrorCheckResult> {
  const freeRootFs = path.resolve(options.freeRootFs);
  const localRows = await listFreeLocalAssetFiles(freeRootFs);
  const localFileCount = localRows.length;
  const expected = options.syncedFileCountExpected ?? 0;

  if (expected > 0 && localFileCount >= expected) {
    return {
      complete: true,
      remoteFileCount: expected,
      localFileCount,
      missingPackPaths: [],
      indexUnavailable: false,
    };
  }

  if (options.skipRemoteIndex) {
    return {
      complete: false,
      remoteFileCount: expected,
      localFileCount,
      missingPackPaths: [],
      indexUnavailable: true,
    };
  }

  let index;
  try {
    index = await getTernionFreeAssetsIndex({
      githubToken: resolveGithubTokenForAssetSync(),
    });
  } catch {
    return {
      complete: expected > 0 && localFileCount >= expected,
      remoteFileCount: expected,
      localFileCount,
      missingPackPaths: [],
      indexUnavailable: true,
    };
  }

  const localByRel = new Map(localRows.map((r) => [r.relativePath, r.sizeBytes]));
  const missingPackPaths: string[] = [];

  for (const entry of index) {
    const rel = entry.relativePath.replace(/^\//, "");
    const localSize = localByRel.get(rel);
    const diskPath = path.join(freeRootFs, rel);
    const ok =
      (typeof localSize === "number" && localSize > 0) || fileExistsNonEmpty(diskPath);
    if (!ok) {
      missingPackPaths.push(rel);
    }
  }

  const remoteFileCount = index.length;
  const complete = missingPackPaths.length === 0 && remoteFileCount > 0;

  return {
    complete,
    remoteFileCount,
    localFileCount,
    missingPackPaths: missingPackPaths.slice(0, MAX_MISSING_SAMPLE),
    indexUnavailable: false,
  };
}
