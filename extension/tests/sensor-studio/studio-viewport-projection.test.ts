import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as THREE from "three";
import {
  computeOrthoZoomFromPerspectiveView,
  createStudioViewportOrthographicCamera,
  STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT,
  updateStudioViewportOrthographicCameraAspect,
} from "../../src/webview/sensor-studio/core/viewport/studio-viewport-projection.ts";

describe("studio-viewport-projection", () => {
  it("computeOrthoZoomFromPerspectiveView increases zoom when distance shrinks", () => {
    const near = computeOrthoZoomFromPerspectiveView({
      distance: 5,
      fovDeg: 55,
    });
    const far = computeOrthoZoomFromPerspectiveView({
      distance: 20,
      fovDeg: 55,
    });
    assert.ok(near > far);
  });

  it("ortho aspect update preserves frustum height", () => {
    const cam = createStudioViewportOrthographicCamera(1);
    updateStudioViewportOrthographicCameraAspect(cam, 2);
    assert.equal(cam.top - cam.bottom, STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT);
    assert.equal(cam.right - cam.left, STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT * 2);
    cam.updateProjectionMatrix();
    assert.ok(Number.isFinite(cam.projectionMatrix.elements[0] ?? NaN));
  });
});
