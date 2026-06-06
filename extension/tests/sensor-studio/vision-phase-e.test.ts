import assert from "node:assert/strict";
import test from "node:test";

import {
  bundledVisionMediapipeEndpoints,
  DEFAULT_VISION_MEDIAPIPE_ENDPOINTS,
  getVisionMediapipeEndpoints,
  resetVisionMediapipeEndpoints,
  setVisionMediapipeEndpoints,
} from "../../src/webview/sensor-studio/core/camera/vision-mediapipe-endpoints";
import { buildStageFlowMediaSceneProps } from "../../src/webview/sensor-studio/core/stage/build-stage-flow-media-scene-props";
import { graphHasVisionHudNodes } from "../../src/webview/sensor-studio/core/camera/collect-vision-hud-chips";

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

test("getVisionMediapipeEndpoints returns bundled defaults when storage empty", () => {
  withMockLocalStorage(() => {
    resetVisionMediapipeEndpoints();
    const ep = getVisionMediapipeEndpoints();
    const bundled = bundledVisionMediapipeEndpoints();
    assert.equal(ep.wasmBase, bundled.wasmBase);
    assert.equal(ep.poseLiteUrl, bundled.poseLiteUrl);
    assert.ok(ep.poseLiteUrl.includes("pose_landmarker_lite"));
  });
});

test("setVisionMediapipeEndpoints ignores overrides while bundled is preferred", () => {
  withMockLocalStorage(() => {
    resetVisionMediapipeEndpoints();
    setVisionMediapipeEndpoints({ wasmBase: "https://example.test/wasm" });
    const bundled = bundledVisionMediapipeEndpoints();
    assert.equal(getVisionMediapipeEndpoints().wasmBase, bundled.wasmBase);
    resetVisionMediapipeEndpoints();
  });
});

test("buildStageFlowMediaSceneProps returns empty without scene output", () => {
  assert.deepEqual(
    buildStageFlowMediaSceneProps({
      nodes: [],
      edges: [],
      sceneOutputNodeId: null,
      primaryModelSourceNodeId: null,
    }),
    {},
  );
});

test("graphHasVisionHudNodes detects vision catalog ids", () => {
  assert.equal(
    graphHasVisionHudNodes([{ data: { nodeId: "vision-face" } }]),
    true,
  );
  assert.equal(graphHasVisionHudNodes([{ data: { nodeId: "threshold" } }]), false);
});
