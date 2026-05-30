import assert from "node:assert/strict";
import test from "node:test";

import type { StudioNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";
import { useFlowEditorStore } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

test("updateSelectedNodeConfigFromJson rejects invalid sensor-input sourceKey", () => {
  const node: StudioNode = {
    id: "s1",
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      label: "S",
      category: "input",
      nodeId: "sensor-input",
      defaultConfig: { sourceKey: "bmi270.accel.x" },
      outputType: "number",
    },
  };

  useFlowEditorStore.setState({ nodes: [node], edges: [], selectedNodeId: "s1" });

  const bad = useFlowEditorStore.getState().updateSelectedNodeConfigFromJson(
    JSON.stringify({ sourceKey: "invalid.key.path" }),
  );
  assert.equal(bad.ok, false);

  const good = useFlowEditorStore
    .getState()
    .updateSelectedNodeConfigFromJson(JSON.stringify({ sourceKey: "bmm350.mag.z" }));
  assert.equal(good.ok, true);
  const cfg = useFlowEditorStore.getState().nodes[0]?.data.defaultConfig.sourceKey;
  assert.equal(cfg, "bmm350.mag.z");

  useFlowEditorStore.getState().resetCanvas();
});

test("updateSelectedNodeConfigField returns false for invalid sourceKey and true for valid", () => {
  const node: StudioNode = {
    id: "s2",
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      label: "S",
      category: "input",
      nodeId: "sensor-input",
      defaultConfig: { sourceKey: "bmi270.accel.x" },
      outputType: "number",
    },
  };

  useFlowEditorStore.setState({ nodes: [node], edges: [], selectedNodeId: "s2" });

  const bad = useFlowEditorStore.getState().updateSelectedNodeConfigField("sourceKey", "x.y.z");
  assert.equal(bad, false);
  assert.equal(
    useFlowEditorStore.getState().nodes[0]?.data.defaultConfig.sourceKey,
    "bmi270.accel.x",
  );

  const good = useFlowEditorStore.getState().updateSelectedNodeConfigField("sourceKey", "bmm350.mag.y");
  assert.equal(good, true);
  assert.equal(useFlowEditorStore.getState().nodes[0]?.data.defaultConfig.sourceKey, "bmm350.mag.y");

  useFlowEditorStore.getState().resetCanvas();
});
