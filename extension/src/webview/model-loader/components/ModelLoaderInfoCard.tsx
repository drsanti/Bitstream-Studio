import React from "react";
import { Package } from "lucide-react";
import type { ModelLoaderDownloadResult } from "../types";
import { ModelLoaderGroupCard } from "./ModelLoaderGroupCard";

function formatSize(sizeBytes: number): string {
  if (!sizeBytes || sizeBytes === 0) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = sizeBytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export interface ModelLoaderInfoCardProps {
  selectedModelInfo: unknown | null;
  lastDownloadResult: ModelLoaderDownloadResult | null;
}

export function ModelLoaderInfoCard({
  selectedModelInfo,
  lastDownloadResult,
}: ModelLoaderInfoCardProps) {
  return (
    <>
      <ModelLoaderGroupCard title="Selected Model Info" defaultOpen={false}>
        {selectedModelInfo ? (
          <pre className="max-h-48 overflow-auto scrollbar-dark-small text-xs text-gray-300 rounded border border-white/10 bg-neutral-950/50 p-2">
            {JSON.stringify(selectedModelInfo, null, 2)}
          </pre>
        ) : (
          <p className="text-xs text-gray-400">No model info loaded.</p>
        )}
      </ModelLoaderGroupCard>

      <ModelLoaderGroupCard title="Last Download" defaultOpen={false}>
        {lastDownloadResult ? (
          <div className="space-y-2 text-xs text-gray-300">
            <div>
              <span className="text-gray-400">Product:</span>{" "}
              <span className="font-mono">{lastDownloadResult.productId}</span>
            </div>
            <div>
              <span className="text-gray-400">Output:</span> {lastDownloadResult.outputDir}
            </div>
            <div>
              <span className="text-gray-400">Total Size:</span>{" "}
              {formatSize(lastDownloadResult.totalSize)}
            </div>
            <ul className="space-y-1">
              {lastDownloadResult.downloadedFiles.map((file) => (
                <li key={`${file.label}-${file.filepath}`} className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-200">{file.label}</span>
                  <span className="text-gray-500">{file.filepath}</span>
                  <span className="text-gray-400">{formatSize(file.size)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No downloads yet.</p>
        )}
      </ModelLoaderGroupCard>
    </>
  );
}
