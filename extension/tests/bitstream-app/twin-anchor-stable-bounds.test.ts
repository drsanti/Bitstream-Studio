import assert from "node:assert/strict";
import test from "node:test";
import { meshExcludedFromStableTwinBounds } from "../../src/webview/bitstream-app/components/animation-lab/css3d/compute-twin-anchor-world-positions.js";

test("meshExcludedFromStableTwinBounds skips spinning parts", () => {
  assert.equal(meshExcludedFromStableTwinBounds("Propeller_FL"), true);
  assert.equal(meshExcludedFromStableTwinBounds("blade_01"), true);
  assert.equal(meshExcludedFromStableTwinBounds("Wing front left"), false);
  assert.equal(meshExcludedFromStableTwinBounds("Gimbal1"), false);
  assert.equal(meshExcludedFromStableTwinBounds("Body"), false);
});
