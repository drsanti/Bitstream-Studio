import assert from "node:assert/strict";
import { test } from "node:test";
import {
  areInspectorPinTargetsEqual,
  inspectorPinTargetKey,
  resolveInspectorPaneOwnerLabel,
  type StudioInspectorPinTarget,
} from "../../src/webview/sensor-studio/features/editor/components/inspector/studio-inspector-pin";

const emptyView = {
  stageWorkbenchActive: false,
  selectedSceneObject: null,
  selectedNode: null,
  orderedSelectedNodes: [],
  flowPaneNode: null,
  flowPaneFromCanvasSelection: false,
  showDashboardInspector: false,
  highlightedWidgetSourceNodeId: null,
};

test("inspectorPinTargetKey distinguishes pin kinds", () => {
  const canvas: StudioInspectorPinTarget = { kind: "canvas", label: "Flow canvas" };
  const flow: StudioInspectorPinTarget = {
    kind: "flow-node",
    nodeIds: ["a", "b"],
    label: "Node",
  };
  assert.notEqual(inspectorPinTargetKey(canvas), inspectorPinTargetKey(flow));
  assert.equal(
    inspectorPinTargetKey({ kind: "flow-node", nodeIds: ["b", "a"], label: "Node" }),
    inspectorPinTargetKey(flow),
  );
});

test("resolveInspectorPaneOwnerLabel uses pin target on pinned slot", () => {
  const dashboard: StudioInspectorPinTarget = { kind: "dashboard-overview", label: "Dashboard" };
  assert.equal(
    resolveInspectorPaneOwnerLabel({
      view: emptyView,
      slot: "pinned",
      pinTarget: dashboard,
      captureTarget: { kind: "canvas", label: "Flow canvas" },
      showDualPaneRoles: true,
      fallbackPaneTitle: "Inspector",
      catalogEntries: [],
    }),
    "Dashboard",
  );
});

test("resolveInspectorPaneOwnerLabel uses capture target for active dual pane", () => {
  assert.equal(
    resolveInspectorPaneOwnerLabel({
      view: emptyView,
      slot: "active",
      pinTarget: { kind: "dashboard-overview", label: "Dashboard" },
      captureTarget: { kind: "canvas", label: "Flow canvas" },
      showDualPaneRoles: true,
      fallbackPaneTitle: "Flow canvas",
      catalogEntries: [],
    }),
    "Flow canvas",
  );
});

test("areInspectorPinTargetsEqual compares keys", () => {
  const a: StudioInspectorPinTarget = { kind: "canvas", label: "Flow canvas" };
  const b: StudioInspectorPinTarget = { kind: "canvas", label: "Other label" };
  const c: StudioInspectorPinTarget = { kind: "dashboard-overview", label: "Dashboard" };
  assert.equal(areInspectorPinTargetsEqual(a, b), true);
  assert.equal(areInspectorPinTargetsEqual(a, c), false);
  assert.equal(areInspectorPinTargetsEqual(null, a), false);
});
