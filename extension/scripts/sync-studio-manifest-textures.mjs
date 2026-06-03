#!/usr/bin/env node
/**
 * Refresh environment (cubemap) + texture (HDRI, images) rows in studio-asset-manifest.v1.json
 * from ternion-3d-assets-free assets/textures/{cubemap,hdri,images}/manifest.json.
 *
 * Usage: npm run sync:studio-manifest-textures
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
const CUBEMAP_IDS_PATH = path.join(
  EXT_ROOT,
  "src/webview/assets-manager/registry/free-pack-cubemap-ids.v1.json",
);

const DEFAULT_RAW_BASE =
  "https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets";

function trimSlash(s) {
  return s.replace(/\/+$/, "");
}

function rawBase() {
  return trimSlash(process.env.STUDIO_ASSETS_RAW_BASE ?? DEFAULT_RAW_BASE);
}

function onlineUrl(relativePath) {
  const rel = relativePath.replace(/^\//, "");
  return `${rawBase()}/${rel}`;
}

function envCubemapAssetId(setId) {
  const slug = setId
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `env.cubemap.${slug}`;
}

function cubemapEnvironmentRow(setId) {
  return {
    id: envCubemapAssetId(setId),
    category: "environment",
    source: "pack",
    label: `Cubemap — ${setId}`,
    summary: `JPEG cubemap (six faces) · textures/cubemap/${setId}/`,
    cubemapSetId: setId,
  };
}

function normalizePackRelativePath(file) {
  const t = String(file).trim().replace(/\\/g, "/");
  if (t.startsWith("/assets/")) {
    return t.slice("/assets/".length);
  }
  if (t.startsWith("assets/")) {
    return t.slice("assets/".length);
  }
  return t.replace(/^\//, "");
}

function hdriTextureRow(entry) {
  const rel = normalizePackRelativePath(entry.file);
  const preset = entry.preset ?? rel.split("/").pop()?.replace(/\.hdr$/i, "") ?? "hdri";
  return {
    id: `texture.hdri.${preset}`,
    category: "texture",
    source: "pack",
    label: entry.label != null ? `HDRI — ${entry.label}` : `HDRI — ${preset}`,
    summary: `HDR environment map · ${rel}`,
    relativePath: rel,
    onlineFallbackUrl: onlineUrl(rel),
  };
}

function imageTextureRow(entry) {
  const rel = `textures/images/${String(entry.file).replace(/^\//, "")}`;
  const id = entry.id != null ? `texture.image.${entry.id}` : `texture.image.${rel}`;
  const name = entry.name ?? entry.id ?? rel;
  const category = entry.category != null ? ` (${entry.category})` : "";
  return {
    id,
    category: "texture",
    source: "pack",
    label: `Image — ${name}`,
    summary: `2D texture${category} · ${rel}`,
    relativePath: rel,
    onlineFallbackUrl: onlineUrl(rel),
  };
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`GET ${url} -> HTTP ${res.status}`);
  }
  return res.json();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const base = rawBase();

  const [cubemapIds, hdriList, imagesRoot] = await Promise.all([
    fetchJson(`${base}/textures/cubemap/manifest.json`),
    fetchJson(`${base}/textures/hdri/manifest.json`),
    fetchJson(`${base}/textures/images/manifest.json`),
  ]);

  if (!Array.isArray(cubemapIds)) {
    throw new Error("cubemap manifest.json must be an array");
  }
  if (!Array.isArray(hdriList)) {
    throw new Error("hdri manifest.json must be an array");
  }

  const imageEntries = Array.isArray(imagesRoot?.entries) ? imagesRoot.entries : [];

  const doc = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const models = (doc.assets ?? []).filter((a) => a.category === "model");

  const environments = cubemapIds.map(cubemapEnvironmentRow);
  environments.sort((a, b) => a.label.localeCompare(b.label));

  const textures = [
    ...hdriList.map(hdriTextureRow),
    ...imageEntries.map(imageTextureRow),
  ];
  textures.sort((a, b) => a.label.localeCompare(b.label));

  const next = {
    version: doc.version ?? 1,
    defaults: {
      ...(doc.defaults ?? {}),
      packModelId: doc.defaults?.packModelId ?? "model.psoc-e84.default",
      packEnvironmentId:
        doc.defaults?.packEnvironmentId ?? envCubemapAssetId("park"),
    },
    assets: [...models, ...environments, ...textures],
  };

  fs.writeFileSync(CUBEMAP_IDS_PATH, `${JSON.stringify(cubemapIds, null, 2)}\n`);

  const out = `${JSON.stringify(next, null, 2)}\n`;
  if (dryRun) {
    process.stdout.write(out);
    return;
  }
  fs.writeFileSync(MANIFEST_PATH, out);
  console.log(
    `Updated ${MANIFEST_PATH}: ${environments.length} cubemaps, ${hdriList.length} HDRI, ${imageEntries.length} images (${textures.length} texture rows).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
