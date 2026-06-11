import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { startDashboardGridDragSession } from "../../../sensor-studio/core/dashboard/dashboard-grid-drag-move";
import {
  previewDashboardMultiGridMove,
  type DashboardGridMoveEntry,
  type DashboardGridNudgeDirection,
} from "../../../sensor-studio/core/dashboard/dashboard-grid-editor-ops";
import {
  startDashboardMarqueeSelectSession,
  type DashboardMarqueeRect,
} from "../../../sensor-studio/core/dashboard/dashboard-marquee-select";
import {
  collectGridMarqueeSelectionIds,
  dashboardSelectionIsAdditive,
  dashboardWidgetSelectionAfterClick,
  dashboardWidgetSelectionAfterMarquee,
  type DashboardWidgetSelectionModifiers,
} from "../../../sensor-studio/core/dashboard/dashboard-widget-selection";
import { DashboardMarqueeOverlay } from "../../../sensor-studio/features/dashboard/DashboardMarqueeOverlay";
import { DashboardMultiGridResizeFrame } from "../../../sensor-studio/features/dashboard/DashboardMultiGridResizeFrame";
import type { PageBlockV1 } from "../../schemas/page.v1";
import type { GridPlacementV1 } from "../../schemas/placement";
import type { WidgetBoardWidgetKind } from "../../schemas/widgetBoard.v1";
import {
  resolveWidgetBoardThemeTokens,
  widgetBoardThemeTokensToCssProperties,
} from "../../schemas/widgetBoardTheme.v1";
import { widgetBoardEditorGridLayoutStyle } from "../../ui/catalog/widget-board/widgetBoardLayout";
import { useCourseWorkbenchFocusStore } from "../../workbench/course-workbench-focus.store";
import { useCoursePageEditorStore } from "../useCoursePageEditorStore";
import { isCourseWidgetBoardEditChromeTarget } from "./course-widget-board-edit-hit-test";
import { CourseWidgetBoardAddWidgetMenu } from "./CourseWidgetBoardAddWidgetMenu";
import { CourseWidgetBoardEmptySlot } from "./CourseWidgetBoardEmptySlot";
import { CourseWidgetBoardGuideCells } from "./CourseWidgetBoardGuideCells";
import { CourseWidgetBoardInnerCell } from "./CourseWidgetBoardInnerCell";
import { CourseWidgetBoardResizeFrame } from "./CourseWidgetBoardResizeFrame";
import {
  createWidgetBoardEntryAtPlacement,
  findPlacementAtAnchor,
  nudgeWidgetBoardGridPlacement,
  nudgeWidgetBoardMultiGridMove,
  occupiedWidgetPlacementKeys,
  patchWidgetBoardWidget,
  patchWidgetBoardWidgetsPlacements,
  previewWidgetBoardMultiGridResize,
  resolveWidgetBoardMultiResizeContext,
  resolveWidgetBoardSelectionMoveEntries,
  widgetBoardGridToDashboardMetrics,
  widgetBoardMultiGridResizeUpdates,
  widgetBoardVisibleRows,
} from "./widgetBoardEditorOps";
import { useCourseWidgetBoardEditorStore } from "./useCourseWidgetBoardEditorStore";

type AddMenuState = {
  column: number;
  row: number;
  anchorRect: DOMRect;
};

function courseWidgetBoardMarqueeCollectIds(args: {
  root: HTMLElement;
  marqueeRect: Pick<DOMRect, "left" | "top" | "right" | "bottom">;
  validIds: ReadonlySet<string>;
}): string[] {
  return collectGridMarqueeSelectionIds({
    ...args,
    selector: "[data-course-widget-editor-id]",
    readId: (element) => element.dataset.courseWidgetEditorId ?? null,
  });
}

function resolveCourseWidgetBoardTargetElement(widgetId: string): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.querySelector(`[data-course-widget-editor-id="${widgetId}"]`);
}

