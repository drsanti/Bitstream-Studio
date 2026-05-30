import type { HostSession } from "../session/host-session";
import { registerBitstreamMcpTool } from "./bitstreamCommandMcpRegistration";

interface MinimalMcpServer {
  tool: (
    name: string,
    description: string,
    inputSchema: unknown,
    handler: (args: unknown) => Promise<unknown>,
  ) => void;
}

/**
 * Example usage from MCP server entrypoint:
 * registerBitstreamToolOnServer(server, () => runtime.getHostSession());
 */
export function registerBitstreamToolOnServer(
  server: MinimalMcpServer,
  getSession: () => HostSession | null,
): void {
  registerBitstreamMcpTool((name, description, inputSchema, handler) => {
    server.tool(name, description, inputSchema, handler);
  }, getSession);
}
