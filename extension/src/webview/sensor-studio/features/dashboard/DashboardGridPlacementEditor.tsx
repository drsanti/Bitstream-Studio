import { useMemo } from "react";
import { dashboardSquareGridTemplateColumns } from "../../core/dashboard/dashboard-square-grid";

type DashboardGridPlacementEditorProps = {
  columns: number;
  gapPx: number;
  paddingPx: number;
  rowHeightPx: number;
  visibleRows?: number;
  /** Cells with widgets — no move target buttons (pointer passes through to widgets). */
  occupiedCellKeys: ReadonlySet<string>;
  /** False while resizing so the overlay does not steal pointer events. */
  interactive?: boolean;
  onPlaceAt: (row: number, column: number) => void;
};

export function DashboardGridPlacementEditor(props: DashboardGridPlacementEditorProps) {
  const {
    columns,
    gapPx,
    paddingPx,
    rowHeightPx,
    visibleRows = 10,
    occupiedCellKeys,
    interactive = true,
    onPlaceAt,
  } = props;

  const style = useMemo(
    () => ({
      position: "absolute" as const,
      inset: `${paddingPx}px`,
      display: "grid" as const,
      gridTemplateColumns: dashboardSquareGridTemplateColumns(columns, rowHeightPx),
      gridAutoRows: `${rowHeightPx}px`,
      gap: `${gapPx}px`,
      pointerEvents: interactive ? ("auto" as const) : ("none" as const),
    }),
    [columns, gapPx, interactive, paddingPx, rowHeightPx],
  );

  const cells = useMemo(() => {
    const count = columns * visibleRows;
    return Array.from({ length: count }, (_, index) => {
      const row = Math.floor(index / columns) + 1;
      const column = (index % columns) + 1;
      const key = `${row}:${column}`;
      if (occupiedCellKeys.has(key)) {
        return <div key={key} className="pointer-events-none" aria-hidden />;
      }
      return (
        <button
          key={key}
          type="button"
          className="pointer-events-auto rounded-none border border-dashed border-cyan-500/20 bg-cyan-500/[0.03] transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/12 focus-visible:border-cyan-400/60 focus-visible:bg-cyan-500/15 focus-visible:outline-none"
          aria-label={`Move widget to row ${row}, column ${column}`}
          onClick={() => onPlaceAt(row, column)}
        />
      );
    });
  }, [columns, occupiedCellKeys, onPlaceAt, visibleRows]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden={false}
    >
      <div style={style}>{cells}</div>
    </div>
  );
}
