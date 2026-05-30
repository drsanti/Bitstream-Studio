import type { GlassModalBodyDensity } from "./types";

/**
 * Pixel-based spacing for the draggable glass modal. Tune numbers here.
 *
 * - **Body padding**: one value → same inset on all four sides (like CSS `padding: Npx`).
 * - **Shell margin**: one value → margin on every side of the fixed shell.
 * - **Main slot padding-top**: extra space above main content (separate from uniform body padding).
 */

/** Margin (px) on all sides of the fixed shell (outside the modal box). `0` = flush to positioned `top`/`left`. */
export const GLASS_MODAL_SHELL_MARGIN_PX = 0;

/**
 * Uniform padding (px) on every side between the glass inner edge and the body column.
 * Example: `20` → 20px top, right, bottom, and left.
 */
export const GLASS_MODAL_BODY_PADDING_PX: Record<
  GlassModalBodyDensity,
  number
> = {
  default: 20,
  /** Example: `5` → 5px top, right, bottom, and left. */
  compact: 5,
};

/**
 * Extra `padding-top` (px) on the main slot (inside the body padding).
 * Lets you space content below the title/description without changing the uniform edge inset.
 * Set to `0` if you only want `GLASS_MODAL_BODY_PADDING_PX` controlling vertical space.
 */
export const GLASS_MODAL_MAIN_SLOT_PADDING_TOP_PX: Record<
  GlassModalBodyDensity,
  { withDescription: number; withoutDescription: number }
> = {
  default: {
    withDescription: 20,
    withoutDescription: 12,
  },
  compact: {
    withDescription: 10,
    withoutDescription: 0,
  },
};
