import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTelemetryDeltaFixed,
  formatTelemetryDeltaPairFixed,
  pickTelemetryBadgeDeltaMs,
  TELEMETRY_DELTA_PLACEHOLDER,
  TELEMETRY_DELTA_SLOT_CHARS,
} from "../../src/webview/bitstream-app/utils/telemetryDeltaDisplay";

test("formatTelemetryDeltaFixed uses space-padded integer ms slot", () => {
  const text = formatTelemetryDeltaFixed(20);
  assert.equal(text, "    20 Δms");
  assert.equal(text?.length, TELEMETRY_DELTA_SLOT_CHARS);
});

test("formatTelemetryDeltaFixed space-pads small ms values", () => {
  const text = formatTelemetryDeltaFixed(5);
  assert.equal(text, "     5 Δms");
  assert.equal(text?.length, TELEMETRY_DELTA_SLOT_CHARS);
});

test("formatTelemetryDeltaFixed rounds ms to nearest integer", () => {
  const text = formatTelemetryDeltaFixed(997.4);
  assert.equal(text, "   997 Δms");
  assert.equal(text?.length, TELEMETRY_DELTA_SLOT_CHARS);
});

test("formatTelemetryDeltaFixed uses 2-decimal seconds slot at 1s+", () => {
  const text = formatTelemetryDeltaFixed(1000);
  assert.equal(text, "   1.00 Δs");
  assert.equal(text?.length, TELEMETRY_DELTA_SLOT_CHARS);
});

test("formatTelemetryDeltaFixed placeholder is fixed width", () => {
  assert.equal(TELEMETRY_DELTA_PLACEHOLDER, "   --- Δms");
  assert.equal(TELEMETRY_DELTA_PLACEHOLDER.length, TELEMETRY_DELTA_SLOT_CHARS);
  assert.equal(
    formatTelemetryDeltaFixed(null, { placeholder: true }),
    TELEMETRY_DELTA_PLACEHOLDER,
  );
});

test("formatTelemetryDeltaPairFixed joins device and host slots", () => {
  const pair = formatTelemetryDeltaPairFixed({ deviceDeltaMs: 20, hostDeltaMs: 22 });
  assert.equal(pair, "    20 Δms     22 Δms");
  assert.equal(pair.length, TELEMETRY_DELTA_SLOT_CHARS * 2 + 1);
});

test("pickTelemetryBadgeDeltaMs prefers device tMs inter-arrival", () => {
  assert.equal(
    pickTelemetryBadgeDeltaMs({
      deltaSource: "device",
      deviceInterArrivalMs: 20,
      hostInterArrivalMs: 22,
      wallAgeMs: 300,
    }),
    20,
  );
});

test("pickTelemetryBadgeDeltaMs uses host ingest gap for host source", () => {
  assert.equal(
    pickTelemetryBadgeDeltaMs({
      deltaSource: "host",
      deviceInterArrivalMs: 20,
      hostInterArrivalMs: 22,
      wallAgeMs: 300,
    }),
    22,
  );
});

test("pickTelemetryBadgeDeltaMs hides host delta until second sample", () => {
  assert.equal(
    pickTelemetryBadgeDeltaMs({
      deltaSource: "host",
      deviceInterArrivalMs: null,
      hostInterArrivalMs: null,
      wallAgeMs: 150,
    }),
    null,
  );
});

test("pickTelemetryBadgeDeltaMs returns null for both source (dual render)", () => {
  assert.equal(
    pickTelemetryBadgeDeltaMs({
      deltaSource: "both",
      deviceInterArrivalMs: 20,
      hostInterArrivalMs: 22,
      wallAgeMs: 300,
    }),
    null,
  );
});
