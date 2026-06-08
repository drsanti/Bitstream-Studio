import type { DashboardGridMetricsV1 } from "../../sensor-studio/core/dashboard/dashboard-grid-resize";
import type { PageGridV1 } from "../schemas/page.v1";

export function pageGridToDashboardMetrics(grid: PageGridV1): DashboardGridMetricsV1 {
  return {
    columns: grid.columns,
    gapPx: grid.gapPx,
    paddingPx: grid.paddingPx,
    rowHeightPx: grid.rowHeightPx,
  };
}
