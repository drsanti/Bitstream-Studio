import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateLogicGateOperation,
  isUnaryLogicGateOperation,
  normalizeLogicGateOperation,
  readLogicGateInput,
} from "../../src/webview/sensor-studio/core/flow/logic-gate-operations";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("readLogicGateInput treats numbers above 0.5 as true", () => {
  assert.equal(readLogicGateInput(true), true);
  assert.equal(readLogicGateInput(0.6), true);
  assert.equal(readLogicGateInput(0.4), false);
});

test("evaluateLogicGateOperation covers and/or/not/xor", () => {
  assert.equal(evaluateLogicGateOperation("and", true, true), true);
  assert.equal(evaluateLogicGateOperation("and", true, false), false);
  assert.equal(evaluateLogicGateOperation("or", false, true), true);
  assert.equal(evaluateLogicGateOperation("not", true, false), false);
  assert.equal(evaluateLogicGateOperation("xor", true, false), true);
});

test("isUnaryLogicGateOperation is true for not", () => {
  assert.equal(isUnaryLogicGateOperation("not"), true);
  assert.equal(isUnaryLogicGateOperation("and"), false);
});

test("normalizeLogicGateOperation falls back to and", () => {
  assert.equal(normalizeLogicGateOperation(undefined), "and");
});

test("computeLogicGateInputHandles hides B for NOT", async () => {
  const { computeLogicGateInputHandles } = await import(
    "../../src/webview/sensor-studio/core/flow/logic-gate-inputs"
  );
  assert.deepEqual(computeLogicGateInputHandles({ operation: "and" }).map((h) => h.id), ["a", "b"]);
  assert.deepEqual(computeLogicGateInputHandles({ operation: "not" }).map((h) => h.id), ["a"]);
});

test("normalizeNodeAssetForStudio maps logicGate nodes", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g1",
      name: "Logic",
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
            id: "lg1",
            type: "logicGate",
            position: { x: 0, y: 0 },
            data: { operation: "xor" },
          },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const node = asset?.subgraphs.sg1?.nodes[0];
  assert.equal(node?.type, "studio");
  assert.equal((node?.data as { nodeId?: string }).nodeId, "logic-gate");
  assert.equal(
    (node?.data as { defaultConfig?: { operation?: string } }).defaultConfig?.operation,
    "xor",
  );
});
