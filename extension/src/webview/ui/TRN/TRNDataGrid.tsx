import { useCallback, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { twMerge } from "tailwind-merge";

export type TRNDataGridSortDirection = "asc" | "desc" | null;

export type TRNDataGridColumnAlign = "start" | "end" | "center";

export type TRNDataGridColumn<TRow> = {
  id: string;
  label: string;
  sortable?: boolean;
  width?: number;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  /** Header + body horizontal alignment (default start). */
  align?: TRNDataGridColumnAlign;
  getValue?: (row: TRow) => string | number | boolean | null | undefined;
  cell?: (row: TRow) => ReactNode;
};

type TRNDataGridProps<TRow> = {
  columns: TRNDataGridColumn<TRow>[];
  rows: TRow[];
  getRowId: (row: TRow, index: number) => string;
  stickyHeader?: boolean;
  resizableColumns?: boolean;
  className?: string;
  tableClassName?: string;
  defaultSortColumnId?: string;
  defaultSortDirection?: TRNDataGridSortDirection;
  onSortChange?: (
    columnId: string | null,
    direction: TRNDataGridSortDirection,
  ) => void;
};

/**
 * Themed data table with optional client-side sort and column drag-resize.
 */
export function TRNDataGrid<TRow>(props: TRNDataGridProps<TRow>) {
  const {
    columns,
    rows,
    getRowId,
    stickyHeader = true,
    resizableColumns = false,
    className = "",
    tableClassName = "",
    defaultSortColumnId,
    defaultSortDirection = null,
    onSortChange,
  } = props;

  const [sortCol, setSortCol] = useState<string | null>(
    defaultSortColumnId ?? null,
  );
  const [sortDir, setSortDir] = useState<TRNDataGridSortDirection>(
    defaultSortDirection,
  );
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const w: Record<string, number> = {};
    for (const c of columns) {
      if (c.width != null) {
        w[c.id] = c.width;
      }
    }
    return w;
  });
  const dragRef = useRef<{
    colId: string;
    startX: number;
    startW: number;
  } | null>(null);

  const sortedRows = useMemo(() => {
    if (sortCol == null || sortDir == null) {
      return rows;
    }
    const col = columns.find((c) => c.id === sortCol);
    if (col == null || col.getValue == null) {
      return rows;
    }
    const copy = [...rows];
    const mult = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const va = col.getValue!(a);
      const vb = col.getValue!(b);
      if (va == null && vb == null) {
        return 0;
      }
      if (va == null) {
        return 1;
      }
      if (vb == null) {
        return -1;
      }
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * mult;
      }
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * mult;
    });
    return copy;
  }, [columns, rows, sortCol, sortDir]);

  const toggleSort = useCallback(
    (colId: string) => {
      const col = columns.find((c) => c.id === colId);
      if (col == null || col.sortable === false) {
        return;
      }
      if (col.getValue == null) {
        return;
      }
      let nextDir: TRNDataGridSortDirection;
      if (sortCol !== colId) {
        nextDir = "asc";
      }
      else if (sortDir === "asc") {
        nextDir = "desc";
      }
      else {
        nextDir = "asc";
      }
      setSortCol(colId);
      setSortDir(nextDir);
      onSortChange?.(colId, nextDir);
    },
    [columns, onSortChange, sortCol, sortDir],
  );

  const onResizeStart = (colId: string, e: ReactPointerEvent) => {
    if (!resizableColumns) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const w = colWidths[colId] ?? columns.find((c) => c.id === colId)?.width ?? 80;
    dragRef.current = { colId, startX: e.clientX, startW: w };
    const onMove = (ev: globalThis.PointerEvent) => {
      if (dragRef.current == null) {
        return;
      }
      const d = ev.clientX - dragRef.current.startX;
      const next = Math.max(48, dragRef.current.startW + d);
      setColWidths((prev) => ({
        ...prev,
        [dragRef.current!.colId]: next,
      }));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className={
        "w-full min-h-0 border border-zinc-700/80 rounded-md overflow-x-auto " +
        className
      }
    >
      <table
        className={"w-full border-collapse text-xs " + tableClassName}
        style={
          {
            minWidth: Math.max(
              200,
              columns.reduce(
                (acc, c) => acc + (colWidths[c.id] ?? c.width ?? 100),
                0,
              ),
            ),
          } as CSSProperties
        }
      >
        <thead
          className={twMerge(
            "border-b border-zinc-600/55 bg-zinc-900/92 backdrop-blur-sm",
            stickyHeader ? "sticky top-0 z-10" : "",
          )}
        >
          <tr>
            {columns.map((col) => {
              const w = colWidths[col.id] ?? col.width;
              const isSorted = sortCol === col.id;
              const align = col.align ?? "start";
              const alignTh =
                align === "end" ? "text-end" : align === "center" ? "text-center" : "text-start";
              const labelJustify =
                align === "end"
                  ? "flex w-full min-w-0 justify-end"
                  : align === "center"
                    ? "flex w-full min-w-0 justify-center"
                    : "inline-flex min-w-0 items-center justify-start";
              return (
                <th
                  key={col.id}
                  className={twMerge(
                    "relative px-2 py-2 text-[11px] font-semibold tracking-wide text-zinc-200/95",
                    alignTh,
                    col.sortable !== false && col.getValue ? "cursor-pointer select-none" : "",
                    col.headerClassName,
                  )}
                  style={w != null ? { width: w, minWidth: 48, maxWidth: 480 } : { minWidth: 48 }}
                  onClick={() => {
                    if (col.sortable !== false && col.getValue) {
                      toggleSort(col.id);
                    }
                  }}
                >
                  <span
                    className={twMerge(
                      "items-center gap-1",
                      labelJustify,
                      col.className,
                    )}
                  >
                    {col.label}
                    {isSorted && sortDir === "asc" ? " ▲" : null}
                    {isSorted && sortDir === "desc" ? " ▼" : null}
                  </span>
                  {resizableColumns ? (
                    <span
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-cyan-500/30"
                      onPointerDown={(e) => onResizeStart(col.id, e)}
                      aria-hidden="true"
                    />
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, rIdx) => {
            const rid = getRowId(row, rIdx);
            return (
              <tr
                key={rid}
                className="border-b border-zinc-800/55 odd:bg-zinc-950/35 even:bg-zinc-950/15 hover:bg-zinc-800/35"
              >
                {columns.map((col) => {
                  const w = colWidths[col.id] ?? col.width;
                  const align = col.align ?? "start";
                  const alignTd =
                    align === "end" ? "text-end" : align === "center" ? "text-center" : "text-start";
                  const node: ReactNode =
                    col.cell != null
                      ? col.cell(row)
                      : (() => {
                          if (col.getValue == null) {
                            return "";
                          }
                          const v = col.getValue(row);
                          if (v == null) {
                            return "—";
                          }
                          return String(v);
                        })();
                  return (
                    <td
                      key={col.id}
                      className={twMerge(
                        "px-2 py-1.5 text-[11px] text-zinc-100 tabular-nums",
                        alignTd,
                        col.cellClassName,
                      )}
                      style={w != null ? { width: w } : undefined}
                    >
                      {node as ReactNode}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
