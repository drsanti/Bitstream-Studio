import {
  ENGINE_ENVIRONMENT_CUBE_MAPS,
  ENGINE_ENVIRONMENT_DEFAULT_CUBE_MAP_INDEX,
  ENGINE_ENVIRONMENT_INTENSITY,
  type EngineCubemapPreset,
} from "./cubemapPresets.js";

export type { EngineCubemapPreset };

/**
 * Cubemap / environment defaults for R3F preview (no @ternion/t3d dependency).
 */
export function getEngineEnvironmentCubeMaps(): readonly EngineCubemapPreset[]
{
  return ENGINE_ENVIRONMENT_CUBE_MAPS;
}

export function getEngineEnvironmentCubeMapCount(): number
{
  return ENGINE_ENVIRONMENT_CUBE_MAPS.length;
}

export function getEngineEnvironmentDefaultCubeMapIndex(): number
{
  return ENGINE_ENVIRONMENT_DEFAULT_CUBE_MAP_INDEX;
}

export function getEngineEnvironmentIntensity(): number
{
  return ENGINE_ENVIRONMENT_INTENSITY;
}

/** Safe index into {@link getEngineEnvironmentCubeMaps} (empty list → 0). */
export function clampEngineCubemapPresetIndex(index: number): number
{
  const len = getEngineEnvironmentCubeMapCount();
  if (len <= 0)
  {
    return 0;
  }
  return Math.min(Math.max(0, Math.floor(index)), len - 1);
}

export function getEngineEnvironmentCubeMapPresetAt(
  index: number,
): EngineCubemapPreset | undefined
{
  const maps = getEngineEnvironmentCubeMaps();
  if (maps.length === 0)
  {
    return undefined;
  }
  return maps[clampEngineCubemapPresetIndex(index)] ?? maps[0];
}
