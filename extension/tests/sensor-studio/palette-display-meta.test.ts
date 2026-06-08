import assert from "node:assert/strict";
import test from "node:test";

import { NODE_CATALOG_DEFAULTS } from "../../src/webview/sensor-studio/config/node-catalog.config";
import { resolvePaletteDisplayGroup } from "../../src/webview/sensor-studio/features/editor/components/node-palette/palette-display-meta";
import {
  STUDIO_HANDLE_ANIM,
  STUDIO_HANDLE_IN,
  useFlowEditorStore,
} from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function findEntry(id: string) {
  const entry = NODE_CATALOG_DEFAULTS.payload.nodes.find((n) => n.id === id);
  assert.ok(entry != null, `missing catalog entry ${id}`);
  return entry;
}

test("resolvePaletteDisplayGroup routes GLB animation flow nodes to Animation", () => {
  assert.equal(resolvePaletteDisplayGroup(findEntry("animation-clip")), "animation");
  assert.equal(resolvePaletteDisplayGroup(findEntry("animation-merge")), "animation");
  assert.equal(resolvePaletteDisplayGroup(findEntry("animation-blend")), "animation");
  assert.equal(resolvePaletteDisplayGroup(findEntry("glb-animation-bundle")), "animation");
  assert.equal(resolvePaletteDisplayGroup(findEntry("model-viewer")), "scene");
});

test("spawnGlbAnimationSetupGraph builds two-clip blend + viewer", () => {
  useFlowEditorStore.setState({ nodes: [], edges: [], selectedNodeId: null });
  const modelEntry = NODE_CATALOG_DEFAULTS.payload.nodes.find((n) => n.id === "model-select");
  assert.ok(modelEntry != null);
  useFlowEditorStore.getState().addNodeFromCatalogAt(modelEntry, { x: 80, y: 200 });
  const modelId = useFlowEditorStore.getState().nodes.find((n) => n.data.nodeId === "model-select")?.id;
  assert.ok(modelId != null);

  useFlowEditorStore.getState().spawnGlbAnimationSetupGraph(
    modelId,
    ["Walk", "Run"],
    NODE_CATALOG_DEFAULTS.payload.nodes,
  );

  const built = useFlowEditorStore.getState();
  assert.equal(built.nodes.filter((n) => n.data.nodeId === "animation-clip").length, 2);
  assert.equal(built.nodes.filter((n) => n.data.nodeId === "animation-blend").length, 1);
  assert.equal(built.nodes.filter((n) => n.data.nodeId === "model-viewer").length, 1);
  assert.ok(
    built.edges.some(
      (e) =>
        e.targetHandle === STUDIO_HANDLE_ANIM &&
        built.nodes.some((n) => n.id === e.target && n.data.nodeId === "model-viewer"),
    ),
  );
  assert.ok(
    built.edges.some(
      (e) =>
        e.targetHandle === STUDIO_HANDLE_IN &&
        e.source === modelId &&
        built.nodes.some((n) => n.id === e.target && n.data.nodeId === "model-viewer"),
    ),
  );

  useFlowEditorStore.getState().resetCanvas();
});

test("spawnGlbAnimationSetupGraph builds three-clip mix + viewer", () => {
  useFlowEditorStore.setState({ nodes: [], edges: [], selectedNodeId: null });
  const modelEntry = NODE_CATALOG_DEFAULTS.payload.nodes.find((n) => n.id === "model-select");
  assert.ok(modelEntry != null);
  useFlowEditorStore.getState().addNodeFromCatalogAt(modelEntry, { x: 80, y: 200 });
  const modelId = useFlowEditorStore.getState().nodes.find((n) => n.data.nodeId === "model-select")?.id;
  assert.ok(modelId != null);

  useFlowEditorStore.getState().spawnGlbAnimationSetupGraph(
    modelId,
    ["Idle", "Walk", "Run"],
    NODE_CATALOG_DEFAULTS.payload.nodes,
    "mix",
  );

  const built = useFlowEditorStore.getState();
  assert.equal(built.nodes.filter((n) => n.data.nodeId === "animation-clip").length, 3);
  assert.equal(built.nodes.filter((n) => n.data.nodeId === "animation-mix").length, 1);
  assert.equal(built.nodes.filter((n) => n.data.nodeId === "animation-merge").length, 0);
  assert.equal(built.nodes.filter((n) => n.data.nodeId === "model-viewer").length, 1);
  const mixNode = built.nodes.find((n) => n.data.nodeId === "animation-mix");
  assert.ok(mixNode != null);
  const mixConfig = mixNode.data.defaultConfig as Record<string, unknown>;
  assert.equal(mixConfig.animationInputCount, 3);
  assert.deepEqual(mixConfig.mixWeights, [1 / 3, 1 / 3, 1 / 3]);

  useFlowEditorStore.getState().resetCanvas();
});
