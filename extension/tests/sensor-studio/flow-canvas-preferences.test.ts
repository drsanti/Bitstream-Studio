import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_FLOW_CANVAS_PREFERENCES,
  mergeFlowCanvasPreferences,
} from "../../src/webview/sensor-studio/features/editor/components/flow-canvas-ui-persistence";
import { snapFlowPoint } from "../../src/webview/sensor-studio/features/editor/components/snap-flow-position";

test("snapFlowPoint returns input when snap is disabled", () => {
  assert.deepEqual(snapFlowPoint({ x: 13, y: 27 }, 16, false), { x: 13, y: 27 });
});

test("snapFlowPoint rounds to nearest grid cell when enabled", () => {
  assert.deepEqual(snapFlowPoint({ x: 13, y: 27 }, 16, true), { x: 16, y: 32 });
});

test("mergeFlowCanvasPreferences rejects invalid grid sizes and hex colors", () => {
  const next = mergeFlowCanvasPreferences(DEFAULT_FLOW_CANVAS_PREFERENCES, {
    gridSize: 99 as never,
    backgroundHex: "not-a-color",
  });
  assert.equal(next.gridSize, 16);
  assert.equal(next.backgroundHex, null);
});

test("mergeFlowCanvasPreferences accepts valid patches", () => {
  const next = mergeFlowCanvasPreferences(DEFAULT_FLOW_CANVAS_PREFERENCES, {
    showMinimap: true,
    backgroundHex: "#112233",
  });
  assert.equal(next.showMinimap, true);
  assert.equal(next.backgroundHex, "#112233");
});
