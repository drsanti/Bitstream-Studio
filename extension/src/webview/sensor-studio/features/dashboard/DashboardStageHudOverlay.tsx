import { useCallback, useMemo } from "react";
import {
  dashboardFlexCssAlignItems,
  dashboardFlexCssJustifyContent,
} from "../../core/dashboard/dashboard-layout";
import { dashboardSquareGridCssStyle } from "../../core/dashboard/dashboard-square-grid";
import {
  dashboardSnapshotHasDisplayItems,
  resolveDashboardDisplayItems,
} from "../../core/dashboard/dashboard-display-items";
import { dashboardThemeCssVars } from "../../core/dashboard/dashboard-theme";
import { useDashboardSceneStore } from "../../state/dashboard-scene.store";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { DashboardTabBar } from "./DashboardTabBar";
import { DashboardWidgetCell } from "./DashboardWidgetCell";
import { DashboardGroupCell } from "./DashboardGroupCell";
import type { DashboardSnapshotItemV1 } from "../../core/dashboard/dashboard-snapshot";

/**
 * Operator HMI overlay on the Stage viewport when Dashboard preview targets Stage HUD.
 */
export function DashboardStageHudOverlay() {
  const snapshot = useDashboardSceneStore((s) => s.snapshot);
  const activeTabSourceNodeId = useDashboardSceneStore((s) => s.activeTabSourceNodeId);
  const setActiveTabSourceNodeId = useDashboardSceneStore((s) => s.setActiveTabSourceNodeId);
  const editMode = useDashboardSceneStore((s) => s.editModeEnabled);
  const displayTarget = useDashboardSceneStore((s) => s.displayTarget);

  const dispatchDashboardWidgetEvent = useFlowEditorStore((s) => s.dispatchDashboardWidgetEvent);
  const dispatchDashboardKnobValue = useFlowEditorStore((s) => s.dispatchDashboardKnobValue);
  const dispatchDashboardSwitchValue = useFlowEditorStore((s) => s.dispatchDashboardSwitchValue);
  const dispatchDashboardSelectValue = useFlowEditorStore((s) => s.dispatchDashboardSelectValue);

  const hasDashboardOutput = snapshot.dashboardOutputNodeId != null;
  const showHud =
    hasDashboardOutput &&
    !editMode &&
    displayTarget === "stage-hud" &&
    dashboardSnapshotHasDisplayItems(snapshot);

  const tabs = snapshot.tabs;
  const tabsActive = tabs.length > 0;
  const displayItems = useMemo(
    () => resolveDashboardDisplayItems({ snapshot, activeTabSourceNodeId }),
    [activeTabSourceNodeId, snapshot],
  );
  const layoutMode = snapshot.layout.mode;

  const themeStyle = useMemo(
    () => dashboardThemeCssVars(snapshot.theme),
    [snapshot.theme],
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
      };
    }
    return dashboardSquareGridCssStyle({
      columns: grid.columns,
      gapPx: grid.gapPx,
      paddingPx: grid.paddingPx,
      rowHeightPx: grid.rowHeightPx,
    });
  }, [layoutMode, snapshot.layout]);

  const onButtonClick = useCallback(
    (sourceNodeId: string) => {
      dispatchDashboardWidgetEvent(sourceNodeId);
    },
    [dispatchDashboardWidgetEvent],
  );

  const onKnobValueChange = useCallback(
    (sourceNodeId: string, value: number) => {
      dispatchDashboardKnobValue(sourceNodeId, value);
    },
    [dispatchDashboardKnobValue],
  );

  const onSwitchValueChange = useCallback(
    (sourceNodeId: string, value: boolean) => {
      dispatchDashboardSwitchValue(sourceNodeId, value);
    },
    [dispatchDashboardSwitchValue],
  );

  const onSelectValueChange = useCallback(
    (sourceNodeId: string, value: string) => {
      dispatchDashboardSelectValue(sourceNodeId, value);
    },
    [dispatchDashboardSelectValue],
  );

  const onSliderValueChange = useCallback(
    (sourceNodeId: string, value: number) => {
      dispatchDashboardKnobValue(sourceNodeId, value);
    },
    [dispatchDashboardKnobValue],
  );

  if (!showHud) {
    return null;
  }

  const renderItem = (item: DashboardSnapshotItemV1) => {
    if (item.kind === "group") {
      const groupId = item.group.sourceNodeId;
      return (
        <DashboardGroupCell
          key={groupId}
          group={item.group}
          layoutMode={layoutMode}
          editMode={false}
          highlighted={false}
          onButtonClick={onButtonClick}
          onKnobValueChange={onKnobValueChange}
          onSwitchValueChange={onSwitchValueChange}
          onSelectValueChange={onSelectValueChange}
          onSliderValueChange={onSliderValueChange}
        />
      );
    }
    const widgetId = item.widget.sourceNodeId;
    return (
      <DashboardWidgetCell
        key={widgetId}
        widget={item.widget}
        layoutMode={layoutMode}
        editMode={false}
        highlighted={false}
        onButtonClick={onButtonClick}
        onKnobValueChange={onKnobValueChange}
        onSwitchValueChange={onSwitchValueChange}
        onSelectValueChange={onSelectValueChange}
        onSliderValueChange={onSliderValueChange}
      />
    );
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[55] flex max-h-[min(42vh,22rem)] flex-col"
      aria-label="Dashboard HUD"
    >
      <div
        className="pointer-events-auto mx-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-md"
        style={{ ...themeStyle, backgroundColor: "var(--dashboard-canvas-bg, rgb(9 9 11 / 0.88))" }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {tabsActive ? (
          <DashboardTabBar
            tabs={tabs}
            activeTabSourceNodeId={activeTabSourceNodeId}
            onActiveTabChange={setActiveTabSourceNodeId}
          />
        ) : null}
        <div className="min-h-0 flex-1 overflow-auto scrollbar-hide">
          <div style={layoutStyle}>{displayItems.map((item) => renderItem(item))}</div>
        </div>
      </div>
    </div>
  );
}
