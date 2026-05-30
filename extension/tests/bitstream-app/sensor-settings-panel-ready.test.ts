import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSensorSettingsPanelReady } from "../../src/webview/bitstream-app/hooks/evaluateSensorSettingsPanelReady";

const base = {
  backend: "simulator" as const,
  loopbackAvailable: true,
};

test("panel ready when shared WS client is connected", () => {
  assert.equal(
    evaluateSensorSettingsPanelReady({
      ...base,
      wsConnected: true,
      transportState: "disconnected",
      sessionConnected: false,
    }),
    true,
  );
});

test("panel ready when HostSession transport is connected", () => {
  assert.equal(
    evaluateSensorSettingsPanelReady({
      ...base,
      backend: "uart",
      loopbackAvailable: false,
      wsConnected: false,
      transportState: "connected",
      sessionConnected: false,
    }),
    true,
  );
});

test("panel not ready with no link", () => {
  assert.equal(
    evaluateSensorSettingsPanelReady({
      ...base,
      wsConnected: false,
      transportState: "disconnected",
      sessionConnected: false,
    }),
    false,
  );
});
