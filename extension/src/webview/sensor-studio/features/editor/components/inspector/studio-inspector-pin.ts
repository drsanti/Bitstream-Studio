import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import type { SceneObjectRefV1 } from "../../../../core/stage/scene-object-ref";
import type { FlowGraphNode, StudioNode } from "../../store/flow-editor.store";
import { isStudioFlowNode } from "../../layout/layout-port-resolution";

/** Pinned inspector target (Phase 1 — single inspector, no persistence). */
export type StudioInspectorPinTarget =
  | {
      kind: "flow-node";
      nodeIds: string[];
      label: string;
    }
  | {
      kind: "dashboard-overview";
      label: string;
    }
  | {
      kind: "dashboard-widget";
      sourceNodeId: string;
      label: string;
    }
  | {
      kind: "stage";
      sceneObject: SceneObjectRefV1 | null;
      flowNodeId: string | null;
      label: string;
    }
  | {
      kind: "layout-node";
      nodeId: string;
      label: string;
    }
  | {
      kind: "canvas";
      label: string;
    };

export type InspectorFollowSnapshot = {
  stageWorkbenchActive: boolean;
  selectedSceneObject: SceneObjectRefV1 | null;
  selectedNode: FlowGraphNode | null;
  orderedSelectedNodes: FlowGraphNode[];
  flowPaneNode: StudioNode | null;
  flowPaneFromCanvasSelection: boolean;
  showDashboardInspector: boolean;
  highlightedWidgetSourceNodeId: string | null;
  dashboardOutputNodeId: string | null;
  canvasInspectorAvailable: boolean;
  isMultiSelect: boolean;
  homogeneousMultiEdit: boolean;
};

export type EffectiveInspectorView = {
  stageWorkbenchActive: boolean;
  selectedSceneObject: SceneObjectRefV1 | null;
  selectedNode: FlowGraphNode | null;
  orderedSelectedNodes: FlowGraphNode[];
  flowPaneNode: StudioNode | null;
  flowPaneFromCanvasSelection: boolean;
  showDashboardInspector: boolean;
  highlightedWidgetSourceNodeId: string | null;
};

export function inspectorPinTargetKey(target: StudioInspectorPinTarget): string {
  switch (target.kind) {
    case "flow-node":
      return `flow:${[...target.nodeIds].sort().join(",")}`;
    case "dashboard-overview":
      return "dashboard-overview";
    case "dashboard-widget":
      return `dashboard-widget:${target.sourceNodeId}`;
    case "layout-node":
      return `layout-node:${target.nodeId}`;
    case "canvas":
      return "canvas";
    case "stage": {
      const objectPath = target.sceneObject?.objectPath ?? "";
      const flowNodeId = target.flowNodeId ?? "";
      return `stage:${objectPath}:${flowNodeId}`;
    }
    default:
      return "unknown";
  }
}

export function areInspectorPinTargetsEqual(
  a: StudioInspectorPinTarget | null,
  b: StudioInspectorPinTarget | null,
): boolean {
  if (a == null || b == null) {
    return false;
  }
  return inspectorPinTargetKey(a) === inspectorPinTargetKey(b);
}

export function resolveInspectorPaneOwnerLabel(args: {
  view: EffectiveInspectorView;
  slot: "active" | "pinned";
  pinTarget: StudioInspectorPinTarget | null;
  captureTarget: StudioInspectorPinTarget | null;
  showDualPaneRoles: boolean;
  fallbackPaneTitle: string;
  catalogEntries: readonly NodeCatalogEntry[];
}): string {
  const {
    view,
    slot,
    pinTarget,
    captureTarget,
    showDualPaneRoles,
    fallbackPaneTitle,
    catalogEntries,
  } = args;

  if (slot === "pinned" && pinTarget != null) {
    return formatInspectorPinLabel(pinTarget);
  }
  if (showDualPaneRoles && captureTarget != null) {
    return formatInspectorPinLabel(captureTarget);
  }

  const node = view.selectedNode;
  if (node != null && isStudioFlowNode(node)) {
    const customLabel = node.data.label?.trim();
    if (customLabel != null && customLabel.length > 0) {
      return customLabel;
    }
    const catalog = catalogEntries.find((entry) => entry.id === node.data.nodeId);
    const catalogTitle = catalog?.title?.trim();
    if (catalogTitle != null && catalogTitle.length > 0) {
      return catalogTitle;
    }
    return node.data.nodeId;
  }

  return fallbackPaneTitle;
}

