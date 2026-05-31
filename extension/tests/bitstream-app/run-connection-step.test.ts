import assert from "node:assert/strict";
import test from "node:test";
import { getConnectionStepContinueLabel } from "../../src/webview/bitstream-app/connection/runConnectionStep.js";

test("continue label — UART transport", () => {
  assert.equal(getConnectionStepContinueLabel("transport", "uart"), "Open allowed port");
});

test("continue label — simulator transport", () => {
  assert.equal(getConnectionStepContinueLabel("transport", "simulator"), "Start simulator");
});

test("continue label — bridge", () => {
  assert.equal(getConnectionStepContinueLabel("bridge", "uart"), "Start bridge");
});
