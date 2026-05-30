import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTelemetryMetaRowDisplay,
  formatTelemetryMetaHzFixed,
  pickTelemetryMetaHz,
  telemetryMetaRowLabel,
  TELEMETRY_META_HZ_SLOT_CHARS,
} from "../../src/webview/bitstream-app/utils/telemetryMetaDisplay";
import { emptyStreamHzByHint } from "../../src/webview/bitstream-app/utils/telemetryStreamRate";

test("formatTelemetryMetaHzFixed pads to slot width", () => {
  assert.match(formatTelemetryMetaHzFixed(50), /50\.00/);
  assert.equal(formatTelemetryMetaHzFixed(null), "  --.--");
  assert.equal(formatTelemetryMetaHzFixed(null).length, TELEMETRY_META_HZ_SLOT_CHARS);
});

test("pickTelemetryMetaHz selects source map", () => {
  const device = emptyStreamHzByHint();
  device.bmi270 = 48;
  const host = emptyStreamHzByHint();
  host.bmi270 = 49;
  const counter = emptyStreamHzByHint();
  counter.bmi270 = 50;
  const smoothed = emptyStreamHzByHint();
  smoothed.bmi270 = 51;
  assert.equal(
    pickTelemetryMetaHz({
      rateSource: "host",
      hint: "bmi270",
      streamHzDeviceByHint: device,
      streamHzHostByHint: host,
      streamHzCounterByHint: counter,
      streamHzSmoothedByHint: smoothed,
    }),
    49,
  );
});

test("buildTelemetryMetaRowDisplay both mode includes counter", () => {
  const row = buildTelemetryMetaRowDisplay({
    displayMode: "both",
    counterText: "100",
    hz: 50,
  });
  assert.match(row.value, /100/);
  assert.equal(row.unit, "Hz");
});

test("telemetryMetaRowLabel for hz mode", () => {
  assert.equal(telemetryMetaRowLabel("BMI270", "hz"), "BMI270 stream rate");
});
