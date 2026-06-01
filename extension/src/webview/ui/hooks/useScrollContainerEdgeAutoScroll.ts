import { useEffect, type RefObject } from "react";

const EDGE_ZONE_PX = 36;
const MIN_SPEED_PX = 3;
const MAX_SPEED_PX = 14;

/**
 * While the pointer is in the top/bottom band of a scroll container, scroll continuously
 * (for menus with `scrollbar-hide` and a max height).
 */
export function useScrollContainerEdgeAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    const el = containerRef.current;
    if (el == null || !enabled) {
      return;
    }

    let direction = 0;
    let speedPx = MIN_SPEED_PX;
    let rafId = 0;

    const stop = () => {
      direction = 0;
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const tick = () => {
      rafId = 0;
      if (direction === 0) {
        return;
      }
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) {
        stop();
        return;
      }
      const next = el.scrollTop + direction * speedPx;
      el.scrollTop = Math.max(0, Math.min(maxScroll, next));
      const atEnd = direction > 0 && el.scrollTop >= maxScroll - 0.5;
      const atStart = direction < 0 && el.scrollTop <= 0.5;
      if (!atEnd && !atStart) {
        rafId = requestAnimationFrame(tick);
      } else {
        stop();
      }
    };

    const schedule = () => {
      if (direction !== 0 && rafId === 0) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (el.scrollHeight <= el.clientHeight + 1) {
        stop();
        return;
      }
      const rect = el.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const height = rect.height;

      if (y >= height - EDGE_ZONE_PX) {
        const depth = Math.min(EDGE_ZONE_PX, y - (height - EDGE_ZONE_PX));
        direction = 1;
        speedPx =
          MIN_SPEED_PX +
          (depth / EDGE_ZONE_PX) * (MAX_SPEED_PX - MIN_SPEED_PX);
      } else if (y <= EDGE_ZONE_PX) {
        const depth = Math.min(EDGE_ZONE_PX, EDGE_ZONE_PX - y);
        direction = -1;
        speedPx =
          MIN_SPEED_PX +
          (depth / EDGE_ZONE_PX) * (MAX_SPEED_PX - MIN_SPEED_PX);
      } else {
        stop();
        return;
      }
      schedule();
    };

    const onMouseLeave = () => {
      stop();
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      stop();
    };
  }, [containerRef, enabled]);
}
