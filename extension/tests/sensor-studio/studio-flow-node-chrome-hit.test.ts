import assert from "node:assert/strict";
import test from "node:test";

import {
  appendFlowNodeChromeHitClass,
  isStudioFlowNodeChromeHitFit,
  isStudioFlowNodeManualHeightResize,
  isSubgraphFlowNodeChromeHitFit,
  resolveStudioFlowNodeChromeHitEffectiveMinHeight,
  resolveStudioFlowNodeChromeHitLayoutHeightFloor,
  shouldApplyFlowNodeChromeHitClass,
} from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/studio-flow-node-chrome-hit";

test("content-wrap is default for catalog studio nodes", () => {
  assert.equal(isStudioFlowNodeChromeHitFit("environment"), true);
  assert.equal(isStudioFlowNodeChromeHitFit("scene-output"), true);
  assert.equal(isStudioFlowNodeChromeHitFit("model-select"), true);
  assert.equal(isStudioFlowNodeChromeHitFit("float"), true);
  assert.equal(isStudioFlowNodeChromeHitFit("sparkline"), true);
});

test("viewport and gauge nodes keep manual height resize", () => {
  assert.equal(isStudioFlowNodeManualHeightResize("model-viewer"), true);
  assert.equal(isStudioFlowNodeManualHeightResize("plotter"), true);
  assert.equal(isStudioFlowNodeManualHeightResize("audio-scope"), true);
  assert.equal(isStudioFlowNodeManualHeightResize("radial-gauge"), true);
  assert.equal(isStudioFlowNodeManualHeightResize("environment"), false);
});

test("subgraph shell nodes are content-wrapped", () => {
  assert.equal(isSubgraphFlowNodeChromeHitFit("studio-node-group"), true);
  assert.equal(isSubgraphFlowNodeChromeHitFit("studio-group-input"), true);
  assert.equal(isSubgraphFlowNodeChromeHitFit("studio"), false);
});

test("shouldApplyFlowNodeChromeHitClass covers studio and subgraph types", () => {
  assert.equal(
    shouldApplyFlowNodeChromeHitClass({
      nodeType: "studio",
      catalogNodeId: "environment",
    }),
    true,
  );
  assert.equal(
    shouldApplyFlowNodeChromeHitClass({
      nodeType: "studio",
      catalogNodeId: "model-viewer",
    }),
    false,
  );
  assert.equal(
    shouldApplyFlowNodeChromeHitClass({
      nodeType: "studio-node-group",
    }),
    true,
  );
});

test("appendFlowNodeChromeHitClass is idempotent", () => {
  assert.equal(
    appendFlowNodeChromeHitClass("foo studio-flow-node--chrome-hit"),
    "foo studio-flow-node--chrome-hit",
  );
  assert.equal(
    appendFlowNodeChromeHitClass("foo"),
    "foo studio-flow-node--chrome-hit",
  );
});

test("layout height floor follows measured chrome, not legacy spawn band", () => {
  assert.equal(resolveStudioFlowNodeChromeHitLayoutHeightFloor(58), 64);
  assert.equal(resolveStudioFlowNodeChromeHitLayoutHeightFloor(120), 120);
});

test("effective min height uses measured chrome when available", () => {
  const catalog = { minWidth: 240, minHeight: 220 };
  assert.equal(
    resolveStudioFlowNodeChromeHitEffectiveMinHeight(88, catalog),
    88,
  );
  assert.equal(
    resolveStudioFlowNodeChromeHitEffectiveMinHeight(null, catalog),
    96,
  );
});
