export const MARKDOWN_EDITOR_EMBEDDED_HEIGHT_STORAGE_KEY =
  "course-studio.markdown-editor.embedded-height.v1";

/** Default embedded editor shell height (12rem @ 16px root). */
export const MARKDOWN_EDITOR_EMBEDDED_DEFAULT_HEIGHT_PX = 192;

/** Minimum shell height while resizing (8rem). */
export const MARKDOWN_EDITOR_EMBEDDED_MIN_HEIGHT_PX = 128;

/** Maximum shell height while resizing (32rem). */
export const MARKDOWN_EDITOR_EMBEDDED_MAX_HEIGHT_PX = 512;

export function clampMarkdownEditorEmbeddedHeightPx(value: number): number {
  if (!Number.isFinite(value)) {
    return MARKDOWN_EDITOR_EMBEDDED_DEFAULT_HEIGHT_PX;
  }
  return Math.round(
    Math.min(
      MARKDOWN_EDITOR_EMBEDDED_MAX_HEIGHT_PX,
      Math.max(MARKDOWN_EDITOR_EMBEDDED_MIN_HEIGHT_PX, value),
    ),
  );
}

export function loadMarkdownEditorEmbeddedHeightPx(): number {
  if (typeof localStorage === "undefined") {
    return MARKDOWN_EDITOR_EMBEDDED_DEFAULT_HEIGHT_PX;
  }
  try {
    const raw = localStorage.getItem(MARKDOWN_EDITOR_EMBEDDED_HEIGHT_STORAGE_KEY);
    if (raw == null) {
      return MARKDOWN_EDITOR_EMBEDDED_DEFAULT_HEIGHT_PX;
    }
    const parsed = JSON.parse(raw) as { heightPx?: unknown };
    if (typeof parsed.heightPx !== "number") {
      return MARKDOWN_EDITOR_EMBEDDED_DEFAULT_HEIGHT_PX;
    }
    return clampMarkdownEditorEmbeddedHeightPx(parsed.heightPx);
  } catch {
    return MARKDOWN_EDITOR_EMBEDDED_DEFAULT_HEIGHT_PX;
  }
}

export function saveMarkdownEditorEmbeddedHeightPx(heightPx: number): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(
    MARKDOWN_EDITOR_EMBEDDED_HEIGHT_STORAGE_KEY,
    JSON.stringify({ heightPx: clampMarkdownEditorEmbeddedHeightPx(heightPx) }),
  );
}

export function nextMarkdownEditorEmbeddedHeightPx(
  startHeightPx: number,
  deltaY: number,
): number {
  return clampMarkdownEditorEmbeddedHeightPx(startHeightPx + deltaY);
}
