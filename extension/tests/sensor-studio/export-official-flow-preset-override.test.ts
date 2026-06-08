import assert from "node:assert/strict";
import test from "node:test";

import {
  templateIdFromOfficialFlowPresetId,
} from "../../src/webview/sensor-studio/features/editor/flow-library/demo-template-flow-preset-category";
import { buildOfficialFlowPresetOverride } from "../../src/webview/sensor-studio/features/editor/flow-library/export-official-flow-preset-override";

test("templateIdFromOfficialFlowPresetId maps official ids back to template ids", () => {
  assert.equal(templateIdFromOfficialFlowPresetId("official-signal-chain"), "signal-chain");
  assert.equal(templateIdFromOfficialFlowPresetId("project-flow"), null);
});

test("buildOfficialFlowPresetOverride preserves official id and tags", () => {
  const preset = buildOfficialFlowPresetOverride("signal-chain", {
    nodes: [
      {
        id: "n1",
        type: "studioNode",
        position: { x: 0, y: 0 },
        data: { catalogId: "sine", label: "Sine" },
      },
    ],
    edges: [],
    subgraphs: {},
    activeGraphId: "__root__",
    rootNodes: [],
    rootEdges: [],
  });

  assert.equal(preset.meta.id, "official-signal-chain");
  assert.equal(preset.meta.category, "telemetry");
  assert.ok(preset.meta.tags?.includes("official"));
  assert.equal(preset.document.nodes.length, 1);
});
