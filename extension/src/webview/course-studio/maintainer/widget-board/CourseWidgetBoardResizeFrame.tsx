import type { RefObject } from "react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  startDashboardGridResizeSession,
  type DashboardGridMetricsV1,
} from "../../../sensor-studio/core/dashboard/dashboard-grid-resize";
import type { GridPlacementV1 } from "../../schemas/placement";
import {
  DASHBOARD_GRID_RESIZE_HANDLES,
  dashboardGridResizeHandleDimensions,
  dashboardGridResizeHandleHitDimensions,
} from "../../../sensor-studio/features/dashboard/dashboard-grid-resize-handles";

type CourseWidgetBoardResizeFrameProps = {
  /** Selected inner cell in the Widget Editor grid (not the Content preview). */
  targetRef: RefObject<HTMLElement | null>;
  basePlacement: GridPlacementV1;
  metrics: DashboardGridMetricsV1;
  gridElement: HTMLElement | null;
  scrollRootRef: RefObject<HTMLElement | null>;
  onPreviewPlacement: (placement: GridPlacementV1) => void;
  onCommitPlacement: (placement: GridPlacementV1) => void;
  onClearPreview: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

export function CourseWidgetBoardResizeFrame(props: CourseWidgetBoardResizeFrameProps) {
  const {
    targetRef,
    basePlacement,
    metrics,
    gridElement,
    scrollRootRef,
    onPreviewPlacement,
    onCommitPlacement,
    onClearPreview,
    onDragStart,
    onDragEnd,
  } = props;

  const [frameRect, setFrameRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    let raf = 0;
    const sync = () => {
      setFrameRect(targetRef.current?.getBoundingClientRect() ?? null);
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);

    const scrollRoot = scrollRootRef.current;
    const onScroll = () => {
      setFrameRect(targetRef.current?.getBoundingClientRect() ?? null);
    };
    scrollRoot?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      scrollRoot?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollRootRef, targetRef]);

  if (frameRect == null || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      data-course-widget-board-resize-frame=""
      className="pointer-events-none fixed z-[200] touch-none"
      style={{
        left: frameRect.left,
        top: frameRect.top,
        width: frameRect.width,
        height: frameRect.height,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 border-2 border-cyan-400/90"
        aria-hidden
      />
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
            aria-label={`Resize widget ${handle.kind}`}
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
    document.body,
  );
}
