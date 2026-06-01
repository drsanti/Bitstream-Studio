import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateMultiplexer,
  parseJsonPayload,
  readJsonPath,
} from "../../src/webview/sensor-studio/core/flow/json-path";
import {
  evaluateValueNormalizer,
  readValueNormalizerInput,
} from "../../src/webview/sensor-studio/core/flow/value-normalizer-operations";
import {
  formatRemoteCacheAge,
  readRemoteNodeGraphCache,
  writeRemoteNodeGraphCache,
} from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/node-group-remote-cache";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("readJsonPath reads nested fields", () => {
  assert.equal(readJsonPath({ a: { b: 3 } }, "a.b"), 3);
});

test("evaluateMultiplexer extracts configured paths", () => {
  const out = evaluateMultiplexer(JSON.stringify({ temp: 22, hum: 55 }), {
    a: "temp",
    b: "hum",
    c: "missing",
  });
  assert.equal(out.a, 22);
  assert.equal(out.b, 55);
  assert.equal(out.c, 0);
});

test("evaluateValueNormalizer maps and clamps", () => {
  assert.equal(evaluateValueNormalizer(0.5, 0, 1, -1, 1), 0);
  assert.equal(evaluateValueNormalizer(2, 0, 1, 0, 10), 10);
});

test("readValueNormalizerInput prefers wired number", () => {
  assert.equal(readValueNormalizerInput(3, 0, 1), 3);
  assert.equal(readValueNormalizerInput(null, 0.25, 1), 0.25);
});

test("remote node graph cache round-trips in sessionStorage", () => {
  const store = new Map<string, string>();
  const priorWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    },
  });

  try {
    writeRemoteNodeGraphCache({
      fetchedAtMs: Date.now() - 5000,
      indexJson: '{"entries":[]}',
      assetsById: { demo: "{}" },
    });
    const loaded = readRemoteNodeGraphCache();
    assert.ok(loaded != null);
    assert.equal(loaded.assetsById.demo, "{}");
  } finally {
    if (priorWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: priorWindow,
      });
    }
  }
});

test("formatRemoteCacheAge renders seconds", () => {
  assert.match(formatRemoteCacheAge(Date.now() - 12_000, Date.now()), /12s ago/);
});

test("normalizeNodeAssetForStudio maps multiplexer and valueNormalizer", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g1",
      name: "Data",
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
          { id: "m1", type: "multiplexer", position: { x: 0, y: 0 }, data: {} },
          { id: "v1", type: "valueNormalizer", position: { x: 80, y: 0 }, data: {} },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const nodes = asset?.subgraphs.sg1?.nodes ?? [];
  assert.equal((nodes[0]?.data as { nodeId?: string }).nodeId, "multiplexer");
  assert.equal((nodes[1]?.data as { nodeId?: string }).nodeId, "value-normalizer");
});

test("parseJsonPayload accepts object passthrough", () => {
  assert.deepEqual(parseJsonPayload({ x: 1 }), { x: 1 });
});
