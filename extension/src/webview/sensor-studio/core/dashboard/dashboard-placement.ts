export type DashboardPlacementV1 = {
  /** 1-based grid column start. */
  column: number;
  /** 1-based grid row start. */
  row: number;
  columnSpan: number;
  rowSpan: number;
};

export const DEFAULT_DASHBOARD_PLACEMENT: DashboardPlacementV1 = {
  column: 1,
  row: 1,
  columnSpan: 2,
  rowSpan: 1,
};

function readPositiveInt(value: unknown, fallback: number, min = 1, max = 48): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function coerceDashboardPlacementV1(raw: unknown): DashboardPlacementV1 {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_DASHBOARD_PLACEMENT };
  }
  const o = raw as Record<string, unknown>;
  return {
    column: readPositiveInt(o.column, DEFAULT_DASHBOARD_PLACEMENT.column),
    row: readPositiveInt(o.row, DEFAULT_DASHBOARD_PLACEMENT.row),
    columnSpan: readPositiveInt(o.columnSpan, DEFAULT_DASHBOARD_PLACEMENT.columnSpan),
    rowSpan: readPositiveInt(o.rowSpan, DEFAULT_DASHBOARD_PLACEMENT.rowSpan),
  };
}

/** Occupied cell keys `row:col` (1-based). */
export function dashboardPlacementCellKeys(placement: DashboardPlacementV1): string[] {
  const keys: string[] = [];
  for (let r = placement.row; r < placement.row + placement.rowSpan; r += 1) {
    for (let c = placement.column; c < placement.column + placement.columnSpan; c += 1) {
      keys.push(`${r}:${c}`);
    }
  }
  return keys;
}

export function dashboardPlacementGridStyle(placement: DashboardPlacementV1): {
  gridColumn: string;
  gridRow: string;
} {
  const colEnd = placement.column + placement.columnSpan;
  const rowEnd = placement.row + placement.rowSpan;
  return {
    gridColumn: `${placement.column} / ${colEnd}`,
    gridRow: `${placement.row} / ${rowEnd}`,
  };
}

export function dashboardOccupiedCellKeySet(
  placements: readonly DashboardPlacementV1[],
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const placement of placements) {
    for (const key of dashboardPlacementCellKeys(placement)) {
      keys.add(key);
    }
  }
  return keys;
}
