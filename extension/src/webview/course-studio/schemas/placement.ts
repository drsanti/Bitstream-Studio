/** Grid placement — same model as Sensor Studio Dashboard (1-based column/row). */

export type GridPlacementV1 = {
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
};

export const DEFAULT_GRID_PLACEMENT: GridPlacementV1 = {
  column: 1,
  row: 1,
  columnSpan: 12,
  rowSpan: 1,
};

function readPositiveInt(value: unknown, fallback: number, min = 1, max = 48): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function coerceGridPlacementV1(raw: unknown): GridPlacementV1 {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_GRID_PLACEMENT };
  }
  const o = raw as Record<string, unknown>;
  return {
    column: readPositiveInt(o.column, DEFAULT_GRID_PLACEMENT.column, 1, 48),
    row: readPositiveInt(o.row, DEFAULT_GRID_PLACEMENT.row, 1, 200),
    columnSpan: readPositiveInt(o.columnSpan, DEFAULT_GRID_PLACEMENT.columnSpan, 1, 48),
    rowSpan: readPositiveInt(o.rowSpan, DEFAULT_GRID_PLACEMENT.rowSpan, 1, 200),
  };
}

/** Keep block spans inside the page grid so cells do not overflow implicit tracks. */
export function clampPlacementToGrid(
  placement: GridPlacementV1,
  columns: number,
): GridPlacementV1 {
  const safeColumns = Math.max(1, columns);
  const column = Math.max(1, Math.min(placement.column, safeColumns));
  const maxColumnSpan = Math.max(1, safeColumns - column + 1);
  const columnSpan = Math.max(1, Math.min(placement.columnSpan, maxColumnSpan));
  return { ...placement, column, columnSpan };
}

export function placementGridStyle(
  placement: GridPlacementV1,
  columns?: number,
): {
  gridColumn: string;
  gridRow: string;
} {
  const bounded =
    columns != null ? clampPlacementToGrid(placement, columns) : placement;
  return {
    gridColumn: `${bounded.column} / span ${bounded.columnSpan}`,
    gridRow: `${bounded.row} / span ${bounded.rowSpan}`,
  };
}

/** Pixel height of a placement's row span (row tracks + inter-row gaps). */
export function placementSpanHeightPx(
  placement: GridPlacementV1,
  grid: { rowHeightPx: number; gapPx: number },
): number {
  const rowSpan = Math.max(1, placement.rowSpan);
  return rowSpan * grid.rowHeightPx + (rowSpan - 1) * grid.gapPx;
}

/**
 * Read-mode auto-height blocks (markdown article, 16:9 embeds) size to content instead of
 * reserving the edit-mode row span on the published grid.
 */
export function placementGridStyleForReadMode(
  placement: GridPlacementV1,
  autoHeight: boolean,
  columns?: number,
): {
  gridColumn: string;
  gridRow: string;
} {
  const bounded =
    columns != null ? clampPlacementToGrid(placement, columns) : placement;
  if (!autoHeight) {
    return placementGridStyle(bounded);
  }
  return {
    gridColumn: `${bounded.column} / span ${bounded.columnSpan}`,
    gridRow: `${bounded.row} / span 1`,
  };
}
