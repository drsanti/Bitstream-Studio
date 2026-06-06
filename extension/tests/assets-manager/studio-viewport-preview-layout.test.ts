import assert from "node:assert/strict";
import test from "node:test";
import {
  computeViewportPreviewCanvasDimensions,
  computeViewportPreviewNodeDimensions,
  resolveViewportPreviewChromeFromNode,
  resolveViewportPreviewLayoutSelection,
  STUDIO_VIEWPORT_PREVIEW_HORIZONTAL_INSET_PX,
  STUDIO_VIEWPORT_PREVIEW_PANEL_CHROME_HEIGHT_PX,
  viewportPreviewNodeDimensionsMatch,
} from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/studio-viewport-preview-layout";
import type { StudioNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function makeSceneNode(
  width: number,
  height: number,
  ui?: StudioNode["data"]["ui"],
): StudioNode {
  return {
    id: "n1",
    type: "studio",
    position: { x: 0, y: 0 },
    width,
    height,
    data: {
      label: "Model Viewer",
      nodeId: "model-viewer",
      category: "output",
      defaultConfig: {},
      ui,
    },
  } as StudioNode;
}

const HEAD = 220;

test("computeViewportPreviewCanvasDimensions uses width-primary aspect tiers", () => {
  assert.deepEqual(
    computeViewportPreviewCanvasDimensions("4:3", "md", "model-viewer"),
    { width: 480, height: 360 },
  );
  assert.deepEqual(
    computeViewportPreviewCanvasDimensions("16:9", "md", "model-viewer"),
    { width: 480, height: 270 },
  );
});

test("computeViewportPreviewNodeDimensions adds chrome to canvas target", () => {
  const chrome = { headHeight: HEAD, minNodeWidth: 280 };
  const layout = computeViewportPreviewNodeDimensions(
    "4:3",
    "md",
    "model-viewer",
    chrome,
  );
  assert.equal(layout.canvasWidth, 480);
  assert.equal(layout.canvasHeight, 360);
  assert.equal(
    layout.width,
    Math.max(280, 480 + STUDIO_VIEWPORT_PREVIEW_HORIZONTAL_INSET_PX),
  );
  assert.equal(layout.height, HEAD + 360);
});

test("resolveViewportPreviewLayoutSelection matches canvas not whole node", () => {
  const chrome = { headHeight: HEAD, minNodeWidth: 280 };
  const layout = computeViewportPreviewNodeDimensions(
    "16:9",
    "md",
    "model-viewer",
    chrome,
  );
  const node = makeSceneNode(layout.width, layout.height, {
    resizable: true,
    previewAspect: "16:9",
    previewSizeTier: "md",
    viewportPreviewHeadHeight: HEAD,
    contentMinWidth: 280,
  });
  const sel = resolveViewportPreviewLayoutSelection(node);
  assert.equal(sel.isCustom, false);
  assert.equal(sel.aspect, "16:9");
  assert.equal(sel.sizeTier, "md");
  assert.equal(sel.canvasWidth, 480);
  assert.equal(sel.canvasHeight, 270);
});

test("viewportPreviewNodeDimensionsMatch is false when only node box matches old model A", () => {
  const node = makeSceneNode(480, 270, {
    viewportPreviewHeadHeight: HEAD,
    contentMinWidth: 280,
  });
  assert.equal(
    viewportPreviewNodeDimensionsMatch(node, "16:9", "md"),
    false,
  );
});

test("resolveViewportPreviewChromeFromNode prefers measured head height", () => {
  const node = makeSceneNode(600, 600, {
    viewportPreviewHeadHeight: 192,
    contentMinWidth: 320,
  });
  const chrome = resolveViewportPreviewChromeFromNode(node);
  assert.equal(chrome.headHeight, 192);
  assert.equal(chrome.minNodeWidth, 320);
});

test("panel chrome constant covers ReadingPanel title stack", () => {
  assert.ok(STUDIO_VIEWPORT_PREVIEW_PANEL_CHROME_HEIGHT_PX >= 32);
});
