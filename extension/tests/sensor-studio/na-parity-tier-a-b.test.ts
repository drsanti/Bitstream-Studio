import assert from "node:assert/strict";
import test from "node:test";

import {
  CLAMP_INPUT_DEFAULTS,
  evaluateClamp,
  readClampInput,
} from "../../src/webview/sensor-studio/core/flow/clamp-operations";
import {
  evaluateNoiseSim,
  evaluateRampSim,
  evaluateSineWave,
  evaluateStepSim,
} from "../../src/webview/sensor-studio/core/flow/sim-generator-operations";
import { evaluateVectorConstant } from "../../src/webview/sensor-studio/core/flow/vector-constant-operations";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("evaluateClamp limits to range", () => {
  assert.equal(evaluateClamp(5, 0, 10), 5);
  assert.equal(evaluateClamp(12, 0, 10), 10);
  assert.equal(evaluateClamp(-1, 0, 10), 0);
});

test("readClampInput prefers wired number", () => {
  assert.equal(readClampInput(2, 0, CLAMP_INPUT_DEFAULTS.min), 2);
});

test("sim generators produce finite output", () => {
  assert.ok(Number.isFinite(evaluateSineWave(1, 1, 1, 0, 0)));
  assert.ok(Number.isFinite(evaluateRampSim(2, 0.1, 0, 1, true)));
  assert.ok(Number.isFinite(evaluateStepSim(1.5, 1, 0, 1)));
  assert.ok(Number.isFinite(evaluateNoiseSim(3, 1, 1, 0, 0.25)));
});

test("evaluateVectorConstant returns vec3", () => {
  assert.deepEqual(evaluateVectorConstant(1, 2, 3), { x: 1, y: 2, z: 3 });
});

test("normalizeNodeAssetForStudio maps Tier A and B NA types", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g1",
      name: "Parity",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    nodes: [{ id: "host", type: "nodeGroup", position: { x: 0, y: 0 }, data: { subgraphId: "sg1" } }],
    edges: [],
    subgraphs: {
      sg1: {
        nodes: [
          { id: "c1", type: "clamp", position: { x: 0, y: 0 }, data: { min: -2, max: 2 } },
          { id: "b1", type: "bool", position: { x: 40, y: 0 }, data: { value: true } },
          { id: "v1", type: "vector", position: { x: 80, y: 0 }, data: { x: 1, y: 0, z: 0 } },
          { id: "s1", type: "sineWaveSim", position: { x: 120, y: 0 }, data: {} },
          { id: "r1", type: "rampSim", position: { x: 160, y: 0 }, data: {} },
          { id: "e1", type: "environmentHdri", position: { x: 200, y: 0 }, data: {} },
          { id: "cam1", type: "camera", position: { x: 240, y: 0 }, data: {} },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const byId = Object.fromEntries(
    (asset?.subgraphs.sg1?.nodes ?? []).map((n) => [n.id, (n.data as { nodeId?: string }).nodeId]),
  );
  assert.equal(byId.c1, "clamp");
  assert.equal(byId.b1, "boolean-constant");
  assert.equal(byId.v1, "vector-constant");
  assert.equal(byId.s1, "sine-wave");
  assert.equal(byId.r1, "ramp-sim");
  assert.equal(byId.e1, "environment");
  assert.equal(byId.cam1, "camera-view");
});
