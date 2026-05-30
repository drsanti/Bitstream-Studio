export * from "./store";
export * from "./hooks";
export { AssetManagerMain } from "./components/AssetManagerMain.js";
export type { AssetManagerMainProps } from "./components/AssetManagerMain.js";
/** Embed inline (workbench pane, drawer): same body as {@link AssetManagerMain} without `TRNWindow`. */
export { AssetManagerWorkspace } from "./components/AssetManagerWorkspace.js";
export type { GlobalDirectoriesPanelProps } from "./components/global-directories/GlobalDirectoriesPanel.js";
export {
  ASSET_MANAGER_SCAFFOLD_STORAGE_KEY,
  shouldShowAssetManagerMain,
} from "./shouldShowAssetManagerMain.js";
