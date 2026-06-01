/** BSX fusion Euler: roll X, pitch Y, heading Z, intrinsic ZYX. */
export const FUSION_EULER_ORDER = "ZYX" as const;

/** Snap display when mapped target jumps more than this (rad) vs current. */
export const QUAT_JUMP_SNAP_RAD = 0.55;

/** Below this separation (rad), slerp snaps to target to avoid micro-jitter. */
export const QUAT_SNAP_ANGLE_RAD = 0.022;

/**
 * Max rotation applied to the 3D mesh per wire quaternion update (degrees).
 * Dampens BSX single-frame jumps so small hand motion does not look exaggerated.
 */
export const ORIENTATION_DISPLAY_MAX_STEP_DEG_PER_WIRE = 10;

export const PERF_REPORT_INTERVAL_MS = 500;

/** Ring buffer length for quaternion wire overlay (one slot per wire packet; span ~2 s at 90 Hz). */
export const QUAT_OVERLAY_HISTORY_LEN = 180;
/** Gap between stacked qx / qy / qz / qw strips (px). */
export const QUAT_OVERLAY_GAP_PX = 2;
/**
 * Per-strip plot height (px). Baseline was ~(112 − 3·gap) / 4 ≈ 26.5; **5×** so small quaternion
 * changes read clearly on screen.
 */
export const QUAT_OVERLAY_STRIP_HEIGHT_PX = 133;
/** Total overlay height: four strips + three gaps. */
export const QUAT_OVERLAY_CSS_HEIGHT_PX =
  4 * QUAT_OVERLAY_STRIP_HEIGHT_PX + 3 * QUAT_OVERLAY_GAP_PX;
/** Fixed vertical scale for normalized quaternion components (symmetric around 0). */
export const QUAT_OVERLAY_Y_MIN = -1.08;
export const QUAT_OVERLAY_Y_MAX = 1.08;

/** Ring buffer for fusion Euler wire overlay (pitch / roll / yaw, radians). */
export const EULER_OVERLAY_HISTORY_LEN = 180;
export const EULER_OVERLAY_GAP_PX = 2;
/** Fusion Euler angles from firmware are in rad within approximately (−π, π]. */
export const EULER_OVERLAY_Y_MIN = -Math.PI * 1.02;
export const EULER_OVERLAY_Y_MAX = Math.PI * 1.02;

/** Solid fallback when cubemap load fails. */
export const SCENE_BACKGROUND_FALLBACK_HEX = "#09090b";

/**
 * Default for the rotation preview **env reflections** toggle (cubemap on `scene.environment`).
 * Background cubemap is controlled separately (`showBackgroundTexture` in the viewport).
 */
export const ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL = true;

/**
 * Scales engine environment intensity when applying `scene.environment`.
 */
export const ROTATION_PREVIEW_ENV_INTENSITY_SCALE = 1;

/**
 * When Sparkles (full IBL) is **off**, multiply env intensity by this instead of removing
 * `scene.environment`. Full-metal materials need some environment or they render black.
 */
export const ROTATION_PREVIEW_IBL_OFF_ENV_INTENSITY_FRAC = 0.45;

/** Minimal non-directional fill; most shading comes from `scene.environment`. */
export const ROTATION_PREVIEW_AMBIENT_INTENSITY = 0.22;

/**
 * Renderer exposure after tone mapping (ACES) for the rotation preview `Canvas`.
 */
export const ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE = 0.55;

export const GROUND_GRID_Y = -0.08;

/**
 * @deprecated No longer applied — GLB bodies use export-authored transforms. Kept for docs migration.
 */
export const BOARD_GROUP_POSITION_Y = 0;

/**
 * If glTF leaves `envMapIntensity` at 0, `scene.environment` has no effect on that material.
 */
export const ROTATION_PREVIEW_MIN_MATERIAL_ENV_MAP_INTENSITY = 1;

export const BODY_AXIS_ARROW_LENGTH = 1.05;
export const BODY_AXIS_ARROW_HEAD_LENGTH = 0.16;
export const BODY_AXIS_ARROW_HEAD_WIDTH = 0.08;
export const BODY_AXIS_COLORS = {
  x: "#ef4444",
  y: "#22c55e",
  z: "#3b82f6",
} as const;

/**
 * Matte canvas strokes for Euler wire overlay — pitch (red), yaw (green), roll (blue), same hue family as {@link BODY_AXIS_COLORS}.
 */
export const EULER_WIRE_OVERLAY_STROKE_MATTE = {
  pitch: "#c47070",
  roll: "#5f92d4",
  yaw: "#56a67c",
} as const;

export const PSOC_E84_GLB_RELATIVE_PATH = "models/psoc-e84-ai/psoc-e84-ai.glb";

/**
 * Default placement for all catalog / preview GLB bodies: keep Blender export
 * position, rotation, and scale (`authored`). Use `bbox-floor` or `bbox-center` only when needed.
 */
export const GLB_PREVIEW_BODY_PLACEMENT_MODE = "authored" as const;

/**
 * @deprecated Preview bodies use export scale. Use catalog `animationLab.transform` to override.
 */
export const ROTATION_PREVIEW_BODY_GLB_SCALE = 1;

/**
 * Initial perspective camera position (world, Y-up). Keep GLB at scale 1 and move the camera
 * instead of shrinking the mesh when you want a smaller on-screen footprint.
 * `[0, 10, 2.8]` — elevated + slight +Z so OrbitControls does not sit on the polar axis (pure `[0,10,0]`).
 */
export const ROTATION_PREVIEW_CAMERA_POSITION: readonly [
  number,
  number,
  number,
] = [0, 15, 15];

const rotationPreviewCameraDistanceFromOrigin = Math.hypot(
  ROTATION_PREVIEW_CAMERA_POSITION[0],
  ROTATION_PREVIEW_CAMERA_POSITION[1],
  ROTATION_PREVIEW_CAMERA_POSITION[2],
);

/**
 * **`OrbitControls` `maxDistance`** — if this is smaller than the distance from `target` (origin)
 * to {@link ROTATION_PREVIEW_CAMERA_POSITION}, drei clamps the camera toward the target (often to
 * ~14 when maxDistance was hard-coded). Then changing camera XY/Z appears to do nothing.
 */
export const ROTATION_PREVIEW_ORBIT_MAX_DISTANCE = Math.min(
  1e6,
  Math.max(48, Math.ceil(rotationPreviewCameraDistanceFromOrigin * 1.35)),
);

/** Infinite grid `fadeDistance`; scales with orbit radius when the camera is far from the origin. */
export const ROTATION_PREVIEW_GRID_FADE_DISTANCE = Math.min(
  4000,
  Math.max(48, Math.ceil(rotationPreviewCameraDistanceFromOrigin * 2)),
);
