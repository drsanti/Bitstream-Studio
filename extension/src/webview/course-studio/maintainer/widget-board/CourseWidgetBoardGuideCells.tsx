/** Inner-grid guide cells — same grid container as widgets so tracks align exactly. */
export function CourseWidgetBoardGuideCells({
  columns,
  visibleRows,
  occupiedKeys,
}: {
  columns: number;
  visibleRows: number;
  occupiedKeys: ReadonlySet<string>;
}) {
  const count = columns * visibleRows;
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const column = (index % columns) + 1;
        const row = Math.floor(index / columns) + 1;
        const occupied = occupiedKeys.has(`${row}:${column}`);
        return (
          <div
            key={`wb-guide-${column}-${row}`}
            className={[
              "course-widget-board-grid__guide-cell",
              occupied ? "course-widget-board-grid__guide-cell--occupied" : "",
            ]
              .filter(Boolean)
              .join(" ")}
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
