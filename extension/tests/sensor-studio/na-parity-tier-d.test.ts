import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePhysicsWorldOutput } from "../../src/webview/sensor-studio/core/flow/physics-domain-eval";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("evaluatePhysicsWorldOutput builds FlowWirePhysicsSceneV1", () => {
  const wire = evaluatePhysicsWorldOutput({ enabled: true, gravityY: -10 });
  assert.equal(wire.kind, "physicsScene");
  assert.equal(wire.version, 1);
  assert.equal(wire.enabled, true);
  assert.equal(wire.gravityY, -10);
});

test("normalizeNodeAssetForStudio maps Tier D physics NA types", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "phys1",
      name: "Physics",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    nodes: [{ id: "host", type: "nodeGroup", position: { x: 0, y: 0 }, data: { subgraphId: "sg1" } }],
    edges: [],
    subgraphs: {
      sg1: {
        nodes: [
          { id: "w1", type: "physics", position: { x: 0, y: 0 }, data: { gravityY: -9.81 } },
          { id: "rb1", type: "rigidBody", position: { x: 40, y: 0 }, data: {} },
          { id: "c1", type: "colliderShape", position: { x: 80, y: 0 }, data: { shape: "sphere", radius: 1 } },
          { id: "s1", type: "objectSpawner", position: { x: 120, y: 0 }, data: {} },
          { id: "j1", type: "joint", position: { x: 160, y: 0 }, data: { kind: "hinge" } },
          { id: "ik1", type: "ik", position: { x: 200, y: 0 }, data: {} },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });

  const inner = asset.subgraphs?.sg1?.nodes ?? [];
  const byId = (id: string) => inner.find((n) => n.id === id);
  assert.equal(byId("w1")?.type, "studio");
  assert.equal((byId("w1")?.data as { nodeId?: string }).nodeId, "physics-world");
  assert.equal((byId("rb1")?.data as { nodeId?: string }).nodeId, "rigid-body");
  assert.equal((byId("c1")?.data as { nodeId?: string }).nodeId, "sphere-collider");
  assert.equal((byId("s1")?.data as { nodeId?: string }).nodeId, "object-spawner");
  assert.equal((byId("j1")?.data as { nodeId?: string }).nodeId, "hinge-joint");
  assert.equal((byId("ik1")?.data as { nodeId?: string }).nodeId, "ik-chain");
});
