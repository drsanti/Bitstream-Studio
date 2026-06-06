import assert from "node:assert/strict";
import test from "node:test";

import {
  isStructuredSocketPreviewPortType,
  syncSocketLivePreviewHandlesFromPinValues,
  syncSocketLivePreviewInputHandlesFromIncoming,
} from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/sync-socket-live-preview-handles";
import { resolveInputScalarHintFromUpstream } from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/resolve-input-scalar-hints";
import { resolveLiveScalarReadingKind } from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/readings/live-reading-colors";
import { resolveReadingAxisFromHandleOrLabel } from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/readings/param-axis-classes";
import { resolveScalarSemanticColorHex } from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/readings/scalar-semantic-color-hex";
import { resolvePlotterChannelColorHex } from "../../src/webview/sensor-studio/features/editor/nodes/plotter/plotter-channel-colors";
import { DEFAULT_PLOTTER_CONFIG } from "../../src/webview/sensor-studio/features/editor/nodes/plotter/plotter-config";
import { truncateSocketStringPreview } from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/truncate-socket-string";
import { studioFlowPinKey } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

test("isStructuredSocketPreviewPortType skips bundled wires", () => {
  assert.equal(isStructuredSocketPreviewPortType("postProcessing"), true);
  assert.equal(isStructuredSocketPreviewPortType("number"), false);
  assert.equal(isStructuredSocketPreviewPortType("boolean"), false);
});

test("syncSocketLivePreviewHandlesFromPinValues maps every scalar output pin", () => {
  const pinValues = new Map<string, unknown>();
  pinValues.set(studioFlowPinKey("n1", "bloomIntensity"), 2.5);
  pinValues.set(studioFlowPinKey("n1", "bloomThreshold"), 0.8);
  const base = {
    label: "Post",
    category: "utility" as const,
    nodeId: "post-processing",
    defaultConfig: {},
    outputHandles: [
      { id: "out", portType: "postProcessing" as const, label: "Post-FX" },
      { id: "bloomIntensity", portType: "number" as const, label: "Bloom Intensity" },
      { id: "bloomThreshold", portType: "number" as const, label: "Bloom Threshold" },
    ],
  };
  syncSocketLivePreviewHandlesFromPinValues({
    nodeId: "post-processing",
    flowNodeId: "n1",
    data: base,
    pinValues,
    base,
  });
  assert.deepEqual(base.liveNumberByHandle, {
    bloomIntensity: 2.5,
    bloomThreshold: 0.8,
  });
});

test("syncSocketLivePreviewHandlesFromPinValues maps boolean and string pins", () => {
  const pinValues = new Map<string, unknown>();
  pinValues.set(studioFlowPinKey("b1", "out"), true);
  pinValues.set(studioFlowPinKey("s1", "out"), "models/robot.glb");
  const boolBase = {
    label: "Bool",
    category: "generator" as const,
    nodeId: "boolean-constant",
    defaultConfig: {},
    outputHandles: [{ id: "out", portType: "boolean" as const, label: "Out" }],
  };
  syncSocketLivePreviewHandlesFromPinValues({
    nodeId: "boolean-constant",
    flowNodeId: "b1",
    data: boolBase,
    pinValues,
    base: boolBase,
  });
  assert.deepEqual(boolBase.liveBooleanByHandle, { out: true });

  const strBase = {
    label: "Model",
    category: "input" as const,
    nodeId: "model-select",
    defaultConfig: {},
    outputHandles: [{ id: "out", portType: "string" as const, label: "Model" }],
  };
  syncSocketLivePreviewHandlesFromPinValues({
    nodeId: "model-select",
    flowNodeId: "s1",
    data: strBase,
    pinValues,
    base: strBase,
  });
  assert.deepEqual(strBase.liveStringByHandle, { out: "models/robot.glb" });
});

test("syncSocketLivePreviewInputHandlesFromIncoming maps wired scalar inputs", () => {
  const base = {
    label: "Model Viewer",
    category: "output" as const,
    nodeId: "model-viewer",
    defaultConfig: {},
    inputHandles: [
      { id: "in", portType: "string" as const, label: "Model" },
      { id: "settings", portType: "number" as const, label: "Exposure" },
    ],
    liveValue: "models/tesa-drone.glb",
  };
  syncSocketLivePreviewInputHandlesFromIncoming({
    nodeId: "model-viewer",
    flowNodeId: "mv1",
    readIncoming: (handle) => {
      if (handle === "settings") {
        return 1.25;
      }
      return null;
    },
    data: base,
    base,
  });
  assert.deepEqual(base.liveInputStringByHandle, { in: "models/tesa-drone.glb" });
  assert.deepEqual(base.liveInputNumberByHandle, { settings: 1.25 });
});

