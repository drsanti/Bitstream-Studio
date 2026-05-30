import { useCallback, useEffect, useRef, useState } from "react";

export type UseScrollbarEdgeRevealOptions = {
  /** Distance from the right edge of the scroll container (CSS px). */
  edgePx?: number;
  /** Delay before hiding after pointer leaves the scroll area. */
  hideDelayMs?: number;
};

/**
 * Reveal a minimal vertical scrollbar when the pointer is near the right edge
 * of the scroll container (WebKit/Blink: 1px track via `.scrollbar-edge-reveal`).
 */
export function useScrollbarEdgeReveal(
  enabled: boolean,
  options?: UseScrollbarEdgeRevealOptions,
) {
  const edgePx = options?.edgePx ?? 14;
  const hideDelayMs = options?.hideDelayMs ?? 320;

  const ref = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setActive(false);
      hideTimerRef.current = null;
    }, hideDelayMs);
  }, [clearHideTimer, hideDelayMs]);

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }
      clearHideTimer();
      const el = ref.current;
      if (el == null) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const nearRight = rect.right - event.clientX <= edgePx;
      setActive(nearRight);
    },
    [enabled, edgePx, clearHideTimer],
  );

  const onMouseLeave = useCallback(() => {
    if (!enabled) {
      return;
    }
    scheduleHide();
  }, [enabled, scheduleHide]);

  const onMouseEnter = useCallback(() => {
    if (!enabled) {
      return;
    }
    clearHideTimer();
  }, [enabled, clearHideTimer]);

  useEffect(() => {
    if (!enabled) {
      setActive(false);
      clearHideTimer();
    }
  }, [enabled, clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const revealClassName = enabled
    ? `scrollbar-edge-reveal ${active ? "scrollbar-edge-reveal--active" : ""}`.trim()
    : "";

  return {
    ref,
    revealClassName,
    onMouseMove,
    onMouseLeave,
    onMouseEnter,
  };
}
