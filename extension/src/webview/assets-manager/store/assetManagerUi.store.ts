import { create } from "zustand";
import type { AssetCategory } from "../registry/asset.types.js";

const GLOBAL_DIRECTORIES_TAB_VALUES = [
  "overview",
  "disk",
  "runtime",
  "actions",
] as const;

export type GlobalDirectoriesTabValue =
  (typeof GLOBAL_DIRECTORIES_TAB_VALUES)[number];

export type AssetManagerMainTab = "browse" | "storage";

function isGlobalDirectoriesTabValue(v: unknown): v is GlobalDirectoriesTabValue {
  return (
    typeof v === "string" &&
    (GLOBAL_DIRECTORIES_TAB_VALUES as readonly string[]).includes(v)
  );
}

function isAssetManagerMainTab(v: unknown): v is AssetManagerMainTab {
  return v === "browse" || v === "storage";
}

function isAssetCategory(v: unknown): v is AssetCategory {
  return v === "model" || v === "environment" || v === "texture" || v === "library";
}

export type OpenAssetManagerPanelOptions = {
  mainTab?: AssetManagerMainTab;
  browseCategory?: AssetCategory;
  globalDirectoriesTab?: GlobalDirectoriesTabValue;
};

export type AssetManagerUiState = {
  panelOpen: boolean;
  requestedMainTab: AssetManagerMainTab | null;
  requestedBrowseCategory: AssetCategory | null;
  requestedGlobalDirectoriesTab: GlobalDirectoriesTabValue | null;
  openPanel: (opts?: OpenAssetManagerPanelOptions) => void;
  closePanel: () => void;
  togglePanel: () => void;
  consumeRequestedMainTab: () => AssetManagerMainTab | null;
  consumeRequestedBrowseCategory: () => AssetCategory | null;
  consumeRequestedGlobalDirectoriesTab: () => GlobalDirectoriesTabValue | null;
};

export const useAssetManagerUiStore = create<AssetManagerUiState>((set) => ({
  panelOpen: false,
  requestedMainTab: null,
  requestedBrowseCategory: null,
  requestedGlobalDirectoriesTab: null,
  openPanel: (opts) =>
    set({
      panelOpen: true,
      requestedMainTab:
        opts?.mainTab && isAssetManagerMainTab(opts.mainTab) ? opts.mainTab : null,
      requestedBrowseCategory:
        opts?.browseCategory && isAssetCategory(opts.browseCategory)
          ? opts.browseCategory
          : null,
      requestedGlobalDirectoriesTab:
        opts?.globalDirectoriesTab && isGlobalDirectoriesTabValue(opts.globalDirectoriesTab)
          ? opts.globalDirectoriesTab
          : null,
    }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  consumeRequestedMainTab: () => {
    let next: AssetManagerMainTab | null = null;
    set((s) => {
      next = s.requestedMainTab;
      return { requestedMainTab: null };
    });
    return next;
  },
  consumeRequestedBrowseCategory: () => {
    let next: AssetCategory | null = null;
    set((s) => {
      next = s.requestedBrowseCategory;
      return { requestedBrowseCategory: null };
    });
    return next;
  },
  consumeRequestedGlobalDirectoriesTab: () => {
    let next: GlobalDirectoriesTabValue | null = null;
    set((s) => {
      next = s.requestedGlobalDirectoriesTab;
      return { requestedGlobalDirectoriesTab: null };
    });
    return next;
  },
}));
