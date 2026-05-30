/*******************************************************************************
 * File Name : diag-fault-events-get.ts
 *
 * Description : MCP diag fault events tool (v1 channel — stubbed under BS2 MCP runtime).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { bs2DiagUnsupportedResult } from "../bs2-mcp-errors";
import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const DIAG_FAULT_EVENTS_INPUT_SCHEMA = {
  type: "object",
  properties: {
    windowMs: { type: "number" },
    maxEvents: { type: "number" },
  },
  additionalProperties: true,
} as const;

export function createDiagFaultEventsGetTool(_runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration
{
  return {
    name: "bitstream_diag_fault_events_get",
    description:
      "Collect diagnostics fault events (v1 diag channel). BS2 MCP returns unsupported until EVT_DIAG parity is wired.",
    inputSchema: DIAG_FAULT_EVENTS_INPUT_SCHEMA,
    handler: async () => bs2DiagUnsupportedResult(),
  };
}
