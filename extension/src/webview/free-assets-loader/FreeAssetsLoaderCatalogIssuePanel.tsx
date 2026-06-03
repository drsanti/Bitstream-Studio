import type { ReactNode } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { ModelLoaderGroupCard } from "../ui/catalog/ModelLoaderGroupCard.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { TRNHintText } from "../ui/TRN/TRNHintText.js";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";

export type FreeAssetsLoaderCatalogIssue =
  | { kind: "rate_limit" }
  | { kind: "error"; message: string };

export function classifyFreeAssetsCatalogFetchError(
  raw: string,
): FreeAssetsLoaderCatalogIssue {
  const lower = raw.toLowerCase();
  if (
    raw.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("abuse detection") ||
    lower.includes("api rate limit exceeded")
  ) {
    return { kind: "rate_limit" };
  }
  return { kind: "error", message: raw };
}

export function FreeAssetsLoaderCatalogIssuePanel(props: {
  issue: FreeAssetsLoaderCatalogIssue;
  localCount: number;
  isExtension: boolean;
  listLoading: boolean;
  onRetry: () => void;
  onOpenLocalTab: () => void;
}): ReactNode {
  const { issue, localCount, isExtension, listLoading, onRetry, onOpenLocalTab } = props;
  const copy = ternionFreeAssetPackCopy.catalogRateLimit;

  if (issue.kind === "rate_limit") {
    return (
      <div
        className="flex min-h-[min(36vh,280px)] flex-col items-center justify-center px-4 py-8"
        role="alert"
      >
        <div className="w-full max-w-lg rounded-lg border border-amber-500/30 bg-amber-950/25 p-4 text-left">
          <div className="flex items-start gap-2.5">
            <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-200/90" aria-hidden />
            <div className="min-w-0 space-y-2">
              <h3 className="text-[13px] font-semibold text-amber-50/95">{copy.title}</h3>
              <p className="text-[12px] leading-relaxed text-zinc-300">{copy.summary}</p>
              <TRNHintText tone="warn" className="text-[11px]">
                {copy.waitHint}
              </TRNHintText>
              <p className="text-[12px] leading-relaxed text-zinc-400">
                {copy.stillWorks(localCount)}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <TRNButton
                  size="compact"
                  selected
                  prefixIcon={
                    listLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    )
                  }
                  onClick={onRetry}
                  disabled={listLoading}
                >
                  Try again
                </TRNButton>
                <TRNButton size="compact" onClick={onOpenLocalTab}>
                  On this device
                </TRNButton>
              </div>
              <ModelLoaderGroupCard
                title="Optional — faster catalog access"
                defaultOpen={false}
                className="mt-2 border-zinc-700/70 bg-zinc-950/40 shadow-none ring-0"
                contentClassName="space-y-1.5"
              >
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  {isExtension ? copy.advancedExtension : copy.advancedBrowser}
                </p>
              </ModelLoaderGroupCard>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[min(36vh,280px)] flex-col items-center justify-center gap-3 px-4 py-10 text-center"
      role="alert"
    >
      <div className="max-w-lg space-y-2 text-left">
        <h3 className="text-[13px] font-semibold text-zinc-100">
          {ternionFreeAssetPackCopy.catalogListErrorTitle}
        </h3>
        <p className="text-[12px] leading-relaxed text-zinc-400">{issue.message}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <TRNButton
            size="compact"
            selected
            prefixIcon={<RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            onClick={onRetry}
            disabled={listLoading}
          >
            Try again
          </TRNButton>
          <TRNButton size="compact" onClick={onOpenLocalTab}>
            On this device
          </TRNButton>
        </div>
      </div>
    </div>
  );
}
