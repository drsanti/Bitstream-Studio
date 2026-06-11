import {
  Activity,
  Box,
  Clapperboard,
  ClipboardList,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { resolveStudioNodeSourceId } from "../../../../core/device/resolve-studio-node-source-id";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS,
  resolveInspectorPanelShellClass,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
} from "../../../../../ui/TRN";
import { isScene3dInspectorNodeId } from "../../nodes/scene3d/scene3d-inspector-node-ids";
import type { FlowGraphNode, StudioNode } from "../../store/flow-editor.store";
import { isStudioFlowNode } from "../../layout/layout-port-resolution";
import type { DashboardSnapshotV1 } from "../../../../core/dashboard/dashboard-snapshot";
import {
  flattenDashboardInspectorWidgets,
  resolveDashboardDisplayItems,
} from "../../../../core/dashboard/dashboard-inspector-helpers";
import type { SceneObjectRefV1 } from "../../../../core/stage/scene-object-ref";
import type { Edge } from "@xyflow/react";
import { LayoutNodeInspectorPanel } from "./LayoutNodeInspectorPanel";
import { NodeInspectorDetailsTab } from "./NodeInspectorDetailsTab";
import { NodeInspectorDeviceTab } from "./NodeInspectorDeviceTab";
import { InspectorContextBar } from "./InspectorContextBar";
import { NodeInspectorLiveTab } from "./NodeInspectorLiveTab";
import { NodeInspectorMultiLiveReadouts } from "./NodeInspectorMultiLiveReadouts";
import { GlbAnimationBundleAnimationInspectorTab } from "./GlbAnimationBundleAnimationInspectorTab";
import { NodeInspectorNodeTab } from "./NodeInspectorNodeTab";
import {
  CanvasInspectorPanel,
  type CanvasInspectorPanelProps,
} from "./CanvasInspectorPanel";
import { DashboardInspectorPanel } from "./DashboardInspectorPanel";
import { DashboardSelectionInspectorStrip } from "./DashboardSelectionInspectorStrip";
import { StageWorkbenchInspectorPanel } from "./StageWorkbenchInspectorPanel";
import type { EffectiveInspectorView } from "./studio-inspector-pin";
import {
  readStoredInspectorActiveTab,
  writeStoredInspectorActiveTab,
  type InspectorMainTab,
} from "./node-inspector-ui-persistence";
import type { InspectorPaneRole } from "./InspectorDualPaneShell";

const CORE_INSPECTOR_TABS: readonly {
  id: InspectorMainTab;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "node", label: "Node", Icon: Box },
  { id: "details", label: "Details", Icon: ClipboardList },
  { id: "live", label: "Live", Icon: Activity },
];

const DEVICE_INSPECTOR_TAB = {
  id: "device" as const,
  label: "Device",
  Icon: Cpu,
};

export type InspectorViewPanelProps = {
  role: InspectorPaneRole;
  /** Flat shell inside workbench INSPECTOR (no nested card border). */
  embeddedShell?: boolean;
  view: EffectiveInspectorView;
  borderColor: string;
  panelColor: string;
  catalogEntries: NodeCatalogEntry[];
  categoryColors: Record<NodeCatalogEntry["category"], string>;
  flowNodes: readonly FlowGraphNode[];
  flowEdges: readonly Edge[];
  dashboardSnapshot: DashboardSnapshotV1;
  activeDashboardTabSourceNodeId: string | null;
  canvasInspector?: Omit<
    CanvasInspectorPanelProps,
    "nodes" | "edges" | "orderedSelectedNodes"
  >;
  canvasNodes?: CanvasInspectorPanelProps["nodes"];
  canvasEdges?: CanvasInspectorPanelProps["edges"];
  orderedSelectedNodesForCanvas?: CanvasInspectorPanelProps["orderedSelectedNodes"];
  onUpdateLabel: (nextLabel: string) => void;
  onUpdateNodeUiAllowBodyCollapse: (allow: boolean) => void;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  onUpdateConfigJson: (
    nextJson: string,
  ) => { ok: true } | { ok: false; message: string };
  onFocusStageSelectionInGraph: (selection: SceneObjectRefV1) => void;
  onSelectFlowNodeForStageInspector: (nodeId: string) => void;
  onClearStageSelection: () => void;
  onFocusDashboardSelectionInGraph: (sourceNodeId: string) => void;
  onClearDashboardSelection: () => void;
};

