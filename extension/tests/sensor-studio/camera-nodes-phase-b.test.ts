import assert from "node:assert/strict";
import test from "node:test";

import { collectCss3dCameraFeeds } from "../../src/webview/sensor-studio/core/camera/studio-camera-css3d-feed";
import {
  glbMaterialVideoRowHasValues,
  mergeGlbMaterialVideoDriveRow,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-material-video";

test("mergeGlbMaterialVideoDriveRow stores live texture drives", () => {
  const row = mergeGlbMaterialVideoDriveRow(undefined, "map", {
    textureNodeId: "tex-1",
    gain: 1,
    toneMapped: false,
  });
  assert.equal(glbMaterialVideoRowHasValues(row), true);
  assert.equal(row.map?.textureNodeId, "tex-1");
});

test("collectCss3dCameraFeeds returns active screen feeds", () => {
  const feeds = collectCss3dCameraFeeds([
    {
      id: "feed-1",
      data: {
        nodeId: "css3d-camera-feed",
        defaultConfig: {
          visible: true,
          opacity: 1,
          anchorMode: "screen",
          anchor: { x: 0.8, y: 0.2, z: 0 },
          sizePx: { w: 240, h: 135 },
          borderRadiusPx: 6,
        },
        liveVideoBusWire: { kind: "videoBus", sourceNodeId: "cam-1" },
      },
    },
  ]);
  assert.equal(feeds.length, 1);
  assert.equal(feeds[0]?.cameraNodeId, "cam-1");
  assert.equal(feeds[0]?.anchorMode, "screen");
});
