import assert from "node:assert/strict";
import test from "node:test";

import { BitstreamAckStatusError, ensureDiagAckOk, ensureHelloAckOk } from "../../src/bitstream";

test("ensureHelloAckOk returns ack when status is success", () => {
  const ack = ensureHelloAckOk({ ackId: 0x81, status: 0, protocolVersion: 1 });
  assert.equal(ack.protocolVersion, 1);
});

test("ensureHelloAckOk throws BitstreamAckStatusError for non-zero status", () => {
  assert.throws(
    () => ensureHelloAckOk({ ackId: 0x81, status: 2, protocolVersion: 1 }),
    (error: unknown) => {
      assert.ok(error instanceof BitstreamAckStatusError);
      assert.equal(error.kind, "control");
      assert.equal(error.code, 2);
      return true;
    },
  );
});

test("ensureDiagAckOk throws BitstreamAckStatusError for non-zero resultCode", () => {
  assert.throws(
    () =>
      ensureDiagAckOk(
        {
          ackId: 0x80,
          ackCommandId: 0x10,
          resultCode: 0x0a,
          requestId: 0x1234,
          detail: 0,
        },
        "DIAG_SET_TASK_PRIORITY_ACK",
      ),
    (error: unknown) => {
      assert.ok(error instanceof BitstreamAckStatusError);
      assert.equal(error.kind, "diagnostics");
      assert.equal(error.code, 0x0a);
      assert.equal(error.ackCommandId, 0x10);
      return true;
    },
  );
});
