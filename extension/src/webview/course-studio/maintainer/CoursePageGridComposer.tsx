import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { startDashboardGridDragSession } from "../../sensor-studio/core/dashboard/dashboard-grid-drag-move";
import {
  previewDashboardMultiGridMove,
  type DashboardGridMoveEntry,
  type DashboardGridNudgeDirection,
} from "../../sensor-studio/core/dashboard/dashboard-grid-editor-ops";
import {
  startDashboardMarqueeSelectSession,
  type DashboardMarqueeRect,
} from "../../sensor-studio/core/dashboard/dashboard-marquee-select";
import {
  collectGridMarqueeSelectionIds,
  dashboardSelectionIsAdditive,
  dashboardWidgetSelectionAfterClick,
  dashboardWidgetSelectionAfterMarquee,
  type DashboardWidgetSelectionModifiers,
} from "../../sensor-studio/core/dashboard/dashboard-widget-selection";
import { DashboardMarqueeOverlay } from "../../sensor-studio/features/dashboard/DashboardMarqueeOverlay";
import { DashboardMultiGridResizeFrame } from "../../sensor-studio/features/dashboard/DashboardMultiGridResizeFrame";
import type { PageV1 } from "../schemas/page.v1";
import type { GridPlacementV1 } from "../schemas/placement";
import {
  coursePageGridStyleVars,
  CoursePublishedPageGridShell,
} from "../runtime/CoursePublishedPageGrid";
import { addCoursePageBlockAtGridCell } from "./coursePageGridAddBlock";
import { isCoursePageGridEditChromeTarget } from "./course-page-grid-edit-hit-test";
import {
  nudgePageGridMultiMove,
  nudgePageGridPlacement,
  pageMultiGridResizeUpdates,
  previewPageMultiGridResize,
  resolvePageMultiResizeContext,
  resolvePageSelectionMoveEntries,
} from "./coursePageGridEditorOps";
import { CoursePageAddBlockMenu } from "./CoursePageAddBlockMenu";
import { CoursePageEmptyGrid } from "./CoursePageEmptyGrid";
import { CoursePageGridBlockCell } from "./CoursePageGridBlockCell";
import { CoursePageGridEmptySlot } from "./CoursePageGridEmptySlot";
import { useCourseOutlineStore } from "./useCourseOutlineStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { pageGridToDashboardMetrics } from "./courseGridMetrics";
import { CoursePageGridGuideCells } from "./CoursePageGridGuideCells";
import { CoursePageGridResizeFrame } from "./CoursePageGridResizeFrame";
import { coursePageGridVisibleRows } from "./coursePageGridLayout";
import { useCoursePageGridGuidesStore } from "./coursePageGridGuides";
import { isCoursePageGridDeselectSuppressed } from "./coursePageEditorDeselectGuard";
import { useCourseWorkbenchFocusStore } from "../workbench/course-workbench-focus.store";
import { useCourseWidgetBoardEditorStore } from "./widget-board/useCourseWidgetBoardEditorStore";
import { occupiedPlacementKeysFromBlocks } from "./blockPlacement";
import type { CourseBlockPaletteEntry } from "./blockPaletteMeta";
import { useFocusAddedScene3dBlock } from "./useFocusAddedScene3dBlock";
import { useOpenHtmlPageBlockInEditor } from "./useAddHtmlPageBlock";

type PageGridAddMenuState = {
  column: number;
  row: number;
  anchorRect: DOMRect;
};

function coursePageGridMarqueeCollectIds(args: {
  root: HTMLElement;
  marqueeRect: Pick<DOMRect, "left" | "top" | "right" | "bottom">;
  validIds: ReadonlySet<string>;
}): string[] {
  return collectGridMarqueeSelectionIds({
    ...args,
    selector: "[data-course-block-id]",
    readId: (element) => element.dataset.courseBlockId ?? null,
  });
}

function resolveCoursePageBlockTargetElement(blockId: string): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.querySelector(`[data-course-block-id="${blockId}"]`);
}

