import type { DashboardSnapshotItemV1 } from "./dashboard-snapshot";
import {
  coerceDashboardPlacementV1,
  dashboardPlacementCellKeys,
  type DashboardPlacementV1,
} from "./dashboard-placement";

export const DASHBOARD_EDITOR_MIN_VISIBLE_ROWS = 8;

/** Default grid span per dashboard catalog node (from node catalog defaults). */
export const DASHBOARD_WIDGET_DEFAULT_SPAN: Readonly<
  Record<string, Pick<DashboardPlacementV1, "columnSpan" | "rowSpan">>
> = {
  "dashboard-button": { columnSpan: 2, rowSpan: 1 },
  "dashboard-led": { columnSpan: 2, rowSpan: 1 },
  "dashboard-text": { columnSpan: 4, rowSpan: 1 },
  "dashboard-gauge": { columnSpan: 4, rowSpan: 3 },
  "dashboard-knob": { columnSpan: 4, rowSpan: 3 },
  "dashboard-switch": { columnSpan: 3, rowSpan: 1 },
  "dashboard-select": { columnSpan: 4, rowSpan: 1 },
  "dashboard-formatted-text": { columnSpan: 5, rowSpan: 1 },
  "dashboard-image": { columnSpan: 4, rowSpan: 3 },
  "dashboard-slider": { columnSpan: 6, rowSpan: 1 },
  "dashboard-status": { columnSpan: 3, rowSpan: 1 },
  "dashboard-group": { columnSpan: 6, rowSpan: 4 },
};

export function resolveDashboardItemPlacement(
  item: DashboardSnapshotItemV1,
): DashboardPlacementV1 {
  return item.kind === "group" ? item.group.placement : item.widget.placement;
}

export function dashboardPlacementsFromItems(
  items: readonly DashboardSnapshotItemV1[],
): DashboardPlacementV1[] {
  return items.map(resolveDashboardItemPlacement);
}

export function dashboardEditorVisibleRows(
  placements: readonly DashboardPlacementV1[],
  minRows = DASHBOARD_EDITOR_MIN_VISIBLE_ROWS,
): number {
  const maxOccupiedRow = placements.reduce(
    (max, placement) => Math.max(max, placement.row + placement.rowSpan - 1),
    0,
  );
  return Math.max(minRows, maxOccupiedRow + 2);
}

