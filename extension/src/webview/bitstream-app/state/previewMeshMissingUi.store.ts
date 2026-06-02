import { create } from "zustand";
import { ternionFreeAssetPackCopy } from "../../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { openAssetManagerBrowseModels } from "../../assets-manager/hooks/openAssetManagerBrowseModels.js";

const SESSION_MISSING_DIALOG_PREFIX = "ternion:missing-asset-dialog:";

export type PreviewMeshDialogKind = "asset" | "webgl";

export type NotifyMissingAssetPayload = {
  /**
   * Dedupe key for `sessionStorage` (one dialog per asset ref per tab session).
   * Example: `studio-model:https://…`, `bitstream:psoc-default-body-glb`.
   */
  dedupeKey: string;
  title?: string;
  kind?: PreviewMeshDialogKind;
  /** Plain-language body (shown on the card). */
  summary?: string;
  /** Technical copy — hover “Technical details”. */
  detail?: string;
  bullets?: readonly string[];
  /** @deprecated Use `summary` + `detail`. */
  description?: string;
  /** Opens {@link FreeAssetsLoaderDashboard} instead of the warning dialog (default for free-pack / PSOC). */
  autoOpenFreeAssetsLoader?: boolean;
  /** Opens {@link ModelLoaderDashboard} instead of the warning dialog (e.g. catalog download preview). */
  autoOpenModelLoader?: boolean;
};

function resolveMissingAssetUiAction(
  payload: NotifyMissingAssetPayload,
): "free-loader" | "model-loader" | "dialog" {
  if (payload.autoOpenModelLoader === true) {
    return "model-loader";
  }
  if (payload.autoOpenFreeAssetsLoader === true) {
    return "free-loader";
  }
  if (payload.autoOpenFreeAssetsLoader === false) {
    return "dialog";
  }
  if (payload.dedupeKey.startsWith("model-loader-preview:")) {
    return "model-loader";
  }
  return "free-loader";
}

export type PreviewMeshMissingUiState = {
  meshMissingDialogOpen: boolean;
  missingAssetKind: PreviewMeshDialogKind;
  missingAssetTitle: string;
  missingAssetSummary: string;
  missingAssetDetail: string;
  missingAssetBullets: readonly string[];
  /** @deprecated Legacy single block; kept for loaders that still read it. */
  missingAssetDescription: string;
  freeAssetsLoaderOpen: boolean;
  modelLoaderOpen: boolean;
  modelCatalogOpen: boolean;

  notifyMissingAsset: (payload: NotifyMissingAssetPayload) => void;
  notifyGlbLoadFailed: () => void;
  closeMeshMissingDialog: () => void;
  openFreeAssetsLoaderFromDialog: () => void;
  openModelLoaderFromDialog: () => void;
  setFreeAssetsLoaderOpen: (open: boolean) => void;
  setModelLoaderOpen: (open: boolean) => void;
  setModelCatalogOpen: (open: boolean) => void;
};

const DEFAULT_MISSING_TITLE = "Asset not found";

function resolveSummaryAndDetail(payload: NotifyMissingAssetPayload): {
  summary: string;
  detail: string;
  bullets: readonly string[];
} {
  if (payload.summary != null && payload.summary.length > 0) {
    return {
      summary: payload.summary,
      detail: payload.detail ?? "",
      bullets: payload.bullets ?? [],
    };
  }
  const legacy = payload.description ?? "";
  const parts = legacy.split(/\n\n+/);
  return {
    summary: parts[0] ?? legacy,
    detail: parts.slice(1).join("\n\n"),
    bullets: payload.bullets ?? [],
  };
}

export const usePreviewMeshMissingUiStore = create<PreviewMeshMissingUiState>(
  (set, get) => ({
    meshMissingDialogOpen: false,
    missingAssetKind: "asset",
    missingAssetTitle: DEFAULT_MISSING_TITLE,
    missingAssetSummary: "",
    missingAssetDetail: "",
    missingAssetBullets: [],
    missingAssetDescription: "",
    freeAssetsLoaderOpen: false,
    modelLoaderOpen: false,
    modelCatalogOpen: false,

    notifyMissingAsset: (payload) => {
      if (typeof sessionStorage !== "undefined") {
        const storageKey = SESSION_MISSING_DIALOG_PREFIX + payload.dedupeKey;
        if (sessionStorage.getItem(storageKey) === "1") {
          return;
        }
        sessionStorage.setItem(storageKey, "1");
      }

      const title = payload.title ?? DEFAULT_MISSING_TITLE;
      const kind = payload.kind ?? "asset";
      const { summary, detail, bullets } = resolveSummaryAndDetail(payload);
      const description = payload.description ?? (detail ? `${summary}\n\n${detail}` : summary);
      const action = resolveMissingAssetUiAction(payload);

      if (action === "free-loader") {
        set({
          meshMissingDialogOpen: false,
          freeAssetsLoaderOpen: true,
          modelLoaderOpen: false,
          missingAssetKind: kind,
          missingAssetTitle: title,
          missingAssetSummary: summary,
          missingAssetDetail: detail,
          missingAssetBullets: bullets,
          missingAssetDescription: description,
        });
        return;
      }

      if (action === "model-loader") {
        set({
          meshMissingDialogOpen: false,
          modelLoaderOpen: true,
          freeAssetsLoaderOpen: false,
          missingAssetKind: kind,
          missingAssetTitle: title,
          missingAssetSummary: summary,
          missingAssetDetail: detail,
          missingAssetBullets: bullets,
          missingAssetDescription: description,
        });
        return;
      }

      set({
        meshMissingDialogOpen: true,
        missingAssetKind: kind,
        missingAssetTitle: title,
        missingAssetSummary: summary,
        missingAssetDetail: detail,
        missingAssetBullets: bullets,
        missingAssetDescription: description,
      });
    },

    notifyGlbLoadFailed: () => {
      get().notifyMissingAsset({
        dedupeKey: "bitstream:psoc-default-body-glb",
        title: "Preview model not found",
        summary: ternionFreeAssetPackCopy.previewDialogs.assetMissingSummary,
        detail: ternionFreeAssetPackCopy.tooltips.psocMissing,
        autoOpenFreeAssetsLoader: true,
      });
    },

    closeMeshMissingDialog: () => set({ meshMissingDialogOpen: false }),

    openFreeAssetsLoaderFromDialog: () =>
      set({
        meshMissingDialogOpen: false,
        freeAssetsLoaderOpen: true,
      }),

    openModelLoaderFromDialog: () =>
      set({
        meshMissingDialogOpen: false,
        modelLoaderOpen: true,
      }),

    setFreeAssetsLoaderOpen: (open) => set({ freeAssetsLoaderOpen: open }),
    setModelLoaderOpen: (open) => set({ modelLoaderOpen: open }),
    setModelCatalogOpen: (open) => {
      if (open) {
        openAssetManagerBrowseModels();
      }
      set({ modelCatalogOpen: false });
    },
  }),
);
