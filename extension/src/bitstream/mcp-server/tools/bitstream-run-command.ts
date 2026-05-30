import { createBitstreamMcpToolRegistration } from "../../command-api/bitstreamCommandMcpRegistration";
import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

export function createBitstreamRunCommandTool(
  runtime: BitstreamMcpRuntimeContext,
): BitstreamMcpToolRegistration {
  return createBitstreamMcpToolRegistration(runtime.getSession);
}
