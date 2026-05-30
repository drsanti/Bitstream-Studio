import { useCallback, useEffect, useRef, useState } from "react";

const EPSILON_PX = 2;

/**
 * Tracks vertical overflow on a scroll container and whether the user can scroll further down (or up).
 * Observes inner content size via ResizeObserver so hint updates when children height changes.
 */
export function useScrollOverflowHint(enabled: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (el == null || !enabled) {
      setCanScrollDown(false);
      setCanScrollUp(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - EPSILON_PX);
    setCanScrollUp(scrollTop > EPSILON_PX);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCanScrollDown(false);
      setCanScrollUp(false);
      return;
    }
    const el = scrollRef.current;
    const inner = contentRef.current;
    if (el == null) {
      return;
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(() => {
      update();
    });
    ro.observe(el);
    if (inner != null) {
      ro.observe(inner);
    }
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [enabled, update]);

  return {
    scrollRef,
    contentRef,
    canScrollDown,
    canScrollUp,
  };
}
