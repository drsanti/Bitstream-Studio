import assert from "node:assert/strict";
import test from "node:test";
import { formatDeltaThresholdDisplay } from "../../src/webview/bitstream-app/lib/sensorCfgDeltaThresholdDisplay";

test("formatDeltaThresholdDisplay — any vs percent steps", () => {
  assert.equal(formatDeltaThresholdDisplay(0), "Any");
  assert.equal(formatDeltaThresholdDisplay(10), "10%");
  assert.equal(formatDeltaThresholdDisplay(25), "25%");
});
