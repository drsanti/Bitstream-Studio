import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, ChevronRight, Monitor, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../ui/TRN/TRNButton.js";
import { TrnLiveDataPulseIcon } from "../../ui/TRN/TrnLiveDataPulseIcon.js";
import type { PreviewMeshDialogKind } from "../state/previewMeshMissingUi.store.js";

/** Auto-dismiss when the pointer is not over the dialog card (pauses on hover). */
export const PREVIEW_MESH_STATUS_AUTO_DISMISS_MS = 5000;

export type PreviewMeshStatusDialogProps = {
  open: boolean;
  kind: PreviewMeshDialogKind;
  title: string;
  summary: string;
  detail?: string;
  bullets?: readonly string[];
  onDismiss: () => void;
  onOpenSetup: () => void;
  onOpenFreeLoader: () => void;
  zIndex?: number;
};

type VariantChrome = {
  border: string;
  panel: string;
  iconShell: string;
  iconClass: string;
  titleClass: string;
  ringVar: string;
};

function variantChrome(kind: PreviewMeshDialogKind): VariantChrome {
  if (kind === "webgl") {
    return {
      border: "border-amber-400/28",
      panel: "bg-zinc-950/72",
      iconShell: "border-amber-400/35 bg-amber-500/12",
      iconClass: "text-amber-300",
      titleClass: "text-amber-50",
      ringVar: "rgba(251, 191, 36, 0.32)",
    };
  }
  return {
    border: "border-sky-400/25",
    panel: "bg-zinc-950/72",
    iconShell: "border-sky-400/35 bg-sky-500/12",
    iconClass: "text-sky-300",
    titleClass: "text-sky-50",
    ringVar: "rgba(56, 189, 248, 0.3)",
  };
}

function StatusDialogIcon(props: { kind: PreviewMeshDialogKind; pulseKey: number }) {
  const { kind, pulseKey } = props;
  const Icon = kind === "webgl" ? Monitor : Box;
  const chrome = variantChrome(kind);

  return (
    <TrnLiveDataPulseIcon
      pulseTriggerKey={pulseKey}
      enabled
      intensityPreset="subtle"
      animationPreset="smooth"
      colorAnimationEnabled={false}
      throttleMs={1200}
      className="flex items-center justify-center"
    >
      <Icon className={twMerge("h-9 w-9", chrome.iconClass)} strokeWidth={1.75} aria-hidden />
    </TrnLiveDataPulseIcon>
  );
}

/**
 * Operator-facing 3D / asset status dialog — glass card, subtle {@link TrnLiveDataPulseIcon},
 * plain summary, technical detail in a collapsible block.
 */
