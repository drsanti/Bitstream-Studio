import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";

export type SortDirection = "asc" | "desc";

type SortableTableColumnBase = {
  id: string;
  label: string;
  srOnlyLabel?: boolean;
  headerClassName?: string;
  align?: "left" | "right";
};

export type SortableTableColumn<SortId extends string> =
  | (SortableTableColumnBase & {
      sortable: false;
    })
  | (SortableTableColumnBase & {
      sortable: true;
      sortColumnId: SortId;
    });

export interface SortableTableProps<SortId extends string> {
  caption?: string;
  columns: SortableTableColumn<SortId>[];
  sort: { columnId: SortId; direction: SortDirection };
  onSortClick: (columnId: SortId) => void;
  children: ReactNode;
  tableClassName?: string;
}

const HEADER_ROW_CLASS =
  "border-b border-white/10 bg-[#0f1419]/98 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 backdrop-blur-md";

const SORT_BUTTON_CLASS =
  "inline-flex w-full items-center gap-1 rounded px-0 py-0 text-left font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-500/50";

function alignClass(align: "left" | "right" | undefined, forButton: boolean): string {
  if (align === "right") {
    return forButton ? "justify-end text-right" : "text-right";
  }
  return "text-left";
}

/**
 * Shared data table shell: sticky header row and optional sortable column headers (click to toggle asc/desc).
 */
export function SortableTable<SortId extends string>({
  caption,
  columns,
  sort,
  onSortClick,
  children,
  tableClassName,
}: SortableTableProps<SortId>) {
  return (
    <table
      className={
        tableClassName ??
        "w-full table-fixed border-separate border-spacing-0 text-left"
      }
    >
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <thead>
        <tr className={HEADER_ROW_CLASS}>
          {columns.map((col) => {
            const sticky = "sticky top-0 z-1";
            const pad =
              col.align === "right"
                ? col.sortable
                  ? "px-3 py-2.5"
                  : "px-3 py-2.5"
                : "px-2 py-2.5 pl-3";
            const thClass = [sticky, pad, col.headerClassName, alignClass(col.align, false)]
              .filter(Boolean)
              .join(" ");

            if (!col.sortable) {
              return (
                <th key={col.id} scope="col" className={thClass}>
                  {col.srOnlyLabel ? (
                    <span className="sr-only">{col.label}</span>
                  ) : (
                    col.label
                  )}
                </th>
              );
            }

            const active = sort.columnId === col.sortColumnId;
            const SortIcon = sort.direction === "asc" ? ArrowUp : ArrowDown;

            return (
              <th key={col.id} scope="col" className={thClass}>
                <button
                  type="button"
                  className={`${SORT_BUTTON_CLASS} ${alignClass(col.align, true)}`}
                  onClick={() => onSortClick(col.sortColumnId)}
                  aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                >
                  <span>{col.label}</span>
                  {active ? (
                    <SortIcon className="h-3 w-3 shrink-0 text-sky-400" aria-hidden />
                  ) : null}
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      {children}
    </table>
  );
}
