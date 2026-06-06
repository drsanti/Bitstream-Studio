import assert from "node:assert/strict";
import test from "node:test";

import {
  collectVisionPoseSketchSpecs,
  graphHasVisionPoseSketch,
} from "../../src/webview/sensor-studio/core/camera/collect-vision-pose-sketches";
import { studioVisionLandmarkCache } from "../../src/webview/sensor-studio/core/camera/studio-vision-landmark-cache";
import { formatVisionMediapipeLoadPercent } from "../../src/webview/sensor-studio/core/camera/vision-mediapipe-asset-loader";
import {
  bundledVisionMediapipeEndpoints,
  getVisionMediapipeEndpoints,
  isPreferBundledMediapipeEnabled,
  PREFER_BUNDLED_MEDIAPIPE_STORAGE_KEY,
  resetVisionMediapipeEndpoints,
  resolveBundledMediapipeRoot,
  setPreferBundledMediapipeEnabled,
  VISION_MEDIAPIPE_BUNDLED_REL,
} from "../../src/webview/sensor-studio/core/camera/vision-mediapipe-endpoints";
import {
  mapLandmarksToSketchPoints,
  sketchPointToSvg,
} from "../../src/webview/sensor-studio/core/camera/vision-pose-sketch";
import { readVisionPoseConfig } from "../../src/webview/sensor-studio/core/camera/vision-pose-config";

function withMockLocalStorage(run: () => void): void {
  const bag = new Map<string, string>();
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => {
        bag.set(key, value);
      },
      removeItem: (key: string) => {
        bag.delete(key);
      },
    },
  });
  try {
    run();
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: original,
    });
  }
}

test("readVisionPoseConfig defaults inference backend to main", () => {
  const cfg = readVisionPoseConfig({});
  assert.equal(cfg.inferenceBackend, "main");
});

test("readVisionPoseConfig reads overlay and worker backend fields", () => {
  const cfg = readVisionPoseConfig({
    drawSketchOverlay: true,
    minSketchVisibility: 0.5,
    inferenceBackend: "worker",
  });
  assert.equal(cfg.drawSketchOverlay, true);
  assert.equal(cfg.minSketchVisibility, 0.5);
  assert.equal(cfg.inferenceBackend, "worker");
});

test("readVisionPoseConfig defaults drawSketchOverlay to on", () => {
  const cfg = readVisionPoseConfig({});
  assert.equal(cfg.drawSketchOverlay, true);
});

test("graphHasVisionPoseSketch is true when overlay enabled on vision-pose", () => {
  assert.equal(
    graphHasVisionPoseSketch([
      { data: { nodeId: "vision-pose", defaultConfig: { drawSketchOverlay: true } } },
    ]),
    true,
  );
  assert.equal(
    graphHasVisionPoseSketch([{ data: { nodeId: "vision-pose", defaultConfig: {} } }]),
    true,
  );
  assert.equal(
    graphHasVisionPoseSketch([
      { data: { nodeId: "vision-pose", defaultConfig: { drawSketchOverlay: false } } },
    ]),
    false,
  );
});

test("collectVisionPoseSketchSpecs resolves camera from flow edge when liveVideoBusWire missing", () => {
  const nodes = [
    {
      id: "cam-1",
      data: {
        nodeId: "camera-input",
        defaultConfig: { mirrorPreview: true },
      },
    },
    {
      id: "pose-1",
      data: {
        nodeId: "vision-pose",
        defaultConfig: {},
      },
    },
  ] as const;
  const edges = [{ source: "cam-1", target: "pose-1", targetHandle: "in" }] as const;
  const specs = collectVisionPoseSketchSpecs(nodes, edges);
  assert.equal(specs.length, 1);
  assert.equal(specs[0]?.cameraNodeId, "cam-1");
  assert.equal(specs[0]?.mirrorPreview, true);
});

