/**
 * CLI: download the TERNION free asset pack from GitHub into extension globalStorage.
 *
 * Same engine as Free Loader / model-downloader bridge (`syncTernionFreeAssets`).
 * Destination default: `…/globalStorage/terniondev.bitstream-studio/assets/free`
 *
 * Usage (from extension/):
 *   npm run sync:free-pack-storage
 *   npm run sync:free-pack-storage -- --list
 *   npm run sync:free-pack-storage -- --paths assets/models/psoc-e84-ai/psoc-e84-ai.glb
 *   GITHUB_TOKEN=ghp_xxx npm run sync:free-pack-storage
 *
 * Options:
 *   --output <dir>       Override destination (must be or end with the free-pack root)
 *   --list               List remote catalog only (no download)
 *   --paths <a> [b…]     Download only these repo paths (each must start with `assets/`)
 *   --concurrency <n>    Parallel downloads (default 6)
 *   --help               Show usage
 *
 * Env:
 *   GITHUB_TOKEN         Optional — raises GitHub API rate limit for listing
 *   TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR — override when --output is omitted
 */

import * as path from "node:path";
import {
  resolveExtensionGlobalStorageFreePackRoot,
  resolveFreePackMirrorRootFromAssetsRoot,
} from "../../extensionGlobalStoragePaths";
import { formatFreePackBytes } from "../diagnoseFreePackStorageReport";
import {
  getTernionFreeAssetsIndex,
  syncTernionFreeAssets,
  type SyncTernionFreeAssetsProgress,
} from "../syncTernionFreeAssets";
import { listFreeLocalAssetFiles } from "../listFreeLocalAssetFiles";

function printUsage(): void {
  console.log(`Download ternion-3d-assets-free into globalStorage (assets/free).

Usage:
  npm run sync:free-pack-storage
  npm run sync:free-pack-storage -- --list
  npm run sync:free-pack-storage -- --paths assets/models/foo/foo.glb

Options:
  --output <dir>       Destination free-pack folder
  --list               Remote index only
  --paths <paths…>     Partial sync (repo paths under assets/)
  --concurrency <n>    Parallel downloads (default 6)
  --help               This help

Env: GITHUB_TOKEN, TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR
`);
}

function readFlagValue(argv: string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  if (i < 0 || i + 1 >= argv.length) {
    return undefined;
  }
  return argv[i + 1];
}

function readFlagNumber(argv: string[], flag: string, fallback: number): number {
  const raw = readFlagValue(argv, flag);
  if (raw == null) {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function readPathsAfterFlag(argv: string[]): string[] {
  const i = argv.indexOf("--paths");
  if (i < 0) {
    return [];
  }
  const out: string[] = [];
  for (let j = i + 1; j < argv.length; j++) {
    const arg = argv[j];
    if (arg.startsWith("--")) {
      break;
    }
    out.push(arg.replace(/\\/g, "/"));
  }
  return out;
}

function resolveSyncOutputRoot(argv: string[]): string {
  const fromFlag = readFlagValue(argv, "--output")?.trim();
  if (fromFlag) {
    return path.resolve(resolveFreePackMirrorRootFromAssetsRoot(fromFlag));
  }
  const fromEnv = process.env.TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR?.trim();
  if (fromEnv) {
    return path.resolve(resolveFreePackMirrorRootFromAssetsRoot(fromEnv));
  }
  const globalFree = resolveExtensionGlobalStorageFreePackRoot();
  if (globalFree != null) {
    return path.resolve(globalFree);
  }
  throw new Error(
    "Could not resolve globalStorage free-pack folder. Open Bitstream Studio once in Cursor/VS Code, or pass --output <absolute-path>.",
  );
}

let lastProgressLine = "";

function printProgress(p: SyncTernionFreeAssetsProgress): void {
  if (p.phase === "error") {
    return;
  }
  const parts: string[] = [`[${p.phase}]`, `${p.percent}%`];
  if (p.fileIndex != null && p.totalFiles != null && p.totalFiles > 0) {
    parts.push(`${p.fileIndex}/${p.totalFiles}`);
  }
  if (p.currentPath?.trim()) {
    parts.push(p.currentPath.trim());
  }
  const line = parts.join(" ");
  if (line === lastProgressLine) {
    return;
  }
  lastProgressLine = line;
  process.stdout.write(`\r${line.padEnd(80)}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    return;
  }

  const listOnly = argv.includes("--list");
  const onlyRepoPaths = readPathsAfterFlag(argv);
  const concurrency = readFlagNumber(argv, "--concurrency", 6);
  const outputRootDir = resolveSyncOutputRoot(argv);
  const githubToken = process.env.GITHUB_TOKEN?.trim();

  console.log("=== TERNION free pack → globalStorage sync ===\n");
  console.log(`Destination: ${outputRootDir}`);
  if (githubToken) {
    console.log("GitHub token: set (higher API rate limit for listing)");
  } else {
    console.log(
      "GitHub token: not set — listing uses public manifests if the API is rate-limited",
    );
  }
  console.log("");

  const onListingFallback = (message: string): void => {
    console.log(`Note: ${message}\n`);
  };

  if (listOnly) {
    const index = await getTernionFreeAssetsIndex({ githubToken, onListingFallback });
    console.log(`Remote files under assets/: ${index.length}`);
    const totalBytes = index.reduce((sum, e) => sum + (e.sizeBytes ?? 0), 0);
    console.log(`Approx. total size: ${formatFreePackBytes(totalBytes)}`);
    const preview = index.slice(0, 12);
    if (preview.length > 0) {
      console.log("\nSample paths:");
      for (const row of preview) {
        const size =
          row.sizeBytes != null ? formatFreePackBytes(row.sizeBytes) : "unknown size";
        console.log(`  - ${row.relativePath} (${size})`);
      }
      if (index.length > preview.length) {
        console.log(`  … and ${index.length - preview.length} more`);
      }
    }
    return;
  }

  const result = await syncTernionFreeAssets({
    outputRootDir,
    githubToken,
    concurrency,
    onlyRepoPaths: onlyRepoPaths.length > 0 ? onlyRepoPaths : undefined,
    onListingFallback,
    onProgress: printProgress,
  });

  process.stdout.write("\n\n");
  console.log(`Downloaded: ${result.downloaded} file(s)`);
  console.log(`Total bytes: ${formatFreePackBytes(result.totalBytes)}`);
  console.log(`Output: ${result.outputRootDir}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    for (const err of result.errors.slice(0, 20)) {
      console.log(`  - ${err}`);
    }
    if (result.errors.length > 20) {
      console.log(`  … and ${result.errors.length - 20} more`);
    }
    process.exitCode = 1;
  }

  const localRows = await listFreeLocalAssetFiles(outputRootDir);
  console.log(`\nOn disk now: ${localRows.length} file(s) under free-pack root.`);

  if (result.errors.length > 0 && localRows.length > 0 && result.downloaded === 0) {
    console.log(
      "Local folder already has files — sync may have failed only at GitHub API listing; retry after the fallback update or wait for rate limit reset.",
    );
  }

  if (result.downloaded === 0 && result.errors.length === 0 && onlyRepoPaths.length === 0) {
    console.log("Nothing downloaded — remote tree may be empty or listing failed silently.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
