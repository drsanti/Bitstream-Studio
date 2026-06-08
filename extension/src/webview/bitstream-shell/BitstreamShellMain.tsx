import { SensorStudioApp } from "../sensor-studio/app/SensorStudioApp.tsx";
import { FreeAssetsLoaderDashboard } from "../free-assets-loader/FreeAssetsLoaderDashboard";
import { ModelLoaderDashboard } from "../model-loader/ModelLoaderDashboard";
import { GlobalShellOverlays } from "../GlobalShellOverlays";
import { TelemetryRxMetricsProvider } from "../bitstream-app/components/telemetry/TelemetryRxMetricsContext.js";
import { Bmi270StreamModeSyncEffect } from "../bitstream-app/sync-effects/Bmi270StreamModeSyncEffect";
import { BitstreamShellRoot } from "./BitstreamShellRoot";
import { useBitstreamConfigStore } from "../bitstream-app/state/bitstreamConfig.store";
import {
  suppressFreeLoaderAutoOpen,
  usePreviewMeshMissingUiStore,
} from "../bitstream-app/state/previewMeshMissingUi.store";
import { BitstreamSensorWorkspaceView } from "../bitstream-app/workspace/BitstreamSensorWorkspaceView";
import { PreviewMeshStatusDialog } from "../bitstream-app/components/PreviewMeshStatusDialog.js";
import { useStartupChecklistStore } from "../startup-checklist/startupChecklist.store.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useBitstreamWorkspaceModeStore } from "../bitstream-app/state/bitstreamWorkspaceMode.store";
import { AssetManagerProvider, AssetRegistryProvider, openAssetManagerBrowseModels } from "../assets-manager";
import { PresentationWorkspace } from "../presentation/PresentationWorkspace";

export function BitstreamShellMain()
{
  const workspace = useBitstreamWorkspaceModeStore((s) => s.workspace);
  const sensorStudioMode = workspace === "sensor-studio";
  const presentationMode = workspace === "presentation";

  const bmi270StreamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);

  const meshMissingDialogOpen = usePreviewMeshMissingUiStore(
    (s) => s.meshMissingDialogOpen,
  );
  const missingAssetKind = usePreviewMeshMissingUiStore((s) => s.missingAssetKind);
  const missingAssetTitle = usePreviewMeshMissingUiStore((s) => s.missingAssetTitle);
  const missingAssetSummary = usePreviewMeshMissingUiStore((s) => s.missingAssetSummary);
  const missingAssetDetail = usePreviewMeshMissingUiStore((s) => s.missingAssetDetail);
  const missingAssetBullets = usePreviewMeshMissingUiStore((s) => s.missingAssetBullets);
  const closeMeshMissingDialog = usePreviewMeshMissingUiStore(
    (s) => s.closeMeshMissingDialog,
  );
  const freeAssetsLoaderOpen = usePreviewMeshMissingUiStore(
    (s) => s.freeAssetsLoaderOpen,
  );
  const setFreeAssetsLoaderOpen = usePreviewMeshMissingUiStore(
    (s) => s.setFreeAssetsLoaderOpen,
  );
  const modelLoaderOpen = usePreviewMeshMissingUiStore(
    (s) => s.modelLoaderOpen,
  );
  const setModelLoaderOpen = usePreviewMeshMissingUiStore(
    (s) => s.setModelLoaderOpen,
  );

  return (
    <AssetManagerProvider>
      <AssetRegistryProvider>
      <TelemetryRxMetricsProvider>
        <>
          <BitstreamShellRoot>
            <Bmi270StreamModeSyncEffect mode={bmi270StreamMode} />
            <div key={workspace} className="flex min-h-0 min-w-0 flex-1 flex-col">
              {presentationMode ? (
                <PresentationWorkspace />
              ) : sensorStudioMode ? (
                <SensorStudioApp />
              ) : (
                <BitstreamSensorWorkspaceView />
              )}
            </div>
          </BitstreamShellRoot>

          <PreviewMeshStatusDialog
            open={meshMissingDialogOpen}
            kind={missingAssetKind}
            title={missingAssetTitle}
            summary={missingAssetSummary}
            detail={missingAssetDetail}
            bullets={missingAssetBullets}
            onDismiss={closeMeshMissingDialog}
            onOpenSetup={() => {
              useStartupChecklistStore.getState().openPanel();
              closeMeshMissingDialog();
            }}
            onOpenFreeLoader={() => {
              usePreviewMeshMissingUiStore.getState().openFreeAssetsLoaderFromDialog();
            }}
          />

          <FreeAssetsLoaderDashboard
            open={freeAssetsLoaderOpen}
            onClose={() => {
              setFreeAssetsLoaderOpen(false);
              suppressFreeLoaderAutoOpen();
            }}
          />
          <ModelLoaderDashboard
            open={modelLoaderOpen}
            onClose={() => {
              setModelLoaderOpen(false);
            }}
            onOpenModelCatalog={() => {
              setModelLoaderOpen(false);
              openAssetManagerBrowseModels();
            }}
          />

          <GlobalShellOverlays />
          <ToastContainer
            position="bottom-center"
            autoClose={2800}
            theme="dark"
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            className="pointer-events-auto"
          />
        </>
      </TelemetryRxMetricsProvider>
      </AssetRegistryProvider>
    </AssetManagerProvider>
  );
}

export { BitstreamShellMain as BitstreamAppMain };
