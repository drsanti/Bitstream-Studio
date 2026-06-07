import assert from "node:assert/strict";
import test from "node:test";

import { NODE_CATALOG_DEFAULTS } from "../../src/webview/sensor-studio/config/node-catalog.config";
import { buildDemoTemplateFlowPreset } from "../../src/webview/sensor-studio/features/editor/flow-library/build-demo-template-flow-preset";
import { officialFlowPresetIdForTemplate } from "../../src/webview/sensor-studio/features/editor/flow-library/demo-template-flow-preset-category";
import { STUDIO_FLOW_PRESET_MARKER } from "../../src/webview/sensor-studio/features/editor/flow-library/studio-flow-preset-file";
import { useFlowEditorStore } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

test("buildDemoTemplateFlowPreset exports signal-chain as official flow preset", () => {
  const catalog = NODE_CATALOG_DEFAULTS.payload.nodes;
  useFlowEditorStore.getState().resetCanvas();
  useFlowEditorStore.getState().runDemoTemplate("signal-chain", catalog);
  const st = useFlowEditorStore.getState();

  const preset = buildDemoTemplateFlowPreset({
    templateId: "signal-chain",
    name: "Signal chain",
    description: "Telemetry demo",
    nodes: st.nodes,
    edges: st.edges,
    subgraphs: st.subgraphs,
    activeGraphId: st.activeGraphId,
    rootNodes: st.rootNodes,
    rootEdges: st.rootEdges,
  });

  assert.equal(preset.marker, STUDIO_FLOW_PRESET_MARKER);
  assert.equal(preset.meta.id, officialFlowPresetIdForTemplate("signal-chain"));
  assert.equal(preset.meta.category, "telemetry");
  assert.ok(preset.document.nodes.length > 0);
  assert.ok(preset.document.edges.length > 0);
});
