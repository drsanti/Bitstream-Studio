import type { PointerEvent as ReactPointerEvent } from "react";
import {
  startDashboardGridResizeSession,
  type DashboardGridMetricsV1,
  type DashboardGridResizeHandleKind,
} from "../../sensor-studio/core/dashboard/dashboard-grid-resize";
import { startDashboardGridDragSession } from "../../sensor-studio/core/dashboard/dashboard-grid-drag-move";
import type { GridPlacementV1 } from "../schemas/placement";
import {
  DASHBOARD_GRID_RESIZE_HANDLES,
  dashboardGridResizeHandleDimensions,
  dashboardGridResizeHandleHitDimensions,
} from "../../sensor-studio/features/dashboard/dashboard-grid-resize-handles";

const RESIZE_HANDLES: DashboardGridResizeHandleKind[] = ["se", "e", "s"];

export function CourseGridEditChrome({
  blockId,
  placement,
  gridElement,
  metrics,
  onSelect,
  onPreviewPlacement,
  onCommitPlacement,
  onClearPreview,
  onGestureStart,
}: {
  blockId: string;
  placement: GridPlacementV1;
  gridElement: HTMLElement | null;
  metrics: DashboardGridMetricsV1;
  onSelect: () => void;
  onPreviewPlacement: (placement: GridPlacementV1) => void;
  onCommitPlacement: (placement: GridPlacementV1) => void;
  onClearPreview: () => void;
  onGestureStart: () => void;
}) {
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    startDashboardGridDragSession({
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originRow: placement.row,
      originColumn: placement.column,
      gridElement,
      metrics,
      placement,
      onSelect,
      onDragActive: onGestureStart,
      onPreview: (row, column) => onPreviewPlacement({ ...placement, row, column }),
      onCommit: (row, column) => {
        onCommitPlacement({ ...placement, row, column });
        onClearPreview();
      },
      onDragEnd: onClearPreview,
    });
  };

  const startResize = (
    handle: DashboardGridResizeHandleKind,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    startDashboardGridResizeSession({
      handle,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      basePlacement: placement,
      gridElement,
      metrics,
      onDragStart: () => {
        onSelect();
        onGestureStart();
      },
      onPreview: onPreviewPlacement,
      onCommit: (next) => {
        onCommitPlacement(next);
        onClearPreview();
      },
      onDragEnd: onClearPreview,
    });
  };

  return (
    <div
      className="course-grid-edit-chrome pointer-events-none absolute inset-0 z-10"
      data-course-block-chrome={blockId}
    >
      <div
        className="course-grid-edit-chrome__drag pointer-events-auto absolute inset-x-2 top-1 flex h-5 cursor-grab items-center justify-center rounded-md border border-amber-500/35 bg-amber-500/15 active:cursor-grabbing"
        onPointerDown={startDrag}
      >
        <span className="text-2xs font-semibold uppercase tracking-wide text-amber-100/90">
          Drag
        </span>
      </div>
      {DASHBOARD_GRID_RESIZE_HANDLES.filter((handle) => RESIZE_HANDLES.includes(handle.kind)).map(
        (handle) => {
          const size = dashboardGridResizeHandleDimensions(handle);
          const hit = dashboardGridResizeHandleHitDimensions(handle);
          return (
            <button
              key={handle.kind}
              type="button"
              aria-label={`Resize ${handle.kind}`}
              className="course-grid-edit-chrome__handle pointer-events-auto absolute rounded-sm border border-amber-400/70 bg-amber-300/90 shadow-sm"
              style={{
                ...handle.hitStyle,
                width: hit.width,
                height: hit.height,
                cursor: handle.cursor,
              }}
              onPointerDown={(event) => startResize(handle.kind, event)}
            >
              <span
                className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-sm bg-amber-50"
                style={{ width: size.width, height: size.height }}
              />
            </button>
          );
        },
      )}
    </div>
  );
}
