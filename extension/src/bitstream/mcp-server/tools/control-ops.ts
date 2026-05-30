/*******************************************************************************
 * File Name : control-ops.ts
 *
 * Description : MCP control_ops over BS2 (HELLO, PING, CAPS_GET).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const CONTROL_OPS_INPUT_SCHEMA = {
  type: "object",
  properties: {
    op: {
      type: "string",
      enum: ["hello", "ping", "caps", "status", "sensor_reinit"],
    },
    requestId: { type: "string" },
    protocolVersion: { type: "number" },
    nonce: { type: "number" },
  },
  required: ["op"],
  additionalProperties: true,
} as const;

interface ControlOpsArgs
{
  op: "hello" | "ping" | "caps" | "status" | "sensor_reinit";
  requestId?: string;
  protocolVersion?: number;
  nonce?: number;
}

export function createControlOpsTool(runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration
{
  return {
    name: "bitstream_control_ops",
    description: "Run BS2 control commands (hello from HELLO topic, ping/caps via bitstream2/req).",
    inputSchema: CONTROL_OPS_INPUT_SCHEMA,
    handler: async (args: unknown) =>
    {
      const session = runtime.getSession();
      if (!session)
      {
        return {
          ok: false,
          error: "Bitstream session not available",
        };
      }

      const typedArgs = (args ?? {}) as Partial<ControlOpsArgs>;
      const op = typedArgs.op;
      if (!op)
      {
        return { ok: false, error: "op is required" };
      }
      const requestId = typedArgs.requestId ?? `control-${op}-${Date.now()}`;

      if (op === "hello")
      {
        const hello = session.getHello();
        if (hello == null)
        {
          return { ok: false, error: "BS2 HELLO not received yet" };
        }
        return {
          ok: true,
          op,
          requestId,
          ack: {
            protocolVersion: hello.version,
            caps: hello.caps,
            mtuSensor: hello.mtuSensor,
            mtuCtrl: hello.mtuCtrl,
            fwTag: hello.fwTag,
          },
        };
      }
      if (op === "ping")
      {
        const res = await session.ping();
        return { ok: true, op, requestId, ack: res };
      }
      if (op === "caps")
      {
        const res = await session.getCaps();
        return { ok: true, op, requestId, ack: res };
      }
      if (op === "status" || op === "sensor_reinit")
      {
        return {
          ok: false,
          error: `${op} is not exposed on BS2 wire; use bitstream2/evt/status or firmware-specific REQ when added`,
        };
      }

      return { ok: false, error: `Unsupported op: ${String(op)}` };
    },
  };
}
