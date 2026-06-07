import assert from "node:assert/strict";
import test from "node:test";

import {
  createStudioFlowPresetMeta,
  parseStudioFlowPresetFile,
  serializeStudioFlowPresetFile,
  STUDIO_FLOW_PRESET_MARKER,
  STUDIO_FLOW_PRESET_VERSION,
  type StudioFlowPresetFile,
} from "../../src/webview/sensor-studio/features/editor/flow-library/studio-flow-preset-file";

test("parseStudioFlowPresetFile round-trips a minimal preset", () => {
  const asset: StudioFlowPresetFile = {
    marker: STUDIO_FLOW_PRESET_MARKER,
    version: STUDIO_FLOW_PRESET_VERSION,
    meta: createStudioFlowPresetMeta("Gauge monitor", {
      category: "telemetry",
      presetKind: "flowPartial",
    }),
    document: {
      version: 1,
      nodes: [],
      edges: [],
    },
  };
  const text = serializeStudioFlowPresetFile(asset);
  const parsed = parseStudioFlowPresetFile(text);
  assert.notEqual(parsed, null);
  assert.equal(parsed?.meta.name, "Gauge monitor");
  assert.equal(parsed?.meta.category, "telemetry");
  assert.equal(parsed?.meta.presetKind, "flowPartial");
});

test("parseStudioFlowPresetFile rejects invalid marker or missing document", () => {
  assert.equal(parseStudioFlowPresetFile("{}"), null);
  assert.equal(
    parseStudioFlowPresetFile(
      JSON.stringify({
        marker: STUDIO_FLOW_PRESET_MARKER,
        version: STUDIO_FLOW_PRESET_VERSION,
        meta: { name: "x" },
      }),
    ),
    null,
  );
});

test("parseStudioFlowPresetFile defaults unknown category to custom", () => {
  const parsed = parseStudioFlowPresetFile(
    JSON.stringify({
      marker: STUDIO_FLOW_PRESET_MARKER,
      version: STUDIO_FLOW_PRESET_VERSION,
      meta: { name: "Test", category: "unknown-bucket", presetKind: "flowFull" },
      document: { version: 1, nodes: [], edges: [] },
    }),
  );
  assert.equal(parsed?.meta.category, "custom");
});
