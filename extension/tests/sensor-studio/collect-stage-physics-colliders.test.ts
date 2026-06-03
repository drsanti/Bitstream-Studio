import { describe, expect, test } from "vitest";
import { collectStagePhysicsCollidersFromGraph } from "../../src/webview/sensor-studio/core/stage/stage-physics-colliders";
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

describe("collectStagePhysicsCollidersFromGraph", () => {
  test("collects box and sphere collider nodes", () => {
    const nodes = [
      makeNode("box-1", "box-collider", {
        halfExtentsX: 1,
        halfExtentsY: 2,
        halfExtentsZ: 3,
        positionY: 0.5,
      }),
      makeNode("sph-1", "sphere-collider", { radius: 0.25, positionZ: 2 }),
      makeNode("other", "plotter"),
    ];
    const colliders = collectStagePhysicsCollidersFromGraph(nodes);
    expect(colliders).toHaveLength(2);
    expect(colliders[0]!.kind).toBe("box");
    expect(colliders[0]!.halfExtents).toEqual({ x: 1, y: 2, z: 3 });
    expect(colliders[1]!.kind).toBe("sphere");
    expect(colliders[1]!.radius).toBe(0.25);
  });
});
