import { useCallback, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownToLine, Copy, Terminal, Trash2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { CollapsibleCard } from "../CollapsibleCard";
import { GlassIconButton } from "../common";

/** Serial log header: ghost icons only, no hover fill. */
const serialLogToolbarIconClass =
  "hover:!bg-transparent active:!bg-transparent disabled:hover:!bg-transparent";

/** Props for the serial/log viewer; parent owns `lines` and persistence. */
export type SerialDataViewerProps = {
  lines: readonly string[];
  autoScroll: boolean;
  onAutoScrollChange: (enabled: boolean) => void;
  onClear: () => void;
  onCopySuccess?: () => void;
  onCopyError?: (message: string) => void;
  className?: string;
  emptyHint?: string;
  /** Collapsible card header label (default: "Received data"). */
  cardTitle?: string;
  /** Leading icon in the card header (default: Terminal). */
  cardIcon?: LucideIcon;
  /**
   * When `true`, header toggles open/closed like a normal {@link CollapsibleCard}.
   * Serial monitor defaults to always-expanded.
   * @default false
   */
  collapsible?: boolean;
};

/**
 * Reusable log viewer inside a {@link CollapsibleCard}: header shows title,
 * line count, and actions (auto-scroll, copy, clear); body is the scrollable log.
 */
export function SerialDataViewer({
  lines,
  autoScroll,
  onAutoScrollChange,
  onClear,
  onCopySuccess,
  onCopyError,
  className,
  emptyHint = "No serial data yet. Connect the bridge and open a port.",
  cardTitle = "Received data",
  cardIcon: CardIcon = Terminal,
  collapsible = false,
}: SerialDataViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copyBusy, setCopyBusy] = useState(false);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines, autoScroll]);

  const handleCopy = useCallback(async () => {
    if (lines.length === 0 || copyBusy) {
      return;
    }
    const text = lines.join("\n");
    setCopyBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      onCopySuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      onCopyError?.(message);
    } finally {
      setCopyBusy(false);
    }
  }, [lines, copyBusy, onCopySuccess, onCopyError]);

  const hasLines = lines.length > 0;
  const lineCountLabel = hasLines
    ? `${lines.length} line${lines.length === 1 ? "" : "s"}`
    : "No lines";

  return (
    <CollapsibleCard
      title={cardTitle}
      icon={CardIcon}
      titleSupplement={
        <span className="tabular-nums text-gray-400">{lineCountLabel}</span>
      }
      headerActions={
        <>
          <GlassIconButton
            type="button"
            variant="ghost"
            compact
            color={autoScroll ? "emerald" : "gray"}
            pressed={autoScroll}
            aria-label={
              autoScroll
                ? "Auto-scroll on; click to pause following new lines"
                : "Auto-scroll off; click to follow new lines"
            }
            icon={<ArrowDownToLine className="opacity-90" aria-hidden />}
            className={serialLogToolbarIconClass}
            onClick={() => onAutoScrollChange(!autoScroll)}
          />
          <GlassIconButton
            type="button"
            variant="ghost"
            compact
            color="gray"
            aria-label="Copy all log lines to clipboard"
            icon={<Copy className="opacity-90" aria-hidden />}
            disabled={!hasLines || copyBusy}
            className={serialLogToolbarIconClass}
            onClick={() => void handleCopy()}
          />
          <GlassIconButton
            type="button"
            variant="ghost"
            compact
            color="gray"
            aria-label="Clear log"
            icon={<Trash2 className="opacity-90" aria-hidden />}
            disabled={!hasLines}
            className={serialLogToolbarIconClass}
            onClick={onClear}
          />
        </>
      }
      collapsible={collapsible}
      defaultOpen
      className={twMerge("min-h-0 flex flex-1 flex-col", className)}
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden space-y-0 p-0"
    >
      <div
        ref={scrollRef}
        className="m-0 min-h-0 flex-1 overflow-auto px-2 py-1.5 font-mono text-[11px] leading-relaxed [scheme:dark] scrollbar-dark-small"
        data-serial-monitor="data-viewer-scroll"
        aria-live="polite"
        aria-label="Received serial output"
      >
        {!hasLines ? (
          <p className="text-zinc-500">{emptyHint}</p>
        ) : (
          lines.map((line, i) => (
            <div
              key={i}
              className="wrap-break-word whitespace-pre-wrap text-lime-300/90"
            >
              {line}
            </div>
          ))
        )}
      </div>
    </CollapsibleCard>
  );
}
