import { useCallback, useEffect, useState } from "react";
import { Layers, FolderOpen } from "lucide-react";
import { TRNTabs, TRNTabsContent, TRNTabsList, TRNTabsTrigger } from "../../ui/TRN/index.js";
import type { AssetCategory } from "../registry/asset.types.js";
import { AssetBrowsePanel } from "../browse/AssetBrowsePanel.js";
import { ASSET_MANAGER_MAIN_TAB_KEY } from "../store/browser-storage-key.js";
import {
  type AssetManagerMainTab,
  useAssetManagerUiStore,
} from "../store/assetManagerUi.store.js";
import type { GlobalDirectoriesPanelProps } from "./global-directories/GlobalDirectoriesPanel.js";
import { GlobalDirectoriesPanel } from "./global-directories/GlobalDirectoriesPanel.js";

export type AssetManagerWorkspaceProps = GlobalDirectoriesPanelProps & {
  borderColor?: string;
  panelColor?: string;
};

function isMainTab(v: string): v is AssetManagerMainTab {
  return v === "browse" || v === "storage";
}

function readStoredMainTab(): AssetManagerMainTab {
  if (typeof window === "undefined") {
    return "browse";
  }
  try {
    const raw = window.localStorage?.getItem(ASSET_MANAGER_MAIN_TAB_KEY)?.trim();
    if (raw && isMainTab(raw)) {
      return raw;
    }
  } catch {
    // ignore
  }
  return "browse";
}

/**
 * Asset Manager body: **Browse** (global asset catalog) + **Storage** (paths, sync, loaders).
 */
export function AssetManagerWorkspace(props: AssetManagerWorkspaceProps) {
  const {
    borderColor = "rgba(255,255,255,0.08)",
    panelColor = "rgba(20,20,25,0.85)",
    onOpenModelLoader,
    onOpenFreeAssetsLoader,
    modelLoaderDisabledReason,
    freeLoaderDisabledReason,
  } = props;

  const [mainTab, setMainTab] = useState<AssetManagerMainTab>(() => readStoredMainTab());
  const [browseCategory, setBrowseCategory] = useState<AssetCategory>("model");

  const consumeRequestedMainTab = useAssetManagerUiStore((s) => s.consumeRequestedMainTab);
  const consumeRequestedBrowseCategory = useAssetManagerUiStore(
    (s) => s.consumeRequestedBrowseCategory,
  );

  useEffect(() => {
    const requestedTab = consumeRequestedMainTab();
    if (requestedTab) {
      setMainTab(requestedTab);
    }
    const requestedCategory = consumeRequestedBrowseCategory();
    if (requestedCategory) {
      setBrowseCategory(requestedCategory);
    }
  }, [consumeRequestedMainTab, consumeRequestedBrowseCategory]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(ASSET_MANAGER_MAIN_TAB_KEY, mainTab);
    } catch {
      // ignore
    }
  }, [mainTab]);

  const openBrowseModelsTab = useCallback(() => {
    setMainTab("browse");
    setBrowseCategory("model");
  }, []);

  const onMainTabChange = useCallback((next: string) => {
    if (isMainTab(next)) {
      setMainTab(next);
    }
  }, []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
      <TRNTabs
        value={mainTab}
        onValueChange={onMainTabChange}
        lazyMount
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        <TRNTabsList className="shrink-0 flex gap-0.5">
          <TRNTabsTrigger value="browse" className="gap-1">
            <Layers className="size-3 opacity-80" aria-hidden />
            Browse
          </TRNTabsTrigger>
          <TRNTabsTrigger value="storage" className="gap-1">
            <FolderOpen className="size-3 opacity-80" aria-hidden />
            Storage
          </TRNTabsTrigger>
        </TRNTabsList>
        <TRNTabsContent
          value="browse"
          className="min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
        >
          <AssetBrowsePanel
            key={browseCategory}
            borderColor={borderColor}
            panelColor={panelColor}
            variant="embedded"
            initialCategory={browseCategory}
          />
        </TRNTabsContent>
        <TRNTabsContent
          value="storage"
          className="min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden"
        >
          <GlobalDirectoriesPanel
            onOpenModelLoader={onOpenModelLoader}
            onOpenFreeAssetsLoader={onOpenFreeAssetsLoader}
            onOpenModelCatalog={openBrowseModelsTab}
            modelLoaderDisabledReason={modelLoaderDisabledReason}
            freeLoaderDisabledReason={freeLoaderDisabledReason}
          />
        </TRNTabsContent>
      </TRNTabs>
    </div>
  );
}
