import assert from "node:assert/strict";
import test from "node:test";

import {
  halfExtentsFromFlowWireMeshV1,
  positionFromFlowWireMeshV1,
} from "../../src/webview/sensor-studio/features/editor/nodes/mesh/mesh-half-extents-from-wire";

test("halfExtentsFromFlowWireMeshV1 derives box half extents", () => {
  const he = halfExtentsFromFlowWireMeshV1({
    version: 1,
    kind: "box",
    box: { width: 2, height: 4, depth: 1 },
  });
  assert.equal(he.x, 1);
  assert.equal(he.y, 2);
  assert.equal(he.z, 0.5);
});

test("halfExtentsFromFlowWireMeshV1 applies transform scale", () => {
  const he = halfExtentsFromFlowWireMeshV1({
    version: 1,
    kind: "sphere",
    sphere: { radius: 0.5, widthSegments: 32, heightSegments: 16 },
    transform: {
      version: 1,
      position: { x: 0, y: 0, z: 0 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      scale: { x: 2, y: 1, z: 1 },
    },
  });
  assert.equal(he.x, 1);
  assert.equal(he.y, 0.5);
  assert.equal(he.z, 0.5);
});

test("positionFromFlowWireMeshV1 prefers mesh transform position", () => {
  const pos = positionFromFlowWireMeshV1(
    {
      version: 1,
      kind: "box",
      box: { width: 1, height: 1, depth: 1 },
      transform: {
        version: 1,
        position: { x: 1, y: 2, z: 3 },
        rotationDeg: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
    },
    { x: 0, y: 3, z: 0 },
  );
  assert.deepEqual(pos, { x: 1, y: 2, z: 3 });
});

test("flowWirePhysicsRigidBodyFromConfig uses wired mesh bounds", async () => {
  const { flowWirePhysicsRigidBodyFromConfig } = await import(
    "../../src/webview/sensor-studio/features/editor/nodes/physics/flow-wire-physics-body"
  );
  const body = flowWirePhysicsRigidBodyFromConfig("rb-1", "Test body", {
    mass: 2,
    positionX: 0,
    positionY: 5,
    positionZ: 0,
    halfExtents: 0.25,
  }, {
    version: 1,
    kind: "box",
    box: { width: 2, height: 1, depth: 2 },
    transform: {
      version: 1,
      position: { x: 0, y: 1, z: 0 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  });
  assert.equal(body.halfExtents.x, 1);
  assert.equal(body.halfExtents.y, 0.5);
  assert.equal(body.position.y, 1);
});
