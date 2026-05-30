import assert from "node:assert/strict";
import test from "node:test";
import {
  hasEvtSensorSinceSimulatorSwitch,
  shouldShowSimulatorMissingNotice,
  SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS,
} from "../../src/webview/bitstream-shell/utils/simulatorTelemetryMissingAlert.js";

test("hasEvtSensorSinceSimulatorSwitch is true when RX at or after watch start", () => {
  assert.equal(
    hasEvtSensorSinceSimulatorSwitch({
      watchStartedAtMs: 1000,
      lastEvtSensorRxAtMs: 1000,
    }),
    true,
  );
  assert.equal(
    hasEvtSensorSinceSimulatorSwitch({
      watchStartedAtMs: 1000,
      lastEvtSensorRxAtMs: 999,
    }),
    false,
  );
  assert.equal(
    hasEvtSensorSinceSimulatorSwitch({
      watchStartedAtMs: 1000,
      lastEvtSensorRxAtMs: null,
    }),
    false,
  );
});

test("hasEvtSensorSinceSimulatorSwitch uses RX count baseline after live reset", () => {
  assert.equal(
    hasEvtSensorSinceSimulatorSwitch({
      watchStartedAtMs: 1000,
      lastEvtSensorRxAtMs: null,
      evtSensorRxCount: 1,
      evtSensorRxCountBaseline: 0,
    }),
    true,
  );
});

test("shouldShowSimulatorMissingNotice respects grace and backend", () => {
  const t0 = 10_000;
  assert.equal(
    shouldShowSimulatorMissingNotice({
      backend: "uart",
      watchStartedAtMs: t0,
      nowMs: t0 + SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS,
      lastEvtSensorRxAtMs: null,
    }),
    false,
  );
  assert.equal(
    shouldShowSimulatorMissingNotice({
      backend: "simulator",
      watchStartedAtMs: t0,
      nowMs: t0 + SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS - 1,
      lastEvtSensorRxAtMs: null,
    }),
    false,
  );
  assert.equal(
    shouldShowSimulatorMissingNotice({
      backend: "simulator",
      watchStartedAtMs: t0,
      nowMs: t0 + SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS,
      lastEvtSensorRxAtMs: null,
    }),
    true,
  );
  assert.equal(
    shouldShowSimulatorMissingNotice({
      backend: "simulator",
      watchStartedAtMs: t0,
      nowMs: t0 + SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS + 500,
      lastEvtSensorRxAtMs: t0 + 100,
    }),
    false,
  );
});
