import { useLayoutEffect, useRef, useState, type RefObject } from "react";

const VIEWPORT_PADDING_PX = 8;
const GAP_BELOW_TRIGGER_PX = 4;

export type FixedMenuPlacement = {
  top: number;
  left: number;
  /** False until the panel has been measured (panel is hidden meanwhile). */
  positioned: boolean;
};

export type FixedMenuAlignPreference = "left" | "right";

/**
 * Place a portaled menu under the trigger, flipping/clamping to stay inside the viewport.
 */
export function computeFixedMenuPlacement(
  anchorRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  preferAlign: FixedMenuAlignPreference,
  padding = VIEWPORT_PADDING_PX,
): { top: number; left: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxLeft = Math.max(padding, viewportWidth - padding - panelWidth);

  const spaceOnRight = viewportWidth - padding - anchorRect.left;
  const spaceOnLeft = anchorRect.right - padding;
  const alignRight =
    preferAlign === "right" ||
    (preferAlign === "left" && panelWidth > spaceOnRight && spaceOnLeft >= spaceOnRight);

  let left = alignRight ? anchorRect.right - panelWidth : anchorRect.left;
  left = Math.min(Math.max(left, padding), maxLeft);

  let top = anchorRect.bottom + GAP_BELOW_TRIGGER_PX;
  const maxTop = Math.max(padding, viewportHeight - padding - panelHeight);

  if (top + panelHeight > viewportHeight - padding) {
    const aboveTop = anchorRect.top - GAP_BELOW_TRIGGER_PX - panelHeight;
    if (aboveTop >= padding) {
      top = aboveTop;
    } else {
      top = Math.min(top, maxTop);
    }
  }

  top = Math.min(Math.max(top, padding), maxTop);

  return { top, left };
}

/**
 * Position a portaled menu under (or above) a trigger with viewport collision handling.
 */
export function useFixedMenuAnchor(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  preferAlign: FixedMenuAlignPreference,
): { placement: FixedMenuPlacement | null; panelRef: RefObject<HTMLDivElement | null> } {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [placement, setPlacement] = useState<FixedMenuPlacement | null>(null);

  useLayoutEffect(() => {
    if (!open || anchorRef.current == null) {
      setPlacement(null);
      return;
    }

    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const attachPanelObserver = () => {
      const panel = panelRef.current;
      if (panel == null || resizeObserver != null) {
        return;
      }
      resizeObserver = new ResizeObserver(() => {
        update();
      });
      resizeObserver.observe(panel);
    };

    const update = () => {
      const anchor = anchorRef.current;
      if (anchor == null) {
        setPlacement(null);
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const panel = panelRef.current;
      const panelWidth = panel?.offsetWidth ?? 0;
      const panelHeight = panel?.offsetHeight ?? 0;

      if (panelWidth <= 0 || panelHeight <= 0) {
        setPlacement({
          top: anchorRect.bottom + GAP_BELOW_TRIGGER_PX,
          left: preferAlign === "right" ? anchorRect.right : anchorRect.left,
          positioned: false,
        });
        attachPanelObserver();
        rafId = window.requestAnimationFrame(update);
        return;
      }

      const { top, left } = computeFixedMenuPlacement(
        anchorRect,
        panelWidth,
        panelHeight,
        preferAlign,
      );
      setPlacement({ top, left, positioned: true });
      attachPanelObserver();
    };

    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      resizeObserver = null;
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open, preferAlign]);

  return { placement, panelRef };
}
