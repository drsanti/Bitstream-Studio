import { registerBitstreamMcpTools } from "../../bitstream/mcp-server/register-tools";
import type {
  BitstreamMcpRuntimeContext,
  BitstreamMcpServerLike,
  BitstreamMcpToolRegistration,
} from "../../bitstream/mcp-server/types";

export interface RegisteredBitstreamMcpTool extends BitstreamMcpToolRegistration {
  /** For debug UI; mirrors `name`. */
  toolId: string;
}

class ToolCollectorServer implements BitstreamMcpServerLike {
  public readonly tools = new Map<string, RegisteredBitstreamMcpTool>();

  tool(
    name: string,
    description: string,
    inputSchema: unknown,
    handler: (args: unknown) => Promise<unknown>,
  ): void {
    this.tools.set(name, {
      toolId: name,
      name,
      description,
      inputSchema,
      handler,
    });
  }
}

export function collectBitstreamMcpTools(
  runtime: BitstreamMcpRuntimeContext,
  options?: { includeHealthCheck?: boolean },
): Map<string, RegisteredBitstreamMcpTool> {
  const server = new ToolCollectorServer();
  registerBitstreamMcpTools(server, runtime, {
    includeHealthCheck: options?.includeHealthCheck,
  });
  return server.tools;
}

