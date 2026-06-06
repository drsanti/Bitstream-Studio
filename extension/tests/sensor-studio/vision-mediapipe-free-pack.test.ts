import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultVisionMediapipePackFilePaths,
  isVisionMediapipeCorePackFile,
  repoPathsFromVisionMediapipeManifest,
  visionMediapipeFreePackRepoPaths,
  visionMediapipePackRelativeToRepoPath,
  VISION_MEDIAPIPE_PACK_REL,
} from "../../src/asset-sync/visionMediapipeFreePack";
import { resolveVisionMediapipePackAssetUrl } from "../../src/webview/sensor-studio/core/camera/vision-mediapipe-url-resolver";

test("visionMediapipePackRelativeToRepoPath prefixes assets/", () => {
  assert.equal(
    visionMediapipePackRelativeToRepoPath("wasm/vision_wasm_internal.wasm"),
    "assets/vision/mediapipe/wasm/vision_wasm_internal.wasm",
  );
});

test("visionMediapipeFreePackRepoPaths includes wasm and lite pose", () => {
  const paths = visionMediapipeFreePackRepoPaths();
  assert.ok(paths.some((p) => p.endsWith("pose_landmarker_lite.task")));
  assert.ok(paths.some((p) => p.includes("/wasm/vision_wasm_internal.wasm")));
});

test("isVisionMediapipeCorePackFile classifies wasm and lite pose", () => {
  assert.equal(isVisionMediapipeCorePackFile("wasm/vision_wasm_internal.wasm"), true);
  assert.equal(isVisionMediapipeCorePackFile("pose_landmarker_lite.task"), true);
  assert.equal(isVisionMediapipeCorePackFile("hand_landmarker.task"), false);
});

test("repoPathsFromVisionMediapipeManifest maps manifest entries", () => {
  const paths = repoPathsFromVisionMediapipeManifest({
    revision: "2026-06-07T00:00:00Z",
    files: [{ path: "hand_landmarker.task", bytes: 1 }],
  });
  assert.ok(paths.includes("assets/vision/mediapipe/manifest.v1.json"));
  assert.ok(paths.includes("assets/vision/mediapipe/hand_landmarker.task"));
});

test("resolveVisionMediapipePackAssetUrl prefers free base for optional models", () => {
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      LOCAL_ASSETS_BASE_URI: "vscode-webview://local/out/webview/assets/",
      FREE_ASSETS_BASE_URI: "vscode-webview://local/free/",
      ONLINE_ASSETS_BASE_URI: "https://raw.githubusercontent.com/example/main/assets/",
      location: { href: "vscode-webview://local/index.html" },
    },
  });
  try {
    const hand = resolveVisionMediapipePackAssetUrl("hand_landmarker.task");
    assert.ok(hand.includes("/free/"));
    assert.ok(hand.endsWith("hand_landmarker.task"));

    const lite = resolveVisionMediapipePackAssetUrl("pose_landmarker_lite.task");
    assert.ok(lite.includes("/out/webview/assets/"));
    assert.ok(lite.includes(VISION_MEDIAPIPE_PACK_REL));
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

test("defaultVisionMediapipePackFilePaths lists expected optional models", () => {
  const files = defaultVisionMediapipePackFilePaths();
  assert.ok(files.includes("efficientdet_lite0.tflite"));
  assert.equal(files.filter((f) => f.startsWith("wasm/")).length, 4);
});
