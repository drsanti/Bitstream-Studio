/**
 * Cubemap sets under `src/assets/textures/cubemap/<id>/` (six faces: `posx.jpg` … `negz.jpg`).
 * Mirrors public inventory:
 * https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/textures/cubemap
 */

export const PROJECT4_TWIN_CUBEMAP_NONE = "none";

/** Folder names (must match on-disk / online paths). */
export const PROJECT4_TWIN_CUBEMAP_IDS = [
  "Lycksele3",
  "Storforsen",
  "Storforsen3",
  "Storforsen4",
  "Yokohama",
  "Yokohama2",
  "Yokohama3",
  "bridge",
  "park",
  "snow",
] as const;

export type Project4TwinCubemapId = (typeof PROJECT4_TWIN_CUBEMAP_IDS)[number];

export function isProject4TwinCubemapId(value: string): value is Project4TwinCubemapId {
  return (PROJECT4_TWIN_CUBEMAP_IDS as readonly string[]).includes(value);
}

export const PROJECT4_TWIN_SCENE_BACKGROUND_HEX = "#09090b";

export const PROJECT4_TWIN_ENVIRONMENT_INTENSITY = 1.15;
