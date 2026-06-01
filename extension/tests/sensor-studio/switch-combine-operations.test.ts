import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCombineXyz,
  evaluateSwitchNumber,
  readSwitchCondition,
} from "../../src/webview/sensor-studio/core/flow/switch-combine-operations";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("readSwitchCondition accepts boolean and numeric truthiness", () => {
  assert.equal(readSwitchCondition(true), true);
  assert.equal(readSwitchCondition(false), false);
  assert.equal(readSwitchCondition(1), true);
  assert.equal(readSwitchCondition(0), false);
  assert.equal(readSwitchCondition(null), false);
});

test("evaluateSwitchNumber picks branch values", () => {
  assert.equal(evaluateSwitchNumber(true, 10, 20), 10);
  assert.equal(evaluateSwitchNumber(false, 10, 20), 20);
  assert.equal(evaluateSwitchNumber(0.5, 3, 7), 3);
});

test("evaluateCombineXyz builds vector3", () => {
  assert.deepEqual(evaluateCombineXyz(1, 2, 3), { x: 1, y: 2, z: 3 });
  assert.deepEqual(evaluateCombineXyz(Number.NaN, 0, 0), { x: 0, y: 0, z: 0 });
});

test("normalizeNodeAssetForStudio maps switch, ifElse, and combineXYZ", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g1",
      name: "Branch",
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
          { id: "s1", type: "switch", position: { x: 0, y: 0 }, data: {} },
          { id: "i1", type: "ifElse", position: { x: 80, y: 0 }, data: {} },
          { id: "c1", type: "combineXYZ", position: { x: 160, y: 0 }, data: {} },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const nodes = asset?.subgraphs.sg1?.nodes ?? [];
  assert.equal(nodes.filter((n) => (n.data as { nodeId?: string }).nodeId === "switch").length, 2);
  const combine = nodes.find((n) => n.id === "c1");
  assert.equal((combine?.data as { nodeId?: string } | undefined)?.nodeId, "combine-xyz");
});
