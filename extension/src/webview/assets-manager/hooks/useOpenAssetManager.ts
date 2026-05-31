import { useCallback } from "react";
import type { AssetCategory } from "../registry/asset.types.js";
import type { GlobalDirectoriesTabValue, AssetManagerMainTab } from "../store/assetManagerUi.store.js";
import { useAssetManagerUiStore } from "../store/assetManagerUi.store.js";

export type OpenAssetManagerOptions = {
  /** Top-level tab: browse assets or storage / paths. */
  mainTab?: AssetManagerMainTab;
  /** When opening Browse, pre-select Models / Environments / Textures. */
  browseCategory?: AssetCategory;
  /** When opening Storage, pre-select a Global Directories sub-tab. */
  globalDirectoriesTab?: GlobalDirectoriesTabValue;
};

export type UseOpenAssetManagerResult = {
  isOpen: boolean;
  openAssetManager: (opts?: OpenAssetManagerOptions) => void;
  closeAssetManager: () => void;
  toggleAssetManager: () => void;
};

/**
 * Consumer-facing API to open/close the global Asset Manager UI.
 */
export function useOpenAssetManager(): UseOpenAssetManagerResult {
  const isOpen = useAssetManagerUiStore((s) => s.panelOpen);
  const openPanel = useAssetManagerUiStore((s) => s.openPanel);
  const closePanel = useAssetManagerUiStore((s) => s.closePanel);
  const togglePanel = useAssetManagerUiStore((s) => s.togglePanel);

  const openAssetManager = useCallback(
    (opts?: OpenAssetManagerOptions) => {
      openPanel({
        mainTab: opts?.mainTab,
        browseCategory: opts?.browseCategory,
        globalDirectoriesTab: opts?.globalDirectoriesTab,
      });
    },
    [openPanel],
  );

  return {
    isOpen,
    openAssetManager,
    closeAssetManager: closePanel,
    toggleAssetManager: togglePanel,
  };
}
