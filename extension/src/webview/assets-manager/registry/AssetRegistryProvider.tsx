import type { PropsWithChildren } from "react";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ModelCatalogBridgeDownloaded } from "../../model-catalog/ModelCatalogBridgeDownloaded.js";
import { scanModelCatalogAssets } from "../../model-catalog/modelCatalog-asset-scan.js";
import {
  MODEL_CATALOG_LOCAL_MODELS_CHANGED_MESSAGE,
  MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT,
} from "../../model-catalog/modelCatalogEvents.js";
import { mergeCatalogModels } from "../../model-catalog/modelCatalogMerge.js";
import type { ModelEntry } from "../../model-catalog/modelCatalog-types.js";
import { buildAssetDescriptorList } from "./buildAssetDescriptorList.js";
import { loadAssetManifestOverlay } from "./asset-manifest.js";
import type { AssetDescriptor } from "./asset.types.js";
import { REPO_ASSET_STATIC_SCAN_ENABLED } from "../../../assetLayout.js";

export type AssetRegistryBridgeSlotProps = {
  active: boolean;
  refreshNonce: number;
  downloadedListNonce: number;
  onModels: (models: ModelEntry[]) => void;
};

export type AssetRegistryContextValue = {
  descriptors: AssetDescriptor[];
  /** Merged model catalog entries (globalStorage / bridge scan + manifest models). */
  catalogModelEntries: ModelEntry[];
  bridgeSlotProps: AssetRegistryBridgeSlotProps;
  bumpRefresh: () => void;
};

const AssetRegistryContext = createContext<AssetRegistryContextValue | null>(null);

function useAssetRegistryState(): AssetRegistryContextValue {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [downloadedListNonce, setDownloadedListNonce] = useState(0);
  const [extensionDownloadedModels, setExtensionDownloadedModels] = useState<ModelEntry[]>([]);
  const [browserDownloadedModels, setBrowserDownloadedModels] = useState<ModelEntry[]>([]);
  const [manifestOverlay, setManifestOverlay] = useState<AssetDescriptor[]>([]);

  const staticModels = useMemo(
    () => (REPO_ASSET_STATIC_SCAN_ENABLED ? scanModelCatalogAssets() : []),
    [refreshNonce],
  );

  const isExtension = useMemo(
    () =>
      typeof window !== "undefined" &&
      !!(window as Window & { __VSCODE_API__?: unknown }).__VSCODE_API__,
    [],
  );

  useEffect(() => {
    const onExtensionPush = (event: MessageEvent) => {
      const msg = event.data as { type?: string } | undefined;
      if (msg?.type === MODEL_CATALOG_LOCAL_MODELS_CHANGED_MESSAGE) {
        setDownloadedListNonce((n) => n + 1);
      }
    };
    window.addEventListener("message", onExtensionPush);
    return () => window.removeEventListener("message", onExtensionPush);
  }, []);

  useEffect(() => {
    const bump = () => setDownloadedListNonce((n) => n + 1);
    window.addEventListener(MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT, bump);
    return () => window.removeEventListener(MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT, bump);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bust = `${refreshNonce}-${downloadedListNonce}`;
    void (async () => {
      const rows = await loadAssetManifestOverlay(bust);
      if (!cancelled) {
        setManifestOverlay(rows);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshNonce, downloadedListNonce]);

  useEffect(() => {
    if (!isExtension) {
      setExtensionDownloadedModels([]);
      return;
    }
    const vscodeApi =
      ((typeof window !== "undefined" &&
        (window as Window & { __VSCODE_API__?: unknown }).__VSCODE_API__) as
        | { postMessage?: (message: unknown) => void }
        | undefined) || null;
    if (!vscodeApi) {
      setExtensionDownloadedModels([]);
      return;
    }

    let cancelled = false;
    const requestId = `asset-registry-dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const onMessage = (event: MessageEvent) => {
      const msg = event.data as {
        type?: string;
        requestId?: string;
        downloadedModels?: Array<
          Omit<ModelEntry, "modelCategory"> & {
            category?: string;
            modelCategory?: string;
          }
        >;
      };
      if (msg?.type !== "model-catalog-downloaded-models-response" || msg.requestId !== requestId) {
        return;
      }
      if (!cancelled) {
        setExtensionDownloadedModels(
          (msg.downloadedModels ?? []).map((entry) => ({
            ...entry,
            modelCategory:
              typeof entry.modelCategory === "string" && entry.modelCategory.trim() !== ""
                ? entry.modelCategory.trim()
                : typeof entry.category === "string" && entry.category.trim() !== ""
                  ? entry.category.trim()
                  : "Uncategorized",
          })),
        );
      }
    };

    window.addEventListener("message", onMessage);
    if (typeof vscodeApi.postMessage !== "function") {
      return () => {
        cancelled = true;
        window.removeEventListener("message", onMessage);
      };
    }

    vscodeApi.postMessage({
      type: "model-catalog-get-downloaded-models",
      requestId,
    });

    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
    };
  }, [isExtension, refreshNonce, downloadedListNonce]);

  const effectiveStaticModels = staticModels;

  const dynamicDownloadedModels = isExtension ? extensionDownloadedModels : browserDownloadedModels;

  const catalogModelEntries = useMemo(
    () => mergeCatalogModels(effectiveStaticModels, dynamicDownloadedModels),
    [effectiveStaticModels, dynamicDownloadedModels],
  );

  const descriptors = useMemo(
    () => buildAssetDescriptorList(catalogModelEntries, manifestOverlay),
    [catalogModelEntries, manifestOverlay],
  );

  const onBrowserModels = useCallback((models: ModelEntry[]) => {
    setBrowserDownloadedModels(models);
  }, []);

  const bridgeSlotProps = useMemo<AssetRegistryBridgeSlotProps>(
    () => ({
      active: !isExtension,
      refreshNonce,
      downloadedListNonce,
      onModels: onBrowserModels,
    }),
    [isExtension, refreshNonce, downloadedListNonce, onBrowserModels],
  );

  const bumpRefresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

  return { descriptors, catalogModelEntries, bridgeSlotProps, bumpRefresh };
}

/**
 * Global asset index (models, environments, textures) for the whole Bitstream Studio webview.
 * Mount once at {@link BitstreamShellMain} — not per workspace.
 */
export function AssetRegistryProvider(props: PropsWithChildren) {
  const value = useAssetRegistryState();
  return createElement(
    AssetRegistryContext.Provider,
    { value },
    createElement(ModelCatalogBridgeDownloaded, value.bridgeSlotProps),
    props.children,
  );
}

export function useAssetRegistry(): AssetRegistryContextValue {
  const ctx = useContext(AssetRegistryContext);
  if (ctx == null) {
    throw new Error("useAssetRegistry must be used within AssetRegistryProvider");
  }
  return ctx;
}
