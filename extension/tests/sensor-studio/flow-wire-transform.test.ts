import assert from "node:assert/strict";
import test from "node:test";

import {
  coerceFlowWireTransformV1,
  flowWireTransformFromEulerRad,
  mergeFlowWireTransformIntoScene3d,
  readFlowWireTransformEulerMapping,
} from "../../src/webview/sensor-studio/features/editor/nodes/transform/flow-wire-transform";
import { defaultScene3DConfig } from "../../src/webview/sensor-studio/features/editor/nodes/rotation/scene3d-config";

test("mergeFlowWireTransformIntoScene3d overrides model transform", () => {
  const base = defaultScene3DConfig();
  const wire = coerceFlowWireTransformV1({
    version: 1,
    position: { x: 1, y: 2, z: 3 },
    rotationDeg: { x: 10, y: 20, z: 30 },
    scale: { x: 2, y: 2, z: 2 },
  });
  const merged = mergeFlowWireTransformIntoScene3d(base, wire);
  assert.deepEqual(merged.model.transform.position, wire.position);
  assert.deepEqual(merged.model.transform.rotationDeg, wire.rotationDeg);
  assert.deepEqual(merged.model.transform.scale, wire.scale);
});

test("flowWireTransformFromEulerRad literal maps radians to degrees on matching axes", () => {
  const wire = flowWireTransformFromEulerRad({ x: 0, y: 0, z: Math.PI / 2 }, undefined, "literal");
  assert.ok(Math.abs(wire.rotationDeg.z - 90) < 1e-6);
  assert.equal(wire.eulerMapping, "literal");
  assert.equal(wire.scale.x, 1);
});

test("flowWireTransformFromEulerRad fusion remaps roll to Three Y and stores hundredths", () => {
  const rollRad = 1;
  const wire = flowWireTransformFromEulerRad({ x: rollRad, y: 0, z: 0 }, undefined, "fusion");
  assert.equal(wire.eulerMapping, "fusion");
  assert.deepEqual(wire.fusionEulerHundredths, { roll: 100, pitch: 0, heading: 0 });
  const expectedYDeg = (rollRad * 180) / Math.PI;
  assert.ok(Math.abs(wire.rotationDeg.y - expectedYDeg) < 0.02);
  assert.ok(Math.abs(wire.rotationDeg.x) < 0.02);
  assert.ok(Math.abs(wire.rotationDeg.z) < 0.02);
});

test("readFlowWireTransformEulerMapping defaults to fusion", () => {
  assert.equal(readFlowWireTransformEulerMapping(undefined), "fusion");
  assert.equal(readFlowWireTransformEulerMapping("literal"), "literal");
});
