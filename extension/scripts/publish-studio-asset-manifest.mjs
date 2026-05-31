/**
 * Uploads `src/webview/assets-manager/registry/studio-asset-manifest.v1.json`
 * to GitHub: `drsanti/ternion-3d-assets-free` → `assets/studio-asset-manifest.v1.json` on `main`.
 *
 * Layout: `extension/docs/ASSETS_ONLINE_REPO.md`
 *
 * Requirements:
 * - `GITHUB_TOKEN` with **repo** (Contents: write) for that repository.
 *
 * Usage (bash):
 *   export GITHUB_TOKEN=ghp_...
 *   npm run publish:studio-asset-manifest
 *
 * PowerShell:
 *   $env:GITHUB_TOKEN="ghp_..."
 *   npm run publish:studio-asset-manifest
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(
  ROOT,
  "src/webview/assets-manager/registry/studio-asset-manifest.v1.json",
);

const OWNER = process.env.GITHUB_MANIFEST_OWNER?.trim() || "drsanti";
const REPO = process.env.GITHUB_MANIFEST_REPO?.trim() || "ternion-3d-assets-free";
const BRANCH = process.env.GITHUB_MANIFEST_BRANCH?.trim() || "main";
const REMOTE_PATH = "assets/studio-asset-manifest.v1.json";

const token = process.env.GITHUB_TOKEN?.trim();
if (!token) {
  console.error("Missing GITHUB_TOKEN. Create a fine-grained or classic PAT with repo scope for the target repo.");
  process.exit(1);
}

const bodyRaw = readFileSync(MANIFEST_PATH, "utf8");
const content = Buffer.from(bodyRaw, "utf8").toString("base64");

const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${REMOTE_PATH}`;
const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

let sha;
const existing = await fetch(`${apiBase}?ref=${encodeURIComponent(BRANCH)}`, { headers });
if (existing.ok) {
  const meta = await existing.json();
  if (typeof meta.sha === "string" && meta.sha.length > 0) {
    sha = meta.sha;
  }
} else if (existing.status !== 404) {
  const text = await existing.text();
  console.error(`GitHub GET failed: ${existing.status} ${text.slice(0, 500)}`);
  process.exit(1);
}

const putBody = {
  message: "chore(assets): add studio-asset-manifest.v1.json for Sensor Studio overlay",
  content,
  branch: BRANCH,
  ...(sha != null ? { sha } : {}),
};

const put = await fetch(apiBase, {
  method: "PUT",
  headers: {
    ...headers,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(putBody),
});

const putText = await put.text();
if (!put.ok) {
  console.error(`GitHub PUT failed: ${put.status} ${putText.slice(0, 800)}`);
  process.exit(1);
}

console.log(`OK: published ${OWNER}/${REPO}@${BRANCH}:${REMOTE_PATH}`);
console.log(JSON.stringify(JSON.parse(putText), null, 2).slice(0, 600));
