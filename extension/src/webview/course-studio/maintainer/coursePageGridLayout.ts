import type { CSSProperties } from "react";
import type { PageBlockV1, PageGridV1 } from "../schemas/page.v1";
import type { GridPlacementV1 } from "../schemas/placement";

export const COURSE_PAGE_GRID_MIN_VISIBLE_ROWS = 10;

export function coursePageGridVisibleRows(
  blocks: readonly PageBlockV1[],
  minRows = COURSE_PAGE_GRID_MIN_VISIBLE_ROWS,
): number {
  const maxOccupiedRow = blocks.reduce(
    (max, block) => Math.max(max, block.placement.row + block.placement.rowSpan - 1),
    0,
  );
  return Math.max(minRows, maxOccupiedRow + 2);
}

/** Centered message area when the composer grid has no blocks yet. */
export function coursePageEmptyStateCenterPlacement(
  columns: number,
  visibleRows: number,
): GridPlacementV1 {
  const columnSpan = Math.min(6, columns);
  const rowSpan = Math.min(4, visibleRows);
  const column = Math.max(1, Math.floor((columns - columnSpan) / 2) + 1);
  const row = Math.max(1, Math.floor((visibleRows - rowSpan) / 2) + 1);
  return { column, row, columnSpan, rowSpan };
}

export function coursePageGridLayoutStyle(
  grid: PageGridV1,
  options?: { fixedRowHeight?: boolean; includePadding?: boolean },
): CSSProperties {
  const fixedRowHeight = options?.fixedRowHeight ?? false;
  const includePadding = options?.includePadding ?? true;
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`,
    gridAutoRows: fixedRowHeight
      ? `${grid.rowHeightPx}px`
      : `minmax(${grid.rowHeightPx}px, auto)`,
    gap: `${grid.gapPx}px`,
    ...(includePadding ? { padding: `${grid.paddingPx}px` } : {}),
  };
}
