import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runBitstreamCommandFromMcp } from "../../src/bitstream/command-api/bitstreamCommandMcpAdapter";
import { withHostSessionForHandshakeTest } from "./helpers/hostSessionHandshakeTestEnv";

describe("runBitstreamCommandFromMcp", () => {
  it("returns invalid request envelope when command type is not supported", async () => {
    const result = await runBitstreamCommandFromMcp(() => null, { command: "sensor.unknown" });
    assert.equal(result.ok, false);
    assert.equal(result.envelope.ok, false);
    assert.ok(
      "error" in result.envelope &&
        typeof result.envelope.error === "string" &&
        result.envelope.error.includes("Invalid Bitstream command payload"),
    );
    assert.ok(result.supportedCommands.length > 0);
  });

  it("returns no-session envelope when command is valid but no session exists", async () => {
    const result = await runBitstreamCommandFromMcp(() => null, {
      command: { type: "handshake.run", payload: {} },
    });
    assert.equal(result.ok, false);
    assert.equal(result.envelope.ok, false);
    assert.ok(
      "error" in result.envelope &&
        typeof result.envelope.error === "string" &&
        result.envelope.error.includes("Bitstream session not available"),
    );
  });

  it("executes valid command and returns successful envelope", async () => {
    await withHostSessionForHandshakeTest(async (session) => {
      const result = await runBitstreamCommandFromMcp(() => session, {
        command: { type: "handshake.run", payload: {} },
      });
      assert.equal(result.ok, true);
      assert.equal(result.envelope.ok, true);
      if (result.envelope.ok && result.envelope.data) {
        assert.equal(result.envelope.data.protocolVersion, 1);
      }
    });
  });

  it("normalizes sensor.cfg.set when payload.options already exists (coerce string sourceId and fields)", async () => {
    const result = await runBitstreamCommandFromMcp(() => null, {
      command: {
        type: "sensor.cfg.set",
        payload: {
          options: {
            sourceId: "4",
            samplingIntervalMs: "50",
            publishMode: "1",
          },
        },
      },
      debugWire: true,
    });
    assert.ok(result.debug?.normalizedCommand && typeof result.debug.normalizedCommand === "object");
    const cmd = result.debug!.normalizedCommand as {
      payload: {
        options: {
          sourceId: number;
          samplingIntervalMs: number;
          publishMode: number;
        };
      };
    };
    assert.equal(cmd.payload.options.sourceId, 4);
    assert.equal(cmd.payload.options.samplingIntervalMs, 50);
    assert.equal(cmd.payload.options.publishMode, 1);
  });
});
