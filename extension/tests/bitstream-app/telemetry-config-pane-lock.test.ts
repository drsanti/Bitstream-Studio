import assert from "node:assert/strict";
import test from "node:test";
import { resolveTelemetryConfigLockReason } from "../../src/webview/sensor-telemetry/lib/telemetryConfigPaneLockReason";
import { sensorCfgApplyBarAck } from "../../src/webview/sensor-telemetry/lib/sensorCfgApplyBarAck";

test("resolveTelemetryConfigLockReason — ws disconnected first", () => {
  const reason = resolveTelemetryConfigLockReason(
    false,
    { ready: false, reason: "ws_disconnected" },
    false,
  );
  assert.ok(reason != null);
  assert.match(reason.message, /WebSocket/i);
});

test("resolveTelemetryConfigLockReason — com closed for UART", () => {
  const reason = resolveTelemetryConfigLockReason(
    false,
    { ready: false, reason: "com_closed" },
    false,
  );
  assert.ok(reason != null);
  assert.match(reason.message, /serial port/i);
});

test("resolveTelemetryConfigLockReason — handshake pending", () => {
  const reason = resolveTelemetryConfigLockReason(
    false,
    { ready: true, reason: "ok" },
    false,
  );
  assert.ok(reason != null);
  assert.match(reason.message, /HELLO/i);
});

test("resolveTelemetryConfigLockReason — cfg loading", () => {
  const reason = resolveTelemetryConfigLockReason(true, { ready: true, reason: "ok" }, false);
  assert.ok(reason != null);
  assert.match(reason.message, /Loading sensor configuration/i);
});

test("resolveTelemetryConfigLockReason — unlocked", () => {
  const reason = resolveTelemetryConfigLockReason(true, { ready: true, reason: "ok" }, true);
  assert.equal(reason, null);
});

test("sensorCfgApplyBarAck — hides idle and bmi270 output mode", () => {
  assert.equal(sensorCfgApplyBarAck({ state: "idle" }), undefined);
  assert.equal(
    sensorCfgApplyBarAck({
      state: "pending",
      pendingReason: "bmi270_output_mode",
    }),
    undefined,
  );
});

test("sensorCfgApplyBarAck — passes pending sensor_cfg", () => {
  const ack = sensorCfgApplyBarAck({
    state: "pending",
    pendingReason: "sensor_cfg",
    sourceId: 1,
  });
  assert.equal(ack?.state, "pending");
});
