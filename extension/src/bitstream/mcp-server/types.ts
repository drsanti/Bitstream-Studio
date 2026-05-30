import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";

export interface BitstreamMcpRuntimeContext {
  getSession: () => Bs2BrokerSession | null;
  isRuntimeReady?: () => boolean;
  getRuntimeSummary?: () => Record<string, unknown>;
}

export interface BitstreamMcpToolRegistration {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema?: unknown;
  handler: (args: unknown) => Promise<unknown>;
}

export interface BitstreamMcpServerLike {
  tool: (
    name: string,
    description: string,
    inputSchema: unknown,
    handler: (args: unknown) => Promise<unknown>,
  ) => void;
  resource: (
    name: string,
    uri: string,
    metadata: {
      title?: string;
      description?: string;
      mimeType?: string;
    },
    handler: (uri: URL) => Promise<{
      contents: Array<{
        uri: string;
        mimeType?: string;
        text: string;
      }>;
    }>,
  ) => void;
  prompt: (
    name: string,
    metadata: {
      title?: string;
      description?: string;
      argsSchema?: Record<string, unknown>;
    },
    handler: (args: unknown) => {
      messages: Array<{
        role: "user" | "assistant";
        content: {
          type: "text";
          text: string;
        };
      }>;
    },
  ) => void;
}
