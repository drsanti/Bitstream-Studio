import { LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { startDashboardGridDragSession } from "../../core/dashboard/dashboard-grid-drag-move";
import { isDashboardEditChromeTarget } from "../../core/dashboard/dashboard-edit-hit-test";
import {
  startDashboardMarqueeSelectSession,
  type DashboardMarqueeRect,
} from "../../core/dashboard/dashboard-marquee-select";
import { startDashboardViewportPanSession } from "../../core/dashboard/dashboard-viewport-pan";
import {
  dashboardSelectionIsAdditive,
  dashboardWidgetSelectionAfterClick,
  dashboardWidgetSelectionAfterMarquee,
  type DashboardWidgetSelectionModifiers,
} from "../../core/dashboard/dashboard-widget-selection";
import type { DashboardGridMetricsV1 } from "../../core/dashboard/dashboard-grid-resize";
import { dashboardSquareGridCssStyle } from "../../core/dashboard/dashboard-square-grid";
import {
  dashboardEditorVisibleRows,
  dashboardMultiGridResizeUpdates,
  dashboardOccupiedPlacementKeys,
  dashboardPlacementsFromItems,
  nudgeDashboardGridPlacement,
  dashboardPlacementsInGridSpace,
  nudgeDashboardMultiGridMove,
  previewDashboardMultiGridMove,
  previewDashboardMultiGridResize,
  resolveDashboardItemPlacement,
  resolveDashboardMultiResizeContext,
  resolveDashboardMultiResizeGridColumns,
  resolveDashboardSelectionMoveEntries,
  type DashboardGridMoveEntry,
  type DashboardGridNudgeDirection,
} from "../../core/dashboard/dashboard-grid-editor-ops";
import { FLOW_CANVAS_DELETE_KEY_CODES } from "../editor/keyboard/flow-canvas-delete-keys";
import type { DashboardPlacementV1 } from "../../core/dashboard/dashboard-placement";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import {
  dashboardFlexCssAlignItems,
  dashboardFlexCssJustifyContent,
} from "../../core/dashboard/dashboard-layout";
import { dashboardThemeCssVars } from "../../core/dashboard/dashboard-theme";
import type { DashboardSnapshotItemV1 } from "../../core/dashboard/dashboard-snapshot";
import { useDashboardSceneStore } from "../../state/dashboard-scene.store";
import { useStudioWorkbenchFocusStore } from "../../state/studio-workbench-focus.store";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { runDashboardDemoTemplate } from "./dashboard-viewport-helpers";
import { dashboardSnapshotHasDisplayItems } from "../../core/dashboard/dashboard-display-items";
import {
  readDashboardActiveTabSourceNodeId,
  readDashboardHighlightedWidgetSourceNodeIds,
  writeDashboardActiveTabSourceNodeId,
  writeDashboardDisplayTarget,
  writeDashboardEditModeEnabled,
  writeDashboardHighlightedWidgetSourceNodeIds,
  type DashboardDisplayTarget,
} from "./dashboard-viewport-ui-persistence";
import { DashboardAddWidgetMenu } from "./DashboardAddWidgetMenu";
import { DashboardMarqueeOverlay } from "./DashboardMarqueeOverlay";
import { DashboardMultiGridResizeFrame } from "./DashboardMultiGridResizeFrame";
import { DashboardGroupCell } from "./DashboardGroupCell";
import { DashboardTabBar } from "./DashboardTabBar";
import { DashboardGridEmptySlot } from "./DashboardGridEmptySlot";
import { DashboardGridResizeFrame } from "./DashboardGridResizeFrame";
import { DashboardViewportToolbar } from "./DashboardViewportToolbar";
import { DashboardWidgetCell } from "./DashboardWidgetCell";
import type { DashboardWidgetCatalogId } from "./dashboard-widget-palette";

type DashboardAddMenuState = {
  column: number;
  row: number;
  anchorRect: DOMRect;
};

type DashboardViewportPan = {
  x: number;
  y: number;
};

function isDashboardTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function shouldStartDashboardViewportPan(
  event: PointerEvent<HTMLElement>,
  spacePanHeld: boolean,
): boolean {
  return (
    event.button === 1 ||
    event.button === 2 ||
    (event.button === 0 && (event.altKey || spacePanHeld))
  );
}

/**
 * Full-bleed Dashboard pane — 2D operator HMI (Node-RED Dashboard parity).
 * Committed layout comes from **Dashboard Output** via {@link evaluateDashboardSnapshot}.
 */
export function DashboardViewport() {
  const snapshot = useDashboardSceneStore((s) => s.snapshot);
  const highlightedWidgetSourceNodeIds = useDashboardSceneStore(
    (s) => s.highlightedWidgetSourceNodeIds,
  );
  const highlightedWidgetSourceNodeId = useDashboardSceneStore(
    (s) => s.highlightedWidgetSourceNodeId,
  );
  const setHighlightedWidgetSelection = useDashboardSceneStore(
    (s) => s.setHighlightedWidgetSelection,
  );
  const setHighlightedWidgetSourceNodeId = useDashboardSceneStore(
    (s) => s.setHighlightedWidgetSourceNodeId,
  );
  const activeTabSourceNodeId = useDashboardSceneStore((s) => s.activeTabSourceNodeId);
  const setActiveTabSourceNodeId = useDashboardSceneStore((s) => s.setActiveTabSourceNodeId);

  const dispatchDashboardWidgetEvent = useFlowEditorStore((s) => s.dispatchDashboardWidgetEvent);
  const dispatchDashboardKnobValue = useFlowEditorStore((s) => s.dispatchDashboardKnobValue);
  const dispatchDashboardSwitchValue = useFlowEditorStore((s) => s.dispatchDashboardSwitchValue);
  const dispatchDashboardSelectValue = useFlowEditorStore((s) => s.dispatchDashboardSelectValue);
  const moveDashboardWidgetToGridCell = useFlowEditorStore((s) => s.moveDashboardWidgetToGridCell);
  const moveDashboardWidgetsGridPlacements = useFlowEditorStore(
    (s) => s.moveDashboardWidgetsGridPlacements,
  );
  const deleteDashboardWidgetsBySourceIds = useFlowEditorStore(
    (s) => s.deleteDashboardWidgetsBySourceIds,
  );
  const arrangeDashboardWidgetsStacked = useFlowEditorStore((s) => s.arrangeDashboardWidgetsStacked);
  const setDashboardWidgetGridPlacement = useFlowEditorStore(
    (s) => s.setDashboardWidgetGridPlacement,
  );
  const addDashboardWidgetAtGridCell = useFlowEditorStore((s) => s.addDashboardWidgetAtGridCell);
  const onSelectionChange = useFlowEditorStore((s) => s.onSelectionChange);

  const editMode = useDashboardSceneStore((s) => s.editModeEnabled);
  const setEditModeEnabled = useDashboardSceneStore((s) => s.setEditModeEnabled);
  const displayTarget = useDashboardSceneStore((s) => s.displayTarget);
  const setDisplayTarget = useDashboardSceneStore((s) => s.setDisplayTarget);
  const setActiveEditorType = useStudioWorkbenchFocusStore((s) => s.setActiveEditorType);
  const activeEditorType = useStudioWorkbenchFocusStore((s) => s.activeEditorType);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null);
  const onGridRef = useCallback((node: HTMLDivElement | null) => {
    setGridElement(node);
  }, []);
  const [resizePreview, setResizePreview] = useState<Record<
    string,
    DashboardPlacementV1
  > | null>(null);
  const [isGridResizing, setIsGridResizing] = useState(false);
  const [movePreview, setMovePreview] = useState<Record<
    string,
    { row: number; column: number }
  > | null>(null);
  const dragMoveEntriesRef = useRef<DashboardGridMoveEntry[] | null>(null);
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [isGridPanning, setIsGridPanning] = useState(false);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<DashboardMarqueeRect | null>(null);
  const [viewportPan, setViewportPan] = useState<DashboardViewportPan>({ x: 0, y: 0 });
  const viewportPanRef = useRef(viewportPan);
  viewportPanRef.current = viewportPan;
  const spacePanHeldRef = useRef(false);
  const altPanHeldRef = useRef(false);
  const [panModeArmed, setPanModeArmed] = useState(false);
  const [addMenu, setAddMenu] = useState<DashboardAddMenuState | null>(null);
  /** When false, user cleared selection — do not auto-restore highlight in edit mode. */
  const restoreDashboardHighlightOnEditEnterRef = useRef(true);

  const syncPanModeArmed = useCallback(() => {
    setPanModeArmed(spacePanHeldRef.current || altPanHeldRef.current);
  }, []);

  const hasDashboardOutput = snapshot.dashboardOutputNodeId != null;
  const tabs = snapshot.tabs;
  const tabsActive = tabs.length > 0;
  const enabledTabs = useMemo(() => tabs.filter((tab) => tab.enabled), [tabs]);
  const displayItems = useMemo(() => {
    if (!tabsActive) {
      return snapshot.items;
    }
    const active =
      enabledTabs.find((tab) => tab.sourceNodeId === activeTabSourceNodeId) ?? enabledTabs[0];
    return active?.items ?? [];
  }, [activeTabSourceNodeId, enabledTabs, snapshot.items, tabsActive]);
  const hasItems = tabsActive
    ? enabledTabs.some((tab) => tab.items.length > 0)
    : snapshot.items.length > 0;
  const layoutMode = snapshot.layout.mode;
  const showGridEditor = editMode && layoutMode === "grid";
  const gridColumns = snapshot.layout.grid.columns;

  const editorPlacements = useMemo(
    () => dashboardPlacementsFromItems(displayItems),
    [displayItems],
  );

  const visibleGridRows = useMemo(
    () => dashboardEditorVisibleRows(editorPlacements),
    [editorPlacements],
  );

  const occupiedGridKeys = useMemo(
    () => dashboardOccupiedPlacementKeys(editorPlacements),
    [editorPlacements],
  );

  const selectableWidgetIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of displayItems) {
      if (item.kind === "group") {
        ids.add(item.group.sourceNodeId);
        for (const child of item.group.children) {
          ids.add(child.sourceNodeId);
        }
      } else {
        ids.add(item.widget.sourceNodeId);
      }
    }
    return ids;
  }, [displayItems]);

  const highlightedWidgetIdSet = useMemo(
    () => new Set(highlightedWidgetSourceNodeIds),
    [highlightedWidgetSourceNodeIds],
  );

  const emptyGridSlots = useMemo(() => {
    if (!showGridEditor) {
      return [];
    }
    const slots: { column: number; row: number }[] = [];
    for (let row = 1; row <= visibleGridRows; row += 1) {
      for (let column = 1; column <= gridColumns; column += 1) {
        if (!occupiedGridKeys.has(`${row}:${column}`)) {
          slots.push({ column, row });
        }
      }
    }
    return slots;
  }, [gridColumns, occupiedGridKeys, showGridEditor, visibleGridRows]);

  const wireTargetTabNodeId = useMemo(() => {
    if (!tabsActive) {
      return null;
    }
    return activeTabSourceNodeId ?? enabledTabs[0]?.sourceNodeId ?? null;
  }, [activeTabSourceNodeId, enabledTabs, tabsActive]);

  useEffect(() => {
    if (!editMode) {
      restoreDashboardHighlightOnEditEnterRef.current = true;
      return;
    }
    if (layoutMode !== "grid" || displayItems.length === 0) {
      return;
    }
    if (highlightedWidgetSourceNodeIds.length > 0) {
      return;
    }
    if (!restoreDashboardHighlightOnEditEnterRef.current) {
      return;
    }
    restoreDashboardHighlightOnEditEnterRef.current = false;

    const persisted = readDashboardHighlightedWidgetSourceNodeIds();
    if (persisted.length === 0) {
      return;
    }
    const validPersisted = persisted.filter((id) => selectableWidgetIds.has(id));
    if (validPersisted.length === 0) {
      return;
    }
    setHighlightedWidgetSelection(validPersisted);
    onSelectionChange(validPersisted);
  }, [
    displayItems,
    editMode,
    highlightedWidgetSourceNodeIds.length,
    layoutMode,
    onSelectionChange,
    selectableWidgetIds,
    setHighlightedWidgetSelection,
  ]);

  useEffect(() => {
    if (!editMode) {
      writeDashboardHighlightedWidgetSourceNodeIds([]);
      return;
    }
    writeDashboardHighlightedWidgetSourceNodeIds(highlightedWidgetSourceNodeIds);
  }, [editMode, highlightedWidgetSourceNodeIds]);

  useEffect(() => {
    if (!editMode) {
      setViewportPan({ x: 0, y: 0 });
      spacePanHeldRef.current = false;
      altPanHeldRef.current = false;
      setPanModeArmed(false);
    }
  }, [editMode]);

  useEffect(() => {
    if (!editMode || layoutMode !== "grid" || activeEditorType !== "dashboard") {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        altPanHeldRef.current = true;
        syncPanModeArmed();
        return;
      }
      if (event.code !== "Space" || event.repeat) {
        return;
      }
      if (isDashboardTypingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      spacePanHeldRef.current = true;
      syncPanModeArmed();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        altPanHeldRef.current = false;
        syncPanModeArmed();
        return;
      }
      if (event.code !== "Space") {
        return;
      }
      spacePanHeldRef.current = false;
      syncPanModeArmed();
    };
    const onBlur = () => {
      spacePanHeldRef.current = false;
      altPanHeldRef.current = false;
      syncPanModeArmed();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [activeEditorType, editMode, layoutMode, syncPanModeArmed]);

  useEffect(() => {
    if (!tabsActive) {
      setActiveTabSourceNodeId(null);
      return;
    }
    const persisted = readDashboardActiveTabSourceNodeId();
    const validPersisted = enabledTabs.find((tab) => tab.sourceNodeId === persisted);
    const nextId = validPersisted?.sourceNodeId ?? enabledTabs[0]?.sourceNodeId ?? null;
    setActiveTabSourceNodeId(nextId);
  }, [enabledTabs, setActiveTabSourceNodeId, tabsActive, tabs.map((t) => t.sourceNodeId).join("|")]);
  const themeStyle = useMemo(
    () => dashboardThemeCssVars(snapshot.theme),
    [snapshot.theme],
  );

  const gridMetrics = useMemo((): DashboardGridMetricsV1 => {
    const { grid } = snapshot.layout;
    return {
      columns: grid.columns,
      gapPx: grid.gapPx,
      paddingPx: grid.paddingPx,
      rowHeightPx: grid.rowHeightPx,
    };
  }, [snapshot.layout]);

  const onEditModeChange = useCallback((next: boolean) => {
    setEditModeEnabled(next);
    writeDashboardEditModeEnabled(next);
    if (!next) {
      setHighlightedWidgetSourceNodeId(null);
      setResizePreview(null);
      setIsGridResizing(false);
      setMovePreview(null);
      setIsGridDragging(false);
    }
  }, [setEditModeEnabled, setHighlightedWidgetSourceNodeId]);

  const onDisplayTargetChange = useCallback(
    (target: DashboardDisplayTarget) => {
      setDisplayTarget(target);
      writeDashboardDisplayTarget(target);
    },
    [setDisplayTarget],
  );

  const onDashboardPaneFocus = useCallback(() => {
    setActiveEditorType("dashboard");
  }, [setActiveEditorType]);

  const resizeBasePlacement = useMemo((): DashboardPlacementV1 | null => {
    if (highlightedWidgetSourceNodeId == null) {
      return null;
    }
    for (const item of displayItems) {
      const sourceNodeId =
        item.kind === "group" ? item.group.sourceNodeId : item.widget.sourceNodeId;
      if (sourceNodeId !== highlightedWidgetSourceNodeId) {
        continue;
      }
      const base = resolveDashboardItemPlacement(item);
      const previewCell = movePreview?.[highlightedWidgetSourceNodeId];
      if (previewCell != null) {
        return {
          ...base,
          row: previewCell.row,
          column: previewCell.column,
        };
      }
      return base;
    }
    return null;
  }, [displayItems, highlightedWidgetSourceNodeId, movePreview]);

  const selectedEditTarget = useMemo(() => {
    if (highlightedWidgetSourceNodeId == null) {
      return null;
    }
    for (const item of displayItems) {
      if (item.kind === "group" && item.group.sourceNodeId === highlightedWidgetSourceNodeId) {
        return {
          kind: "group" as const,
          label: item.group.label,
          sourceNodeId: item.group.sourceNodeId,
        };
      }
      if (item.kind === "widget" && item.widget.sourceNodeId === highlightedWidgetSourceNodeId) {
        return {
          kind: "widget" as const,
          label: item.widget.label,
          sourceNodeId: item.widget.sourceNodeId,
        };
      }
    }
    return null;
  }, [displayItems, highlightedWidgetSourceNodeId]);

  const showGridResizeFrame =
    editMode &&
    layoutMode === "grid" &&
    highlightedWidgetSourceNodeIds.length === 1 &&
    highlightedWidgetSourceNodeId != null &&
    resizeBasePlacement != null &&
    selectedEditTarget != null;

  const showMultiSelectFrame =
    editMode &&
    layoutMode === "grid" &&
    highlightedWidgetSourceNodeIds.length > 1 &&
    !isGridDragging &&
    !isGridResizing;

  const applyWidgetSelection = useCallback(
    (ids: string[]) => {
      restoreDashboardHighlightOnEditEnterRef.current = false;
      setAddMenu(null);
      setHighlightedWidgetSelection(ids);
      onSelectionChange(ids);
    },
    [onSelectionChange, setHighlightedWidgetSelection],
  );

  const onDeselectWidget = useCallback(() => {
    restoreDashboardHighlightOnEditEnterRef.current = false;
    writeDashboardHighlightedWidgetSourceNodeIds([]);
    setActiveEditorType("dashboard");
    setHighlightedWidgetSelection([]);
    onSelectionChange([]);
    setResizePreview(null);
    setMovePreview(null);
    setAddMenu(null);
  }, [onSelectionChange, setActiveEditorType, setHighlightedWidgetSelection]);

  const onEmptyGridSlotClick = useCallback(
    (column: number, row: number, anchor: HTMLElement) => {
      setAddMenu({ column, row, anchorRect: anchor.getBoundingClientRect() });
    },
    [],
  );

  const onAddWidgetFromMenu = useCallback(
    (catalogNodeId: DashboardWidgetCatalogId) => {
      if (addMenu == null) {
        return;
      }
      const newNodeId = addDashboardWidgetAtGridCell({
        catalogNodeId,
        column: addMenu.column,
        row: addMenu.row,
        tabTargetNodeId: wireTargetTabNodeId,
        existingPlacements: editorPlacements,
        gridColumns,
      });
      setAddMenu(null);
      if (newNodeId != null) {
        applyWidgetSelection([newNodeId]);
      }
    },
    [
      addDashboardWidgetAtGridCell,
      addMenu,
      applyWidgetSelection,
      editorPlacements,
      gridColumns,
      wireTargetTabNodeId,
    ],
  );

  const beginViewportPan = useCallback(
    (
      event: PointerEvent<HTMLDivElement>,
      options?: { immediate?: boolean; onClickWithoutDrag?: () => void },
    ) => {
      event.preventDefault();
      const origin = viewportPanRef.current;
      startDashboardViewportPanSession({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originPanX: origin.x,
        originPanY: origin.y,
        immediate: options?.immediate,
        onPan: (offset) => setViewportPan(offset),
        onPanActive: () => setIsGridPanning(true),
        onPanEnd: () => setIsGridPanning(false),
        onClickWithoutDrag: options?.onClickWithoutDrag,
      });
    },
    [],
  );

  const onViewportPanPointerDownCapture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        !editMode ||
        layoutMode !== "grid" ||
        isGridResizing ||
        isGridDragging ||
        isMarqueeSelecting
      ) {
        return;
      }
      if (!shouldStartDashboardViewportPan(event, spacePanHeldRef.current)) {
        return;
      }
      const target = event.target;
      if (target instanceof Element && target.closest(".nodrag")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      beginViewportPan(event, { immediate: event.button !== 0 });
    },
    [beginViewportPan, editMode, isGridDragging, isGridResizing, isMarqueeSelecting, layoutMode],
  );

  const onEditCanvasPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!editMode || isGridResizing || isGridDragging || isGridPanning || isMarqueeSelecting) {
        return;
      }
      if (isDashboardEditChromeTarget(event.target)) {
        return;
      }
      if (layoutMode !== "grid") {
        if (event.button === 0) {
          onDeselectWidget();
        }
        return;
      }
      if (shouldStartDashboardViewportPan(event, spacePanHeldRef.current)) {
        return;
      }
      if (spacePanHeldRef.current || event.altKey || panModeArmed) {
        beginViewportPan(event, { immediate: event.button !== 0 });
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
        gridElement,
        validIds: selectableWidgetIds,
        captureElement: event.currentTarget,
        onPreview: setMarqueeRect,
        onActive: () => setIsMarqueeSelecting(true),
        onEnd: () => {
          setIsMarqueeSelecting(false);
          setMarqueeRect(null);
        },
        onClickWithoutDrag: onDeselectWidget,
        onCommit: (ids, commitModifiers) => {
          const current = useDashboardSceneStore.getState().highlightedWidgetSourceNodeIds;
          const next = dashboardWidgetSelectionAfterMarquee(current, ids, commitModifiers);
          applyWidgetSelection(next);
        },
      });
    },
    [
      applyWidgetSelection,
      editMode,
      gridElement,
      isGridDragging,
      isGridPanning,
      isGridResizing,
      isMarqueeSelecting,
      layoutMode,
      onDeselectWidget,
      panModeArmed,
      selectableWidgetIds,
    ],
  );

  const onDeleteSelectedWidgets = useCallback(() => {
    if (highlightedWidgetSourceNodeIds.length === 0) {
      return;
    }
    deleteDashboardWidgetsBySourceIds(highlightedWidgetSourceNodeIds);
    onDeselectWidget();
  }, [
    deleteDashboardWidgetsBySourceIds,
    highlightedWidgetSourceNodeIds,
    onDeselectWidget,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        FLOW_CANVAS_DELETE_KEY_CODES.includes(
          event.key as (typeof FLOW_CANVAS_DELETE_KEY_CODES)[number],
        )
      ) {
        if (activeEditorType !== "dashboard" || !editMode || layoutMode !== "grid") {
          return;
        }
        if (isGridDragging || isGridResizing || isGridPanning || isMarqueeSelecting) {
          return;
        }
        if (isDashboardTypingTarget(event.target)) {
          return;
        }
        if (highlightedWidgetSourceNodeIds.length === 0) {
          return;
        }
        event.preventDefault();
        onDeleteSelectedWidgets();
        return;
      }
      if (event.key !== "Escape") {
        return;
      }
      if (activeEditorType !== "dashboard") {
        return;
      }
      if (!editMode || layoutMode !== "grid") {
        return;
      }
      if (isGridDragging || isGridResizing || isGridPanning || isMarqueeSelecting) {
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
      if (highlightedWidgetSourceNodeIds.length === 0) {
        return;
      }
      event.preventDefault();
      onDeselectWidget();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeEditorType,
    editMode,
    highlightedWidgetSourceNodeIds.length,
    isGridDragging,
    isGridPanning,
    isGridResizing,
    isMarqueeSelecting,
    layoutMode,
    onDeleteSelectedWidgets,
    onDeselectWidget,
  ]);

  const selectionMoveEntries = useMemo(
    () => resolveDashboardSelectionMoveEntries(displayItems, highlightedWidgetSourceNodeIds),
    [displayItems, highlightedWidgetSourceNodeIds],
  );

  const multiResizeContext = useMemo(
    () => resolveDashboardMultiResizeContext(selectionMoveEntries),
    [selectionMoveEntries],
  );

  const multiResizeMetrics = useMemo((): DashboardGridMetricsV1 => {
    if (multiResizeContext == null) {
      return gridMetrics;
    }
    return {
      ...gridMetrics,
      columns: resolveDashboardMultiResizeGridColumns({
        displayItems,
        groupParentId: multiResizeContext.groupParentId,
        dashboardGridColumns: gridMetrics.columns,
      }),
    };
  }, [displayItems, gridMetrics, multiResizeContext]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!editMode || layoutMode !== "grid") {
        return;
      }
      if (activeEditorType !== "dashboard") {
        return;
      }
      if (isGridDragging || isGridResizing || isGridPanning) {
        return;
      }
      if (highlightedWidgetSourceNodeIds.length === 0) {
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
      event.preventDefault();
      if (highlightedWidgetSourceNodeIds.length === 1 && resizeBasePlacement != null) {
        const otherPlacements = dashboardPlacementsInGridSpace(
          displayItems,
          null,
          new Set(highlightedWidgetSourceNodeIds),
        );
        const next = nudgeDashboardGridPlacement({
          placement: resizeBasePlacement,
          direction,
          gridColumns: gridMetrics.columns,
          otherPlacements,
        });
        if (next == null || highlightedWidgetSourceNodeId == null) {
          return;
        }
        setDashboardWidgetGridPlacement({
          sourceNodeId: highlightedWidgetSourceNodeId,
          placement: next,
        });
        return;
      }
      const updates = nudgeDashboardMultiGridMove({
        entries: selectionMoveEntries,
        direction,
        displayItems,
        gridColumns: gridMetrics.columns,
      });
      if (updates == null) {
        return;
      }
      moveDashboardWidgetsGridPlacements(updates);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeEditorType,
    displayItems,
    editMode,
    gridMetrics.columns,
    highlightedWidgetSourceNodeId,
    highlightedWidgetSourceNodeIds,
    isGridDragging,
    isGridPanning,
    isGridResizing,
    layoutMode,
    moveDashboardWidgetsGridPlacements,
    resizeBasePlacement,
    selectionMoveEntries,
    setDashboardWidgetGridPlacement,
  ]);

  const placementOverrideFor = useCallback(
    (sourceNodeId: string): Partial<DashboardPlacementV1> | undefined => {
      const resizedPlacement = resizePreview?.[sourceNodeId];
      if (resizedPlacement != null) {
        return resizedPlacement;
      }
      const previewCell = movePreview?.[sourceNodeId];
      if (previewCell != null) {
        return {
          row: previewCell.row,
          column: previewCell.column,
        };
      }
      return undefined;
    },
    [movePreview, resizePreview],
  );

  const onButtonClick = useCallback(
    (sourceNodeId: string) => {
      dispatchDashboardWidgetEvent({ sourceNodeId });
    },
    [dispatchDashboardWidgetEvent],
  );

  const onKnobValueChange = useCallback(
    (sourceNodeId: string, value: number) => {
      dispatchDashboardKnobValue({ sourceNodeId, value });
    },
    [dispatchDashboardKnobValue],
  );

  const onSwitchValueChange = useCallback(
    (sourceNodeId: string, value: boolean) => {
      dispatchDashboardSwitchValue({ sourceNodeId, value });
    },
    [dispatchDashboardSwitchValue],
  );

  const onSelectValueChange = useCallback(
    (sourceNodeId: string, value: string) => {
      dispatchDashboardSelectValue({ sourceNodeId, value });
    },
    [dispatchDashboardSelectValue],
  );

  const onSliderValueChange = onKnobValueChange;

  const onSelectWidget = useCallback(
    (sourceNodeId: string, modifiers: DashboardWidgetSelectionModifiers = {}) => {
      const next = dashboardWidgetSelectionAfterClick(
        highlightedWidgetSourceNodeIds,
        sourceNodeId,
        modifiers,
      );
      applyWidgetSelection(next);
    },
    [applyWidgetSelection, highlightedWidgetSourceNodeIds],
  );

  const onGridDragPointerDown = useCallback(
    (
      sourceNodeId: string,
      placement: DashboardPlacementV1,
      event: PointerEvent<HTMLDivElement>,
    ) => {
      if (!editMode || layoutMode !== "grid" || isGridResizing || event.button !== 0) {
        return;
      }
      if (event.altKey || spacePanHeldRef.current) {
        return;
      }
      event.preventDefault();
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
        gridElement,
        metrics: gridMetrics,
        placement,
        onSelect: () => {
          const current = useDashboardSceneStore.getState().highlightedWidgetSourceNodeIds;
          if (
            !dashboardSelectionIsAdditive(pointerModifiers) &&
            current.includes(sourceNodeId)
          ) {
            return;
          }
          onSelectWidget(sourceNodeId, pointerModifiers);
        },
        onDragActive: () => {
          const selected = useDashboardSceneStore.getState().highlightedWidgetSourceNodeIds;
          let entries = resolveDashboardSelectionMoveEntries(displayItems, selected);
          if (!selected.includes(sourceNodeId)) {
            entries = [
              {
                sourceNodeId,
                placement,
                groupParentId: null,
              },
            ];
          } else if (entries.length === 0) {
            entries = [
              {
                sourceNodeId,
                placement,
                groupParentId: null,
              },
            ];
          }
          dragMoveEntriesRef.current = entries;
          setIsGridDragging(true);
        },
        onPreview: (row, column) => {
          const entries = dragMoveEntriesRef.current;
          if (entries == null || entries.length === 0) {
            setMovePreview({ [sourceNodeId]: { row, column } });
            return;
          }
          if (entries.length === 1) {
            setMovePreview({ [sourceNodeId]: { row, column } });
            return;
          }
          setMovePreview(
            previewDashboardMultiGridMove({
              entries,
              anchorSourceNodeId: sourceNodeId,
              anchorTargetRow: row,
              anchorTargetColumn: column,
            }),
          );
        },
        onCommit: (row, column) => {
          const entries = dragMoveEntriesRef.current;
          if (entries == null || entries.length <= 1) {
            if (row !== placement.row || column !== placement.column) {
              moveDashboardWidgetToGridCell({ sourceNodeId, row, column });
            }
            return;
          }
          const preview = previewDashboardMultiGridMove({
            entries,
            anchorSourceNodeId: sourceNodeId,
            anchorTargetRow: row,
            anchorTargetColumn: column,
          });
          const updates = entries
            .map((entry) => {
              const nextCell = preview[entry.sourceNodeId];
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
                sourceNodeId: entry.sourceNodeId,
                placement: {
                  ...entry.placement,
                  row: nextCell.row,
                  column: nextCell.column,
                },
              };
            })
            .filter((update): update is NonNullable<typeof update> => update != null);
          if (updates.length > 0) {
            moveDashboardWidgetsGridPlacements(updates);
          }
        },
        onDragEnd: () => {
          dragMoveEntriesRef.current = null;
          setIsGridDragging(false);
          setMovePreview(null);
        },
      });
    },
    [
      displayItems,
      editMode,
      gridElement,
      gridMetrics,
      isGridResizing,
      layoutMode,
      moveDashboardWidgetToGridCell,
      moveDashboardWidgetsGridPlacements,
      onSelectWidget,
    ],
  );

  const onStackLayout = useCallback(() => {
    arrangeDashboardWidgetsStacked(displayItems);
  }, [arrangeDashboardWidgetsStacked, displayItems]);

  const onActiveTabChange = useCallback(
    (sourceNodeId: string) => {
      setActiveTabSourceNodeId(sourceNodeId);
      writeDashboardActiveTabSourceNodeId(sourceNodeId);
      setHighlightedWidgetSourceNodeId(null);
    },
    [setActiveTabSourceNodeId, setHighlightedWidgetSourceNodeId],
  );

  const layoutStyle = useMemo(() => {
    const { grid, flex } = snapshot.layout;
    if (layoutMode === "flex") {
      return {
        display: "flex" as const,
        flexDirection: flex.direction === "column" ? ("column" as const) : ("row" as const),
        flexWrap: flex.wrap ? ("wrap" as const) : ("nowrap" as const),
        alignItems: dashboardFlexCssAlignItems(flex.alignItems),
        justifyContent: dashboardFlexCssJustifyContent(flex.justifyContent),
        gap: `${flex.gapPx}px`,
        padding: `${flex.paddingPx}px`,
        ["--dashboard-row-height" as string]: `${grid.rowHeightPx}px`,
      };
    }
    return {
      ...dashboardSquareGridCssStyle(gridMetrics),
      ["--dashboard-row-height" as string]: `${grid.rowHeightPx}px`,
    };
  }, [gridMetrics, layoutMode, snapshot.layout]);

  if (!hasDashboardOutput) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center">
        <LayoutGrid className="size-10 text-zinc-600" aria-hidden />
        <p className="max-w-sm text-sm text-zinc-400">
          Add a <span className="font-medium text-zinc-300">Dashboard Output</span> node and wire
          dashboard widgets into its <span className="font-medium text-zinc-300">Widgets</span>{" "}
          socket.
        </p>
        <TRNButton type="button" onClick={runDashboardDemoTemplate}>
          Load dashboard demo
        </TRNButton>
      </div>
    );
  }

  const renderItem = (item: DashboardSnapshotItemV1) => {
    if (item.kind === "group") {
      const groupId = item.group.sourceNodeId;
      const groupHighlighted = highlightedWidgetIdSet.has(groupId);
      return (
        <DashboardGroupCell
          key={groupId}
          group={item.group}
          layoutMode={layoutMode}
          editMode={editMode}
          highlighted={groupHighlighted}
          placementOverride={placementOverrideFor(groupId)}
          onButtonClick={onButtonClick}
          onKnobValueChange={onKnobValueChange}
          onSwitchValueChange={onSwitchValueChange}
          onSelectValueChange={onSelectValueChange}
          onSliderValueChange={onSliderValueChange}
          onSelectWidget={onSelectWidget}
          onSelectGroup={onSelectWidget}
          onGridDragPointerDown={
            editMode && layoutMode === "grid"
              ? (event, placement) => onGridDragPointerDown(groupId, placement, event)
              : undefined
          }
          onWidgetGridDragPointerDown={
            editMode && layoutMode === "grid"
              ? (widgetId, event, placement) =>
                  onGridDragPointerDown(widgetId, placement, event)
              : undefined
          }
          widgetHighlightedIds={highlightedWidgetIdSet}
          isGridDragging={isGridDragging && movePreview?.[groupId] != null}
          isWidgetGridDragging={(widgetId) =>
            isGridDragging && movePreview?.[widgetId] != null
          }
        />
      );
    }
    const widgetId = item.widget.sourceNodeId;
    const widgetHighlighted = highlightedWidgetIdSet.has(widgetId);
    return (
      <DashboardWidgetCell
        key={widgetId}
        widget={item.widget}
        layoutMode={layoutMode}
        editMode={editMode}
        highlighted={widgetHighlighted}
        placementOverride={placementOverrideFor(widgetId)}
        onButtonClick={onButtonClick}
        onKnobValueChange={onKnobValueChange}
        onSwitchValueChange={onSwitchValueChange}
        onSelectValueChange={onSelectValueChange}
        onSliderValueChange={onSliderValueChange}
        onSelectWidget={onSelectWidget}
        onGridDragPointerDown={
          editMode && layoutMode === "grid"
            ? (event, placement) => onGridDragPointerDown(widgetId, placement, event)
            : undefined
        }
        isGridDragging={isGridDragging && movePreview?.[widgetId] != null}
      />
    );
  };

  const dashboardToolbar = (
    <DashboardViewportToolbar
      editMode={editMode}
      displayTarget={displayTarget}
      layoutMode={layoutMode}
      snapshot={snapshot}
      onEditModeChange={onEditModeChange}
      onDisplayTargetChange={onDisplayTargetChange}
      onStackLayout={onStackLayout}
    />
  );

  const previewOnStageHud =
    !editMode && displayTarget === "stage-hud" && dashboardSnapshotHasDisplayItems(snapshot);

  const showEmptyDashboardCanvas = showGridEditor;
  const showEmptyDashboardHint = !hasItems && !showGridEditor && !previewOnStageHud;

  if (showEmptyDashboardHint) {
    return (
      <div className="relative flex h-full min-h-0 flex-col bg-zinc-950">
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-auto px-6 pt-14 text-center scrollbar-hide">
          {dashboardToolbar}
          <LayoutGrid className="size-10 text-zinc-600" aria-hidden />
          <p className="max-w-sm text-sm text-zinc-400">
            Turn on <span className="font-medium text-zinc-300">Edit</span> to click{" "}
            <span className="font-medium text-zinc-300">+</span> on the grid and place widgets, or
            load the demo graph.
          </p>
          <TRNButton type="button" onClick={runDashboardDemoTemplate}>
            Load dashboard demo
          </TRNButton>
        </div>
      </div>
    );
  }

  if (previewOnStageHud) {
    return (
      <div className="relative flex h-full min-h-0 flex-col bg-zinc-950">
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 pt-14 text-center">
          {dashboardToolbar}
          <LayoutGrid className="size-10 text-cyan-500/70" aria-hidden />
          <p className="max-w-sm text-sm text-zinc-300">
            Dashboard preview is on the <span className="font-medium text-zinc-100">Stage</span> as a
            HUD overlay.
          </p>
          <p className="max-w-sm text-[11px] leading-relaxed text-zinc-500">
            Open the Stage pane to interact with widgets. Switch to{" "}
            <span className="text-zinc-400">Dashboard pane</span> in the toolbar to preview here
            instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ ...themeStyle, backgroundColor: "var(--dashboard-canvas-bg, #09090b)" }}
      onPointerDownCapture={onDashboardPaneFocus}
    >
      {tabsActive ? (
        <DashboardTabBar
          tabs={tabs}
          activeTabSourceNodeId={activeTabSourceNodeId}
          onActiveTabChange={onActiveTabChange}
        />
      ) : null}
      {snapshot.layoutWarnings.length > 0 ? (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
          <TRNHintText className="text-amber-200/90">
            {snapshot.layoutWarnings[0]}
            {snapshot.layoutWarnings.length > 1
              ? ` (+${snapshot.layoutWarnings.length - 1} more)`
              : ""}
          </TRNHintText>
        </div>
      ) : null}
      <div
        ref={scrollContainerRef}
        className={`relative min-h-0 flex-1 scrollbar-hide ${
          showGridEditor ? "overflow-hidden" : "overflow-auto"
        } ${
          showGridEditor
            ? isGridPanning
              ? "cursor-grabbing"
              : panModeArmed
                ? "cursor-grab"
                : ""
            : ""
        }`}
        onContextMenu={(event) => {
          if (showGridEditor) {
            event.preventDefault();
          }
        }}
        onPointerDownCapture={onViewportPanPointerDownCapture}
        onPointerDown={onEditCanvasPointerDown}
      >
        {dashboardToolbar}
        <div
          className="relative min-h-full w-full"
          style={{
            transform: showGridEditor
              ? `translate(${viewportPan.x}px, ${viewportPan.y}px)`
              : undefined,
          }}
        >
          <div
            className={
              layoutMode === "grid" ? "relative mx-auto w-max max-w-full" : "relative w-full"
            }
          >
            {showGridEditor && layoutMode === "grid" ? (
              <div
                className="pointer-events-none absolute inset-0 z-0 opacity-55"
                style={dashboardSquareGridCssStyle(gridMetrics)}
                aria-hidden
              >
                {Array.from({ length: gridMetrics.columns * visibleGridRows }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-none border border-dashed border-cyan-500/25 bg-cyan-500/[0.04]"
                  />
                ))}
              </div>
            ) : null}
            <div
              ref={onGridRef}
              className={`relative ${showGridEditor ? "z-[2]" : "z-[1]"}`}
              style={layoutStyle}
            >
              {showGridEditor
                ? emptyGridSlots.map((slot) => (
                    <DashboardGridEmptySlot
                      key={`empty-${slot.column}-${slot.row}`}
                      column={slot.column}
                      row={slot.row}
                      onClick={onEmptyGridSlotClick}
                    />
                  ))
                : null}
              {displayItems.map((item) => renderItem(item))}
            </div>
            {showMultiSelectFrame ? (
              <DashboardMultiGridResizeFrame
                sourceNodeIds={highlightedWidgetSourceNodeIds}
                selectionCount={highlightedWidgetSourceNodeIds.length}
                overlayRootRef={scrollContainerRef}
                resizeEnabled={multiResizeContext != null}
                unionPlacement={multiResizeContext?.unionPlacement ?? null}
                metrics={multiResizeMetrics}
                gridElement={gridElement}
                onPreviewUnion={(nextUnion) => {
                  if (multiResizeContext == null) {
                    return;
                  }
                  setResizePreview(
                    previewDashboardMultiGridResize({
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
                  const updates = dashboardMultiGridResizeUpdates({
                    entries: multiResizeContext.entries,
                    baseUnion: multiResizeContext.unionPlacement,
                    nextUnion,
                  });
                  if (updates.length > 0) {
                    moveDashboardWidgetsGridPlacements(updates);
                  }
                }}
                onClearPreview={() => setResizePreview(null)}
                onDragStart={() => {
                  setMovePreview(null);
                  setIsGridResizing(true);
                }}
                onDragEnd={() => {
                  setIsGridResizing(false);
                  setResizePreview(null);
                }}
              />
            ) : null}
            {showGridResizeFrame &&
            highlightedWidgetSourceNodeId != null &&
            resizeBasePlacement != null ? (
              <DashboardGridResizeFrame
              targetSourceNodeId={highlightedWidgetSourceNodeId}
              selectionLabel={selectedEditTarget.label}
              basePlacement={resizeBasePlacement}
              metrics={gridMetrics}
              gridElement={gridElement}
              overlayRootRef={scrollContainerRef}
              onPreviewPlacement={(placement) => {
                setResizePreview({
                  [highlightedWidgetSourceNodeId]: placement,
                });
              }}
              onCommitPlacement={(placement) => {
                setDashboardWidgetGridPlacement({
                  sourceNodeId: highlightedWidgetSourceNodeId,
                  placement,
                });
              }}
              onClearPreview={() => setResizePreview(null)}
              onDragStart={() => {
                setMovePreview(null);
                setIsGridResizing(true);
              }}
              onDragEnd={() => {
                setIsGridResizing(false);
                setResizePreview(null);
              }}
            />
          ) : null}
            {showEmptyDashboardCanvas && !hasItems ? (
              <p className="pointer-events-none absolute bottom-4 left-1/2 z-[3] max-w-md -translate-x-1/2 px-4 text-center text-[11px] text-zinc-500">
                Click <span className="text-zinc-400">+</span> on an empty cell to add a widget.
              </p>
            ) : null}
          </div>
        </div>
        {addMenu != null ? (
          <DashboardAddWidgetMenu
            anchorRect={addMenu.anchorRect}
            onPick={onAddWidgetFromMenu}
            onDismiss={() => setAddMenu(null)}
          />
        ) : null}
        {marqueeRect != null ? (
          <DashboardMarqueeOverlay rect={marqueeRect} overlayRootRef={scrollContainerRef} />
        ) : null}
      </div>
    </div>
  );
}
