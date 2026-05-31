import assert from "node:assert/strict";
import test from "node:test";
import { computeDps368PinBundle } from "../../src/webview/sensor-studio/core/live/environment-sensors-live-ports";

test("computeDps368PinBundle pressure uses hPa×10 wire scaling", () => {
  const bundle = computeDps368PinBundle({
    dps368: {
      sourceHint: "dps368",
      secondaryX100: 10055,
      temperatureCx100: 2350,
    } as Parameters<typeof computeDps368PinBundle>[0]["dps368"],
  });
  assert.equal(bundle.pressureHpa, 1005.5);
  assert.equal(bundle.tempC, 23.5);
  assert.equal(bundle.streamLive, true);
});
