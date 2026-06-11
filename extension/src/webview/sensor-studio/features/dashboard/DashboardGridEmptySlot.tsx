import { Plus } from "lucide-react";

export function DashboardGridEmptySlot({
  column,
  row,
  onClick,
}: {
  column: number;
  row: number;
  onClick: (column: number, row: number, anchor: HTMLElement) => void;
}) {
  return (
    <div
      className="dashboard-grid-empty-slot pointer-events-none z-[1] flex min-h-0 min-w-0 place-self-stretch items-center justify-center border border-dashed border-cyan-500/25 bg-cyan-500/[0.04]"
      style={{
        gridColumn: `${column} / span 1`,
        gridRow: `${row} / span 1`,
      }}
      aria-hidden
    >
      <button
        type="button"
        className="pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-dashed border-cyan-500/35 bg-cyan-500/[0.06] text-zinc-500 transition-colors hover:border-cyan-500/55 hover:bg-cyan-500/[0.12] hover:text-cyan-400 focus-visible:border-cyan-500/55 focus-visible:bg-cyan-500/[0.12] focus-visible:text-cyan-400 focus-visible:outline-none"
        aria-label={`Add widget at row ${row}, column ${column}`}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClick(column, row, event.currentTarget);
        }}
      >
        <Plus className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      </button>
    </div>
  );
}
