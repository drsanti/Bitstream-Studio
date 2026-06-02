import { ternionFreeAssetPackCopy } from "../../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { usePreviewMeshMissingUiStore } from "../state/previewMeshMissingUi.store.js";
import { useStartupChecklistStore } from "../../startup-checklist/startupChecklist.store.js";

const FREE_PACK_HELP =
  ternionFreeAssetPackCopy.missingAssetHelp + ternionFreeAssetPackCopy.missingAssetHelpSuffix;

export function notifyMissingGlbPreviewAsset(args: {
  url: string;
  label?: string;
  dedupeKey: string;
}): void {
  const label = args.label?.trim() || "3D model";
  usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
    dedupeKey: args.dedupeKey,
    title: `${label} not available`,
    description:
      `Could not load:\n${args.url}\n\n` +
      `The file may be missing from globalStorage or the download was incomplete.\n\n` +
      FREE_PACK_HELP,
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
    description:
      `Could not load cubemap faces under:\n${args.presetPath}\n\nExample:\n${args.exampleUrl}\n\n` +
      FREE_PACK_HELP,
    autoOpenFreeAssetsLoader: true,
  });
}

export function notifyWebGlContextLost(): void {
  usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
    dedupeKey: "webview:webgl-context-lost",
    title: "3D view paused (GPU context lost)",
    description:
      "The WebGL context was lost — often after a heavy load failure or GPU driver reset.\n\n" +
      ternionFreeAssetPackCopy.webGlContextLostHint,
    autoOpenFreeAssetsLoader: false,
  });
}
