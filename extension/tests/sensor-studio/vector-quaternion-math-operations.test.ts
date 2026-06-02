import assert from "node:assert/strict";
import test from "node:test";

import { evaluateVectorQuaternionMathNode } from "../../src/webview/sensor-studio/core/flow/flow-vector-quaternion-math-eval";
import {
  eulerToQuaternion,
  quaternionMultiply,
  quaternionToEuler,
  rotateVectorByQuaternion,
} from "../../src/webview/sensor-studio/core/flow/quaternion-math-operations";
import {
  vectorCross,
  vectorDot,
  vectorLength,
  vectorNormalize,
} from "../../src/webview/sensor-studio/core/flow/vector-math-operations";

test("vectorLength and normalize", () => {
  const v = { x: 3, y: 0, z: 4 };
  assert.equal(vectorLength(v), 5);
  const u = vectorNormalize(v);
  assert.ok(Math.abs(vectorLength(u) - 1) < 1e-6);
});

test("vectorDot and cross", () => {
  assert.equal(vectorDot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }), 0);
  assert.deepEqual(vectorCross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }), {
    x: 0,
    y: 0,
    z: 1,
  });
});

test("euler quaternion round trip (approx)", () => {
  const e = { x: 0.1, y: 0.2, z: 0.3 };
  const q = eulerToQuaternion(e);
  const back = quaternionToEuler(q);
  assert.ok(Math.abs(back.x - e.x) < 0.01);
  assert.ok(Math.abs(back.y - e.y) < 0.01);
  assert.ok(Math.abs(back.z - e.z) < 0.01);
});

test("evaluateVectorQuaternionMathNode vector-length", () => {
  const out = evaluateVectorQuaternionMathNode(
    "vector-length",
    () => ({ x: 3, y: 0, z: 4 }),
    {},
  );
  assert.equal(out, 5);
});

test("rotateVectorByQuaternion leaves X axis unchanged for identity", () => {
  const r = rotateVectorByQuaternion({ x: 1, y: 0, z: 0 }, { w: 1, x: 0, y: 0, z: 0 });
  assert.ok(Math.abs(r.x - 1) < 1e-5);
});

test("quaternionMultiply identity", () => {
  const id = { w: 1, x: 0, y: 0, z: 0 };
  const q = { w: 0.707, x: 0, y: 0.707, z: 0 };
  const r = quaternionMultiply(id, q);
  assert.ok(Math.abs(r.w - q.w) < 0.01);
});
