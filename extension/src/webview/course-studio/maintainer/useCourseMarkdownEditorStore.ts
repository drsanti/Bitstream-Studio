import { create } from "zustand";

type CourseMarkdownEditorState = {
  sourcePaths: Record<string, string>;
  baselines: Record<string, string>;
  drafts: Record<string, string>;
  dirty: Record<string, boolean>;
  initMarkdown: (src: string, text: string, sourcePath: string) => void;
  setDraftText: (src: string, text: string) => void;
  discardMarkdown: (src: string) => void;
  markMarkdownClean: (src: string, text?: string) => void;
  isMarkdownDirty: (src: string) => boolean;
};

export const useCourseMarkdownEditorStore = create<CourseMarkdownEditorState>((set, get) => ({
  sourcePaths: {},
  baselines: {},
  drafts: {},
  dirty: {},
  initMarkdown: (src, text, sourcePath) => {
    set((state) => ({
      sourcePaths: { ...state.sourcePaths, [src]: sourcePath },
      baselines: { ...state.baselines, [src]: text },
      drafts: { ...state.drafts, [src]: text },
      dirty: { ...state.dirty, [src]: false },
    }));
  },
  setDraftText: (src, text) => {
    set((state) => ({
      drafts: { ...state.drafts, [src]: text },
      dirty: { ...state.dirty, [src]: true },
    }));
  },
  discardMarkdown: (src) => {
    const baseline = get().baselines[src];
    if (baseline == null) {
      return;
    }
    set((state) => ({
      drafts: { ...state.drafts, [src]: baseline },
      dirty: { ...state.dirty, [src]: false },
    }));
  },
  markMarkdownClean: (src, text) => {
    const next = text ?? get().drafts[src];
    if (next == null) {
      return;
    }
    set((state) => ({
      baselines: { ...state.baselines, [src]: next },
      drafts: { ...state.drafts, [src]: next },
      dirty: { ...state.dirty, [src]: false },
    }));
  },
  isMarkdownDirty: (src) => get().dirty[src] === true,
}));
