import { dashboardPlacementCellKeys } from "../../sensor-studio/core/dashboard/dashboard-placement";
import type { GridPlacementV1 } from "../schemas/placement";
import type { PageV1 } from "../schemas/page.v1";

function placementContainsCell(
  placement: GridPlacementV1,
  column: number,
  row: number,
): boolean {
  return (
    column >= placement.column &&
    column < placement.column + placement.columnSpan &&
    row >= placement.row &&
    row < placement.row + placement.rowSpan
  );
}

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

export function occupiedPlacementKeysFromBlocks(
  blocks: readonly { id: string; placement: GridPlacementV1 }[],
  previewById: Readonly<Record<string, GridPlacementV1>> = {},
  exceptBlockId?: string,
): Set<string> {
  const keys = new Set<string>();
  for (const block of blocks) {
    if (block.id === exceptBlockId) {
      continue;
    }
    const placement = previewById[block.id] ?? block.placement;
    for (const key of dashboardPlacementCellKeys(placement)) {
      keys.add(key);
    }
  }
  return keys;
}

/** Place a block so the clicked cell lies inside its span (dashboard / widget-board parity). */
export function findPageBlockPlacementAtAnchor(
  anchorColumn: number,
  anchorRow: number,
  span: Pick<GridPlacementV1, "columnSpan" | "rowSpan">,
  page: PageV1,
  exceptBlockId?: string,
): GridPlacementV1 {
  const occupied = occupiedPlacementKeys(page, exceptBlockId);
  const { columns } = page.grid;

  const tryOrigin = (column: number, row: number): GridPlacementV1 | null => {
    const candidate: GridPlacementV1 = { column, row, ...span };
    if (!placementContainsCell(candidate, anchorColumn, anchorRow)) {
      return null;
    }
    if (!placementFits(candidate, occupied, columns)) {
      return null;
    }
    return candidate;
  };

  for (let row = anchorRow; row >= Math.max(1, anchorRow - span.rowSpan + 1); row -= 1) {
    for (
      let column = anchorColumn;
      column >= Math.max(1, anchorColumn - span.columnSpan + 1);
      column -= 1
    ) {
      const candidate = tryOrigin(column, row);
      if (candidate != null) {
        return candidate;
      }
    }
  }

  return findOpenPlacement(page, span, exceptBlockId);
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

/** Prefer duplicate to the right, then below, then first open slot. */
export function findDuplicateBlockPlacement(
  page: PageV1,
  sourcePlacement: GridPlacementV1,
): GridPlacementV1 {
  const span = {
    columnSpan: sourcePlacement.columnSpan,
    rowSpan: sourcePlacement.rowSpan,
  };
  const occupied = occupiedPlacementKeys(page);
  const { columns } = page.grid;

  const candidates: GridPlacementV1[] = [
    {
      column: sourcePlacement.column + sourcePlacement.columnSpan,
      row: sourcePlacement.row,
      ...span,
    },
    {
      column: sourcePlacement.column,
      row: sourcePlacement.row + sourcePlacement.rowSpan,
      ...span,
    },
  ];

  for (const candidate of candidates) {
    if (placementFits(candidate, occupied, columns)) {
      return candidate;
    }
  }

  return findOpenPlacement(page, span);
}

/** Human-readable span summary for grid placement inspector copy. */
export function formatPlacementOccupancyHint(placement: GridPlacementV1): string {
  const colEnd = placement.column + placement.columnSpan - 1;
  const rowEnd = placement.row + placement.rowSpan - 1;
  return `Occupies columns ${placement.column}–${colEnd}, rows ${placement.row}–${rowEnd} (${placement.columnSpan}×${placement.rowSpan} cells)`;
}
