import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  getAssetSourceStrategy,
  type AssetSourceStrategy,
} from "../../asset-source-strategy.js";
import {
  useInjectedAssetBases,
  type UseInjectedAssetBasesResult,
} from "../hooks/useInjectedAssetBases.js";

export type AssetRuntimeConfig = UseInjectedAssetBasesResult & {
  strategy: AssetSourceStrategy;
};

const AssetRuntimeConfigContext = createContext<AssetRuntimeConfig | null>(null);

/**
 * Runs {@link useInjectedAssetBases} once for the subtree and exposes merged runtime
 * fields (including {@link getAssetSourceStrategy}) via {@link useAssetRuntimeConfig}.
 */
export function AssetManagerProvider({ children }: { children: ReactNode }) {
  const injected = useInjectedAssetBases();
  const strategy = useMemo(
    () => getAssetSourceStrategy(),
    [injected.snapshot, injected.lastHostRefreshAt],
  );
  const value = useMemo(
    (): AssetRuntimeConfig => ({
      ...injected,
      strategy,
    }),
    [
      injected.isExtensionHost,
      injected.snapshot,
      injected.refreshing,
      injected.lastHostRefreshAt,
      injected.statusMessage,
      injected.refreshFromHost,
      strategy,
    ],
  );
  return (
    <AssetRuntimeConfigContext.Provider value={value}>
      {children}
    </AssetRuntimeConfigContext.Provider>
  );
}

export function useAssetRuntimeConfig(): AssetRuntimeConfig {
  const ctx = useContext(AssetRuntimeConfigContext);
  if (ctx == null) {
    throw new Error(
      "useAssetRuntimeConfig must be used within an AssetManagerProvider.",
    );
  }
  return ctx;
}
