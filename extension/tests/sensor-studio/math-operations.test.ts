import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateMathOperation,
  isUnaryMathOperation,
  normalizeMathOperation,
} from "../../src/webview/sensor-studio/core/flow/math-operations";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("evaluateMathOperation covers binary ops", () => {
  assert.equal(evaluateMathOperation("add", 2, 3), 5);
  assert.equal(evaluateMathOperation("sub", 5, 2), 3);
  assert.equal(evaluateMathOperation("mul", 4, 0.5), 2);
  assert.equal(evaluateMathOperation("min", 1, 2), 1);
  assert.equal(evaluateMathOperation("max", 1, 2), 2);
});

test("evaluateMathOperation is safe for div and mod by zero", () => {
  assert.equal(evaluateMathOperation("div", 1, 0), 0);
  assert.equal(evaluateMathOperation("mod", 5, 0), 0);
});

test("evaluateMathOperation covers unary ops and ignores B", () => {
  assert.equal(evaluateMathOperation("sin", Math.PI / 2, 99), 1);
  assert.equal(evaluateMathOperation("cos", 0, 99), 1);
  assert.equal(evaluateMathOperation("abs", -3, 0), 3);
  assert.equal(evaluateMathOperation("floor", 2.9, 0), 2);
  assert.equal(evaluateMathOperation("ceil", 2.1, 0), 3);
});

test("evaluateMathOperation coerces non-finite pow to zero", () => {
  assert.equal(evaluateMathOperation("pow", -1, 0.5), 0);
});

test("normalizeMathOperation falls back to add", () => {
  assert.equal(normalizeMathOperation(undefined), "add");
  assert.equal(normalizeMathOperation("not-real"), "add");
});

test("isUnaryMathOperation matches node-animator unary set", () => {
  assert.equal(isUnaryMathOperation("sin"), true);
  assert.equal(isUnaryMathOperation("add"), false);
});

test("normalizeNodeAssetForStudio maps node-animator math nodes", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g1",
      name: "Math group",
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
            id: "m1",
            type: "math",
            position: { x: 0, y: 0 },
            data: { operation: "mul", graphTitle: "Scale" },
          },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const inner = asset?.subgraphs.sg1?.nodes[0];
  assert.equal(inner?.type, "studio");
  assert.equal((inner?.data as { nodeId?: string }).nodeId, "math");
  assert.equal((inner?.data as { defaultConfig?: { operation?: string } }).defaultConfig?.operation, "mul");
});
