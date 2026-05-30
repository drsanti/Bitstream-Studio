import assert from "node:assert/strict";
import test from "node:test";

import type { BitstreamSensorSampleV2 } from "../../src/bitstream/events/sensor-decoder";
import {
  getInitialMetrics,
  useBitstreamLiveStore,
} from "../../src/webview/bitstream-app/state/bitstreamLive.store";
import {
  inferSensorTelemetryHintFromSourceKey,
  resolveLiveNumericFromLatestByHint,
} from "../../src/webview/sensor-studio/core/live/resolve-sensor-source-key";
import {
  type StudioNode,
  useFlowEditorStore,
} from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

test("inferSensorTelemetryHintFromSourceKey extracts hint from allowlisted sourceKey", () => {
  assert.equal(inferSensorTelemetryHintFromSourceKey("bmi270.accel.x"), "bmi270");
  assert.equal(inferSensorTelemetryHintFromSourceKey("dps368.pressure"), "dps368");
  assert.equal(inferSensorTelemetryHintFromSourceKey("not-a-sensor.foo"), null);
});

test("resolveLiveNumericFromLatestByHint reads BMI270 accel from scaled wire fields", () => {
  const latest = getInitialMetrics().latestByHint;
  const sample: BitstreamSensorSampleV2 = {
    counter: 7,
    temperatureCx100: 2500,
    secondaryX100: 0,
    sourceHint: "bmi270",
    isBmi270FusionPayload: false,
    accelXMs2X100: 123,
    accelYMs2X100: -50,
    accelZMs2X100: 980,
    gyroXRadSX100: 0,
    gyroYRadSX100: 0,
    gyroZRadSX100: 0,
  };
  const merged = { ...latest, bmi270: sample };
  assert.equal(resolveLiveNumericFromLatestByHint(merged, "bmi270.accel.x"), 1.23);
  assert.equal(resolveLiveNumericFromLatestByHint(merged, "bmi270.accel.y"), -0.5);
});

test("sensor-input uses live sample when Bitstream live store has data", () => {
  const metrics = getInitialMetrics();
  metrics.latestByHint.bmi270 = {
    counter: 1,
    temperatureCx100: 0,
    secondaryX100: 0,
    sourceHint: "bmi270",
    isBmi270FusionPayload: false,
    accelXMs2X100: 200,
    accelYMs2X100: 0,
    accelZMs2X100: 1000,
    gyroXRadSX100: 0,
    gyroYRadSX100: 0,
    gyroZRadSX100: 0,
  };
  useBitstreamLiveStore.getState().applyMetricsSnapshot(metrics);

  const studioNode: StudioNode = {
    id: "live-sensor",
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      label: "S",
      category: "input",
      nodeId: "sensor-input",
      defaultConfig: { sourceKey: "bmi270.accel.x" },
      outputType: "number",
      liveValue: null,
      liveHistory: [],
    },
  };

  useFlowEditorStore.setState({
    nodes: [studioNode],
    edges: [],
    selectedNodeId: null,
  });

  useFlowEditorStore.getState().tickSimulation();
  const out = useFlowEditorStore.getState().nodes[0];
  assert.equal(out?.data.liveValue, 2);
  assert.equal(out?.data.sensorStreamMode, "live");

  useBitstreamLiveStore.getState().resetLiveData();
  useFlowEditorStore.getState().resetCanvas();
});

test("sensor-input omits hardware stream marker when no live sample for selected source", () => {
  useBitstreamLiveStore.getState().resetLiveData();

  const studioNode: StudioNode = {
    id: "demo-sensor",
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      label: "S",
      category: "input",
      nodeId: "sensor-input",
      defaultConfig: { sourceKey: "bmi270.accel.x" },
      outputType: "number",
      liveValue: null,
      liveHistory: [],
    },
  };

  useFlowEditorStore.setState({
    nodes: [studioNode],
    edges: [],
    selectedNodeId: null,
  });

  useFlowEditorStore.getState().tickSimulation();
  const out = useFlowEditorStore.getState().nodes[0];
  assert.equal(out?.data.sensorStreamMode, undefined);
  assert.equal(typeof out?.data.liveValue, "number");

  useFlowEditorStore.getState().resetCanvas();
});
