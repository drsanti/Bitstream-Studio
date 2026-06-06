import assert from "node:assert/strict";
import test from "node:test";

import { serializePoseLandmarksCompact } from "../../src/webview/sensor-studio/core/camera/vision-landmarks-serialize";
import { mapHandLandmarksToSnapshot } from "../../src/webview/sensor-studio/core/camera/vision-hands-config";
import { mapFaceLandmarksToSnapshot } from "../../src/webview/sensor-studio/core/camera/vision-face-config";
import { mapObjectDetectionsToSnapshot } from "../../src/webview/sensor-studio/core/camera/vision-object-config";
import { isVisionInferenceNodeId } from "../../src/webview/sensor-studio/core/camera/evaluate-vision-flow-nodes";

test("serializePoseLandmarksCompact truncates and counts", () => {
  const landmarks = Array.from({ length: 25 }, (_, i) => ({
    x: i / 25,
    y: 0.5,
    visibility: 0.9,
  }));
  const out = serializePoseLandmarksCompact({ landmarks, maxPoints: 5 });
  assert.equal(out.count, 25);
  const parsed = JSON.parse(out.json) as unknown[];
  assert.equal(parsed.length, 5);
});

test("mapHandLandmarksToSnapshot maps left/right index tips", () => {
  const leftHand = Array.from({ length: 21 }, () => ({ x: 0, y: 0, visibility: 0 }));
  leftHand[8] = { x: 0.2, y: 0.8, visibility: 0.91 };
  const rightHand = Array.from({ length: 21 }, () => ({ x: 0, y: 0, visibility: 0 }));
  rightHand[8] = { x: 0.8, y: 0.8, visibility: 0.88 };
  const mapped = mapHandLandmarksToSnapshot({
    landmarks: [leftHand, rightHand],
    handedness: [[{ categoryName: "Left" }], [{ categoryName: "Right" }]],
    minDetectionConfidence: 0.5,
  });
  assert.equal(mapped.detected, true);
  assert.equal(mapped.leftIndex.x, 0.2);
  assert.equal(mapped.rightIndex.x, 0.8);
});

test("mapFaceLandmarksToSnapshot detects face above threshold", () => {
  const face = Array.from({ length: 300 }, () => ({ x: 0, y: 0, visibility: 0 }));
  face[1] = { x: 0.5, y: 0.4, visibility: 0.85 };
  face[33] = { x: 0.4, y: 0.35, visibility: 0.8 };
  face[263] = { x: 0.6, y: 0.35, visibility: 0.82 };
  const mapped = mapFaceLandmarksToSnapshot({
    landmarks: [face],
    minDetectionConfidence: 0.5,
  });
  assert.equal(mapped.detected, true);
  assert.equal(mapped.nose.x, 0.5);
});

test("mapObjectDetectionsToSnapshot picks top label", () => {
  const mapped = mapObjectDetectionsToSnapshot({
    detections: [
      { categories: [{ categoryName: "cup", score: 0.62 }] },
      { categories: [{ categoryName: "person", score: 0.81 }] },
    ],
    scoreThreshold: 0.35,
  });
  assert.equal(mapped.detected, true);
  assert.equal(mapped.count, 2);
  assert.equal(mapped.label, "person");
  assert.equal(mapped.score, 0.81);
});

test("isVisionInferenceNodeId includes Phase D nodes", () => {
  assert.equal(isVisionInferenceNodeId("vision-hands"), true);
  assert.equal(isVisionInferenceNodeId("vision-landmarks-debug"), true);
  assert.equal(isVisionInferenceNodeId("threshold"), false);
});
