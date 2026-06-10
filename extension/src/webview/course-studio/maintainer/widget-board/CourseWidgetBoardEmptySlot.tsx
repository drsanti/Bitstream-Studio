import { Plus } from "lucide-react";

export function CourseWidgetBoardEmptySlot({
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
      className="course-widget-board-grid__empty-slot group"
      style={{
        gridColumn: `${column} / span 1`,
        gridRow: `${row} / span 1`,
      }}
      aria-label={`Add widget at row ${row}, column ${column}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick(column, row, event.currentTarget);
      }}
    >
      <Plus className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden />
    </button>
  );
}
