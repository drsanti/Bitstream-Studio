import assert from "node:assert/strict";
import test from "node:test";

import {
  mapPoseLandmarksToSnapshot,
  poseLandmarkToFlowVec3,
  readVisionPoseConfig,
  resolveVisionPoseTargetFps,
} from "../../src/webview/sensor-studio/core/camera/vision-pose-config";

test("resolveVisionPoseTargetFps maps quality presets", () => {
  assert.equal(resolveVisionPoseTargetFps("low"), 8);
  assert.equal(resolveVisionPoseTargetFps("med"), 15);
  assert.equal(resolveVisionPoseTargetFps("high"), 24);
});

test("readVisionPoseConfig clamps confidence and fps", () => {
  const cfg = readVisionPoseConfig({
    targetFps: 99,
    minDetectionConfidence: 2,
    minTrackingConfidence: -1,
    qualityPreset: "high",
    modelVariant: "full",
  });
  assert.equal(cfg.targetFps, 30);
  assert.equal(cfg.minDetectionConfidence, 1);
  assert.equal(cfg.minTrackingConfidence, 0);
  assert.equal(cfg.modelVariant, "full");
});

test("poseLandmarkToFlowVec3 uses visibility in z", () => {
  const v = poseLandmarkToFlowVec3({ x: 0.4, y: 0.6, visibility: 0.92 });
  assert.equal(v.x, 0.4);
  assert.equal(v.y, 0.6);
  assert.equal(v.z, 0.92);
});

test("mapPoseLandmarksToSnapshot detects pose above threshold", () => {
  const landmarks = Array.from({ length: 17 }, () => ({ x: 0, y: 0, visibility: 0 }));
  landmarks[0] = { x: 0.5, y: 0.4, visibility: 0.88 };
  landmarks[15] = { x: 0.2, y: 0.7, visibility: 0.75 };
  landmarks[16] = { x: 0.8, y: 0.7, visibility: 0.8 };
  const mapped = mapPoseLandmarksToSnapshot({
    landmarks,
    minDetectionConfidence: 0.5,
  });
  assert.equal(mapped.detected, true);
  assert.equal(mapped.score, 0.88);
  assert.equal(mapped.nose.x, 0.5);
});
