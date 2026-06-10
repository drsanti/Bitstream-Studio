import assert from "node:assert/strict";
import test from "node:test";
import { Object3D, Quaternion, Euler } from "three";

import { applyResolvedRotationToObject3D } from "../../src/webview/course-studio/runtime/diagram/diagram3dTransform";

test("applyResolvedRotationToObject3D sets quaternion on object", () => {
  const object = new Object3D();
  applyResolvedRotationToObject3D(object, {
    kind: "quaternion",
    qw: 1,
    qx: 0,
    qy: 0,
    qz: 0,
  });
  const quat = new Quaternion();
  object.getWorldQuaternion(quat);
  assert.ok(Math.abs(quat.w - 1) < 0.001);
});

test("applyResolvedRotationToObject3D sets euler degrees on object", () => {
  const object = new Object3D();
  applyResolvedRotationToObject3D(object, {
    kind: "euler",
    pitch: 90,
    yaw: 0,
    roll: 0,
  });
  const euler = new Euler().setFromQuaternion(object.quaternion, "XYZ");
  assert.ok(Math.abs((euler.x * 180) / Math.PI - 90) < 0.01);
});
