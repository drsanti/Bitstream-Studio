import React, { useEffect, useState } from "react";
import type { CatalogListDownloadedEntry } from "../../model-downloader/protocol";
import { useModelDownloaderOverWs } from "../model-downloader/useModelDownloaderOverWs";
import type { ModelEntry } from "./modelCatalog-types";
import { bridgeWebPathToCatalogModelUrl } from "./modelCatalogMerge";
import { AlertDialog } from "../ui/components/AlertDialog";
import { resolveCatalogBridgeListErrorPresentation } from "./catalog-bridge-list-error";

function mapBridgeToModelEntries(entries: CatalogListDownloadedEntry[]): ModelEntry[] {
  return entries.map((e) => ({
    id: e.id,
    name: e.name,
    modelCategory:
      typeof e.category === "string" && e.category.trim() !== ""
        ? e.category.trim()
        : "Uncategorized",
    fileType: e.fileType,
    url: bridgeWebPathToCatalogModelUrl(e.webPath),
    catalogCategory: "downloaded",
    dedupeKey: e.dedupeKey,
    modelSource: "dynamic",
  }));
}

export interface ModelCatalogBridgeDownloadedProps {
  active: boolean;
  refreshNonce: number;
  /** Bumps when local downloads may have changed (poll, push, or full refresh). */
  downloadedListNonce: number;
  onModels: (models: ModelEntry[]) => void;
  onStatus?: (status: { connectionState: string; error?: string | null }) => void;
}

/**
 * Fetches dynamically listed models from the model-downloader bridge (filesystem scan).
 * Only mount when running in the browser (not VS Code webview).
 */
export function ModelCatalogBridgeDownloaded({
  active,
  refreshNonce,
  downloadedListNonce,
  onModels,
  onStatus,
}: ModelCatalogBridgeDownloadedProps) {
  const [assetLayoutDialog, setAssetLayoutDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    detail?: string;
  }>({ open: false, title: "", message: "" });
  const { connect, disconnect, listCatalogDownloadedModels, connectionState, error } =
    useModelDownloaderOverWs();

  useEffect(() => {
    onStatus?.({ connectionState, error });
  }, [connectionState, error, onStatus]);

  useEffect(() => {
    if (!active) {
      onModels([]);
      setAssetLayoutDialog({ open: false, title: "", message: "" });
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await connect();
        const raw = await listCatalogDownloadedModels();
        if (!cancelled) {
          onModels(mapBridgeToModelEntries(raw));
          setAssetLayoutDialog({ open: false, title: "", message: "" });
        }
      } catch (err) {
        if (!cancelled) {
          onModels([]);
          const presentation = resolveCatalogBridgeListErrorPresentation(err);
          if (presentation.showDialog) {
            console.warn("[ModelCatalog] Bridge catalog list failed", err);
            setAssetLayoutDialog({
              open: true,
              title: presentation.title,
              message: presentation.message,
              detail: presentation.detail,
            });
          } else {
            console.warn(
              "[ModelCatalog] Bridge catalog list skipped (non-blocking):",
              presentation.detail ?? presentation.message,
            );
            setAssetLayoutDialog({ open: false, title: "", message: "" });
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    active,
    refreshNonce,
    downloadedListNonce,
    connect,
    listCatalogDownloadedModels,
    onModels,
  ]);

  useEffect(() => {
    if (!active) {
      void disconnect();
    }
  }, [active, disconnect]);

  return (
    <>
      <AlertDialog
        open={assetLayoutDialog.open}
        title={assetLayoutDialog.title}
        message={assetLayoutDialog.message}
        detail={assetLayoutDialog.detail}
        onClose={() => setAssetLayoutDialog({ open: false, title: "", message: "" })}
      />
    </>
  );
}
