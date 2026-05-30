import assert from "node:assert/strict";
import test from "node:test";
import { Bs2BrokerSession } from "../../src/bitstream2/bridge/bs2-broker-session";
import { createHealthCheckTool } from "../../src/bitstream/mcp-server/tools/health-check";

test("bitstream_health_check: commandsReady false when BS2 session has no HELLO", async () =>
{
  const session = new Bs2BrokerSession({ clientIdentityRole: "mcp-test" });
  const tool = createHealthCheckTool({
    getSession: () => session,
    isRuntimeReady: () => true,
    getRuntimeSummary: () => ({ wsUrl: "ws://127.0.0.1:9998" }),
  });
  const result = (await tool.handler({})) as Record<string, unknown>;
  assert.equal(result.commandsReady, false);
  assert.equal(result.sessionAttached, true);
  const transport = result.transport as Record<string, unknown>;
  assert.equal(transport.name, "bs2-broker-ws");
});

test("bitstream_health_check: commandsReady true when HELLO present", async () =>
{
  const session = new Bs2BrokerSession({ clientIdentityRole: "mcp-test" });
  Object.defineProperty(session, "getHello", {
    value: () => ({ version: 2, caps: 1, mtuSensor: 256, mtuCtrl: 64, atMs: Date.now() }),
  });
  Object.defineProperty(session, "isCommandsReady", { value: () => true });
  Object.defineProperty(session, "isWsConnected", { value: () => true });

  const tool = createHealthCheckTool({
    getSession: () => session,
    getRuntimeSummary: () => ({}),
  });
  const result = (await tool.handler({})) as Record<string, unknown>;
  assert.equal(result.commandsReady, true);
  assert.equal((result.transport as { state: string }).state, "connected");
});
