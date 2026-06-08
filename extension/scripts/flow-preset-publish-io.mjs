import fs from "node:fs";
import path from "node:path";
import { readdirSync, readFileSync } from "node:fs";

export function resolveFreeAssetsRepo(extensionRoot) {
  const defaultFreeRepo = path.resolve(extensionRoot, "../../ternion-3d-assets-free");
  return process.env.TERNION_FREE_ASSETS_REPO?.trim() || defaultFreeRepo;
}

export function resolveBundledFlowPresetPackDir(extensionRoot) {
  return path.join(extensionRoot, "src/assets/libraries/flow-preset");
}

function copyPackRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name === "README.md" || entry.name === "overrides") {
      continue;
    }
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyPackRecursive(src, dest);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

export function getFlowPresetPublishStatus(extensionRoot) {
  const freeRepo = resolveFreeAssetsRepo(extensionRoot);
  const srcPack = resolveBundledFlowPresetPackDir(extensionRoot);
  const dstPack = path.join(freeRepo, "assets/libraries/flow-preset");
  const bundledJsonCount = fs.existsSync(srcPack)
    ? fs.readdirSync(srcPack).filter((name) => name.endsWith(".json")).length
    : 0;
  return {
    githubTokenConfigured: Boolean(process.env.GITHUB_TOKEN?.trim()),
    freeRepoPath: freeRepo,
    freeRepoExists: fs.existsSync(freeRepo),
    stagedPackPath: dstPack,
    bundledPackPath: srcPack,
    bundledJsonCount,
  };
}

export function stageFlowPresetsFreePack(extensionRoot) {
  const srcPack = resolveBundledFlowPresetPackDir(extensionRoot);
  if (!fs.existsSync(srcPack)) {
    return { ok: false, error: "Bundled pack missing — run flow-preset:gen first." };
  }
  const freeRepo = resolveFreeAssetsRepo(extensionRoot);
  if (!fs.existsSync(freeRepo)) {
    return {
      ok: false,
      error: `Free assets repo not found at ${freeRepo}. Set TERNION_FREE_ASSETS_REPO.`,
    };
  }
  const dstPack = path.join(freeRepo, "assets/libraries/flow-preset");
  copyPackRecursive(srcPack, dstPack);
  const fileCount = fs.readdirSync(dstPack).filter((name) => name.endsWith(".json")).length;
  return {
    ok: true,
    freeRepoPath: freeRepo,
    stagedPackPath: dstPack,
    fileCount,
    nextStep:
      "In ternion-3d-assets-free: bump assets/feed.json revision, commit, and push to main.",
  };
}

export async function publishFlowPresetsFreePack(extensionRoot) {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return {
      ok: false,
      error: "GITHUB_TOKEN is not set on the Vite dev server. Use stage + git push, or set the token and retry.",
    };
  }

  const OWNER = process.env.GITHUB_MANIFEST_OWNER?.trim() || "drsanti";
  const REPO = process.env.GITHUB_MANIFEST_REPO?.trim() || "ternion-3d-assets-free";
  const BRANCH = process.env.GITHUB_MANIFEST_BRANCH?.trim() || "main";
  const REMOTE_PREFIX = "assets/libraries/flow-preset";
  const PACK_DIR = resolveBundledFlowPresetPackDir(extensionRoot);

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const files = readdirSync(PACK_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => {
      if (a === "index.json") return -1;
      if (b === "index.json") return 1;
      return a.localeCompare(b);
    });

  if (files.length === 0) {
    return { ok: false, error: "No JSON files in bundled pack — run flow-preset:gen first." };
  }

  async function fetchExistingSha(remotePath) {
    const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${remotePath}`;
    const existing = await fetch(`${apiBase}?ref=${encodeURIComponent(BRANCH)}`, { headers });
    if (existing.ok) {
      const meta = await existing.json();
      if (typeof meta.sha === "string" && meta.sha.length > 0) {
        return meta.sha;
      }
    } else if (existing.status !== 404) {
      const text = await existing.text();
      throw new Error(`GitHub GET ${remotePath} failed: ${existing.status} ${text.slice(0, 300)}`);
    }
    return undefined;
  }

  for (const fileName of files) {
    const localPath = path.join(PACK_DIR, fileName);
    const bodyRaw = readFileSync(localPath, "utf8");
    const content = Buffer.from(bodyRaw, "utf8").toString("base64");
    const remotePath = `${REMOTE_PREFIX}/${fileName}`;
    const sha = await fetchExistingSha(remotePath);
    const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${remotePath}`;
    const put = await fetch(apiBase, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `chore(assets): update official flow preset ${fileName}`,
        content,
        branch: BRANCH,
        ...(sha != null ? { sha } : {}),
      }),
    });
    const putText = await put.text();
    if (!put.ok) {
      throw new Error(`GitHub PUT ${remotePath} failed: ${put.status} ${putText.slice(0, 500)}`);
    }
  }

  return {
    ok: true,
    fileCount: files.length,
    remotePrefix: REMOTE_PREFIX,
    repo: `${OWNER}/${REPO}`,
    branch: BRANCH,
  };
}
