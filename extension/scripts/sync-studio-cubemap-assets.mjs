/**
 * Downloads Sensor Studio cubemap JPEGs from `ternion-3d-assets-free` into `src/assets/`, so
 * Vite / Asset Browser previews resolve without 404s.
 *
 * **Modes**
 * - **Default:** paths implied by bundled `studio-asset-manifest.v1.json` (fast).
 * - **`--discover-all`:** list `assets/textures/cubemap/*` via GitHub REST API (same idea as
 *   `node-animator/scripts/download-assets.ts`) and download every cubemap set found there.
 *
 * **Private repos / SSH:** Automated runs here may not have your GitHub SSH key (`Permission denied
 * (publickey)`). On your PC, use **Git Bash** (or any shell where `git@github.com:drsanti/...`
 * works), clone the private repo, and compare `scripts/download-assets.ts`. Targets for *this*
 * script are always the **public** `ternion-3d-assets-free` tree (HTTPS raw + API).
 *
 * **API rate limits:** Unauthenticated GitHub API is ~60 req/hour per IP. Set `GITHUB_TOKEN`
 * (no special scope needed for public repo) for a higher limit when using `--discover-all`.
 *
 * Default raw root (no trailing slash):
 *   https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets
 *
 * See `extension/docs/ASSETS_ONLINE_REPO.md`.
 *
 * Usage:
 *   npm run sync:studio-cubemap-assets
 *   npm run sync:studio-cubemap-assets -- --discover-all
 *   npm run sync:studio-cubemap-assets -- --dry-run
 *   npm run sync:studio-cubemap-assets -- --force
 *
 * Env:
 *   STUDIO_ASSETS_RAW_BASE — override raw base (ends with `/assets`).
 *   GITHUB_FREE_ASSETS_OWNER / GITHUB_FREE_ASSETS_REPO / GITHUB_FREE_ASSETS_BRANCH
 *   GITHUB_TOKEN — optional; used for Contents API when `--discover-all` is set.
 */
import { readFileSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(
  ROOT,
  "src/webview/assets-manager/registry/studio-asset-manifest.v1.json",
);

const CUBEMAP_FACES = ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"];

function githubRepo() {
  return {
    owner: process.env.GITHUB_FREE_ASSETS_OWNER?.trim() || "drsanti",
    repo: process.env.GITHUB_FREE_ASSETS_REPO?.trim() || "ternion-3d-assets-free",
    branch: process.env.GITHUB_FREE_ASSETS_BRANCH?.trim() || "main",
  };
}

function rawBaseFromGithubEnv() {
  const { owner, repo, branch } = githubRepo();
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/assets`;
}

const REMOTE_BASE = (process.env.STUDIO_ASSETS_RAW_BASE?.trim() || rawBaseFromGithubEnv()).replace(/\/+$/, "");
const LOCAL_ASSETS_ROOT = join(ROOT, "src/assets");

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const FORCE = args.has("--force");
const DISCOVER_ALL = args.has("--discover-all");

function joinUrl(base, rel) {
  const r = rel.replace(/^\//, "");
  return `${base}/${r}`;
}

function githubApiHeaders() {
  /** @type {Record<string, string>} */
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const tok = process.env.GITHUB_TOKEN?.trim();
  if (tok) {
    h.Authorization = `Bearer ${tok}`;
  }
  return h;
}

/**
 * @returns {Promise<string[]>}
 */
async function listCubemapDirsFromGithubApi() {
  const { owner, repo, branch } = githubRepo();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/assets/textures/cubemap?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: githubApiHeaders() });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `GitHub API GET contents assets/textures/cubemap -> ${res.status} ${text.slice(0, 400)}`,
    );
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("GitHub API returned non-JSON for cubemap listing");
  }
  if (!Array.isArray(data)) {
    throw new Error("GitHub API cubemap listing: expected array");
  }
  return data.filter((item) => item && item.type === "dir" && typeof item.name === "string").map((i) => i.name);
}

async function fileExistsNonEmpty(absPath) {
  try {
    const s = await stat(absPath);
    return s.isFile() && s.size > 256;
  } catch {
    return false;
  }
}

/**
 * @param {boolean} throwOnFail
 */
async function downloadToFile(url, destAbs, throwOnFail) {
  if (DRY) {
    console.log(`[dry-run] ${url} -> ${destAbs}`);
    return true;
  }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    if (!throwOnFail) {
      return false;
    }
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(destAbs), { recursive: true });
  await writeFile(destAbs, buf);
  return true;
}

function parseManifest() {
  const raw = readFileSync(MANIFEST_PATH, "utf8");
  return JSON.parse(raw);
}

function collectRelPathsFromManifest(manifest) {
  /** @type {Set<string>} */
  const relPaths = new Set();
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  for (const row of assets) {
    if (row == null || typeof row !== "object") continue;
    const setId = typeof row.cubemapSetId === "string" ? row.cubemapSetId.trim() : "";
    if (setId.length > 0) {
      for (const face of CUBEMAP_FACES) {
        relPaths.add(`textures/cubemap/${setId}/${face}`);
      }
    }
    const rp = typeof row.relativePath === "string" ? row.relativePath.trim() : "";
    if (rp.length > 0 && /^textures\/cubemap\//i.test(rp)) {
      relPaths.add(rp.replace(/^\//, ""));
    }
  }
  return relPaths;
}

async function main() {
  const manifest = parseManifest();
  /** @type {Set<string>} */
  const manifestRelPaths = collectRelPathsFromManifest(manifest);
  /** @type {Set<string>} */
  const relPaths = new Set(manifestRelPaths);

  if (DISCOVER_ALL) {
    const dirs = await listCubemapDirsFromGithubApi();
    for (const name of dirs) {
      for (const face of CUBEMAP_FACES) {
        relPaths.add(`textures/cubemap/${name}/${face}`);
      }
    }
    console.log(`Discover: ${dirs.length} cubemap folder(s) from GitHub API (+ manifest paths merged).`);
  }

  const list = [...relPaths].sort();
  if (list.length === 0) {
    console.log("No cubemap paths to sync.");
    return;
  }

  console.log(`Remote: ${REMOTE_BASE}`);
  console.log(`Local:  ${LOCAL_ASSETS_ROOT}`);
  console.log(`Files:  ${list.length}${DRY ? " (dry-run)" : ""}${FORCE ? " (force)" : ""}`);

  let ok = 0;
  let skipped = 0;
  let missing = 0;
  for (const rel of list) {
    const url = joinUrl(REMOTE_BASE, rel);
    const dest = join(LOCAL_ASSETS_ROOT, rel);
    if (!FORCE && (await fileExistsNonEmpty(dest))) {
      skipped += 1;
      continue;
    }
    const throwOnFail = manifestRelPaths.has(rel);
    try {
      const did = await downloadToFile(url, dest, throwOnFail);
      if (did) {
        ok += 1;
        if (!DRY) console.log(`OK ${rel}`);
      } else {
        missing += 1;
      }
    } catch (e) {
      console.error(`FAIL ${rel}: ${e instanceof Error ? e.message : String(e)}`);
      process.exitCode = 1;
    }
  }

  if (!DRY) {
    console.log(`Done. Downloaded: ${ok}, skipped (already present): ${skipped}${DISCOVER_ALL ? `, missing (404): ${missing}` : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
