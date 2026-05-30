import React, { useMemo } from "react";
import { clsx } from "clsx";
import { Ban, Download, FileJson, Info, RefreshCw } from "lucide-react";
import { Input } from "../../ui/components/Input";
import type { ModelLoaderJobState } from "../types";
import { formatModelLoaderErrorMessage } from "../formatModelLoaderErrorMessage";
import { MODEL_LOADER_SKY_BUTTON_CLASS } from "../modelLoaderSkyButton";

export interface ModelLoaderActionsCardProps {
  selectedProductId: string;
  hasSelection: boolean;
  hasResults: boolean;
  loading: boolean;
  activeProgressPercent: number | null;
  currentJobState: ModelLoaderJobState | null;
  runtimeError: string | null;
  notice: string | null;
  downloadNote: string | null;
  onSelectedProductIdChange: (value: string) => void;
  includeSourceZip: boolean;
  onIncludeSourceZipChange: (value: boolean) => void;
  onGetInfo: () => void;
  onDownload: () => void;
  onDownloadAll: () => void;
  onDownloadInfoJson: () => void;
  onCancel: () => void;
  onRefreshLoadedModels: () => void;
}

export function ModelLoaderActionsCard({
  selectedProductId,
  hasSelection,
  hasResults,
  loading,
  activeProgressPercent,
  currentJobState,
  runtimeError,
  notice,
  downloadNote,
  onSelectedProductIdChange,
  includeSourceZip,
  onIncludeSourceZipChange,
  onGetInfo,
  onDownload,
  onDownloadAll,
  onDownloadInfoJson,
  onCancel,
  onRefreshLoadedModels,
}: ModelLoaderActionsCardProps) {
  const formattedRuntimeError = useMemo(
    () => (runtimeError ? formatModelLoaderErrorMessage(runtimeError) : ""),
    [runtimeError]
  );
  const formattedJobError = useMemo(
    () =>
      currentJobState?.error
        ? formatModelLoaderErrorMessage(currentJobState.error)
        : "",
    [currentJobState?.error]
  );
  const showRuntimeDetails =
    !!runtimeError && formattedRuntimeError !== runtimeError.trim();
  const showJobDetails =
    !!currentJobState?.error &&
    formattedJobError !== (currentJobState.error ?? "").trim();

  const isJobActive =
    currentJobState?.state === "queued" || currentJobState?.state === "running";
  const glassInputClassName =
    "rounded-md border border-white/10 bg-neutral-950/80 backdrop-blur-md px-3 py-1 text-sm text-gray-200 placeholder:text-gray-400 focus:border-white/25 focus:outline-none focus:ring-1 focus:ring-white/10";

  const actionBtn = clsx(MODEL_LOADER_SKY_BUTTON_CLASS, "w-full justify-center");

  return (
    <>
      <div className="space-y-2">
        <Input
          label="Product ID"
          value={selectedProductId}
          onChange={(e) => onSelectedProductIdChange(e.target.value)}
          placeholder="PDM-..."
          disabled={loading || isJobActive}
          inputClassName={glassInputClassName}
        />
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            type="button"
            className={actionBtn}
            onClick={onDownload}
            disabled={loading || isJobActive || !hasSelection}
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Download
          </button>
          <button
            type="button"
            className={actionBtn}
            onClick={onDownloadAll}
            disabled={loading || isJobActive || !hasResults}
            title="Download all models currently listed in Online models table"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Download All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            type="button"
            className={actionBtn}
            onClick={onGetInfo}
            disabled={loading || isJobActive || !hasSelection}
          >
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Get Info
          </button>
          <button
            type="button"
            className={actionBtn}
            onClick={onDownloadInfoJson}
            disabled={loading || isJobActive || !hasSelection}
            title="Download metadata JSON only"
          >
            <FileJson className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Download Info
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            type="button"
            className={actionBtn}
            onClick={onRefreshLoadedModels}
            disabled={loading || isJobActive}
            title="Rescan local downloaded models"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Refresh Loaded
          </button>
          <button
            type="button"
            className={actionBtn}
            onClick={onCancel}
            disabled={currentJobState?.state !== "queued" && currentJobState?.state !== "running"}
          >
            <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Cancel
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="model-loader-include-source-zip"
          type="checkbox"
          checked={includeSourceZip}
          onChange={(e) => onIncludeSourceZipChange(e.target.checked)}
          className="h-4 w-4 rounded border border-white/20 bg-white/5 text-blue-400 focus:ring-1 focus:ring-white/30"
          disabled={loading || isJobActive}
        />
        <label
          htmlFor="model-loader-include-source-zip"
          className="text-xs text-gray-300"
        >
          Include source ZIP (.zip) in Download
        </label>
      </div>

      {activeProgressPercent != null && (
        <div className="space-y-1">
          <div className="text-xs text-gray-300">
            Download progress: {activeProgressPercent}%
            {currentJobState?.progress?.label ? ` - ${currentJobState.progress.label}` : ""}
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full bg-linear-to-r from-sky-500/90 to-cyan-400/85"
              style={{ width: `${Math.min(100, activeProgressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {(runtimeError || notice || downloadNote) && (
        <div className="rounded border border-gray-600/70 bg-black/20 p-2 text-xs space-y-1 max-h-36 overflow-y-auto scrollbar-dark-small">
          {runtimeError && (
            <div className="text-red-300 space-y-1">
              <p className="wrap-break-word whitespace-pre-wrap leading-snug">
                {formattedRuntimeError || "Unknown error"}
              </p>
              {showRuntimeDetails && runtimeError && (
                <details className="text-gray-500">
                  <summary className="cursor-pointer select-none hover:text-gray-400 text-[10px]">
                    Technical details
                  </summary>
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-[10px] text-gray-500">
                    {runtimeError.length > 4000
                      ? `${runtimeError.slice(0, 4000)}…`
                      : runtimeError}
                  </pre>
                </details>
              )}
            </div>
          )}
          {notice && <p className="text-emerald-300 wrap-break-word">{notice}</p>}
          {downloadNote && <p className="text-gray-300 wrap-break-word">{downloadNote}</p>}
        </div>
      )}

      {currentJobState && (
        <div className="rounded border border-white/10 bg-neutral-950/50 p-2 text-xs space-y-1">
          <p className="text-gray-300">
            Job: <span className="font-mono">{currentJobState.jobId}</span>
          </p>
          <p className="text-gray-300">
            State: <span className="font-semibold">{currentJobState.state}</span>
          </p>
          {currentJobState.error && (
            <div className="text-red-300 space-y-1">
              <p className="wrap-break-word whitespace-pre-wrap leading-snug">
                {formattedJobError || currentJobState.error}
              </p>
              {showJobDetails && currentJobState.error && (
                <details className="text-gray-500">
                  <summary className="cursor-pointer select-none hover:text-gray-400 text-[10px]">
                    Technical details
                  </summary>
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-[10px] text-gray-500">
                    {currentJobState.error.length > 4000
                      ? `${currentJobState.error.slice(0, 4000)}…`
                      : currentJobState.error}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
