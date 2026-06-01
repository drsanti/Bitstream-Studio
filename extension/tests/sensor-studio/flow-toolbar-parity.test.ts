import assert from "node:assert/strict";
import test from "node:test";

import {
  filterInputHandlesForDisplay,
  isSocketValuesVisible,
  isSocketsExpanded,
  nextSocketsExpandedForBatch,
  shouldShowSocketRow,
} from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/socket-display";
import { createFrameAroundNodes } from "../../src/webview/sensor-studio/features/editor/layout/frame-flow-nodes";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

test("isSocketsExpanded defaults to true", () => {
  assert.equal(isSocketsExpanded(undefined), true);
  assert.equal(isSocketsExpanded({ socketsExpanded: false }), false);
});

test("isSocketValuesVisible defaults to true", () => {
  assert.equal(isSocketValuesVisible(undefined), true);
  assert.equal(isSocketValuesVisible({ socketValuesVisible: false }), false);
});

test("shouldShowSocketRow hides unwired pins when collapsed", () => {
  const edges = [{ id: "e1", source: "a", target: "b", targetHandle: "in" }];
  assert.equal(shouldShowSocketRow("b", "in", edges, "input", false, []), true);
  assert.equal(shouldShowSocketRow("b", "env", edges, "input", false, []), false);
});

test("filterInputHandlesForDisplay keeps wired handles when collapsed", () => {
  const handles = [
    { id: "in", portType: "string" as const, label: "Model" },
    { id: "env", portType: "environment" as const, label: "Environment" },
  ];
  const edges = [{ id: "e1", source: "s", target: "n1", targetHandle: "env" }];
  const visible = filterInputHandlesForDisplay("n1", handles, edges, false);
  assert.deepEqual(visible.map((h) => h.id), ["env"]);
});

test("nextSocketsExpandedForBatch toggles batch state", () => {
  const nodes = [
    {
      id: "n1",
      type: "studio",
      data: { ui: { socketsExpanded: true } },
    },
  ] as FlowGraphNode[];
  assert.equal(nextSocketsExpandedForBatch(nodes, ["n1"]), false);
});

test("createFrameAroundNodes wraps content nodes", () => {
  const content = [
    {
      id: "a",
      type: "studio",
      position: { x: 100, y: 80 },
      data: { label: "A", nodeId: "math", category: "transform", defaultConfig: {} },
    },
  ] as FlowGraphNode[];
  const { frame, children } = createFrameAroundNodes(content);
  assert.equal(frame.type, "studio-frame");
  assert.equal(children.length, 1);
  assert.equal(children[0]?.parentId, frame.id);
});
