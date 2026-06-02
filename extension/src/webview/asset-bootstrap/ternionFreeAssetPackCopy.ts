/** User-facing product name for the remote free asset mirror (never expose GitHub in UI). */
export const TERNION_FREE_ASSET_PACK_NAME = "TERNION free asset pack";

export const TERNION_FREE_ASSET_PACK_LABEL = "TERNION pack";

export const ternionFreeAssetPackCopy = {
  /** Asset library step subtitle */
  librarySubtitle: "TERNION free asset pack — models, cubemaps, textures",
  /** Network step subtitle */
  networkSubtitle: "Online access for TERNION asset downloads",
  networkReachable: "TERNION asset library reachable",
  networkOffline: "Offline — use local disk copy or retry when online",
  downloading: "Downloading TERNION free asset pack…",
  verifying: "Verifying TERNION free asset pack on disk…",
  downloadHint:
    "Downloads the complete TERNION free asset pack into extension storage (globalStorage).",
  downloadButton: "Download TERNION pack",
  downloadFooter: "Download TERNION free asset pack",
  missingDisk: "Download the TERNION free asset pack before continuing.",
  verifyFailed:
    "TERNION free asset pack could not be verified. Use Setup, Free Loader, or Asset Manager.",
  offlineBlocked: "TERNION free asset pack is incomplete and the network is unreachable.",
  reloadAfterSync: "TERNION pack downloaded. Reloading panel to apply assets…",
  syncErrors: "TERNION pack sync finished with error(s). Check Asset Manager → Actions.",
  incompleteShort: "TERNION free asset pack incomplete — download to continue.",
  missingAssetHelp:
    "Sync the TERNION free asset pack (Setup checklist → Download TERNION pack, or Free Assets Loader).",
  missingAssetHelpSuffix:
    " Until files exist under extension storage, 3D previews may show a blank scene instead of crashing.",
  webGlContextLostHint:
    "Reload the Bitstream panel (close and reopen the view). If errors repeat, restart VS Code after syncing the TERNION free asset pack.",
  setupHeaderSubtitle: "Download TERNION free assets, then link and telemetry",
  onDiskReady: "TERNION free asset pack on disk",
  onDiskProgress: (local: number, remote: number) =>
    `TERNION pack on disk (${local}/${remote} files)`,
  missingCount: (missing: number, offline: boolean) =>
    offline
      ? `${missing} file(s) missing · offline`
      : `${missing} file(s) missing · download TERNION pack`,
  rateLimitHelp:
    "Remote asset catalog rate limit exceeded. Add an access token: VS Code Settings → `ternion.githubToken` (read-only token is enough), or set the `GITHUB_TOKEN` environment variable for the extension host. Then click Refresh list again.",
  filterOnlinePaths: "Filter TERNION pack paths…",
  fetchIndexEmpty:
    "No catalog loaded yet. Use Refresh to fetch the TERNION free asset pack file list.",
  onlineTableCaption:
    "TERNION free asset pack — models, cubemaps, textures, and related files",
  globalDirsOverviewHint:
    "Use the buttons below to browse the catalog, run the Model Loader, or sync the TERNION free asset pack when a scene needs something you don't have yet.",
  globalDirsActionsBody:
    "Open the same tools you use from the rest of the app: fetch catalog models, mirror the TERNION free asset pack, or browse the model catalog.",
  globalDirsDiskRole: "TERNION free asset pack mirror",
  assetPresetDescription: "TERNION free asset pack (textures, models, cubemaps)",
  glbPreviewUnavailableHint:
    "Asset missing or incomplete. Use Setup → Download TERNION pack, or Free Assets Loader.",
  psocMissingDescription:
    "The PSOC preview mesh could not be loaded. Packaged VSIX builds omit large GLB files.\n\nFree Assets Loader is opening so you can sync the TERNION free asset pack into extension storage, including models/psoc-e84-ai/.",
  assetBrowseEmptyModels:
    "No models in extension storage yet. Sync the TERNION pack or download models first.",
  assetBrowseEmptyOther:
    "No assets in extension storage yet. Sync the TERNION pack from Storage → Actions.",
  assetBrowseCta: "Get models & sync TERNION pack →",
  quickCommandCheckLabel: "Check TERNION free asset pack",
  browserBridgeRequired:
    "Start the bridge (npm run start:bridge) to check or download the TERNION pack in browser dev.",
  openInBrowserExtensionOnly: "Open in browser is available from the VS Code extension panel.",
} as const;
