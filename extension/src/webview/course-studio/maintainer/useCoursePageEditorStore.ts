import { create } from "zustand";
import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import { parsePageV1 } from "../schemas/page.v1";
import type { PageMetaV1 } from "../schemas/pageMeta";
import { DEFAULT_PAGE_META } from "../schemas/pageMeta";
import type { PageGridChrome } from "../schemas/pageGridChrome";
import { patchPageGridChrome } from "../schemas/pageGridChrome";
import {
  EMPTY_HISTORY_STACKS,
  pushHistorySnapshot,
  redoHistory,
  undoHistory,
  type HistoryStacks,
} from "./historyStacks";
import { dashboardPrimaryHighlightedWidgetId } from "../../sensor-studio/core/dashboard/dashboard-widget-selection";
import type { GridPlacementV1 } from "../schemas/placement";

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
  /** Ordered selection — last id is the primary (resize / inspector anchor). */
  selectedBlockIds: string[];
  /** Primary selected block — mirrors last entry in {@link selectedBlockIds}. */
  selectedBlockId: string | null;
  dirty: boolean;
  historyStacks: HistoryStacks<PageV1>;
  initPage: (page: PageV1, sourcePath: string, options?: { dirty?: boolean }) => void;
  setBlockSelection: (blockIds: string[]) => void;
  selectBlock: (blockId: string | null) => void;
  pushPageUndoSnapshot: () => void;
  updateBlock: (blockId: string, patch: Partial<PageBlockV1>, options?: PageMutationOptions) => void;
  updatePlacement: (
    blockId: string,
    placement: Partial<PageBlockV1["placement"]>,
    options?: PageMutationOptions,
  ) => void;
  updatePlacements: (
    updates: ReadonlyArray<{ blockId: string; placement: GridPlacementV1 }>,
    options?: PageMutationOptions,
  ) => void;
  updatePageTitle: (title: string, options?: PageMutationOptions) => void;
  updatePageMeta: (patch: Partial<PageMetaV1>, options?: PageMutationOptions) => void;
  updatePageGridChrome: (patch: Partial<PageGridChrome>, options?: PageMutationOptions) => void;
  applyPageGridChrome: (chrome: PageGridChrome | undefined, options?: PageMutationOptions) => void;
  setBlocks: (blocks: PageBlockV1[], options?: PageMutationOptions) => void;
  undoPage: () => void;
  redoPage: () => void;
  discardChanges: () => void;
  markClean: (page?: PageV1) => void;
  addBlock: (block: PageBlockV1, options?: PageMutationOptions) => void;
  removeBlock: (blockId: string, options?: PageMutationOptions) => void;
  removeBlocks: (blockIds: readonly string[], options?: PageMutationOptions) => void;
};

function blockSelectionState(blockIds: string[]) {
  const selectedBlockIds = [...new Set(blockIds.filter(Boolean))];
  return {
    selectedBlockIds,
    selectedBlockId: dashboardPrimaryHighlightedWidgetId(selectedBlockIds),
  };
}

export const useCoursePageEditorStore = create<CoursePageEditorState>((set, get) => ({
  sourcePath: "",
  baseline: null,
  page: null,
  selectedBlockIds: [],
  selectedBlockId: null,
  dirty: false,
  historyStacks: EMPTY_HISTORY_STACKS,
  initPage: (page, sourcePath, options) => {
    const snapshot = clonePage(page);
    set({
      sourcePath,
      baseline: snapshot,
      page: clonePage(snapshot),
      selectedBlockIds: [],
      selectedBlockId: null,
      dirty: options?.dirty === true,
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
  setBlockSelection: (blockIds) => set(blockSelectionState(blockIds)),
  selectBlock: (blockId) => set(blockSelectionState(blockId == null ? [] : [blockId])),
  updateBlock: (blockId, patch, options) => {
    const current = get().page;
    if (current == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    const blocks = current.blocks.map((block) => {
      if (block.id !== blockId) {
        return block;
      }
      let next = { ...block, ...patch } as PageBlockV1 & {
        icon?: string;
        iconColor?: string;
        iconAnimation?: unknown;
      };
      if ("icon" in patch && patch.icon === undefined) {
        const { icon: _removedIcon, ...rest } = next;
        next = rest as typeof next;
      }
      if ("iconColor" in patch && patch.iconColor === undefined) {
        const { iconColor: _removedColor, ...rest } = next;
        next = rest as typeof next;
      }
      if ("iconAnimation" in patch && patch.iconAnimation === undefined) {
        const { iconAnimation: _removedAnimation, ...rest } = next;
        next = rest as typeof next;
      }
      return next as PageBlockV1;
    });
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
  updatePlacements: (updates, options) => {
    const current = get().page;
    if (current == null || updates.length === 0) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    const byId = new Map(updates.map((update) => [update.blockId, update.placement]));
    const blocks = current.blocks.map((block) => {
      const placement = byId.get(block.id);
      return placement == null ? block : { ...block, placement };
    });
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
    if ("cardColors" in patch && patch.cardColors === undefined) {
      delete next.cardColors;
    }
    if ("markdownColors" in patch && patch.markdownColors === undefined) {
      delete next.markdownColors;
    }
    if ("cardThemePresetId" in patch && patch.cardThemePresetId === undefined) {
      delete next.cardThemePresetId;
    }
    if ("markdownThemePresetId" in patch && patch.markdownThemePresetId === undefined) {
      delete next.markdownThemePresetId;
    }
    set({
      page: { ...current, meta: next },
      dirty: true,
    });
  },
  updatePageGridChrome: (patch, options) => {
    const current = get().page;
    if (current == null) {
      return;
    }
    get().applyPageGridChrome(patchPageGridChrome(current.grid.chrome, patch), options);
  },
  applyPageGridChrome: (chrome, options) => {
    const current = get().page;
    if (current == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    const grid = { ...current.grid };
    if (chrome == null) {
      delete grid.chrome;
    } else {
      grid.chrome = chrome;
    }
    set({
      page: { ...current, grid },
      dirty: true,
    });
  },
  setBlocks: (blocks, options) => {
    const current = get().page;
    if (current == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    set({
      page: { ...current, blocks },
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
      selectedBlockIds: [],
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
      ...blockSelectionState([block.id]),
      dirty: true,
    });
  },
  removeBlock: (blockId, options) => {
    get().removeBlocks([blockId], options);
  },
  removeBlocks: (blockIds, options) => {
    const current = get().page;
    if (current == null || blockIds.length === 0) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushPageUndoSnapshot();
    }
    const idSet = new Set(blockIds);
    const remainingSelection = get().selectedBlockIds.filter((id) => !idSet.has(id));
    set({
      page: { ...current, blocks: current.blocks.filter((block) => !idSet.has(block.id)) },
      ...blockSelectionState(remainingSelection),
      dirty: true,
    });
  },
}));
