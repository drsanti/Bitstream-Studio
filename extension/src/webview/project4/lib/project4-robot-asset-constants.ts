/**
 * Canonical robot GLB locations for Project 4 — aligned with `ternion-3d-assets-free`
 * (`drsanti/ternion-3d-assets-free`) and extension Free Assets sync (`asset-sync-free-pack-start`).
 */
export const PROJECT4_ROBOT_MODEL_REL_PATH =
  "models/robot-4th-project/robot-4th-project.glb";

/** Repo tree blobs passed to `onlyRepoPaths` for subset GitHub → globalStorage sync. */
export const PROJECT4_ROBOT_FREE_PACK_REPO_PATHS = [
  `assets/${PROJECT4_ROBOT_MODEL_REL_PATH}`,
] as const;

/** Resolved against `window.ONLINE_ASSETS_BASE_URI` in {@link resolveProject4RobotModelUrl}. */
export const PROJECT4_ROBOT_ONLINE_PLACEHOLDER = `\${ONLINE_ASSETS_BASE_URI}/${PROJECT4_ROBOT_MODEL_REL_PATH}`;

/** Resolved against `window.FREE_ASSETS_BASE_URI` (GitHub mirror under extension storage). */
export const PROJECT4_ROBOT_FREE_MIRROR_PLACEHOLDER = `\${FREE_ASSETS_BASE_URI}/${PROJECT4_ROBOT_MODEL_REL_PATH}`;
