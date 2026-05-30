/*******************************************************************************
 * File Name : TRNFloatingNotice.tsx
 *
 * Description : Centered glass notice (no backdrop by default), optional auto-dismiss
 *               and progress bar. For apply OK, short confirmations, non-blocking feedback.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import "./TRNFloatingNotice.css";

export type TRNFloatingNoticeVariant = "success" | "info" | "warning" | "error";

export type TRNFloatingNoticeProps = {
  open: boolean;
  title: string;
  message?: string;
  variant?: TRNFloatingNoticeVariant;
  prefixIcon?: ReactNode;
  /** Auto-close after ms; `0` disables timer (manual close only). Default 3200. */
  autoDismissMs?: number;
  /** Countdown bar when `autoDismissMs` > 0. Default true. */
  showProgress?: boolean;
  /** Pause auto-dismiss timer while the pointer is over the card (progress bar stays visible). Default false. */
  pauseDismissOnHover?: boolean;
  /** Dim full-screen backdrop. Default false. */
  showBackdrop?: boolean;
  showClose?: boolean;
  zIndex?: number;
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

type VariantChrome = {
  border: string;
  panel: string;
  iconShell: string;
  icon: string;
  title: string;
  progress: string;
  ringVar: string;
};

function variantChrome(variant: TRNFloatingNoticeVariant): VariantChrome
{
  switch (variant)
  {
    case "info":
      return {
        border: "border-sky-400/25",
        panel: "bg-zinc-950/55",
        iconShell: "border-sky-400/40 bg-sky-500/15",
        icon: "text-sky-400",
        title: "text-sky-50",
        progress: "bg-sky-400/80",
        ringVar: "rgba(56, 189, 248, 0.35)",
      };
    case "warning":
      return {
        border: "border-amber-400/30",
        panel: "bg-zinc-950/55",
        iconShell: "border-amber-400/40 bg-amber-500/15",
        icon: "text-amber-400",
        title: "text-amber-50",
        progress: "bg-amber-400/80",
        ringVar: "rgba(251, 191, 36, 0.35)",
      };
    case "error":
      return {
        border: "border-rose-400/30",
        panel: "bg-zinc-950/55",
        iconShell: "border-rose-400/40 bg-rose-500/15",
        icon: "text-rose-400",
        title: "text-rose-50",
        progress: "bg-rose-400/80",
        ringVar: "rgba(251, 113, 133, 0.35)",
      };
    case "success":
    default:
      return {
        border: "border-emerald-400/25",
        panel: "bg-zinc-950/55",
        iconShell: "border-emerald-400/40 bg-emerald-500/15",
        icon: "text-emerald-400",
        title: "text-emerald-50",
        progress: "bg-emerald-400/80",
        ringVar: "rgba(52, 211, 153, 0.35)",
      };
  }
}

function defaultVariantIcon(variant: TRNFloatingNoticeVariant): ReactNode
{
  const iconClass = "h-9 w-9";
  switch (variant)
  {
    case "info":
      return <Info className={twMerge(iconClass, "text-sky-400")} strokeWidth={2} aria-hidden />;
    case "warning":
      return (
        <AlertTriangle className={twMerge(iconClass, "text-amber-400")} strokeWidth={2} aria-hidden />
      );
    case "error":
      return (
        <CircleAlert className={twMerge(iconClass, "text-rose-400")} strokeWidth={2} aria-hidden />
      );
    case "success":
    default:
      return (
        <CircleCheck className={twMerge(iconClass, "text-emerald-400")} strokeWidth={2} aria-hidden />
      );
  }
}

const EXIT_ANIMATION_MS = 220;

/**
 * Non-blocking floating notice: glass card centered in the viewport.
 * Unlike {@link TRNAlertOverlay}, no backdrop unless `showBackdrop` is set.
 */
