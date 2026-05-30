import type { BitstreamMcpToolRiskInfo } from "./bitstream-mcp-tool-policy";
import {
  getBitstreamMcpToolRiskInfo,
  isRiskyBitstreamMcpTool,
} from "./bitstream-mcp-tool-policy";
import { getProject4McpToolRiskInfo, isRiskyProject4McpTool } from "./project4-mcp-tool-policy";

export function getMcpToolRiskInfo(toolId: string): BitstreamMcpToolRiskInfo {
  if (toolId.startsWith("project4_")) {
    return getProject4McpToolRiskInfo(toolId);
  }
  return getBitstreamMcpToolRiskInfo(toolId);
}

export function isRiskyMcpTool(toolId: string): boolean {
  if (toolId.startsWith("project4_")) {
    return isRiskyProject4McpTool(toolId);
  }
  return isRiskyBitstreamMcpTool(toolId);
}
