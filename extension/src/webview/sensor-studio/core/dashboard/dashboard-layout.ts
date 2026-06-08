export type DashboardLayoutModeV1 = "grid" | "flex";

export type DashboardFlexAlignV1 = "start" | "center" | "end" | "stretch";
export type DashboardFlexJustifyV1 =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around";

export type DashboardLayoutV1 = {
  version: 1;
  mode: DashboardLayoutModeV1;
  grid: {
    columns: number;
    gapPx: number;
    paddingPx: number;
    rowHeightPx: number;
  };
  flex: {
    direction: "row" | "column";
    wrap: boolean;
    gapPx: number;
    paddingPx: number;
    alignItems: DashboardFlexAlignV1;
    justifyContent: DashboardFlexJustifyV1;
  };
};

export const DASHBOARD_DEFAULT_GRID_COLUMNS = 12;
export const DASHBOARD_DEFAULT_GAP_PX = 8;
export const DASHBOARD_DEFAULT_PADDING_PX = 16;
export const DASHBOARD_DEFAULT_ROW_HEIGHT_PX = 48;

export function dashboardOutputDefaultLayout(): DashboardLayoutV1 {
  return {
    version: 1,
    mode: "grid",
    grid: {
      columns: DASHBOARD_DEFAULT_GRID_COLUMNS,
      gapPx: DASHBOARD_DEFAULT_GAP_PX,
      paddingPx: DASHBOARD_DEFAULT_PADDING_PX,
      rowHeightPx: DASHBOARD_DEFAULT_ROW_HEIGHT_PX,
    },
    flex: {
      direction: "row",
      wrap: true,
      gapPx: DASHBOARD_DEFAULT_GAP_PX,
      paddingPx: DASHBOARD_DEFAULT_PADDING_PX,
      alignItems: "stretch",
      justifyContent: "start",
    },
  };
}

function readPositiveInt(value: unknown, fallback: number, min = 1, max = 48): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(n)));
}

function readFlexAlign(value: unknown, fallback: DashboardFlexAlignV1): DashboardFlexAlignV1 {
  if (value === "start" || value === "center" || value === "end" || value === "stretch") {
    return value;
  }
  return fallback;
}

function readFlexJustify(value: unknown, fallback: DashboardFlexJustifyV1): DashboardFlexJustifyV1 {
  if (
    value === "start" ||
    value === "center" ||
    value === "end" ||
    value === "space-between" ||
    value === "space-around"
  ) {
    return value;
  }
  return fallback;
}

export function coerceDashboardLayoutV1(raw: unknown): DashboardLayoutV1 {
  const defaults = dashboardOutputDefaultLayout();
  if (raw == null || typeof raw !== "object") {
    return defaults;
  }
  const o = raw as Record<string, unknown>;
  const mode: DashboardLayoutModeV1 = o.mode === "flex" ? "flex" : "grid";
  const gridRaw = o.grid;
  const gridObj =
    gridRaw != null && typeof gridRaw === "object"
      ? (gridRaw as Record<string, unknown>)
      : {};
  const flexRaw = o.flex;
  const flexObj =
    flexRaw != null && typeof flexRaw === "object"
      ? (flexRaw as Record<string, unknown>)
      : {};
  return {
    version: 1,
    mode,
    grid: {
      columns: readPositiveInt(gridObj.columns, defaults.grid.columns, 1, 24),
      gapPx: readPositiveInt(gridObj.gapPx, defaults.grid.gapPx, 0, 64),
      paddingPx: readPositiveInt(gridObj.paddingPx, defaults.grid.paddingPx, 0, 96),
      rowHeightPx: readPositiveInt(
        gridObj.rowHeightPx,
        defaults.grid.rowHeightPx,
        24,
        200,
      ),
    },
    flex: {
      direction: flexObj.direction === "column" ? "column" : "row",
      wrap: flexObj.wrap !== false,
      gapPx: readPositiveInt(flexObj.gapPx, defaults.flex.gapPx, 0, 64),
      paddingPx: readPositiveInt(flexObj.paddingPx, defaults.flex.paddingPx, 0, 96),
      alignItems: readFlexAlign(flexObj.alignItems, defaults.flex.alignItems),
      justifyContent: readFlexJustify(flexObj.justifyContent, defaults.flex.justifyContent),
    },
  };
}

export function dashboardFlexCssAlignItems(align: DashboardFlexAlignV1): string {
  switch (align) {
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "stretch":
      return "stretch";
    default:
      return "flex-start";
  }
}

export function dashboardFlexCssJustifyContent(justify: DashboardFlexJustifyV1): string {
  switch (justify) {
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "space-between":
      return "space-between";
    case "space-around":
      return "space-around";
    default:
      return "flex-start";
  }
}
