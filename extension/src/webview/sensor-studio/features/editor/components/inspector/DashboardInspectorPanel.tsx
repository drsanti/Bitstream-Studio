import { ListTree, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS,
  TRN_INSPECTOR_PANEL_SCROLL_CLASS,
  resolveInspectorPanelShellClass,
} from "../../../../../ui/TRN";
import { DashboardInspectorContextBar } from "./DashboardInspectorContextBar";
import {
  resolveDashboardDisplayItems,
  resolveDashboardLayoutWarningsForPage,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import { writeDashboardActiveTabSourceNodeId } from "../../../dashboard/dashboard-viewport-ui-persistence";
import { useDashboardSceneStore } from "../../../../state/dashboard-scene.store";
import { useStudioWorkbenchFocusStore } from "../../../../state/studio-workbench-focus.store";
import { readFlowGraphStoreStructuralRevision } from "../../flow-graph-store-revisions";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { DashboardInspectorLayoutTab } from "./DashboardInspectorLayoutTab";
import { DashboardInspectorWidgetsTab } from "./DashboardInspectorWidgetsTab";
import {
  readStoredDashboardInspectorTab,
  writeStoredDashboardInspectorTab,
  type DashboardInspectorTab,
} from "./dashboard-inspector-ui-persistence";

const DASHBOARD_INSPECTOR_TABS: readonly {
  id: DashboardInspectorTab;
  label: string;
  Icon: typeof ListTree;
}[] = [
  { id: "widgets", label: "Widgets", Icon: ListTree },
  { id: "layout", label: "Layout", Icon: SlidersHorizontal },
];

export type DashboardInspectorPanelProps = {
  onImportLayoutPick?: () => void;
  /** Strip outer card chrome when hosted inside workbench INSPECTOR / dual-pane slot. */
  embedded?: boolean;
};

export function DashboardInspectorPanel(props: DashboardInspectorPanelProps) {
  const { onImportLayoutPick, embedded = false } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const snapshot = useDashboardSceneStore((s) => s.snapshot);
  const activeTabSourceNodeId = useDashboardSceneStore((s) => s.activeTabSourceNodeId);
  const highlightedWidgetSourceNodeIds = useDashboardSceneStore(
    (s) => s.highlightedWidgetSourceNodeIds,
  );
  const editModeEnabled = useDashboardSceneStore((s) => s.editModeEnabled);
  const setHighlightedWidgetSelection = useDashboardSceneStore(
    (s) => s.setHighlightedWidgetSelection,
  );
  const setEditModeEnabled = useDashboardSceneStore((s) => s.setEditModeEnabled);
  const setActiveTabSourceNodeId = useDashboardSceneStore((s) => s.setActiveTabSourceNodeId);

  const graphStructuralRevision = useFlowEditorStore((s) =>
    readFlowGraphStoreStructuralRevision(s.nodes, s.edges),
  );
  const flowNodes = useMemo(
    () => useFlowEditorStore.getState().nodes,
    [graphStructuralRevision],
  );
  const onSelectionChange = useFlowEditorStore((s) => s.onSelectionChange);
  const selectStudioNodesByIds = useFlowEditorStore((s) => s.selectStudioNodesByIds);
  const fitFlowCanvasToNodeIds = useFlowEditorStore((s) => s.fitFlowCanvasToNodeIds);
  const setActiveEditorType = useStudioWorkbenchFocusStore((s) => s.setActiveEditorType);
  const dispatchDashboardWidgetEvent = useFlowEditorStore((s) => s.dispatchDashboardWidgetEvent);
  const dispatchDashboardKnobValue = useFlowEditorStore((s) => s.dispatchDashboardKnobValue);
  const dispatchDashboardSwitchValue = useFlowEditorStore((s) => s.dispatchDashboardSwitchValue);
  const dispatchDashboardSelectValue = useFlowEditorStore((s) => s.dispatchDashboardSelectValue);
  const importDashboardLayoutJson = useFlowEditorStore((s) => s.importDashboardLayoutJson);

  const [activeTab, setActiveTab] = useState<DashboardInspectorTab>(() =>
    readStoredDashboardInspectorTab(),
  );

  const setActiveTabPersisted = useCallback((next: DashboardInspectorTab) => {
    setActiveTab(next);
    writeStoredDashboardInspectorTab(next);
  }, []);

  const displayItems = useMemo(
    () =>
      resolveDashboardDisplayItems({
        snapshot,
        activeTabSourceNodeId,
      }),
    [activeTabSourceNodeId, snapshot],
  );

  const dashboardOutputLabel = useMemo(() => {
    if (snapshot.dashboardOutputNodeId == null) {
      return null;
    }
    const node = flowNodes.find((n) => n.id === snapshot.dashboardOutputNodeId);
    return node?.data.label ?? null;
  }, [flowNodes, snapshot.dashboardOutputNodeId]);

  const pageLayoutWarnings = useMemo(
    () =>
      resolveDashboardLayoutWarningsForPage({
        snapshot,
        activeTabSourceNodeId,
      }),
    [activeTabSourceNodeId, snapshot],
  );

  const onActiveDashboardTabChange = useCallback(
    (sourceNodeId: string) => {
      setActiveTabSourceNodeId(sourceNodeId);
      writeDashboardActiveTabSourceNodeId(sourceNodeId);
      setHighlightedWidgetSelection([]);
      onSelectionChange([]);
    },
    [onSelectionChange, setActiveTabSourceNodeId, setHighlightedWidgetSelection],
  );

  const activePageLabel = useMemo(() => {
    if (snapshot.tabs.length === 0) {
      return null;
    }
    const enabled = snapshot.tabs.filter((tab) => tab.enabled);
    const active =
      enabled.find((tab) => tab.sourceNodeId === activeTabSourceNodeId) ?? enabled[0];
    return active?.label ?? null;
  }, [activeTabSourceNodeId, snapshot.tabs]);

  const focusNodeInGraph = useCallback(
    (sourceNodeId: string) => {
      selectStudioNodesByIds([sourceNodeId]);
      setActiveEditorType("flow");
      fitFlowCanvasToNodeIds([sourceNodeId]);
    },
    [fitFlowCanvasToNodeIds, selectStudioNodesByIds, setActiveEditorType],
  );

  const onSelectWidget = useCallback(
    (sourceNodeId: string) => {
      setHighlightedWidgetSelection([sourceNodeId]);
      onSelectionChange([sourceNodeId]);
    },
    [onSelectionChange, setHighlightedWidgetSelection],
  );

  const onInspectWidgetInGraph = useCallback(
    (sourceNodeId: string) => {
      onSelectWidget(sourceNodeId);
      focusNodeInGraph(sourceNodeId);
    },
    [focusNodeInGraph, onSelectWidget],
  );

  const onFocusOutputInGraph = useCallback(() => {
    if (snapshot.dashboardOutputNodeId == null) {
      return;
    }
    focusNodeInGraph(snapshot.dashboardOutputNodeId);
  }, [focusNodeInGraph, snapshot.dashboardOutputNodeId]);

  const triggerImport = useCallback(() => {
    if (onImportLayoutPick != null) {
      onImportLayoutPick();
      return;
    }
    fileInputRef.current?.click();
  }, [onImportLayoutPick]);

  return (
    <div className={resolveInspectorPanelShellClass(embedded)}>
      <TRNTabs
        value={activeTab}
        onValueChange={(next) => setActiveTabPersisted(next as DashboardInspectorTab)}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
      >
        <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
          <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
            {DASHBOARD_INSPECTOR_TABS.map(({ id, label, Icon }) => (
              <TRNTabsTrigger key={id} value={id} className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
                {label}
              </TRNTabsTrigger>
            ))}
          </TRNTabsList>
        </div>

        <div className={TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS}>
          <DashboardInspectorContextBar
            activeTab={activeTab}
            snapshot={snapshot}
            displayItems={displayItems}
            editModeEnabled={editModeEnabled}
            activePageLabel={activePageLabel}
            dashboardOutputLabel={dashboardOutputLabel}
            pageLayoutWarningCount={pageLayoutWarnings.length}
          />
          <div className={TRN_INSPECTOR_PANEL_SCROLL_CLASS}>
          {activeTab === "widgets" ? (
            <DashboardInspectorWidgetsTab
              snapshot={snapshot}
              displayItems={displayItems}
              activeTabLabel={activePageLabel}
              activeTabSourceNodeId={activeTabSourceNodeId}
              pageLayoutWarnings={pageLayoutWarnings}
              dashboardOutputLabel={dashboardOutputLabel}
              editModeEnabled={editModeEnabled}
              highlightedWidgetSourceNodeIds={highlightedWidgetSourceNodeIds}
              onFocusOutputInGraph={onFocusOutputInGraph}
              onEditModeChange={setEditModeEnabled}
              onActiveDashboardTabChange={onActiveDashboardTabChange}
              onSelectWidget={onSelectWidget}
              onFocusWidgetInGraph={focusNodeInGraph}
              onInspectWidgetInGraph={onInspectWidgetInGraph}
              onButtonClick={(sourceNodeId) => dispatchDashboardWidgetEvent({ sourceNodeId })}
              onKnobValueChange={(sourceNodeId, value) =>
                dispatchDashboardKnobValue({ sourceNodeId, value })
              }
              onSwitchValueChange={(sourceNodeId, value) =>
                dispatchDashboardSwitchValue({ sourceNodeId, value })
              }
              onSelectValueChange={(sourceNodeId, value) =>
                dispatchDashboardSelectValue({ sourceNodeId, value })
              }
              onSliderValueChange={(sourceNodeId, value) =>
                dispatchDashboardKnobValue({ sourceNodeId, value })
              }
            />
          ) : null}
          {activeTab === "layout" ? (
            <DashboardInspectorLayoutTab
              dashboardOutputNodeId={snapshot.dashboardOutputNodeId}
              dashboardSnapshot={snapshot}
              displayItems={displayItems}
              pageLayoutWarnings={pageLayoutWarnings}
              onImportLayoutPick={triggerImport}
            />
          ) : null}
          </div>
        </div>
      </TRNTabs>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file == null) {
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const text = typeof reader.result === "string" ? reader.result : "";
            importDashboardLayoutJson(text);
          };
          reader.readAsText(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
