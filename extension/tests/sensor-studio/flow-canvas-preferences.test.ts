import assert from "node:assert/strict";
import test from "node:test";

import {
  coerceFlowCanvasPreferences,
  DEFAULT_FLOW_CANVAS_PREFERENCES,
  FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW,
  mergeFlowCanvasPreferences,
} from "../../src/webview/sensor-studio/persistence/flow-canvas-preferences";
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
    edgeRoutingStyle: "step",
    autoFitViewOnReplace: false,
  });
  assert.equal(next.showMinimap, true);
  assert.equal(next.backgroundHex, "#112233");
  assert.equal(next.edgeRoutingStyle, "step");
  assert.equal(next.autoFitViewOnReplace, false);
});

test("coerceFlowCanvasPreferences defaults autoFitViewOnReplace to true", () => {
  const next = coerceFlowCanvasPreferences({ showMinimap: true });
  assert.equal(next.autoFitViewOnReplace, true);
});

test("FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW maps bezier to default", () => {
  assert.equal(FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW.bezier, "default");
});

test("coerceFlowCanvasPreferences applies wire UX defaults for legacy payloads", () => {
  const next = coerceFlowCanvasPreferences({ edgeRoutingStyle: "step" });
  assert.equal(next.edgeStrokeWidth, 2);
  assert.equal(next.edgeAnimated, true);
  assert.equal(next.elevateEdgesOnSelect, true);
  assert.equal(next.connectionRadius, 28);
});

test("coerceFlowCanvasPreferences applies node selection chrome defaults", () => {
  const next = coerceFlowCanvasPreferences({});
  assert.equal(next.showNodeSelectionRing, true);
  assert.equal(next.showMarqueeSelectionRect, false);
  assert.equal(next.nodeSelectionRingHex, "#32fafa");
  assert.equal(next.nodeSelectionRingWidthPx, 2);
  assert.equal(next.marqueeSelectionHex, "#3b82f6");
});

test("mergeFlowCanvasPreferences rejects invalid selection colors", () => {
  const next = mergeFlowCanvasPreferences(DEFAULT_FLOW_CANVAS_PREFERENCES, {
    nodeSelectionRingHex: "bad",
    marqueeSelectionHex: "nope",
    nodeSelectionRingWidthPx: 9 as never,
  });
  assert.equal(next.nodeSelectionRingHex, "#32fafa");
  assert.equal(next.marqueeSelectionHex, "#3b82f6");
  assert.equal(next.nodeSelectionRingWidthPx, 2);
});

test("mergeFlowCanvasPreferences clamps wire numeric fields", () => {
  const next = mergeFlowCanvasPreferences(DEFAULT_FLOW_CANVAS_PREFERENCES, {
    edgeIdleOpacity: 2,
    connectionRadius: 4,
    smoothStepBorderRadius: 99,
  });
  assert.equal(next.edgeIdleOpacity, 1);
  assert.equal(next.connectionRadius, 8);
  assert.equal(next.smoothStepBorderRadius, 24);
});
