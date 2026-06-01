import assert from "node:assert/strict";
import test from "node:test";

import { advanceFlowClock, flowSecondsToFrames } from "../../src/webview/sensor-studio/core/flow/flow-clock";
import { evaluateDebugValue } from "../../src/webview/sensor-studio/core/flow/debug-node-operations";
import { evaluateFogOutputs } from "../../src/webview/sensor-studio/core/flow/fog-operations";
import {
  evaluateFrameDelta,
  evaluateSceneTime,
} from "../../src/webview/sensor-studio/core/flow/scene-time-operations";
import { evaluateTransformPartialVec3 } from "../../src/webview/sensor-studio/core/flow/transform-partial-operations";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("flow clock advances delta and frames", () => {
  advanceFlowClock(1000);
  const t1 = evaluateSceneTime();
  advanceFlowClock(1016);
  const d = evaluateFrameDelta();
  assert.ok(t1.seconds >= 1);
  assert.equal(flowSecondsToFrames(1), 30);
  assert.ok(d.delta > 0);
  assert.ok(d.fps > 0);
});

test("evaluateTransformPartialVec3 returns vec3", () => {
  assert.deepEqual(evaluateTransformPartialVec3(1, 2, 3), { x: 1, y: 2, z: 3 });
});

test("evaluateDebugValue coerces boolean wired", () => {
  assert.equal(evaluateDebugValue(true, 0, 0), 1);
});

test("evaluateFogOutputs reads defaults", () => {
  const out = evaluateFogOutputs(null, 2, null, 40, null, 0.1);
  assert.equal(out.near, 2);
  assert.equal(out.far, 40);
  assert.equal(out.density, 0.1);
});

test("normalizeNodeAssetForStudio maps Tier C NA types", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g1",
      name: "TierC",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    nodes: [{ id: "host", type: "nodeGroup", position: { x: 0, y: 0 }, data: { subgraphId: "sg1" } }],
    edges: [],
    subgraphs: {
      sg1: {
        nodes: [
          { id: "t1", type: "time", position: { x: 0, y: 0 }, data: {} },
          { id: "fd1", type: "frameDelta", position: { x: 40, y: 0 }, data: {} },
          { id: "p1", type: "position", position: { x: 80, y: 0 }, data: { px: 1 } },
          { id: "f1", type: "fog", position: { x: 120, y: 0 }, data: {} },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const byId = Object.fromEntries(
    (asset?.subgraphs.sg1?.nodes ?? []).map((n) => [n.id, (n.data as { nodeId?: string }).nodeId]),
  );
  assert.equal(byId.t1, "scene-time");
  assert.equal(byId.fd1, "frame-delta");
  assert.equal(byId.p1, "position");
  assert.equal(byId.f1, "fog");
});
