import { CoursePageEmptyState } from "../runtime/CoursePageEmptyState";
import { placementGridStyle } from "../schemas/placement";
import { coursePageEmptyStateCenterPlacement } from "./coursePageGridLayout";
import { CoursePageGridEmptySlot } from "./CoursePageGridEmptySlot";

export function CoursePageEmptyGrid({
  columns,
  visibleRows,
  onEmptySlotClick,
}: {
  columns: number;
  visibleRows: number;
  onEmptySlotClick: (column: number, row: number, anchor: HTMLElement) => void;
}) {
  const messagePlacement = coursePageEmptyStateCenterPlacement(columns, visibleRows);
  const cellCount = columns * visibleRows;

  return (
    <>
      {Array.from({ length: cellCount }, (_, index) => {
        const column = (index % columns) + 1;
        const row = Math.floor(index / columns) + 1;
        return (
          <CoursePageGridEmptySlot
            key={`empty-cell-${column}-${row}`}
            column={column}
            row={row}
            onClick={onEmptySlotClick}
          />
        );
      })}
      <div
        className="course-page-grid__cell relative z-[2] min-h-0 pointer-events-none"
        style={placementGridStyle(messagePlacement)}
      >
        <div className="course-page-grid__cell-body flex h-full min-h-0 items-center justify-center">
          <CoursePageEmptyState maintainer fit="grid" />
        </div>
      </div>
    </>
  );
}
