import type { PageGridV1 } from "../schemas/page.v1";

/** Guide cells share the composer grid container so tracks match block placement exactly. */
export function CoursePageGridGuideCells({
  grid,
  visibleRows,
}: {
  grid: PageGridV1;
  visibleRows: number;
}) {
  const count = grid.columns * visibleRows;
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const column = (index % grid.columns) + 1;
        const row = Math.floor(index / grid.columns) + 1;
        return (
          <div
            key={`guide-${column}-${row}`}
            className="course-page-grid-cell-overlay__cell pointer-events-none rounded-none"
            style={{
              gridColumn: `${column} / span 1`,
              gridRow: `${row} / span 1`,
            }}
            aria-hidden
          />
        );
      })}
    </>
  );
}
