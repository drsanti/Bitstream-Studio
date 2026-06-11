import { LayoutGrid, MonitorPlay, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import type { FlowGraphNode, StudioNode } from "../store/flow-editor.store";
import { isStudioFlowNode } from "../layout/layout-port-resolution";
import {
  CanvasInspectorPanel,
  type CanvasInspectorPanelProps,
} from "./inspector/CanvasInspectorPanel";
import { useDashboardSceneStore } from "../../../state/dashboard-scene.store";
import { useStudioWorkbenchFocusStore } from "../../../state/studio-workbench-focus.store";
import { useStageSceneStore } from "../../../state/stage-scene.store";
import { flowNodeIdsForSceneObjectRef } from "../../../core/stage/scene-object-ref";
import { readFlowGraphInspectorStoreRevision } from "../flow-graph-store-revisions";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { InspectorPaneOwnerChrome } from "./inspector/InspectorPaneOwnerChrome";
import { InspectorPinToggle } from "./inspector/InspectorPinControls";
import { InspectorViewPanel } from "./inspector/InspectorViewPanel";
import { useOptionalStudioWorkbenchShell } from "../workbench/studio-workbench-context";
import { normalizeStudioInspectorWorkbenchLayout } from "../workbench/studio-inspector-pinned-pane-layout";
import {
  areInspectorPinTargetsEqual,
  captureInspectorPinTarget,
  formatInspectorPinLabel,
  isInspectorPinTargetValid,
  resolveEffectiveInspectorView,
  resolveInspectorPaneOwnerLabel,
  type InspectorFollowSnapshot,
} from "./inspector/studio-inspector-pin";
import { useStudioInspectorPinStore } from "../../../state/studio-inspector-pin.store";

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
  /** Workbench pane: no extra outer card — PaneFrame is the draggable shell. */
  variant?: "default" | "workbench";
  /** Active follow vs pinned target — each maps to its own workbench inspector pane. */
  inspectorSlot?: "active" | "pinned";
};