export function TRNFloatingNotice(props: TRNFloatingNoticeProps)
{
  const {
    open,
    title,
    message,
    variant = "success",
    prefixIcon,
    autoDismissMs = 3200,
    showProgress = true,
    pauseDismissOnHover = false,
    showBackdrop = false,
    showClose = true,
    zIndex = 120,
    className,
    onOpenChange,
  } = props;

  const titleId = useId();
  const messageId = useId();
  const chrome = variantChrome(variant);
  const icon = prefixIcon ?? defaultVariantIcon(variant);

  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [progressDurationMs, setProgressDurationMs] = useState(autoDismissMs);
  const [progressEpoch, setProgressEpoch] = useState(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissAtRef = useRef<number | null>(null);
  const remainingMsRef = useRef(autoDismissMs);
  const hoverPausedRef = useRef(false);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current != null)
    {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearDismissTimer();
    if (exitTimerRef.current != null)
    {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, [clearDismissTimer]);

  const scheduleDismiss = useCallback(
    (delayMs: number) => {
      clearDismissTimer();
      const clamped = Math.max(0, delayMs);
      remainingMsRef.current = clamped;
      if (clamped <= 0)
      {
        requestCloseRef.current();
        return;
      }
      dismissAtRef.current = Date.now() + clamped;
      dismissTimerRef.current = setTimeout(() => {
        dismissTimerRef.current = null;
        requestCloseRef.current();
      }, clamped);
    },
    [clearDismissTimer],
  );

  const requestCloseRef = useRef<() => void>(() => {});

  const requestClose = useCallback(() => {
    clearTimers();
    setHoverPaused(false);
    hoverPausedRef.current = false;
    setExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onOpenChange?.(false);
      exitTimerRef.current = null;
    }, EXIT_ANIMATION_MS);
  }, [clearTimers, onOpenChange]);

  requestCloseRef.current = requestClose;

  const handlePointerEnter = useCallback(() => {
    if (!pauseDismissOnHover || autoDismissMs <= 0)
    {
      return;
    }
    clearDismissTimer();
    const dismissAt = dismissAtRef.current;
    if (dismissAt != null)
    {
      remainingMsRef.current = Math.max(0, dismissAt - Date.now());
    }
    dismissAtRef.current = null;
    hoverPausedRef.current = true;
    setHoverPaused(true);
  }, [pauseDismissOnHover, autoDismissMs, clearDismissTimer]);

  const handlePointerLeave = useCallback(() => {
    if (!pauseDismissOnHover || autoDismissMs <= 0 || !hoverPausedRef.current)
    {
      return;
    }
    const remaining = remainingMsRef.current;
    hoverPausedRef.current = false;
    setHoverPaused(false);
    scheduleDismiss(remaining);
  }, [pauseDismissOnHover, autoDismissMs, scheduleDismiss]);

  useEffect(() => {
    if (!open)
    {
      clearTimers();
      setVisible(false);
      setExiting(false);
      setHoverPaused(false);
      hoverPausedRef.current = false;
      return;
    }

    setExiting(false);
    setVisible(true);
    setHoverPaused(false);
    hoverPausedRef.current = false;
    clearTimers();
    remainingMsRef.current = autoDismissMs;
    setProgressDurationMs(autoDismissMs);
    setProgressEpoch((epoch) => epoch + 1);

    if (autoDismissMs > 0)
    {
      scheduleDismiss(autoDismissMs);
    }

    return clearTimers;
  }, [open, autoDismissMs, clearTimers, scheduleDismiss]);

  useEffect(() => {
    if (!visible || !showClose)
    {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape")
      {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, showClose, requestClose]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!visible || typeof document === "undefined")
  {
    return null;
  }

  const panelStyle: CSSProperties = {
    zIndex,
    ["--trn-floating-notice-ring" as string]: chrome.ringVar,
    ...(autoDismissMs > 0 && showProgress
      ? { ["--trn-floating-notice-dismiss-ms" as string]: `${progressDurationMs}ms` }
      : {}),
  };

  const showProgressBar = autoDismissMs > 0 && showProgress;

  return createPortal(
    <div
      className={twMerge(
        "fixed inset-0 flex items-center justify-center p-4",
        showBackdrop ? "pointer-events-auto" : "pointer-events-none",
      )}
      style={panelStyle}
      role="status"
      aria-live="polite"
    >
      {showBackdrop ? (
        <button
          type="button"
          className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
          aria-label="Close notice"
          onClick={requestClose}
        />
      ) : null}
      <div
        role="dialog"
        aria-modal={showBackdrop}
        aria-labelledby={titleId}
        aria-describedby={message != null && message.length > 0 ? messageId : undefined}
        className={twMerge(
          "trn-floating-notice-card pointer-events-auto relative w-full max-w-[300px] rounded-xl border px-5 pb-4 pt-5",
          "shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl",
          chrome.border,
          chrome.panel,
          exiting ? "trn-floating-notice-card--exit" : "trn-floating-notice-card--enter",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {showClose ? (
          <button
            type="button"
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-600/60 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
            aria-label="Close"
            onClick={requestClose}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}

        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={twMerge(
              "trn-floating-notice-icon-shell flex h-14 w-14 items-center justify-center rounded-full border",
              chrome.iconShell,
            )}
            aria-hidden
          >
            <div className="trn-floating-notice-icon flex items-center justify-center">{icon}</div>
          </div>
          <div className="space-y-1 px-1">
            <h2
              id={titleId}
              className={twMerge("text-sm font-semibold tracking-tight", chrome.title)}
            >
              {title}
            </h2>
            {message != null && message.length > 0 ? (
              <p id={messageId} className="text-[11px] leading-relaxed text-zinc-300/90">
                {message}
              </p>
            ) : null}
          </div>
          {showProgressBar ? (
            <div
              className="h-0.5 w-full overflow-hidden rounded-full bg-zinc-800/80"
              aria-hidden
            >
              <div
                key={`trn-floating-notice-progress-${progressEpoch}`}
                className={twMerge(
                  "trn-floating-notice-progress h-full rounded-full",
                  chrome.progress,
                  hoverPaused && "trn-floating-notice-progress--paused",
                )}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
