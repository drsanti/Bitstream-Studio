/**
 * Build the free-pack file list from public raw.githubusercontent.com manifests only.
 * Used when the GitHub REST API is rate-limited (no GITHUB_TOKEN required for end users).
 *
 * @see extension/docs/ASSETS_ONLINE_REPO.md
 */

import {
  TERNION_FREE_ASSETS_OWNER,
  TERNION_FREE_ASSETS_REF,
  TERNION_FREE_ASSETS_REPO,
  type TernionFreeAssetIndexEntry,
} from "./syncTernionFreeAssets";
import { STUDIO_FREE_PACK_MODEL_FOLDER_IDS } from "./studioFreePackCatalog";
import {
  repoPathsFromVisionMediapipeManifest,
  type VisionMediapipePackManifestV1,
} from "./visionMediapipeFreePack";

const CUBEMAP_FACE_NAMES = ["posx", "negx", "posy", "negy", "posz", "negz"] as const;

export type RawManifestIndexOptions = {
  owner?: string;
  repo?: string;
  ref?: string;
};

function rawAssetsBase(options: RawManifestIndexOptions): string {
  const owner = options.owner ?? TERNION_FREE_ASSETS_OWNER;
  const repo = options.repo ?? TERNION_FREE_ASSETS_REPO;
  const ref = options.ref ?? TERNION_FREE_ASSETS_REF;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/assets`;
}

async function rawFetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`GET ${url} → HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

function normalizeToRepoPath(relativeInsideAssets: string): string {
  const rel = relativeInsideAssets.replace(/\\/g, "/").replace(/^\/+/, "");
  return rel.startsWith("assets/") ? rel : `assets/${rel}`;
}

function normalizePackRelativePath(file: string): string {
  const t = file.trim().replace(/\\/g, "/");
  if (t.startsWith("/assets/")) {
    return t.slice("/assets/".length);
  }
  if (t.startsWith("assets/")) {
    return t.slice("assets/".length);
  }
  return t.replace(/^\/+/, "");
}

function pushUnique(paths: Set<string>, relativeInsideAssets: string): void {
  paths.add(normalizeToRepoPath(relativeInsideAssets));
}

/**
 * Discover `assets/...` blob paths by reading published manifest JSON over raw GitHub URLs.
 */
export async function listFreeAssetRepoPathsViaRawManifests(
  options: RawManifestIndexOptions = {},
): Promise<string[]> {
  const base = rawAssetsBase(options);
  const paths = new Set<string>();

  pushUnique(paths, "feed.json");
  pushUnique(paths, "studio-asset-manifest.v1.json");
  pushUnique(paths, "feeds/registry.json");

  try {
    const registry = await rawFetchJson<{ feeds?: Array<{ id?: string }> }>(
      `${base}/feeds/registry.json`,
    );
    for (const feed of registry.feeds ?? []) {
      const id = feed.id?.trim();
      if (id) {
        pushUnique(paths, `feeds/${id}.feed.json`);
      }
    }
  } catch {
    pushUnique(paths, "feeds/ternion-official.feed.json");
  }

  const modelIds = STUDIO_FREE_PACK_MODEL_FOLDER_IDS;
  for (const id of modelIds) {
    const folder = String(id).trim();
    if (folder.length > 0) {
      pushUnique(paths, `models/${folder}/${folder}.glb`);
    }
  }

  const cubemapIds = await rawFetchJson<string[]>(`${base}/textures/cubemap/manifest.json`);
  if (!Array.isArray(cubemapIds)) {
    throw new Error("textures/cubemap/manifest.json must be a string array");
  }
  for (const setId of cubemapIds) {
    const dir = String(setId).trim();
    if (dir.length === 0) {
      continue;
    }
    for (const face of CUBEMAP_FACE_NAMES) {
      pushUnique(paths, `textures/cubemap/${dir}/${face}.jpg`);
    }
  }

  const hdriList = await rawFetchJson<Array<{ file?: string }>>(
    `${base}/textures/hdri/manifest.json`,
  );
  if (!Array.isArray(hdriList)) {
    throw new Error("textures/hdri/manifest.json must be an array");
  }
  for (const entry of hdriList) {
    const file = entry.file?.trim();
    if (file) {
      pushUnique(paths, normalizePackRelativePath(file));
    }
  }

  const imagesRoot = await rawFetchJson<{ entries?: Array<{ file?: string }> }>(
    `${base}/textures/images/manifest.json`,
  );
  const imageEntries = Array.isArray(imagesRoot?.entries) ? imagesRoot.entries : [];
  for (const entry of imageEntries) {
    const file = entry.file?.trim();
    if (file) {
      pushUnique(paths, `textures/images/${file.replace(/^\/+/, "")}`);
    }
  }

  const nodeGraphIndex = await rawFetchJson<{ entries?: Array<{ file?: string }> }>(
    `${base}/libraries/node-graph/index.json`,
  );
  pushUnique(paths, "libraries/node-graph/index.json");
  for (const entry of nodeGraphIndex.entries ?? []) {
    const file = entry.file?.trim();
    if (file) {
      pushUnique(paths, `libraries/node-graph/${file.replace(/^\/+/, "")}`);
    }
  }

  const flowPresetIndex = await rawFetchJson<{ entries?: Array<{ file?: string }> }>(
    `${base}/libraries/flow-preset/index.json`,
  );
  pushUnique(paths, "libraries/flow-preset/index.json");
  for (const entry of flowPresetIndex.entries ?? []) {
    const file = entry.file?.trim();
    if (file) {
      pushUnique(paths, `libraries/flow-preset/${file.replace(/^\/+/, "")}`);
    }
  }

  try {
    const visionManifest = await rawFetchJson<VisionMediapipePackManifestV1>(
      `${base}/vision/mediapipe/manifest.v1.json`,
    );
    for (const repoPath of repoPathsFromVisionMediapipeManifest(visionManifest)) {
      paths.add(repoPath);
    }
  } catch {
    // Vision pack not published yet — skip (full GitHub tree sync still picks up assets/vision/**).
  }

  return [...paths].sort((a, b) => a.localeCompare(b));
}

export async function getTernionFreeAssetsIndexViaRawManifests(
  options: RawManifestIndexOptions = {},
): Promise<TernionFreeAssetIndexEntry[]> {
  const repoPaths = await listFreeAssetRepoPathsViaRawManifests(options);
  return repoPaths.map((repoPath) => ({
    repoPath,
    relativePath: repoPath.slice("assets/".length),
    sizeBytes: null,
  }));
}

export function isGitHubApiRateLimitError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("rate limit") || m.includes("api rate limit exceeded");
}
