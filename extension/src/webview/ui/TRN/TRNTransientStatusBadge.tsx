import { useEffect, useRef, useState } from "react";
import { AlertCircle, CircleCheckBig, Loader2 } from "lucide-react";
import { gsap } from "gsap";

export type TRNTransientStatusState = "idle" | "pending" | "ok" | "error";

type TRNTransientStatusBadgeProps = {
  state: TRNTransientStatusState;
  message?: string;
  pendingLabel?: string;
  okLabel?: string;
  errorLabel?: string;
  /** Duration before fading out after **OK**. Errors use {@link errorAutoHideMs} so users can hover the native `title` tooltip. */
  autoHideMs?: number;
  /** Duration before fading out after **error** (longer default than OK). */
  errorAutoHideMs?: number;
  className?: string;
};

export function TRNTransientStatusBadge({
  state,
  message,
  pendingLabel = "Pending",
  okLabel = "OK",
  errorLabel = "Error",
  autoHideMs = 2000,
  errorAutoHideMs = 12_000,
  className = "",
}: TRNTransientStatusBadgeProps) {
  const [uiState, setUiState] = useState<TRNTransientStatusState>(state);
  const uiStateRef = useRef(uiState);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  useEffect(() => {
    const animateIn = () => {
      if (badgeRef.current == null) {
        return;
      }
      gsap.fromTo(
        badgeRef.current,
        { autoAlpha: 0, y: -4 },
        { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" },
      );
    };

    const animateOut = (onComplete?: () => void) => {
      if (badgeRef.current == null) {
        onComplete?.();
        return;
      }
      gsap.to(badgeRef.current, {
        autoAlpha: 0,
        y: -4,
        duration: 0.2,
        ease: "power2.in",
        onComplete,
      });
    };

    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const next = state;
    const current = uiStateRef.current;

    const scheduleAutoHide = () => {
      if (next !== "ok" && next !== "error") {
        return;
      }
      const ms = next === "error" ? errorAutoHideMs : autoHideMs;
      hideTimerRef.current = setTimeout(() => {
        animateOut(() => {
          setUiState("idle");
        });
      }, ms);
    };

    if (next === "idle") {
      if (current !== "idle") {
        animateOut(() => {
          setUiState("idle");
        });
      }
      return () => {
        if (hideTimerRef.current != null) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      };
    }

    if (current === "idle") {
      setUiState(next);
      requestAnimationFrame(() => {
        animateIn();
        scheduleAutoHide();
      });
    } else {
      animateOut(() => {
        setUiState(next);
        requestAnimationFrame(() => {
          animateIn();
          scheduleAutoHide();
        });
      });
    }

    return () => {
      if (badgeRef.current != null) {
        gsap.killTweensOf(badgeRef.current);
      }
      if (hideTimerRef.current != null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [autoHideMs, errorAutoHideMs, state]);

  if (uiState === "idle") {
    return null;
  }

  const showDetail = Boolean(message) && (uiState === "pending" || uiState === "error");

  return (
    <span
      ref={badgeRef}
      className={`inline-flex items-center gap-1.5 pr-1 text-[11px] font-semibold ${
        uiState === "pending"
          ? "text-amber-300"
          : uiState === "ok"
            ? "text-emerald-300"
            : "text-rose-300"
      } ${className}`}
      title={uiState === "pending" || uiState === "error" ? message : undefined}
    >
      {uiState === "pending" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden strokeWidth={3} />
      ) : uiState === "ok" ? (
        <CircleCheckBig className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
      )}
      <span>{uiState === "pending" ? pendingLabel : uiState === "ok" ? okLabel : errorLabel}</span>
      {showDetail ? (
        <span className="max-w-[280px] truncate font-normal text-zinc-100/80">
          {message}
        </span>
      ) : null}
    </span>
  );
}
