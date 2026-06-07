import assert from "node:assert/strict";
import test from "node:test";

import { parseRemoteFlowPresetIndex } from "../../src/webview/sensor-studio/features/editor/flow-library/remote-flow-preset-index";

test("parseRemoteFlowPresetIndex accepts valid entries", () => {
  const parsed = parseRemoteFlowPresetIndex({
    entries: [
      {
        id: "demo-gauge",
        name: "Gauge monitor",
        category: "telemetry",
        file: "gauge-monitor.trn-flow-preset.json",
        description: "Starter",
      },
    ],
  });
  assert.notEqual(parsed, null);
  assert.equal(parsed?.entries.length, 1);
  assert.equal(parsed?.entries[0]?.id, "demo-gauge");
});

test("parseRemoteFlowPresetIndex rejects invalid payloads", () => {
  assert.equal(parseRemoteFlowPresetIndex(null), null);
  assert.equal(parseRemoteFlowPresetIndex({ entries: [] }), null);
  assert.equal(parseRemoteFlowPresetIndex({ entries: [{ id: "", name: "x", file: "a.json" }] }), null);
});
