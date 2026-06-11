import { dashboardPlacementCellKeys } from "../../../sensor-studio/core/dashboard/dashboard-placement";
import {
  applyDashboardGridMoveDelta,
  type DashboardGridMoveEntry,
  type DashboardGridNudgeDirection,
  dashboardMultiGridResizeUpdates,
  nudgeDashboardGridPlacement,
  previewDashboardMultiGridResize,
  resolveDashboardMultiResizeContext,
} from "../../../sensor-studio/core/dashboard/dashboard-grid-editor-ops";
import type { DashboardGridMetricsV1 } from "../../../sensor-studio/core/dashboard/dashboard-grid-resize";
import type { PageBlockV1 } from "../../schemas/page.v1";
import type { GridPlacementV1 } from "../../schemas/placement";
import {
  WIDGET_BOARD_WIDGET_MIN_SPAN,
  type WidgetBoardEntryV1,
  type WidgetBoardInnerGridV1,
  type WidgetBoardWidgetKind,
} from "../../schemas/widgetBoard.v1";
import { buildDefaultWidgetBoardEntry } from "../../ui/catalog/widget-board/widgetBoardWidgetDefaults";
import { WIDGET_BOARD_EDITOR_MIN_VISIBLE_ROWS } from "../../ui/catalog/widget-board/widgetBoardLayout";
import { nextUniquePageBlockId } from "../blockFactory";

export function widgetBoardGridToDashboardMetrics(
  grid: WidgetBoardInnerGridV1,
): DashboardGridMetricsV1 {
  return {
    columns: grid.columns,
    gapPx: grid.gapPx,
    paddingPx: grid.paddingPx,
    rowHeightPx: grid.rowHeightPx,
  };
}

export function widgetBoardVisibleRows(
  widgets: readonly WidgetBoardEntryV1[],
  minRows = WIDGET_BOARD_EDITOR_MIN_VISIBLE_ROWS,
): number {
  const maxOccupiedRow = widgets.reduce(
    (max, widget) => Math.max(max, widget.placement.row + widget.placement.rowSpan - 1),
    0,
  );
  return Math.max(minRows, maxOccupiedRow + 2);
}

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

function placementFitsInnerGrid(
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

export function occupiedWidgetPlacementKeys(
  widgets: readonly WidgetBoardEntryV1[],
  exceptWidgetId?: string,
): Set<string> {
  const keys = new Set<string>();
  for (const widget of widgets) {
    if (widget.id === exceptWidgetId) {
      continue;
    }
    for (const key of dashboardPlacementCellKeys(widget.placement)) {
      keys.add(key);
    }
  }
  return keys;
}

export function findOpenWidgetBoardPlacement(
  widgets: readonly WidgetBoardEntryV1[],
  columns: number,
  span: Pick<GridPlacementV1, "columnSpan" | "rowSpan">,
  exceptWidgetId?: string,
): GridPlacementV1 {
  const occupied = occupiedWidgetPlacementKeys(widgets, exceptWidgetId);

  for (let row = 1; row < 120; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const candidate: GridPlacementV1 = { column, row, ...span };
      if (placementFitsInnerGrid(candidate, occupied, columns)) {
        return candidate;
      }
    }
  }

  const maxRow = widgets.reduce(
    (max, widget) => Math.max(max, widget.placement.row + widget.placement.rowSpan),
    1,
  );
  return { column: 1, row: maxRow, ...span };
}

export function ensureWidgetBoardWidgetPlacement(
  placement: GridPlacementV1,
  kind: WidgetBoardWidgetKind,
): GridPlacementV1 {
  const min = WIDGET_BOARD_WIDGET_MIN_SPAN[kind];
  return {
    ...placement,
    columnSpan: Math.max(placement.columnSpan, min.columnSpan),
    rowSpan: Math.max(placement.rowSpan, min.rowSpan),
  };
}

