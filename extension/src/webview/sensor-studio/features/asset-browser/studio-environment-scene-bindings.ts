import type { StudioAssetDescriptor } from "./studio-asset.types";

export function isValidStudioEnvironmentAssetId(id: string, catalog: readonly StudioAssetDescriptor[]): boolean {
  return catalog.some((d) => d.id === id && d.category === "environment");
}

export function listStudioEnvironmentDescriptors(catalog: readonly StudioAssetDescriptor[]): StudioAssetDescriptor[] {
  return catalog.filter((d) => d.category === "environment");
}

export function getStudioEnvironmentDescriptorById(
  id: string,
  catalog: readonly StudioAssetDescriptor[],
): StudioAssetDescriptor | null {
  const d = catalog.find((x) => x.id === id);
  return d != null && d.category === "environment" ? d : null;
}

/** Folder path under asset roots (matches engine cubemap preset `path` keys where used). */
export function studioEnvironmentCubemapFolderPath(d: StudioAssetDescriptor): string | null {
  if (d.category !== "environment") {
    return null;
  }
  if (d.cubemapFaceBasePath != null && d.cubemapFaceBasePath.length > 0) {
    return d.cubemapFaceBasePath.replace(/\/+$/, "");
  }
  if (d.cubemapSetId != null && d.cubemapSetId.length > 0) {
    return `textures/cubemap/${d.cubemapSetId}`;
  }
  return null;
}

export function findT3DCubemapPresetIndexForStudioEnvironment(
  presets: readonly { path: string }[],
  d: StudioAssetDescriptor,
): number | null {
  const folder = studioEnvironmentCubemapFolderPath(d);
  if (folder == null) {
    return null;
  }
  const want = folder.replace(/\/+$/, "");
  const idx = presets.findIndex((p) => p.path.replace(/\/+$/, "") === want);
  return idx >= 0 ? idx : null;
}

export function inferStudioEnvironmentFromT3DPresetIndex(
  presetIndex: number,
  presets: readonly { path: string }[],
  catalog: readonly StudioAssetDescriptor[],
): StudioAssetDescriptor | null {
  const preset = presets[presetIndex];
  if (preset == null) {
    return null;
  }
  const pathNorm = preset.path.replace(/\/+$/, "");
  for (const row of catalog) {
    if (row.category !== "environment") {
      continue;
    }
    const folder = studioEnvironmentCubemapFolderPath(row);
    if (folder != null && folder.replace(/\/+$/, "") === pathNorm) {
      return row;
    }
  }
  return null;
}

/** Catalog row for UI when explicit `studioAssetId` is set, or when the T3D preset path matches a manifest folder. */
export function resolveStudioEnvironmentDescriptorForUI(
  env: { presetIndex: number; studioAssetId?: string },
  presets: readonly { path: string }[],
  catalog: readonly StudioAssetDescriptor[],
): StudioAssetDescriptor | null {
  if (env.studioAssetId != null && env.studioAssetId.length > 0) {
    const byId = getStudioEnvironmentDescriptorById(env.studioAssetId, catalog);
    if (byId != null) {
      return byId;
    }
  }
  return inferStudioEnvironmentFromT3DPresetIndex(Math.max(0, Math.round(env.presetIndex)), presets, catalog);
}

/**
 * Select option value for a built-in T3D cubemap preset (same list as Bitstream rotation toolbar).
 * Catalog-only environment rows use the raw {@link StudioAssetDescriptor.id}.
 */
export const STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX = "t3d-preset:";

export function t3dPresetEnvironmentSelectValue(presetIndex: number): string {
  return `${STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX}${Math.max(0, Math.floor(presetIndex))}`;
}

export function parseT3dPresetEnvironmentSelectValue(value: string): number | null {
  if (!value.startsWith(STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX)) {
    return null;
  }
  const raw = value.slice(STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX.length);
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function rotationInspectorEnvironmentCatalogSelectValue(
  env: { studioAssetId?: string; presetIndex: number },
  catalog: readonly StudioAssetDescriptor[],
  cubeMapPresets: readonly { path: string }[],
): string {
  if (
    env.studioAssetId != null &&
    env.studioAssetId.length > 0 &&
    isValidStudioEnvironmentAssetId(env.studioAssetId, catalog)
  ) {
    return env.studioAssetId;
  }
  const max = Math.max(0, cubeMapPresets.length - 1);
  const idx = Math.min(Math.max(0, Math.round(env.presetIndex)), max);
  return t3dPresetEnvironmentSelectValue(idx);
}

export function syncEnvironmentPresetIndexWithStudioAsset(
  presetIndex: number,
  studioAssetId: string | undefined,
  catalog: readonly StudioAssetDescriptor[],
  cubeMapPresets: readonly { path: string }[],
): number {
  if (
    studioAssetId == null ||
    studioAssetId.length === 0 ||
    !isValidStudioEnvironmentAssetId(studioAssetId, catalog)
  ) {
    return presetIndex;
  }
  const desc = getStudioEnvironmentDescriptorById(studioAssetId, catalog);
  if (desc == null) {
    return presetIndex;
  }
  const idx = findT3DCubemapPresetIndexForStudioEnvironment(cubeMapPresets, desc);
  return idx ?? presetIndex;
}
