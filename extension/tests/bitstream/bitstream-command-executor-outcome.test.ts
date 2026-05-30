import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeBitstreamCommand } from "../../src/bitstream/command-api/bitstreamCommandExecutor";
import { withHostSessionForHandshakeTest } from "./helpers/hostSessionHandshakeTestEnv";

describe("executeBitstreamCommand onOutcome", () => {
  it("invokes onOutcome after successful command", async () => {
    let calls = 0;
    await withHostSessionForHandshakeTest(async (session) => {
      const envelope = await executeBitstreamCommand(
        session,
        { type: "handshake.run", payload: {} },
        {
          onOutcome: (ctx) => {
            calls += 1;
            assert.equal(ctx.session, session);
            assert.equal(ctx.command.type, "handshake.run");
            assert.equal(ctx.envelope.ok, true);
          },
        },
      );
      assert.equal(envelope.ok, true);
    });
    assert.equal(calls, 1);
  });

  it("returns success when onOutcome throws (error is logged)", async () => {
    await withHostSessionForHandshakeTest(async (session) => {
      const envelope = await executeBitstreamCommand(
        session,
        { type: "handshake.run", payload: {} },
        {
          onOutcome: () => {
            throw new Error("observer failure");
          },
        },
      );
      assert.equal(envelope.ok, true);
    });
  });
});
