import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createBitstreamMcpToolRegistration,
  registerBitstreamMcpTool,
} from "../../src/bitstream/command-api/bitstreamCommandMcpRegistration";
import { withHostSessionForHandshakeTest } from "./helpers/hostSessionHandshakeTestEnv";

describe("createBitstreamMcpToolRegistration", () => {
  it("creates tool registration and executes handler", async () => {
    await withHostSessionForHandshakeTest(async (session) => {
      const registration = createBitstreamMcpToolRegistration(() => session);
      assert.equal(registration.name, "bitstream_run_command");
      const output = await registration.handler({
        command: { type: "handshake.run", payload: {} },
      });
      assert.ok(output);
    });
  });

  it("registers tool using callback-style MCP server API", () => {
    const toolNames: string[] = [];
    const registration = registerBitstreamMcpTool(
      (name) => {
        toolNames.push(name);
      },
      () => null,
    );
    assert.equal(registration.name, "bitstream_run_command");
    assert.ok(toolNames.includes("bitstream_run_command"));
  });
});
