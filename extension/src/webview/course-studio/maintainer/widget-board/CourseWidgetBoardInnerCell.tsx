import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import type { WidgetBoardEntryV1 } from "../../schemas/widgetBoard.v1";
import { tryDeleteSelectedWidgetBoardWidget } from "./courseWidgetBoardDeleteKey";
import { widgetBoardEntryGridStyle } from "../../ui/catalog/widget-board/widgetBoardLayout";
import { CourseWidgetBoardEntry } from "../../ui/catalog/widget-board/CourseWidgetBoardEntry";
import { widgetBoardWidgetKindLabel } from "./widgetBoardPaletteMeta";

export function CourseWidgetBoardInnerCell({
  widget,
  gridColumns,
  selected,
  previewing,
  dragging,
  staleMs,
  cellRef,
  onWidgetPointerDown,
}: {
  widget: WidgetBoardEntryV1;
  gridColumns: number;
  selected: boolean;
  previewing: boolean;
  dragging: boolean;
  staleMs?: number;
  cellRef?: RefObject<HTMLDivElement | null>;
  onWidgetPointerDown: (
    widgetId: string,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
}) {
  const { placement } = widget;
  const kindLabel = widgetBoardWidgetKindLabel(widget.kind);
  const placementHint = `R${placement.row} · C${placement.column} · ${placement.columnSpan}×${placement.rowSpan}`;

  const className = [
    "course-widget-board-grid__cell",
    "course-widget-board-grid__cell--editable",
    "relative",
    "min-h-0",
    "min-w-0",
    "overflow-hidden",
    "touch-none",
    selected ? "course-widget-board-grid__cell--selected" : "course-widget-board-grid__cell--idle",
    previewing ? "course-widget-board-grid__cell--preview" : "",
    dragging ? "cursor-grabbing" : selected ? "cursor-grab" : "cursor-pointer",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={cellRef}
      className={className}
      style={widgetBoardEntryGridStyle(widget.placement, gridColumns)}
      data-course-widget-editor-id={widget.id}
      tabIndex={selected ? 0 : -1}
      role="button"
      aria-label={`${kindLabel} widget, ${placementHint}`}
      aria-pressed={selected}
      onPointerDown={(event) => onWidgetPointerDown(widget.id, event)}
      onKeyDown={(event) => {
        tryDeleteSelectedWidgetBoardWidget(event);
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="course-widget-board-grid__cell-body h-full min-h-0 min-w-0 overflow-hidden">
        <CourseWidgetBoardEntry widget={widget} staleMs={staleMs} />
      </div>
    </div>
  );
}
