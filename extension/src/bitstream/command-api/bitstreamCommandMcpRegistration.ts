import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import {
  BITSTREAM_MCP_TOOL_NAME,
  getBitstreamRunCommandMcpToolDescriptor,
  runBitstreamCommandMcpTool,
} from "./bitstreamCommandMcpTool";

export interface SimpleMcpToolRegistration {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  handler: (args: unknown) => Promise<unknown>;
}

export type RegisterMcpTool = (
  name: string,
  description: string,
  inputSchema: unknown,
  handler: (args: unknown) => Promise<unknown>,
) => void;

export function createBitstreamMcpToolRegistration(
  getSession: () => Bs2BrokerSession | null,
): SimpleMcpToolRegistration {
  const descriptor = getBitstreamRunCommandMcpToolDescriptor();
  return {
    name: BITSTREAM_MCP_TOOL_NAME,
    description: descriptor.description,
    inputSchema: descriptor.inputSchema,
    outputSchema: descriptor.outputSchema,
    handler: async (args: unknown) => runBitstreamCommandMcpTool(getSession, args),
  };
}

export function registerBitstreamMcpTool(
  registerTool: RegisterMcpTool,
  getSession: () => Bs2BrokerSession | null,
): SimpleMcpToolRegistration {
  const registration = createBitstreamMcpToolRegistration(getSession);
  registerTool(
    registration.name,
    registration.description,
    registration.inputSchema,
    registration.handler,
  );
  return registration;
}
