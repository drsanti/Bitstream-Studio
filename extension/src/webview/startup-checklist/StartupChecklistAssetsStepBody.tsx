import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { openAssetManagerBrowseModels } from "../assets-manager/hooks/openAssetManagerBrowseModels.js";
import { usePreviewMeshMissingUiStore } from "../bitstream-app/state/previewMeshMissingUi.store.js";
import type { AssetBootstrapSyncProgress } from "../asset-bootstrap/useAssetBootstrap.js";
import { StartupChecklistAssetTypeActivity } from "./StartupChecklistAssetTypeActivity.js";

export function StartupChecklistAssetsStepBody(props: {
  canDownload: boolean;
  actionsDisabled?: boolean;
  isSyncing?: boolean;
  syncProgress?: AssetBootstrapSyncProgress | null;
  missingPaths: string[];
  onDownload: () => void;
  onRecheck: () => void;
}) {
  const {
    canDownload,
    actionsDisabled = false,
    isSyncing = false,
    syncProgress,
    missingPaths,
    onDownload,
    onRecheck,
  } = props;

  const showActivity = isSyncing || missingPaths.length > 0;

  return (
    <div className="space-y-2">
      {showActivity ? (
        <StartupChecklistAssetTypeActivity
          mode={isSyncing ? "syncing" : "missing"}
          syncCurrentPath={syncProgress?.currentPath}
          syncPhase={syncProgress?.phase}
          missingPaths={missingPaths}
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canDownload ? (
          <TRNButton
            size="compact"
            selected
            disabled={actionsDisabled}
            onClick={onDownload}
            hint={ternionFreeAssetPackCopy.tooltips.downloadButton}
          >
            {ternionFreeAssetPackCopy.downloadButton}
          </TRNButton>
        ) : null}
        <TRNButton size="compact" disabled={actionsDisabled} onClick={onRecheck}>
          Retry check
        </TRNButton>
        <TRNButton
          size="compact"
          disabled={actionsDisabled}
          onClick={() => usePreviewMeshMissingUiStore.getState().setFreeAssetsLoaderOpen(true)}
        >
          Free Loader
        </TRNButton>
        <TRNButton
          size="compact"
          disabled={actionsDisabled}
          onClick={() => openAssetManagerBrowseModels()}
        >
          Asset Manager
        </TRNButton>
      </div>
    </div>
  );
}
