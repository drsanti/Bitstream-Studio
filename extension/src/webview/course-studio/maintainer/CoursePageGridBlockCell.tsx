import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useKonvaCanvasBackground } from "../content/diagramRegistry";
import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import type { CourseThemesV1 } from "../schemas/courseThemes.v1";
import type { GridPlacementV1 } from "../schemas/placement";
import type { LinkHealthPolicy } from "../schemas/linkHealth";
import { placementGridStyle } from "../schemas/placement";
import { BlockRenderer } from "../runtime/BlockRenderer";
import { useCourseWorkbenchFocusStore } from "../workbench/course-workbench-focus.store";
import { tryDeleteSelectedCoursePageBlock } from "./coursePageBlockDeleteKey";

function courseGridCellBodyOverflow(blockKind: PageBlockV1["kind"]): string {
  if (blockKind === "dashboard-widget" || blockKind === "live-metric" || blockKind === "sensor-telemetry-card") {
    return "overflow-hidden";
  }
  return "overflow-auto";
}

function courseGridCellBodyPointerPassthrough(
  blockKind: PageBlockV1["kind"],
  selected: boolean,
): boolean {
  return (
    selected ||
    blockKind === "youtube" ||
    blockKind === "iframe" ||
    blockKind === "html-page"
  );
}

function courseGridCellClassName(
  selected: boolean,
  previewing: boolean,
  dragging: boolean,
): string {
  const parts = [
    "course-page-grid__cell",
    "course-page-grid__cell--editable",
    "relative",
    "min-h-0",
    "min-w-0",
    "overflow-hidden",
    "touch-none",
  ];
  if (selected) {
    parts.push("course-page-grid__cell--selected");
    parts.push(dragging ? "cursor-grabbing" : "cursor-grab");
  } else {
    parts.push("course-page-grid__cell--idle");
  }
  if (previewing) {
    parts.push("course-page-grid__cell--preview");
  }
  return parts.join(" ");
}

export function CoursePageGridBlockCell({
  block,
  selected,
  placement,
  previewing,
  dragging,
  cellRef,
  pageMeta,
  courseThemes,
  pageLinkHealth,
  pageStaleMs,
  onBlockPointerDown,
}: {
  block: PageBlockV1;
  selected: boolean;
  placement: GridPlacementV1;
  previewing: boolean;
  dragging: boolean;
  cellRef?: RefObject<HTMLDivElement | null>;
  pageMeta?: PageV1["meta"];
  courseThemes?: CourseThemesV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
  onBlockPointerDown: (
    blockId: string,
    placement: GridPlacementV1,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
}) {
  const canvasBg =
    block.kind === "diagram-2d" ? useKonvaCanvasBackground(block.diagramId) : null;
  const cellStyle = {
    ...placementGridStyle(placement),
    ...(canvasBg != null
      ? ({ "--course-diagram-canvas-bg": canvasBg } as CSSProperties)
      : {}),
  };
  const cellClassName = [
    courseGridCellClassName(selected, previewing, dragging),
    canvasBg != null ? "course-page-grid__cell--konva-canvas" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={cellRef}
      className={cellClassName}
      style={cellStyle}
      data-course-block-id={block.id}
      tabIndex={selected ? 0 : -1}
      onPointerDown={(event) => onBlockPointerDown(block.id, placement, event)}
      onKeyDown={(event) => {
        if (!selected) {
          return;
        }
        const contextEditorType = useCourseWorkbenchFocusStore.getState().contextEditorType;
        tryDeleteSelectedCoursePageBlock(event, contextEditorType);
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={`course-page-grid__cell-body h-full min-h-0 ${courseGridCellBodyOverflow(block.kind)} ${
          courseGridCellBodyPointerPassthrough(block.kind, selected) ? "pointer-events-none" : ""
        } ${previewing ? "opacity-80" : ""}`}
      >
        <BlockRenderer
          block={block}
          pageMeta={pageMeta}
          courseThemes={courseThemes}
          pageLinkHealth={pageLinkHealth}
          pageStaleMs={pageStaleMs}
        />
      </div>
    </div>
  );
}
