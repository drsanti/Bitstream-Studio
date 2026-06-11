import type { DashboardGridMetricsV1 } from "./dashboard-grid-resize";

/** Square grid tracks use row height as the cell edge length (width = height). */
export function dashboardSquareCellSizePx(
  metrics: Pick<DashboardGridMetricsV1, "rowHeightPx">,
): number {
  return metrics.rowHeightPx;
}

/** Total grid width including padding — fixed so wide viewports letterbox left/right. */
export function dashboardSquareGridIntrinsicWidthPx(metrics: DashboardGridMetricsV1): number {
  const cell = dashboardSquareCellSizePx(metrics);
  const gaps = Math.max(0, metrics.columns - 1) * metrics.gapPx;
  return metrics.paddingPx * 2 + metrics.columns * cell + gaps;
}

export function dashboardSquareGridTemplateColumns(columns: number, cellSizePx: number): string {
  return `repeat(${columns}, ${cellSizePx}px)`;
}

export type DashboardSquareGridCssStyle = {
  display: "grid";
  gridTemplateColumns: string;
  gridAutoRows: string;
  gap: string;
  padding: string;
  width: string;
  maxWidth: string;
  marginInline: string;
  boxSizing: "border-box";
};

export function dashboardSquareGridCssStyle(metrics: DashboardGridMetricsV1): DashboardSquareGridCssStyle {
  const cell = dashboardSquareCellSizePx(metrics);
  return {
    display: "grid",
    gridTemplateColumns: dashboardSquareGridTemplateColumns(metrics.columns, cell),
    gridAutoRows: `${cell}px`,
    gap: `${metrics.gapPx}px`,
    padding: `${metrics.paddingPx}px`,
    width: `${dashboardSquareGridIntrinsicWidthPx(metrics)}px`,
    maxWidth: "100%",
    marginInline: "auto",
    boxSizing: "border-box",
  };
}