test("collectVisionPoseSketchSpecs resolves mirror from camera node", () => {
  const nodes = [
    {
      id: "cam-1",
      data: {
        nodeId: "camera-input",
        defaultConfig: { mirrorPreview: false },
        liveVideoBusWire: undefined,
      },
    },
    {
      id: "pose-1",
      data: {
        nodeId: "vision-pose",
        defaultConfig: { drawSketchOverlay: true, minSketchVisibility: 0.4 },
        liveVideoBusWire: {
          schemaVersion: 1,
          kind: "videoBus",
          sourceNodeId: "cam-1",
        },
      },
    },
  ] as const;
  const specs = collectVisionPoseSketchSpecs(nodes);
  assert.equal(specs.length, 1);
  assert.equal(specs[0]?.visionNodeId, "pose-1");
  assert.equal(specs[0]?.cameraNodeId, "cam-1");
  assert.equal(specs[0]?.mirrorPreview, false);
  assert.equal(specs[0]?.minVisibility, 0.4);
});

test("sketchPointToSvg mirrors normalized x when camera mirrorPreview is on", () => {
  const point = mapLandmarksToSketchPoints([{ x: 0.25, y: 0.5, visibility: 0.9 }])[0]!;
  const mirrored = sketchPointToSvg({
    point,
    width: 200,
    height: 100,
    mirror: true,
    minVisibility: 0.35,
  });
  const plain = sketchPointToSvg({
    point,
    width: 200,
    height: 100,
    mirror: false,
    minVisibility: 0.35,
  });
  assert.equal(mirrored.cx, 150);
  assert.equal(plain.cx, 50);
  assert.equal(mirrored.cy, 50);
  assert.equal(mirrored.visible, true);
});

test("studioVisionLandmarkCache stores and clears landmarks per node", () => {
  studioVisionLandmarkCache.setLandmarks("n1", [{ x: 0.1, y: 0.2, visibility: 0.8 }]);
  assert.equal(studioVisionLandmarkCache.getLandmarks("n1")?.length, 1);
  studioVisionLandmarkCache.setLandmarks("n1", undefined);
  assert.equal(studioVisionLandmarkCache.getLandmarks("n1"), undefined);
});

test("formatVisionMediapipeLoadPercent renders two decimal places", () => {
  assert.equal(formatVisionMediapipeLoadPercent(42.1874), "42.19%");
  assert.equal(formatVisionMediapipeLoadPercent(null), "Loading…");
});

test("prefer bundled mediapipe defaults on and switches endpoint base paths", () => {
  withMockLocalStorage(() => {
    resetVisionMediapipeEndpoints();
    assert.equal(isPreferBundledMediapipeEnabled(), true);
    setPreferBundledMediapipeEnabled(false);
    assert.equal(isPreferBundledMediapipeEnabled(), false);
    setPreferBundledMediapipeEnabled(true);
    assert.equal(isPreferBundledMediapipeEnabled(), true);
    const bundled = bundledVisionMediapipeEndpoints();
    assert.ok(
      bundled.wasmBase.includes("/assets/vision/mediapipe/wasm") ||
        bundled.wasmBase.includes("/__extension_src_assets/vision/mediapipe/wasm"),
    );
    assert.ok(bundled.poseLiteUrl.endsWith("pose_landmarker_lite.task"));
    const resolved = getVisionMediapipeEndpoints();
    assert.equal(resolved.wasmBase, bundled.wasmBase);
    assert.equal(resolved.poseLiteUrl, bundled.poseLiteUrl);
    resetVisionMediapipeEndpoints();
    assert.equal(isPreferBundledMediapipeEnabled(), true);
    assert.equal(localStorage.getItem(PREFER_BUNDLED_MEDIAPIPE_STORAGE_KEY), null);
  });
});

test("resolveBundledMediapipeRoot uses LOCAL_ASSETS_BASE_URI for VSIX webview", () => {
  const originalWindow = globalThis.window;
  const injectedBase =
    "vscode-webview://abc123/out/webview/assets/";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      LOCAL_ASSETS_BASE_URI: injectedBase,
      location: { href: "vscode-webview://abc123/index.html" },
    },
  });
  try {
    const root = resolveBundledMediapipeRoot();
    assert.equal(root, `${injectedBase}${VISION_MEDIAPIPE_BUNDLED_REL}`);
    const bundled = bundledVisionMediapipeEndpoints();
    assert.equal(
      bundled.wasmBase,
      `${injectedBase}${VISION_MEDIAPIPE_BUNDLED_REL}wasm`,
    );
    assert.equal(
      bundled.poseLiteUrl,
      `${injectedBase}${VISION_MEDIAPIPE_BUNDLED_REL}pose_landmarker_lite.task`,
    );
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});
