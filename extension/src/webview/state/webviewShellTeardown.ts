import { useBitstreamDiagStore } from "../bitstream-app/state/bitstreamDiag.store.js";
import { useBitstreamDiagTasksStore } from "../bitstream-app/state/bitstreamDiagTasks.store.js";
import { useBitstreamConnectionStore } from "../bitstream-app/state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../bitstream-app/state/bitstreamLive.store.js";
import { useBitstreamWifiStore } from "../bitstream-app/state/bitstreamWifi.store.js";
import { useBmi270FusionEulerWireTapStore } from "../bitstream-app/state/bmi270FusionEulerWireTap.store.js";
import { useBmi270FusionQuatOrientationStore } from "../bitstream-app/state/bmi270FusionQuatOrientation.store.js";
import { useBmi270FusionQuatWireTapStore } from "../bitstream-app/state/bmi270FusionQuatWireTap.store.js";
import { usePreviewMeshMissingUiStore } from "../bitstream-app/state/previewMeshMissingUi.store.js";
import type { WebviewShellEntry } from "./webviewEntry.store.js";

/** Reset Bitstream Zustand surfaces that survive React unmount. */
export function teardownBitstreamShell(): void
{
  useBitstreamLiveStore.getState().resetLiveData();
  useBmi270FusionQuatOrientationStore.getState().reset();
  useBmi270FusionQuatWireTapStore.getState().reset();
  useBmi270FusionEulerWireTapStore.getState().reset();
  useBitstreamWifiStore.getState().reset();
  useBitstreamDiagTasksStore.getState().reset();
  useBitstreamDiagStore.setState({
    snapshot: null,
    loading: false,
    error: null,
    updatedAt: null,
  });

  const preview = usePreviewMeshMissingUiStore.getState();
  preview.closeMeshMissingDialog();
  preview.setFreeAssetsLoaderOpen(false);
  preview.setModelLoaderOpen(false);
  preview.setModelCatalogOpen(false);

  useBitstreamConnectionStore.setState({
    connecting: false,
    connected: false,
    transportState: "disconnected",
    busyAction: null,
    backendWsState: "disconnected",
    detectingPorts: false,
    availablePorts: [],
    serialBridgeStatus: null,
    serialRxWireStats: null,
    runtimeSyncState: "idle",
    runtimeReady: false,
    sessionAttached: false,
    leaseId: null,
    leaseOwner: null,
    runtimeSnapshot: null,
    runtimeOperations: [],
  });
}

export function teardownShellEntry(entry: WebviewShellEntry): void
{
  if (entry === "bitstream")
  {
    teardownBitstreamShell();
  }
}

/**
 * Run before switching away from the active shell surface (legacy hook; Bitstream-only).
 */
export function teardownBeforeShellSwitch(options: {
  fromEntry: WebviewShellEntry;
  fromLauncher: boolean;
}): void
{
  if (options.fromLauncher)
  {
    return;
  }
  teardownShellEntry(options.fromEntry);
}
