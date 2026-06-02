/** Sentinel catalog id for the default PSoC preview mesh. */
export const ANIMATION_LAB_DEFAULT_MODEL_ID = "__animation_lab_psoc_e84__";

export const ANIMATION_LAB_STORAGE_PREFIX = "bitstream:animation-lab";

/**
 * CSS3D tags render DOM at this factor, then world scale is divided by the same
 * value so labels stay sharp when the camera zooms in (avoids upscaling soft pixels).
 */
export const TWIN_TAG_CSS3D_HIRES_SCALE = 2;

/** Default 3D tag card / typography sizing multiplier (2026-06 — booth readability). */
export const TWIN_TAG_DEFAULT_SIZE_SCALE = 3;

/** Fired when catalog / asset browse requests a model switch in the lab viewport. */
export const ANIMATION_LAB_OPEN_MODEL_EVENT = "bitstream:animation-lab-open-model";
