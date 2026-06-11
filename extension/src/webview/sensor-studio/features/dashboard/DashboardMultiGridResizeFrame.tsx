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

type FrameRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function defaultResolveTargetElement(sourceNodeId: string): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.querySelector(
    `[data-dashboard-widget-id="${sourceNodeId}"],[data-dashboard-group-id="${sourceNodeId}"]`,
  );
}

function measureUnionFrameRect(
  sourceNodeIds: readonly string[],
  overlayRoot: HTMLElement | null,
  resolveTargetElement: (sourceNodeId: string) => HTMLElement | null,
): FrameRect | null {
  if (overlayRoot == null || sourceNodeIds.length === 0) {
    return null;
  }
  const rootRect = overlayRoot.getBoundingClientRect();
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  let found = false;
  for (const sourceNodeId of sourceNodeIds) {
    const target = resolveTargetElement(sourceNodeId);
    if (target == null) {
      continue;
    }
    const targetRect = target.getBoundingClientRect();
    left = Math.min(left, targetRect.left);
    top = Math.min(top, targetRect.top);
    right = Math.max(right, targetRect.right);
    bottom = Math.max(bottom, targetRect.bottom);
    found = true;
  }
  if (!found) {
    return null;
  }
  return {
    left: left - rootRect.left + overlayRoot.scrollLeft,
    top: top - rootRect.top + overlayRoot.scrollTop,
    width: right - left,
    height: bottom - top,
  };
}

type DashboardMultiGridResizeFrameProps = {
  sourceNodeIds: readonly string[];
  selectionCount: number;
  overlayRootRef: RefObject<HTMLElement | null>;
  resizeEnabled: boolean;
  unionPlacement: DashboardPlacementV1 | null;
  metrics: DashboardGridMetricsV1;
  gridElement: HTMLElement | null;
  onPreviewUnion: (nextUnion: DashboardPlacementV1) => void;
  onCommitUnion: (nextUnion: DashboardPlacementV1) => void;
  onClearPreview: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  resolveTargetElement?: (sourceNodeId: string) => HTMLElement | null;
  /** When true, omit the outer bloom shadow on the union frame (Widget Editor). */
  flatFrame?: boolean;
};

export function DashboardMultiGridResizeFrame(props: DashboardMultiGridResizeFrameProps) {
  const {
    sourceNodeIds,
    selectionCount,
    overlayRootRef,
    resizeEnabled,
    unionPlacement,
    metrics,
    gridElement,
    onPreviewUnion,
    onCommitUnion,
    onClearPreview,
    onDragStart,
    onDragEnd,
    resolveTargetElement = defaultResolveTargetElement,
    flatFrame = false,
  } = props;

  const [frameRect, setFrameRect] = useState<FrameRect | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalRoot(overlayRootRef.current);
  }, [overlayRootRef]);

  useLayoutEffect(() => {
    const overlayRoot = overlayRootRef.current;
    if (overlayRoot == null) {
      setFrameRect(null);
      return;
    }
    const measure = () => {
      setFrameRect(measureUnionFrameRect(sourceNodeIds, overlayRoot, resolveTargetElement));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(overlayRoot);
    for (const sourceNodeId of sourceNodeIds) {
      const target = resolveTargetElement(sourceNodeId);
      if (target != null) {
        observer.observe(target);
      }
    }
    window.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure, true);
    };
  }, [overlayRootRef, resolveTargetElement, sourceNodeIds]);

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
        className={
          flatFrame
            ? "pointer-events-none absolute inset-0 border-2 border-cyan-400/80"
            : "pointer-events-none absolute inset-0 border-2 border-cyan-400/80 shadow-[0_0_0_1px_rgba(9,9,11,0.9),0_0_12px_rgba(34,211,238,0.15)]"
        }
        aria-hidden
      />
      <div className="pointer-events-none absolute -top-6 left-0 max-w-full truncate rounded border border-cyan-400/40 bg-zinc-950/95 px-1.5 py-0.5 text-[10px] font-medium text-cyan-100 shadow-sm">
        {selectionCount} selected
        {!resizeEnabled ? " · mixed grids" : ""}
      </div>
      {resizeEnabled && unionPlacement != null
        ? DASHBOARD_GRID_RESIZE_HANDLES.map((handle) => {
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
                aria-label={`Resize selection ${handle.kind}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startDashboardGridResizeSession({
                    handle: handle.kind,
                    pointerId: event.pointerId,
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    basePlacement: unionPlacement,
                    gridElement,
                    metrics,
                    onDragStart,
                    onPreview: onPreviewUnion,
                    onCommit: (nextUnion) => {
                      onCommitUnion(nextUnion);
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
          })
        : null}
    </div>,
    portalRoot,
  );
}
