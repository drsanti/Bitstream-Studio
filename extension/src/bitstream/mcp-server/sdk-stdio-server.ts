import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { createBitstreamMcpRuntimeContext } from "./runtime-context";
import { registerBitstreamMcpPrompts } from "./register-prompts";
import { registerBitstreamMcpResources } from "./register-resources";
import { registerBitstreamMcpTools } from "./register-tools";
import type { BitstreamMcpRuntimeContext, BitstreamMcpServerLike } from "./types";

const LOOSE_INPUT_SCHEMA = z.object({}).passthrough();

function toTextContent(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function toStructuredContent(payload: unknown): Record<string, unknown> {
  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return { result: payload };
}

function createSdkServerAdapter(server: McpServer): BitstreamMcpServerLike {
  return {
    tool: (name, description, _inputSchema, handler) => {
      server.registerTool(
        name,
        {
          description,
          inputSchema: LOOSE_INPUT_SCHEMA,
        },
        async (args) => {
          const payload = await handler(args);
          return {
            content: [
              {
                type: "text",
                text: toTextContent(payload),
              },
            ],
            structuredContent: toStructuredContent(payload),
          };
        },
      );
    },
    resource: (name, uri, metadata, handler) => {
      server.registerResource(name, uri, metadata, handler);
    },
    prompt: (name, metadata, handler) => {
      server.registerPrompt(name, metadata, handler);
    },
  };
}

export interface StartBitstreamMcpStdioServerOptions {
  runtime: BitstreamMcpRuntimeContext;
  serverName?: string;
  serverVersion?: string;
  includeHealthCheck?: boolean;
}

export async function startBitstreamMcpStdioServer(
  options: StartBitstreamMcpStdioServerOptions,
): Promise<{ server: McpServer; transport: StdioServerTransport }> {
  const server = new McpServer({
    name: options.serverName ?? "bitstream-mcp-server",
    version: options.serverVersion ?? "0.1.0",
  });

  const adapter = createSdkServerAdapter(server);
  registerBitstreamMcpTools(adapter, options.runtime, {
    includeHealthCheck: options.includeHealthCheck ?? true,
  });
  registerBitstreamMcpResources(adapter);
  registerBitstreamMcpPrompts(adapter);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  return { server, transport };
}

export interface CreateBitstreamMcpStdioServerRuntimeOptions {
  getSession: BitstreamMcpRuntimeContext["getSession"];
  isRuntimeReady?: BitstreamMcpRuntimeContext["isRuntimeReady"];
  getRuntimeSummary?: BitstreamMcpRuntimeContext["getRuntimeSummary"];
}

export async function startBitstreamMcpStdioServerFromRuntime(
  options: CreateBitstreamMcpStdioServerRuntimeOptions,
): Promise<{ server: McpServer; transport: StdioServerTransport }> {
  const runtime = createBitstreamMcpRuntimeContext({
    getSession: options.getSession,
    isRuntimeReady: options.isRuntimeReady,
    getRuntimeSummary: options.getRuntimeSummary,
  });
  return startBitstreamMcpStdioServer({ runtime });
}
