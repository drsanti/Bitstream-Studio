import {
  AssetRegistryProvider,
  useAssetRegistry,
  type AssetRegistryContextValue,
} from "../../../assets-manager/registry/AssetRegistryProvider.js";

export type StudioAssetBridgeSlotProps = AssetRegistryContextValue["bridgeSlotProps"];
export type StudioAssetDescriptorsContextValue = AssetRegistryContextValue;

/** Global asset registry — mount {@link AssetRegistryProvider} on {@link BitstreamShellMain}. */
export const StudioAssetDescriptorsProvider = AssetRegistryProvider;

export function useStudioAssetDescriptors(): StudioAssetDescriptorsContextValue {
  return useAssetRegistry();
}

export { AssetRegistryProvider, useAssetRegistry };
