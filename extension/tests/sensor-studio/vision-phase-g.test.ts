import assert from "node:assert/strict";
import test from "node:test";

import {
  collectVisionLandmarks3dSpecs,
  graphHasVisionLandmarks3d,
} from "../../src/webview/sensor-studio/core/camera/collect-vision-landmarks-3d-specs";
import { readVisionHandsConfig } from "../../src/webview/sensor-studio/core/camera/vision-hands-config";
import { readVisionLandmarksDebugConfig } from "../../src/webview/sensor-studio/core/camera/vision-landmarks-debug-config";
import { readVisionPoseConfig } from "../../src/webview/sensor-studio/core/camera/vision-pose-config";
import { isVisionInferenceBackend } from "../../src/webview/sensor-studio/core/camera/vision-shared-config";

test("readVisionLandmarksDebugConfig defaults 3D debug on for landmarks-debug node", () => {
  const fromCatalog = readVisionLandmarksDebugConfig({
    drawLandmarks3d: true,
    inferenceBackend: "main",
  });
  assert.equal(fromCatalog.drawLandmarks3d, true);
  assert.equal(fromCatalog.inferenceBackend, "main");

  const empty = readVisionLandmarksDebugConfig({});
  assert.equal(empty.drawLandmarks3d, false);
  assert.equal(empty.inferenceBackend, "main");
});

test("readVisionPoseConfig defaults drawLandmarks3d off", () => {
  const cfg = readVisionPoseConfig({});
  assert.equal(cfg.drawLandmarks3d, false);
});

test("readVisionHandsConfig parses worker inference backend", () => {
  const cfg = readVisionHandsConfig({ inferenceBackend: "worker" });
  assert.equal(cfg.inferenceBackend, "worker");
});

test("isVisionInferenceBackend accepts main and worker", () => {
  assert.equal(isVisionInferenceBackend("main"), true);
  assert.equal(isVisionInferenceBackend("worker"), true);
  assert.equal(isVisionInferenceBackend("gpu"), false);
});

test("collectVisionLandmarks3dSpecs includes nodes with drawLandmarks3d enabled", () => {
  const nodes = [
    {
      id: "cam-1",
      data: { nodeId: "camera-input", defaultConfig: { mirrorPreview: false } },
    },
    {
      id: "dbg-1",
      data: {
        nodeId: "vision-landmarks-debug",
        defaultConfig: { drawLandmarks3d: true, minSketchVisibility: 0.4 },
      },
    },
  ] as const;
  const edges = [{ source: "cam-1", target: "dbg-1", targetHandle: "in" }] as const;
  const specs = collectVisionLandmarks3dSpecs(nodes, edges);
  assert.equal(specs.length, 1);
  assert.equal(specs[0]?.visionNodeId, "dbg-1");
  assert.equal(specs[0]?.mirrorPreview, false);
  assert.equal(specs[0]?.minVisibility, 0.4);
});

test("graphHasVisionLandmarks3d is false without drawLandmarks3d flag", () => {
  assert.equal(
    graphHasVisionLandmarks3d([
      { data: { nodeId: "vision-pose", defaultConfig: { drawSketchOverlay: true } } },
    ]),
    false,
  );
  assert.equal(
    graphHasVisionLandmarks3d([
      { data: { nodeId: "vision-landmarks-debug", defaultConfig: { drawLandmarks3d: true } } },
    ]),
    true,
  );
});
