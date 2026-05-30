import type { ModelEntry } from './modelCatalog-types';
import { DEV_GLOB_PATH_MARKERS } from '../../assetLayout';
import { resolveCatalogModelPreviewUrl } from './resolve-catalog-model-preview-url';

/** Normalize glob path to project-relative posix path starting with src/assets/ */
function globPathToProjectRelative(filePath: string): string {
  const posix = filePath.replace(/\\/g, '/');
  const markers = [...DEV_GLOB_PATH_MARKERS];
  for (const marker of markers) {
    const idx = posix.indexOf(marker);
    if (idx >= 0) {
      return `src/${posix.slice(idx)}`;
    }
  }
  return posix;
}

function catalogCategoryFromSegments(
  segments: string[]
): 'packaged' | 'downloaded' {
  const modelsIdx = segments.findIndex((s) => s === 'models');
  const firstDirAfterModels =
    modelsIdx >= 0 && segments.length > modelsIdx + 1
      ? segments[modelsIdx + 1]
      : null;
  return firstDirAfterModels === 'downloads' ? 'downloaded' : 'packaged';
}

function normalizeMetadataValue(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }
  const record = metadata as Record<string, unknown>;
  const value = record[key];
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined;
}

function normalizeCategoryValue(metadata: unknown): string | undefined {
  return (
    normalizeMetadataValue(metadata, 'category') ??
    normalizeMetadataValue(metadata, 'model_category')
  );
}

function normalizeNameValue(metadata: unknown): string | undefined {
  return (
    normalizeMetadataValue(metadata, 'name') ??
    normalizeMetadataValue(metadata, 'model_name')
  );
}

function jsonModuleToObject(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    'default' in (value as Record<string, unknown>)
  ) {
    return (value as { default?: unknown }).default;
  }
  return value;
}

/**
 * Vite build-time scan of bundled model assets (`free/models`, `tesaiot/models`).
 * Glob strings must stay **literal** (Vite); keep in sync with `MODEL_CATALOG_BUILD_GLOBS` in `assetLayout.ts`.
 * The output is safe for VS Code webviews because it does not rely on runtime directory listing.
 * New folders after build are merged at runtime via extension or bridge listing.
 */
export function scanModelCatalogAssets(): ModelEntry[] {
  const freeModelFiles = import.meta.glob(
    '../../assets/free/models/**/*.{glb,gltf}',
    {
      eager: true,
      query: '?url',
      import: 'default',
    }
  ) as Record<string, string>;
  const tesaiotModelFiles = import.meta.glob(
    '../../assets/tesaiot/models/**/*.{glb,gltf}',
    {
      eager: true,
      query: '?url',
      import: 'default',
    }
  ) as Record<string, string>;
  const mirroredModelFiles = import.meta.glob(
    '../../assets/models/**/*.{glb,gltf}',
    {
      eager: true,
      query: '?url',
      import: 'default',
    }
  ) as Record<string, string>;
  const modules: Record<string, string> = {
    ...freeModelFiles,
    ...tesaiotModelFiles,
    ...mirroredModelFiles,
  };
  const metadataModules = {
    ...(import.meta.glob('../../assets/free/models/**/*.json', {
      eager: true,
    }) as Record<string, unknown>),
    ...(import.meta.glob('../../assets/tesaiot/models/**/*.json', {
      eager: true,
    }) as Record<string, unknown>),
    ...(import.meta.glob('../../assets/models/**/*.json', {
      eager: true,
    }) as Record<string, unknown>),
  };

  const categoryByDirectory = new Map<string, string>();
  const nameByDirectory = new Map<string, string>();
  const metadataByDirectory = new Map<string, string[]>();

  for (const jsonPath of Object.keys(metadataModules)) {
    const normalized = jsonPath.replace(/\\/g, '/');
    const directory = normalized.split('/').slice(0, -1).join('/');
    const list = metadataByDirectory.get(directory) ?? [];
    list.push(normalized);
    metadataByDirectory.set(directory, list);
  }

  for (const [directory, paths] of metadataByDirectory.entries()) {
    const prioritized = [...paths].sort((a, b) => {
      const aName = a.split('/').pop() ?? a;
      const bName = b.split('/').pop() ?? b;
      const aMeta = aName.toLowerCase().endsWith('_metadata.json') ? 0 : 1;
      const bMeta = bName.toLowerCase().endsWith('_metadata.json') ? 0 : 1;
      return aMeta - bMeta;
    });
    for (const candidatePath of prioritized) {
      const raw = metadataModules[candidatePath];
      const data = jsonModuleToObject(raw);

      const category = normalizeCategoryValue(data);
      if (category && !categoryByDirectory.has(directory)) {
        categoryByDirectory.set(directory, category);
      }

      const name = normalizeNameValue(data);
      if (name && !nameByDirectory.has(directory)) {
        nameByDirectory.set(directory, name);
      }
    }
  }

  const entries = Object.entries(modules)
    .map(([filePath, rawUrl]) => {
      const dedupeKey = globPathToProjectRelative(filePath).toLowerCase();
      const url = resolveCatalogModelPreviewUrl({
        url: rawUrl,
        dedupeKey,
      });
      const urlLower = url.toLowerCase();
      let fileType: 'glb' | 'gltf' | null = null;
      if (urlLower.includes('.glb')) fileType = 'glb';
      if (urlLower.includes('.gltf')) fileType = 'gltf';

      if (!fileType) {
        return null;
      }

      const pathSegments = filePath
        .replace(/\\/g, '/')
        .split('/')
        .filter(Boolean);
      const catalogCategory = catalogCategoryFromSegments(pathSegments);

      const parentDir =
        pathSegments.length >= 2 ? pathSegments[pathSegments.length - 2] : null;

      const fileNameCandidate = (() => {
        const noQuery = url.split('?')[0];
        return noQuery.split('/').pop() ?? filePath.split('/').pop() ?? url;
      })();
      const nameWithoutExt = fileNameCandidate
        .replace(/\.(glb|gltf)(\?.*)?$/i, '')
        .trim();

      const fallbackName =
        parentDir && parentDir.length > 0
          ? parentDir
          : nameWithoutExt || fileNameCandidate;

      const directory = filePath
        .replace(/\\/g, '/')
        .split('/')
        .slice(0, -1)
        .join('/');
      const modelCategory =
        categoryByDirectory.get(directory) ?? 'Uncategorized';
      const name = nameByDirectory.get(directory) ?? fallbackName;

      return {
        id: url,
        name,
        modelCategory,
        fileType,
        url,
        catalogCategory,
        dedupeKey,
        modelSource: 'static',
      } satisfies ModelEntry;
    })
    .filter((v) => v !== null)
    .sort((a, b) => (a as ModelEntry).name.localeCompare((b as ModelEntry).name));

  return entries as ModelEntry[];
}
