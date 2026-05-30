/** Built-in cubemap presets for R3F model preview (ported from T3DEngineConfig.environment). */
export type EngineCubemapPreset = {
  title: string;
  path: string;
};

export const ENGINE_ENVIRONMENT_INTENSITY = 1;

export const ENGINE_ENVIRONMENT_DEFAULT_CUBE_MAP_INDEX = 0;

export const ENGINE_ENVIRONMENT_CUBE_MAPS: readonly EngineCubemapPreset[] = [
  { title: "Bridge", path: "textures/cubemap/bridge" },
  { title: "Park", path: "textures/cubemap/park" },
  { title: "Snow", path: "textures/cubemap/snow" },
  { title: "Lawn", path: "textures/cubemap/Yokohama2" },
  { title: "Shore", path: "textures/cubemap/Lycksele3" },
  { title: "River", path: "textures/cubemap/Storforsen" },
  { title: "Waterfall", path: "textures/cubemap/Storforsen4" },
  { title: "Footpath", path: "textures/cubemap/Yokohama" },
  { title: "Night", path: "textures/cubemap/Yokohama3" },
] as const;
