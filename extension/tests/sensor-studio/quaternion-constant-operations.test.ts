import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateQuaternionConstant,
  QUATERNION_CONSTANT_DEFAULTS,
} from "../../src/webview/sensor-studio/core/flow/quaternion-constant-operations";

test("evaluateQuaternionConstant builds quaternion wire", () => {
  assert.deepEqual(evaluateQuaternionConstant(1, 0.1, 0.2, 0.3), {
    w: 1,
    x: 0.1,
    y: 0.2,
    z: 0.3,
  });
  assert.deepEqual(
    evaluateQuaternionConstant(Number.NaN, 0, 0, 0),
    QUATERNION_CONSTANT_DEFAULTS,
  );
});
