import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  gaugeCanvasHealthGlobalAlpha,
  gaugeCanvasHealthPanelClassName,
  resolveGaugeCanvasHealthTone,
} from "../../src/webview/sensor-studio/features/editor/nodes/display/gauge-canvas-health";

describe("gauge-canvas-health", () => {
  it("dims only stale and offline telemetry", () => {
    assert.equal(resolveGaugeCanvasHealthTone("live"), null);
    assert.equal(resolveGaugeCanvasHealthTone("sim"), null);
    assert.equal(resolveGaugeCanvasHealthTone(undefined), null);
    assert.equal(resolveGaugeCanvasHealthTone("stale"), "stale");
    assert.equal(resolveGaugeCanvasHealthTone("offline"), "offline");
  });

  it("maps tone to canvas alpha and panel classes", () => {
    assert.equal(gaugeCanvasHealthGlobalAlpha(null), 1);
    assert.equal(gaugeCanvasHealthGlobalAlpha("stale"), 0.68);
    assert.equal(gaugeCanvasHealthGlobalAlpha("offline"), 0.42);
    assert.match(gaugeCanvasHealthPanelClassName("stale") ?? "", /opacity-/);
    assert.match(gaugeCanvasHealthPanelClassName("offline") ?? "", /opacity-/);
    assert.equal(gaugeCanvasHealthPanelClassName("live"), undefined);
  });
});
