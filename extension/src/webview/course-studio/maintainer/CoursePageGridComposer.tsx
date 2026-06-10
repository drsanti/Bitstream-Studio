import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { startDashboardGridDragSession } from "../../sensor-studio/core/dashboard/dashboard-grid-drag-move";
import type { PageV1 } from "../schemas/page.v1";
import type { GridPlacementV1 } from "../schemas/placement";
import {
  coursePageGridStyleVars,
  CoursePublishedPageGridShell,
} from "../runtime/CoursePublishedPageGrid";
import { CoursePageEmptyGrid } from "./CoursePageEmptyGrid";
import { CoursePageGridBlockCell } from "./CoursePageGridBlockCell";
import { useCourseOutlineStore } from "./useCourseOutlineStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { pageGridToDashboardMetrics } from "./courseGridMetrics";
import { CoursePageGridGuideCells } from "./CoursePageGridGuideCells";
import { CoursePageGridResizeFrame } from "./CoursePageGridResizeFrame";
import {
  coursePageGridVisibleRows,
} from "./coursePageGridLayout";
import { useCoursePageGridGuidesStore } from "./coursePageGridGuides";
import { isCoursePageGridDeselectSuppressed } from "./coursePageEditorDeselectGuard";
import { useCourseWorkbenchFocusStore } from "../workbench/course-workbench-focus.store";
import { useCourseWidgetBoardEditorStore } from "./widget-board/useCourseWidgetBoardEditorStore";

export function CoursePageGridComposer({ page }: { page: PageV1 }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedCellRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);
  const clearWidgetSelection = useCourseWidgetBoardEditorStore((s) => s.clearWidgetSelection);
  const updatePlacement = useCoursePageEditorStore((s) => s.updatePlacement);
  const pushPageUndoSnapshot = useCoursePageEditorStore((s) => s.pushPageUndoSnapshot);
  const [previewByBlockId, setPreviewByBlockId] = useState<Record<string, GridPlacementV1>>({});
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);
  const gridGuidesEnabled = useCoursePageGridGuidesStore((s) => s.enabled);
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [isGridResizing, setIsGridResizing] = useState(false);

  const metrics = pageGridToDashboardMetrics(page.grid);
  const { grid } = page;
  const gridStyleVars = coursePageGridStyleVars(grid);
  const visibleRows = useMemo(() => coursePageGridVisibleRows(page.blocks), [page.blocks]);

  useLayoutEffect(() => {
    scrollRootRef.current =
      gridRef.current?.closest(".course-workbench-content-pane") ?? null;
  }, []);

  useLayoutEffect(() => {
    const cell = selectedCellRef.current;
    if (selectedBlockId == null || cell == null) {
      return;
    }
    cell.focus({ preventScroll: true });
    cell.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selectedBlockId]);

  const effectivePlacement = (blockId: string, placement: GridPlacementV1) =>
    previewByBlockId[blockId] ?? placement;

  const clearPreview = useCallback((blockId: string) => {
    setPreviewByBlockId((prev) => {
      const { [blockId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const onBlockPointerDown = useCallback(
    (
      blockId: string,
      placement: GridPlacementV1,
      event: ReactPointerEvent<HTMLDivElement>,
    ) => {
      if (event.button !== 0 || isGridResizing) {
        return;
      }
      event.stopPropagation();
      clearWidgetSelection();
      setActiveEditorType("content");
      (event.currentTarget as HTMLElement).focus({ preventScroll: true });
      startDashboardGridDragSession({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originRow: placement.row,
        originColumn: placement.column,
        gridElement: gridRef.current,
        metrics,
        placement,
        onSelect: () => selectBlock(blockId),
        onDragActive: () => {
          setIsGridDragging(true);
          pushPageUndoSnapshot();
        },
        onPreview: (row, column) =>
          setPreviewByBlockId((prev) => ({
            ...prev,
            [blockId]: { ...placement, row, column },
          })),
        onCommit: (row, column) => {
          if (row !== placement.row || column !== placement.column) {
            updatePlacement(blockId, { ...placement, row, column }, { recordUndo: false });
          }
        },
        onDragEnd: () => {
          setIsGridDragging(false);
          clearPreview(blockId);
        },
      });
    },
    [
      clearPreview,
      clearWidgetSelection,
      isGridResizing,
      metrics,
      pushPageUndoSnapshot,
      selectBlock,
      setActiveEditorType,
      updatePlacement,
    ],
  );

  const selectedBlock = useMemo(
    () => page.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [page.blocks, selectedBlockId],
  );

  const selectedPlacement =
    selectedBlock != null
      ? effectivePlacement(selectedBlock.id, selectedBlock.placement)
      : null;

  const showResizeFrame =
    selectedBlock != null && selectedPlacement != null && !isGridDragging;

  const activatePageCanvas = useCallback(() => {
    if (isCoursePageGridDeselectSuppressed()) {
      return;
    }
    clearWidgetSelection();
    selectBlock(null);
    setActiveEditorType("content");
  }, [clearWidgetSelection, selectBlock, setActiveEditorType]);

  return (
    <CoursePublishedPageGridShell gridStyleVars={gridStyleVars}>
        <div
          ref={gridRef}
          className="course-page-grid course-page-grid--composer relative z-[1] w-full"
          style={gridStyleVars}
          onPointerDown={(event) => {
            if (page.blocks.length === 0) {
              activatePageCanvas();
              return;
            }
            if (event.target === event.currentTarget) {
              activatePageCanvas();
            }
          }}
        >
          {gridGuidesEnabled && page.blocks.length > 0 ? (
            <CoursePageGridGuideCells grid={grid} visibleRows={visibleRows} />
          ) : null}
          {page.blocks.length === 0 ? (
            <CoursePageEmptyGrid
              columns={grid.columns}
              visibleRows={visibleRows}
              onActivate={activatePageCanvas}
            />
          ) : null}
          {page.blocks.map((block) => (
            <CoursePageGridBlockCell
              key={block.id}
              block={block}
              selected={selectedBlockId === block.id}
              placement={effectivePlacement(block.id, block.placement)}
              previewing={previewByBlockId[block.id] != null}
              dragging={isGridDragging && selectedBlockId === block.id}
              cellRef={selectedBlockId === block.id ? selectedCellRef : undefined}
              pageMeta={page.meta}
              courseThemes={courseThemes}
              pageLinkHealth={page.meta?.defaultLinkHealth}
              pageStaleMs={page.meta?.staleMs}
              gridColumns={grid.columns}
              onBlockPointerDown={onBlockPointerDown}
            />
          ))}
        </div>
        {showResizeFrame && selectedBlock != null && selectedPlacement != null ? (
          <CoursePageGridResizeFrame
            block={selectedBlock}
            basePlacement={selectedPlacement}
            metrics={metrics}
            gridElement={gridRef.current}
            scrollRootRef={scrollRootRef}
            onPreviewPlacement={(next) =>
              setPreviewByBlockId((prev) => ({ ...prev, [selectedBlock.id]: next }))
            }
            onCommitPlacement={(next) =>
              updatePlacement(selectedBlock.id, next, { recordUndo: false })
            }
            onClearPreview={() => clearPreview(selectedBlock.id)}
            onDragStart={() => {
              setIsGridResizing(true);
              pushPageUndoSnapshot();
            }}
            onDragEnd={() => setIsGridResizing(false)}
          />
        ) : null}
    </CoursePublishedPageGridShell>
  );
}
