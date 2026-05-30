/** Shared with toolbar title (background-clip) and globe icon (SVG stroke url). */
export const BRAND_WAVE_GRADIENT_ID = "bitstream-brand-stroke-wave";

/**
 * Horizontal gradient so `background-position-x` moves along the same axis as the color sweep.
 * Two identical waves (0–50% and 50–100%) tile with `background-size: 200%` → 0% and 100%
 * positions match and the loop has no seam.
 */
export const BRAND_TITLE_GRADIENT =
  "linear-gradient(90deg, #a1a1aa 0%, #22d3ee 9%, #c084fc 21%, #4ade80 33%, #fbbf24 44%, #a1a1aa 50%, #22d3ee 59%, #c084fc 71%, #4ade80 83%, #fbbf24 94%, #a1a1aa 100%)";

/** One full seamless cycle (seconds); ~3× faster than the original 10s wave. */
export const BRAND_WAVE_DURATION_S = 10 / 3;

