export const MARKDOWN_EDITOR_ZOOM_MIN = 75;
export const MARKDOWN_EDITOR_ZOOM_MAX = 200;
export const MARKDOWN_EDITOR_ZOOM_STEP = 10;
export const MARKDOWN_EDITOR_ZOOM_DEFAULT = 100;
/** Matches Tailwind `text-sm` (0.875rem) at 100% zoom. */
export const MARKDOWN_EDITOR_BASE_FONT_REM = 0.875;

export function clampMarkdownEditorZoom(percent: number): number {
  return Math.min(
    MARKDOWN_EDITOR_ZOOM_MAX,
    Math.max(
      MARKDOWN_EDITOR_ZOOM_MIN,
      Math.round(percent / MARKDOWN_EDITOR_ZOOM_STEP) * MARKDOWN_EDITOR_ZOOM_STEP,
    ),
  );
}

export function markdownEditorFontSizeRem(zoomPercent: number): number {
  return (MARKDOWN_EDITOR_BASE_FONT_REM * clampMarkdownEditorZoom(zoomPercent)) / 100;
}

export function nextMarkdownEditorZoom(current: number, wheelDeltaY: number): number {
  const step = wheelDeltaY > 0 ? -MARKDOWN_EDITOR_ZOOM_STEP : MARKDOWN_EDITOR_ZOOM_STEP;
  return clampMarkdownEditorZoom(current + step);
}
