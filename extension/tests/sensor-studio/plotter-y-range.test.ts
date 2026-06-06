import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_PLOTTER_CONFIG } from "../../src/webview/sensor-studio/features/editor/nodes/plotter/plotter-config";
import {
  computePlotterAutoYRange,
  formatPlotterYRangeSummary,
} from "../../src/webview/sensor-studio/features/editor/nodes/plotter/plotter-y-range";

test("computePlotterAutoYRange returns padded range for visible channels", () => {
  const range = computePlotterAutoYRange({
    histories: { ch1: [0, 1, 2], ch2: [] },
    channelOrder: ["ch1", "ch2"],
    channels: DEFAULT_PLOTTER_CONFIG.channels,
    historyLength: 256,
    verticalGain: 1,
    verticalOffset: 0,
  });
  assert.ok(range != null);
  assert.ok(range.yMin < 0);
  assert.ok(range.yMax > 2);
  assert.match(formatPlotterYRangeSummary(range!), /min .* · max .* · span/);
});

test("computePlotterAutoYRange returns null when no visible samples", () => {
  assert.equal(
    computePlotterAutoYRange({
      histories: { ch1: [] },
      channelOrder: ["ch1"],
      channels: DEFAULT_PLOTTER_CONFIG.channels,
      historyLength: 256,
      verticalGain: 1,
      verticalOffset: 0,
    }),
    null,
  );
});
