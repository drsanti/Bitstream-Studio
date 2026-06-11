/**
 * Canonical dark-mode text ramp for Presentation / Course Studio.
 * Used by theme CSS vars and Course Studio block color picker defaults.
 */
import chroma from "chroma-js";

export const DARK_SURFACE_BASE = "#111113";

const darkSurface = chroma(DARK_SURFACE_BASE);

/** Chroma `brighten()` delta per readability step on dark surfaces. */
export const DARK_TEXT_BRIGHTEN_STEP = 0.7;

const DARK_TEXT_READABILITY_LIFT = DARK_TEXT_BRIGHTEN_STEP * 2;

function darkTextBrighten(baseOffset: number): string {
  return darkSurface.brighten(baseOffset + DARK_TEXT_READABILITY_LIFT).hex();
}

/** Small widget labels / units — Tailwind zinc-300 (+2 steps from zinc-500). */
export const PRESENTATION_DARK_TEXT_META = "#d4d4d8";

/** Doc accent — links, interactive prose (steel blue). */
export const PRESENTATION_DARK_ACCENT_BLUE = "#4783ad";

/** Inline code — lighter blue-white derived from accent blue. */
export const PRESENTATION_DARK_TEXT_CODE = chroma
  .mix(PRESENTATION_DARK_ACCENT_BLUE, "#e8f0f6", 0.35)
  .hex();

/** Live numeric readouts — blue-white digits on dashboard widgets. */
export const PRESENTATION_DARK_TEXT_LIVE_VALUE = chroma
  .mix(PRESENTATION_DARK_ACCENT_BLUE, "#f5f5f5", 0.62)
  .hex();

/** Subtle status bar under live numeric widgets. */
export const PRESENTATION_DARK_TEXT_LIVE_TRACK = chroma
  .mix(PRESENTATION_DARK_ACCENT_BLUE, "#27272a", 0.55)
  .hex();

export const PRESENTATION_DARK_TEXT_COLORS = {
  primary: "#f5f5f5",
  secondary: darkTextBrighten(2.15),
  prose: darkTextBrighten(2.85),
  muted: darkTextBrighten(1.55),
  meta: PRESENTATION_DARK_TEXT_META,
  link: PRESENTATION_DARK_ACCENT_BLUE,
  code: PRESENTATION_DARK_TEXT_CODE,
  liveValue: PRESENTATION_DARK_TEXT_LIVE_VALUE,
} as const;

/** Default fenced-code Prism theme for Course Studio markdown (calmer than One Dark). */
export const COURSE_MARKDOWN_DEFAULT_CODE_SYNTAX_THEME = "nord" as const;