export function formatInspectorPinLabel(target: StudioInspectorPinTarget): string {
  const label = target.label.trim();
  if (label.length > 0) {
    return label;
  }
  switch (target.kind) {
    case "dashboard-overview":
      return "Dashboard";
    case "canvas":
      return "Flow canvas";
    case "flow-node":
      return target.nodeIds[0] ?? "Flow node";
    case "dashboard-widget":
      return target.sourceNodeId;
    case "layout-node":
      return target.nodeId;
    case "stage":
      return "3D Scene";
    default:
      return "Inspector";
  }
}

export function captureInspectorPinTarget(
  follow: InspectorFollowSnapshot,
): StudioInspectorPinTarget | null {
  if (follow.isMultiSelect && !follow.homogeneousMultiEdit) {
    return null;
  }

  if (follow.stageWorkbenchActive) {
    const label =
      follow.selectedSceneObject != null
        ? follow.flowPaneNode?.data.label?.trim() ||
          follow.selectedSceneObject.objectPath ||
          "3D object"
        : follow.flowPaneNode?.data.label?.trim() || "3D Scene";
    return {
      kind: "stage",
      sceneObject: follow.selectedSceneObject,
      flowNodeId: follow.flowPaneNode?.id ?? null,
      label,
    };
  }

  if (follow.showDashboardInspector) {
    return { kind: "dashboard-overview", label: "Dashboard" };
  }

  const primary = follow.selectedNode;
  if (primary != null && follow.highlightedWidgetSourceNodeId === primary.id) {
    return {
      kind: "dashboard-widget",
      sourceNodeId: primary.id,
      label: primary.data.label?.trim() || primary.data.nodeId,
    };
  }

  if (primary != null && !isStudioFlowNode(primary)) {
    return {
      kind: "layout-node",
      nodeId: primary.id,
      label: primary.data.label?.trim() || primary.data.nodeId,
    };
  }

  if (primary != null && isStudioFlowNode(primary)) {
    return {
      kind: "flow-node",
      nodeIds: follow.orderedSelectedNodes.map((n) => n.id),
      label: primary.data.label?.trim() || primary.data.nodeId,
    };
  }

  if (follow.canvasInspectorAvailable) {
    return { kind: "canvas", label: "Flow canvas" };
  }

  return null;
}

function resolveNodesByIds(
  flowNodes: FlowGraphNode[],
  nodeIds: string[],
): FlowGraphNode[] {
  const byId = new Map(flowNodes.map((n) => [n.id, n]));
  return nodeIds.map((id) => byId.get(id)).filter((n): n is FlowGraphNode => n != null);
}

export function isInspectorPinTargetValid(
  target: StudioInspectorPinTarget,
  flowNodes: FlowGraphNode[],
  dashboardOutputNodeId: string | null,
): boolean {
  switch (target.kind) {
    case "flow-node":
      return target.nodeIds.every((id) => flowNodes.some((n) => n.id === id));
    case "dashboard-overview":
      return dashboardOutputNodeId != null;
    case "dashboard-widget":
    case "layout-node":
      return flowNodes.some((n) => n.id === (target.kind === "dashboard-widget" ? target.sourceNodeId : target.nodeId));
    case "stage":
      if (target.flowNodeId != null) {
        return flowNodes.some((n) => n.id === target.flowNodeId);
      }
      if (target.sceneObject != null) {
        return flowNodes.some((n) => n.id === target.sceneObject!.sourceNodeId);
      }
      return false;
    case "canvas":
      return true;
    default:
      return false;
  }
}

