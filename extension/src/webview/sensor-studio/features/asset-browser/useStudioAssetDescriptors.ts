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
import { ModelCatalogBridgeDownloaded } from "../../../model-catalog/ModelCatalogBridgeDownloaded";
import { scanModelCatalogAssets } from "../../../model-catalog/modelCatalog-asset-scan";
import {
  MODEL_CATALOG_LOCAL_MODELS_CHANGED_MESSAGE,
  MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT,
} from "../../../model-catalog/modelCatalogEvents";
import { mergeCatalogModels } from "../../../model-catalog/modelCatalogMerge";
import type { ModelEntry } from "../../../model-catalog/modelCatalog-types";
import { buildStudioAssetDescriptorList } from "./buildStudioAssetDescriptorList";
import { loadStudioAssetManifestOverlay } from "./studio-asset-manifest";
import type { StudioAssetDescriptor } from "./studio-asset.types";

export type StudioAssetBridgeSlotProps = {
  active: boolean;
  refreshNonce: number;
  downloadedListNonce: number;
  onModels: (models: ModelEntry[]) => void;
};

export type StudioAssetDescriptorsContextValue = {
  descriptors: StudioAssetDescriptor[];
  bridgeSlotProps: StudioAssetBridgeSlotProps;
  bumpRefresh: () => void;
};

const StudioAssetDescriptorsContext = createContext<StudioAssetDescriptorsContextValue | null>(null);

function useStudioAssetDescriptorsState(): StudioAssetDescriptorsContextValue {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [downloadedListNonce, setDownloadedListNonce] = useState(0);
  const [extensionDownloadedModels, setExtensionDownloadedModels] = useState<ModelEntry[]>([]);
  const [browserDownloadedModels, setBrowserDownloadedModels] = useState<ModelEntry[]>([]);
  const [manifestOverlay, setManifestOverlay] = useState<StudioAssetDescriptor[]>([]);

  const staticModels = useMemo(() => scanModelCatalogAssets(), [refreshNonce]);

  const isExtension = useMemo(
    () =>
      typeof window !== "undefined" &&
      !!(window as Window & { __VSCODE_API__?: unknown }).__VSCODE_API__,
    [],
  );

  const isInstalledVsixRuntime = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const localBase = (window as Window & { LOCAL_ASSETS_BASE_URI?: string }).LOCAL_ASSETS_BASE_URI;
    if (!localBase) {
      return false;
    }
    const normalized = localBase.replace(/\\/g, "/").toLowerCase();
    return normalized.includes("/.vscode/extensions/");
  }, []);

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
      const rows = await loadStudioAssetManifestOverlay(bust);
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
    const requestId = `studio-asset-browser-dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

  const effectiveStaticModels = useMemo(() => {
    if (!isExtension || !isInstalledVsixRuntime) {
      return staticModels;
    }
    return staticModels.filter((m) => m.catalogCategory !== "packaged");
  }, [isExtension, isInstalledVsixRuntime, staticModels]);

  const dynamicDownloadedModels = isExtension ? extensionDownloadedModels : browserDownloadedModels;

  const mergedModels = useMemo(
    () => mergeCatalogModels(effectiveStaticModels, dynamicDownloadedModels),
    [effectiveStaticModels, dynamicDownloadedModels],
  );

  const descriptors = useMemo(
    () => buildStudioAssetDescriptorList(mergedModels, manifestOverlay),
    [mergedModels, manifestOverlay],
  );

  const onBrowserModels = useCallback((models: ModelEntry[]) => {
    setBrowserDownloadedModels(models);
  }, []);

  const bridgeSlotProps = useMemo<StudioAssetBridgeSlotProps>(
    () => ({
      active: !isExtension,
      refreshNonce,
      downloadedListNonce,
      onModels: onBrowserModels,
    }),
    [isExtension, refreshNonce, downloadedListNonce, onBrowserModels],
  );

  const bumpRefresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

  return { descriptors, bridgeSlotProps, bumpRefresh };
}

/**
 * Single shared Sensor Studio asset index (models + manifest + bridge). Must be used under
 * {@link StudioAssetDescriptorsProvider}.
 */
export function useStudioAssetDescriptors(): StudioAssetDescriptorsContextValue {
  const ctx = useContext(StudioAssetDescriptorsContext);
  if (ctx == null) {
    throw new Error("useStudioAssetDescriptors must be used within StudioAssetDescriptorsProvider");
  }
  return ctx;
}

/** `.ts` module (no JSX) so Vite dev URLs stay stable as `useStudioAssetDescriptors.ts` after refactors. */
export function StudioAssetDescriptorsProvider(props: PropsWithChildren) {
  const value = useStudioAssetDescriptorsState();
  return createElement(
    StudioAssetDescriptorsContext.Provider,
    { value },
    createElement(ModelCatalogBridgeDownloaded, value.bridgeSlotProps),
    props.children,
  );
}
