import type { RefObject } from "react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  startDashboardGridResizeSession,
  type DashboardGridMetricsV1,
} from "../../sensor-studio/core/dashboard/dashboard-grid-resize";
import type { PageBlockV1 } from "../schemas/page.v1";
import type { GridPlacementV1 } from "../schemas/placement";
import {
  DASHBOARD_GRID_RESIZE_HANDLES,
  dashboardGridResizeHandleDimensions,
  dashboardGridResizeHandleHitDimensions,
} from "../../sensor-studio/features/dashboard/dashboard-grid-resize-handles";
import { CoursePageGridSelectionToolbar } from "./CoursePageGridSelectionToolbar";

type CoursePageGridResizeFrameProps = {
  block: PageBlockV1;
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

function resolveCourseBlockElement(blockId: string): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.querySelector(`[data-course-block-id="${blockId}"]`);
}

export function CoursePageGridResizeFrame(props: CoursePageGridResizeFrameProps) {
  const {
    block,
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

  const blockId = block.id;

  const [frameRect, setFrameRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    let raf = 0;
    const sync = () => {
      const target = resolveCourseBlockElement(blockId);
      setFrameRect(target?.getBoundingClientRect() ?? null);
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);

    const scrollRoot = scrollRootRef.current;
    const onScroll = () => {
      const target = resolveCourseBlockElement(blockId);
      setFrameRect(target?.getBoundingClientRect() ?? null);
    };
    scrollRoot?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      scrollRoot?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [blockId, scrollRootRef]);

  const portalRoot = scrollRootRef.current;
  if (frameRect == null || portalRoot == null || typeof document === "undefined") {
    return null;
  }

  const portalRect = portalRoot.getBoundingClientRect();
  const toolbarBelow = frameRect.top - portalRect.top < 40;
  const frameStyle = {
    left: frameRect.left - portalRect.left + portalRoot.scrollLeft,
    top: frameRect.top - portalRect.top + portalRoot.scrollTop,
    width: frameRect.width,
    height: frameRect.height,
  };

  return createPortal(
    <div
      data-course-page-grid-resize-frame=""
      className="absolute z-10 touch-none pointer-events-none"
      style={frameStyle}
    >
      <div
        className="pointer-events-none absolute inset-0 border-2 border-amber-400/90 shadow-[0_0_0_1px_rgba(9,9,11,0.9),0_0_18px_rgba(245,158,11,0.18)]"
        aria-hidden
      />
      <CoursePageGridSelectionToolbar block={block} placementBelow={toolbarBelow} />
      {DASHBOARD_GRID_RESIZE_HANDLES.map((handle) => {
        const visual = dashboardGridResizeHandleDimensions(handle);
        const hit = dashboardGridResizeHandleHitDimensions(handle);
        const isCorner = handle.variant === "corner";
        return (
          <button
            key={handle.kind}
            type="button"
            className="absolute z-10 flex touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200"
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
                  ? "rounded-sm border border-zinc-950/90 bg-amber-400 shadow-[0_0_0_1px_rgba(245,158,11,0.65)]"
                  : "rounded-full border border-zinc-950/90 bg-amber-400/95 shadow-[0_0_0_1px_rgba(245,158,11,0.65)]"
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