export function resolveEffectiveInspectorView(args: {
  follow: InspectorFollowSnapshot;
  pinTarget: StudioInspectorPinTarget | null;
  isPinned: boolean;
  flowNodes: FlowGraphNode[];
  selectedNodeProp: FlowGraphNode | null;
  canvasInspectorHasStage: boolean;
}): EffectiveInspectorView {
  const { follow, pinTarget, isPinned, flowNodes, selectedNodeProp, canvasInspectorHasStage } =
    args;

  if (!isPinned || pinTarget == null) {
    return {
      stageWorkbenchActive: follow.stageWorkbenchActive,
      selectedSceneObject: follow.selectedSceneObject,
      selectedNode: follow.selectedNode,
      orderedSelectedNodes: follow.orderedSelectedNodes,
      flowPaneNode: follow.flowPaneNode,
      flowPaneFromCanvasSelection: follow.flowPaneFromCanvasSelection,
      showDashboardInspector: follow.showDashboardInspector,
      highlightedWidgetSourceNodeId: follow.highlightedWidgetSourceNodeId,
    };
  }

  switch (pinTarget.kind) {
    case "dashboard-overview":
      return {
        stageWorkbenchActive: false,
        selectedSceneObject: null,
        selectedNode: null,
        orderedSelectedNodes: [],
        flowPaneNode: null,
        flowPaneFromCanvasSelection: false,
        showDashboardInspector: follow.dashboardOutputNodeId != null,
        highlightedWidgetSourceNodeId: null,
      };

    case "dashboard-widget": {
      const node = flowNodes.find((n) => n.id === pinTarget.sourceNodeId) ?? null;
      return {
        stageWorkbenchActive: false,
        selectedSceneObject: null,
        selectedNode: node,
        orderedSelectedNodes: node != null ? [node] : [],
        flowPaneNode: null,
        flowPaneFromCanvasSelection: false,
        showDashboardInspector: false,
        highlightedWidgetSourceNodeId: pinTarget.sourceNodeId,
      };
    }

    case "layout-node": {
      const node = flowNodes.find((n) => n.id === pinTarget.nodeId) ?? null;
      return {
        stageWorkbenchActive: false,
        selectedSceneObject: null,
        selectedNode: node,
        orderedSelectedNodes: node != null ? [node] : [],
        flowPaneNode: null,
        flowPaneFromCanvasSelection: false,
        showDashboardInspector: false,
        highlightedWidgetSourceNodeId: null,
      };
    }

    case "flow-node": {
      const ordered = resolveNodesByIds(flowNodes, pinTarget.nodeIds);
      const primary = ordered[0] ?? null;
      const studioPrimary =
        primary != null && isStudioFlowNode(primary) ? primary : null;
      return {
        stageWorkbenchActive: false,
        selectedSceneObject: null,
        selectedNode: primary,
        orderedSelectedNodes: ordered,
        flowPaneNode: studioPrimary,
        flowPaneFromCanvasSelection: false,
        showDashboardInspector: false,
        highlightedWidgetSourceNodeId: null,
      };
    }

    case "canvas":
      return {
        stageWorkbenchActive: false,
        selectedSceneObject: null,
        selectedNode: null,
        orderedSelectedNodes: [],
        flowPaneNode: null,
        flowPaneFromCanvasSelection: false,
        showDashboardInspector: false,
        highlightedWidgetSourceNodeId: null,
      };

    case "stage": {
      const stageActive = canvasInspectorHasStage;
      const pinnedFlowNode =
        pinTarget.flowNodeId != null
          ? (flowNodes.find((n) => n.id === pinTarget.flowNodeId) as StudioNode | undefined) ??
            null
          : null;
      const sceneDerived =
        pinTarget.sceneObject != null
          ? (flowNodes.find((n) => n.id === pinTarget.sceneObject!.sourceNodeId) ?? null)
          : null;
      const flowPaneNode =
        pinnedFlowNode ??
        (sceneDerived != null && isStudioFlowNode(sceneDerived) ? sceneDerived : null);
      const flowPaneFromCanvasSelection =
        stageActive &&
        selectedNodeProp != null &&
        isStudioFlowNode(selectedNodeProp) &&
        pinTarget.flowNodeId === selectedNodeProp.id;

      return {
        stageWorkbenchActive: stageActive,
        selectedSceneObject: pinTarget.sceneObject,
        selectedNode: sceneDerived,
        orderedSelectedNodes: sceneDerived != null ? [sceneDerived] : [],
        flowPaneNode,
        flowPaneFromCanvasSelection,
        showDashboardInspector: false,
        highlightedWidgetSourceNodeId: null,
      };
    }

    default:
      return {
        stageWorkbenchActive: follow.stageWorkbenchActive,
        selectedSceneObject: follow.selectedSceneObject,
        selectedNode: follow.selectedNode,
        orderedSelectedNodes: follow.orderedSelectedNodes,
        flowPaneNode: follow.flowPaneNode,
        flowPaneFromCanvasSelection: follow.flowPaneFromCanvasSelection,
        showDashboardInspector: follow.showDashboardInspector,
        highlightedWidgetSourceNodeId: follow.highlightedWidgetSourceNodeId,
      };
  }
}
