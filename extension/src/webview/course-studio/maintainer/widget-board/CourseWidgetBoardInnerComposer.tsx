import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { startDashboardGridDragSession } from "../../../sensor-studio/core/dashboard/dashboard-grid-drag-move";
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
import { CourseWidgetBoardAddWidgetMenu } from "./CourseWidgetBoardAddWidgetMenu";
import { CourseWidgetBoardEmptySlot } from "./CourseWidgetBoardEmptySlot";
import { CourseWidgetBoardGuideCells } from "./CourseWidgetBoardGuideCells";
import { CourseWidgetBoardInnerCell } from "./CourseWidgetBoardInnerCell";
import { CourseWidgetBoardResizeFrame } from "./CourseWidgetBoardResizeFrame";
import {
  createWidgetBoardEntryAtPlacement,
  findPlacementAtAnchor,
  occupiedWidgetPlacementKeys,
  patchWidgetBoardWidget,
  widgetBoardGridToDashboardMetrics,
  widgetBoardVisibleRows,
} from "./widgetBoardEditorOps";
import { useCourseWidgetBoardEditorStore } from "./useCourseWidgetBoardEditorStore";

type AddMenuState = {
  column: number;
  row: number;
  anchorRect: DOMRect;
};

export function CourseWidgetBoardInnerComposer({
  block,
  staleMs,
}: {
  block: Extract<PageBlockV1, { kind: "widget-board" }>;
  staleMs?: number;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const selectedCellRef = useRef<HTMLDivElement>(null);
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const pushPageUndoSnapshot = useCoursePageEditorStore((s) => s.pushPageUndoSnapshot);
  const selectedWidgetId = useCourseWidgetBoardEditorStore((s) => s.selectedWidgetId);
  const selectWidget = useCourseWidgetBoardEditorStore((s) => s.selectWidget);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);

  const [previewByWidgetId, setPreviewByWidgetId] = useState<Record<string, GridPlacementV1>>({});
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [isGridResizing, setIsGridResizing] = useState(false);
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
  }, []);

  useLayoutEffect(() => {
    const cell = selectedCellRef.current;
    if (selectedWidgetId == null || cell == null) {
      return;
    }
    cell.focus({ preventScroll: true });
  }, [selectedWidgetId]);

  const effectivePlacement = (widgetId: string, placement: GridPlacementV1) =>
    previewByWidgetId[widgetId] ?? placement;

  const clearPreview = useCallback((widgetId: string) => {
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

  const onWidgetPointerDown = useCallback(
    (widgetId: string, event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || isGridResizing) {
        return;
      }
      event.stopPropagation();
      setActiveEditorType("widget-board");
      setAddMenu(null);
      selectWidget(widgetId);
      (event.currentTarget as HTMLElement).focus({ preventScroll: true });

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
        onSelect: () => selectWidget(widgetId),
        onDragActive: () => {
          setIsGridDragging(true);
          pushPageUndoSnapshot();
        },
        onPreview: (row, column) =>
          setPreviewByWidgetId((prev) => ({
            ...prev,
            [widgetId]: { ...placement, row, column },
          })),
        onCommit: (row, column) => {
          if (row !== placement.row || column !== placement.column) {
            commitWidgetPlacement(widgetId, { ...placement, row, column }, false);
          }
        },
        onDragEnd: () => {
          setIsGridDragging(false);
          clearPreview(widgetId);
        },
      });
    },
    [
      block.widgets,
      clearPreview,
      commitWidgetPlacement,
      isGridResizing,
      metrics,
      pushPageUndoSnapshot,
      selectWidget,
      setActiveEditorType,
    ],
  );

  const onEmptySlotClick = useCallback((column: number, row: number, anchor: HTMLElement) => {
    selectWidget(null);
    setAddMenu({ column, row, anchorRect: anchor.getBoundingClientRect() });
  }, [selectWidget]);

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
      selectWidget(entry.id);
    },
    [addMenu, block, grid.columns, pushPageUndoSnapshot, selectWidget, updateBlock],
  );

  const selectedWidget =
    block.widgets.find((widget) => widget.id === selectedWidgetId) ?? null;
  const selectedPlacement =
    selectedWidget != null
      ? effectivePlacement(selectedWidget.id, selectedWidget.placement)
      : null;
  const showResizeFrame =
    selectedWidget != null && selectedPlacement != null && !isGridDragging;

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
        selectWidget(null);
      }}
    >
      {showMeta ? (
        <p className="shrink-0 px-4 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--course-wb-meta-text)]">
          {appearance?.metaLine}
        </p>
      ) : null}
      <div className="course-widget-board-editor-canvas relative min-h-0 px-2 pb-2 pt-1">
        <div
          ref={gridRef}
          className="course-widget-board-grid course-widget-board-grid--editor relative z-[1]"
          style={editorGridStyle}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveEditorType("widget-board");
              setAddMenu(null);
              selectWidget(null);
            }
          }}
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
              selected={selectedWidgetId === widget.id}
              previewing={previewByWidgetId[widget.id] != null}
              dragging={isGridDragging && selectedWidgetId === widget.id}
              staleMs={staleMs}
              cellRef={selectedWidgetId === widget.id ? selectedCellRef : undefined}
              onWidgetPointerDown={onWidgetPointerDown}
            />
          ))}
        </div>
        {showResizeFrame && selectedWidget != null && selectedPlacement != null ? (
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
