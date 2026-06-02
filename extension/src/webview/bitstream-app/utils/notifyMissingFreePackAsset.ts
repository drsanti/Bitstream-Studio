import { ternionFreeAssetPackCopy } from "../../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { shouldSuppressWebGlContextLostNotification } from "../../shared/webgl/webglSurfaceTransition.js";
import { usePreviewMeshMissingUiStore } from "../state/previewMeshMissingUi.store.js";
import { useStartupChecklistStore } from "../../startup-checklist/startupChecklist.store.js";

export function notifyMissingGlbPreviewAsset(args: {
  url: string;
  label?: string;
  dedupeKey: string;
}): void {
  const label = args.label?.trim() || "3D model";
  usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
    dedupeKey: args.dedupeKey,
    title: `${label} not available`,
    kind: "asset",
    summary: ternionFreeAssetPackCopy.previewDialogs.assetMissingSummary,
    detail: `Could not load:\n${args.url}\n\nThe file may be missing from extension storage or the download was incomplete.\n\n${ternionFreeAssetPackCopy.tooltips.downloadButton}`,
    autoOpenFreeAssetsLoader: true,
  });
  useStartupChecklistStore.getState().openPanel();
}

export function notifyMissingCubemapPreset(args: {
  presetTitle: string;
  presetPath: string;
  exampleUrl: string;
}): void {
  usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
    dedupeKey: `cubemap:${args.presetPath}`,
    title: `Environment map not found (${args.presetTitle})`,
    kind: "asset",
    summary: ternionFreeAssetPackCopy.previewDialogs.assetMissingSummary,
    detail: `Could not load cubemap faces under:\n${args.presetPath}\n\nExample:\n${args.exampleUrl}`,
    autoOpenFreeAssetsLoader: true,
  });
}

export function notifyWebGlContextLost(): void {
  if (shouldSuppressWebGlContextLostNotification()) {
    return;
  }
  usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
    dedupeKey: "webview:webgl-context-lost",
    title: ternionFreeAssetPackCopy.previewDialogs.webGlPausedTitle,
    kind: "webgl",
    summary: ternionFreeAssetPackCopy.previewDialogs.webGlPausedSummary,
    detail: ternionFreeAssetPackCopy.previewDialogs.webGlPausedDetail,
    bullets: ternionFreeAssetPackCopy.previewDialogs.webGlPausedBullets,
    autoOpenFreeAssetsLoader: false,
  });
}
