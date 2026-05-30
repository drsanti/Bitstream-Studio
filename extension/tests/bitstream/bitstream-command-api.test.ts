import assert from "node:assert/strict";
import test from "node:test";
import { BitstreamCommandApi, isBitstreamCommandRequest } from "../../src/bitstream/command-api/bitstreamCommandApi";
import { withHostSessionForHandshakeTest } from "./helpers/hostSessionHandshakeTestEnv";

test("isBitstreamCommandRequest validates basic shape", () => {
  assert.equal(isBitstreamCommandRequest({ type: "handshake.run" }), true);
  assert.equal(isBitstreamCommandRequest({ type: "unknown.command" }), false);
  assert.equal(isBitstreamCommandRequest(null), false);
});

test("BitstreamCommandApi executeRaw rejects invalid payload", async () => {
  const api = new BitstreamCommandApi({
    getSession: () => null,
  });
  const result = await api.executeRaw({ bad: true });
  assert.equal(result.ok, false);
  assert.equal(result.error, "Invalid Bitstream command payload");
});

test("BitstreamCommandApi executeRaw reports missing session", async () => {
  const api = new BitstreamCommandApi({
    getSession: () => null,
  });
  const result = await api.executeRaw({ type: "handshake.run" });
  assert.equal(result.ok, false);
  assert.equal(result.error, "Bitstream session not available");
});

test("BitstreamCommandApi onCommandOutcome when session is null", async () => {
  let calls = 0;
  const api = new BitstreamCommandApi({
    getSession: () => null,
    onCommandOutcome: (ctx) => {
      calls += 1;
      assert.equal(ctx.session, null);
      assert.equal(ctx.command.type, "handshake.run");
      assert.equal(ctx.envelope.ok, false);
      assert.equal(ctx.envelope.error, "Bitstream session not available");
    },
  });
  await api.execute({ type: "handshake.run", payload: {} });
  assert.equal(calls, 1);
});

test("BitstreamCommandApi onCommandOutcome when session is connected", async () => {
  await withHostSessionForHandshakeTest(async (session) => {
    let calls = 0;
    const api = new BitstreamCommandApi({
      getSession: () => session,
      onCommandOutcome: (ctx) => {
        calls += 1;
        assert.equal(ctx.session, session);
        assert.equal(ctx.envelope.ok, true);
      },
    });
    const result = await api.execute({ type: "handshake.run", payload: {} });
    assert.equal(result.ok, true);
    assert.equal(calls, 1);
  });
});
