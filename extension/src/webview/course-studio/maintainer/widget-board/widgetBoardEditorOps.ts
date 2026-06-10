import { dashboardPlacementCellKeys } from "../../../sensor-studio/core/dashboard/dashboard-placement";
import type { DashboardGridMetricsV1 } from "../../../sensor-studio/core/dashboard/dashboard-grid-resize";
import type { PageBlockV1 } from "../../schemas/page.v1";
import type { GridPlacementV1 } from "../../schemas/placement";
import {
  WIDGET_BOARD_WIDGET_MIN_SPAN,
  type WidgetBoardEntryV1,
  type WidgetBoardInnerGridV1,
  type WidgetBoardWidgetKind,
} from "../../schemas/widgetBoard.v1";
import { HERO_RADIAL_GAUGE_DEFAULTS } from "../../ui/catalog/widget-board/heroRadialGaugeConfig";
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

  if (kind === "metric-bar") {
    return {
      id,
      kind,
      placement: fitted,
      label: "Metric",
      min: 0,
      max: 100,
      decimals: 0,
      demoValue: 50,
    };
  }

  return {
    id,
    kind,
    placement: fitted,
    min: 0,
    max: 180,
    decimals: 0,
    unit: "km/h",
    demoValue: 0,
    ...HERO_RADIAL_GAUGE_DEFAULTS,
  };
}

export function createWidgetBoardEntry(
  kind: WidgetBoardWidgetKind,
  widgets: readonly WidgetBoardEntryV1[],
  columns: number,
): WidgetBoardEntryV1 {
  const min = WIDGET_BOARD_WIDGET_MIN_SPAN[kind];
  const placement = findOpenWidgetBoardPlacement(widgets, columns, min);
  const id = nextUniquePageBlockId(kind, widgets);

  if (kind === "metric-bar") {
    return {
      id,
      kind,
      placement,
      label: "Metric",
      min: 0,
      max: 100,
      decimals: 0,
      demoValue: 50,
    };
  }

  return {
    id,
    kind,
    placement,
    min: 0,
    max: 180,
    decimals: 0,
    unit: "km/h",
    demoValue: 0,
    ...HERO_RADIAL_GAUGE_DEFAULTS,
  };
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

  const shared = {
    id: widget.id,
    kind,
    placement,
    min: widget.min,
    max: widget.max,
    decimals: widget.decimals,
    demoValue: widget.demoValue,
    binding: widget.binding,
    typography: widget.typography,
  };

  if (kind === "metric-bar") {
    return {
      ...shared,
      kind: "metric-bar",
      label: widget.kind === "metric-bar" ? widget.label : "Metric",
    };
  }

  const heroDefaults =
    widget.kind === "hero-radial-gauge"
      ? {
          label: widget.label,
          unit: widget.unit,
          heroArcPreset: widget.heroArcPreset,
          showValue: widget.showValue,
          showUnit: widget.showUnit,
          fillSmoothingMs: widget.fillSmoothingMs,
          holeSizePercent: widget.holeSizePercent,
          zoneTint: widget.zoneTint,
          showGlow: widget.showGlow,
          arcCap: widget.arcCap,
        }
      : {
          unit: "km/h" as const,
        };

  return {
    ...shared,
    kind: "hero-radial-gauge",
    ...heroDefaults,
  };
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
  if (block.widgets.length <= 1) {
    return null;
  }
  return {
    ...block,
    widgets: block.widgets.filter((widget) => widget.id !== widgetId),
  };
}
