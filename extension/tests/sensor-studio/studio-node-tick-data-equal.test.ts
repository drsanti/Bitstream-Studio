import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isStudioNodeTickRuntimeEqual } from "../../src/webview/sensor-studio/features/editor/store/studio-node-tick-data-equal.ts";
import type { StudioNodeData } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store.ts";

function baseData(overrides: Partial<StudioNodeData> = {}): StudioNodeData {
  return {
    nodeId: "sine-wave",
    label: "Sine",
    defaultConfig: {},
    ...overrides,
  };
}

describe("studio-node-tick-data-equal", () => {
  it("ignores lastUpdatedAt when runtime fields match", () => {
    const prev = baseData({ liveValue: 0.5, lastUpdatedAt: "2026-01-01T00:00:00.000Z" });
    const next = baseData({ liveValue: 0.5 });
    assert.equal(isStudioNodeTickRuntimeEqual(prev, next), true);
  });

  it("detects liveValue changes", () => {
    const prev = baseData({ liveValue: 0.5 });
    const next = baseData({ liveValue: 0.6 });
    assert.equal(isStudioNodeTickRuntimeEqual(prev, next), false);
  });

  it("detects liveHistory changes", () => {
    const prev = baseData({ liveValue: 0.5, liveHistory: [0.4, 0.5] });
    const next = baseData({ liveValue: 0.5, liveHistory: [0.4, 0.5, 0.6] });
    assert.equal(isStudioNodeTickRuntimeEqual(prev, next), false);
  });
});