export function CourseWidgetBoardInnerComposer({
  block,
  staleMs,
}: {
  block: Extract<PageBlockV1, { kind: "widget-board" }>;
  staleMs?: number;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const overlayRootRef = useRef<HTMLElement | null>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const selectedCellRef = useRef<HTMLDivElement>(null);
  const dragMoveEntriesRef = useRef<DashboardGridMoveEntry[] | null>(null);
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const pushPageUndoSnapshot = useCoursePageEditorStore((s) => s.pushPageUndoSnapshot);
  const selectedWidgetIds = useCourseWidgetBoardEditorStore((s) => s.selectedWidgetIds);
  const selectedWidgetId = useCourseWidgetBoardEditorStore((s) => s.selectedWidgetId);
  const setWidgetSelection = useCourseWidgetBoardEditorStore((s) => s.setWidgetSelection);
  const clearWidgetSelection = useCourseWidgetBoardEditorStore((s) => s.clearWidgetSelection);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);

  const [previewByWidgetId, setPreviewByWidgetId] = useState<Record<string, GridPlacementV1>>({});
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [isGridResizing, setIsGridResizing] = useState(false);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<DashboardMarqueeRect | null>(null);
  const [addMenu, setAddMenu] = useState<AddMenuState | null>(null);

  const { grid, appearance } = block;
  const metrics = widgetBoardGridToDashboardMetrics(grid);
  const visibleRows = useMemo(() => widgetBoardVisibleRows(block.widgets), [block.widgets]);
  const themeTokens = resolveWidgetBoardThemeTokens({
    presetId: appearance?.themePresetId ?? "ev-compact",
    overrides: appearance?.overrides,
  });
  const themeStyle = widgetBoardThemeTokensToCssProperties(themeTokens);
  const editorGridStyle = widgetBoardEditorGridLayoutStyle(grid, visibleRows);

  const selectedWidgetIdSet = useMemo(() => new Set(selectedWidgetIds), [selectedWidgetIds]);
  const selectableWidgetIds = useMemo(
    () => new Set(block.widgets.map((widget) => widget.id)),
    [block.widgets],
  );

  const occupiedKeys = useMemo(() => {
    const withPreview = block.widgets.map((widget) => ({
      ...widget,
      placement: previewByWidgetId[widget.id] ?? widget.placement,
    }));
    return occupiedWidgetPlacementKeys(withPreview);
  }, [block.widgets, previewByWidgetId]);

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
      gridRef.current?.closest(".course-widget-board-editor-scroll") ?? null;
    overlayRootRef.current = canvasRef.current;
  }, []);

  useLayoutEffect(() => {
    const cell = selectedCellRef.current;
    if (selectedWidgetId == null || cell == null) {
      return;
    }
    cell.focus({ preventScroll: true });
  }, [selectedWidgetId]);

  const effectivePlacement = useCallback(
    (widgetId: string, placement: GridPlacementV1) =>
      previewByWidgetId[widgetId] ?? placement,
    [previewByWidgetId],
  );

  const clearPreview = useCallback((widgetId?: string) => {
    if (widgetId == null) {
      setPreviewByWidgetId({});
      return;
    }
    setPreviewByWidgetId((prev) => {
      const { [widgetId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const commitWidgetPlacement = useCallback(
    (widgetId: string, placement: GridPlacementV1, recordUndo: boolean) => {
      const next = patchWidgetBoardWidget(block, widgetId, { placement });
      updateBlock(block.id, { widgets: next.widgets }, { recordUndo });
    },
    [block, updateBlock],
  );

  const commitWidgetPlacements = useCallback(
    (updates: ReadonlyArray<{ widgetId: string; placement: GridPlacementV1 }>) => {
      if (updates.length === 0) {
        return;
      }
      const next = patchWidgetBoardWidgetsPlacements(block, updates);
      updateBlock(block.id, { widgets: next.widgets }, { recordUndo: false });
    },
    [block, updateBlock],
  );

  const onSelectWidget = useCallback(
    (widgetId: string, modifiers: DashboardWidgetSelectionModifiers = {}) => {
      const next = dashboardWidgetSelectionAfterClick(
        selectedWidgetIds,
        widgetId,
        modifiers,
      );
      setWidgetSelection(next);
    },
    [selectedWidgetIds, setWidgetSelection],
  );

  const onDeselectWidgets = useCallback(() => {
    clearWidgetSelection();
    setAddMenu(null);
  }, [clearWidgetSelection]);

  const onEditCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isGridResizing || isGridDragging || isMarqueeSelecting) {
        return;
      }
      if (isCourseWidgetBoardEditChromeTarget(event.target)) {
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
        validIds: selectableWidgetIds,
        captureElement: event.currentTarget,
        collectMarqueeIds: courseWidgetBoardMarqueeCollectIds,
        onPreview: setMarqueeRect,
        onActive: () => setIsMarqueeSelecting(true),
        onEnd: () => {
          setIsMarqueeSelecting(false);
          setMarqueeRect(null);
        },
        onClickWithoutDrag: onDeselectWidgets,
        onCommit: (ids, commitModifiers) => {
          const current = useCourseWidgetBoardEditorStore.getState().selectedWidgetIds;
          const next = dashboardWidgetSelectionAfterMarquee(current, ids, commitModifiers);
          setWidgetSelection(next);
        },
      });
    },
    [
      isGridDragging,
      isGridResizing,
      isMarqueeSelecting,
      onDeselectWidgets,
      selectableWidgetIds,
      setWidgetSelection,
    ],
  );

  const onWidgetPointerDown = useCallback(
    (widgetId: string, event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || isGridResizing) {
        return;
      }
      event.stopPropagation();
      setActiveEditorType("widget-board");
      setAddMenu(null);
      const pointerModifiers: DashboardWidgetSelectionModifiers = {
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      };

      const widget = block.widgets.find((entry) => entry.id === widgetId);
      if (widget == null) {
        return;
      }
      const placement = effectivePlacement(widgetId, widget.placement);

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
          const current = useCourseWidgetBoardEditorStore.getState().selectedWidgetIds;
          if (
            !dashboardSelectionIsAdditive(pointerModifiers) &&
            current.includes(widgetId)
          ) {
            return;
          }
          onSelectWidget(widgetId, pointerModifiers);
        },
        onDragActive: () => {
          const selected =
            useCourseWidgetBoardEditorStore.getState().selectedWidgetIds;
          let entries = resolveWidgetBoardSelectionMoveEntries(block.widgets, selected);
          if (!selected.includes(widgetId)) {
            entries = [
              {
                sourceNodeId: widgetId,
                placement,
                groupParentId: null,
              },
            ];
          } else if (entries.length === 0) {
            entries = [
              {
                sourceNodeId: widgetId,
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
            setPreviewByWidgetId((prev) => ({
              ...prev,
              [widgetId]: { ...placement, row, column },
            }));
            return;
          }
          const movePreview = previewDashboardMultiGridMove({
            entries,
            anchorSourceNodeId: widgetId,
            anchorTargetRow: row,
            anchorTargetColumn: column,
          });
          setPreviewByWidgetId((prev) => {
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
              commitWidgetPlacement(widgetId, { ...placement, row, column }, false);
            }
            return;
          }
          const movePreview = previewDashboardMultiGridMove({
            entries,
            anchorSourceNodeId: widgetId,
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
                widgetId: entry.sourceNodeId,
                placement: {
                  ...entry.placement,
                  row: nextCell.row,
                  column: nextCell.column,
                },
              };
            })
            .filter((update): update is NonNullable<typeof update> => update != null);
          commitWidgetPlacements(updates);
        },
        onDragEnd: () => {
          dragMoveEntriesRef.current = null;
          setIsGridDragging(false);
          clearPreview();
        },
      });
    },
    [
      block.widgets,
      clearPreview,
      commitWidgetPlacement,
      commitWidgetPlacements,
      effectivePlacement,
      isGridResizing,
      metrics,
      onSelectWidget,
      pushPageUndoSnapshot,
      setActiveEditorType,
    ],
  );

  const onEmptySlotClick = useCallback((column: number, row: number, anchor: HTMLElement) => {
    clearWidgetSelection();
    setAddMenu({ column, row, anchorRect: anchor.getBoundingClientRect() });
  }, [clearWidgetSelection]);

  const onAddWidgetAtMenu = useCallback(
    (kind: WidgetBoardWidgetKind) => {
      if (addMenu == null) {
        return;
      }
      const placement = findPlacementAtAnchor(
        addMenu.column,
        addMenu.row,
        kind,
        block.widgets,
        grid.columns,
      );
      setAddMenu(null);
      pushPageUndoSnapshot();
      const entry = createWidgetBoardEntryAtPlacement(kind, placement, block.widgets);
      updateBlock(block.id, { widgets: [...block.widgets, entry] });
      setWidgetSelection([entry.id]);
    },
    [addMenu, block, grid.columns, pushPageUndoSnapshot, setWidgetSelection, updateBlock],
  );

  const selectionMoveEntries = useMemo(
    () => resolveWidgetBoardSelectionMoveEntries(block.widgets, selectedWidgetIds),
    [block.widgets, selectedWidgetIds],
  );

  const multiResizeContext = useMemo(
    () => resolveWidgetBoardMultiResizeContext(selectionMoveEntries),
    [selectionMoveEntries],
  );

  const selectedWidget =
    block.widgets.find((widget) => widget.id === selectedWidgetId) ?? null;
  const selectedPlacement =
    selectedWidget != null
      ? effectivePlacement(selectedWidget.id, selectedWidget.placement)
      : null;
  const showSingleResizeFrame =
    selectedWidgetIds.length === 1 &&
    selectedWidget != null &&
    selectedPlacement != null &&
    !isGridDragging;
  const showMultiSelectFrame =
    selectedWidgetIds.length > 1 && !isGridDragging && !isGridResizing;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isGridDragging || isGridResizing || isMarqueeSelecting) {
        return;
      }
      if (selectedWidgetIds.length === 0) {
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
        onDeselectWidgets();
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
      if (selectedWidgetIds.length === 1 && selectedPlacement != null && selectedWidgetId != null) {
        const next = nudgeWidgetBoardGridPlacement({
          placement: selectedPlacement,
          direction,
          widgets: block.widgets,
          selectedIds: selectedWidgetIdSet,
          placementFor: effectivePlacement,
          gridColumns: grid.columns,
        });
        if (next == null) {
          return;
        }
        commitWidgetPlacement(selectedWidgetId, next, false);
        return;
      }
      const updates = nudgeWidgetBoardMultiGridMove({
        entries: selectionMoveEntries,
        direction,
        widgets: block.widgets,
        placementFor: effectivePlacement,
        gridColumns: grid.columns,
      });
      if (updates == null) {
        return;
      }
      commitWidgetPlacements(updates);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    block.widgets,
    commitWidgetPlacement,
    commitWidgetPlacements,
    effectivePlacement,
    grid.columns,
    isGridDragging,
    isGridResizing,
    isMarqueeSelecting,
    onDeselectWidgets,
    pushPageUndoSnapshot,
    selectedPlacement,
    selectedWidgetId,
    selectedWidgetIdSet,
    selectedWidgetIds.length,
    selectionMoveEntries,
  ]);

  const showMeta =
    appearance?.showMetaLine !== false &&
    appearance?.metaLine != null &&
    appearance.metaLine.trim().length > 0;
  const showCaption =
    appearance?.showCaption !== false &&
    appearance?.caption != null &&
    appearance.caption.trim().length > 0;

  return (
    <div
      className="course-widget-board-shell course-widget-board-shell--editor mx-auto w-full max-w-xl"
      data-course-widget-board=""
      data-course-wb-theme={appearance?.themePresetId ?? "ev-compact"}
      style={themeStyle}
      onPointerDown={() => {
        setActiveEditorType("widget-board");
        setAddMenu(null);
      }}
    >
      {showMeta ? (
        <p className="shrink-0 px-4 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--course-wb-meta-text)]">
          {appearance?.metaLine}
        </p>
      ) : null}
      <div
        ref={canvasRef}
        className="course-widget-board-editor-canvas relative min-h-0 px-2 pb-2 pt-1"
      >
        <div
          ref={gridRef}
          className="course-widget-board-grid course-widget-board-grid--editor relative z-[1]"
          style={editorGridStyle}
          onPointerDown={onEditCanvasPointerDown}
        >
          <CourseWidgetBoardGuideCells
            columns={grid.columns}
            visibleRows={visibleRows}
            occupiedKeys={occupiedKeys}
          />
          {emptySlots.map((slot) => (
            <CourseWidgetBoardEmptySlot
              key={`empty-${slot.column}-${slot.row}`}
              column={slot.column}
              row={slot.row}
              onClick={onEmptySlotClick}
            />
          ))}
          {block.widgets.map((widget) => (
            <CourseWidgetBoardInnerCell
              key={widget.id}
              widget={{
                ...widget,
                placement: effectivePlacement(widget.id, widget.placement),
              }}
              gridColumns={grid.columns}
              selected={selectedWidgetIdSet.has(widget.id)}
              previewing={previewByWidgetId[widget.id] != null}
              dragging={isGridDragging && selectedWidgetIdSet.has(widget.id)}
              staleMs={staleMs}
              cellRef={selectedWidgetId === widget.id ? selectedCellRef : undefined}
              onWidgetPointerDown={onWidgetPointerDown}
            />
          ))}
        </div>
        {showMultiSelectFrame ? (
          <DashboardMultiGridResizeFrame
            sourceNodeIds={selectedWidgetIds}
            selectionCount={selectedWidgetIds.length}
            overlayRootRef={overlayRootRef}
            flatFrame
            resizeEnabled={multiResizeContext != null}
            unionPlacement={multiResizeContext?.unionPlacement ?? null}
            metrics={metrics}
            gridElement={gridRef.current}
            resolveTargetElement={resolveCourseWidgetBoardTargetElement}
            onPreviewUnion={(nextUnion) => {
              if (multiResizeContext == null) {
                return;
              }
              setPreviewByWidgetId(
                previewWidgetBoardMultiGridResize({
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
              const updates = widgetBoardMultiGridResizeUpdates({
                entries: multiResizeContext.entries,
                baseUnion: multiResizeContext.unionPlacement,
                nextUnion,
              });
              commitWidgetPlacements(updates);
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
        {showSingleResizeFrame && selectedWidget != null && selectedPlacement != null ? (
          <CourseWidgetBoardResizeFrame
            targetRef={selectedCellRef}
            basePlacement={selectedPlacement}
            metrics={metrics}
            gridElement={gridRef.current}
            scrollRootRef={scrollRootRef}
            onPreviewPlacement={(next) =>
              setPreviewByWidgetId((prev) => ({ ...prev, [selectedWidget.id]: next }))
            }
            onCommitPlacement={(next) =>
              commitWidgetPlacement(selectedWidget.id, next, false)
            }
            onClearPreview={() => clearPreview(selectedWidget.id)}
            onDragStart={() => {
              setIsGridResizing(true);
              pushPageUndoSnapshot();
            }}
            onDragEnd={() => setIsGridResizing(false)}
          />
        ) : null}
        {marqueeRect != null ? (
          <DashboardMarqueeOverlay rect={marqueeRect} overlayRootRef={overlayRootRef} />
        ) : null}
      </div>
      {showCaption ? (
        <p className="shrink-0 px-4 pb-4 pt-1 text-[10px] leading-snug text-[var(--course-wb-caption-text)]">
          {appearance?.caption?.trim()}
        </p>
      ) : null}
      {addMenu != null ? (
        <CourseWidgetBoardAddWidgetMenu
          anchorRect={addMenu.anchorRect}
          onPick={onAddWidgetAtMenu}
          onDismiss={() => setAddMenu(null)}
        />
      ) : null}
    </div>
  );
}
