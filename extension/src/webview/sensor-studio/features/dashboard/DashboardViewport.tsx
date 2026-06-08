import { LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { startDashboardGridDragSession } from "../../core/dashboard/dashboard-grid-drag-move";
import type { DashboardGridMetricsV1 } from "../../core/dashboard/dashboard-grid-resize";
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
import {
  readDashboardActiveTabSourceNodeId,
  writeDashboardActiveTabSourceNodeId,
  writeDashboardEditModeEnabled,
} from "./dashboard-viewport-ui-persistence";
import { DashboardGroupCell } from "./DashboardGroupCell";
import { DashboardTabBar } from "./DashboardTabBar";
import { DashboardGridEditModeBar } from "./DashboardGridEditModeBar";
import { DashboardGridResizeFrame } from "./DashboardGridResizeFrame";
import { DashboardViewportToolbar } from "./DashboardViewportToolbar";
import { DashboardWidgetCell } from "./DashboardWidgetCell";

function resolveDashboardItemPlacement(
  item: DashboardSnapshotItemV1,
): DashboardPlacementV1 {
  return item.kind === "group" ? item.group.placement : item.widget.placement;
}

/**
 * Full-bleed Dashboard pane — 2D operator HMI (Node-RED Dashboard parity).
 * Committed layout comes from **Dashboard Output** via {@link evaluateDashboardSnapshot}.
 */
export function DashboardViewport() {
  const snapshot = useDashboardSceneStore((s) => s.snapshot);
  const highlightedWidgetSourceNodeId = useDashboardSceneStore(
    (s) => s.highlightedWidgetSourceNodeId,
  );
  const setHighlightedWidgetSourceNodeId = useDashboardSceneStore(
    (s) => s.setHighlightedWidgetSourceNodeId,
  );
  const activeTabSourceNodeId = useDashboardSceneStore((s) => s.activeTabSourceNodeId);
  const setActiveTabSourceNodeId = useDashboardSceneStore((s) => s.setActiveTabSourceNodeId);

  const dispatchDashboardWidgetEvent = useFlowEditorStore((s) => s.dispatchDashboardWidgetEvent);
  const dispatchDashboardKnobValue = useFlowEditorStore((s) => s.dispatchDashboardKnobValue);
  const dispatchDashboardSwitchValue = useFlowEditorStore((s) => s.dispatchDashboardSwitchValue);
  const moveDashboardWidgetToGridCell = useFlowEditorStore((s) => s.moveDashboardWidgetToGridCell);
  const arrangeDashboardWidgetsStacked = useFlowEditorStore((s) => s.arrangeDashboardWidgetsStacked);
  const setDashboardWidgetGridPlacement = useFlowEditorStore(
    (s) => s.setDashboardWidgetGridPlacement,
  );
  const onSelectionChange = useFlowEditorStore((s) => s.onSelectionChange);

  const editMode = useDashboardSceneStore((s) => s.editModeEnabled);
  const setEditModeEnabled = useDashboardSceneStore((s) => s.setEditModeEnabled);
  const setActiveEditorType = useStudioWorkbenchFocusStore((s) => s.setActiveEditorType);
  const activeEditorType = useStudioWorkbenchFocusStore((s) => s.activeEditorType);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null);
  const onGridRef = useCallback((node: HTMLDivElement | null) => {
    setGridElement(node);
  }, []);
  const [resizePreview, setResizePreview] = useState<{
    sourceNodeId: string;
    placement: DashboardPlacementV1;
  } | null>(null);
  const [isGridResizing, setIsGridResizing] = useState(false);
  const [movePreview, setMovePreview] = useState<{
    sourceNodeId: string;
    row: number;
    column: number;
  } | null>(null);
  const [isGridDragging, setIsGridDragging] = useState(false);
  const prevEditModeRef = useRef(editMode);

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

  useEffect(() => {
    const enteringEdit = editMode && !prevEditModeRef.current;
    prevEditModeRef.current = editMode;
    if (
      enteringEdit &&
      layoutMode === "grid" &&
      highlightedWidgetSourceNodeId == null &&
      displayItems.length > 0
    ) {
      const first = displayItems[0];
      const sourceNodeId =
        first.kind === "group" ? first.group.sourceNodeId : first.widget.sourceNodeId;
      setHighlightedWidgetSourceNodeId(sourceNodeId);
      onSelectionChange([sourceNodeId]);
    }
  }, [
    displayItems,
    editMode,
    highlightedWidgetSourceNodeId,
    layoutMode,
    onSelectionChange,
    setHighlightedWidgetSourceNodeId,
  ]);

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
      if (
        movePreview != null &&
        movePreview.sourceNodeId === highlightedWidgetSourceNodeId
      ) {
        return {
          ...base,
          row: movePreview.row,
          column: movePreview.column,
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

  const selectedPlacementDisplay = useMemo((): DashboardPlacementV1 | null => {
    if (resizePreview != null && resizePreview.sourceNodeId === highlightedWidgetSourceNodeId) {
      return resizePreview.placement;
    }
    return resizeBasePlacement;
  }, [highlightedWidgetSourceNodeId, resizeBasePlacement, resizePreview]);

  const showGridResizeFrame =
    editMode &&
    layoutMode === "grid" &&
    highlightedWidgetSourceNodeId != null &&
    resizeBasePlacement != null &&
    selectedEditTarget != null;

  const onDeselectWidget = useCallback(() => {
    setActiveEditorType("dashboard");
    setHighlightedWidgetSourceNodeId(null);
    onSelectionChange([]);
    setResizePreview(null);
    setMovePreview(null);
  }, [onSelectionChange, setActiveEditorType, setHighlightedWidgetSourceNodeId]);

  const onGridBackgroundPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!editMode || layoutMode !== "grid" || isGridResizing || isGridDragging) {
        return;
      }
      if (event.target !== event.currentTarget) {
        return;
      }
      onDeselectWidget();
    },
    [editMode, isGridDragging, isGridResizing, layoutMode, onDeselectWidget],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (activeEditorType !== "dashboard") {
        return;
      }
      if (!editMode || layoutMode !== "grid") {
        return;
      }
      if (isGridDragging || isGridResizing) {
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
      if (highlightedWidgetSourceNodeId == null) {
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
    highlightedWidgetSourceNodeId,
    isGridDragging,
    isGridResizing,
    layoutMode,
    onDeselectWidget,
  ]);

  const placementOverrideFor = useCallback(
    (sourceNodeId: string): Partial<DashboardPlacementV1> | undefined => {
      if (
        resizePreview != null &&
        resizePreview.sourceNodeId === sourceNodeId
      ) {
        return resizePreview.placement;
      }
      if (movePreview != null && movePreview.sourceNodeId === sourceNodeId) {
        return {
          row: movePreview.row,
          column: movePreview.column,
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

  const onSliderValueChange = onKnobValueChange;

  const onSelectWidget = useCallback(
    (sourceNodeId: string) => {
      setHighlightedWidgetSourceNodeId(sourceNodeId);
      onSelectionChange([sourceNodeId]);
    },
    [onSelectionChange, setHighlightedWidgetSourceNodeId],
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
      event.preventDefault();
      startDashboardGridDragSession({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originRow: placement.row,
        originColumn: placement.column,
        gridElement,
        metrics: gridMetrics,
        placement,
        onSelect: () => onSelectWidget(sourceNodeId),
        onDragActive: () => setIsGridDragging(true),
        onPreview: (row, column) => {
          setMovePreview({ sourceNodeId, row, column });
        },
        onCommit: (row, column) => {
          if (row !== placement.row || column !== placement.column) {
            moveDashboardWidgetToGridCell({ sourceNodeId, row, column });
          }
        },
        onDragEnd: () => {
          setIsGridDragging(false);
          setMovePreview(null);
        },
      });
    },
    [
      editMode,
      gridElement,
      gridMetrics,
      isGridResizing,
      layoutMode,
      moveDashboardWidgetToGridCell,
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
    const rowTrack =
      editMode && layoutMode === "grid"
        ? `${grid.rowHeightPx}px`
        : `minmax(${grid.rowHeightPx}px, auto)`;
    return {
      display: "grid" as const,
      gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`,
      gridAutoRows: rowTrack,
      gap: `${grid.gapPx}px`,
      padding: `${grid.paddingPx}px`,
      ["--dashboard-row-height" as string]: `${grid.rowHeightPx}px`,
    };
  }, [editMode, layoutMode, snapshot.layout]);

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
      const groupHighlighted = highlightedWidgetSourceNodeId === groupId;
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
          onSliderValueChange={onSliderValueChange}
          onSelectWidget={onSelectWidget}
          onSelectGroup={onSelectWidget}
          onGridDragPointerDown={
            editMode && layoutMode === "grid"
              ? (event, placement) => onGridDragPointerDown(groupId, placement, event)
              : undefined
          }
          isGridDragging={isGridDragging && movePreview?.sourceNodeId === groupId}
        />
      );
    }
    const widgetId = item.widget.sourceNodeId;
    const widgetHighlighted = highlightedWidgetSourceNodeId === widgetId;
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
        onSliderValueChange={onSliderValueChange}
        onSelectWidget={onSelectWidget}
        onGridDragPointerDown={
          editMode && layoutMode === "grid"
            ? (event, placement) => onGridDragPointerDown(widgetId, placement, event)
            : undefined
        }
        isGridDragging={isGridDragging && movePreview?.sourceNodeId === widgetId}
      />
    );
  };

  if (!hasItems) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-zinc-950">
        <DashboardViewportToolbar
          editMode={editMode}
          layoutMode={layoutMode}
          snapshot={snapshot}
          onEditModeChange={onEditModeChange}
          onStackLayout={onStackLayout}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <LayoutGrid className="size-10 text-zinc-600" aria-hidden />
          <p className="max-w-sm text-sm text-zinc-400">
            Wire <span className="font-medium text-zinc-300">Dashboard Button</span>,{" "}
            <span className="font-medium text-zinc-300">LED</span>,{" "}
            <span className="font-medium text-zinc-300">Text</span>,{" "}
            <span className="font-medium text-zinc-300">Gauge</span>, or{" "}
            <span className="font-medium text-zinc-300">Knob</span>, or{" "}
            <span className="font-medium text-zinc-300">Group</span> nodes into Dashboard Output.
          </p>
          <TRNButton type="button" onClick={runDashboardDemoTemplate}>
            Load dashboard demo
          </TRNButton>
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
      <DashboardViewportToolbar
        editMode={editMode}
        layoutMode={layoutMode}
        snapshot={snapshot}
        onEditModeChange={onEditModeChange}
        onStackLayout={onStackLayout}
      />
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
      {editMode && layoutMode === "grid" ? (
        <DashboardGridEditModeBar
          selectedLabel={selectedEditTarget?.label ?? null}
          selectedKind={selectedEditTarget?.kind ?? null}
          placement={selectedPlacementDisplay}
          isDragging={isGridDragging}
          isResizing={isGridResizing}
          onDeselect={onDeselectWidget}
        />
      ) : null}
      <div
        ref={scrollContainerRef}
        className="relative min-h-0 flex-1 overflow-auto scrollbar-hide"
        onPointerDown={onGridBackgroundPointerDown}
      >
        {editMode && layoutMode === "grid" ? (
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
            <div
              className="absolute inset-0 opacity-55"
              style={{
                inset: `${snapshot.layout.grid.paddingPx}px`,
                display: "grid",
                gridTemplateColumns: `repeat(${snapshot.layout.grid.columns}, minmax(0, 1fr))`,
                gridAutoRows: `${snapshot.layout.grid.rowHeightPx}px`,
                gap: `${snapshot.layout.grid.gapPx}px`,
              }}
            >
              {Array.from({ length: snapshot.layout.grid.columns * 10 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-none border border-dashed border-cyan-500/25 bg-cyan-500/[0.04]"
                />
              ))}
            </div>
          </div>
        ) : null}
        <div
          ref={onGridRef}
          className={`relative ${
            editMode && layoutMode === "grid" ? "z-[2]" : "z-[1]"
          }`}
          style={layoutStyle}
          onPointerDown={onGridBackgroundPointerDown}
        >
          {displayItems.map((item) => renderItem(item))}
        </div>
        {showGridResizeFrame &&
        highlightedWidgetSourceNodeId != null &&
        resizeBasePlacement != null ? (
          <DashboardGridResizeFrame
            targetSourceNodeId={highlightedWidgetSourceNodeId}
            selectionLabel={selectedEditTarget.label}
            basePlacement={resizeBasePlacement}
            metrics={gridMetrics}
            gridElement={gridElement}
            scrollRootRef={scrollContainerRef}
            onPreviewPlacement={(placement) => {
              setResizePreview({
                sourceNodeId: highlightedWidgetSourceNodeId,
                placement,
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
      </div>
    </div>
  );
}
