import type { DashboardSnapshotItemV1 } from "./dashboard-snapshot";
import {
  coerceDashboardPlacementV1,
  type DashboardPlacementV1,
} from "./dashboard-placement";

export type DashboardStackPlacementV1 = {
  sourceNodeId: string;
  placement: DashboardPlacementV1;
};

/** Walk snapshot items in render order and assign stacked grid rows (column 1). */
export function buildDashboardStackPlacements(
  items: readonly DashboardSnapshotItemV1[],
  startRow = 1,
  column = 1,
): DashboardStackPlacementV1[] {
  const out: DashboardStackPlacementV1[] = [];
  let row = startRow;

  for (const item of items) {
    if (item.kind === "group") {
      const placement = coerceDashboardPlacementV1(item.group.placement);
      out.push({
        sourceNodeId: item.group.sourceNodeId,
        placement: {
          ...placement,
          column,
          row,
        },
      });
      row += placement.rowSpan;
      continue;
    }
    const placement = coerceDashboardPlacementV1(item.widget.placement);
    out.push({
      sourceNodeId: item.widget.sourceNodeId,
      placement: {
        ...placement,
        column,
        row,
      },
    });
    row += placement.rowSpan;
  }

  return out;
}
