import {
  pointerToDashboardGridCell,
  type DashboardGridMetricsV1,
} from "./dashboard-grid-resize";
import type { DashboardPlacementV1 } from "./dashboard-placement";

const DRAG_THRESHOLD_PX = 5;

export function clampDashboardGridOrigin(args: {
  column: number;
  row: number;
  columnSpan: number;
  columns: number;
}): { column: number; row: number } {
  const maxColumn = Math.max(1, args.columns - args.columnSpan + 1);
  return {
    column: Math.min(maxColumn, Math.max(1, Math.round(args.column))),
    row: Math.max(1, Math.round(args.row)),
  };
}

export function dashboardGridCellFromPointer(args: {
  clientX: number;
  clientY: number;
  gridElement: HTMLElement;
  metrics: DashboardGridMetricsV1;
  placement: Pick<DashboardPlacementV1, "columnSpan">;
}): { column: number; row: number } {
  const cell = pointerToDashboardGridCell({
    clientX: args.clientX,
    clientY: args.clientY,
    gridRect: args.gridElement.getBoundingClientRect(),
    metrics: args.metrics,
    gridElement: args.gridElement,
  });
  return clampDashboardGridOrigin({
    column: cell.column,
    row: cell.row,
    columnSpan: args.placement.columnSpan,
    columns: args.metrics.columns,
  });
}

export function startDashboardGridDragSession(args: {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originRow: number;
  originColumn: number;
  gridElement: HTMLElement | null;
  metrics: DashboardGridMetricsV1;
  placement: DashboardPlacementV1;
  onSelect: () => void;
  onDragActive: () => void;
  onPreview: (row: number, column: number) => void;
  onCommit: (row: number, column: number) => void;
  onDragEnd: () => void;
}): void {
  args.onSelect();

  let dragActive = false;

  const resolveCell = (clientX: number, clientY: number) => {
    if (args.gridElement == null) {
      return {
        row: args.originRow,
        column: args.originColumn,
      };
    }
    return dashboardGridCellFromPointer({
      clientX,
      clientY,
      gridElement: args.gridElement,
      metrics: args.metrics,
      placement: args.placement,
    });
  };

  const cleanup = (move: (e: PointerEvent) => void, end: (e: PointerEvent) => void) => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", end);
    document.removeEventListener("pointercancel", end);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerId !== args.pointerId) {
      return;
    }
    if (!dragActive) {
      const dx = event.clientX - args.startClientX;
      const dy = event.clientY - args.startClientY;
      if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        return;
      }
      dragActive = true;
      args.onDragActive();
    }
    event.preventDefault();
    const cell = resolveCell(event.clientX, event.clientY);
    args.onPreview(cell.row, cell.column);
  };

  const onEnd = (event: PointerEvent) => {
    if (event.pointerId !== args.pointerId) {
      return;
    }
    event.preventDefault();
    cleanup(onMove, onEnd);
    if (dragActive) {
      const cell = resolveCell(event.clientX, event.clientY);
      args.onCommit(cell.row, cell.column);
    }
    args.onDragEnd();
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onEnd);
  document.addEventListener("pointercancel", onEnd);
}
