import { useCallback, useEffect, useState } from "react";
import {
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
} from "../../../ui/TRN";
import { ASSET_MANAGER_GLOBAL_DIRECTORIES_TAB_KEY } from "../../store/browser-storage-key.js";
/**
 * Tab targeting uses the store directly — {@link useOpenAssetManager} only exposes open/close/toggle.
 */
import {
  type GlobalDirectoriesTabValue,
  useAssetManagerUiStore,
} from "../../store/assetManagerUi.store.js";
import type { LoaderLaunchButtonsProps } from "./LoaderLaunchButtons.js";
import { GlobalDirectoriesActionsTab } from "./GlobalDirectoriesActionsTab.js";
import { GlobalDirectoriesDiskLayoutTab } from "./GlobalDirectoriesDiskLayoutTab.js";
import { GlobalDirectoriesOverviewTab } from "./GlobalDirectoriesOverviewTab.js";
import { GlobalDirectoriesRuntimeTab } from "./GlobalDirectoriesRuntimeTab.js";

export type GlobalDirectoriesPanelProps = Pick<
  LoaderLaunchButtonsProps,
  | "onOpenModelLoader"
  | "onOpenFreeAssetsLoader"
  | "onOpenModelCatalog"
  | "modelLoaderDisabledReason"
  | "freeLoaderDisabledReason"
>;

function isGlobalDirectoriesTabValue(v: string): v is GlobalDirectoriesTabValue {
  return (
    v === "overview" || v === "disk" || v === "runtime" || v === "actions"
  );
}

function readStoredGlobalDirectoriesTab(): GlobalDirectoriesTabValue {
  if (typeof window === "undefined") {
    return "overview";
  }
  try {
    const raw = window.localStorage?.getItem(ASSET_MANAGER_GLOBAL_DIRECTORIES_TAB_KEY)?.trim();
    if (raw && isGlobalDirectoriesTabValue(raw)) {
      return raw;
    }
  } catch {
    // ignore quota / privacy mode
  }
  return "overview";
}

/**
 * v1 surface for “where assets live” (repo vs globalStorage, bases, launchers).
 * @see ../../../../../docs/GLOBAL_DIRECTORIES_PANEL_DESIGN.md
 */
export function GlobalDirectoriesPanel(props: GlobalDirectoriesPanelProps) {
  const launchers: LoaderLaunchButtonsProps = {
    onOpenModelLoader: props.onOpenModelLoader,
    onOpenFreeAssetsLoader: props.onOpenFreeAssetsLoader,
    onOpenModelCatalog: props.onOpenModelCatalog,
    modelLoaderDisabledReason: props.modelLoaderDisabledReason,
    freeLoaderDisabledReason: props.freeLoaderDisabledReason,
  };

  const [activeTab, setActiveTab] = useState<GlobalDirectoriesTabValue>(() =>
    readStoredGlobalDirectoriesTab(),
  );

  const consumeRequestedTab = useAssetManagerUiStore(
    (s) => s.consumeRequestedGlobalDirectoriesTab,
  );

  useEffect(() => {
    const requested = consumeRequestedTab();
    if (requested) {
      setActiveTab(requested);
    }
  }, [consumeRequestedTab]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(ASSET_MANAGER_GLOBAL_DIRECTORIES_TAB_KEY, activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  const onTabChange = useCallback((next: string) => {
    if (isGlobalDirectoriesTabValue(next)) {
      setActiveTab(next);
    }
  }, []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Global directories
      </h2>
      <TRNTabs
        value={activeTab}
        onValueChange={onTabChange}
        lazyMount
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        <TRNTabsList className="shrink-0 flex flex-wrap gap-0.5">
          <TRNTabsTrigger value="overview">Overview</TRNTabsTrigger>
          <TRNTabsTrigger value="disk">Disk layout</TRNTabsTrigger>
          <TRNTabsTrigger value="runtime">Runtime</TRNTabsTrigger>
          <TRNTabsTrigger value="actions">Actions</TRNTabsTrigger>
        </TRNTabsList>
        <TRNTabsContent
          value="overview"
          className="min-h-0 flex-1 overflow-auto rounded-md border border-zinc-700/60 bg-black/25 p-2"
        >
          <GlobalDirectoriesOverviewTab {...launchers} />
        </TRNTabsContent>
        <TRNTabsContent
          value="disk"
          className="min-h-0 flex-1 overflow-auto rounded-md border border-zinc-700/60 bg-black/25 p-2"
        >
          <GlobalDirectoriesDiskLayoutTab />
        </TRNTabsContent>
        <TRNTabsContent
          value="runtime"
          className="min-h-0 flex-1 overflow-auto rounded-md border border-zinc-700/60 bg-black/25 p-2"
        >
          <GlobalDirectoriesRuntimeTab />
        </TRNTabsContent>
        <TRNTabsContent
          value="actions"
          className="min-h-0 flex-1 overflow-auto rounded-md border border-zinc-700/60 bg-black/25 p-2"
        >
          <GlobalDirectoriesActionsTab {...launchers} />
        </TRNTabsContent>
      </TRNTabs>
    </div>
  );
}
