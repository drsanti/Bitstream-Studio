import {
  Activity,
  Box,
  Clapperboard,
  ClipboardList,
  Cpu,
  MonitorPlay,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import { resolveStudioNodeSourceId } from "../../../core/device/resolve-studio-node-source-id";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
} from "../../../../ui/TRN";
import { isScene3dInspectorNodeId } from "../nodes/scene3d/scene3d-inspector-node-ids";
import type { FlowGraphNode, StudioNode } from "../store/flow-editor.store";
import { isStudioFlowNode } from "../layout/layout-port-resolution";
import { LayoutNodeInspectorPanel } from "./inspector/LayoutNodeInspectorPanel";
import { NodeInspectorDetailsTab } from "./inspector/NodeInspectorDetailsTab";
import { NodeInspectorDeviceTab } from "./inspector/NodeInspectorDeviceTab";
import { InspectorContextBar } from "./inspector/InspectorContextBar";
import { NodeInspectorLiveTab } from "./inspector/NodeInspectorLiveTab";
import { NodeInspectorMultiLiveReadouts } from "./inspector/NodeInspectorMultiLiveReadouts";
import { GlbAnimationBundleAnimationInspectorTab } from "./inspector/GlbAnimationBundleAnimationInspectorTab";
import { NodeInspectorNodeTab } from "./inspector/NodeInspectorNodeTab";
import {
  CanvasInspectorPanel,
  type CanvasInspectorPanelProps,
} from "./inspector/CanvasInspectorPanel";
import { DashboardInspectorPanel } from "./inspector/DashboardInspectorPanel";
import { DashboardSelectionInspectorStrip } from "./inspector/DashboardSelectionInspectorStrip";
import { StageWorkbenchInspectorPanel } from "./inspector/StageWorkbenchInspectorPanel";
import {
  flattenDashboardInspectorWidgets,
  resolveDashboardDisplayItems,
} from "../../../core/dashboard/dashboard-inspector-helpers";
import { useDashboardSceneStore } from "../../../state/dashboard-scene.store";
import { useStudioWorkbenchFocusStore } from "../../../state/studio-workbench-focus.store";
import { useStageSceneStore } from "../../../state/stage-scene.store";
import { flowNodeIdsForSceneObjectRef } from "../../../core/stage/scene-object-ref";
import { readFlowGraphInspectorStoreRevision } from "../flow-graph-store-revisions";
import { useFlowEditorStore } from "../store/flow-editor.store";
import {
  readStoredInspectorActiveTab,
  writeStoredInspectorActiveTab,
  type InspectorMainTab,
} from "./inspector/node-inspector-ui-persistence";

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

export type NodeInspectorProps = {
  borderColor: string;
  panelColor: string;
  selectedNode: FlowGraphNode | null;
  /** Full flow selection order; when more than one node, inspector shows multi live readouts only. */
  orderedSelectedNodes?: FlowGraphNode[];
  /** Node catalog (definition title + description for the selected type). */
  catalogEntries: NodeCatalogEntry[];
  /** Minimap / category chips (same colors as the flow canvas). */
  categoryColors: Record<NodeCatalogEntry["category"], string>;
  onUpdateLabel: (nextLabel: string) => void;
  onUpdateNodeUiAllowBodyCollapse: (allow: boolean) => void;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  onUpdateConfigJson: (
    nextJson: string,
  ) => { ok: true } | { ok: false; message: string };
  /** When no node is selected, show canvas-level controls (omit for legacy layouts). */
  canvasInspector?: Omit<
    CanvasInspectorPanelProps,
    "nodes" | "edges" | "orderedSelectedNodes"
  >;
  nodes?: CanvasInspectorPanelProps["nodes"];
  edges?: CanvasInspectorPanelProps["edges"];
  orderedSelectedNodesForCanvas?: CanvasInspectorPanelProps["orderedSelectedNodes"];
};

