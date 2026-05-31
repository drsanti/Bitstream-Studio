import { DEV_SRC_ASSETS_PREFIX } from "../../../assetLayout";
import {
  canonicalCatalogDedupeKey,
  catalogDedupeKeyToResolveRelativePath,
} from "../../model-catalog/modelCatalogMerge";
import type { ModelEntry } from "../../model-catalog/modelCatalog-types";
import type { AssetDescriptor } from "./asset.types";
import { inferModelAssetSource } from "./inferModelAssetSource.js";
import {
  scanCubemapEnvironmentDescriptors,
  scanFlatTextureDescriptors,
} from "./texture-cubemap-scan";

function canonicalKeyForCuratedRelativeModel(relativePath: string): string {
  const rel = relativePath.replace(/^\/+/, "");
  const full = rel.startsWith("src/") ? rel : `${DEV_SRC_ASSETS_PREFIX}${rel}`;
  return canonicalCatalogDedupeKey(full);
}

function userFacingModelSummary(m: ModelEntry): string {
  const kind = m.fileType.toUpperCase();
  if (m.modelCategory !== "Uncategorized") {
    return `${m.modelCategory} · ${kind} model`;
  }
  return `${kind} model`;
}

function modelEntryToDescriptor(m: ModelEntry): AssetDescriptor {
  const source = inferModelAssetSource(m);
  const relativePath = catalogDedupeKeyToResolveRelativePath(m.dedupeKey) ?? undefined;
  return {
    id: `catalog-model:${m.dedupeKey}`,
    category: "model",
    source,
    label: m.name,
    summary: userFacingModelSummary(m),
    relativePath,
  };
}

function environmentDedupeKey(row: AssetDescriptor): string {
  if (row.cubemapFaceBasePath != null && row.cubemapFaceBasePath.length > 0) {
    return `base:${row.cubemapFaceBasePath.toLowerCase()}`;
  }
  if (row.cubemapSetId != null && row.cubemapSetId.length > 0) {
    return `set:${row.cubemapSetId.toLowerCase()}`;
  }
  return row.id;
}

function preferManifestOverScanEnvironment(a: AssetDescriptor, b: AssetDescriptor): AssetDescriptor {
  const score = (x: AssetDescriptor) => (x.id.startsWith("env.scan:") ? 0 : 1);
  return score(a) >= score(b) ? a : b;
}

function mergeEnvironmentRows(rows: AssetDescriptor[]): AssetDescriptor[] {
  const map = new Map<string, AssetDescriptor>();
  for (const row of rows) {
    const k = environmentDedupeKey(row);
    const prev = map.get(k);
    map.set(k, prev == null ? row : preferManifestOverScanEnvironment(prev, row));
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function textureDedupeKey(row: AssetDescriptor): string | null {
  const rel = row.relativePath?.toLowerCase();
  return rel != null && rel.length > 0 ? `rel:${rel}` : null;
}

function preferManifestOverScanTexture(a: AssetDescriptor, b: AssetDescriptor): AssetDescriptor {
  const score = (x: AssetDescriptor) => (x.id.startsWith("texture-scan:") ? 0 : 1);
  return score(a) >= score(b) ? a : b;
}

function mergeTextureRows(rows: AssetDescriptor[]): AssetDescriptor[] {
  const map = new Map<string, AssetDescriptor>();
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
 * Full asset list: merged model catalog + scanned textures / cubemaps + manifest overlay.
 */
export function buildAssetDescriptorList(
  mergedModelEntries: ModelEntry[],
  manifestOverlay: readonly AssetDescriptor[],
): AssetDescriptor[] {
  const modelsMap = new Map<string, AssetDescriptor>();

  for (const m of mergedModelEntries) {
    modelsMap.set(m.dedupeKey, modelEntryToDescriptor(m));
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
  const environments = mergeEnvironmentRows([
    ...manifestEnvs,
    ...scanCubemapEnvironmentDescriptors(),
  ]);

  const manifestTex = manifestOverlay.filter((c) => c.category === "texture");
  const textures = mergeTextureRows([...manifestTex, ...scanFlatTextureDescriptors()]);

  return [...models, ...environments, ...textures];
}

/** @deprecated Use {@link buildAssetDescriptorList}. */
export const buildStudioAssetDescriptorList = buildAssetDescriptorList;
