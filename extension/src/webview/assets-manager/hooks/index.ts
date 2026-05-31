/**
 * Asset Manager hooks (e.g. `useAssetRuntimeConfig`) live in this folder.
 * See `../docs/ASSET_MANAGER_ARCHITECTURE.md`.
 */
export { useAssetManagerAltMShortcut } from "./useAssetManagerAltMShortcut.js";
export { AssetManagerProvider } from "../components/AssetManagerProvider.js";
export { AssetRegistryProvider, useAssetRegistry } from "../registry/AssetRegistryProvider.js";
export type { AssetRegistryContextValue } from "../registry/AssetRegistryProvider.js";
export { useAssetRuntimeConfig } from "./useAssetRuntimeConfig.js";
export type { AssetRuntimeConfig } from "./useAssetRuntimeConfig.js";
export { useOpenAssetManager } from "./useOpenAssetManager.js";
export { openAssetManagerBrowseModels } from "./openAssetManagerBrowseModels.js";
export type {
  OpenAssetManagerOptions,
  UseOpenAssetManagerResult,
} from "./useOpenAssetManager.js";
export { useExtensionDefaultDownloadPaths } from "./useExtensionDefaultDownloadPaths.js";
export type {
  ExtensionDefaultDownloadPaths,
  RevealPathResult,
} from "./useExtensionDefaultDownloadPaths.js";
export { useInjectedAssetBases } from "./useInjectedAssetBases.js";
export type {
  InjectedAssetBasesSnapshot,
  UseInjectedAssetBasesResult,
} from "./useInjectedAssetBases.js";
