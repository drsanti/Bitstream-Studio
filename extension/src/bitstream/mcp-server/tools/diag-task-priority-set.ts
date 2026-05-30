/*******************************************************************************
 * File Name : diag-task-priority-set.ts
 *
 * Description : MCP diag task priority tool (v1 channel — stubbed under BS2 MCP runtime).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { bs2DiagUnsupportedResult } from "../bs2-mcp-errors";
import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const DIAG_TASK_PRIORITY_SET_INPUT_SCHEMA = {
  type: "object",
  properties: {
    taskId: { type: "number" },
    newPriority: { type: "number" },
    diagMajor: { type: "number" },
    diagMinor: { type: "number" },
    firmwareRequestId: { type: "number" },
    timeoutMs: { type: "number" },
  },
  required: ["taskId", "newPriority"],
  additionalProperties: true,
} as const;

export function createDiagTaskPrioritySetTool(_runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration
{
  return {
    name: "bitstream_diag_task_priority_set",
    description:
      "Set diagnostics task priority (v1 diag channel). BS2 MCP returns unsupported until EVT_DIAG parity is wired.",
    inputSchema: DIAG_TASK_PRIORITY_SET_INPUT_SCHEMA,
    handler: async () => bs2DiagUnsupportedResult(),
  };
}