export function findPlacementAtAnchor(
  anchorColumn: number,
  anchorRow: number,
  kind: WidgetBoardWidgetKind,
  widgets: readonly WidgetBoardEntryV1[],
  columns: number,
  exceptWidgetId?: string,
): GridPlacementV1 {
  const min = WIDGET_BOARD_WIDGET_MIN_SPAN[kind];
  const occupied = occupiedWidgetPlacementKeys(widgets, exceptWidgetId);

  const tryOrigin = (column: number, row: number): GridPlacementV1 | null => {
    const candidate = ensureWidgetBoardWidgetPlacement(
      {
        column,
        row,
        columnSpan: min.columnSpan,
        rowSpan: min.rowSpan,
      },
      kind,
    );
    if (!placementContainsCell(candidate, anchorColumn, anchorRow)) {
      return null;
    }
    if (!placementFitsInnerGrid(candidate, occupied, columns)) {
      return null;
    }
    return candidate;
  };

  for (let row = anchorRow; row >= Math.max(1, anchorRow - min.rowSpan + 1); row -= 1) {
    for (
      let column = anchorColumn;
      column >= Math.max(1, anchorColumn - min.columnSpan + 1);
      column -= 1
    ) {
      const candidate = tryOrigin(column, row);
      if (candidate != null) {
        return candidate;
      }
    }
  }

  return findOpenWidgetBoardPlacement(widgets, columns, min, exceptWidgetId);
}

export function createWidgetBoardEntryAtPlacement(
  kind: WidgetBoardWidgetKind,
  placement: GridPlacementV1,
  widgets: readonly WidgetBoardEntryV1[],
): WidgetBoardEntryV1 {
  const id = nextUniquePageBlockId(kind, widgets);
  const fitted = ensureWidgetBoardWidgetPlacement(placement, kind);
  return buildDefaultWidgetBoardEntry(kind, id, fitted);
}

export function createWidgetBoardEntry(
  kind: WidgetBoardWidgetKind,
  widgets: readonly WidgetBoardEntryV1[],
  columns: number,
): WidgetBoardEntryV1 {
  const min = WIDGET_BOARD_WIDGET_MIN_SPAN[kind];
  const placement = findOpenWidgetBoardPlacement(widgets, columns, min);
  const id = nextUniquePageBlockId(kind, widgets);
  return buildDefaultWidgetBoardEntry(kind, id, placement);
}

export function updateWidgetBoardWidgets(
  block: Extract<PageBlockV1, { kind: "widget-board" }>,
  widgets: WidgetBoardEntryV1[],
): Extract<PageBlockV1, { kind: "widget-board" }> {
  return { ...block, widgets };
}

export function patchWidgetBoardWidgetKind(
  widget: WidgetBoardEntryV1,
  kind: WidgetBoardWidgetKind,
  block: Extract<PageBlockV1, { kind: "widget-board" }>,
): WidgetBoardEntryV1 {
  if (widget.kind === kind) {
    return widget;
  }

  let placement = ensureWidgetBoardWidgetPlacement(widget.placement, kind);
  const occupied = occupiedWidgetPlacementKeys(block.widgets, widget.id);
  if (!placementFitsInnerGrid(placement, occupied, block.grid.columns)) {
    placement = findOpenWidgetBoardPlacement(
      block.widgets,
      block.grid.columns,
      WIDGET_BOARD_WIDGET_MIN_SPAN[kind],
      widget.id,
    );
  }

  return buildDefaultWidgetBoardEntry(kind, widget.id, placement);
}

export function patchWidgetBoardWidget(
  block: Extract<PageBlockV1, { kind: "widget-board" }>,
  widgetId: string,
  patch: Partial<WidgetBoardEntryV1>,
): Extract<PageBlockV1, { kind: "widget-board" }> {
  return {
    ...block,
    widgets: block.widgets.map((widget) =>
      widget.id === widgetId ? ({ ...widget, ...patch } as WidgetBoardEntryV1) : widget,
    ),
  };
}

export function removeWidgetBoardWidget(
  block: Extract<PageBlockV1, { kind: "widget-board" }>,
  widgetId: string,
): Extract<PageBlockV1, { kind: "widget-board" }> | null {
  return removeWidgetBoardWidgets(block, [widgetId]);
}

export function removeWidgetBoardWidgets(
  block: Extract<PageBlockV1, { kind: "widget-board" }>,
  widgetIds: readonly string[],
): Extract<PageBlockV1, { kind: "widget-board" }> | null {
  const idSet = new Set(widgetIds);
  const remaining = block.widgets.filter((widget) => !idSet.has(widget.id));
  if (remaining.length === 0) {
    return null;
  }
  if (remaining.length === block.widgets.length) {
    return block;
  }
  return {
    ...block,
    widgets: remaining,
  };
}

