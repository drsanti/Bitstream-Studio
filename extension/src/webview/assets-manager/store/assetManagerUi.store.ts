import { create } from "zustand";

const GLOBAL_DIRECTORIES_TAB_VALUES = [
  "overview",
  "disk",
  "runtime",
  "actions",
] as const;

export type GlobalDirectoriesTabValue =
  (typeof GLOBAL_DIRECTORIES_TAB_VALUES)[number];

function isGlobalDirectoriesTabValue(v: unknown): v is GlobalDirectoriesTabValue {
  return (
    typeof v === "string" &&
    (GLOBAL_DIRECTORIES_TAB_VALUES as readonly string[]).includes(v)
  );
}

export type AssetManagerUiState = {
  panelOpen: boolean;
  /** When set, Global Directories will switch to this tab on next open. */
  requestedGlobalDirectoriesTab: GlobalDirectoriesTabValue | null;
  openPanel: (opts?: { globalDirectoriesTab?: GlobalDirectoriesTabValue }) => void;
  closePanel: () => void;
  togglePanel: () => void;
  /** Internal: called by Global Directories to consume a one-shot request. */
  consumeRequestedGlobalDirectoriesTab: () => GlobalDirectoriesTabValue | null;
};

export const useAssetManagerUiStore = create<AssetManagerUiState>((set) => ({
  panelOpen: false,
  requestedGlobalDirectoriesTab: null,
  openPanel: (opts) =>
    set({
      panelOpen: true,
      requestedGlobalDirectoriesTab:
        opts?.globalDirectoriesTab && isGlobalDirectoriesTabValue(opts.globalDirectoriesTab)
          ? opts.globalDirectoriesTab
          : null,
    }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  consumeRequestedGlobalDirectoriesTab: () => {
    let next: GlobalDirectoriesTabValue | null = null;
    set((s) => {
      next = s.requestedGlobalDirectoriesTab;
      return { requestedGlobalDirectoriesTab: null };
    });
    return next;
  },
}));
