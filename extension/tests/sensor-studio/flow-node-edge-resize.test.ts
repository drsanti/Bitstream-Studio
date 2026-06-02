import assert from "node:assert/strict";
import test from "node:test";
import {
  computeResizedFlowNodeRect,
  readNodeLayoutRect,
} from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/FlowNodeEdgeResize";
import type { StudioNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function studioNode(partial: Partial<StudioNode>): StudioNode {
  return {
    id: "radial-1",
    type: "studio",
    position: { x: 120, y: 80 },
    data: {
      label: "Radial Gauge",
      category: "output",
      nodeId: "radial-gauge",
      defaultConfig: {},
    },
    ...partial,
  };
}

test("readNodeLayoutRect prefers explicit node width over intrinsic shell size", () => {
  const node = studioNode({
    width: 220,
    height: 180,
    measured: { width: 140, height: 160 },
  });
  const shell = { offsetWidth: 94, offsetHeight: 202 } as HTMLElement;
  const rect = readNodeLayoutRect(node, shell);
  assert.equal(rect.width, 220);
  assert.equal(rect.height, 180);
  assert.equal(rect.x, 120);
  assert.equal(rect.y, 80);
});

test("readNodeLayoutRect falls back to shell when node has no explicit size", () => {
  const node = studioNode({
    measured: { width: 140, height: 160 },
  });
  const shell = { offsetWidth: 196, offsetHeight: 210 } as HTMLElement;
  const rect = readNodeLayoutRect(node, shell);
  assert.equal(rect.width, 196);
  assert.equal(rect.height, 210);
});

test("computeResizedFlowNodeRect — southeast keeps position", () => {
  const base = { x: 100, y: 80, width: 400, height: 300 };
  const next = computeResizedFlowNodeRect("se", base, 50, 40, 170, 180);
  assert.equal(next.width, 450);
  assert.equal(next.height, 340);
  assert.equal(next.x, 100);
  assert.equal(next.y, 80);
});

test("computeResizedFlowNodeRect — west anchors to right edge", () => {
  const base = { x: 100, y: 80, width: 400, height: 300 };
  const next = computeResizedFlowNodeRect("w", base, 50, 0, 170, 180);
  assert.equal(next.width, 350);
  assert.equal(next.x, 150);
});

test("computeResizedFlowNodeRect — does not clamp negative flow coordinates", () => {
  const base = { x: -40, y: -20, width: 200, height: 180 };
  const next = computeResizedFlowNodeRect("se", base, 10, 10, 170, 180);
  assert.equal(next.x, -40);
  assert.equal(next.y, -20);
});
