import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_FLOW_CANVAS_PREFERENCES } from "../../src/webview/sensor-studio/persistence/flow-canvas-preferences";
import {
  buildFlowCanvasSelectionStyleVars,
  flowCanvasSelectionChromeClassNames,
} from "../../src/webview/sensor-studio/features/editor/flow-canvas-selection-style";

test("buildFlowCanvasSelectionStyleVars maps hex colors to rgb triplets", () => {
  const vars = buildFlowCanvasSelectionStyleVars({
    ...DEFAULT_FLOW_CANVAS_PREFERENCES,
    nodeSelectionRingHex: "#ff0000",
    marqueeSelectionHex: "#00ff00",
    nodeSelectionRingOpacity: 0.5,
    nodeSelectionRingWidthPx: 3,
  });
  assert.equal(vars["--studio-flow-selection-ring-color"], "255 0 0");
  assert.equal(vars["--studio-flow-marquee-color"], "0 255 0");
  assert.equal(vars["--studio-flow-selection-ring-opacity"], "0.5");
  assert.equal(vars["--studio-flow-selection-ring-width"], "3px");
});

test("flowCanvasSelectionChromeClassNames toggles hide/show classes", () => {
  assert.equal(
    flowCanvasSelectionChromeClassNames(DEFAULT_FLOW_CANVAS_PREFERENCES),
    "",
  );
  assert.equal(
    flowCanvasSelectionChromeClassNames({
      ...DEFAULT_FLOW_CANVAS_PREFERENCES,
      showNodeSelectionRing: false,
      showMarqueeSelectionRect: true,
    }),
    "studio-flow-canvas--hide-node-selection studio-flow-canvas--show-marquee-selection",
  );
});
