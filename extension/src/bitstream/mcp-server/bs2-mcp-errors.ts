/*******************************************************************************
 * File Name : bs2-mcp-errors.ts
 *
 * Description : MCP error messages for BS2-only runtime (no v1 diag channel).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export const BS2_MCP_DIAG_UNSUPPORTED =
  "Diagnostics MCP tools require v1 diag channel (0x03). BS2 MCP uses bitstream2/req only; use bitstream2:uart-probe or EVT_DIAG when firmware exposes BS2 diagnostics.";

export function bs2DiagUnsupportedResult(): { ok: false; error: string }
{
  return { ok: false, error: BS2_MCP_DIAG_UNSUPPORTED };
}
