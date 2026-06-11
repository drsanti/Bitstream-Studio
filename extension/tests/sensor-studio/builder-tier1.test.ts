import assert from "node:assert/strict";
import { test } from "node:test";
import {
  expandFlowLensScopeWithFrameAncestors,
  collectFlowOutputUpstreamScope,
} from "../../src/webview/sensor-studio/core/flow/flow-output-lens";
import {
  nudgeDashboardGridPlacement,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-grid-editor-ops";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function studioNode(id: string, nodeId: string, parentId?: string): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    parentId,
    data: { label: id, category: "input", nodeId, defaultConfig: {} },
  } as FlowGraphNode;
}

function frameNode(id: string): FlowGraphNode {
  return {
    id,
    type: "studio-frame",
    position: { x: 0, y: 0 },
    data: { label: "Frame", autoFit: false },
  } as FlowGraphNode;
}

test("expandFlowLensScopeWithFrameAncestors includes parent frames", () => {
  const nodes = [frameNode("frame-1"), studioNode("gauge", "dashboard-gauge", "frame-1")];
  const expanded = expandFlowLensScopeWithFrameAncestors(nodes, new Set(["gauge"]));
  assert.equal(expanded.has("gauge"), true);
  assert.equal(expanded.has("frame-1"), true);
});

test("collectFlowOutputUpstreamScope includes frame around scoped nodes", () => {
  const nodes = [
    frameNode("frame-1"),
    studioNode("sensor", "sensor-input", "frame-1"),
    studioNode("out", "dashboard-output"),
  ];
  const edges = [
    { id: "e1", source: "sensor", target: "out" },
  ];
  const scope = collectFlowOutputUpstreamScope(nodes, edges, "dashboard-output");
  assert.ok(scope != null);
  assert.equal(scope!.nodeIds.has("frame-1"), true);
  assert.equal(scope!.nodeIds.has("sensor"), true);
});

test("nudgeDashboardGridPlacement moves within grid and respects bounds", () => {
  const placement = { column: 2, row: 2, columnSpan: 2, rowSpan: 1 };
  const next = nudgeDashboardGridPlacement({
    placement,
    direction: "right",
    gridColumns: 12,
    otherPlacements: [],
  });
  assert.deepEqual(next, { column: 3, row: 2, columnSpan: 2, rowSpan: 1 });
});

test("nudgeDashboardGridPlacement blocks overlap", () => {
  const placement = { column: 2, row: 2, columnSpan: 2, rowSpan: 1 };
  const blocked = nudgeDashboardGridPlacement({
    placement,
    direction: "right",
    gridColumns: 12,
    otherPlacements: [{ column: 3, row: 2, columnSpan: 2, rowSpan: 1 }],
  });
  assert.equal(blocked, null);
});
