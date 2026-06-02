/** Default rotation-preview body GLB (free pack + online tree). */
export const BOOTSTRAP_PSOC_GLB_RELATIVE_PATH = "models/psoc-e84-ai/psoc-e84-ai.glb";

/** Default IBL cubemap used by rotation preview and many Studio scenes. */
export const BOOTSTRAP_DEFAULT_CUBEMAP_REL_DIR = "textures/cubemap/bridge";

const CUBEMAP_FACE_NAMES = [
  "posx",
  "negx",
  "posy",
  "negy",
  "posz",
  "negz",
] as const;

function cubemapFaceRelativePaths(cubemapDir: string): string[] {
  const dir = cubemapDir.replace(/^\//, "").replace(/\/+$/, "");
  return CUBEMAP_FACE_NAMES.map((face) => `${dir}/${face}.jpg`);
}

/**
 * Pack-relative paths under the free mirror (`globalStorage/.../assets/free/`)
 * and the online tree (`.../main/assets/`).
 */
export const BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS: readonly string[] = [
  BOOTSTRAP_PSOC_GLB_RELATIVE_PATH,
  ...cubemapFaceRelativePaths(BOOTSTRAP_DEFAULT_CUBEMAP_REL_DIR),
] as const;

/** GitHub repo paths for subset free-pack sync (`onlyRepoPaths`). */
export function bootstrapPackRelativeToRepoPath(packRelative: string): string {
  const rel = packRelative.replace(/^\//, "");
  return `assets/${rel}`;
}

export function bootstrapRequiredRepoPaths(): string[] {
  return BOOTSTRAP_REQUIRED_PACK_RELATIVE_PATHS.map(bootstrapPackRelativeToRepoPath);
}
