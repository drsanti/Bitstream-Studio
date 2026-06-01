import assert from "node:assert/strict";
import test from "node:test";

import { evaluateCompareOperation, normalizeCompareOperation } from "../../src/webview/sensor-studio/core/flow/compare-operations";
import {
  evaluateLerp,
  LERP_INPUT_DEFAULTS,
  readLerpInputValue,
} from "../../src/webview/sensor-studio/core/flow/lerp-operations";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("evaluateCompareOperation covers relational ops", () => {
  assert.equal(evaluateCompareOperation(">", 2, 1), true);
  assert.equal(evaluateCompareOperation("<", 2, 1), false);
  assert.equal(evaluateCompareOperation(">=", 1, 1), true);
  assert.equal(evaluateCompareOperation("<=", 0.5, 1), true);
  assert.equal(evaluateCompareOperation("==", 3, 3), true);
  assert.equal(evaluateCompareOperation("!=", 3, 2), true);
});

test("normalizeCompareOperation falls back to >", () => {
  assert.equal(normalizeCompareOperation(undefined), ">");
  assert.equal(normalizeCompareOperation("??"), ">");
});

test("evaluateLerp interpolates and clamps factor", () => {
  assert.equal(evaluateLerp(0, 10, 0.5), 5);
  assert.equal(evaluateLerp(0, 10, 2), 10);
  assert.equal(evaluateLerp(0, 10, -1), 0);
});

test("readLerpInputValue uses fallback when unwired", () => {
  assert.equal(readLerpInputValue(null, LERP_INPUT_DEFAULTS.b), 1);
  assert.equal(readLerpInputValue(0.25, LERP_INPUT_DEFAULTS.b), 0.25);
});

test("normalizeNodeAssetForStudio maps compare and lerp nodes", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g1",
      name: "Utils",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    nodes: [
      {
        id: "host",
        type: "nodeGroup",
        position: { x: 0, y: 0 },
        data: { subgraphId: "sg1" },
      },
    ],
    edges: [],
    subgraphs: {
      sg1: {
        nodes: [
          {
            id: "c1",
            type: "compare",
            position: { x: 0, y: 0 },
            data: { operation: "<=" },
          },
          {
            id: "l1",
            type: "lerp",
            position: { x: 100, y: 0 },
            data: {},
          },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const nodes = asset?.subgraphs.sg1?.nodes ?? [];
  const compare = nodes.find((n) => (n.data as { nodeId?: string }).nodeId === "compare");
  const lerp = nodes.find((n) => (n.data as { nodeId?: string }).nodeId === "lerp");
  assert.equal(compare?.type, "studio");
  assert.equal((compare?.data as { defaultConfig?: { operation?: string } }).defaultConfig?.operation, "<=");
  assert.equal(lerp?.type, "studio");
});
