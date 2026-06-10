import test from "node:test";
import assert from "node:assert/strict";
import { Euler, Object3D } from "three";

import {
  canDiagram3dNodeUseRotateGizmo,
  readEulerDegreesFromObject3D,
  readScaleFromObject3D,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dGizmoHelpers";
import { defaultBmi270QuaternionRotation } from "../../src/webview/course-studio/runtime/diagram/diagram3dNodeMutations";

test("canDiagram3dNodeUseRotateGizmo allows static euler only", () => {
  assert.equal(canDiagram3dNodeUseRotateGizmo(undefined), true);
  assert.equal(canDiagram3dNodeUseRotateGizmo([0, 0, 0]), true);
  assert.equal(canDiagram3dNodeUseRotateGizmo(defaultBmi270QuaternionRotation()), false);
  assert.equal(
    canDiagram3dNodeUseRotateGizmo({
      kind: "euler",
      pitch: { path: "bmi270.pitch", fallback: 0 },
    }),
    false,
  );
});

test("readEulerDegreesFromObject3D maps three.js rotation to schema tuple", () => {
  const object = new Object3D();
  object.rotation.copy(new Euler(Math.PI / 2, 0, -Math.PI / 4, "XYZ"));
  assert.deepEqual(readEulerDegreesFromObject3D(object), [90, 0, -45]);
});

test("readScaleFromObject3D reads object scale", () => {
  const object = new Object3D();
  object.scale.set(2, 0.5, 1.23456);
  assert.deepEqual(readScaleFromObject3D(object), [2, 0.5, 1.235]);
});