function placementContainsCell(
  placement: DashboardPlacementV1,
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

function placementFitsGrid(
  placement: DashboardPlacementV1,
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

export function dashboardOccupiedPlacementKeys(
  placements: readonly DashboardPlacementV1[],
): Set<string> {
  const keys = new Set<string>();
  for (const placement of placements) {
    for (const key of dashboardPlacementCellKeys(placement)) {
      keys.add(key);
    }
  }
  return keys;
}

export function defaultSpanForDashboardCatalogNode(
  catalogNodeId: string,
): Pick<DashboardPlacementV1, "columnSpan" | "rowSpan"> {
  return (
    DASHBOARD_WIDGET_DEFAULT_SPAN[catalogNodeId] ?? {
      columnSpan: 2,
      rowSpan: 1,
    }
  );
}

export function findOpenDashboardPlacement(
  placements: readonly DashboardPlacementV1[],
  columns: number,
  span: Pick<DashboardPlacementV1, "columnSpan" | "rowSpan">,
): DashboardPlacementV1 {
  const occupied = dashboardOccupiedPlacementKeys(placements);

  for (let row = 1; row < 120; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const candidate: DashboardPlacementV1 = { column, row, ...span };
      if (placementFitsGrid(candidate, occupied, columns)) {
        return candidate;
      }
    }
  }

  const maxRow = placements.reduce(
    (max, placement) => Math.max(max, placement.row + placement.rowSpan),
    1,
  );
  return { column: 1, row: maxRow, ...span };
}

export function findDashboardPlacementAtAnchor(
  anchorColumn: number,
  anchorRow: number,
  catalogNodeId: string,
  placements: readonly DashboardPlacementV1[],
  columns: number,
): DashboardPlacementV1 {
  const span = defaultSpanForDashboardCatalogNode(catalogNodeId);
  const occupied = dashboardOccupiedPlacementKeys(placements);

  const tryOrigin = (column: number, row: number): DashboardPlacementV1 | null => {
    const candidate = coerceDashboardPlacementV1({
      column,
      row,
      columnSpan: span.columnSpan,
      rowSpan: span.rowSpan,
    });
    if (!placementContainsCell(candidate, anchorColumn, anchorRow)) {
      return null;
    }
    if (!placementFitsGrid(candidate, occupied, columns)) {
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

  return findOpenDashboardPlacement(placements, columns, span);
}

export type DashboardGridNudgeDirection = "up" | "down" | "left" | "right";

/** Arrow-key nudge for Dashboard grid Edit mode — returns null when blocked or out of bounds. */
export function nudgeDashboardGridPlacement(args: {
  placement: DashboardPlacementV1;
  direction: DashboardGridNudgeDirection;
  gridColumns: number;
  otherPlacements: readonly DashboardPlacementV1[];
}): DashboardPlacementV1 | null {
  const { placement, direction, gridColumns, otherPlacements } = args;
  const delta =
    direction === "up"
      ? { row: -1, column: 0 }
      : direction === "down"
        ? { row: 1, column: 0 }
        : direction === "left"
          ? { row: 0, column: -1 }
          : { row: 0, column: 1 };

  const next: DashboardPlacementV1 = coerceDashboardPlacementV1({
    ...placement,
    row: placement.row + delta.row,
    column: placement.column + delta.column,
  });

  if (next.row < 1 || next.column < 1) {
    return null;
  }
  const maxColumn = Math.max(1, gridColumns - next.columnSpan + 1);
  if (next.column > maxColumn) {
    return null;
  }

  const occupied = dashboardOccupiedPlacementKeys(otherPlacements);
  if (!placementFitsGrid(next, occupied, gridColumns)) {
    return null;
  }
  return next;
}

export type DashboardGridMoveEntry = {
  sourceNodeId: string;
  placement: DashboardPlacementV1;
  /** `null` = top-level dashboard grid; otherwise inner grid of that group node. */
  groupParentId: string | null;
};

export function resolveDashboardSelectionMoveEntries(
  items: readonly DashboardSnapshotItemV1[],
  selectedIds: readonly string[],
): DashboardGridMoveEntry[] {
  const idSet = new Set(selectedIds);
  const entries: DashboardGridMoveEntry[] = [];
  for (const item of items) {
    if (item.kind === "group") {
      if (idSet.has(item.group.sourceNodeId)) {
        entries.push({
          sourceNodeId: item.group.sourceNodeId,
          placement: item.group.placement,
          groupParentId: null,
        });
      }
      for (const child of item.group.children) {
        if (idSet.has(child.sourceNodeId)) {
          entries.push({
            sourceNodeId: child.sourceNodeId,
            placement: child.placement,
            groupParentId: item.group.sourceNodeId,
          });
        }
      }
    } else if (idSet.has(item.widget.sourceNodeId)) {
      entries.push({
        sourceNodeId: item.widget.sourceNodeId,
        placement: item.widget.placement,
        groupParentId: null,
      });
    }
  }
  return entries;
}

export function dashboardGridMoveDelta(args: {
  fromRow: number;
  fromColumn: number;
  toRow: number;
  toColumn: number;
}): { rowDelta: number; columnDelta: number } {
  return {
    rowDelta: args.toRow - args.fromRow,
    columnDelta: args.toColumn - args.fromColumn,
  };
}

export function applyDashboardGridMoveDelta(
  placement: DashboardPlacementV1,
  delta: { rowDelta: number; columnDelta: number },
): DashboardPlacementV1 {
  return coerceDashboardPlacementV1({
    ...placement,
    row: placement.row + delta.rowDelta,
    column: placement.column + delta.columnDelta,
  });
}

export function dashboardPlacementsInGridSpace(
  items: readonly DashboardSnapshotItemV1[],
  groupParentId: string | null,
  excludeIds: ReadonlySet<string>,
): DashboardPlacementV1[] {
  const placements: DashboardPlacementV1[] = [];
  if (groupParentId == null) {
    for (const item of items) {
      if (item.kind === "group") {
        if (!excludeIds.has(item.group.sourceNodeId)) {
          placements.push(item.group.placement);
        }
      } else if (!excludeIds.has(item.widget.sourceNodeId)) {
        placements.push(item.widget.placement);
      }
    }
    return placements;
  }
  for (const item of items) {
    if (item.kind !== "group" || item.group.sourceNodeId !== groupParentId) {
      continue;
    }
    for (const child of item.group.children) {
      if (!excludeIds.has(child.sourceNodeId)) {
        placements.push(child.placement);
      }
    }
    break;
  }
  return placements;
}

function dashboardMoveEntriesFitInSpace(args: {
  movedEntries: readonly DashboardGridMoveEntry[];
  delta: { rowDelta: number; columnDelta: number };
  gridColumns: number;
  otherPlacements: readonly DashboardPlacementV1[];
}): boolean {
  const occupied = dashboardOccupiedPlacementKeys(args.otherPlacements);
  for (const entry of args.movedEntries) {
    const next = applyDashboardGridMoveDelta(entry.placement, args.delta);
    if (next.row < 1 || next.column < 1) {
      return false;
    }
    const maxColumn = Math.max(1, args.gridColumns - next.columnSpan + 1);
    if (next.column > maxColumn) {
      return false;
    }
    if (!placementFitsGrid(next, occupied, args.gridColumns)) {
      return false;
    }
    for (const key of dashboardPlacementCellKeys(next)) {
      occupied.add(key);
    }
  }
  return true;
}

export function previewDashboardMultiGridMove(args: {
  entries: readonly DashboardGridMoveEntry[];
  anchorSourceNodeId: string;
  anchorTargetRow: number;
  anchorTargetColumn: number;
}): Record<string, { row: number; column: number }> {
  const anchor =
    args.entries.find((entry) => entry.sourceNodeId === args.anchorSourceNodeId) ??
    args.entries[0];
  if (anchor == null) {
    return {};
  }
  const delta = dashboardGridMoveDelta({
    fromRow: anchor.placement.row,
    fromColumn: anchor.placement.column,
    toRow: args.anchorTargetRow,
    toColumn: args.anchorTargetColumn,
  });
  const preview: Record<string, { row: number; column: number }> = {};
  for (const entry of args.entries) {
    const next = applyDashboardGridMoveDelta(entry.placement, delta);
    preview[entry.sourceNodeId] = { row: next.row, column: next.column };
  }
  return preview;
}

export function nudgeDashboardMultiGridMove(args: {
  entries: readonly DashboardGridMoveEntry[];
  direction: DashboardGridNudgeDirection;
  displayItems: readonly DashboardSnapshotItemV1[];
  gridColumns: number;
}): Array<{ sourceNodeId: string; placement: DashboardPlacementV1 }> | null {
  if (args.entries.length === 0) {
    return null;
  }
  const delta =
    args.direction === "up"
      ? { rowDelta: -1, columnDelta: 0 }
      : args.direction === "down"
        ? { rowDelta: 1, columnDelta: 0 }
        : args.direction === "left"
          ? { rowDelta: 0, columnDelta: -1 }
          : { rowDelta: 0, columnDelta: 1 };

  const selectedIds = new Set(args.entries.map((entry) => entry.sourceNodeId));
  const bySpace = new Map<string | null, DashboardGridMoveEntry[]>();
  for (const entry of args.entries) {
    const bucket = bySpace.get(entry.groupParentId) ?? [];
    bucket.push(entry);
    bySpace.set(entry.groupParentId, bucket);
  }

  const updates: Array<{ sourceNodeId: string; placement: DashboardPlacementV1 }> = [];
  for (const [groupParentId, spaceEntries] of bySpace) {
    const groupColumns =
      groupParentId == null
        ? args.gridColumns
        : (() => {
            for (const item of args.displayItems) {
              if (item.kind === "group" && item.group.sourceNodeId === groupParentId) {
                return item.group.groupLayout.columns;
              }
            }
            return args.gridColumns;
          })();
    const others = dashboardPlacementsInGridSpace(
      args.displayItems,
      groupParentId,
      selectedIds,
    );
    if (
      !dashboardMoveEntriesFitInSpace({
        movedEntries: spaceEntries,
        delta,
        gridColumns: groupColumns,
        otherPlacements: others,
      })
    ) {
      return null;
    }
    for (const entry of spaceEntries) {
      updates.push({
        sourceNodeId: entry.sourceNodeId,
        placement: applyDashboardGridMoveDelta(entry.placement, delta),
      });
    }
  }
  return updates;
}

export function unionDashboardPlacements(
  placements: readonly DashboardPlacementV1[],
): DashboardPlacementV1 {
  let minColumn = Number.POSITIVE_INFINITY;
  let minRow = Number.POSITIVE_INFINITY;
  let maxColumnEnd = 0;
  let maxRowEnd = 0;
  for (const placement of placements) {
    minColumn = Math.min(minColumn, placement.column);
    minRow = Math.min(minRow, placement.row);
    maxColumnEnd = Math.max(maxColumnEnd, placement.column + placement.columnSpan - 1);
    maxRowEnd = Math.max(maxRowEnd, placement.row + placement.rowSpan - 1);
  }
  return coerceDashboardPlacementV1({
    column: minColumn,
    row: minRow,
    columnSpan: maxColumnEnd - minColumn + 1,
    rowSpan: maxRowEnd - minRow + 1,
  });
}

export function resolveDashboardMultiResizeContext(
  entries: readonly DashboardGridMoveEntry[],
): {
  entries: DashboardGridMoveEntry[];
  unionPlacement: DashboardPlacementV1;
  groupParentId: string | null;
} | null {
  if (entries.length < 2) {
    return null;
  }
  const groupParentId = entries[0]!.groupParentId;
  if (!entries.every((entry) => entry.groupParentId === groupParentId)) {
    return null;
  }
  return {
    entries: [...entries],
    unionPlacement: unionDashboardPlacements(entries.map((entry) => entry.placement)),
    groupParentId,
  };
}

export function resolveDashboardMultiResizeGridColumns(args: {
  displayItems: readonly DashboardSnapshotItemV1[];
  groupParentId: string | null;
  dashboardGridColumns: number;
}): number {
  if (args.groupParentId == null) {
    return args.dashboardGridColumns;
  }
  for (const item of args.displayItems) {
    if (item.kind === "group" && item.group.sourceNodeId === args.groupParentId) {
      return item.group.groupLayout.columns;
    }
  }
  return args.dashboardGridColumns;
}

export function previewDashboardMultiGridResize(args: {
  entries: readonly DashboardGridMoveEntry[];
  baseUnion: DashboardPlacementV1;
  nextUnion: DashboardPlacementV1;
}): Record<string, DashboardPlacementV1> {
  const columnDelta = args.nextUnion.column - args.baseUnion.column;
  const rowDelta = args.nextUnion.row - args.baseUnion.row;
  const columnSpanDelta = args.nextUnion.columnSpan - args.baseUnion.columnSpan;
  const rowSpanDelta = args.nextUnion.rowSpan - args.baseUnion.rowSpan;
  const preview: Record<string, DashboardPlacementV1> = {};
  for (const entry of args.entries) {
    preview[entry.sourceNodeId] = coerceDashboardPlacementV1({
      ...entry.placement,
      column: Math.max(1, entry.placement.column + columnDelta),
      row: Math.max(1, entry.placement.row + rowDelta),
      columnSpan: Math.max(1, entry.placement.columnSpan + columnSpanDelta),
      rowSpan: Math.max(1, entry.placement.rowSpan + rowSpanDelta),
    });
  }
  return preview;
}

export function dashboardMultiGridResizeUpdates(args: {
  entries: readonly DashboardGridMoveEntry[];
  baseUnion: DashboardPlacementV1;
  nextUnion: DashboardPlacementV1;
}): Array<{ sourceNodeId: string; placement: DashboardPlacementV1 }> {
  const preview = previewDashboardMultiGridResize(args);
  const updates: Array<{ sourceNodeId: string; placement: DashboardPlacementV1 }> = [];
  for (const entry of args.entries) {
    const nextPlacement = preview[entry.sourceNodeId];
    if (nextPlacement == null) {
      continue;
    }
    if (
      nextPlacement.column === entry.placement.column &&
      nextPlacement.row === entry.placement.row &&
      nextPlacement.columnSpan === entry.placement.columnSpan &&
      nextPlacement.rowSpan === entry.placement.rowSpan
    ) {
      continue;
    }
    updates.push({
      sourceNodeId: entry.sourceNodeId,
      placement: nextPlacement,
    });
  }
  return updates;
}
