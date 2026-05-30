/**
 * Download all blobs under `assets/` from drsanti/ternion-3d-assets-free (GitHub)
 * into a local directory (monorepo **ternion-t3d/assets/free** or **TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR**).
 * Node-only; safe path join (rejects `..` segments).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { resolveStandaloneBridgeFreePackOutputDir } from "../standaloneBridgeAssetLayout";

export const TERNION_FREE_ASSETS_OWNER = "drsanti";
export const TERNION_FREE_ASSETS_REPO = "ternion-3d-assets-free";
export const TERNION_FREE_ASSETS_REF = "main";

const GITHUB_API = "https://api.github.com";

export interface GitHubTreeEntry {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}

export interface SyncTernionFreeAssetsProgress {
  phase: "listing" | "downloading" | "done" | "error";
  percent: number;
  currentPath?: string;
  fileIndex?: number;
  totalFiles?: number;
}

export interface SyncTernionFreeAssetsOptions {
  /** Absolute path; files are written as `<outputRootDir>/<path relative to repo assets/>` */
  outputRootDir: string;
  owner?: string;
  repo?: string;
  ref?: string;
  /** Optional: higher GitHub API rate limit */
  githubToken?: string;
  /** Parallel downloads (default 6) */
  concurrency?: number;
  onProgress?: (p: SyncTernionFreeAssetsProgress) => void;
  /**
   * If set, download only these repo paths (must each match `assets/...` and appear in the tree).
   */
  onlyRepoPaths?: string[];
}

/** One row in the free-pack index (GitHub tree blobs under `assets/`). */
export interface TernionFreeAssetIndexEntry {
  repoPath: string;
  /** Path under repo `assets/` (no `assets/` prefix), posix slashes */
  relativePath: string;
  sizeBytes: number | null;
}

export interface SyncTernionFreeAssetsResult {
  downloaded: number;
  totalBytes: number;
  errors: string[];
  outputRootDir: string;
}

function githubHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ternion-t3d-extension-asset-sync",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token?.trim()) {
    h.Authorization = `Bearer ${token.trim()}`;
  }
  return h;
}

function httpsGetJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(
            new Error(`GitHub API ${res.statusCode}: ${body.slice(0, 500)}`)
          );
          return;
        }
        try {
          resolve(JSON.parse(body) as T);
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(120_000, () => {
      req.destroy();
      reject(new Error("GitHub API request timeout"));
    });
  });
}

async function httpsDownloadToFile(
  url: string,
  destPath: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      void (async () => {
        try {
          if (res.statusCode === 302 || res.statusCode === 301) {
            const loc = res.headers.location;
            res.resume();
            if (!loc) {
              reject(new Error("Redirect without Location"));
              return;
            }
            const nextUrl = new URL(loc, url).href;
            const size = await httpsDownloadToFile(nextUrl, destPath);
            resolve(size);
            return;
          }
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            res.resume();
            try {
              await fs.promises.unlink(destPath);
            } catch {
              /* ignore */
            }
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }
          const file = createWriteStream(destPath);
          await pipeline(res, file);
          const st = await fs.promises.stat(destPath);
          resolve(st.size);
        } catch (e) {
          try {
            await fs.promises.unlink(destPath);
          } catch {
            /* ignore */
          }
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      })().catch(reject);
    });
    req.on("error", (err) => {
      void fs.promises.unlink(destPath).catch(() => {});
      reject(err);
    });
    req.setTimeout(300_000, () => {
      req.destroy();
      void fs.promises.unlink(destPath).catch(() => {});
      reject(new Error("Download timeout"));
    });
  });
}

/** Reject paths that escape output root via `..` or absolute segments. */
export function safeJoinOutputRoot(
  outputRootDir: string,
  relativePath: string
): string {
  const normalized = path.normalize(relativePath).replace(/^[/\\]+/, "");
  const segments = normalized.split(/[/\\]/).filter(Boolean);
  if (segments.some((s) => s === "..")) {
    throw new Error(`Unsafe path: ${relativePath}`);
  }
  const full = path.join(outputRootDir, ...segments);
  const resolvedRoot = path.resolve(outputRootDir);
  const resolvedFull = path.resolve(full);
  if (!resolvedFull.startsWith(resolvedRoot + path.sep) && resolvedFull !== resolvedRoot) {
    throw new Error(`Path escapes output root: ${relativePath}`);
  }
  return resolvedFull;
}

async function fetchAssetsTreeBlobs(
  owner: string,
  repo: string,
  ref: string,
  token?: string
): Promise<GitHubTreeEntry[]> {
  const headers = githubHeaders(token);
  type RefObj = { object?: { sha?: string } };
  const refUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${ref}`;
  const refData = await httpsGetJson<RefObj>(refUrl, headers);
  const commitSha = refData.object?.sha;
  if (!commitSha) {
    throw new Error(`Could not resolve ref heads/${ref}`);
  }
  type CommitObj = { tree?: { sha?: string } };
  const commitUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/commits/${commitSha}`;
  const commitData = await httpsGetJson<CommitObj>(commitUrl, headers);
  const treeSha = commitData.tree?.sha;
  if (!treeSha) {
    throw new Error("Could not read commit tree");
  }
  const treeUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;
  type TreeResp = { tree?: GitHubTreeEntry[]; truncated?: boolean };
  const treeData = await httpsGetJson<TreeResp>(treeUrl, headers);
  if (treeData.truncated) {
    throw new Error(
      "GitHub tree response truncated; use a manifest or smaller repo scope"
    );
  }
  const out: GitHubTreeEntry[] = [];
  for (const entry of treeData.tree ?? []) {
    if (entry.type === "blob" && entry.path?.startsWith("assets/")) {
      out.push(entry);
    }
  }
  out.sort((a, b) => (a.path ?? "").localeCompare(b.path ?? ""));
  return out;
}

