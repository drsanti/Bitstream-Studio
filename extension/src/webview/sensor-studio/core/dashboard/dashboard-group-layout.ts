export type DashboardGroupLayoutV1 = {
  version: 1;
  columns: number;
  gapPx: number;
  paddingPx: number;
  rowHeightPx: number;
};

export const DASHBOARD_DEFAULT_GROUP_COLUMNS = 6;

export function dashboardGroupDefaultLayout(): DashboardGroupLayoutV1 {
  return {
    version: 1,
    columns: DASHBOARD_DEFAULT_GROUP_COLUMNS,
    gapPx: 6,
    paddingPx: 8,
    rowHeightPx: 48,
  };
}

function readPositiveInt(value: unknown, fallback: number, min = 1, max = 24): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function coerceDashboardGroupLayoutV1(raw: unknown): DashboardGroupLayoutV1 {
  const defaults = dashboardGroupDefaultLayout();
  if (raw == null || typeof raw !== "object") {
    return defaults;
  }
  const o = raw as Record<string, unknown>;
  return {
    version: 1,
    columns: readPositiveInt(o.columns, defaults.columns, 1, 24),
    gapPx: readPositiveInt(o.gapPx, defaults.gapPx, 0, 64),
    paddingPx: readPositiveInt(o.paddingPx, defaults.paddingPx, 0, 48),
    rowHeightPx: readPositiveInt(o.rowHeightPx, defaults.rowHeightPx, 24, 200),
  };
}

export function dashboardGroupLayoutGridStyle(layout: DashboardGroupLayoutV1): {
  display: "grid";
  gridTemplateColumns: string;
  gridAutoRows: string;
  gap: string;
  padding: string;
} {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
    gridAutoRows: `minmax(${layout.rowHeightPx}px, auto)`,
    gap: `${layout.gapPx}px`,
    padding: `${layout.paddingPx}px`,
  };
}