export function PreviewMeshStatusDialog(props: PreviewMeshStatusDialogProps) {
  const {
    open,
    kind,
    title,
    summary,
    detail,
    bullets = [],
    onDismiss,
    onOpenSetup,
    onOpenFreeLoader,
    zIndex = 80,
  } = props;

  const titleId = useId();
  const summaryId = useId();
  const detailPanelId = useId();
  const chrome = variantChrome(kind);
  const [pulseKey, setPulseKey] = useState(0);
  const [visible, setVisible] = useState(open);
  const [technicalDetailsOpen, setTechnicalDetailsOpen] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissAtRef = useRef<number | null>(null);
  const remainingMsRef = useRef(PREVIEW_MESH_STATUS_AUTO_DISMISS_MS);
  const hoverPausedRef = useRef(false);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current != null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(
    (delayMs: number) => {
      clearDismissTimer();
      const clamped = Math.max(0, delayMs);
      remainingMsRef.current = clamped;
      if (clamped <= 0) {
        onDismiss();
        return;
      }
      dismissAtRef.current = Date.now() + clamped;
      dismissTimerRef.current = setTimeout(() => {
        dismissTimerRef.current = null;
        onDismiss();
      }, clamped);
    },
    [clearDismissTimer, onDismiss],
  );

  const handlePointerEnter = useCallback(() => {
    clearDismissTimer();
    const dismissAt = dismissAtRef.current;
    if (dismissAt != null) {
      remainingMsRef.current = Math.max(0, dismissAt - Date.now());
    }
    dismissAtRef.current = null;
    hoverPausedRef.current = true;
  }, [clearDismissTimer]);

  const handlePointerLeave = useCallback(() => {
    if (!hoverPausedRef.current) {
      return;
    }
    const remaining = remainingMsRef.current;
    hoverPausedRef.current = false;
    scheduleDismiss(remaining);
  }, [scheduleDismiss]);

  useEffect(() => {
    if (!open) {
      clearDismissTimer();
      hoverPausedRef.current = false;
      setVisible(false);
      return;
    }
    setVisible(true);
    setPulseKey((k) => k + 1);
    setTechnicalDetailsOpen(false);
    hoverPausedRef.current = false;
    remainingMsRef.current = PREVIEW_MESH_STATUS_AUTO_DISMISS_MS;
    scheduleDismiss(PREVIEW_MESH_STATUS_AUTO_DISMISS_MS);
    return clearDismissTimer;
  }, [open, clearDismissTimer, scheduleDismiss]);

  if (!visible || typeof document === "undefined") {
    return null;
  }

  const showDetail = detail != null && detail.trim().length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--preview-mesh-dialog-z)] flex items-center justify-center p-4"
      style={{ ["--preview-mesh-dialog-z" as string]: zIndex }}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[3px]"
        aria-label="Dismiss"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        aria-describedby={summaryId}
        className={twMerge(
          "relative w-full max-w-[420px] rounded-xl border px-5 pb-4 pt-5 shadow-[0_28px_72px_rgba(0,0,0,0.58)] backdrop-blur-xl",
          chrome.border,
          chrome.panel,
        )}
        style={{ ["--trn-floating-notice-ring" as string]: chrome.ringVar }}
        onClick={(e) => e.stopPropagation()}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <button
          type="button"
          className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-600/55 bg-zinc-900/55 text-zinc-400 transition-colors hover:bg-zinc-800/85 hover:text-zinc-100"
          aria-label="Close"
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </button>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-3">
            <div
              className={twMerge(
                "flex h-14 w-14 items-center justify-center rounded-full border",
                chrome.iconShell,
              )}
              aria-hidden
            >
              <StatusDialogIcon kind={kind} pulseKey={pulseKey} />
            </div>

            <h2
              id={titleId}
              className={twMerge(
                "px-1 text-center text-base font-semibold tracking-tight",
                chrome.titleClass,
              )}
            >
              {title}
            </h2>
          </div>

          <p id={summaryId} className="px-1 text-left text-sm leading-relaxed text-zinc-300">
            {summary}
          </p>

          {bullets.length > 0 ? (
            <div className="w-full rounded-lg border border-zinc-700/55 bg-zinc-900/45 px-3 py-2.5 text-left">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                What to try
              </p>
              <ul className="mb-0 list-none space-y-1.5 pl-0 text-xs leading-relaxed text-zinc-300">
                {bullets.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-500" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showDetail ? (
            <div className="w-full text-left">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-sm px-0.5 py-0.5 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                aria-expanded={technicalDetailsOpen}
                aria-controls={detailPanelId}
                onClick={() => setTechnicalDetailsOpen((open) => !open)}
              >
                <ChevronRight
                  className={twMerge(
                    "h-3 w-3 shrink-0 transition-transform duration-150",
                    technicalDetailsOpen ? "rotate-90" : "rotate-0",
                  )}
                  strokeWidth={2.25}
                  aria-hidden
                />
                Technical details
              </button>
              {technicalDetailsOpen ? (
                <div
                  id={detailPanelId}
                  className="mt-2 rounded-lg border border-zinc-700/55 bg-zinc-900/45 px-3 py-2 text-xs leading-relaxed text-zinc-400"
                >
                  {detail}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-zinc-700/55 pt-3">
            <div className="flex flex-wrap gap-2">
              <TRNButton size="compact" selected onClick={onOpenFreeLoader}>
                Free Loader
              </TRNButton>
              <TRNButton size="compact" onClick={onOpenSetup}>
                Setup
              </TRNButton>
            </div>
            <button
              type="button"
              className="rounded-sm px-1.5 py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
