import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveGlbCameraBlendWeights,
  pickActiveGlbCameraName,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-preview-runtime";

test("resolveGlbCameraBlendWeights ignores drives at or below 0.5", () => {
  assert.deepEqual(resolveGlbCameraBlendWeights({ CamA: 0.5, CamB: 0.2 }), []);
});

test("resolveGlbCameraBlendWeights normalizes active camera weights", () => {
  const blend = resolveGlbCameraBlendWeights({ CamA: 1, CamB: 1 });
  assert.equal(blend.length, 2);
  assert.equal(blend[0]?.name, "CamA");
  assert.equal(blend[1]?.name, "CamB");
  assert.ok(Math.abs((blend[0]?.weight ?? 0) - 0.5) < 1e-6);
  assert.ok(Math.abs((blend[1]?.weight ?? 0) - 0.5) < 1e-6);
});

test("pickActiveGlbCameraName returns highest-weight active camera", () => {
  assert.equal(pickActiveGlbCameraName({ Wide: 0.6, Close: 0.9 }), "Close");
});
