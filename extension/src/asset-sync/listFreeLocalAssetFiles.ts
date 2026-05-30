import * as fs from "node:fs/promises";
import * as fssync from "node:fs";
import * as path from "node:path";
import { resolveDefaultBridgeFreeAssetsOutputDir } from "./syncTernionFreeAssets";

export interface FreeLocalAssetFileRow {
  /** Path relative to the scanned root (posix slashes). */
  relativePath: string;
  sizeBytes: number;
  modifiedAtMs: number;
}

const MAX_FILES = 20_000;
const MAX_DEPTH = 50;

const SKIP_DIR_NAMES = new Set([".git", ".svn", "node_modules", ".DS_Store"]);

/**
 * Recursively list files under `rootDir` (absolute). Empty array if missing / not a directory.
 */
export async function listFreeLocalAssetFiles(rootDir: string): Promise<FreeLocalAssetFileRow[]> {
  const root = path.resolve(rootDir);
  if (!fssync.existsSync(root)) {
    return [];
  }
  let st: fssync.Stats;
  try {
    st = await fs.stat(root);
  } catch {
    return [];
  }
  if (!st.isDirectory()) {
    return [];
  }

  const out: FreeLocalAssetFileRow[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH || out.length >= MAX_FILES) {
      return;
    }
    let entries: fssync.Dirent<string>[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true, encoding: "utf8" });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (out.length >= MAX_FILES) {
        return;
      }
      const name = ent.name;
      if (SKIP_DIR_NAMES.has(name)) {
        continue;
      }
      const full = path.join(dir, name);
      const rel = path.relative(root, full);
      if (ent.isDirectory()) {
        await walk(full, depth + 1);
      } else if (ent.isFile()) {
        try {
          const fst = await fs.stat(full);
          out.push({
            relativePath: rel.split(path.sep).join("/"),
            sizeBytes: fst.size,
            modifiedAtMs: fst.mtimeMs,
          });
        } catch {
          /* ignore unreadable file */
        }
      }
    }
  }

  await walk(root, 0);
  out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return out;
}

/**
 * Dev bridge: list the free-pack mirror root derived from **`resolveDefaultBridgeFreeAssetsOutputDir`**
 * (monorepo **assets/free**, env override, or host-injected assets root).
 */
export function resolveBridgeFreeLocalPackRootDir(): string {
  return path.resolve(resolveDefaultBridgeFreeAssetsOutputDir());
}
