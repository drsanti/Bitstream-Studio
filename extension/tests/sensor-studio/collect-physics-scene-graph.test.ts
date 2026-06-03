import { describe, expect, test } from "vitest";
import {
  collectPhysicsCollidersForWorld,
  collectPhysicsRigidBodiesForWorld,
  evaluateBoxColliderOutput,
} from "../../src/webview/sensor-studio/core/flow/collect-physics-scene-graph";
import { evaluatePhysicsWorldOutput } from "../../src/webview/sensor-studio/core/flow/physics-domain-eval";
import { flowWirePhysicsRigidBodyFromConfig } from "../../src/webview/sensor-studio/features/editor/nodes/physics/flow-wire-physics-body";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";

function makeNode(id: string, nodeId: string, dc: Record<string, unknown> = {}): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId,
      label: nodeId,
      defaultConfig: dc,
    },
  } as FlowGraphNode;
}

describe("collectPhysicsCollidersForWorld", () => {
  test("merges wired box collider into physics-world output", () => {
    const box = makeNode("box-1", "box-collider", { halfExtentsX: 2 });
    const world = makeNode("world-1", "physics-world");
    const nodes = [box, world];
    const edges = [
      {
        id: "e1",
        source: "box-1",
        target: "world-1",
        sourceHandle: "out",
        targetHandle: "shapes",
      },
    ];
    const pinValues = new Map<string, unknown>();
    pinValues.set("box-1\u0000out", evaluateBoxColliderOutput(box));
    const colliders = collectPhysicsCollidersForWorld({
      nodes,
      edges,
      physicsWorldNodeId: "world-1",
      pinValues,
      includeUnwiredGraphNodes: false,
    });
    expect(colliders).toHaveLength(1);
    expect(colliders[0]!.halfExtents?.x).toBe(2);
    const wire = evaluatePhysicsWorldOutput({ enabled: true }, colliders, []);
    expect(wire.colliders).toHaveLength(1);
  });

  test("collects rigid bodies wired to physics-world", () => {
    const body = makeNode("rb-1", "rigid-body", { mass: 2, positionY: 4 });
    const world = makeNode("world-1", "physics-world");
    const pinValues = new Map<string, unknown>();
    pinValues.set(
      "rb-1\u0000out",
      flowWirePhysicsRigidBodyFromConfig("rb-1", "rb", body.data.defaultConfig as Record<string, unknown>),
    );
    const bodies = collectPhysicsRigidBodiesForWorld({
      edges: [
        {
          id: "e1",
          source: "rb-1",
          target: "world-1",
          sourceHandle: "out",
          targetHandle: "bodies",
        },
      ],
      physicsWorldNodeId: "world-1",
      pinValues,
    });
    expect(bodies).toHaveLength(1);
    expect(bodies[0]!.mass).toBe(2);
    expect(bodies[0]!.position.y).toBe(4);
  });
});
