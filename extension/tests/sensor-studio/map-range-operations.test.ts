import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateMapRange,
  MAP_RANGE_INPUT_DEFAULTS,
  readMapRangeInput,
} from "../../src/webview/sensor-studio/core/flow/map-range-operations";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("evaluateMapRange maps linearly with clamp", () => {
  assert.equal(evaluateMapRange(0.5, 0, 1, -1, 1, true), 0);
  assert.equal(evaluateMapRange(2, 0, 1, 0, 10, true), 10);
});

test("evaluateMapRange skips clamp when disabled", () => {
  assert.equal(evaluateMapRange(2, 0, 1, 0, 10, false), 20);
});

test("evaluateMapRange passes outMin when input span is zero", () => {
  assert.equal(evaluateMapRange(5, 1, 1, 3, 9, true), 3);
});

test("readMapRangeInput prefers wired number", () => {
  assert.equal(readMapRangeInput(0.25, 0, MAP_RANGE_INPUT_DEFAULTS.inMin), 0.25);
  assert.equal(readMapRangeInput(null, 0.75, MAP_RANGE_INPUT_DEFAULTS.inMax), 0.75);
});

test("normalizeNodeAssetForStudio maps mapRange node", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g1",
      name: "Map",
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
            id: "mr1",
            type: "mapRange",
            position: { x: 0, y: 0 },
            data: { inMin: 10, inMax: 20, outMin: 0, outMax: 100, clamp: false },
          },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const node = asset?.subgraphs.sg1?.nodes[0];
  assert.equal((node?.data as { nodeId?: string }).nodeId, "map-range");
  const cfg = (node?.data as { defaultConfig?: Record<string, unknown> }).defaultConfig ?? {};
  assert.equal(cfg.inMin, 10);
  assert.equal(cfg.clamp, false);
});
