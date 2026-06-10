import { CoursePageEmptyState } from "../runtime/CoursePageEmptyState";
import { placementGridStyle } from "../schemas/placement";
import { coursePageEmptyStateCenterPlacement } from "./coursePageGridLayout";

export function CoursePageEmptyGrid({
  columns,
  visibleRows,
  onActivate,
}: {
  columns: number;
  visibleRows: number;
  onActivate?: () => void;
}) {
  const messagePlacement = coursePageEmptyStateCenterPlacement(columns, visibleRows);
  const cellCount = columns * visibleRows;

  return (
    <>
      {Array.from({ length: cellCount }, (_, index) => {
        const column = (index % columns) + 1;
        const row = Math.floor(index / columns) + 1;
        return (
          <div
            key={`empty-cell-${column}-${row}`}
            className="course-page-grid__cell course-page-grid__cell--idle min-h-0 cursor-default"
            style={{ gridColumn: `${column} / span 1`, gridRow: `${row} / span 1` }}
            onPointerDown={() => onActivate?.()}
          />
        );
      })}
      <div
        className="course-page-grid__cell relative z-[2] min-h-0 cursor-default"
        style={placementGridStyle(messagePlacement)}
        onPointerDown={() => onActivate?.()}
      >
        <div className="course-page-grid__cell-body flex h-full min-h-0 items-center justify-center pointer-events-none">
          <CoursePageEmptyState maintainer fit="grid" />
        </div>
      </div>
    </>
  );
}
