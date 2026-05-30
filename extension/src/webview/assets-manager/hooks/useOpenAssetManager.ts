import { useCallback } from "react";
import type { GlobalDirectoriesTabValue } from "../store/assetManagerUi.store.js";
import { useAssetManagerUiStore } from "../store/assetManagerUi.store.js";

export type OpenAssetManagerOptions = {
  /** v1: selects the Global Directories tab on open. */
  globalDirectoriesTab?: GlobalDirectoriesTabValue;
};

export type UseOpenAssetManagerResult = {
  isOpen: boolean;
  openAssetManager: (opts?: OpenAssetManagerOptions) => void;
  closeAssetManager: () => void;
  toggleAssetManager: () => void;
};

/**
 * Consumer-facing API to open/close the Asset Manager UI.
 * Keeps Bitstream, Sensor Studio, and future consumers from reaching into
 * `useAssetManagerUiStore()` directly.
 */
export function useOpenAssetManager(): UseOpenAssetManagerResult {
  const isOpen = useAssetManagerUiStore((s) => s.panelOpen);
  const openPanel = useAssetManagerUiStore((s) => s.openPanel);
  const closePanel = useAssetManagerUiStore((s) => s.closePanel);
  const togglePanel = useAssetManagerUiStore((s) => s.togglePanel);

  const openAssetManager = useCallback(
    (opts?: OpenAssetManagerOptions) => {
      openPanel({ globalDirectoriesTab: opts?.globalDirectoriesTab });
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

