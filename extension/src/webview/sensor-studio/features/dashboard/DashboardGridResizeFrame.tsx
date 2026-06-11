import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  startDashboardGridResizeSession,
  type DashboardGridMetricsV1,
} from "../../core/dashboard/dashboard-grid-resize";
import type { DashboardPlacementV1 } from "../../core/dashboard/dashboard-placement";
import {
  DASHBOARD_GRID_RESIZE_HANDLES,
  dashboardGridResizeHandleDimensions,
  dashboardGridResizeHandleHitDimensions,
} from "./dashboard-grid-resize-handles";

type DashboardGridResizeFrameProps = {
  targetSourceNodeId: string;
  selectionLabel: string;
  basePlacement: DashboardPlacementV1;
  metrics: DashboardGridMetricsV1;
  gridElement: HTMLElement | null;
  /** Scroll + clip root — resize chrome is portaled here (not document.body). */
  overlayRootRef: RefObject<HTMLElement | null>;
  onPreviewPlacement: (placement: DashboardPlacementV1) => void;
  onCommitPlacement: (placement: DashboardPlacementV1) => void;
  onClearPreview: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

type FrameRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function resolveTargetElement(sourceNodeId: string): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.querySelector(
    `[data-dashboard-widget-id="${sourceNodeId}"],[data-dashboard-group-id="${sourceNodeId}"]`,
  );
}

function measureFrameRect(
  targetSourceNodeId: string,
  overlayRoot: HTMLElement | null,
): FrameRect | null {
  const target = resolveTargetElement(targetSourceNodeId);
  if (target == null || overlayRoot == null) {
    return null;
  }
  const targetRect = target.getBoundingClientRect();
  const rootRect = overlayRoot.getBoundingClientRect();
  return {
    left: targetRect.left - rootRect.left + overlayRoot.scrollLeft,
    top: targetRect.top - rootRect.top + overlayRoot.scrollTop,
    width: targetRect.width,
    height: targetRect.height,
  };
}

export function DashboardGridResizeFrame(props: DashboardGridResizeFrameProps) {
  const {
    targetSourceNodeId,
    selectionLabel,
    basePlacement,
    metrics,
    gridElement,
    overlayRootRef,
    onPreviewPlacement,
    onCommitPlacement,
    onClearPreview,
    onDragStart,
    onDragEnd,
  } = props;

  const [frameRect, setFrameRect] = useState<FrameRect | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalRoot(overlayRootRef.current);
  }, [overlayRootRef]);

  useLayoutEffect(() => {
    let raf = 0;
    const sync = () => {
      setFrameRect(measureFrameRect(targetSourceNodeId, overlayRootRef.current));
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);

    const overlayRoot = overlayRootRef.current;
    const onScroll = () => {
      setFrameRect(measureFrameRect(targetSourceNodeId, overlayRootRef.current));
    };
    overlayRoot?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      overlayRoot?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [overlayRootRef, targetSourceNodeId]);

  if (frameRect == null || portalRoot == null) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none absolute z-10 touch-none"
      style={{
        left: frameRect.left,
        top: frameRect.top,
        width: frameRect.width,
        height: frameRect.height,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 border-2 border-cyan-400/90 shadow-[0_0_0_1px_rgba(9,9,11,0.9),0_0_18px_rgba(34,211,238,0.18)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-6 left-0 max-w-full truncate rounded border border-cyan-400/40 bg-zinc-950/95 px-1.5 py-0.5 text-[10px] font-medium text-cyan-100 shadow-sm"
        aria-hidden
      >
        {selectionLabel}
      </div>
      {DASHBOARD_GRID_RESIZE_HANDLES.map((handle) => {
        const visual = dashboardGridResizeHandleDimensions(handle);
        const hit = dashboardGridResizeHandleHitDimensions(handle);
        const isCorner = handle.variant === "corner";
        return (
          <button
            key={handle.kind}
            type="button"
            className="absolute z-10 flex touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-200"
            style={{
              ...handle.hitStyle,
              width: hit.width,
              height: hit.height,
              cursor: handle.cursor,
              pointerEvents: "auto",
            }}
            aria-label={`Resize ${handle.kind}`}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              startDashboardGridResizeSession({
                handle: handle.kind,
                pointerId: event.pointerId,
                startClientX: event.clientX,
                startClientY: event.clientY,
                basePlacement,
                gridElement,
                metrics,
                onDragStart,
                onPreview: onPreviewPlacement,
                onCommit: (placement) => {
                  onCommitPlacement(placement);
                  onClearPreview();
                },
                onDragEnd,
              });
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <span
              className={
                isCorner
                  ? "rounded-sm border border-zinc-950/90 bg-cyan-400 shadow-[0_0_0_1px_rgba(34,211,238,0.65)]"
                  : "rounded-full border border-zinc-950/90 bg-cyan-400/95 shadow-[0_0_0_1px_rgba(34,211,238,0.65)]"
              }
              style={{
                width: visual.width,
                height: visual.height,
                pointerEvents: "none",
              }}
              aria-hidden
            />
          </button>
        );
      })}
    </div>,
    portalRoot,
  );
}
