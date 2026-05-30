import type { BitstreamMcpToolRiskInfo } from "./bitstream-mcp-tool-policy";

export const PROJECT4_MCP_TOOL_IDS = ["project4_telemetry_get", "project4_move", "project4_set_speed"] as const;

export type Project4McpToolId = (typeof PROJECT4_MCP_TOOL_IDS)[number];

/** Mutating robot motion / speed presets — confirm UX recommended. */
const PROJECT4_MCP_RISKY_TOOL_IDS: ReadonlySet<string> = new Set<string>(["project4_move", "project4_set_speed"]);

export function getProject4McpToolRiskInfo(toolId: string): BitstreamMcpToolRiskInfo {
  if (PROJECT4_MCP_RISKY_TOOL_IDS.has(toolId)) {
    return {
      toolId,
      level: "risky",
      reason: "project4 motion tool",
      userFacingWarning:
        toolId === "project4_move"
          ? "This sends a real motion command to the microcontroller (/move)."
          : "This changes the drive speed preset on the microcontroller (/setSpeed).",
    };
  }
  return {
    toolId,
    level: "read_only",
    reason: "project4 read-only telemetry",
    userFacingWarning: "Read-only tool.",
  };
}

export function isRiskyProject4McpTool(toolId: string): boolean {
  return PROJECT4_MCP_RISKY_TOOL_IDS.has(toolId);
}