export function NodeInspector(props: NodeInspectorProps) {
  const {
    borderColor,
    panelColor,
    variant = "default",
    inspectorSlot = "active",
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
  const isInspectorPinned = useStudioInspectorPinStore((s) => s.isPinned);
  const inspectorPinTarget = useStudioInspectorPinStore((s) => s.target);
  const pinInspector = useStudioInspectorPinStore((s) => s.pin);
  const unpinInspector = useStudioInspectorPinStore((s) => s.unpin);

  const followStageDerivedNode = useMemo(() => {
    if (selectedSceneObject == null) {
      return null;
    }
    return flowNodes.find((n) => n.id === selectedSceneObject.sourceNodeId) ?? null;
  }, [flowNodes, selectedSceneObject]);

  const followStageWorkbenchActive =
    activeEditorType === "stage" &&
    canvasInspector?.stagePresentationPreferences != null &&
    canvasInspector?.onStagePresentationPreferencesChange != null;

  const followFlowPaneFromCanvasSelection =
    followStageWorkbenchActive &&
    selectedNodeProp != null &&
    isStudioFlowNode(selectedNodeProp);

  const followFlowPaneNode = useMemo((): StudioNode | null => {
    if (!followStageWorkbenchActive) {
      return null;
    }
    if (selectedNodeProp != null && isStudioFlowNode(selectedNodeProp)) {
      return selectedNodeProp;
    }
    if (followStageDerivedNode != null) {
      return followStageDerivedNode;
    }
    return null;
  }, [followStageDerivedNode, followStageWorkbenchActive, selectedNodeProp]);

  const followOrderedSelectedNodes = useMemo(() => {
    if (followStageWorkbenchActive) {
      return followStageDerivedNode != null ? [followStageDerivedNode] : [];
    }
    if (orderedSelectedNodesProp != null && orderedSelectedNodesProp.length > 0) {
      return orderedSelectedNodesProp;
    }
    return selectedNodeProp != null ? [selectedNodeProp] : [];
  }, [
    followStageDerivedNode,
    followStageWorkbenchActive,
    orderedSelectedNodesProp,
    selectedNodeProp,
  ]);

  const followSelectedNode = followOrderedSelectedNodes[0] ?? null;
  const followIsMultiSelect = followOrderedSelectedNodes.length > 1;
  const followHomogeneousMultiEdit = useMemo(() => {
    if (!followIsMultiSelect) {
      return false;
    }
    const first = followOrderedSelectedNodes[0];
    if (first == null || !isStudioFlowNode(first)) {
      return false;
    }
    const firstId = first.data.nodeId;
    return followOrderedSelectedNodes.every(
      (n) => isStudioFlowNode(n) && n.data.nodeId === firstId,
    );
  }, [followIsMultiSelect, followOrderedSelectedNodes]);

  const followShowDashboardInspector =
    activeEditorType === "dashboard" &&
    followSelectedNode == null &&
    dashboardSnapshot.dashboardOutputNodeId != null;

  const followSnapshot = useMemo((): InspectorFollowSnapshot => {
    return {
      stageWorkbenchActive: followStageWorkbenchActive,
      selectedSceneObject,
      selectedNode: followSelectedNode,
      orderedSelectedNodes: followOrderedSelectedNodes,
      flowPaneNode: followFlowPaneNode,
      flowPaneFromCanvasSelection: followFlowPaneFromCanvasSelection,
      showDashboardInspector: followShowDashboardInspector,
      highlightedWidgetSourceNodeId,
      dashboardOutputNodeId: dashboardSnapshot.dashboardOutputNodeId,
      canvasInspectorAvailable:
        canvasInspector != null &&
        canvasNodes != null &&
        canvasEdges != null &&
        orderedSelectedNodesForCanvas != null,
      isMultiSelect: followIsMultiSelect,
      homogeneousMultiEdit: followHomogeneousMultiEdit,
    };
  }, [
    canvasEdges,
    canvasInspector,
    canvasNodes,
    dashboardSnapshot.dashboardOutputNodeId,
    followFlowPaneFromCanvasSelection,
    followFlowPaneNode,
    followHomogeneousMultiEdit,
    followIsMultiSelect,
    followOrderedSelectedNodes,
    followSelectedNode,
    followShowDashboardInspector,
    followStageWorkbenchActive,
    highlightedWidgetSourceNodeId,
    orderedSelectedNodesForCanvas,
    selectedSceneObject,
  ]);

  const canvasInspectorHasStage =
    canvasInspector?.stagePresentationPreferences != null &&
    canvasInspector?.onStagePresentationPreferencesChange != null;

  const followView = useMemo(
    () =>
      resolveEffectiveInspectorView({
        follow: followSnapshot,
        pinTarget: null,
        isPinned: false,
        flowNodes,
        selectedNodeProp,
        canvasInspectorHasStage,
      }),
    [
      canvasInspectorHasStage,
      flowNodes,
      followSnapshot,
      selectedNodeProp,
    ],
  );

  const pinnedView = useMemo(() => {
    if (!isInspectorPinned || inspectorPinTarget == null) {
      return null;
    }
    return resolveEffectiveInspectorView({
      follow: followSnapshot,
      pinTarget: inspectorPinTarget,
      isPinned: true,
      flowNodes,
      selectedNodeProp,
      canvasInspectorHasStage,
    });
  }, [
    canvasInspectorHasStage,
    flowNodes,
    followSnapshot,
    inspectorPinTarget,
    isInspectorPinned,
    selectedNodeProp,
  ]);

  const pinCaptureTarget = useMemo(
    () => captureInspectorPinTarget(followSnapshot),
    [followSnapshot],
  );
  const pinTargetLabel = useMemo(() => {
    if (isInspectorPinned && inspectorPinTarget != null) {
      return formatInspectorPinLabel(inspectorPinTarget);
    }
    if (pinCaptureTarget != null) {
      return formatInspectorPinLabel(pinCaptureTarget);
    }
    return null;
  }, [inspectorPinTarget, isInspectorPinned, pinCaptureTarget]);

  useEffect(() => {
    if (!isInspectorPinned || inspectorPinTarget == null) {
      return;
    }
    if (
      !isInspectorPinTargetValid(
        inspectorPinTarget,
        flowNodes,
        dashboardSnapshot.dashboardOutputNodeId,
      )
    ) {
      unpinInspector();
    }
  }, [
    dashboardSnapshot.dashboardOutputNodeId,
    flowNodes,
    inspectorPinTarget,
    isInspectorPinned,
    unpinInspector,
  ]);

  const onPinInspector = useCallback(() => {
    const target = captureInspectorPinTarget(followSnapshot);
    if (target != null) {
      pinInspector(target);
    }
  }, [followSnapshot, pinInspector]);

  const onUnpinInspector = useCallback(() => {
    unpinInspector();
  }, [unpinInspector]);

  const needsPinnedWorkbenchPane =
    isInspectorPinned &&
    inspectorPinTarget != null &&
    pinCaptureTarget != null &&
    !areInspectorPinTargetsEqual(inspectorPinTarget, pinCaptureTarget);

  const workbenchRef = useOptionalStudioWorkbenchShell()?.workbenchRef;

  useEffect(() => {
    if (variant !== "workbench" || inspectorSlot !== "active" || workbenchRef?.current == null) {
      return;
    }
    workbenchRef.current.setLayout((layout) =>
      normalizeStudioInspectorWorkbenchLayout(layout, needsPinnedWorkbenchPane),
    );
  }, [inspectorSlot, needsPinnedWorkbenchPane, variant, workbenchRef]);

  const displayView =
    inspectorSlot === "pinned"
      ? pinnedView
      : followView;

  const inspectorPaneTitle = useMemo(() => {
    const view = displayView ?? followView;
    if (view.stageWorkbenchActive) {
      return { label: "3D Scene", Icon: MonitorPlay, accent: "text-violet-400/90" };
    }
    if (view.showDashboardInspector) {
      return { label: "2D Dashboard", Icon: LayoutGrid, accent: "text-cyan-400/90" };
    }
    if (view.selectedNode == null && canvasInspector != null && canvasNodes != null) {
      return { label: "Flow canvas", Icon: LayoutGrid, accent: "text-sky-400/90" };
    }
    return { label: "Inspector", Icon: SlidersHorizontal, accent: "text-zinc-400" };
  }, [canvasInspector, canvasNodes, displayView, followView]);

  const ownerLabel = useMemo(
    () =>
      resolveInspectorPaneOwnerLabel({
        view: displayView ?? followView,
        slot: inspectorSlot,
        pinTarget: inspectorPinTarget,
        captureTarget: pinCaptureTarget,
        showDualPaneRoles: needsPinnedWorkbenchPane,
        fallbackPaneTitle: inspectorPaneTitle.label,
        catalogEntries,
      }),
    [
      catalogEntries,
      displayView,
      followView,
      inspectorPaneTitle.label,
      inspectorPinTarget,
      inspectorSlot,
      needsPinnedWorkbenchPane,
      pinCaptureTarget,
    ],
  );

  const pinToggle =
    inspectorSlot === "active" ? (
      <InspectorPinToggle
        isPinned={isInspectorPinned}
        canPin={pinCaptureTarget != null}
        pinLabel={pinTargetLabel}
        onPin={onPinInspector}
        onUnpin={onUnpinInspector}
      />
    ) : (
      <InspectorPinToggle
        isPinned
        canPin={false}
        pinLabel={
          inspectorPinTarget != null ? formatInspectorPinLabel(inspectorPinTarget) : null
        }
        onPin={() => {}}
        onUnpin={onUnpinInspector}
      />
    );

  const onFocusStageSelectionInGraph = useCallback(
    (selection: Parameters<typeof flowNodeIdsForSceneObjectRef>[0]) => {
      const ids = flowNodeIdsForSceneObjectRef(selection);
      selectStudioNodesByIds(ids);
      fitFlowCanvasToNodeIds(ids);
    },
    [fitFlowCanvasToNodeIds, selectStudioNodesByIds],
  );

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

  const onFocusDashboardSelectionInGraph = useCallback(
    (sourceNodeId: string) => {
      selectStudioNodesByIds([sourceNodeId]);
      setActiveEditorType("flow");
      fitFlowCanvasToNodeIds([sourceNodeId]);
    },
    [fitFlowCanvasToNodeIds, selectStudioNodesByIds, setActiveEditorType],
  );

  const onClearDashboardSelection = useCallback(() => {
    setHighlightedWidgetSourceNodeId(null);
    selectStudioNodesByIds([]);
  }, [selectStudioNodesByIds, setHighlightedWidgetSourceNodeId]);

  const embeddedShell = variant === "workbench";

  const viewPanelProps = {
    embeddedShell,
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
  };

  const inspectorBody =
    displayView != null ? (
      <InspectorViewPanel
        role={inspectorSlot}
        view={displayView}
        {...viewPanelProps}
      />
    ) : null;

  if (inspectorSlot === "pinned" && (pinnedView == null || !isInspectorPinned)) {
    return null;
  }

  return (
    <section
      className={
        embeddedShell
          ? "flex min-h-0 w-full min-w-0 flex-1 flex-col px-2 pb-2 pt-1"
          : "flex min-h-0 w-full min-w-0 flex-1 flex-col rounded border p-2"
      }
      style={
        embeddedShell
          ? undefined
          : {
              borderColor,
              backgroundColor: panelColor,
            }
      }
    >
      {embeddedShell ? (
        <InspectorPaneOwnerChrome
          role={inspectorSlot}
          showRoleBadge={needsPinnedWorkbenchPane}
          label={ownerLabel}
          icon={inspectorPaneTitle.Icon}
          iconClassName={inspectorPaneTitle.accent}
          pinToggle={pinToggle}
        />
      ) : (
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <div className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-zinc-100">
            <inspectorPaneTitle.Icon
              className={`h-3.5 w-3.5 shrink-0 ${inspectorPaneTitle.accent}`}
              aria-hidden
            />
            <span className="truncate">{ownerLabel}</span>
          </div>
          {pinToggle}
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{inspectorBody}</div>
    </section>
  );
}
