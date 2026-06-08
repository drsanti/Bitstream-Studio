import { create } from "zustand";
import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import { parsePageV1 } from "../schemas/page.v1";
import type { PageMetaV1 } from "../schemas/pageMeta";
import { DEFAULT_PAGE_META } from "../schemas/pageMeta";
import {
  EMPTY_HISTORY_STACKS,
  pushHistorySnapshot,
  redoHistory,
  undoHistory,
  type HistoryStacks,
} from "./historyStacks";

function clonePage(page: PageV1): PageV1 {
  return parsePageV1(structuredClone(page));
}

type PageMutationOptions = {
  recordUndo?: boolean;
};

type CoursePageEditorState = {
  sourcePath: string;
  baseline: PageV1 | null;
  page: PageV1 | null;
  selectedBlockId: string | null;
  dirty: boolean;
  historyStacks: HistoryStacks<PageV1>;
  initPage: (page: PageV1, sourcePath: string) => void;
  selectBlock: (blockId: string | null) => void;
  pushPageUndoSnapshot: () => void;
  updateBlock: (blockId: string, patch: Partial<PageBlockV1>, options?: PageMutationOptions) => void;
  updatePlacement: (
    blockId: string,
    placement: Partial<PageBlockV1["placement"]>,
    options?: PageMutationOptions,
  ) => void;
  updatePageTitle: (title: string, options?: PageMutationOptions) => void;
  updatePageMeta: (patch: Partial<PageMetaV1>, options?: PageMutationOptions) => void;
  undoPage: () => void;
  redoPage: () => void;
  discardChanges: () => void;
  markClean: (page?: PageV1) => void;
  addBlock: (block: PageBlockV1, options?: PageMutationOptions) => void;
  removeBlock: (blockId: string, options?: PageMutationOptions) => void;
};

export const useCoursePageEditorStore = create<CoursePageEditorState>((set, get) => ({
  sourcePath: "",
  baseline: null,
  page: null,
  selectedBlockId: null,
  dirty: false,
  historyStacks: EMPTY_HISTORY_STACKS,
  initPage: (page, sourcePath) => {
    const snapshot = clonePage(page);
    set({
      sourcePath,
      baseline: snapshot,
      page: clonePage(snapshot),
      selectedBlockId: null,
      dirty: false,
      historyStacks: EMPTY_HISTORY_STACKS,
    });
  },
  pushPageUndoSnapshot: () => {
    const page = get().page;
    if (page == null) {
      return;
    }
    set((state) => ({
      historyStacks: pushHistorySnapshot(state.historyStacks, clonePage(page)),
    }));
  },
  selectBlock: (blockId) => set({ selectedBlockId: blockId }),
  updateBlock: (blockId, patch, options) => {
    const current = get().page;
    if (current == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    const blocks = current.blocks.map((block) =>
      block.id === blockId ? ({ ...block, ...patch } as PageBlockV1) : block,
    );
    set({ page: { ...current, blocks }, dirty: true });
  },
  updatePlacement: (blockId, placement, options) => {
    const current = get().page;
    if (current == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    const blocks = current.blocks.map((block) =>
      block.id === blockId
        ? { ...block, placement: { ...block.placement, ...placement } }
        : block,
    );
    set({ page: { ...current, blocks }, dirty: true });
  },
  updatePageTitle: (title, options) => {
    const current = get().page;
    if (current == null || title.trim().length === 0) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    set({ page: { ...current, title: title.trim() }, dirty: true });
  },
  updatePageMeta: (patch, options) => {
    const current = get().page;
    if (current == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    const prev = current.meta ?? DEFAULT_PAGE_META;
    const next: PageMetaV1 = { ...DEFAULT_PAGE_META, ...prev, ...patch };
    if ("staleMs" in patch && patch.staleMs === undefined) {
      delete next.staleMs;
    }
    set({
      page: { ...current, meta: next },
      dirty: true,
    });
  },
  undoPage: () => {
    const page = get().page;
    if (page == null) {
      return;
    }
    const result = undoHistory(get().historyStacks, clonePage(page));
    if (result.snapshot == null) {
      return;
    }
    set({
      page: clonePage(result.snapshot),
      dirty: true,
      historyStacks: result.stacks,
    });
  },
  redoPage: () => {
    const page = get().page;
    if (page == null) {
      return;
    }
    const result = redoHistory(get().historyStacks, clonePage(page));
    if (result.snapshot == null) {
      return;
    }
    set({
      page: clonePage(result.snapshot),
      dirty: true,
      historyStacks: result.stacks,
    });
  },
  discardChanges: () => {
    const baseline = get().baseline;
    if (baseline == null) {
      return;
    }
    set({
      page: clonePage(baseline),
      dirty: false,
      selectedBlockId: null,
      historyStacks: EMPTY_HISTORY_STACKS,
    });
  },
  markClean: (page) => {
    const next = page ?? get().page;
    if (next == null) {
      return;
    }
    const snapshot = clonePage(next);
    set({
      baseline: snapshot,
      page: snapshot,
      dirty: false,
      historyStacks: EMPTY_HISTORY_STACKS,
    });
  },
  addBlock: (block, options) => {
    const current = get().page;
    if (current == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    set({
      page: { ...current, blocks: [...current.blocks, block] },
      selectedBlockId: block.id,
      dirty: true,
    });
  },
  removeBlock: (blockId, options) => {
    const current = get().page;
    if (current == null || current.blocks.length <= 1) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    set({
      page: { ...current, blocks: current.blocks.filter((b) => b.id !== blockId) },
      selectedBlockId: get().selectedBlockId === blockId ? null : get().selectedBlockId,
      dirty: true,
    });
  },
}));
