/**
 * Upload bundled official flow presets to GitHub:
 * `drsanti/ternion-3d-assets-free` → `assets/libraries/flow-preset/` on `main`.
 *
 * Layout: `extension/docs/ASSETS_ONLINE_REPO.md`
 *
 * Requirements:
 * - `GITHUB_TOKEN` with **repo** (Contents: write) for that repository.
 *
 * Usage:
 *   npm run flow-preset:gen
 *   export GITHUB_TOKEN=ghp_...
 *   npm run flow-preset:publish-free-pack
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PACK_DIR = join(ROOT, "src/assets/libraries/flow-preset");

const OWNER = process.env.GITHUB_MANIFEST_OWNER?.trim() || "drsanti";
const REPO = process.env.GITHUB_MANIFEST_REPO?.trim() || "ternion-3d-assets-free";
const BRANCH = process.env.GITHUB_MANIFEST_BRANCH?.trim() || "main";
const REMOTE_PREFIX = "assets/libraries/flow-preset";

const token = process.env.GITHUB_TOKEN?.trim();
if (!token) {
  console.error("Missing GITHUB_TOKEN. Create a PAT with repo scope for the target repo.");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

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

async function uploadFile(fileName) {
  const localPath = join(PACK_DIR, fileName);
  const bodyRaw = readFileSync(localPath, "utf8");
  const content = Buffer.from(bodyRaw, "utf8").toString("base64");
  const remotePath = `${REMOTE_PREFIX}/${fileName}`;
  const sha = await fetchExistingSha(remotePath);
  const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${remotePath}`;
  const put = await fetch(apiBase, {
    method: "PUT",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
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
  console.log(`uploaded ${remotePath}`);
}

const files = readdirSync(PACK_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort((a, b) => {
    if (a === "index.json") {
      return -1;
    }
    if (b === "index.json") {
      return 1;
    }
    return a.localeCompare(b);
  });

if (files.length === 0) {
  console.error("No JSON files in flow-preset pack — run npm run flow-preset:gen first");
  process.exit(1);
}

for (const fileName of files) {
  await uploadFile(fileName);
}

console.log(`Done — ${files.length} files published under ${REMOTE_PREFIX}/`);
