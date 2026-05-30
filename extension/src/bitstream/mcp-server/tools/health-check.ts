/*******************************************************************************
 * File Name : health-check.ts
 *
 * Description : MCP health_check tool for BS2 broker session readiness.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const HEALTH_CHECK_INPUT_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export function createHealthCheckTool(runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration
{
  return {
    name: "bitstream_health_check",
    description:
      "Get runtime readiness, BS2 session handle, and whether bitstream2/req commands will succeed (HELLO + WS + serial).",
    inputSchema: HEALTH_CHECK_INPUT_SCHEMA,
    handler: async () =>
    {
      const session = runtime.getSession();
      const runtimeReady = runtime.isRuntimeReady ? runtime.isRuntimeReady() : session !== null;
      const summary = runtime.getRuntimeSummary ? runtime.getRuntimeSummary() : {};
      const hello = session?.getHello() ?? null;
      const commandsReady = session?.isCommandsReady() ?? false;

      return {
        ok: true,
        runtimeReady,
        sessionAttached: session !== null,
        commandsReady,
        transport: {
          name: "bs2-broker-ws",
          state: commandsReady ? "connected" : session?.isWsConnected() ? "ws-only" : "disconnected",
        },
        bs2: hello
          ? {
              version: hello.version,
              caps: hello.caps,
              fwTag: hello.fwTag,
            }
          : null,
        summary,
      };
    },
  };
}
