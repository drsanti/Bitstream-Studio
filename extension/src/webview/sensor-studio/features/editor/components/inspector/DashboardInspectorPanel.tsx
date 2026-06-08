import { Gamepad2, LayoutGrid, ListTree, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
} from "../../../../../ui/TRN";
import {
  resolveDashboardDisplayItems,
  resolveDashboardLayoutWarningsForPage,
  summarizeDashboardInspectorInventory,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import {
  writeDashboardActiveTabSourceNodeId,
} from "../../../dashboard/dashboard-viewport-ui-persistence";
import { useDashboardSceneStore } from "../../../../state/dashboard-scene.store";
import { useStudioWorkbenchFocusStore } from "../../../../state/studio-workbench-focus.store";
import { readFlowGraphStoreStructuralRevision } from "../../flow-graph-store-revisions";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { DashboardInspectorControlsTab } from "./DashboardInspectorControlsTab";
import { DashboardInspectorLayoutTab } from "./DashboardInspectorLayoutTab";
import { DashboardInspectorOverviewTab } from "./DashboardInspectorOverviewTab";
import { DashboardInspectorWidgetsTab } from "./DashboardInspectorWidgetsTab";
import {
  readStoredDashboardInspectorTab,
  writeStoredDashboardInspectorTab,
  type DashboardInspectorTab,
} from "./dashboard-inspector-ui-persistence";

const DASHBOARD_INSPECTOR_TABS: readonly {
  id: DashboardInspectorTab;
  label: string;
  Icon: typeof LayoutGrid;
}[] = [
  { id: "overview", label: "Overview", Icon: LayoutGrid },
  { id: "widgets", label: "Widgets", Icon: ListTree },
  { id: "controls", label: "Controls", Icon: Gamepad2 },
  { id: "layout", label: "Layout", Icon: SlidersHorizontal },
];

export type DashboardInspectorPanelProps = {
  onImportLayoutPick?: () => void;
};

export function DashboardInspectorPanel(props: DashboardInspectorPanelProps) {
  const { onImportLayoutPick } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const snapshot = useDashboardSceneStore((s) => s.snapshot);
  const activeTabSourceNodeId = useDashboardSceneStore((s) => s.activeTabSourceNodeId);
  const highlightedWidgetSourceNodeId = useDashboardSceneStore(
    (s) => s.highlightedWidgetSourceNodeId,
  );
  const editModeEnabled = useDashboardSceneStore((s) => s.editModeEnabled);
  const setHighlightedWidgetSourceNodeId = useDashboardSceneStore(
    (s) => s.setHighlightedWidgetSourceNodeId,
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

  const inventory = useMemo(
    () => summarizeDashboardInspectorInventory(displayItems),
    [displayItems],
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
      setHighlightedWidgetSourceNodeId(null);
      onSelectionChange([]);
    },
    [onSelectionChange, setActiveTabSourceNodeId, setHighlightedWidgetSourceNodeId],
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
      setHighlightedWidgetSourceNodeId(sourceNodeId);
      onSelectionChange([sourceNodeId]);
    },
    [onSelectionChange, setHighlightedWidgetSourceNodeId],
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
      <div className="shrink-0 border-b border-zinc-800/70 px-2.5 pb-1.5 pt-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200/95">
          <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-cyan-400/90" aria-hidden />
          2D Dashboard
        </div>
        <p className="mt-1 text-[10px] leading-snug text-zinc-500">
          Committed operator HMI from Dashboard Output. Widget flow settings stay on each node when
          selected.
        </p>
      </div>

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

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2">
          {activeTab === "overview" ? (
            <DashboardInspectorOverviewTab
              snapshot={snapshot}
              displayItems={displayItems}
              inventory={inventory}
              layoutMode={snapshot.layout.mode}
              activeTabLabel={activePageLabel}
              activeTabSourceNodeId={activeTabSourceNodeId}
              pageLayoutWarnings={pageLayoutWarnings}
              dashboardOutputLabel={dashboardOutputLabel}
              editModeEnabled={editModeEnabled}
              onFocusOutputInGraph={onFocusOutputInGraph}
              onEditModeChange={setEditModeEnabled}
              onActiveDashboardTabChange={onActiveDashboardTabChange}
            />
          ) : null}
          {activeTab === "widgets" ? (
            <DashboardInspectorWidgetsTab
              displayItems={displayItems}
              highlightedWidgetSourceNodeId={highlightedWidgetSourceNodeId}
              onSelectWidget={onSelectWidget}
              onFocusWidgetInGraph={focusNodeInGraph}
              onInspectWidgetInGraph={onInspectWidgetInGraph}
            />
          ) : null}
          {activeTab === "controls" ? (
            <DashboardInspectorControlsTab
              displayItems={displayItems}
              editModeEnabled={editModeEnabled}
              onButtonClick={(sourceNodeId) => dispatchDashboardWidgetEvent({ sourceNodeId })}
              onKnobValueChange={(sourceNodeId, value) =>
                dispatchDashboardKnobValue({ sourceNodeId, value })
              }
              onSwitchValueChange={(sourceNodeId, value) =>
                dispatchDashboardSwitchValue({ sourceNodeId, value })
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
