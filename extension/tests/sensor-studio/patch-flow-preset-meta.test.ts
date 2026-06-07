import assert from "node:assert/strict";
import test from "node:test";

import { patchFlowPresetMeta } from "../../src/webview/sensor-studio/features/editor/flow-library/flow-preset-upsert";
import type { StudioFlowPresetFile } from "../../src/webview/sensor-studio/features/editor/flow-library/studio-flow-preset-file";
import { STUDIO_FLOW_PRESET_MARKER, STUDIO_FLOW_PRESET_VERSION } from "../../src/webview/sensor-studio/features/editor/flow-library/studio-flow-preset-file";

function samplePreset(id: string): StudioFlowPresetFile {
  return {
    marker: STUDIO_FLOW_PRESET_MARKER,
    version: STUDIO_FLOW_PRESET_VERSION,
    meta: {
      id,
      name: "Old name",
      category: "utility",
      presetKind: "flowFull",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
    document: { version: 1, nodes: [], edges: [] },
  };
}

test("patchFlowPresetMeta updates name category and description", () => {
  const library = [samplePreset("p1")];
  const next = patchFlowPresetMeta(library, "p1", {
    name: "Gauge chain",
    category: "telemetry",
    description: "Demo",
  });
  assert.notEqual(next, null);
  assert.equal(next![0]!.meta.name, "Gauge chain");
  assert.equal(next![0]!.meta.category, "telemetry");
  assert.equal(next![0]!.meta.description, "Demo");
  assert.notEqual(next![0]!.meta.updatedAt, "2026-06-01T00:00:00.000Z");
});

test("patchFlowPresetMeta returns null for unknown id", () => {
  assert.equal(
    patchFlowPresetMeta([samplePreset("p1")], "missing", {
      name: "x",
      category: "custom",
    }),
    null,
  );
});
