import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Monitor, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../ui/TRN/TRNButton.js";
import { TRNHintTooltip } from "../../ui/TRN/TRNHintTooltip.js";
import { TrnLiveDataPulseIcon } from "../../ui/TRN/TrnLiveDataPulseIcon.js";
import type { PreviewMeshDialogKind } from "../state/previewMeshMissingUi.store.js";

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
 * plain summary, technical detail on “Details” hover.
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
  const chrome = variantChrome(kind);
  const [pulseKey, setPulseKey] = useState(0);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    setVisible(true);
    setPulseKey((k) => k + 1);
  }, [open]);

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
      >
        <button
          type="button"
          className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-600/55 bg-zinc-900/55 text-zinc-400 transition-colors hover:bg-zinc-800/85 hover:text-zinc-100"
          aria-label="Close"
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={twMerge(
              "flex h-14 w-14 items-center justify-center rounded-full border",
              chrome.iconShell,
            )}
            aria-hidden
          >
            <StatusDialogIcon kind={kind} pulseKey={pulseKey} />
          </div>

          <div className="space-y-2 px-1">
            <h2
              id={titleId}
              className={twMerge("text-base font-semibold tracking-tight", chrome.titleClass)}
            >
              {title}
            </h2>
            <p id={summaryId} className="text-sm leading-relaxed text-zinc-300">
              {summary}
            </p>
          </div>

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
            <p className="text-[11px] text-zinc-500">
              <TRNHintTooltip
                trigger={<span className="text-zinc-400">Technical details</span>}
                content={detail}
                triggerAriaLabel="Technical details about this issue"
                placement="top-start"
                triggerWrapper="span"
                wide
              />
            </p>
          ) : null}

          <div className="flex w-full flex-row flex-wrap justify-end gap-2 pt-1">
            <TRNButton size="compact" onClick={onDismiss}>
              Dismiss
            </TRNButton>
            <TRNButton size="compact" onClick={onOpenSetup}>
              Setup
            </TRNButton>
            <TRNButton size="compact" selected onClick={onOpenFreeLoader}>
              Free Loader
            </TRNButton>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
