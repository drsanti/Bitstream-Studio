import type { RegisteredBitstreamMcpTool } from "./bitstream-mcp-tool-registry";

/** Project 4 removed from Bitstream Studio — no MCP tools registered. */
export function collectProject4McpTools(): Map<string, RegisteredBitstreamMcpTool>
{
  return new Map();
}
