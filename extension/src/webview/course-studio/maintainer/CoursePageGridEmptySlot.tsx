import { Plus } from "lucide-react";

export function CoursePageGridEmptySlot({
  column,
  row,
  onClick,
}: {
  column: number;
  row: number;
  onClick: (column: number, row: number, anchor: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      className="course-page-grid__empty-slot group z-[1] flex min-h-0 min-w-0 touch-none place-self-stretch items-center justify-center"
      style={{
        gridColumn: `${column} / span 1`,
        gridRow: `${row} / span 1`,
      }}
      aria-label={`Add block at row ${row}, column ${column}`}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick(column, row, event.currentTarget);
      }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-dashed border-amber-500/35 bg-amber-500/[0.06] text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </span>
    </button>
  );
}
