import assert from "node:assert/strict";
import test from "node:test";

import type { Edge } from "@xyflow/react";
import {
  type StudioDemoTemplateId,
  type StudioNode,
  STUDIO_HANDLE_ANIM,
  STUDIO_HANDLE_IN,
  useFlowEditorStore,
} from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";
import { NODE_CATALOG_DEFAULTS } from "../../src/webview/sensor-studio/config/node-catalog.config";
import {
  getInitialMetrics,
  useBitstreamLiveStore,
} from "../../src/webview/bitstream-app/state/bitstreamLive.store";

function node(
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

test("simulation propagates through low-pass and threshold to indicator", () => {
  const nodes: StudioNode[] = [
    node("n1", "sensor-input", "input", { outputType: "number" }),
    node("n2", "low-pass", "transform", {
      inputType: "number",
      outputType: "number",
      defaultConfig: { alpha: 0.3 },
    }),
    node("n3", "threshold", "transform", {
      inputType: "number",
      outputType: "boolean",
      defaultConfig: { operator: ">", value: -1 },
    }),
    node("n4", "indicator", "output", {
      inputType: "boolean",
    }),
  ];

  const edges: Edge[] = [
    { id: "e1", source: "n1", target: "n2" },
    { id: "e2", source: "n2", target: "n3" },
    { id: "e3", source: "n3", target: "n4" },
  ];

  useFlowEditorStore.setState({
    nodes,
    edges,
    selectedNodeId: null,
  });

  const { tickSimulation } = useFlowEditorStore.getState();
  for (let i = 0; i < 5; i += 1) {
    tickSimulation();
  }

  const next = useFlowEditorStore.getState();
  const indicator = next.nodes.find((n) => n.id === "n4");
  assert.ok(indicator != null);
  assert.equal(typeof indicator?.data.liveValue, "boolean");
  assert.equal(indicator?.data.liveValue, true);
});

test("cannot connect BMI270 vector3 pin to number-only low-pass", () => {
  const bmi270 = node("b1", "bmi270-input", "input", {
    outputHandles: [
      { id: "accel", portType: "vector3", label: "Accel (m/s²)" },
      { id: "temp", portType: "number", label: "Temperature (°C)" },
    ],
  });
  const lowPass = node("lp", "low-pass", "transform", {
    inputType: "number",
    outputType: "number",
    defaultConfig: { alpha: 0.2 },
  });

  useFlowEditorStore.setState({ nodes: [bmi270, lowPass], edges: [], selectedNodeId: null });

  useFlowEditorStore.getState().onConnect({
    source: "b1",
    target: "lp",
    sourceHandle: "accel",
    targetHandle: STUDIO_HANDLE_IN,
  });

  assert.equal(useFlowEditorStore.getState().edges.length, 0);
  useFlowEditorStore.getState().resetCanvas();
});

test("can connect BMI270 temp (number) to low-pass", () => {
  const bmi270 = node("b1", "bmi270-input", "input", {
    outputHandles: [
      { id: "accel", portType: "vector3", label: "Accel (m/s²)" },
      { id: "temp", portType: "number", label: "Temperature (°C)" },
    ],
  });
  const lowPass = node("lp", "low-pass", "transform", {
    inputType: "number",
    outputType: "number",
    defaultConfig: { alpha: 0.2 },
  });

  useFlowEditorStore.setState({ nodes: [bmi270, lowPass], edges: [], selectedNodeId: null });

  useFlowEditorStore.getState().onConnect({
    source: "b1",
    target: "lp",
    sourceHandle: "temp",
    targetHandle: STUDIO_HANDLE_IN,
  });

  assert.equal(useFlowEditorStore.getState().edges.length, 1);
  assert.equal(useFlowEditorStore.getState().edges[0]?.label, "number");
  useFlowEditorStore.getState().resetCanvas();
});

test("vector splitter feeds BMI270 accel Z into low-pass", () => {
  const bmi270 = node("im", "bmi270-input", "input", {
    outputHandles: [
      { id: "accel", portType: "vector3", label: "Accel (m/s²)" },
      { id: "temp", portType: "number", label: "Temperature (°C)" },
    ],
  });
  const splitter = node("sp", "vector-splitter", "utility", {
    inputType: "vector3",
    outputHandles: [
      { id: "x", portType: "number", label: "X" },
      { id: "y", portType: "number", label: "Y" },
      { id: "z", portType: "number", label: "Z" },
    ],
  });
  const lp = node("lp", "low-pass", "transform", {
    inputType: "number",
    outputType: "number",
    defaultConfig: { alpha: 1 },
  });

  const edges: Edge[] = [
    {
      id: "e1",
      source: "im",
      target: "sp",
      sourceHandle: "accel",
      targetHandle: STUDIO_HANDLE_IN,
    },
    {
      id: "e2",
      source: "sp",
      target: "lp",
      sourceHandle: "z",
      targetHandle: STUDIO_HANDLE_IN,
    },
  ];

  useFlowEditorStore.setState({ nodes: [bmi270, splitter, lp], edges, selectedNodeId: null });
  for (let i = 0; i < 6; i += 1) {
    useFlowEditorStore.getState().tickSimulation();
  }
  const lpNode = useFlowEditorStore.getState().nodes.find((n) => n.id === "lp");
  assert.ok(lpNode != null);
  assert.equal(typeof lpNode?.data.liveValue, "number");
  assert.ok(Number.isFinite(lpNode?.data.liveValue as number));
  useFlowEditorStore.getState().resetCanvas();
});

test("combine quaternion builds wire from scalars", () => {
  const combine = node("cq", "combine-quaternion", "utility", {
    inputHandles: [
      { id: "w", portType: "number", label: "W" },
      { id: "x", portType: "number", label: "X" },
      { id: "y", portType: "number", label: "Y" },
      { id: "z", portType: "number", label: "Z" },
    ],
    outputHandles: [{ id: "out", portType: "quaternion", label: "Quaternion" }],
  });
  const n1 = node("a", "number-constant", "input", {
    outputType: "number",
    defaultConfig: { value: 0.9 },
  });
  const n2 = node("b", "number-constant", "input", {
    outputType: "number",
    defaultConfig: { value: 0.1 },
  });
  const edges: Edge[] = [
    { id: "e1", source: "a", target: "cq", sourceHandle: "out", targetHandle: "w" },
    { id: "e2", source: "b", target: "cq", sourceHandle: "out", targetHandle: "x" },
  ];
  useFlowEditorStore.setState({ nodes: [combine, n1, n2], edges, selectedNodeId: null });
  for (let i = 0; i < 4; i += 1) {
    useFlowEditorStore.getState().tickSimulation();
  }
  const pin = useFlowEditorStore
    .getState()
    .nodes.find((n) => n.id === "cq")
    ?.data.liveQuaternionWire;
  assert.ok(pin != null);
  assert.equal(pin.w, 0.9);
  assert.equal(pin.x, 0.1);
  useFlowEditorStore.getState().resetCanvas();
});

test("vector length from vector constant", () => {
  const vec = node("vc", "vector-constant", "generator", {
    inputHandles: [
      { id: "x", portType: "number", label: "X" },
      { id: "y", portType: "number", label: "Y" },
      { id: "z", portType: "number", label: "Z" },
    ],
    outputHandles: [{ id: "out", portType: "vector3", label: "Vector" }],
    defaultConfig: { x: 3, y: 4, z: 0 },
  });
  const len = node("vl", "vector-length", "utility", {
    inputHandles: [{ id: "in", portType: "vector3", label: "Vector" }],
    outputHandles: [{ id: "out", portType: "number", label: "Length" }],
  });
  const edges: Edge[] = [
    {
      id: "e1",
      source: "vc",
      target: "vl",
      sourceHandle: "out",
      targetHandle: "in",
    },
  ];
  useFlowEditorStore.setState({ nodes: [vec, len], edges, selectedNodeId: null });
  for (let i = 0; i < 4; i += 1) {
    useFlowEditorStore.getState().tickSimulation();
  }
  const lenNode = useFlowEditorStore.getState().nodes.find((n) => n.id === "vl");
  assert.ok(lenNode != null);
  assert.equal(lenNode?.data.liveNumberByHandle?.out, 5);
  useFlowEditorStore.getState().resetCanvas();
});

test("quaternion splitter feeds W into low-pass", () => {
  const quat = node("q1", "quat-input", "input", { outputType: "quaternion" });
  const splitter = node("sp", "quaternion-splitter", "utility", {
    inputHandles: [{ id: "in", portType: "quaternion", label: "Quaternion" }],
    outputHandles: [
      { id: "w", portType: "number", label: "W" },
      { id: "x", portType: "number", label: "X" },
      { id: "y", portType: "number", label: "Y" },
      { id: "z", portType: "number", label: "Z" },
    ],
  });
  const lp = node("lp", "low-pass", "transform", {
    inputType: "number",
    outputType: "number",
    defaultConfig: { alpha: 1 },
  });
  const edges: Edge[] = [
    {
      id: "e1",
      source: "q1",
      target: "sp",
      sourceHandle: "out",
      targetHandle: STUDIO_HANDLE_IN,
    },
    {
      id: "e2",
      source: "sp",
      target: "lp",
      sourceHandle: "w",
      targetHandle: STUDIO_HANDLE_IN,
    },
  ];
  useFlowEditorStore.setState({ nodes: [quat, splitter, lp], edges, selectedNodeId: null });
  for (let i = 0; i < 5; i += 1) {
    useFlowEditorStore.getState().tickSimulation();
  }
  const lpNode = useFlowEditorStore.getState().nodes.find((n) => n.id === "lp");
  assert.ok(lpNode != null);
  assert.equal(typeof lpNode?.data.liveValue, "number");
  assert.ok(Number.isFinite(lpNode?.data.liveValue as number));
  assert.ok(Math.abs(lpNode?.data.liveValue as number) <= 1.001);
  useFlowEditorStore.getState().resetCanvas();
});

test("runDemoTemplate material-glb-drives wires model viewer and material drives", () => {
  const { runDemoTemplate, resetCanvas } = useFlowEditorStore.getState();

  runDemoTemplate("material-glb-drives", NODE_CATALOG_DEFAULTS.payload.nodes);
  const built = useFlowEditorStore.getState();
  assert.equal(built.nodes.length, 4);
  assert.equal(built.edges.length, 1);
  assert.ok(
    built.edges.some(
      (e) => e.source === "demo-model-select" && e.target === "demo-model-viewer",
    ),
  );
  assert.equal(built.selectedNodeId, "demo-model-viewer");
  const param = built.nodes.find((n) => n.id === "demo-mat-param");
  assert.equal(param?.data.nodeId, "glb-material-param");
  const tex = built.nodes.find((n) => n.id === "demo-mat-tex");
  assert.equal(tex?.data.nodeId, "glb-material-texture");

  resetCanvas();
});

test("runDemoTemplate animation-clip-blend wires clips, blend, and viewer anim", () => {
  const { runDemoTemplate, resetCanvas } = useFlowEditorStore.getState();

  runDemoTemplate("animation-clip-blend", NODE_CATALOG_DEFAULTS.payload.nodes);
  const built = useFlowEditorStore.getState();
  assert.equal(built.nodes.length, 7);
  assert.equal(built.edges.length, 8);
  assert.ok(
    built.edges.some(
      (e) => e.target === "demo-model-viewer" && e.targetHandle === STUDIO_HANDLE_ANIM,
    ),
  );
  assert.ok(
    built.edges.some(
      (e) => e.target === "demo-anim-blend" && e.targetHandle === "factor",
    ),
  );
  assert.equal(built.selectedNodeId, "demo-model-viewer");

  resetCanvas();
});

test("runDemoTemplate animation-mix-demo wires clips, mix, and viewer anim", () => {
  const { runDemoTemplate, resetCanvas } = useFlowEditorStore.getState();

  runDemoTemplate("animation-mix-demo", NODE_CATALOG_DEFAULTS.payload.nodes);
  const built = useFlowEditorStore.getState();
  assert.equal(built.nodes.length, 8);
  assert.equal(built.edges.length, 10);
  assert.ok(
    built.edges.some(
      (e) => e.target === "demo-model-viewer" && e.targetHandle === STUDIO_HANDLE_ANIM,
    ),
  );
  assert.ok(
    built.edges.some(
      (e) => e.target === "demo-anim-mix" && e.targetHandle === "wa",
    ),
  );
  assert.equal(built.selectedNodeId, "demo-model-viewer");

  resetCanvas();
});

test("runDemoTemplate rotation-glb-anim wires euler, bundle anim, and click trigger", () => {
  const { runDemoTemplate, resetCanvas } = useFlowEditorStore.getState();

  runDemoTemplate("rotation-glb-anim", NODE_CATALOG_DEFAULTS.payload.nodes);
  const built = useFlowEditorStore.getState();
  assert.equal(built.nodes.length, 6);
  assert.equal(built.edges.length, 4);
  assert.ok(
    built.edges.some(
      (e) => e.target === "demo-rot-euler" && e.targetHandle === STUDIO_HANDLE_ANIM,
    ),
  );
  assert.ok(
    built.edges.some(
      (e) => e.target === "demo-glb-anim-trigger" && e.targetHandle === STUDIO_HANDLE_IN,
    ),
  );
  assert.equal(built.selectedNodeId, "demo-rot-euler");
  const rot = built.nodes.find((n) => n.id === "demo-rot-euler");
  assert.equal(rot?.data.nodeId, "rotation-3d-euler");

  resetCanvas();
});

test("runDemoTemplate vector-magnitude wires vector → length → gauge", () => {
  const { runDemoTemplate, resetCanvas } = useFlowEditorStore.getState();

  runDemoTemplate("vector-magnitude", NODE_CATALOG_DEFAULTS.payload.nodes);
  const built = useFlowEditorStore.getState();
  assert.equal(built.nodes.length, 3);
  assert.equal(built.edges.length, 2);
  assert.equal(built.edges[0]?.sourceHandle, "out");
  assert.equal(built.edges[0]?.targetHandle, "in");
  assert.equal(built.edges[1]?.sourceHandle, "out");
  assert.equal(built.edges[1]?.targetHandle, STUDIO_HANDLE_IN);
  assert.equal(built.selectedNodeId, "demo-vector-length-gauge");

  resetCanvas();
});

test("runDemoTemplate bmi270-gauge-z wires accel → splitter → gauge Z", () => {
  const { runDemoTemplate, resetCanvas } = useFlowEditorStore.getState();

  runDemoTemplate("bmi270-gauge-z", NODE_CATALOG_DEFAULTS.payload.nodes);
  const built = useFlowEditorStore.getState();
  assert.equal(built.nodes.length, 3);
  assert.equal(built.edges.length, 2);
  assert.equal(built.edges[0]?.sourceHandle, "accel");
  assert.equal(built.edges[0]?.targetHandle, STUDIO_HANDLE_IN);
  assert.equal(built.edges[1]?.sourceHandle, "z");
  assert.equal(built.edges[1]?.targetHandle, STUDIO_HANDLE_IN);
  assert.equal(built.edges[0]?.label, "vector3");
  assert.equal(built.edges[1]?.label, "number");
  assert.equal(built.selectedNodeId, "demo-bar-meter-bmi");

  resetCanvas();
});

test("runDemoTemplate builds ready-to-run graph and resetCanvas clears it", () => {
  const { runDemoTemplate, resetCanvas } = useFlowEditorStore.getState();

  runDemoTemplate("signal-chain" satisfies StudioDemoTemplateId, NODE_CATALOG_DEFAULTS.payload.nodes);
  const built = useFlowEditorStore.getState();
  assert.ok(built.nodes.length >= 6);
  assert.ok(built.edges.length >= 5);
  assert.equal(built.selectedNodeId, "demo-lowpass");

  resetCanvas();
  const cleared = useFlowEditorStore.getState();
  assert.equal(cleared.nodes.length, 0);
  assert.equal(cleared.edges.length, 0);
  assert.equal(cleared.selectedNodeId, null);
});

test("dps368-input keeps last valid pressure when live payload misses field", () => {
  const dpsNode = node("d1", "dps368-input", "input", {
    outputHandles: [
      { id: "pressure", portType: "number", label: "Pressure (hPa)" },
      { id: "temp", portType: "number", label: "Temperature (°C)" },
    ],
  });
  useFlowEditorStore.setState({ nodes: [dpsNode], edges: [], selectedNodeId: null });

  const base = getInitialMetrics();
  const now = Date.now();
  useBitstreamLiveStore.setState({
    ...base,
    latestByHint: {
      ...base.latestByHint,
      dps368: {
        counter: 1,
        temperatureCx100: 2100,
        secondaryX100: 101325,
        sourceHint: "dps368",
        isBmi270FusionPayload: false,
      },
    },
    lastAtByHint: { ...base.lastAtByHint, dps368: now },
    frameCountByHint: { ...base.frameCountByHint, dps368: 1 },
  });
  useFlowEditorStore.getState().tickSimulation();
  const first = useFlowEditorStore.getState().nodes[0];
  assert.ok(first?.data.liveNumberByHandle?.pressure != null);
  const firstPressure = first?.data.liveNumberByHandle?.pressure ?? 0;

  useBitstreamLiveStore.setState({
    latestByHint: {
      ...useBitstreamLiveStore.getState().latestByHint,
      dps368: {
        counter: 2,
        temperatureCx100: 2200,
        secondaryX100: Number.NaN,
        sourceHint: "dps368",
        isBmi270FusionPayload: false,
      },
    },
    lastAtByHint: { ...useBitstreamLiveStore.getState().lastAtByHint, dps368: now + 250 },
    frameCountByHint: { ...useBitstreamLiveStore.getState().frameCountByHint, dps368: 2 },
  });
  useFlowEditorStore.getState().tickSimulation();
  const second = useFlowEditorStore.getState().nodes[0];
  assert.equal(second?.data.liveNumberByHandle?.pressure, firstPressure);
  assert.ok(typeof second?.data.sensorInvalidByHandle?.pressure === "string");
  useBitstreamLiveStore.setState({ ...getInitialMetrics() });
  useFlowEditorStore.getState().resetCanvas();
});

test("sht40-input keeps last valid humidity when live payload misses humidity field", () => {
  const shtNode = node("s1", "sht40-input", "input", {
    outputHandles: [
      { id: "humidity", portType: "number", label: "Humidity (%RH)" },
      { id: "temp", portType: "number", label: "Temperature (°C)" },
    ],
  });
  useFlowEditorStore.setState({ nodes: [shtNode], edges: [], selectedNodeId: null });

  const base = getInitialMetrics();
  const now = Date.now();
  useBitstreamLiveStore.setState({
    ...base,
    latestByHint: {
      ...base.latestByHint,
      sht40: {
        counter: 11,
        temperatureCx100: 2500,
        secondaryX100: 5533,
        sourceHint: "sht40",
        isBmi270FusionPayload: false,
      },
    },
    lastAtByHint: { ...base.lastAtByHint, sht40: now },
    frameCountByHint: { ...base.frameCountByHint, sht40: 1 },
  });
  useFlowEditorStore.getState().tickSimulation();
  const first = useFlowEditorStore.getState().nodes[0];
  const firstHumidity = first?.data.liveNumberByHandle?.humidity ?? 0;

  useBitstreamLiveStore.setState({
    latestByHint: {
      ...useBitstreamLiveStore.getState().latestByHint,
      sht40: {
        counter: 12,
        temperatureCx100: 2600,
        secondaryX100: Number.NaN,
        sourceHint: "sht40",
        isBmi270FusionPayload: false,
      },
    },
    lastAtByHint: { ...useBitstreamLiveStore.getState().lastAtByHint, sht40: now + 250 },
    frameCountByHint: { ...useBitstreamLiveStore.getState().frameCountByHint, sht40: 2 },
  });
  useFlowEditorStore.getState().tickSimulation();
  const second = useFlowEditorStore.getState().nodes[0];
  assert.equal(second?.data.liveNumberByHandle?.humidity, firstHumidity);
  assert.ok(typeof second?.data.sensorInvalidByHandle?.humidity === "string");
  useBitstreamLiveStore.setState({ ...getInitialMetrics() });
  useFlowEditorStore.getState().resetCanvas();
});

test("bmm350-input keeps last valid magnetic vector when live payload misses vector field", () => {
  const bmmNode = node("m1", "bmm350-input", "input", {
    outputHandles: [
      { id: "magnetic", portType: "vector3", label: "Magnetic (µT)" },
      { id: "temp", portType: "number", label: "Temperature (°C)" },
    ],
  });
  useFlowEditorStore.setState({ nodes: [bmmNode], edges: [], selectedNodeId: null });

  const base = getInitialMetrics();
  const now = Date.now();
  useBitstreamLiveStore.setState({
    ...base,
    latestByHint: {
      ...base.latestByHint,
      bmm350: {
        counter: 21,
        temperatureCx100: 2310,
        secondaryX100: 0,
        sourceHint: "bmm350",
        isBmi270FusionPayload: false,
        magneticXUtX100: 100,
        magneticYUtX100: -200,
        magneticZUtX100: 300,
      },
    },
    lastAtByHint: { ...base.lastAtByHint, bmm350: now },
    frameCountByHint: { ...base.frameCountByHint, bmm350: 1 },
  });
  useFlowEditorStore.getState().tickSimulation();
  const first = useFlowEditorStore.getState().nodes[0];
  const firstMag = first?.data.liveVector3ByHandle?.magnetic;
  assert.ok(firstMag != null);

  useBitstreamLiveStore.setState({
    latestByHint: {
      ...useBitstreamLiveStore.getState().latestByHint,
      bmm350: {
        counter: 22,
        temperatureCx100: 2320,
        secondaryX100: 0,
        sourceHint: "bmm350",
        isBmi270FusionPayload: false,
      },
    },
    lastAtByHint: { ...useBitstreamLiveStore.getState().lastAtByHint, bmm350: now + 250 },
    frameCountByHint: { ...useBitstreamLiveStore.getState().frameCountByHint, bmm350: 2 },
  });
  useFlowEditorStore.getState().tickSimulation();
  const second = useFlowEditorStore.getState().nodes[0];
  assert.deepEqual(second?.data.liveVector3ByHandle?.magnetic, firstMag);
  assert.ok(typeof second?.data.sensorInvalidByHandle?.magnetic === "string");
  useBitstreamLiveStore.setState({ ...getInitialMetrics() });
  useFlowEditorStore.getState().resetCanvas();
});

test("dps368-tap-pressure keeps last valid out when field is missing", () => {
  const tapNode = node("tp1", "dps368-tap-pressure", "input", {
    outputType: "number",
  });
  useFlowEditorStore.setState({ nodes: [tapNode], edges: [], selectedNodeId: null });

  const base = getInitialMetrics();
  const now = Date.now();
  useBitstreamLiveStore.setState({
    ...base,
    latestByHint: {
      ...base.latestByHint,
      dps368: {
        counter: 31,
        temperatureCx100: 2100,
        secondaryX100: 100100,
        sourceHint: "dps368",
        isBmi270FusionPayload: false,
      },
    },
    lastAtByHint: { ...base.lastAtByHint, dps368: now },
    frameCountByHint: { ...base.frameCountByHint, dps368: 1 },
  });
  useFlowEditorStore.getState().tickSimulation();
  const first = useFlowEditorStore.getState().nodes[0]?.data.liveValue;

  useBitstreamLiveStore.setState({
    latestByHint: {
      ...useBitstreamLiveStore.getState().latestByHint,
      dps368: {
        counter: 32,
        temperatureCx100: 2200,
        secondaryX100: Number.NaN,
        sourceHint: "dps368",
        isBmi270FusionPayload: false,
      },
    },
    lastAtByHint: { ...useBitstreamLiveStore.getState().lastAtByHint, dps368: now + 250 },
    frameCountByHint: { ...useBitstreamLiveStore.getState().frameCountByHint, dps368: 2 },
  });
  useFlowEditorStore.getState().tickSimulation();
  const second = useFlowEditorStore.getState().nodes[0];
  assert.equal(second?.data.liveValue, first);
  assert.ok(typeof second?.data.sensorInvalidByHandle?.out === "string");
  useBitstreamLiveStore.setState({ ...getInitialMetrics() });
  useFlowEditorStore.getState().resetCanvas();
});

test("rotation-3d-euler accepts vector3 input connection", () => {
  const eulerTap = node("e1", "bmi270-tap-euler", "input", {
    outputType: "vector3",
  });
  const rot3dEuler = node("r1", "rotation-3d-euler", "output", {
    inputType: "vector3",
  });
  useFlowEditorStore.setState({ nodes: [eulerTap, rot3dEuler], edges: [], selectedNodeId: null });
  useFlowEditorStore.getState().onConnect({
    source: "e1",
    target: "r1",
    sourceHandle: "out",
    targetHandle: STUDIO_HANDLE_IN,
  });
  assert.equal(useFlowEditorStore.getState().edges.length, 1);
  assert.equal(useFlowEditorStore.getState().edges[0]?.label, "vector3");
  useFlowEditorStore.getState().resetCanvas();
});

test("rotation-3d-quaternion accepts quaternion input connection", () => {
  const quatTap = node("q1", "bmi270-tap-quaternion", "input", {
    outputType: "quaternion",
  });
  const rot3dQuat = node("r2", "rotation-3d-quaternion", "output", {
    inputType: "quaternion",
  });
  useFlowEditorStore.setState({ nodes: [quatTap, rot3dQuat], edges: [], selectedNodeId: null });
  useFlowEditorStore.getState().onConnect({
    source: "q1",
    target: "r2",
    sourceHandle: "out",
    targetHandle: STUDIO_HANDLE_IN,
  });
  assert.equal(useFlowEditorStore.getState().edges.length, 1);
  assert.equal(useFlowEditorStore.getState().edges[0]?.label, "quaternion");
  useFlowEditorStore.getState().resetCanvas();
});

const ROTATION_3D_SCENE_INPUT_HANDLES: StudioNode["data"]["inputHandles"] = [
  { id: "in", portType: "vector3", label: "Euler (rad)" },
  { id: "env", portType: "environment", label: "Environment" },
  { id: "cam", portType: "camera", label: "Camera" },
  { id: "anim", portType: "glbAnimation", label: "Animation" },
  { id: "xf", portType: "transform", label: "Transform" },
];

test("animation-merge combines two clip nodes for viewer anim input", () => {
  const clipA = node("a1", "animation-clip", "scene", {
    defaultConfig: { clipName: "Walk", timeS: 0, speed: 1, weight: 1, enabled: true },
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
  });
  const clipB = node("b1", "animation-clip", "scene", {
    defaultConfig: { clipName: "Run", timeS: 0.5, speed: 1, weight: 1, enabled: true },
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
  });
  const merge = node("m1", "animation-merge", "scene", {
    inputHandles: [
      { id: "a", portType: "glbAnimation", label: "A" },
      { id: "b", portType: "glbAnimation", label: "B" },
      { id: "c", portType: "glbAnimation", label: "C" },
    ],
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Out" }],
  });
  const viewer = node("v1", "model-viewer", "output", {
    inputHandles: ROTATION_3D_SCENE_INPUT_HANDLES,
  });
  useFlowEditorStore.setState({
    nodes: [clipA, clipB, merge, viewer],
    edges: [],
    selectedNodeId: null,
  });
  const st = useFlowEditorStore.getState();
  st.onConnect({ source: "a1", target: "m1", sourceHandle: "out", targetHandle: "a" });
  st.onConnect({ source: "b1", target: "m1", sourceHandle: "out", targetHandle: "b" });
  st.onConnect({ source: "m1", target: "v1", sourceHandle: "out", targetHandle: STUDIO_HANDLE_ANIM });
  st.tickSimulation();
  const v = useFlowEditorStore.getState().nodes.find((n) => n.id === "v1");
  assert.ok(v?.data.liveAnimationWire != null);
  assert.equal(v?.data.liveAnimationWire?.clips.Walk?.timeS, 0);
  assert.equal(v?.data.liveAnimationWire?.clips.Run?.timeS, 0.5);
  useFlowEditorStore.getState().resetCanvas();
});

test("animation-mix applies per-input weights on anim output", () => {
  const clipA = node("a1", "animation-clip", "scene", {
    defaultConfig: { clipName: "Walk", weight: 1, enabled: true },
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
  });
  const clipB = node("b1", "animation-clip", "scene", {
    defaultConfig: { clipName: "Run", weight: 1, enabled: true },
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
  });
  const mix = node("mx1", "animation-mix", "scene", {
    defaultConfig: {
      animationInputCount: 2,
      mixWeights: [1, 0],
      normalizeWeights: true,
    },
    inputHandles: [
      { id: "a", portType: "glbAnimation", label: "1" },
      { id: "wa", portType: "number", label: "W1" },
      { id: "b", portType: "glbAnimation", label: "2" },
      { id: "wb", portType: "number", label: "W2" },
    ],
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Out" }],
  });
  const viewer = node("v1", "model-viewer", "output", {
    inputHandles: ROTATION_3D_SCENE_INPUT_HANDLES,
  });
  useFlowEditorStore.setState({
    nodes: [clipA, clipB, mix, viewer],
    edges: [],
    selectedNodeId: null,
  });
  const st = useFlowEditorStore.getState();
  st.onConnect({ source: "a1", target: "mx1", sourceHandle: "out", targetHandle: "a" });
  st.onConnect({ source: "b1", target: "mx1", sourceHandle: "out", targetHandle: "b" });
  st.onConnect({ source: "mx1", target: "v1", sourceHandle: "out", targetHandle: STUDIO_HANDLE_ANIM });
  st.tickSimulation();
  const v = useFlowEditorStore.getState().nodes.find((n) => n.id === "v1");
  assert.ok(v?.data.liveAnimationWire != null);
  assert.equal(v?.data.liveAnimationWire?.clips.Walk?.weight, 1);
  assert.equal(v?.data.liveAnimationWire?.clips.Run?.weight, 0);
  useFlowEditorStore.getState().resetCanvas();
});

test("animation-blend scales clip weights on anim output", () => {
  const clipA = node("a1", "animation-clip", "scene", {
    defaultConfig: { clipName: "Walk", weight: 1, enabled: true },
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
  });
  const clipB = node("b1", "animation-clip", "scene", {
    defaultConfig: { clipName: "Run", weight: 1, enabled: true },
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
  });
  const blend = node("bl1", "animation-blend", "scene", {
    defaultConfig: { factor: 0.25, crossfadeS: 0.2 },
    inputHandles: [
      { id: "a", portType: "glbAnimation", label: "A" },
      { id: "b", portType: "glbAnimation", label: "B" },
      { id: "factor", portType: "number", label: "Factor" },
    ],
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Out" }],
  });
  const rot = node("r1", "rotation-3d-euler", "output", {
    inputHandles: ROTATION_3D_SCENE_INPUT_HANDLES,
  });
  useFlowEditorStore.setState({
    nodes: [clipA, clipB, blend, rot],
    edges: [],
    selectedNodeId: null,
  });
  const st = useFlowEditorStore.getState();
  st.onConnect({ source: "a1", target: "bl1", sourceHandle: "out", targetHandle: "a" });
  st.onConnect({ source: "b1", target: "bl1", sourceHandle: "out", targetHandle: "b" });
  st.onConnect({ source: "bl1", target: "r1", sourceHandle: "out", targetHandle: STUDIO_HANDLE_ANIM });
  st.tickSimulation();
  const r = useFlowEditorStore.getState().nodes.find((n) => n.id === "r1");
  assert.ok(r?.data.liveAnimationWire != null);
  assert.equal(r?.data.liveAnimationWire?.clips.Walk?.weight, 0.75);
  assert.equal(r?.data.liveAnimationWire?.clips.Run?.weight, 0.25);
  useFlowEditorStore.getState().resetCanvas();
});

test("rotation-3d-euler accepts animation-clip on anim input", () => {
  const clip = node("c1", "animation-clip", "scene", {
    defaultConfig: {
      clipName: "Walk",
      timeS: 0.25,
      speed: 1,
      weight: 1,
      enabled: true,
      loopMode: "loop",
    },
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
  });
  const rot3dEuler = node("r1", "rotation-3d-euler", "output", {
    inputHandles: ROTATION_3D_SCENE_INPUT_HANDLES,
  });
  useFlowEditorStore.setState({ nodes: [clip, rot3dEuler], edges: [], selectedNodeId: null });
  useFlowEditorStore.getState().onConnect({
    source: "c1",
    target: "r1",
    sourceHandle: "out",
    targetHandle: STUDIO_HANDLE_ANIM,
  });
  useFlowEditorStore.getState().tickSimulation();
  const rot = useFlowEditorStore.getState().nodes.find((n) => n.id === "r1");
  assert.ok(rot?.data.liveAnimationWire != null);
  assert.equal(rot?.data.liveAnimationWire?.clips.Walk?.timeS, 0.25);
  useFlowEditorStore.getState().resetCanvas();
});

test("rotation-3d-euler accepts glbAnimation bundle on anim input", () => {
  const bundle = node("b1", "glb-animation-bundle", "utility", {
    outputHandles: [{ id: "out", portType: "glbAnimation", label: "Animation" }],
  });
  const rot3dEuler = node("r1", "rotation-3d-euler", "output", {
    inputHandles: ROTATION_3D_SCENE_INPUT_HANDLES,
  });
  useFlowEditorStore.setState({ nodes: [bundle, rot3dEuler], edges: [], selectedNodeId: null });
  useFlowEditorStore.getState().onConnect({
    source: "b1",
    target: "r1",
    sourceHandle: "out",
    targetHandle: STUDIO_HANDLE_ANIM,
  });
  assert.equal(useFlowEditorStore.getState().edges.length, 1);
  assert.equal(useFlowEditorStore.getState().edges[0]?.label, "glbAnimation");
  useFlowEditorStore.getState().tickSimulation();
  const rot = useFlowEditorStore.getState().nodes.find((n) => n.id === "r1");
  assert.ok(rot?.data.liveAnimationWire != null);
  assert.equal(typeof rot?.data.liveAnimationWire?.clips, "object");
  useFlowEditorStore.getState().resetCanvas();
});