export function InspectorViewPanel(props: InspectorViewPanelProps) {
  const {
    role,
    embeddedShell = false,
    view,
    borderColor,
    panelColor,
    catalogEntries,
    categoryColors,
    flowNodes,
    flowEdges,
    dashboardSnapshot,
    activeDashboardTabSourceNodeId,
    canvasInspector,
    canvasNodes,
    canvasEdges,
    orderedSelectedNodesForCanvas,
    onUpdateLabel,
    onUpdateNodeUiAllowBodyCollapse,
    onUpdateConfigField,
    onUpdateConfigJson,
    onFocusStageSelectionInGraph,
    onSelectFlowNodeForStageInspector,
    onClearStageSelection,
    onFocusDashboardSelectionInGraph,
    onClearDashboardSelection,
  } = props;

  const {
    stageWorkbenchActive,
    selectedSceneObject,
    selectedNode,
    orderedSelectedNodes,
    flowPaneNode,
    flowPaneFromCanvasSelection,
    showDashboardInspector,
    highlightedWidgetSourceNodeId,
  } = view;

  const stageDerivedNode = useMemo(() => {
    if (selectedSceneObject == null) {
      return null;
    }
    return flowNodes.find((n) => n.id === selectedSceneObject.sourceNodeId) ?? null;
  }, [flowNodes, selectedSceneObject]);

  const catalogEntry = useMemo((): NodeCatalogEntry | undefined => {
    if (selectedNode == null) {
      return undefined;
    }
    return catalogEntries.find((e) => e.id === selectedNode.data.nodeId);
  }, [catalogEntries, selectedNode]);

  const flowCatalogEntry = useMemo((): NodeCatalogEntry | undefined => {
    if (flowPaneNode == null) {
      return undefined;
    }
    return catalogEntries.find((e) => e.id === flowPaneNode.data.nodeId);
  }, [catalogEntries, flowPaneNode]);

  const isMultiSelect = orderedSelectedNodes.length > 1;
  const homogeneousMultiEdit = useMemo(() => {
    if (!isMultiSelect) {
      return false;
    }
    const first = orderedSelectedNodes[0];
    if (first == null || !isStudioFlowNode(first)) {
      return false;
    }
    const firstId = first.data.nodeId;
    return orderedSelectedNodes.every(
      (n) => isStudioFlowNode(n) && n.data.nodeId === firstId,
    );
  }, [isMultiSelect, orderedSelectedNodes]);

  const [jsonDraft, setJsonDraft] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [sourceKeyDraft, setSourceKeyDraft] = useState("");
  const [sourceKeyFieldError, setSourceKeyFieldError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InspectorMainTab>(() =>
    role === "active" ? readStoredInspectorActiveTab() : "node",
  );

  const selectedNodeId = selectedNode?.id ?? null;
  const flowPaneNodeId = flowPaneNode?.id ?? null;

  const setActiveTabPersisted = useCallback(
    (next: InspectorMainTab) => {
      setActiveTab(next);
      if (role === "active") {
        writeStoredInspectorActiveTab(next);
      }
    },
    [role],
  );

  useEffect(() => {
    const jsonNode = stageWorkbenchActive ? flowPaneNode : selectedNode;
    if (jsonNode == null || !isStudioFlowNode(jsonNode)) {
      setJsonDraft("{}");
      setJsonError(null);
      return;
    }
    setJsonDraft(JSON.stringify(jsonNode.data.defaultConfig, null, 2));
    setJsonError(null);
  }, [flowPaneNode, flowPaneNodeId, selectedNode, selectedNodeId, stageWorkbenchActive]);

  const deviceSourceId = useMemo(
    () => resolveStudioNodeSourceId(selectedNode),
    [selectedNode],
  );
  const isGlbAnimationBundle =
    selectedNode != null && selectedNode.data.nodeId === "glb-animation-bundle";

  useEffect(() => {
    if (deviceSourceId == null && activeTab === "device") {
      setActiveTabPersisted("node");
    }
    if (!isGlbAnimationBundle && activeTab === "animation") {
      setActiveTabPersisted("node");
    }
  }, [deviceSourceId, activeTab, isGlbAnimationBundle, setActiveTabPersisted]);

  useEffect(() => {
    if (role !== "active" || selectedNode == null) {
      return;
    }
    if (selectedNode.data.nodeId === "glb-animation-bundle") {
      setActiveTabPersisted("animation");
      return;
    }
    if (deviceSourceId != null) {
      setActiveTabPersisted("live");
    }
  }, [role, selectedNodeId, deviceSourceId, selectedNode?.data.nodeId, setActiveTabPersisted]);

  const persistedSourceKey =
    selectedNode != null && selectedNode.data.nodeId === "sensor-input"
      ? String(selectedNode.data.defaultConfig.sourceKey ?? "bmi270.accel.x")
      : "";

  useEffect(() => {
    if (selectedNode == null || selectedNode.data.nodeId !== "sensor-input") {
      setSourceKeyFieldError(null);
      return;
    }
    setSourceKeyDraft(persistedSourceKey);
    setSourceKeyFieldError(null);
  }, [selectedNode?.id, persistedSourceKey, selectedNode?.data.nodeId]);

  const categoryTint =
    selectedNode != null
      ? (categoryColors[selectedNode.data.category] ?? "#a1a1aa")
      : "#a1a1aa";
  const hasScene3dInspector =
    selectedNode != null && isScene3dInspectorNodeId(selectedNode.data.nodeId);

  const visibleTabs = useMemo(() => {
    if (isGlbAnimationBundle) {
      const tabs: { id: InspectorMainTab; label: string; Icon: LucideIcon }[] = [
        { id: "node", label: "Node", Icon: Box },
        { id: "animation", label: "Animation", Icon: Clapperboard },
        { id: "details", label: "Details", Icon: ClipboardList },
        { id: "live", label: "Live", Icon: Activity },
      ];
      if (deviceSourceId != null) {
        tabs.push(DEVICE_INSPECTOR_TAB);
      }
      return tabs;
    }
    if (deviceSourceId != null) {
      return [...CORE_INSPECTOR_TABS, DEVICE_INSPECTOR_TAB];
    }
    return CORE_INSPECTOR_TABS;
  }, [deviceSourceId, isGlbAnimationBundle]);

  const tabPanelClassName =
    activeTab === "node" || activeTab === "device" || activeTab === "animation"
      ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2.5 pb-3 pt-2"
      : "scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2";

  const dashboardDisplayItems = useMemo(
    () =>
      resolveDashboardDisplayItems({
        snapshot: dashboardSnapshot,
        activeTabSourceNodeId: activeDashboardTabSourceNodeId,
      }),
    [activeDashboardTabSourceNodeId, dashboardSnapshot],
  );

  const dashboardSelectionContext = useMemo(() => {
    if (selectedNode == null || highlightedWidgetSourceNodeId !== selectedNode.id) {
      return null;
    }
    for (const item of dashboardDisplayItems) {
      if (
        item.kind === "group" &&
        item.group.sourceNodeId === highlightedWidgetSourceNodeId
      ) {
        return {
          widget: null,
          group: item.group,
          groupLabel: null as string | null,
        };
      }
    }
    const row =
      flattenDashboardInspectorWidgets(dashboardDisplayItems).find(
        (entry) => entry.widget.sourceNodeId === highlightedWidgetSourceNodeId,
      ) ?? null;
    if (row == null) {
      return null;
    }
    return {
      widget: row.widget,
      group: null,
      groupLabel: row.group?.label ?? null,
    };
  }, [dashboardDisplayItems, highlightedWidgetSourceNodeId, selectedNode]);

  if (stageWorkbenchActive) {
    return (
      <StageWorkbenchInspectorPanel
        selectedSceneObject={selectedSceneObject}
        boundNode={stageDerivedNode as StudioNode | null}
        flowPaneNode={flowPaneNode}
        flowPaneFromCanvasSelection={flowPaneFromCanvasSelection}
        catalogEntry={catalogEntry}
        flowCatalogEntry={flowCatalogEntry}
        flowNodes={flowNodes}
        flowEdges={flowEdges}
        stagePresentationPreferences={canvasInspector!.stagePresentationPreferences}
        onStagePresentationPreferencesChange={
          canvasInspector!.onStagePresentationPreferencesChange
        }
        onFocusSelectionInGraph={() => {
          if (selectedSceneObject != null) {
            onFocusStageSelectionInGraph(selectedSceneObject);
          }
        }}
        onSelectFlowNode={onSelectFlowNodeForStageInspector}
        onClearSelection={onClearStageSelection}
        onUpdateConfigField={onUpdateConfigField}
        onUpdateLabel={onUpdateLabel}
        onUpdateNodeUiAllowBodyCollapse={onUpdateNodeUiAllowBodyCollapse}
        onUpdateConfigJson={onUpdateConfigJson}
        jsonDraft={jsonDraft}
        setJsonDraft={setJsonDraft}
        jsonError={jsonError}
        setJsonError={setJsonError}
        sourceKeyDraft={sourceKeyDraft}
        setSourceKeyDraft={setSourceKeyDraft}
        sourceKeyFieldError={sourceKeyFieldError}
        setSourceKeyFieldError={setSourceKeyFieldError}
      />
    );
  }

  const panelShellClass = resolveInspectorPanelShellClass(embeddedShell);

  if (selectedNode == null) {
    if (showDashboardInspector) {
      return <DashboardInspectorPanel embedded={embeddedShell} />;
    }
    if (
      canvasInspector != null &&
      canvasNodes != null &&
      canvasEdges != null &&
      orderedSelectedNodesForCanvas != null
    ) {
      return (
        <CanvasInspectorPanel
          nodes={canvasNodes}
          edges={canvasEdges}
          orderedSelectedNodes={orderedSelectedNodesForCanvas}
          embedded={embeddedShell}
          {...canvasInspector}
        />
      );
    }
    return (
      <div className="min-h-0 flex-1 px-2.5 py-3 text-xs leading-relaxed text-zinc-400">
        Select a flow node to inspect its ports, live readings, and configuration.
      </div>
    );
  }

  if (!isStudioFlowNode(selectedNode)) {
    return (
      <LayoutNodeInspectorPanel
        borderColor={borderColor}
        panelColor={panelColor}
        selectedNode={selectedNode}
      />
    );
  }

  if (isMultiSelect && !homogeneousMultiEdit) {
    return (
      <div className={panelShellClass}>
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2">
          <NodeInspectorMultiLiveReadouts nodes={orderedSelectedNodes} />
        </div>
      </div>
    );
  }

  return (
    <div className={panelShellClass}>
      <TRNTabs
        value={activeTab}
        onValueChange={(next) => setActiveTabPersisted(next as InspectorMainTab)}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
      >
        <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
          <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
            {visibleTabs.map(({ id, label, Icon }) => (
              <TRNTabsTrigger key={id} value={id} className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
                {label}
              </TRNTabsTrigger>
            ))}
          </TRNTabsList>
        </div>
        <div className={TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS}>
          {dashboardSelectionContext != null ? (
            <div className="shrink-0 px-2.5 pt-2">
              <DashboardSelectionInspectorStrip
                widget={dashboardSelectionContext.widget}
                group={dashboardSelectionContext.group}
                groupLabel={dashboardSelectionContext.groupLabel}
                nodeLabel={selectedNode?.data.label}
                onFocusInGraph={() => onFocusDashboardSelectionInGraph(selectedNode.id)}
                onClearSelection={onClearDashboardSelection}
              />
            </div>
          ) : null}
          {homogeneousMultiEdit ? (
            <div className="shrink-0 border-b border-amber-900/30 bg-amber-950/20 px-2.5 py-1.5 text-[10px] leading-snug text-amber-100/90">
              Editing {orderedSelectedNodes.length} nodes — typed node settings apply to all
              selected (
              <span className="font-mono text-amber-50/95">{selectedNode.data.nodeId}</span>
              ). JSON edit is disabled; use a single selection for raw JSON.
            </div>
          ) : null}
          <InspectorContextBar
            label={selectedNode.data.label}
            nodeId={selectedNode.data.nodeId}
            catalogTitle={catalogEntry?.title}
            catalogDescription={catalogEntry?.description}
            catalogIconSlug={catalogEntry?.icon}
            category={selectedNode.data.category}
            categoryTint={categoryTint}
            activeTab={activeTab}
            lastUpdatedAt={selectedNode.data.lastUpdatedAt}
            sensorStreamMode={selectedNode.data.sensorStreamMode}
            sensorHealth={selectedNode.data.sensorHealth}
          />
          <div className={tabPanelClassName}>
            {activeTab === "details" ? (
              <NodeInspectorDetailsTab selectedNode={selectedNode} catalogEntry={catalogEntry} />
            ) : null}
            {activeTab === "live" ? (
              homogeneousMultiEdit ? (
                <NodeInspectorMultiLiveReadouts nodes={orderedSelectedNodes} />
              ) : (
                <NodeInspectorLiveTab selectedNode={selectedNode} />
              )
            ) : null}
            {activeTab === "animation" && isGlbAnimationBundle ? (
              <GlbAnimationBundleAnimationInspectorTab
                selectedNode={selectedNode}
                onUpdateConfigField={onUpdateConfigField}
                sourceKeyDraft={sourceKeyDraft}
                setSourceKeyDraft={setSourceKeyDraft}
                sourceKeyFieldError={sourceKeyFieldError}
                setSourceKeyFieldError={setSourceKeyFieldError}
              />
            ) : null}
            {activeTab === "node" ? (
              <NodeInspectorNodeTab
                selectedNode={selectedNode}
                catalogDefinitionTitle={catalogEntry?.title ?? ""}
                hasScene3dInspector={hasScene3dInspector}
                suppressDefaultConfigJson={homogeneousMultiEdit}
                onUpdateLabel={onUpdateLabel}
                onUpdateNodeUiAllowBodyCollapse={onUpdateNodeUiAllowBodyCollapse}
                onUpdateConfigField={onUpdateConfigField}
                onUpdateConfigJson={onUpdateConfigJson}
                jsonDraft={jsonDraft}
                setJsonDraft={setJsonDraft}
                jsonError={jsonError}
                setJsonError={setJsonError}
                sourceKeyDraft={sourceKeyDraft}
                setSourceKeyDraft={setSourceKeyDraft}
                sourceKeyFieldError={sourceKeyFieldError}
                setSourceKeyFieldError={setSourceKeyFieldError}
              />
            ) : null}
            {activeTab === "device" && deviceSourceId != null ? (
              <NodeInspectorDeviceTab sourceId={deviceSourceId} />
            ) : null}
          </div>
        </div>
      </TRNTabs>
    </div>
  );
}
