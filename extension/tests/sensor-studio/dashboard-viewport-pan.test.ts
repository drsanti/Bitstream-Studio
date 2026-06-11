import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dashboardViewportPanExceedsThreshold,
  dashboardViewportPanOffsets,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-viewport-pan";

test("dashboardViewportPanOffsets adds pointer delta to origin pan", () => {
  const next = dashboardViewportPanOffsets({
    originPanX: 12,
    originPanY: 8,
    startClientX: 100,
    startClientY: 200,
    clientX: 120,
    clientY: 230,
  });
  assert.equal(next.x, 32);
  assert.equal(next.y, 38);
});

test("dashboardViewportPanExceedsThreshold respects drag threshold", () => {
  assert.equal(
    dashboardViewportPanExceedsThreshold({
      startClientX: 0,
      startClientY: 0,
      clientX: 2,
      clientY: 2,
      thresholdPx: 4,
    }),
    false,
  );
  assert.equal(
    dashboardViewportPanExceedsThreshold({
      startClientX: 0,
      startClientY: 0,
      clientX: 5,
      clientY: 0,
      thresholdPx: 4,
    }),
    true,
  );
});
