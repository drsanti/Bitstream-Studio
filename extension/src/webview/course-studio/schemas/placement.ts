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

export function placementGridStyle(placement: GridPlacementV1): {
  gridColumn: string;
  gridRow: string;
} {
  return {
    gridColumn: `${placement.column} / span ${placement.columnSpan}`,
    gridRow: `${placement.row} / span ${placement.rowSpan}`,
  };
}
