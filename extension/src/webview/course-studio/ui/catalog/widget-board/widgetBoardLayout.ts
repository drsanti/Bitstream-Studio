import type { CSSProperties } from "react";
import type { DiagramBindingV1 } from "../../../schemas/diagram.v1";
import { clampPlacementToGrid } from "../../../schemas/placement";
import type { WidgetBoardEntryV1, WidgetBoardInnerGridV1 } from "../../../schemas/widgetBoard.v1";

export const WIDGET_BOARD_EDITOR_MIN_VISIBLE_ROWS = 8;

export function widgetBoardInnerGridStyleVars(
  grid: WidgetBoardInnerGridV1,
): CSSProperties {
  return {
    "--course-wb-grid-columns": grid.columns,
    "--course-wb-grid-gap": `${grid.gapPx}px`,
    "--course-wb-grid-padding": `${grid.paddingPx}px`,
    "--course-wb-grid-row-height": `${grid.rowHeightPx}px`,
  } as CSSProperties;
}

/** Total pixel height of `visibleRows` fixed tracks (padding + gaps + rows). */
export function widgetBoardGridTracksHeightPx(
  grid: WidgetBoardInnerGridV1,
  visibleRows: number,
): number {
  return (
    visibleRows * grid.rowHeightPx +
    Math.max(0, visibleRows - 1) * grid.gapPx +
    grid.paddingPx * 2
  );
}

export function widgetBoardOccupiedRowCount(
  widgets: readonly { placement: { row: number; rowSpan: number } }[],
): number {
  return widgets.reduce(
    (max, widget) => Math.max(max, widget.placement.row + widget.placement.rowSpan - 1),
    0,
  );
}

/** Page / read embed — fixed row tracks sized to occupied widgets (no editor min rows). */
export function widgetBoardPublishedGridLayoutStyle(
  grid: WidgetBoardInnerGridV1,
  widgets: readonly { placement: { row: number; rowSpan: number } }[],
): CSSProperties {
  const visibleRows = Math.max(1, widgetBoardOccupiedRowCount(widgets));
  const trackHeightPx = widgetBoardGridTracksHeightPx(grid, visibleRows);
  return {
    ...widgetBoardInnerGridStyleVars(grid),
    gridAutoRows: `${grid.rowHeightPx}px`,
    alignContent: "start",
    minHeight: `${trackHeightPx}px`,
  };
}

/** Widget Editor inner grid — fixed row tracks (Page Editor composer parity). */
export function widgetBoardEditorGridLayoutStyle(
  grid: WidgetBoardInnerGridV1,
  visibleRows: number,
): CSSProperties {
  const trackHeightPx = widgetBoardGridTracksHeightPx(grid, visibleRows);
  return {
    ...widgetBoardInnerGridStyleVars(grid),
    display: "grid",
    gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`,
    gridAutoRows: `${grid.rowHeightPx}px`,
    gap: `${grid.gapPx}px`,
    padding: `${grid.paddingPx}px`,
    minHeight: `${trackHeightPx}px`,
    height: `${trackHeightPx}px`,
  };
}

export function widgetBoardEntryGridStyle(
  placement: {
    column: number;
    row: number;
    columnSpan: number;
    rowSpan: number;
  },
  columns: number,
): CSSProperties {
  const bounded = clampPlacementToGrid(placement, columns);
  return {
    gridColumn: `${bounded.column} / span ${bounded.columnSpan}`,
    gridRow: `${bounded.row} / span ${bounded.rowSpan}`,
  };
}

export function normalizeWidgetBoardScalar(
  value: number | null,
  min: number,
  max: number,
): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  const span = max - min;
  if (Math.abs(span) <= Number.EPSILON) {
    return 0;
  }
  return Math.max(0, Math.min(1, (value - min) / span));
}

export function formatWidgetBoardValue(value: number | null, decimals: number): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(decimals);
}

/** Widget canvas suffix — live binding wins for hero gauge when a path is bound. */
export function resolveWidgetBoardDisplayUnit(args: {
  widget: Pick<WidgetBoardEntryV1, "kind" | "unit">;
  binding?: DiagramBindingV1 | null;
  liveUnit: string;
}): string {
  const binding = args.binding;
  const hasLiveBinding = binding?.path != null && binding.path.length > 0;
  const widgetUnit = args.widget.unit?.trim() ?? "";
  const bindingUnit = binding?.unit?.trim() ?? "";
  const liveUnit = args.liveUnit.trim();

  if (
    args.widget.kind === "metric-bar" ||
    args.widget.kind === "numeric-readout" ||
    args.widget.kind === "vertical-bar"
  ) {
    return liveUnit || bindingUnit || widgetUnit;
  }
  if (hasLiveBinding) {
    return liveUnit || widgetUnit;
  }
  return widgetUnit || liveUnit || bindingUnit;
}
