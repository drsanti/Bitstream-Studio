import assert from "node:assert/strict";
import test from "node:test";
import { shouldIngestTelemetryForRoute, shouldAcceptBs2SampleOrigin } from "../../src/webview/bitstream-app/utils/bitstreamTelemetryTransport";
import type { TelemetryTransportSnapshot } from "../../src/webview/bitstream-app/utils/bitstreamTelemetryTransport";

const comClosed: TelemetryTransportSnapshot = {
  connected: true,
  transportState: "connected",
  serialBridgeStatus: {
    isOpen: false,
    path: null,
    baudRate: null,
    bytesRead: 0,
    bytesWritten: 0,
  },
};

const comOpen: TelemetryTransportSnapshot = {
  connected: true,
  transportState: "connected",
  serialBridgeStatus: {
    isOpen: true,
    path: "COM3",
    baudRate: 921600,
    bytesRead: 0,
    bytesWritten: 0,
  },
};

test("shouldIngestTelemetryForRoute — simulator only when COM closed", () => {
  assert.equal(shouldIngestTelemetryForRoute("simulator", comClosed), true);
  assert.equal(shouldIngestTelemetryForRoute("simulator", comOpen), false);
});

test("shouldIngestTelemetryForRoute — uart only when COM open", () => {
  assert.equal(shouldIngestTelemetryForRoute("uart", comOpen), true);
  assert.equal(shouldIngestTelemetryForRoute("uart", comClosed), false);
});

test("shouldAcceptBs2SampleOrigin — origin must match toolbar mode", () => {
  assert.equal(shouldAcceptBs2SampleOrigin({ origin: "uart" }, "uart"), true);
  assert.equal(shouldAcceptBs2SampleOrigin({ origin: "uart" }, "simulator"), false);
  assert.equal(shouldAcceptBs2SampleOrigin({ origin: "sim" }, "simulator"), true);
  assert.equal(shouldAcceptBs2SampleOrigin({ origin: "sim" }, "uart"), false);
  assert.equal(shouldAcceptBs2SampleOrigin({}, "uart"), true);
});
