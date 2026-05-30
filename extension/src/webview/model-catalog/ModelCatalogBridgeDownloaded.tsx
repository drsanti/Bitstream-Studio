import React, { useEffect, useState } from "react";
import type { CatalogListDownloadedEntry } from "../../model-downloader/protocol";
import { useModelDownloaderOverWs } from "../model-downloader/useModelDownloaderOverWs";
import type { ModelEntry } from "./modelCatalog-types";
import { bridgeWebPathToCatalogModelUrl } from "./modelCatalogMerge";
import { AlertDialog } from "../ui/components/AlertDialog";

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
    message: string;
  }>({ open: false, message: "" });
  const { connect, disconnect, listCatalogDownloadedModels, connectionState, error } =
    useModelDownloaderOverWs();

  useEffect(() => {
    onStatus?.({ connectionState, error });
  }, [connectionState, error, onStatus]);

  useEffect(() => {
    if (!active) {
      onModels([]);
      setAssetLayoutDialog({ open: false, message: "" });
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await connect();
        const raw = await listCatalogDownloadedModels();
        if (!cancelled) {
          onModels(mapBridgeToModelEntries(raw));
          setAssetLayoutDialog({ open: false, message: "" });
        }
      } catch (err) {
        console.warn("[ModelCatalog] Bridge catalog list failed", err);
        if (!cancelled) {
          onModels([]);
          const msg = err instanceof Error ? err.message : String(err);
          setAssetLayoutDialog({ open: true, message: msg });
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
        title="Local asset directories are not configured"
        message={assetLayoutDialog.message}
        onClose={() => setAssetLayoutDialog({ open: false, message: "" })}
      />
    </>
  );
}
