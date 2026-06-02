/** User-facing product name for the remote free asset mirror (never expose GitHub in UI). */
export const TERNION_FREE_ASSET_PACK_NAME = "TERNION free asset pack";

export const TERNION_FREE_ASSET_PACK_LABEL = "TERNION pack";

/** Plain-language copy for operators; technical detail lives in `tooltips`. */
export const ternionFreeAssetPackCopy = {
  librarySubtitle: "3D models, skies, and textures for previews",
  networkSubtitle: "Needed to download the TERNION pack",
  downloading: "Downloading TERNION pack…",
  verifying: "Checking TERNION pack…",
  downloadButton: "Download TERNION pack",
  downloadFooter: "Download TERNION pack",
  setupHeaderTitle: "Workspace setup",
  incompleteShort: "TERNION pack is incomplete — download to continue",
  filterOnlinePaths: "Filter pack list…",
  fetchIndexEmpty: "No catalog loaded yet. Use Refresh to load the file list.",
  onlineTableCaption: "TERNION pack — models, skies, textures, and related files",
  globalDirsOverviewHint:
    "Browse the catalog, use Model Loader, or sync the TERNION pack when a scene needs something you do not have yet.",
  globalDirsActionsBody:
    "Open the same tools as elsewhere: catalog models, TERNION pack sync, or browse models.",
  globalDirsDiskRole: "TERNION pack (local copy)",
  assetPresetDescription: "TERNION pack (models, skies, textures)",
  assetBrowseEmptyModels: "No models here yet. Sync the TERNION pack or download models first.",
  assetBrowseEmptyOther: "No assets here yet. Sync the TERNION pack from Storage → Actions.",
  assetBrowseCta: "Get models and sync TERNION pack →",
  quickCommandCheckLabel: "Check TERNION assets",
  quickCommandDownloadLabel: "Download TERNION assets",
  glbPreviewUnavailableHint:
    "Asset missing or incomplete. Open Setup → Download TERNION pack, or Free Assets Loader.",
  missingAssetHelp:
    "Sync the TERNION pack (Setup → Download TERNION pack, or Free Assets Loader).",
  missingAssetHelpSuffix:
    " Until the pack is installed, 3D previews may stay blank instead of crashing.",
  webGlContextLostHint:
    "Close and reopen this panel. If it happens again, restart the editor after syncing the TERNION pack.",

  previewDialogs: {
    webGlPausedTitle: "3D view paused",
    webGlPausedSummary:
      "The preview stopped while the app switched screens. This is usually temporary — wait a moment or close and reopen the panel.",
    webGlPausedBullets: [
      "Wait a moment, then try the 3D view again",
      "Close and reopen this panel",
      "Sync the TERNION pack if previews stay blank",
    ] as const,
    webGlPausedDetail:
      "WebGL context was lost — often after the landing backdrop releases the GPU or a driver reset. Restart the editor after syncing the TERNION pack if it keeps happening.",
    assetMissingSummary:
      "A model or environment file is missing from this computer. Sync the TERNION pack to restore 3D previews.",
  },

  results: {
    packReady: "TERNION pack is ready on this computer",
    packInstalling: "Still installing the TERNION pack",
    packMissing: "Some assets are still missing",
    packMissingOffline: "You're offline — use files on this computer",
    packDownloading: "Downloading TERNION pack…",
    packVerifying: "Checking TERNION pack…",
    networkOnline: "You're online — downloads are available",
    networkOffline: "You're offline — use files already on this computer",
    networkWaiting: "Checking connection…",
    networkOnlineOnly: "Using online assets (no full local copy)",
    bridgeDown: "Download service isn't running",
    verifyFailed: "Couldn't verify the TERNION pack",
    syncFailed: "Download finished with problems",
    checkFailed: "Couldn't complete the check",
    reloadAfterSync: "TERNION pack downloaded. Reloading to apply…",
    modeSimulator: "Simulator",
    modeHardware: "Hardware (UART)",
    linkBridgeRunning: "Connection service is running",
    linkBridgeNotReady: "Connection service isn't ready",
    linkAppConnected: "This window is linked to the service",
    linkAppNotConnected: "Not linked yet",
    linkSerialOpen: "Your device port is open",
    linkSerialNotOpen: "Choose and open your device port",
    linkSimulatorStreaming: "Simulator is sending test data",
    linkSimulatorNotStreaming: "Start the external simulator",
    linkHandshakeOk: "Device check passed",
    linkHandshakeFailed: "Device check failed",
    linkHandshakeWaiting: "Waiting for the device…",
    linkReady: "You're ready for live data and settings",
    linkNotReady: "Complete the steps above first",
    stepWaiting: "Waiting…",
    stepChecking: "Checking…",
  },

  checklist: {
    serialListHint: "Click a port to select it, then open at 921600 baud.",
    serialNotOnAllowList: "Not on Allow list",
    serialOpenSelected: "Open selected",
    serialNoSelection: "Select a port from the list",
    handshakeSwitchingSimulator: "Switching…",
    handshakeSimulatorReady:
      "Simulator mode — start the bitstream-simulator extension, then use Link on the toolbar.",
    handshakeRetry: "Retry",
    handshakeChoosePort: "Choose port",
    handshakeSimulatorOnly: "Simulator only",
    handshakeConnectionDetails: "Details",
    handshakeRetryHint: "Re-runs HELLO / PING on the open serial port.",
    handshakeSimulatorOnlyHint:
      "Releases COM, switches telemetry to Simulator, and publishes the simulator route on the broker.",
    handshakeConnectionDetailsHint: "Opens the full connection panel on the handshake step.",
    setupChipLabel: "Setup incomplete",
    setupChipHint: "Device link is not ready. Open the checklist to finish connection steps.",
    setupClose: "Close",
    setupCloseAriaLabel: "Close setup",
    setupRecheckAriaLabel: "Recheck setup",
    setupRecheckHint:
      "Re-runs checks and replays the setup walkthrough from step 1. Use after changing ports, bridge, or network.",
    setupCloseEarlyHint:
      "Close now — you can reopen setup from the toolbar or Ctrl+/. The step walkthrough has not finished yet.",
    setupCloseDisabledHint:
      "Wait until the walkthrough has stepped through every card (through Step 8 of 8). Connection warnings or errors afterward are OK.",
  },

  tooltips: {
    stepAssets:
      "Installs the full TERNION free asset pack locally (extension storage under assets/free). Required for 3D previews in a packaged install.",
    stepNetwork:
      "Checks that the TERNION asset library is reachable for downloads. Separate from your board link.",
    stepMode:
      "Simulator uses a virtual device; Hardware uses UART to real firmware. Only one is active.",
    stepBridge:
      "Local broker that routes device data (default port 9998). Started with the extension or npm run start:bridge in dev.",
    stepWebsocket: "Connects this app to the broker at ws://127.0.0.1:9998.",
    stepSerialPorts: "Lists COM ports, selects one, opens at 921600 baud for BS2 UART.",
    stepSimulator: "External bitstream-simulator VSIX must be streaming; UART stays closed.",
    stepHandshake: "BS2 HELLO / PING verification with firmware before live telemetry.",
    stepLinkReady: "Telemetry and sensor settings unlock when the link step passes.",
    downloadButton:
      "Downloads every file in the TERNION pack into extension storage (globalStorage). Large download; keep internet connected.",
    packProgress: (local: number, remote: number) =>
      `${local} of ${remote} files present under the free-pack folder. Sync again if previews still fail.`,
    packMissing: (missing: number, offline: boolean) =>
      offline
        ? `${missing} file(s) missing and network unreachable. Connect to download, or copy files manually.`
        : `${missing} file(s) missing from the local mirror. Use Download TERNION pack.`,
    networkProbe: (probeUrl: string) => `Reachability probe: ${probeUrl}`,
    bridgeDev:
      "Browser dev: run npm run start:bridge in the extension folder so the WebSocket broker is up.",
    rateLimit:
      "Catalog rate limit. Add a token in VS Code Settings → ternion.githubToken, or set GITHUB_TOKEN for the extension host, then Refresh.",
    verifyFailed: "Use Setup, Free Assets Loader, or Asset Manager → Actions to sync again.",
    offlineBlocked: "Pack incomplete and network unreachable.",
    missingDisk: "Download the TERNION pack before continuing.",
    psocMissing:
      "Default preview GLB is not bundled in the VSIX. Free Assets Loader will sync models/psoc-e84-ai/ into storage.",
  },
} as const;

