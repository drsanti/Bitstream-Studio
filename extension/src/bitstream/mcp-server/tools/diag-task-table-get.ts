/*******************************************************************************
 * File Name : diag-task-table-get.ts
 *
 * Description : MCP diag task table tool (v1 channel — stubbed under BS2 MCP runtime).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { bs2DiagUnsupportedResult } from "../bs2-mcp-errors";
import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const DIAG_TASK_TABLE_INPUT_SCHEMA = {
  type: "object",
  properties: {
    diagMajor: { type: "number" },
    diagMinor: { type: "number" },
    timeoutMs: { type: "number" },
  },
  additionalProperties: true,
} as const;

export function createDiagTaskTableGetTool(_runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration
{
  return {
    name: "bitstream_diag_task_table_get",
    description:
      "Fetch diagnostics task table (v1 diag channel). BS2 MCP returns unsupported until EVT_DIAG parity is wired.",
    inputSchema: DIAG_TASK_TABLE_INPUT_SCHEMA,
    handler: async () => bs2DiagUnsupportedResult(),
  };
}
