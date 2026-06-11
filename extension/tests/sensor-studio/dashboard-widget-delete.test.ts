import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDashboardWidgetDeletionIds } from "../../src/webview/sensor-studio/core/dashboard/dashboard-widget-delete";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function node(id: string, catalogNodeId: string): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId: catalogNodeId,
      label: id,
      defaultConfig: {},
    },
  } as FlowGraphNode;
}

describe("dashboard-widget-delete", () => {
  it("deletes widgets and expands group selection to wired children", () => {
    const nodes = [
      node("group-1", "dashboard-group"),
      node("child-1", "dashboard-text"),
      node("child-2", "dashboard-gauge"),
      node("solo", "dashboard-button"),
      node("output", "dashboard-output"),
    ];
    const edges = [
      {
        id: "e1",
        source: "child-1",
        target: "group-1",
        sourceHandle: "widget",
        targetHandle: "widgets",
      },
      {
        id: "e2",
        source: "child-2",
        target: "group-1",
        sourceHandle: "widget",
        targetHandle: "widgets",
      },
    ];
    const ids = resolveDashboardWidgetDeletionIds({
      nodes,
      edges,
      selectedSourceNodeIds: ["group-1", "solo", "output"],
    });
    assert.deepEqual(new Set(ids), new Set(["group-1", "child-1", "child-2", "solo"]));
  });
});
