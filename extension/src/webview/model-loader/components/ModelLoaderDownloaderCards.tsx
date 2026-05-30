import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "../../ui/components/Button";
import type { ModelLoaderJobEvent, ModelLoaderJobState } from "../types";
import { ModelLoaderGroupCard } from "./ModelLoaderGroupCard";
import { ModelLoaderInfoCard, type ModelLoaderInfoCardProps } from "./ModelLoaderInfoCard";

export interface ModelLoaderDownloaderJobHistoryItem {
  jobId: string;
  productId: string;
  outputDir: string;
  state: string;
  error?: string;
}

export interface ModelLoaderDownloaderCardsProps extends ModelLoaderInfoCardProps {
  jobHistory: ModelLoaderDownloaderJobHistoryItem[];
  jobEvents: ModelLoaderJobEvent[];
  currentJobState: ModelLoaderJobState | null;
  loading: boolean;
  buttonClassName: string;
  onClearJobHistory: () => void;
  onRetryJob: (jobId: string) => void;
}

export function ModelLoaderDownloaderCards({
  selectedModelInfo,
  lastDownloadResult,
  jobHistory,
  jobEvents,
  currentJobState,
  loading,
  buttonClassName,
  onClearJobHistory,
  onRetryJob,
}: ModelLoaderDownloaderCardsProps) {
  return (
    <>
      <ModelLoaderInfoCard
        selectedModelInfo={selectedModelInfo}
        lastDownloadResult={lastDownloadResult}
      />

      <ModelLoaderGroupCard title="Job History" defaultOpen={false}>
        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            className={buttonClassName}
            onClick={onClearJobHistory}
            disabled={jobHistory.length === 0}
            title="Clear persisted history"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
        <div className="max-h-48 overflow-auto scrollbar-dark-small text-xs space-y-2">
          {jobHistory.length === 0 ? (
            <p className="text-gray-400">No jobs yet.</p>
          ) : (
            jobHistory.map((item) => (
              <div
                key={item.jobId}
                className="rounded border border-white/10 bg-neutral-950/50 p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-gray-300">
                    <span className="font-mono text-gray-400">{item.jobId}</span>
                    {" - "}
                    <span className="text-gray-200">{item.productId}</span>
                  </div>
                  <Button
                    variant="secondary"
                    className={buttonClassName}
                    onClick={() => void onRetryJob(item.jobId)}
                    disabled={item.state === "running" || loading}
                    title="Retry this job with same product/output"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry
                  </Button>
                </div>
                <p className="text-gray-400 mt-1">
                  State: <span className="text-gray-200">{item.state}</span>
                </p>
                <p className="text-gray-500">Output: {item.outputDir}</p>
                {item.error && <p className="text-red-300">{item.error}</p>}
              </div>
            ))
          )}
        </div>
      </ModelLoaderGroupCard>

      <ModelLoaderGroupCard title="Download Activity" defaultOpen={false}>
        <div className="text-xs text-gray-300">
          {currentJobState ? (
            <p>
              Current job <span className="font-mono">{currentJobState.jobId}</span>{" "}
              is{" "}
              <span className="inline-flex rounded border border-sky-400/35 bg-sky-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-sky-100">
                {currentJobState.state}
              </span>
              .
            </p>
          ) : (
            <p className="text-gray-400">No active jobs. Select a model and start download.</p>
          )}
        </div>
        <div className="max-h-32 overflow-auto scrollbar-dark-small text-xs space-y-1">
          {jobEvents.length === 0 ? (
            <p className="text-gray-400">No events yet.</p>
          ) : (
            jobEvents.slice(0, 10).map((event, index) => (
              <p
                key={`${event.jobId}-${event.eventType}-${index}`}
                className="text-gray-300 rounded border border-white/10 bg-neutral-950/50 px-2 py-1"
              >
                <span className="font-mono text-gray-400">{event.jobId}</span>{" "}
                <span className="text-gray-200">{event.eventType}</span>{" "}
                <span className="text-gray-500">({event.state})</span>
                {event.message ? ` - ${event.message}` : ""}
              </p>
            ))
          )}
        </div>
      </ModelLoaderGroupCard>
    </>
  );
}
