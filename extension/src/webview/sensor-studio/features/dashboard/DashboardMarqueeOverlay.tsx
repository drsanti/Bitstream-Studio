import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { DashboardMarqueeRect } from "../../core/dashboard/dashboard-marquee-select";

type DashboardMarqueeOverlayProps = {
  rect: DashboardMarqueeRect;
  overlayRootRef: RefObject<HTMLElement | null>;
};

function marqueeRectInOverlayRoot(
  rect: DashboardMarqueeRect,
  overlayRoot: HTMLElement,
): DashboardMarqueeRect {
  const rootRect = overlayRoot.getBoundingClientRect();
  return {
    left: rect.left - rootRect.left + overlayRoot.scrollLeft,
    top: rect.top - rootRect.top + overlayRoot.scrollTop,
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
  };
}

export function DashboardMarqueeOverlay({ rect, overlayRootRef }: DashboardMarqueeOverlayProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [positionedRect, setPositionedRect] = useState<DashboardMarqueeRect>(rect);

  useLayoutEffect(() => {
    setPortalRoot(overlayRootRef.current);
  }, [overlayRootRef]);

  useLayoutEffect(() => {
    const overlayRoot = overlayRootRef.current;
    if (overlayRoot == null) {
      return;
    }
    const sync = () => {
      setPositionedRect(marqueeRectInOverlayRoot(rect, overlayRoot));
    };
    sync();
    overlayRoot.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      overlayRoot.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [overlayRootRef, rect]);

  if (portalRoot == null) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none absolute z-20 border-2 border-cyan-400/90 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(9,9,11,0.85)]"
      style={{
        left: positionedRect.left,
        top: positionedRect.top,
        width: positionedRect.width,
        height: positionedRect.height,
      }}
      aria-hidden
    />,
    portalRoot,
  );
}
