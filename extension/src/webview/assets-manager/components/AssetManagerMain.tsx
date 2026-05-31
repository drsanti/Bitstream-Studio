import type { RefObject } from "react";
import { useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { TRNWindow } from "../../ui/TRN";
import { useAssetManagerUiStore } from "../store/assetManagerUi.store";
import type { GlobalDirectoriesPanelProps } from "./global-directories/GlobalDirectoriesPanel.js";
import { AssetManagerWorkspace } from "./AssetManagerWorkspace.js";

export type AssetManagerMainProps = GlobalDirectoriesPanelProps & {
  /** Same bounds as Bitstream Assistant — `TRNWindow` portals here, no full-screen backdrop. */
  workspaceBoundsRef: RefObject<HTMLElement | null>;
};

/**
 * Asset Manager as a bounded {@link TRNWindow} (like Bitstream Assistant): draggable/resizable
 * inside the main workspace, not a drawer shell.
 * @see ../docs/ASSET_MANAGER_ARCHITECTURE.md
 */
export function AssetManagerMain({
  workspaceBoundsRef,
  onOpenModelLoader,
  onOpenFreeAssetsLoader,
  onOpenModelCatalog,
  modelLoaderDisabledReason,
  freeLoaderDisabledReason,
}: AssetManagerMainProps) {
  const panelOpen = useAssetManagerUiStore((s) => s.panelOpen);
  const closePanel = useAssetManagerUiStore((s) => s.closePanel);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelOpen, closePanel]);

  return (
    <TRNWindow
      open={panelOpen}
      boundsRef={workspaceBoundsRef}
      title="Asset Manager"
      prefixIcon={
        <FolderOpen className="h-3.5 w-3.5 text-cyan-400/90" aria-hidden />
      }
      onClose={closePanel}
      initialRect={{ x: 56, y: 88, width: 440, height: 620 }}
      minWidth={360}
      minHeight={320}
      heightMode="fixed"
      modal={false}
      bringToFrontOnPointerDown
      zIndex={200}
      showFooter={false}
      showMaximize={true}
      // showExpandFullWidth
      // showExpandFullHeight
      persistRectStorageKey="ternion:asset-manager:window"
      glass
      glassPreset="medium"
      contentClassName="scrollbar-dark-micro flex h-full min-h-0 flex-1 flex-col basis-0 overflow-hidden bg-black/45 p-3 pt-2"
      contentStyle={{ flex: "1 1 0%", minHeight: 0 }}
    >
      <AssetManagerWorkspace
        onOpenModelLoader={onOpenModelLoader}
        onOpenFreeAssetsLoader={onOpenFreeAssetsLoader}
        onOpenModelCatalog={onOpenModelCatalog}
        modelLoaderDisabledReason={modelLoaderDisabledReason}
        freeLoaderDisabledReason={freeLoaderDisabledReason}
      />
    </TRNWindow>
  );
}