export function CoursePageGridComposer({ page }: { page: PageV1 }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedCellRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const dragMoveEntriesRef = useRef<DashboardGridMoveEntry[] | null>(null);
  const selectedBlockIds = useCoursePageEditorStore((s) => s.selectedBlockIds);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const setBlockSelection = useCoursePageEditorStore((s) => s.setBlockSelection);
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);
  const clearWidgetSelection = useCourseWidgetBoardEditorStore((s) => s.clearWidgetSelection);
  const updatePlacement = useCoursePageEditorStore((s) => s.updatePlacement);
  const updatePlacements = useCoursePageEditorStore((s) => s.updatePlacements);
  const pushPageUndoSnapshot = useCoursePageEditorStore((s) => s.pushPageUndoSnapshot);
  const [previewByBlockId, setPreviewByBlockId] = useState<Record<string, GridPlacementV1>>({});
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);
  const gridGuidesEnabled = useCoursePageGridGuidesStore((s) => s.enabled);
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [isGridResizing, setIsGridResizing] = useState(false);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<DashboardMarqueeRect | null>(null);
  const [addMenu, setAddMenu] = useState<PageGridAddMenuState | null>(null);
  const focusAddedScene3dBlock = useFocusAddedScene3dBlock();
  const openHtmlPageBlock = useOpenHtmlPageBlockInEditor();

  const metrics = pageGridToDashboardMetrics(page.grid);
  const { grid } = page;
  const gridStyleVars = coursePageGridStyleVars(grid);
  const visibleRows = useMemo(() => coursePageGridVisibleRows(page.blocks), [page.blocks]);
  const selectedBlockIdSet = useMemo(() => new Set(selectedBlockIds), [selectedBlockIds]);
  const selectableBlockIds = useMemo(
    () => new Set(page.blocks.map((block) => block.id)),
    [page.blocks],
  );

  const occupiedKeys = useMemo(
    () => occupiedPlacementKeysFromBlocks(page.blocks, previewByBlockId),
    [page.blocks, previewByBlockId],
  );

  const emptySlots = useMemo(() => {
    const slots: { column: number; row: number }[] = [];
    for (let row = 1; row <= visibleRows; row += 1) {
      for (let column = 1; column <= grid.columns; column += 1) {
        if (!occupiedKeys.has(`${row}:${column}`)) {
          slots.push({ column, row });
        }
      }
    }
    return slots;
  }, [grid.columns, occupiedKeys, visibleRows]);

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

  const effectivePlacement = useCallback(
    (blockId: string, placement: GridPlacementV1) =>
      previewByBlockId[blockId] ?? placement,
    [previewByBlockId],
  );

  const clearPreview = useCallback((blockId?: string) => {
    if (blockId == null) {
      setPreviewByBlockId({});
      return;
    }
    setPreviewByBlockId((prev) => {
      const { [blockId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const commitBlockPlacement = useCallback(
    (blockId: string, placement: GridPlacementV1) => {
      updatePlacement(blockId, placement, { recordUndo: false });
    },
    [updatePlacement],
  );

  const commitBlockPlacements = useCallback(
    (updates: ReadonlyArray<{ blockId: string; placement: GridPlacementV1 }>) => {
      if (updates.length === 0) {
        return;
      }
      updatePlacements(updates, { recordUndo: false });
    },
    [updatePlacements],
  );

  const onSelectBlock = useCallback(
    (blockId: string, modifiers: DashboardWidgetSelectionModifiers = {}) => {
      const next = dashboardWidgetSelectionAfterClick(
        selectedBlockIds,
        blockId,
        modifiers,
      );
      setBlockSelection(next);
    },
    [selectedBlockIds, setBlockSelection],
  );

  const onDeselectBlocks = useCallback(() => {
    if (isCoursePageGridDeselectSuppressed()) {
      return;
    }
    setAddMenu(null);
    clearWidgetSelection();
    selectBlock(null);
    setActiveEditorType("content");
  }, [clearWidgetSelection, selectBlock, setActiveEditorType]);

  const onEditCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (page.blocks.length === 0) {
        onDeselectBlocks();
        return;
      }
      if (isGridResizing || isGridDragging || isMarqueeSelecting) {
        return;
      }
      if (isCoursePageGridEditChromeTarget(event.target)) {
        return;
      }
      if (event.button !== 0) {
        return;
      }
      const modifiers: DashboardWidgetSelectionModifiers = {
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      };
      startDashboardMarqueeSelectSession({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        modifiers,
        gridElement: gridRef.current,
        validIds: selectableBlockIds,
        captureElement: event.currentTarget,
        collectMarqueeIds: coursePageGridMarqueeCollectIds,
        onPreview: setMarqueeRect,
        onActive: () => setIsMarqueeSelecting(true),
        onEnd: () => {
          setIsMarqueeSelecting(false);
          setMarqueeRect(null);
        },
        onClickWithoutDrag: onDeselectBlocks,
        onCommit: (ids, commitModifiers) => {
          const current = useCoursePageEditorStore.getState().selectedBlockIds;
          const next = dashboardWidgetSelectionAfterMarquee(current, ids, commitModifiers);
          clearWidgetSelection();
          setActiveEditorType("content");
          setBlockSelection(next);
        },
      });
    },
    [
      clearWidgetSelection,
      isGridDragging,
      isGridResizing,
      isMarqueeSelecting,
      onDeselectBlocks,
      page.blocks.length,
      selectableBlockIds,
      setActiveEditorType,
      setBlockSelection,
    ],
  );

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
      setAddMenu(null);
      const pointerModifiers: DashboardWidgetSelectionModifiers = {
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      };

      startDashboardGridDragSession({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originRow: placement.row,
        originColumn: placement.column,
        gridElement: gridRef.current,
        metrics,
        placement,
        onSelect: () => {
          const current = useCoursePageEditorStore.getState().selectedBlockIds;
          if (
            !dashboardSelectionIsAdditive(pointerModifiers) &&
            current.includes(blockId)
          ) {
            return;
          }
          onSelectBlock(blockId, pointerModifiers);
        },
        onDragActive: () => {
          const selected = useCoursePageEditorStore.getState().selectedBlockIds;
          let entries = resolvePageSelectionMoveEntries(page.blocks, selected);
          if (!selected.includes(blockId)) {
            entries = [
              {
                sourceNodeId: blockId,
                placement,
                groupParentId: null,
              },
            ];
          } else if (entries.length === 0) {
            entries = [
              {
                sourceNodeId: blockId,
                placement,
                groupParentId: null,
              },
            ];
          }
          dragMoveEntriesRef.current = entries;
          setIsGridDragging(true);
          pushPageUndoSnapshot();
          (event.currentTarget as HTMLElement).focus({ preventScroll: true });
        },
        onPreview: (row, column) => {
          const entries = dragMoveEntriesRef.current;
          if (entries == null || entries.length <= 1) {
            setPreviewByBlockId((prev) => ({
              ...prev,
              [blockId]: { ...placement, row, column },
            }));
            return;
          }
          const movePreview = previewDashboardMultiGridMove({
            entries,
            anchorSourceNodeId: blockId,
            anchorTargetRow: row,
            anchorTargetColumn: column,
          });
          setPreviewByBlockId((prev) => {
            const next = { ...prev };
            for (const entry of entries) {
              const cell = movePreview[entry.sourceNodeId];
              if (cell == null) {
                continue;
              }
              next[entry.sourceNodeId] = {
                ...entry.placement,
                row: cell.row,
                column: cell.column,
              };
            }
            return next;
          });
        },
        onCommit: (row, column) => {
          const entries = dragMoveEntriesRef.current;
          if (entries == null || entries.length <= 1) {
            if (row !== placement.row || column !== placement.column) {
              commitBlockPlacement(blockId, { ...placement, row, column });
            }
            return;
          }
          const movePreview = previewDashboardMultiGridMove({
            entries,
            anchorSourceNodeId: blockId,
            anchorTargetRow: row,
            anchorTargetColumn: column,
          });
          const updates = entries
            .map((entry) => {
              const nextCell = movePreview[entry.sourceNodeId];
              if (nextCell == null) {
                return null;
              }
              if (
                nextCell.row === entry.placement.row &&
                nextCell.column === entry.placement.column
              ) {
                return null;
              }
              return {
                blockId: entry.sourceNodeId,
                placement: {
                  ...entry.placement,
                  row: nextCell.row,
                  column: nextCell.column,
                },
              };
            })
            .filter((update): update is NonNullable<typeof update> => update != null);
          commitBlockPlacements(updates);
        },
        onDragEnd: () => {
          dragMoveEntriesRef.current = null;
          setIsGridDragging(false);
          clearPreview();
        },
      });
    },
    [
      clearPreview,
      clearWidgetSelection,
      commitBlockPlacement,
      commitBlockPlacements,
      isGridResizing,
      metrics,
      onSelectBlock,
      page.blocks,
      pushPageUndoSnapshot,
      setActiveEditorType,
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

  const selectionMoveEntries = useMemo(
    () => resolvePageSelectionMoveEntries(page.blocks, selectedBlockIds),
    [page.blocks, selectedBlockIds],
  );

  const multiResizeContext = useMemo(
    () => resolvePageMultiResizeContext(selectionMoveEntries),
    [selectionMoveEntries],
  );

  const showSingleResizeFrame =
    selectedBlockIds.length === 1 &&
    selectedBlock != null &&
    selectedPlacement != null &&
    !isGridDragging;
  const showMultiSelectFrame =
    selectedBlockIds.length > 1 && !isGridDragging && !isGridResizing;

  const onEmptySlotClick = useCallback((column: number, row: number, anchor: HTMLElement) => {
    setActiveEditorType("content");
    clearWidgetSelection();
    selectBlock(null);
    setAddMenu({ column, row, anchorRect: anchor.getBoundingClientRect() });
  }, [clearWidgetSelection, selectBlock, setActiveEditorType]);

  const onAddBlockFromMenu = useCallback(
    (entry: CourseBlockPaletteEntry) => {
      if (addMenu == null) {
        return;
      }
      setAddMenu(null);
      pushPageUndoSnapshot();
      addCoursePageBlockAtGridCell(entry, addMenu.column, addMenu.row, {
        page,
        addBlock,
        setBlockSelection,
        focusAddedScene3dBlock,
        openHtmlPageBlock,
      });
    },
    [
      addBlock,
      addMenu,
      focusAddedScene3dBlock,
      openHtmlPageBlock,
      page,
      pushPageUndoSnapshot,
      setBlockSelection,
    ],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isGridDragging || isGridResizing || isMarqueeSelecting) {
        return;
      }
      if (selectedBlockIds.length === 0) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onDeselectBlocks();
        return;
      }
      const direction: DashboardGridNudgeDirection | null =
        event.key === "ArrowUp"
          ? "up"
          : event.key === "ArrowDown"
            ? "down"
            : event.key === "ArrowLeft"
              ? "left"
              : event.key === "ArrowRight"
                ? "right"
                : null;
      if (direction == null) {
        return;
      }
      event.preventDefault();
      pushPageUndoSnapshot();
      if (selectedBlockIds.length === 1 && selectedPlacement != null && selectedBlockId != null) {
        const next = nudgePageGridPlacement({
          placement: selectedPlacement,
          direction,
          blocks: page.blocks,
          selectedIds: selectedBlockIdSet,
          placementFor: effectivePlacement,
          gridColumns: grid.columns,
        });
        if (next == null) {
          return;
        }
        commitBlockPlacement(selectedBlockId, next);
        return;
      }
      const updates = nudgePageGridMultiMove({
        entries: selectionMoveEntries,
        direction,
        blocks: page.blocks,
        placementFor: effectivePlacement,
        gridColumns: grid.columns,
      });
      if (updates == null) {
        return;
      }
      commitBlockPlacements(updates);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    commitBlockPlacement,
    commitBlockPlacements,
    effectivePlacement,
    grid.columns,
    isGridDragging,
    isGridResizing,
    isMarqueeSelecting,
    onDeselectBlocks,
    page.blocks,
    pushPageUndoSnapshot,
    selectedBlockId,
    selectedBlockIdSet,
    selectedBlockIds.length,
    selectedPlacement,
    selectionMoveEntries,
  ]);

  return (
    <CoursePublishedPageGridShell gridStyleVars={gridStyleVars}>
      <div
        ref={gridRef}
        className="course-page-grid course-page-grid--composer relative z-[1] w-full"
        style={gridStyleVars}
        onPointerDown={onEditCanvasPointerDown}
      >
        {gridGuidesEnabled && page.blocks.length > 0 ? (
          <CoursePageGridGuideCells grid={grid} visibleRows={visibleRows} />
        ) : null}
        {page.blocks.length === 0 ? (
          <CoursePageEmptyGrid
            columns={grid.columns}
            visibleRows={visibleRows}
            onEmptySlotClick={onEmptySlotClick}
          />
        ) : (
          emptySlots.map((slot) => (
            <CoursePageGridEmptySlot
              key={`empty-${slot.column}-${slot.row}`}
              column={slot.column}
              row={slot.row}
              onClick={onEmptySlotClick}
            />
          ))
        )}
        {page.blocks.map((block) => (
          <CoursePageGridBlockCell
            key={block.id}
            block={block}
            selected={selectedBlockIdSet.has(block.id)}
            placement={effectivePlacement(block.id, block.placement)}
            previewing={previewByBlockId[block.id] != null}
            dragging={isGridDragging && selectedBlockIdSet.has(block.id)}
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
      {showMultiSelectFrame ? (
        <DashboardMultiGridResizeFrame
          sourceNodeIds={selectedBlockIds}
          selectionCount={selectedBlockIds.length}
          overlayRootRef={scrollRootRef}
          resizeEnabled={multiResizeContext != null}
          unionPlacement={multiResizeContext?.unionPlacement ?? null}
          metrics={metrics}
          gridElement={gridRef.current}
          resolveTargetElement={resolveCoursePageBlockTargetElement}
          onPreviewUnion={(nextUnion) => {
            if (multiResizeContext == null) {
              return;
            }
            setPreviewByBlockId(
              previewPageMultiGridResize({
                entries: multiResizeContext.entries,
                baseUnion: multiResizeContext.unionPlacement,
                nextUnion,
              }),
            );
          }}
          onCommitUnion={(nextUnion) => {
            if (multiResizeContext == null) {
              return;
            }
            const updates = pageMultiGridResizeUpdates({
              entries: multiResizeContext.entries,
              baseUnion: multiResizeContext.unionPlacement,
              nextUnion,
            });
            commitBlockPlacements(updates);
          }}
          onClearPreview={() => clearPreview()}
          onDragStart={() => {
            setIsGridResizing(true);
            pushPageUndoSnapshot();
          }}
          onDragEnd={() => {
            setIsGridResizing(false);
            clearPreview();
          }}
        />
      ) : null}
      {showSingleResizeFrame && selectedBlock != null && selectedPlacement != null ? (
        <CoursePageGridResizeFrame
          block={selectedBlock}
          basePlacement={selectedPlacement}
          metrics={metrics}
          gridElement={gridRef.current}
          scrollRootRef={scrollRootRef}
          onPreviewPlacement={(next) =>
            setPreviewByBlockId((prev) => ({ ...prev, [selectedBlock.id]: next }))
          }
          onCommitPlacement={(next) => commitBlockPlacement(selectedBlock.id, next)}
          onClearPreview={() => clearPreview(selectedBlock.id)}
          onDragStart={() => {
            setIsGridResizing(true);
            pushPageUndoSnapshot();
          }}
          onDragEnd={() => setIsGridResizing(false)}
        />
      ) : null}
      {marqueeRect != null ? (
        <DashboardMarqueeOverlay rect={marqueeRect} overlayRootRef={scrollRootRef} />
      ) : null}
      {addMenu != null ? (
        <CoursePageAddBlockMenu
          anchorRect={addMenu.anchorRect}
          onPick={onAddBlockFromMenu}
          onDismiss={() => setAddMenu(null)}
        />
      ) : null}
    </CoursePublishedPageGridShell>
  );
}
