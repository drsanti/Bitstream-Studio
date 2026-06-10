export const MARKDOWN_EDITOR_VIEW_PREFS_STORAGE_KEY = "course-studio.markdown-editor.view.v1";

export type MarkdownEditorViewMode = "edit" | "split" | "preview";

export type MarkdownEditorViewPrefsV1 = {
  viewMode: MarkdownEditorViewMode;
  syncScroll: boolean;
  previewHidden: boolean;
  /** Workbench heading outline sidebar. */
  outlineVisible: boolean;
  /** Editor source font scale in percent (75–200). */
  editorZoom: number;
};

import {
  clampMarkdownEditorZoom,
  MARKDOWN_EDITOR_ZOOM_DEFAULT,
} from "./markdownEditorZoom";

export function defaultMarkdownEditorViewPrefs(): MarkdownEditorViewPrefsV1 {
  return {
    viewMode: "split",
    syncScroll: true,
    previewHidden: false,
    outlineVisible: true,
    editorZoom: MARKDOWN_EDITOR_ZOOM_DEFAULT,
  };
}

export function loadMarkdownEditorViewPrefs(): MarkdownEditorViewPrefsV1 {
  if (typeof localStorage === "undefined") {
    return defaultMarkdownEditorViewPrefs();
  }
  try {
    const raw = localStorage.getItem(MARKDOWN_EDITOR_VIEW_PREFS_STORAGE_KEY);
    if (raw == null) {
      return defaultMarkdownEditorViewPrefs();
    }
    const parsed = JSON.parse(raw) as Partial<MarkdownEditorViewPrefsV1>;
    const viewMode =
      parsed.viewMode === "edit" || parsed.viewMode === "split" || parsed.viewMode === "preview"
        ? parsed.viewMode
        : "split";
    return {
      viewMode,
      syncScroll: parsed.syncScroll !== false,
      previewHidden: parsed.previewHidden === true,
      outlineVisible: parsed.outlineVisible !== false,
      editorZoom: clampMarkdownEditorZoom(
        typeof parsed.editorZoom === "number" ? parsed.editorZoom : MARKDOWN_EDITOR_ZOOM_DEFAULT,
      ),
    };
  } catch {
    return defaultMarkdownEditorViewPrefs();
  }
}

export function saveMarkdownEditorViewPrefs(prefs: MarkdownEditorViewPrefsV1): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(MARKDOWN_EDITOR_VIEW_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}