async function listAssetBlobPaths(
  owner: string,
  repo: string,
  ref: string,
  token?: string
): Promise<string[]> {
  const blobs = await fetchAssetsTreeBlobs(owner, repo, ref, token);
  return blobs.map((e) => e.path!).filter(Boolean);
}

/**
 * List all GitHub blobs under `assets/` with sizes (from tree API).
 */
export async function getTernionFreeAssetsIndex(options?: {
  owner?: string;
  repo?: string;
  ref?: string;
  githubToken?: string;
}): Promise<TernionFreeAssetIndexEntry[]> {
  const owner = options?.owner ?? TERNION_FREE_ASSETS_OWNER;
  const repo = options?.repo ?? TERNION_FREE_ASSETS_REPO;
  const ref = options?.ref ?? TERNION_FREE_ASSETS_REF;
  const token = options?.githubToken ?? process.env.GITHUB_TOKEN;
  const blobs = await fetchAssetsTreeBlobs(owner, repo, ref, token);
  return blobs.map((e) => {
    const repoPath = e.path!;
    const relativePath = repoPath.slice("assets/".length);
    const size =
      typeof e.size === "number" && Number.isFinite(e.size) ? e.size : null;
    return {
      repoPath,
      relativePath,
      sizeBytes: size,
    };
  });
}

function rawUrl(
  owner: string,
  repo: string,
  ref: string,
  repoPath: string
): string {
  const enc = repoPath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${enc}`;
}

/**
 * Sync all files from GitHub `assets/` tree into `outputRootDir`
 * (mirror of `models/`, `textures/`, etc. without the leading `assets/` segment).
 */
export async function syncTernionFreeAssets(
  options: SyncTernionFreeAssetsOptions
): Promise<SyncTernionFreeAssetsResult> {
  const owner = options.owner ?? TERNION_FREE_ASSETS_OWNER;
  const repo = options.repo ?? TERNION_FREE_ASSETS_REPO;
  const ref = options.ref ?? TERNION_FREE_ASSETS_REF;
  const token = options.githubToken ?? process.env.GITHUB_TOKEN;
  const concurrency = Math.max(1, options.concurrency ?? 6);
  const outputRootDir = path.resolve(options.outputRootDir);
  const onProgress = options.onProgress;

  const errors: string[] = [];
  let totalBytes = 0;
  let downloaded = 0;

  onProgress?.({
    phase: "listing",
    percent: 0,
    fileIndex: 0,
    totalFiles: 0,
  });

  let blobPaths: string[];
  try {
    blobPaths = await listAssetBlobPaths(owner, repo, ref, token);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    onProgress?.({
      phase: "error",
      percent: 0,
    });
    return {
      downloaded: 0,
      totalBytes: 0,
      errors: [msg],
      outputRootDir,
    };
  }

  if (options.onlyRepoPaths && options.onlyRepoPaths.length > 0) {
    const allowed = new Set(blobPaths);
    const filtered: string[] = [];
    for (const p of options.onlyRepoPaths) {
      const norm = p.replace(/\\/g, "/").replace(/^\/+/, "");
      if (!norm.startsWith("assets/")) {
        errors.push(`Invalid path (must start with assets/): ${p}`);
        continue;
      }
      if (!allowed.has(norm)) {
        errors.push(`Path not in tree: ${norm}`);
        continue;
      }
      filtered.push(norm);
    }
    blobPaths = filtered;
  }

  const totalFiles = blobPaths.length;
  onProgress?.({
    phase: "listing",
    percent: 5,
    totalFiles,
    fileIndex: 0,
  });

  fs.mkdirSync(outputRootDir, { recursive: true });

  let completed = 0;
  for (let offset = 0; offset < blobPaths.length; offset += concurrency) {
    const batch = blobPaths.slice(offset, offset + concurrency);
    await Promise.all(
      batch.map(async (repoPath) => {
        const relativeInsideAssets = repoPath.slice("assets/".length);
        const destPath = safeJoinOutputRoot(outputRootDir, relativeInsideAssets);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        const url = rawUrl(owner, repo, ref, repoPath);
        try {
          const bytes = await httpsDownloadToFile(url, destPath);
          totalBytes += bytes;
          downloaded += 1;
          completed += 1;
          const pct =
            totalFiles > 0
              ? 5 + Math.floor((95 * completed) / totalFiles)
              : 100;
          onProgress?.({
            phase: "downloading",
            percent: Math.min(pct, 99),
            currentPath: relativeInsideAssets,
            fileIndex: completed,
            totalFiles,
          });
        } catch (e) {
          const msg = `${repoPath}: ${e instanceof Error ? e.message : String(e)}`;
          errors.push(msg);
        }
      })
    );
  }

  onProgress?.({
    phase: "done",
    percent: 100,
    totalFiles,
    fileIndex: totalFiles,
  });

  return {
    downloaded,
    totalBytes,
    errors,
    outputRootDir,
  };
}

/**
 * Default output directory when the model-downloader bridge runs (browser dev / standalone).
 *
 * Delegates to **`resolveStandaloneBridgeFreePackOutputDir`** (no `t3d-extension/src/assets` fallback).
 */
export function resolveDefaultBridgeFreeAssetsOutputDir(): string {
  return resolveStandaloneBridgeFreePackOutputDir();
}
