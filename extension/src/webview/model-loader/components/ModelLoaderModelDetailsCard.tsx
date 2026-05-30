import React from "react";
import type { ModelLoaderDetailsSelection } from "../types";
import { ModelLoaderGroupCard } from "./ModelLoaderGroupCard";
import { ModelLoaderR3FPreview } from "../ui/ModelLoaderR3FPreview";

export interface ModelLoaderModelDetailsCardProps {
  selected: ModelLoaderDetailsSelection | null;
}

function formatBytes(bytes?: number): string {
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes < 0) {
    return "-";
  }
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function formatDateTime(ts?: number): string {
  if (typeof ts !== "number" || Number.isNaN(ts) || ts <= 0) {
    return "-";
  }
  return new Date(ts).toLocaleString();
}

export function ModelLoaderModelDetailsCard({ selected }: ModelLoaderModelDetailsCardProps) {
  return (
    <>
      <ModelLoaderGroupCard title="3D Preview" defaultOpen>
        {selected ? (
          <ModelLoaderR3FPreview modelUrl={selected.modelUrl} />
        ) : (
          <p className="text-xs text-gray-500">Select a local model row to preview 3D.</p>
        )}
      </ModelLoaderGroupCard>

      <ModelLoaderGroupCard title="Model Details" defaultOpen>
        {selected ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div className="h-28 rounded border border-white/15 bg-black/20 p-2">
                {selected.thumbnailUrl ? (
                  <img
                    src={selected.thumbnailUrl}
                    alt={`${selected.name || selected.productId || "Model"} thumbnail`}
                    className="h-full w-full object-contain rounded"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                    Thumbnail unavailable.
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5 text-xs">
              <span className="text-gray-400">Source</span>
              <span className="text-gray-300 capitalize">{selected.source}</span>
              <span className="text-gray-400">Product ID</span>
              <span className="font-mono text-blue-300 break-all">{selected.productId || "-"}</span>
              <span className="text-gray-400">Name</span>
              <span className="text-gray-200 wrap-break-word">{selected.name || "-"}</span>
              <span className="text-gray-400">Category</span>
              <span className="text-gray-300 wrap-break-word">
                {selected.category || "Uncategorized"}
              </span>
              <span className="text-gray-400">Has Animations</span>
              <span className="text-gray-300">{selected.hasAnimations ?? "-"}</span>
              <span className="text-gray-400">Clip Count</span>
              <span className="text-gray-300">{selected.clipCount ?? "-"}</span>
              <span className="text-gray-400">Clips</span>
              <span className="text-gray-300 wrap-break-word">{selected.clips ?? "-"}</span>
              <span className="text-gray-400">Type</span>
              <span className="font-mono uppercase text-cyan-300/90">{selected.fileType ?? "-"}</span>
              <span className="text-gray-400">Size</span>
              <span className="text-gray-300">{formatBytes(selected.sizeBytes)}</span>
              <span className="text-gray-400">Updated</span>
              <span className="text-gray-300">{formatDateTime(selected.updatedAtMs)}</span>
              <span className="text-gray-400">Created At</span>
              <span className="font-mono text-gray-300">{selected.createdAt ?? "-"}</span>
              <span className="text-gray-400">Updated At</span>
              <span className="font-mono text-gray-300">{selected.updatedAt ?? "-"}</span>
              <span className="text-gray-400">Description</span>
              <span className="text-gray-300 wrap-break-word">{selected.description ?? "-"}</span>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Metadata JSON Preview
              </p>
              {selected.metadataJson ? (
                <pre className="max-h-44 overflow-auto scrollbar-dark-small text-[11px] text-gray-300 whitespace-pre-wrap break-all">
                  {JSON.stringify(selected.metadataJson, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-gray-500">Selected row has no metadata JSON.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Select a row to view model details.</p>
        )}
      </ModelLoaderGroupCard>
    </>
  );
}
