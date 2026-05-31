import { useAssetManagerUiStore } from "../store/assetManagerUi.store.js";

/** Opens the global Asset Manager on Browse → Models (replaces the legacy Model Catalog modal). */
export function openAssetManagerBrowseModels(): void {
  useAssetManagerUiStore.getState().openPanel({
    mainTab: "browse",
    browseCategory: "model",
  });
}
