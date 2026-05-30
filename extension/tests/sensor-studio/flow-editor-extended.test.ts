import assert from "node:assert/strict";
import test from "node:test";

import type { Edge } from "@xyflow/react";
import type { BitstreamSensorSampleV2 } from "../../src/bitstream/events/sensor-decoder";
import {
  fusionQuaternionFromBmi270Sample,
  hasFusionQuaternionWireFields,
} from "../../src/webview/sensor-studio/core/live/bmi270-fusion-quat";
import { validateStudioNodeConfig } from "../../src/webview/sensor-studio/core/validation/node-config.validation";
import {
  isValidStudioPersistedViewport,
  readPersistedFlowDocument,
  writePersistedFlowDocument,
} from "../../src/webview/sensor-studio/persistence/flow-graph.repository";
import {
  type StudioNode,
  STUDIO_HANDLE_IN,
  resetLayoutUndoCoalescingForTests,
  useFlowEditorStore,
} from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

const g = globalThis as unknown as { window?: typeof globalThis };
if (g.window == null) {
  g.window = globalThis;
}

function makeNode(
  id: string,
  nodeId: string,
  category: StudioNode["data"]["category"],
  data: Partial<StudioNode["data"]> = {},
): StudioNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      label: id,
      category,
      nodeId,
      defaultConfig: {},
      ...data,
    },
  };
}

test("number-average combines two scalar sources", () => {
  const a = makeNode("a1", "sensor-input", "input", { outputType: "number" });
  const b = makeNode("a2", "sensor-input", "input", { outputType: "number" });
  const avg = makeNode("av", "number-average", "utility", {
    inputType: "number",
    outputType: "number",
  });
  const edges: Edge[] = [
    { id: "e1", source: "a1", target: "av", sourceHandle: "out", targetHandle: STUDIO_HANDLE_IN },
    { id: "e2", source: "a2", target: "av", sourceHandle: "out", targetHandle: STUDIO_HANDLE_IN },
  ];
  useFlowEditorStore.setState({ nodes: [a, b, avg], edges, selectedNodeId: null });
  for (let i = 0; i < 5; i += 1) {
    useFlowEditorStore.getState().tickSimulation();
  }
  const out = useFlowEditorStore.getState().nodes.find((n) => n.id === "av");
  assert.ok(typeof out?.data.liveValue === "number");
  assert.ok(Number.isFinite(out?.data.liveValue as number));
  useFlowEditorStore.getState().resetCanvas();
});

test("validateStudioNodeConfig rejects low-pass alpha out of range", () => {
  const errs = validateStudioNodeConfig("low-pass", { alpha: 3 });
  assert.ok(errs.some((e) => e.includes("alpha")));
});

test("fusion quaternion extracts from BMI270 fusion wire fields", () => {
  const sample = {
    counter: 1,
    temperatureCx100: 2500,
    secondaryX100: 10000,
    sourceHint: "bmi270",
    isBmi270FusionPayload: true,
    fusionQuatWBucketX10000: 10000,
    fusionQuatXX10000: 0,
    fusionQuatYX10000: 0,
    fusionQuatZX10000: 0,
    fusionHeadingRadX100: 0,
    fusionPitchRadX100: 0,
    fusionRollRadX100: 0,
  } as BitstreamSensorSampleV2;
  assert.equal(hasFusionQuaternionWireFields(sample), true);
  const q = fusionQuaternionFromBmi270Sample(sample);
  assert.ok(Math.abs(q.w - 1) < 1e-6);
});

test("flow graph repository roundtrips through localStorage", () => {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  const prev = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", { value: ls, configurable: true });
  try {
    writePersistedFlowDocument({
      version: 1,
      nodes: [{ id: "n1" }],
      edges: [{ id: "e1", source: "a", target: "b" }],
      selectedNodeId: "n1",
    });
    const read = readPersistedFlowDocument();
    assert.ok(read != null);
    assert.equal(read.nodes.length, 1);
    assert.equal(read.edges.length, 1);
    assert.equal(read.selectedNodeId, "n1");
  } finally {
    Object.defineProperty(globalThis, "localStorage", { value: prev, configurable: true });
  }
});

test("flow graph repository persists viewport when valid", () => {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  const prev = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", { value: ls, configurable: true });
  try {
    writePersistedFlowDocument({
      version: 1,
      nodes: [{ id: "n1" }],
      edges: [],
      selectedNodeId: null,
      viewport: { x: 12.5, y: -40, zoom: 1.25 },
    });
    const read = readPersistedFlowDocument();
    assert.ok(read != null);
    assert.deepEqual(read.viewport, { x: 12.5, y: -40, zoom: 1.25 });
  } finally {
    Object.defineProperty(globalThis, "localStorage", { value: prev, configurable: true });
  }
});

test("isValidStudioPersistedViewport rejects non-positive zoom", () => {
  assert.equal(isValidStudioPersistedViewport({ x: 0, y: 0, zoom: 0 }), false);
  assert.equal(isValidStudioPersistedViewport({ x: 0, y: 0, zoom: -1 }), false);
  assert.equal(isValidStudioPersistedViewport({ x: 0, y: 0, zoom: 1 }), true);
});

test("importFlowGraphJson requires version 1", () => {
  const r = useFlowEditorStore.getState().importFlowGraphJson(
    JSON.stringify({ version: 2, nodes: [], edges: [] }),
  );
  assert.equal(r.ok, false);
  useFlowEditorStore.getState().resetCanvas();
});

test("importFlowGraphJson roundtrip is undoable", () => {
  const a = makeNode("a", "sensor-input", "input", { outputType: "number" });
  const b = makeNode("b", "threshold", "logic", { inputType: "number", outputType: "boolean" });
  useFlowEditorStore.setState({
    nodes: [a],
    edges: [],
    selectedNodeId: "a",
    undoStack: [],
    redoStack: [],
  });
  const json = useFlowEditorStore.getState().exportFlowGraphJson();
  useFlowEditorStore.setState({ nodes: [b], edges: [], selectedNodeId: "b" });
  const r = useFlowEditorStore.getState().importFlowGraphJson(json);
  assert.equal(r.ok, true);
  assert.equal(useFlowEditorStore.getState().nodes[0]?.id, "a");
  useFlowEditorStore.getState().undo();
  assert.equal(useFlowEditorStore.getState().nodes[0]?.id, "b");
  useFlowEditorStore.getState().resetCanvas();
});

test("layout-only node changes coalesce into one undo snapshot", () => {
  resetLayoutUndoCoalescingForTests();
  const n = makeNode("a", "sensor-input", "input", { outputType: "number" });
  useFlowEditorStore.setState({
    nodes: [n],
    edges: [],
    selectedNodeId: null,
    undoStack: [],
    redoStack: [],
  });
  const st = useFlowEditorStore.getState();
  st.onNodesChange([{ id: "a", type: "position", position: { x: 1, y: 0 } }]);
  st.onNodesChange([{ id: "a", type: "position", position: { x: 2, y: 0 } }]);
  assert.equal(useFlowEditorStore.getState().undoStack.length, 1);
  resetLayoutUndoCoalescingForTests();
  useFlowEditorStore.getState().resetCanvas();
});
