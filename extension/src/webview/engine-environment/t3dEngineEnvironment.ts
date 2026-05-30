import { T3DEngineConfig } from "@ternion/t3d";

/**
 * Single import site for T3D built-in environment / cubemap defaults.
 * Prefer importing from this module instead of `@ternion/t3d` in webview feature code.
 */
export type EngineCubemapPreset = NonNullable<
  NonNullable<(typeof T3DEngineConfig)["environment"]["cubeMaps"]>[number]
>;

export function getEngineEnvironmentCubeMaps(): readonly EngineCubemapPreset[] {
  return T3DEngineConfig.environment.cubeMaps ?? [];
}

export function getEngineEnvironmentCubeMapCount(): number {
  return T3DEngineConfig.environment.cubeMaps?.length ?? 0;
}

export function getEngineEnvironmentDefaultCubeMapIndex(): number {
  return T3DEngineConfig.environment.cubeMapIndex ?? 0;
}

export function getEngineEnvironmentIntensity(): number {
  return T3DEngineConfig.environment.intensity ?? 1;
}

/** Safe index into {@link getEngineEnvironmentCubeMaps} (empty list → 0). */
export function clampEngineCubemapPresetIndex(index: number): number {
  const len = getEngineEnvironmentCubeMapCount();
  if (len <= 0) {
    return 0;
  }
  return Math.min(Math.max(0, Math.floor(index)), len - 1);
}

export function getEngineEnvironmentCubeMapPresetAt(
  index: number,
): EngineCubemapPreset | undefined {
  const maps = getEngineEnvironmentCubeMaps();
  if (maps.length === 0) {
    return undefined;
  }
  return maps[clampEngineCubemapPresetIndex(index)] ?? maps[0];
}
