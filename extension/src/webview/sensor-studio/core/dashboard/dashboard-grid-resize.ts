import type { DashboardPlacementV1 } from "./dashboard-placement";

export type DashboardGridMetricsV1 = {
  columns: number;
  gapPx: number;
  paddingPx: number;
  rowHeightPx: number;
};

export type DashboardGridResizeHandleKind =
  | "nw"
  | "n"
  | "ne"
  | "w"
  | "e"
  | "sw"
  | "s"
  | "se";

export function pointerToDashboardGridCell(args: {
  clientX: number;
  clientY: number;
  gridRect: DOMRect;
  metrics: DashboardGridMetricsV1;
  gridElement?: HTMLElement | null;
}): { column: number; row: number } {
  const { clientX, clientY, gridRect, metrics } = args;
  let { columns, gapPx, paddingPx, rowHeightPx } = metrics;
  let rowGapPx = gapPx;
  let paddingTopPx = paddingPx;
  let paddingRightPx = paddingPx;

  if (args.gridElement != null) {
    const style = getComputedStyle(args.gridElement);
    const paddingLeft = Number.parseFloat(style.paddingLeft);
    const paddingTop = Number.parseFloat(style.paddingTop);
    const paddingRight = Number.parseFloat(style.paddingRight);
    const columnGap = Number.parseFloat(style.columnGap);
    const parsedRowGap = Number.parseFloat(style.rowGap);
    if (Number.isFinite(paddingLeft)) {
      paddingPx = paddingLeft;
    }
    if (Number.isFinite(paddingTop)) {
      paddingTopPx = paddingTop;
    }
    if (Number.isFinite(paddingRight)) {
      paddingRightPx = paddingRight;
    }
    if (Number.isFinite(columnGap)) {
      gapPx = columnGap;
    }
    if (Number.isFinite(parsedRowGap)) {
      rowGapPx = parsedRowGap;
    }
    const autoRowPx = Number.parseFloat(style.gridAutoRows);
    if (Number.isFinite(autoRowPx) && autoRowPx > 0) {
      rowHeightPx = autoRowPx;
    }
  }

  const innerWidth = Math.max(1, gridRect.width - paddingPx - paddingRightPx);
  const colWidth = (innerWidth - gapPx * Math.max(0, columns - 1)) / columns;
  const stepX = colWidth + gapPx;
  const stepY = rowHeightPx + rowGapPx;
  const x = clientX - gridRect.left - paddingPx;
  const y = clientY - gridRect.top - paddingTopPx;
  const column = Math.min(columns, Math.max(1, Math.floor(x / stepX) + 1));
  const row = Math.max(1, Math.floor(y / stepY) + 1);
  return { column, row };
}

/** @deprecated Prefer {@link computeDashboardPlacementFromResize} */
export function computeDashboardSpanFromCorner(args: {
  origin: Pick<DashboardPlacementV1, "column" | "row">;
  targetColumn: number;
  targetRow: number;
  columns: number;
}): Pick<DashboardPlacementV1, "columnSpan" | "rowSpan"> {
  const columnSpan = Math.max(1, args.targetColumn - args.origin.column + 1);
  const rowSpan = Math.max(1, args.targetRow - args.origin.row + 1);
  const maxSpan = args.columns - args.origin.column + 1;
  return {
    columnSpan: Math.min(columnSpan, maxSpan),
    rowSpan,
  };
}

export function computeDashboardPlacementFromResize(args: {
  base: DashboardPlacementV1;
  handle: DashboardGridResizeHandleKind;
  targetColumn: number;
  targetRow: number;
  columns: number;
}): DashboardPlacementV1 {
  const { base, handle, targetColumn, targetRow, columns } = args;
  const colEnd = base.column + base.columnSpan - 1;
  const rowEnd = base.row + base.rowSpan - 1;

  let column = base.column;
  let row = base.row;
  let columnSpan = base.columnSpan;
  let rowSpan = base.rowSpan;

  switch (handle) {
    case "se":
      columnSpan = Math.max(1, targetColumn - base.column + 1);
      rowSpan = Math.max(1, targetRow - base.row + 1);
      break;
    case "e":
      columnSpan = Math.max(1, targetColumn - base.column + 1);
      break;
    case "s":
      rowSpan = Math.max(1, targetRow - base.row + 1);
      break;
    case "sw": {
      const nextColumn = Math.min(Math.max(1, targetColumn), colEnd);
      column = nextColumn;
      columnSpan = colEnd - nextColumn + 1;
      rowSpan = Math.max(1, targetRow - base.row + 1);
      break;
    }
    case "w": {
      const nextColumn = Math.min(Math.max(1, targetColumn), colEnd);
      column = nextColumn;
      columnSpan = colEnd - nextColumn + 1;
      break;
    }
    case "nw": {
      const nextColumn = Math.min(Math.max(1, targetColumn), colEnd);
      const nextRow = Math.min(Math.max(1, targetRow), rowEnd);
      column = nextColumn;
      row = nextRow;
      columnSpan = colEnd - nextColumn + 1;
      rowSpan = rowEnd - nextRow + 1;
      break;
    }
    case "n": {
      const nextRow = Math.min(Math.max(1, targetRow), rowEnd);
      row = nextRow;
      rowSpan = rowEnd - nextRow + 1;
      break;
    }
    case "ne": {
      const nextRow = Math.min(Math.max(1, targetRow), rowEnd);
      row = nextRow;
      rowSpan = rowEnd - nextRow + 1;
      columnSpan = Math.max(1, targetColumn - base.column + 1);
      break;
    }
  }

  column = Math.max(1, Math.min(column, columns));
  columnSpan = Math.max(1, Math.min(columnSpan, columns - column + 1));
  row = Math.max(1, row);
  rowSpan = Math.max(1, rowSpan);

  return { column, row, columnSpan, rowSpan };
}

export function startDashboardGridResizeSession(args: {
  handle: DashboardGridResizeHandleKind;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  basePlacement: DashboardPlacementV1;
  gridElement: HTMLElement | null;
  metrics: DashboardGridMetricsV1;
  onDragStart: () => void;
  onPreview: (placement: DashboardPlacementV1) => void;
  onCommit: (placement: DashboardPlacementV1) => void;
  onDragEnd: () => void;
}): void {
  args.onDragStart();

  const resolvePlacement = (clientX: number, clientY: number): DashboardPlacementV1 => {
    if (args.gridElement == null) {
      return args.basePlacement;
    }
    const cell = pointerToDashboardGridCell({
      clientX,
      clientY,
      gridRect: args.gridElement.getBoundingClientRect(),
      metrics: args.metrics,
      gridElement: args.gridElement,
    });
    return computeDashboardPlacementFromResize({
      base: args.basePlacement,
      handle: args.handle,
      targetColumn: cell.column,
      targetRow: cell.row,
      columns: args.metrics.columns,
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
    event.preventDefault();
    args.onPreview(resolvePlacement(event.clientX, event.clientY));
  };

  const onEnd = (event: PointerEvent) => {
    if (event.pointerId !== args.pointerId) {
      return;
    }
    event.preventDefault();
    cleanup(onMove, onEnd);
    const next = resolvePlacement(event.clientX, event.clientY);
    args.onCommit(next);
    args.onDragEnd();
  };

  args.onPreview(resolvePlacement(args.startClientX, args.startClientY));
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onEnd);
  document.addEventListener("pointercancel", onEnd);
}