test("resolveInputScalarHintFromUpstream inherits sensor semantic kinds", () => {
  const incomingByTarget = new Map([
    [
      "math1",
      [
        { source: "bmi270", sourceHandle: "temp", targetHandle: "a" },
        { source: "sht40", sourceHandle: "humidity", targetHandle: "b" },
      ],
    ],
  ]);
  const nodeById = new Map([
    [
      "bmi270",
      {
        id: "bmi270",
        type: "studio",
        data: {
          nodeId: "bmi270-input",
          label: "Temperature",
          category: "sensor" as const,
          defaultConfig: {},
          sensorHealth: "live" as const,
          outputHandles: [{ id: "temp", portType: "number" as const, label: "Temperature (°C)" }],
        },
      },
    ],
    [
      "sht40",
      {
        id: "sht40",
        type: "studio",
        data: {
          nodeId: "sht40-input",
          label: "SHT40",
          category: "sensor" as const,
          defaultConfig: {},
          sensorHealth: "live" as const,
          outputHandles: [
            { id: "humidity", portType: "number" as const, label: "Humidity (%RH)" },
          ],
        },
      },
    ],
  ]);

  const hintA = resolveInputScalarHintFromUpstream({
    targetFlowId: "math1",
    targetHandle: "a",
    incomingByTarget,
    nodeById,
  });
  assert.equal(hintA?.nodeId, "bmi270-input");
  assert.equal(hintA?.handleId, "temp");
  assert.equal(resolveLiveScalarReadingKind(hintA!), "temperature");
  assert.equal(hintA?.streamMode, "live");

  const hintB = resolveInputScalarHintFromUpstream({
    targetFlowId: "math1",
    targetHandle: "b",
    incomingByTarget,
    nodeById,
  });
  assert.equal(hintB?.nodeId, "sht40-input");
  assert.equal(hintB?.handleId, "humidity");
  assert.equal(resolveLiveScalarReadingKind(hintB!), "humidity");
});

test("resolveInputScalarHintFromUpstream walks map-range and clamp utility chains", () => {
  const incomingByTarget = new Map([
    [
      "math1",
      [{ source: "map1", sourceHandle: "out", targetHandle: "a" }],
    ],
    [
      "map1",
      [{ source: "clamp1", sourceHandle: "out", targetHandle: "value" }],
    ],
    [
      "clamp1",
      [{ source: "sht40", sourceHandle: "humidity", targetHandle: "value" }],
    ],
  ]);
  const nodeById = new Map([
    [
      "map1",
      {
        id: "map1",
        type: "studio",
        data: {
          nodeId: "map-range",
          label: "Map Range",
          category: "transform" as const,
          defaultConfig: {},
          inputHandles: [{ id: "value", portType: "number" as const, label: "Value" }],
          outputHandles: [{ id: "out", portType: "number" as const, label: "Out" }],
        },
      },
    ],
    [
      "clamp1",
      {
        id: "clamp1",
        type: "studio",
        data: {
          nodeId: "clamp",
          label: "Clamp",
          category: "transform" as const,
          defaultConfig: {},
          inputHandles: [{ id: "value", portType: "number" as const, label: "Value" }],
          outputHandles: [{ id: "out", portType: "number" as const, label: "Out" }],
        },
      },
    ],
    [
      "sht40",
      {
        id: "sht40",
        type: "studio",
        data: {
          nodeId: "sht40-input",
          label: "SHT40",
          category: "sensor" as const,
          defaultConfig: {},
          sensorHealth: "live" as const,
          outputHandles: [
            { id: "humidity", portType: "number" as const, label: "Humidity (%RH)" },
          ],
        },
      },
    ],
  ]);

  const hint = resolveInputScalarHintFromUpstream({
    targetFlowId: "math1",
    targetHandle: "a",
    incomingByTarget,
    nodeById,
  });
  assert.equal(hint?.nodeId, "sht40-input");
  assert.equal(hint?.handleId, "humidity");
  assert.equal(resolveLiveScalarReadingKind(hint!), "humidity");
});

test("resolveReadingAxisFromHandleOrLabel maps split/combine axis pins", () => {
  assert.equal(resolveReadingAxisFromHandleOrLabel("x", "Out"), "x");
  assert.equal(resolveReadingAxisFromHandleOrLabel("y"), "y");
  assert.equal(resolveReadingAxisFromHandleOrLabel(undefined, "Z"), "z");
  assert.equal(resolveReadingAxisFromHandleOrLabel("w", "W"), "w");
  assert.equal(resolveReadingAxisFromHandleOrLabel("temp", "Temperature (°C)"), null);
});

test("resolveScalarSemanticColorHex maps axis and sensor kinds", () => {
  assert.equal(
    resolveScalarSemanticColorHex({ handleId: "x", streamMode: "live" }, "#ffffff"),
    "#fca5a5",
  );
  assert.equal(
    resolveScalarSemanticColorHex(
      { handleId: "temp", streamMode: "live" },
      "#ffffff",
    ),
    "#fb923c",
  );
  assert.equal(
    resolveScalarSemanticColorHex({ handleId: "out", streamMode: "idle" }, "#ffffff"),
    "#71717a",
  );
});

test("resolvePlotterChannelColorHex respects followWire vs custom", () => {
  const ch = { ...DEFAULT_PLOTTER_CONFIG.channels.ch1! };
  assert.equal(
    resolvePlotterChannelColorHex(ch, {
      handleId: "y",
      nodeId: "vector-splitter",
      streamMode: "live",
    }),
    "#6ee7b7",
  );
  assert.equal(
    resolvePlotterChannelColorHex(
      { ...ch, colorMode: "custom", colorHex: "#112233" },
      { handleId: "y", nodeId: "vector-splitter", streamMode: "live" },
    ),
    "#112233",
  );
});

test("truncateSocketStringPreview shortens long strings", () => {
  assert.equal(truncateSocketStringPreview("short"), "short");
  assert.equal(truncateSocketStringPreview("models/very/long/path.glb"), "models/very/l…");
});
