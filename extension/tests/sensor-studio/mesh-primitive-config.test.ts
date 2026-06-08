import assert from "node:assert/strict";
import test from "node:test";

import {
  flowWireMeshFromMeshPrimitiveEval,
  resolveMeshWireSocketLabel,
} from "../../src/webview/sensor-studio/features/editor/nodes/mesh/mesh-primitive-config";
import { coerceFlowWireMeshV1 } from "../../src/webview/sensor-studio/features/editor/nodes/mesh/flow-wire-mesh";

test("flowWireMeshFromMeshPrimitiveEval builds box wire from defaults", () => {
  const wire = flowWireMeshFromMeshPrimitiveEval({
    kind: "box",
    defaultConfig: {
      meshBoxWidth: 2,
      meshBoxHeight: 1,
      meshBoxDepth: 0.5,
    },
  });
  assert.deepEqual(wire, {
    version: 1,
    kind: "box",
    box: { width: 2, height: 1, depth: 0.5 },
  });
});

test("flowWireMeshFromMeshPrimitiveEval builds sphere with wired radius", () => {
  const wire = flowWireMeshFromMeshPrimitiveEval({
    kind: "sphere",
    defaultConfig: { meshSphereRadius: 0.5 },
    wired: { radius: 1.25 },
  });
  assert.equal(wire.kind, "sphere");
  assert.equal(wire.sphere?.radius, 1.25);
});

test("flowWireMeshFromMeshPrimitiveEval embeds material and transform", () => {
  const wire = flowWireMeshFromMeshPrimitiveEval({
    kind: "plane",
    defaultConfig: { meshPlaneWidth: 4, meshPlaneHeight: 4 },
    wired: {
      material: {
        version: 1,
        kind: "standard",
        colorHex: "#ff0000",
        opacity: 1,
        roughness: 0.5,
        metalness: 0,
      },
      transform: {
        version: 1,
        position: { x: 0, y: 1, z: 0 },
        rotationDeg: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
    },
  });
  assert.equal(wire.plane?.width, 4);
  assert.equal(wire.material?.colorHex, "#ff0000");
  assert.equal(wire.transform?.position.y, 1);
});

test("coerceFlowWireMeshV1 rejects invalid version", () => {
  assert.equal(coerceFlowWireMeshV1({ version: 2, kind: "box" }), null);
});

test("resolveMeshWireSocketLabel formats box badge", () => {
  const label = resolveMeshWireSocketLabel({
    version: 1,
    kind: "box",
    box: { width: 1, height: 2, depth: 3 },
    material: {
      version: 1,
      kind: "basic",
      colorHex: "#aabbcc",
      opacity: 1,
    },
  });
  assert.equal(label, "Box · 1×2×3 · #aabbcc");
});

test("resolveMeshWireSocketLabel formats sphere badge", () => {
  const label = resolveMeshWireSocketLabel({
    version: 1,
    kind: "sphere",
    sphere: { radius: 0.5, widthSegments: 32, heightSegments: 16 },
  });
  assert.equal(label, "Sphere · r0.5");
});

test("flowWireMeshFromMeshPrimitiveEval builds cylinder wire", () => {
  const wire = flowWireMeshFromMeshPrimitiveEval({
    kind: "cylinder",
    defaultConfig: {
      meshCylinderRadiusTop: 0.5,
      meshCylinderRadiusBottom: 0.25,
      meshCylinderHeight: 2,
    },
  });
  assert.equal(wire.kind, "cylinder");
  assert.equal(wire.cylinder?.radiusTop, 0.5);
  assert.equal(wire.cylinder?.radiusBottom, 0.25);
  assert.equal(wire.cylinder?.height, 2);
});

test("resolveMeshWireSocketLabel formats group badge", () => {
  const label = resolveMeshWireSocketLabel({
    version: 1,
    kind: "group",
    children: [
      {
        version: 1,
        kind: "box",
        box: { width: 1, height: 1, depth: 1 },
      },
      {
        version: 1,
        kind: "sphere",
        sphere: { radius: 0.5, widthSegments: 32, heightSegments: 16 },
      },
    ],
  });
  assert.equal(label, "Bundle · 2 meshes");
});
