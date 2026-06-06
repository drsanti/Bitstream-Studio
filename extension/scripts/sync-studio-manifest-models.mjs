#!/usr/bin/env node
/**
 * Refresh pack model rows in studio-asset-manifest.v1.json from
 * ternion-3d-assets-free assets/models/manifest.json.
 * Applies free-pack-model-exclusions.v1.json (retired ids still on GitHub).
 *
 * Usage: npm run sync:studio-manifest-models
 * Env: STUDIO_ASSETS_RAW_BASE — override GitHub raw base (optional)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(
  EXT_ROOT,
  "src/webview/assets-manager/registry/studio-asset-manifest.v1.json",
);
const LOCAL_IDS_PATH = path.join(
  EXT_ROOT,
  "src/webview/assets-manager/registry/free-pack-model-ids.v1.json",
);
const EXCLUSIONS_PATH = path.join(
  EXT_ROOT,
  "src/webview/assets-manager/registry/free-pack-model-exclusions.v1.json",
);

const DEFAULT_RAW_BASE =
  "https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets";

function trimSlash(s) {
  return s.replace(/\/+$/, "");
}

function modelRow(folderId) {
  const relativePath = `models/${folderId}/${folderId}.glb`;
  const onlineFallbackUrl = `${trimSlash(process.env.STUDIO_ASSETS_RAW_BASE ?? DEFAULT_RAW_BASE)}/models/${folderId}/${folderId}.glb`;
  const id = folderId === "psoc-e84-ai" ? "model.psoc-e84.default" : `model.${folderId}`;
  const labels = {
    "abb-robot-arm": "ABB robot arm",
    "car-cam-physics": "Car + camera (physics)",
    "healtcare-gateway": "Healthcare gateway",
    "plc-traninig-kit": "PLC training kit",
    "psoc-e84-ai": "PSoC E84 (AI board)",
    "psoc-e84-ai-board": "PSoC E84 AI board (variant)",
    "robot-4w": "Robot 4-wheel",
    "robot-arm": "Robot arm",
    "tesa-drone": "TESA drone",
  };
  const label = labels[folderId] ?? folderId;
  const summary =
    folderId === "psoc-e84-ai"
      ? "Default rotation / Bitstream / Sensor Studio pack GLB."
      : `Free pack GLB (${folderId}) — mirror via Asset Manager or online fallback.`;
  return {
    id,
    category: "model",
    source: "pack",
    label,
    summary,
    relativePath,
    onlineFallbackUrl,
  };
}

async function fetchRemoteModelIds() {
  const base = trimSlash(process.env.STUDIO_ASSETS_RAW_BASE ?? DEFAULT_RAW_BASE);
  const url = `${base}/models/manifest.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!Array.isArray(json)) {
    throw new Error(`Expected array in ${url}`);
  }
  return json.filter((x) => typeof x === "string" && x.trim().length > 0);
}

function loadModelExclusions() {
  if (!fs.existsSync(EXCLUSIONS_PATH)) {
    return new Set();
  }
  const json = JSON.parse(fs.readFileSync(EXCLUSIONS_PATH, "utf8"));
  if (!Array.isArray(json)) {
    throw new Error(`${EXCLUSIONS_PATH} must be a string array`);
  }
  return new Set(
    json
      .filter((x) => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim()),
  );
}

function applyModelExclusions(folderIds, exclusions) {
  if (exclusions.size === 0) {
    return folderIds;
  }
  return folderIds.filter((id) => !exclusions.has(id));
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const forceLocal = process.argv.includes("--local-only");

  const run = async () => {
    const exclusions = loadModelExclusions();
    let folderIds = forceLocal
      ? JSON.parse(fs.readFileSync(LOCAL_IDS_PATH, "utf8"))
      : await fetchRemoteModelIds();
    const remoteCount = folderIds.length;
    folderIds = applyModelExclusions(folderIds, exclusions);

    const doc = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const nonModels = (doc.assets ?? []).filter((a) => a.category !== "model");
    const models = folderIds.map(modelRow);
    // Default pack model first
    models.sort((a, b) => {
      if (a.id === "model.psoc-e84.default") return -1;
      if (b.id === "model.psoc-e84.default") return 1;
      return a.label.localeCompare(b.label);
    });

    const next = {
      version: doc.version ?? 1,
      defaults: {
        packModelId: "model.psoc-e84.default",
      },
      assets: [...models, ...nonModels],
    };

    fs.writeFileSync(LOCAL_IDS_PATH, `${JSON.stringify(folderIds, null, 2)}\n`);
    const out = `${JSON.stringify(next, null, 2)}\n`;
    if (dryRun) {
      process.stdout.write(out);
      return;
    }
    fs.writeFileSync(MANIFEST_PATH, out);
    const excludedNote =
      exclusions.size > 0 && remoteCount > folderIds.length
        ? ` (${remoteCount - folderIds.length} excluded via free-pack-model-exclusions.v1.json)`
        : "";
    console.log(
      `Updated ${MANIFEST_PATH} with ${models.length} models from free pack manifest.${excludedNote}`,
    );
  };

  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

main();
