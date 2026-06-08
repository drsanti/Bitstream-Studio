import { dashboardPlacementCellKeys } from "../../sensor-studio/core/dashboard/dashboard-placement";
import type { GridPlacementV1 } from "../schemas/placement";
import type { PageV1 } from "../schemas/page.v1";

function placementFits(
  placement: GridPlacementV1,
  occupied: ReadonlySet<string>,
  columns: number,
): boolean {
  if (placement.column + placement.columnSpan - 1 > columns) {
    return false;
  }
  for (const key of dashboardPlacementCellKeys(placement)) {
    if (occupied.has(key)) {
      return false;
    }
  }
  return true;
}

export function occupiedPlacementKeys(page: PageV1, exceptBlockId?: string): Set<string> {
  const keys = new Set<string>();
  for (const block of page.blocks) {
    if (block.id === exceptBlockId) {
      continue;
    }
    for (const key of dashboardPlacementCellKeys(block.placement)) {
      keys.add(key);
    }
  }
  return keys;
}

export function findOpenPlacement(
  page: PageV1,
  span: Pick<GridPlacementV1, "columnSpan" | "rowSpan">,
  exceptBlockId?: string,
): GridPlacementV1 {
  const occupied = occupiedPlacementKeys(page, exceptBlockId);
  const { columns } = page.grid;

  for (let row = 1; row < 200; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const candidate: GridPlacementV1 = { column, row, ...span };
      if (placementFits(candidate, occupied, columns)) {
        return candidate;
      }
    }
  }

  const maxRow = page.blocks.reduce(
    (max, block) => Math.max(max, block.placement.row + block.placement.rowSpan),
    1,
  );
  return { column: 1, row: maxRow, ...span };
}
