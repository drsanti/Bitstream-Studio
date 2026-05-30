import { useQuickSceneStore } from "@ternion/t3d";
import { useQuickActionStore, useSettingsUIStore } from "@ternion/t3d/ui";
import { useBitstreamDiagStore } from "../bitstream-app/state/bitstreamDiag.store.js";
import { useBitstreamDiagTasksStore } from "../bitstream-app/state/bitstreamDiagTasks.store.js";
import { useBitstreamConnectionStore } from "../bitstream-app/state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../bitstream-app/state/bitstreamLive.store.js";
import { useBitstreamWifiStore } from "../bitstream-app/state/bitstreamWifi.store.js";
import { useBmi270FusionEulerWireTapStore } from "../bitstream-app/state/bmi270FusionEulerWireTap.store.js";
import { useBmi270FusionQuatOrientationStore } from "../bitstream-app/state/bmi270FusionQuatOrientation.store.js";
import { useBmi270FusionQuatWireTapStore } from "../bitstream-app/state/bmi270FusionQuatWireTap.store.js";
import { usePreviewMeshMissingUiStore } from "../bitstream-app/state/previewMeshMissingUi.store.js";
import { killWebviewLauncherLogoAnimations } from "../webview-launcher/webviewLauncherMotion.js";
import type { WebviewShellEntry } from "./webviewEntry.store.js";

/**
 * Clear Digital Twin quick-scene / UI state before unmounting {@link MyApp}.
 * Engine disposal runs in `useEngineInitializer` when `MyApp` unmounts.
 */
export function teardownDigitalTwinShell(): void {
  const qs = useQuickSceneStore.getState();
  const quickAction = useQuickActionStore.getState();

  for (const commandId of qs.registeredCommandIds) {
    quickAction.unregisterCommand(commandId);
  }

  qs.setRegisteredCommandIds([]);
  qs.setCurrentApplicationComponent(null);
  qs.setCurrentModel(null);
  qs.setLoadingSceneId(null);
  qs.setOpen(false);

  useSettingsUIStore.getState().setDialogOpen(false);
}

/** Reset Bitstream Zustand surfaces that survive React unmount. */
export function teardownBitstreamShell(): void {
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

export function teardownLauncherShell(): void {
  killWebviewLauncherLogoAnimations();
}

export function teardownShellEntry(entry: WebviewShellEntry): void {
  switch (entry) {
    case "digitalTwin":
      teardownDigitalTwinShell();
      break;
    case "bitstream":
      teardownBitstreamShell();
      break;
    default:
      break;
  }
}

/**
 * Run before switching away from the active shell surface (app or launcher).
 */
export function teardownBeforeShellSwitch(options: {
  fromEntry: WebviewShellEntry;
  fromLauncher: boolean;
}): void {
  if (options.fromLauncher) {
    teardownLauncherShell();
    return;
  }
  teardownShellEntry(options.fromEntry);
}
