import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectPhysicsJointsFromGraph,
  collectPhysicsSpawnersFromGraph,
  evaluatePhysicsJointNode,
  evaluatePhysicsSpawnerNode,
} from "../../src/webview/sensor-studio/core/flow/collect-physics-scene-graph";
import { evaluatePhysicsWorldOutput } from "../../src/webview/sensor-studio/core/flow/physics-domain-eval";
import { flowWirePhysicsRigidBodyFromConfig } from "../../src/webview/sensor-studio/features/editor/nodes/physics/flow-wire-physics-body";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";

function studioNode(
  id: string,
  nodeId: string,
  label: string,
  defaultConfig: Record<string, unknown> = {},
): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId,
      label,
      defaultConfig,
    },
  } as FlowGraphNode;
}

test("evaluatePhysicsJointNode builds hinge joint wire from body inputs", () => {
  const bodyA = flowWirePhysicsRigidBodyFromConfig("body-a", "A", {
    positionY: 2,
    halfExtents: 0.25,
  });
  const bodyB = flowWirePhysicsRigidBodyFromConfig("body-b", "B", {
    positionY: 2,
    halfExtents: 0.25,
  });
  const hinge = studioNode("hinge-1", "hinge-joint", "Hinge", { axis: "y" });
  const joint = evaluatePhysicsJointNode(hinge, (port) =>
    port === "bodyA" ? bodyA : bodyB,
  );

  assert.ok(joint);
  assert.equal(joint!.jointKind, "hinge");
  assert.equal(joint!.bodyASourceNodeId, "body-a");
  assert.equal(joint!.bodyBSourceNodeId, "body-b");
});

test("collectPhysicsJointsFromGraph and spawners merge into physics scene wire", () => {
  const bodyA = flowWirePhysicsRigidBodyFromConfig("body-a", "A", {});
  const bodyB = flowWirePhysicsRigidBodyFromConfig("body-b", "B", {});
  const hinge = studioNode("hinge-1", "hinge-joint", "Hinge");
  const spawner = studioNode("spawn-1", "object-spawner", "Spawner", {
    rate: 1,
    maxCount: 4,
  });

  const readIncoming = (nodeId: string, port: string) => {
    if (nodeId === "hinge-1") {
      return port === "bodyA" ? bodyA : bodyB;
    }
    if (nodeId === "spawn-1" && port === "rate") {
      return 2;
    }
    return undefined;
  };

  const joints = collectPhysicsJointsFromGraph({
    nodes: [hinge],
    readIncoming,
  });
  const spawners = collectPhysicsSpawnersFromGraph({
    nodes: [spawner],
    readIncoming,
  });

  assert.equal(joints.length, 1);
  assert.equal(spawners.length, 1);
  assert.equal(spawners[0]!.rate, 2);

  const wire = evaluatePhysicsWorldOutput({}, [], [], joints, spawners);
  assert.equal(wire.joints.length, 1);
  assert.equal(wire.spawners.length, 1);
});

test("evaluatePhysicsSpawnerNode uses config defaults when rate unwired", () => {
  const spawner = studioNode("spawn-1", "object-spawner", "Spawner", {
    rate: 0.5,
    maxCount: 3,
  });
  const out = evaluatePhysicsSpawnerNode(spawner, () => undefined);
  assert.ok(out);
  assert.equal(out!.rate, 0.5);
  assert.equal(out!.maxCount, 3);
});