export function assetPackStepResult(args: {
  local?: number;
  remote?: number;
  onlineOnly?: boolean;
}): { result: string; resultTooltip?: string } {
  const { local, remote, onlineOnly } = args;
  if (onlineOnly) {
    return { result: ternionFreeAssetPackCopy.results.networkOnlineOnly };
  }
  if (typeof local === "number" && typeof remote === "number" && remote > 0) {
    if (local >= remote) {
      return { result: ternionFreeAssetPackCopy.results.packReady };
    }
    return {
      result: ternionFreeAssetPackCopy.results.packInstalling,
      resultTooltip: ternionFreeAssetPackCopy.tooltips.packProgress(local, remote),
    };
  }
  return { result: ternionFreeAssetPackCopy.results.packReady };
}

export function assetPackMissingResult(args: {
  missing: number;
  offline: boolean;
}): { result: string; resultTooltip: string } {
  return {
    result: args.offline
      ? ternionFreeAssetPackCopy.results.packMissingOffline
      : ternionFreeAssetPackCopy.results.packMissing,
    resultTooltip: ternionFreeAssetPackCopy.tooltips.packMissing(args.missing, args.offline),
  };
}

export function setupHeaderStepFocus(
  stepIndex: number,
  stepTotal: number,
  stepTitle: string,
): string {
  return `Step ${stepIndex} of ${stepTotal} — ${stepTitle}`;
}

export function setupHeaderStepSummary(readyCount: number, totalCount: number): string {
  return `${readyCount} / ${totalCount} ready`;
}
