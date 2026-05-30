import { create } from "zustand";

const SESSION_MISSING_DIALOG_PREFIX = "ternion:missing-asset-dialog:";

export type NotifyMissingAssetPayload = {
  /**
   * Dedupe key for `sessionStorage` (one dialog per asset ref per tab session).
   * Example: `studio-model:https://…`, `bitstream:psoc-default-body-glb`.
   */
  dedupeKey: string;
  title?: string;
  /** Plain text (newlines allowed); shown in the dialog body when the warning dialog is used. */
  description: string;
  /** Opens {@link FreeAssetsLoaderDashboard} instead of the warning dialog (default for free-pack / PSOC). */
  autoOpenFreeAssetsLoader?: boolean;
  /** Opens {@link ModelLoaderDashboard} instead of the warning dialog (e.g. catalog download preview). */
  autoOpenModelLoader?: boolean;
};

function resolveMissingAssetUiAction(
  payload: NotifyMissingAssetPayload
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
  missingAssetTitle: string;
  missingAssetDescription: string;
  freeAssetsLoaderOpen: boolean;
  modelLoaderOpen: boolean;
  modelCatalogOpen: boolean;

  /**
   * Opens the shared “missing asset” dialog with copy tailored to the failure.
   * Deduped per session using {@link NotifyMissingAssetPayload.dedupeKey}.
   */
  notifyMissingAsset: (payload: NotifyMissingAssetPayload) => void;

  /** Bitstream PSOC default body GLB — convenience wrapper around {@link notifyMissingAsset}. */
  notifyGlbLoadFailed: () => void;
  closeMeshMissingDialog: () => void;
  openFreeAssetsLoaderFromDialog: () => void;
  openModelLoaderFromDialog: () => void;
  setFreeAssetsLoaderOpen: (open: boolean) => void;
  setModelLoaderOpen: (open: boolean) => void;
  setModelCatalogOpen: (open: boolean) => void;
};

const DEFAULT_MISSING_TITLE = "Asset not found";

const PSOC_MISSING_DESCRIPTION =
  "The PSOC preview mesh could not be loaded. Packaged VSIX builds omit large GLB files.\n\nFree Assets Loader is opening so you can sync the free pack into your extension storage (globalStorage …/assets/free), including models/psoc-e84-ai/.";

export const usePreviewMeshMissingUiStore = create<PreviewMeshMissingUiState>(
  (set, get) => ({
    meshMissingDialogOpen: false,
    missingAssetTitle: DEFAULT_MISSING_TITLE,
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
      const description = payload.description;
      const action = resolveMissingAssetUiAction(payload);

      if (action === "free-loader") {
        set({
          meshMissingDialogOpen: false,
          freeAssetsLoaderOpen: true,
          modelLoaderOpen: false,
          missingAssetTitle: title,
          missingAssetDescription: description,
        });
        return;
      }

      if (action === "model-loader") {
        set({
          meshMissingDialogOpen: false,
          modelLoaderOpen: true,
          freeAssetsLoaderOpen: false,
          missingAssetTitle: title,
          missingAssetDescription: description,
        });
        return;
      }

      set({
        meshMissingDialogOpen: true,
        missingAssetTitle: title,
        missingAssetDescription: description,
      });
    },

    notifyGlbLoadFailed: () => {
      get().notifyMissingAsset({
        dedupeKey: "bitstream:psoc-default-body-glb",
        title: "Preview model not found",
        description: PSOC_MISSING_DESCRIPTION,
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
    setModelCatalogOpen: (open) => set({ modelCatalogOpen: open }),
  }),
);
