import { SensorStudioApp } from "../sensor-studio/app/SensorStudioApp.tsx";
import { FreeAssetsLoaderDashboard } from "../free-assets-loader/FreeAssetsLoaderDashboard";
import { ModelCatalogDashboard } from "../model-catalog/ModelCatalogDashboard";
import { ModelLoaderDashboard } from "../model-loader/ModelLoaderDashboard";
import { TRNMessageDialog } from "../ui/TRN";
import { GlobalShellOverlays } from "../GlobalShellOverlays";
import { TelemetryRxMetricsProvider } from "../bitstream-app/components/telemetry/TelemetryRxMetricsContext.js";
import { Bmi270StreamModeSyncEffect } from "../bitstream-app/sync-effects/Bmi270StreamModeSyncEffect";
import { BitstreamShellRoot } from "./BitstreamShellRoot";
import { useBitstreamConfigStore } from "../bitstream-app/state/bitstreamConfig.store";
import { usePreviewMeshMissingUiStore } from "../bitstream-app/state/previewMeshMissingUi.store";
import { BitstreamSensorWorkspaceView } from "../bitstream-app/workspace/BitstreamSensorWorkspaceView";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useBitstreamWorkspaceModeStore } from "../bitstream-app/state/bitstreamWorkspaceMode.store";
import { AssetManagerProvider, useOpenAssetManager } from "../assets-manager";

export function BitstreamShellMain()
{
  const workspace = useBitstreamWorkspaceModeStore((s) => s.workspace);
  const sensorStudioMode = workspace === "sensor-studio";

  const bmi270StreamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);

  const meshMissingDialogOpen = usePreviewMeshMissingUiStore(
    (s) => s.meshMissingDialogOpen,
  );
  const missingAssetTitle = usePreviewMeshMissingUiStore((s) => s.missingAssetTitle);
  const missingAssetDescription = usePreviewMeshMissingUiStore(
    (s) => s.missingAssetDescription,
  );
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
  const modelCatalogOpen = usePreviewMeshMissingUiStore(
    (s) => s.modelCatalogOpen,
  );
  const setModelCatalogOpen = usePreviewMeshMissingUiStore(
    (s) => s.setModelCatalogOpen,
  );

  const { openAssetManager } = useOpenAssetManager();

  return (
    <AssetManagerProvider>
      <TelemetryRxMetricsProvider>
        <>
          <BitstreamShellRoot>
            <Bmi270StreamModeSyncEffect mode={bmi270StreamMode} />
            <div key={workspace} className="flex min-h-0 min-w-0 flex-1 flex-col">
              {sensorStudioMode ? (
                <SensorStudioApp />
              ) : (
                <BitstreamSensorWorkspaceView />
              )}
            </div>
          </BitstreamShellRoot>

          <TRNMessageDialog
            open={meshMissingDialogOpen}
            onOpenChange={(next) => {
              if (!next)
              {
                closeMeshMissingDialog();
              }
            }}
            title={missingAssetTitle}
            variant="warning"
            primaryAction={{
              label: "Open Asset Manager",
              onClick: () => {
                openAssetManager({ globalDirectoriesTab: "actions" });
                closeMeshMissingDialog();
              },
            }}
            secondaryAction={{
              label: "Later",
              onClick: () => {},
            }}
            tertiaryAction={{
              label: "Free Loader",
              onClick: () => {
                usePreviewMeshMissingUiStore.getState().openFreeAssetsLoaderFromDialog();
              },
            }}
            zIndex={80}
          >
            <p className="mb-0 whitespace-pre-wrap text-sm leading-relaxed">
              {missingAssetDescription}
            </p>
          </TRNMessageDialog>

          <FreeAssetsLoaderDashboard
            open={freeAssetsLoaderOpen}
            onClose={() => {
              setFreeAssetsLoaderOpen(false);
            }}
          />
          <ModelLoaderDashboard
            open={modelLoaderOpen}
            onClose={() => {
              setModelLoaderOpen(false);
            }}
            onOpenModelCatalog={() => {
              setModelCatalogOpen(true);
            }}
          />
          <ModelCatalogDashboard
            open={modelCatalogOpen}
            onClose={() => {
              setModelCatalogOpen(false);
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
    </AssetManagerProvider>
  );
}

export { BitstreamShellMain as BitstreamAppMain };

