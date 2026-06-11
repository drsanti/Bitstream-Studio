import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dashboardMarqueeRectFromClientPoints } from "../../src/webview/sensor-studio/core/dashboard/dashboard-marquee-select";

describe("dashboard-marquee-select", () => {
  it("dashboardMarqueeRectFromClientPoints computes width and height", () => {
    const rect = dashboardMarqueeRectFromClientPoints(10, 20, 30, 50);
    assert.deepEqual(rect, {
      left: 10,
      top: 20,
      width: 20,
      height: 30,
    });
  });
});