export function resolveWidgetBoardSelectionMoveEntries(
  widgets: readonly WidgetBoardEntryV1[],
  selectedIds: readonly string[],
): DashboardGridMoveEntry[] {
  const idSet = new Set(selectedIds);
  return widgets
    .filter((widget) => idSet.has(widget.id))
    .map((widget) => ({
      sourceNodeId: widget.id,
      placement: widget.placement,
      groupParentId: null,
    }));
}

export function widgetBoardOtherPlacements(
  widgets: readonly WidgetBoardEntryV1[],
  excludeIds: ReadonlySet<string>,
  placementFor: (widgetId: string, placement: GridPlacementV1) => GridPlacementV1,
): GridPlacementV1[] {
  return widgets
    .filter((widget) => !excludeIds.has(widget.id))
    .map((widget) => placementFor(widget.id, widget.placement));
}

export function nudgeWidgetBoardGridPlacement(args: {
  placement: GridPlacementV1;
  direction: DashboardGridNudgeDirection;
  widgets: readonly WidgetBoardEntryV1[];
  selectedIds: ReadonlySet<string>;
  placementFor: (widgetId: string, placement: GridPlacementV1) => GridPlacementV1;
  gridColumns: number;
}): GridPlacementV1 | null {
  return nudgeDashboardGridPlacement({
    placement: args.placement,
    direction: args.direction,
    gridColumns: args.gridColumns,
    otherPlacements: widgetBoardOtherPlacements(
      args.widgets,
      args.selectedIds,
      args.placementFor,
    ),
  });
}

export function nudgeWidgetBoardMultiGridMove(args: {
  entries: readonly DashboardGridMoveEntry[];
  direction: DashboardGridNudgeDirection;
  widgets: readonly WidgetBoardEntryV1[];
  placementFor: (widgetId: string, placement: GridPlacementV1) => GridPlacementV1;
  gridColumns: number;
}): Array<{ widgetId: string; placement: GridPlacementV1 }> | null {
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
  const staticPlacements = widgetBoardOtherPlacements(
    args.widgets,
    selectedIds,
    args.placementFor,
  );
  const occupied = new Set<string>();
  for (const placement of staticPlacements) {
    for (const key of dashboardPlacementCellKeys(placement)) {
      occupied.add(key);
    }
  }
  const updates: Array<{ widgetId: string; placement: GridPlacementV1 }> = [];
  for (const entry of args.entries) {
    const base = args.placementFor(entry.sourceNodeId, entry.placement);
    const next = applyDashboardGridMoveDelta(base, delta);
    if (!placementFitsInnerGrid(next, occupied, args.gridColumns)) {
      return null;
    }
    for (const key of dashboardPlacementCellKeys(next)) {
      occupied.add(key);
    }
    updates.push({ widgetId: entry.sourceNodeId, placement: next });
  }
  return updates;
}

export function resolveWidgetBoardMultiResizeContext(
  entries: readonly DashboardGridMoveEntry[],
) {
  return resolveDashboardMultiResizeContext(entries);
}

export function previewWidgetBoardMultiGridResize(args: {
  entries: readonly DashboardGridMoveEntry[];
  baseUnion: GridPlacementV1;
  nextUnion: GridPlacementV1;
}): Record<string, GridPlacementV1> {
  return previewDashboardMultiGridResize(args);
}

export function widgetBoardMultiGridResizeUpdates(args: {
  entries: readonly DashboardGridMoveEntry[];
  baseUnion: GridPlacementV1;
  nextUnion: GridPlacementV1;
}): Array<{ widgetId: string; placement: GridPlacementV1 }> {
  return dashboardMultiGridResizeUpdates(args).map((update) => ({
    widgetId: update.sourceNodeId,
    placement: update.placement,
  }));
}

export function patchWidgetBoardWidgetsPlacements(
  block: Extract<PageBlockV1, { kind: "widget-board" }>,
  updates: ReadonlyArray<{ widgetId: string; placement: GridPlacementV1 }>,
): Extract<PageBlockV1, { kind: "widget-board" }> {
  if (updates.length === 0) {
    return block;
  }
  const byId = new Map(updates.map((update) => [update.widgetId, update.placement]));
  return {
    ...block,
    widgets: block.widgets.map((widget) => {
      const placement = byId.get(widget.id);
      return placement == null ? widget : { ...widget, placement };
    }),
  };
}
