import { DEV_SRC_ASSETS_PREFIX } from "../../../../assetLayout";
import {
  canonicalCatalogDedupeKey,
  catalogDedupeKeyToResolveRelativePath,
} from "../../../model-catalog/modelCatalogMerge";
import type { ModelEntry } from "../../../model-catalog/modelCatalog-types";
import type { StudioAssetDescriptor } from "./studio-asset.types";
import {
  scanStudioCubemapEnvironmentDescriptors,
  scanStudioFlatTextureDescriptors,
} from "./studio-texture-cubemap-scan";

function canonicalKeyForCuratedRelativeModel(relativePath: string): string {
  const rel = relativePath.replace(/^\/+/, "");
  const full = rel.startsWith("src/") ? rel : `${DEV_SRC_ASSETS_PREFIX}${rel}`;
  return canonicalCatalogDedupeKey(full);
}

function modelEntryToStudioDescriptor(m: ModelEntry): StudioAssetDescriptor {
  const source: StudioAssetDescriptor["source"] =
    m.catalogCategory === "downloaded" ? "downloaded" : "pack";
  const relativePath = catalogDedupeKeyToResolveRelativePath(m.dedupeKey) ?? undefined;
  return {
    id: `catalog-model:${m.dedupeKey}`,
    category: "model",
    source,
    label: m.name,
    summary: `${m.modelCategory} · .${m.fileType} · ${m.catalogCategory}`,
    relativePath,
  };
}

function environmentDedupeKey(row: StudioAssetDescriptor): string {
  if (row.cubemapFaceBasePath != null && row.cubemapFaceBasePath.length > 0) {
    return `base:${row.cubemapFaceBasePath.toLowerCase()}`;
  }
  if (row.cubemapSetId != null && row.cubemapSetId.length > 0) {
    return `set:${row.cubemapSetId.toLowerCase()}`;
  }
  return row.id;
}

function preferManifestOverScanEnvironment(a: StudioAssetDescriptor, b: StudioAssetDescriptor): StudioAssetDescriptor {
  const score = (x: StudioAssetDescriptor) => (x.id.startsWith("env.scan:") ? 0 : 1);
  return score(a) >= score(b) ? a : b;
}

function mergeEnvironmentRows(rows: StudioAssetDescriptor[]): StudioAssetDescriptor[] {
  const map = new Map<string, StudioAssetDescriptor>();
  for (const row of rows) {
    const k = environmentDedupeKey(row);
    const prev = map.get(k);
    map.set(k, prev == null ? row : preferManifestOverScanEnvironment(prev, row));
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function textureDedupeKey(row: StudioAssetDescriptor): string | null {
  const rel = row.relativePath?.toLowerCase();
  return rel != null && rel.length > 0 ? `rel:${rel}` : null;
}

function preferManifestOverScanTexture(a: StudioAssetDescriptor, b: StudioAssetDescriptor): StudioAssetDescriptor {
  const score = (x: StudioAssetDescriptor) => (x.id.startsWith("texture-scan:") ? 0 : 1);
  return score(a) >= score(b) ? a : b;
}

function mergeTextureRows(rows: StudioAssetDescriptor[]): StudioAssetDescriptor[] {
  const map = new Map<string, StudioAssetDescriptor>();
  for (const row of rows) {
    const k = textureDedupeKey(row);
    if (k == null) {
      continue;
    }
    const prev = map.get(k);
    map.set(k, prev == null ? row : preferManifestOverScanTexture(prev, row));
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Full Asset Browser list: merged model catalog + scanned textures / cubemaps + manifest overlay
 * (remote and/or bundled `studio-asset-manifest.v1.json`).
 */
export function buildStudioAssetDescriptorList(
  mergedModelEntries: ModelEntry[],
  manifestOverlay: readonly StudioAssetDescriptor[],
): StudioAssetDescriptor[] {
  const modelsMap = new Map<string, StudioAssetDescriptor>();

  for (const m of mergedModelEntries) {
    modelsMap.set(m.dedupeKey, modelEntryToStudioDescriptor(m));
  }

  for (const c of manifestOverlay) {
    if (c.category !== "model") {
      continue;
    }
    if (c.externalUrl != null && c.externalUrl.length > 0) {
      modelsMap.set(`external:${c.id}`, { ...c });
      continue;
    }
    if (c.relativePath != null && c.relativePath.length > 0) {
      const ck = canonicalKeyForCuratedRelativeModel(c.relativePath);
      const existing = modelsMap.get(ck);
      if (existing != null) {
        modelsMap.set(ck, {
          ...existing,
          id: c.id,
          label: c.label,
          summary: c.summary,
        });
      } else {
        modelsMap.set(ck, { ...c });
      }
    }
  }

  const models = [...modelsMap.values()].sort((a, b) => a.label.localeCompare(b.label));

  const manifestEnvs = manifestOverlay.filter((c) => c.category === "environment");
  const environments = mergeEnvironmentRows([...manifestEnvs, ...scanStudioCubemapEnvironmentDescriptors()]);

  const manifestTex = manifestOverlay.filter((c) => c.category === "texture");
  const textures = mergeTextureRows([...manifestTex, ...scanStudioFlatTextureDescriptors()]);

  return [...models, ...environments, ...textures];
}