export function NodeInspector(props: NodeInspectorProps) {
  const {
    borderColor,
    panelColor,
    selectedNode: selectedNodeProp,
    orderedSelectedNodes: orderedSelectedNodesProp,
    catalogEntries,
    categoryColors,
    onUpdateLabel,
    onUpdateNodeUiAllowBodyCollapse,
    onUpdateConfigField,
    onUpdateConfigJson,
    canvasInspector,
    nodes: canvasNodes,
    edges: canvasEdges,
    orderedSelectedNodesForCanvas,
  } = props;

  const activeEditorType = useStudioWorkbenchFocusStore((s) => s.activeEditorType);
  const selectedSceneObject = useStageSceneStore((s) => s.selectedSceneObject);
  const setSelectedSceneObject = useStageSceneStore((s) => s.setSelectedSceneObject);
  const inspectorStoreRevision = useFlowEditorStore((s) =>
    readFlowGraphInspectorStoreRevision({
      nodes: s.nodes,
      edges: s.edges,
      selectedNodeIds: s.selectedNodeIds,
      selectedNodeId: s.selectedNodeId,
    }),
  );
  const flowNodes = useMemo(
    () => useFlowEditorStore.getState().nodes,
    [inspectorStoreRevision],
  );
  const flowEdges = useMemo(
    () => useFlowEditorStore.getState().edges,
    [inspectorStoreRevision],
  );
  const selectStudioNodesByIds = useFlowEditorStore((s) => s.selectStudioNodesByIds);
  const fitFlowCanvasToNodeIds = useFlowEditorStore((s) => s.fitFlowCanvasToNodeIds);
  const setActiveEditorType = useStudioWorkbenchFocusStore((s) => s.setActiveEditorType);
  const dashboardSnapshot = useDashboardSceneStore((s) => s.snapshot);
  const highlightedWidgetSourceNodeId = useDashboardSceneStore(
    (s) => s.highlightedWidgetSourceNodeId,
  );
  const activeDashboardTabSourceNodeId = useDashboardSceneStore((s) => s.activeTabSourceNodeId);
  const setHighlightedWidgetSourceNodeId = useDashboardSceneStore(
    (s) => s.setHighlightedWidgetSourceNodeId,
  );

  const stageDerivedNode = useMemo(() => {
    if (selectedSceneObject == null) {
      return null;
    }
    return flowNodes.find((n) => n.id === selectedSceneObject.sourceNodeId) ?? null;
  }, [flowNodes, selectedSceneObject]);

  const stageWorkbenchActive =
    activeEditorType === "stage" &&
    canvasInspector?.stagePresentationPreferences != null &&
    canvasInspector?.onStagePresentationPreferencesChange != null;

  const flowPaneFromCanvasSelection =
    stageWorkbenchActive &&
    selectedNodeProp != null &&
    isStudioFlowNode(selectedNodeProp);

  const flowPaneNode = useMemo((): StudioNode | null => {
    if (!stageWorkbenchActive) {
      return null;
    }
    if (selectedNodeProp != null && isStudioFlowNode(selectedNodeProp)) {
      return selectedNodeProp;
    }
    if (stageDerivedNode != null) {
      return stageDerivedNode;
    }
    return null;
  }, [selectedNodeProp, stageDerivedNode, stageWorkbenchActive]);

  const orderedSelectedNodes = useMemo(() => {
    if (stageWorkbenchActive) {
      return stageDerivedNode != null ? [stageDerivedNode] : [];
    }
    if (orderedSelectedNodesProp != null && orderedSelectedNodesProp.length > 0) {
      return orderedSelectedNodesProp;
    }
    return selectedNodeProp != null ? [selectedNodeProp] : [];
  }, [
    orderedSelectedNodesProp,
    selectedNodeProp,
    stageDerivedNode,
    stageWorkbenchActive,
  ]);

  const selectedNode = orderedSelectedNodes[0] ?? null;
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
  const [sourceKeyFieldError, setSourceKeyFieldError] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<InspectorMainTab>(() =>
    readStoredInspectorActiveTab(),
  );
  const selectedNodeId = selectedNode?.id ?? null;
  const flowPaneNodeId = flowPaneNode?.id ?? null;

  const setActiveTabPersisted = useCallback((next: InspectorMainTab) => {
    setActiveTab(next);
    writeStoredInspectorActiveTab(next);
  }, []);
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

  /** Selection defaults: GLB bundle → Animation; hardware-linked → Live. */
  useEffect(() => {
    if (selectedNode == null) {
      return;
    }
    if (selectedNode.data.nodeId === "glb-animation-bundle") {
      setActiveTabPersisted("animation");
      return;
    }
    if (deviceSourceId != null) {
      setActiveTabPersisted("live");
    }
  }, [
    selectedNodeId,
    deviceSourceId,
    selectedNode?.data.nodeId,
    setActiveTabPersisted,
  ]);

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

  const categoryTint =
    selectedNode != null
      ? (categoryColors[selectedNode.data.category] ?? "#a1a1aa")
      : "#a1a1aa";
  const hasScene3dInspector =
    selectedNode != null && isScene3dInspectorNodeId(selectedNode.data.nodeId);

  const visibleTabs = useMemo(() => {
    if (isGlbAnimationBundle) {
      const tabs: { id: InspectorMainTab; label: string; Icon: LucideIcon }[] =
        [
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

  const onFocusStageSelectionInGraph = useCallback(() => {
    if (selectedSceneObject == null) {
      return;
    }
    const ids = flowNodeIdsForSceneObjectRef(selectedSceneObject);
    selectStudioNodesByIds(ids);
    fitFlowCanvasToNodeIds(ids);
  }, [fitFlowCanvasToNodeIds, selectStudioNodesByIds, selectedSceneObject]);

  const onSelectFlowNodeForStageInspector = useCallback(
    (nodeId: string) => {
      selectStudioNodesByIds([nodeId]);
      fitFlowCanvasToNodeIds([nodeId]);
    },
    [fitFlowCanvasToNodeIds, selectStudioNodesByIds],
  );

  const onClearStageSelection = useCallback(() => {
    setSelectedSceneObject(null);
    selectStudioNodesByIds([]);
  }, [selectStudioNodesByIds, setSelectedSceneObject]);

  const showDashboardInspector =
    activeEditorType === "dashboard" &&
    selectedNode == null &&
    dashboardSnapshot.dashboardOutputNodeId != null;

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
      if (item.kind === "group" && item.group.sourceNodeId === highlightedWidgetSourceNodeId) {
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

  const onFocusDashboardSelectionInGraph = useCallback(() => {
    if (selectedNode == null) {
      return;
    }
    selectStudioNodesByIds([selectedNode.id]);
    setActiveEditorType("flow");
    fitFlowCanvasToNodeIds([selectedNode.id]);
  }, [
    fitFlowCanvasToNodeIds,
    selectStudioNodesByIds,
    selectedNode,
    setActiveEditorType,
  ]);

  const onClearDashboardSelection = useCallback(() => {
    setHighlightedWidgetSourceNodeId(null);
    selectStudioNodesByIds([]);
  }, [selectStudioNodesByIds, setHighlightedWidgetSourceNodeId]);

  return (
    <section
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col rounded border p-2"
      style={{
        borderColor,
        backgroundColor: panelColor,
      }}
    >
      <div className="mb-2 shrink-0">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
          {stageWorkbenchActive ? (
            <MonitorPlay
              className="h-3.5 w-3.5 shrink-0 text-violet-400/90"
              aria-hidden
            />
          ) : (
            <SlidersHorizontal
              className="h-3.5 w-3.5 shrink-0 text-zinc-400"
              aria-hidden
            />
          )}
          {stageWorkbenchActive ? "3D Scene" : "Inspector"}
        </div>
      </div>
      {stageWorkbenchActive ? (
        <StageWorkbenchInspectorPanel
          selectedSceneObject={selectedSceneObject}
          boundNode={stageDerivedNode}
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
          onFocusSelectionInGraph={onFocusStageSelectionInGraph}
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
      ) : selectedNode == null ? (
        showDashboardInspector ? (
          <DashboardInspectorPanel />
        ) : canvasInspector != null &&
          canvasNodes != null &&
          canvasEdges != null &&
          orderedSelectedNodesForCanvas != null ? (
          <CanvasInspectorPanel
            nodes={canvasNodes}
            edges={canvasEdges}
            orderedSelectedNodes={orderedSelectedNodesForCanvas}
            {...canvasInspector}
          />
        ) : (
          <div className="min-h-0 flex-1 text-xs leading-relaxed text-zinc-400">
            Select a flow node to inspect its ports, live readings, and
            configuration.
          </div>
        )
      ) : selectedNode != null && !isStudioFlowNode(selectedNode) ? (
        <LayoutNodeInspectorPanel
          borderColor={borderColor}
          panelColor={panelColor}
          selectedNode={selectedNode}
        />
      ) : isMultiSelect && !homogeneousMultiEdit ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
          <div className="shrink-0 border-b border-zinc-800/70 px-2.5 pb-1.5 pt-2 text-[11px] font-semibold tracking-wide text-zinc-100/90">
            Live — {orderedSelectedNodes.length} nodes
          </div>
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2">
            <NodeInspectorMultiLiveReadouts nodes={orderedSelectedNodes} />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
          {dashboardSelectionContext != null ? (
            <div className="shrink-0 px-2.5 pt-2">
              <DashboardSelectionInspectorStrip
                widget={dashboardSelectionContext.widget}
                group={dashboardSelectionContext.group}
                groupLabel={dashboardSelectionContext.groupLabel}
                nodeLabel={selectedNode?.data.label}
                onFocusInGraph={onFocusDashboardSelectionInGraph}
                onClearSelection={onClearDashboardSelection}
              />
            </div>
          ) : null}
          <TRNTabs
            value={activeTab}
            onValueChange={(next) =>
              setActiveTabPersisted(next as InspectorMainTab)
            }
            className="flex min-h-0 min-w-0 flex-1 flex-col"
            activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
          >
            <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
              <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
                {visibleTabs.map(({ id, label, Icon }) => (
                  <TRNTabsTrigger
                    key={id}
                    value={id}
                    className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
                  >
                    <Icon
                      className="h-3.5 w-3.5 shrink-0 opacity-85"
                      aria-hidden
                    />
                    {label}
                  </TRNTabsTrigger>
                ))}
              </TRNTabsList>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {homogeneousMultiEdit ? (
                <div className="shrink-0 border-b border-amber-900/30 bg-amber-950/20 px-2.5 py-1.5 text-[10px] leading-snug text-amber-100/90">
                  Editing {orderedSelectedNodes.length} nodes — typed node
                  settings apply to all selected (
                  <span className="font-mono text-amber-50/95">
                    {selectedNode.data.nodeId}
                  </span>
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
                  <NodeInspectorDetailsTab
                    selectedNode={selectedNode}
                    catalogEntry={catalogEntry}
                  />
                ) : null}

                {activeTab === "live" ? (
                  homogeneousMultiEdit ? (
                    <div className="space-y-2">
                      <NodeInspectorMultiLiveReadouts
                        nodes={orderedSelectedNodes}
                      />
                    </div>
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
                    onUpdateNodeUiAllowBodyCollapse={
                      onUpdateNodeUiAllowBodyCollapse
                    }
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
      )}
    </section>
  );
}
