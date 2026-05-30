import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldShowUartMissingHandshakeNotice,
  uartMissingHandshakeMessage,
  UART_MISSING_HANDSHAKE_GRACE_MS,
} from "../../src/webview/bitstream-shell/utils/uartHandshakeMissingAlert.js";

test("uartMissingHandshakeMessage varies by link and COM", () => {
  assert.match(uartMissingHandshakeMessage({ wsConnected: false, comOpen: false }), /Link/i);
  assert.match(uartMissingHandshakeMessage({ wsConnected: true, comOpen: false }), /USB/i);
  assert.match(uartMissingHandshakeMessage({ wsConnected: true, comOpen: true }), /not responding/i);
});

test("shouldShowUartMissingHandshakeNotice respects grace and handshake", () => {
  const t0 = 10_000;
  const conn = { connected: true, transportState: "connected" as const, serialBridgeStatus: null };
  assert.equal(
    shouldShowUartMissingHandshakeNotice({
      backend: "simulator",
      watchStartedAtMs: t0,
      nowMs: t0 + UART_MISSING_HANDSHAKE_GRACE_MS,
      handshakeState: "unknown",
      conn,
    }),
    false,
  );
  assert.equal(
    shouldShowUartMissingHandshakeNotice({
      backend: "uart",
      watchStartedAtMs: t0,
      nowMs: t0 + UART_MISSING_HANDSHAKE_GRACE_MS - 1,
      handshakeState: "unknown",
      conn,
    }),
    false,
  );
  assert.equal(
    shouldShowUartMissingHandshakeNotice({
      backend: "uart",
      watchStartedAtMs: t0,
      nowMs: t0 + UART_MISSING_HANDSHAKE_GRACE_MS,
      handshakeState: "unknown",
      conn,
    }),
    true,
  );
  assert.equal(
    shouldShowUartMissingHandshakeNotice({
      backend: "uart",
      watchStartedAtMs: t0,
      nowMs: t0 + UART_MISSING_HANDSHAKE_GRACE_MS,
      handshakeState: "passed",
      conn,
    }),
    false,
  );
  assert.equal(
    shouldShowUartMissingHandshakeNotice({
      backend: "uart",
      watchStartedAtMs: t0,
      nowMs: t0 + UART_MISSING_HANDSHAKE_GRACE_MS,
      handshakeState: "failed",
      conn,
    }),
    false,
  );
});
