import * as fs from "node:fs";
import * as path from "node:path";
import { BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS } from "./bootstrapRequiredAssets.js";
import { checkFreePackMirrorComplete } from "./checkFreePackMirrorComplete.js";
import { probeAssetDownloadConnectivity } from "./probeAssetDownloadConnectivity.js";

export type BootstrapAssetDiskRow = {
  packRelative: string;
  existsInFree: boolean;
  existsInLocal: boolean;
};

export type BootstrapAssetDiskCheckResult = {
  freeRootFs: string;
  localRootFs: string;
  rows: BootstrapAssetDiskRow[];
  /** True when the full GitHub free pack mirror is present under `freeRootFs`. */
  allPresentOnDisk: boolean;
  internetReachable: boolean;
  internetProbeUrl: string;
  freePackRemoteFileCount: number;
  freePackLocalFileCount: number;
  freePackMissingSample: string[];
  freePackIndexUnavailable: boolean;
};

function fileExists(filePath: string): boolean {
  try {
    const st = fs.statSync(filePath);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

/** VSIX ships cubemaps under `assets/free/textures/...` as well as `assets/textures/...`. */
function localCandidateFsPaths(localRootFs: string, packRelative: string): string[] {
  const rel = packRelative.replace(/^\//, "");
  return [
    path.join(localRootFs, rel),
    path.join(localRootFs, "free", rel),
  ];
}

export async function checkBootstrapAssetsOnDisk(options: {
  freeRootFs: string;
  localRootFs: string;
  onlineAssetsBaseUrl?: string;
  /** Defaults to {@link BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS}. */
  packRelativePaths?: readonly string[];
  /** After a successful full-pack sync, host stores this for fast recheck without GitHub. */
  syncedFileCountExpected?: number;
}): Promise<BootstrapAssetDiskCheckResult> {
  const packPaths = options.packRelativePaths ?? BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS;
  const freeRootFs = path.resolve(options.freeRootFs);
  const localRootFs = path.resolve(options.localRootFs);

  const rows: BootstrapAssetDiskRow[] = packPaths.map((packRelative) => {
    const rel = packRelative.replace(/^\//, "");
    const freePath = path.join(freeRootFs, rel);
    const existsInFree = fileExists(freePath);
    const existsInLocal = localCandidateFsPaths(localRootFs, rel).some(fileExists);
    return { packRelative: rel, existsInFree, existsInLocal };
  });

  const internet = await probeAssetDownloadConnectivity({
    onlineAssetsBaseUrl: options.onlineAssetsBaseUrl,
  });

  const freePack = await checkFreePackMirrorComplete({
    freeRootFs,
    syncedFileCountExpected: options.syncedFileCountExpected,
    skipRemoteIndex: !internet.reachable,
  });

  return {
    freeRootFs,
    localRootFs,
    rows,
    allPresentOnDisk: freePack.complete,
    internetReachable: internet.reachable,
    internetProbeUrl: internet.probeUrl,
    freePackRemoteFileCount: freePack.remoteFileCount,
    freePackLocalFileCount: freePack.localFileCount,
    freePackMissingSample: freePack.missingPackPaths,
    freePackIndexUnavailable: freePack.indexUnavailable,
  };
}
