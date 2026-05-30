import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import type { BitstreamMcpAdapterOutput } from "./bitstreamCommandMcpAdapter";
import { BitstreamCommandApi } from "./bitstreamCommandApi";
import { runBitstreamCommandFromMcp } from "./bitstreamCommandMcpAdapter";
import {
  BITSTREAM_MCP_INTERNAL_ERROR_TYPE,
  normalizeMcpErrorEnvelope,
} from "./bitstreamCommandMcpErrorUtils";

export const BITSTREAM_MCP_TOOL_NAME = "bitstream_run_command";
export const BITSTREAM_MCP_SCHEMA_VERSION = "1.0.0";
export {
  BITSTREAM_MCP_BACKOFF_BY_ERROR_CODE,
  BITSTREAM_MCP_COMMAND_ERROR_CODE,
  BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS,
  BITSTREAM_MCP_INTERNAL_ERROR_CODE,
  BITSTREAM_MCP_INTERNAL_ERROR_TYPE,
  BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE,
  BITSTREAM_MCP_NO_SESSION_ERROR_CODE,
  BITSTREAM_MCP_RETRYABLE_ERROR_CODES,
  classifyMcpErrorCodeFromMessage,
  getMcpBackoffForErrorCode,
  isRetryableMcpErrorCode,
  normalizeMcpErrorEnvelope,
} from "./bitstreamCommandMcpErrorUtils";

export const bitstreamRunCommandInputSchema = {
  type: "object",
  description:
    "Accepts either { command: { type, payload } } or direct shape { type, payload }. payload may be omitted for handshake.run.",
  properties: {
    command: {
      type: "object",
      description: "Bitstream command request object { type, payload }",
      properties: {
        type: { type: "string" },
        payload: { type: "object" },
      },
      required: ["type"],
      additionalProperties: true,
    },
    type: { type: "string" },
    payload: { type: "object" },
    debugWire: {
      type: "boolean",
      description: "When true, include normalized command and predicted wire payload bytes in output.debug.",
    },
  },
  anyOf: [{ required: ["command"] }, { required: ["type"] }],
  additionalProperties: true,
} as const;

export const bitstreamRunCommandOutputSchema = {
  type: "object",
  properties: {
    schemaVersion: { type: "string" },
    ok: { type: "boolean" },
    supportedCommands: {
      type: "array",
      items: { type: "string" },
    },
    envelope: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        type: { type: "string" },
        errorCode: { type: "string" },
        timestamp: { type: "string" },
        retryable: { type: "boolean" },
        recommendedBackoffMs: { type: "number" },
        requestId: { type: "string" },
        data: {},
        error: { type: "string" },
      },
      required: ["ok", "type"],
      additionalProperties: true,
    },
  },
  required: ["schemaVersion", "ok", "supportedCommands", "envelope"],
  additionalProperties: false,
} as const;

export interface BitstreamRunCommandMcpOutput extends BitstreamMcpAdapterOutput {
  schemaVersion: string;
}

export function getBitstreamRunCommandMcpToolDescriptor() {
  return {
    name: BITSTREAM_MCP_TOOL_NAME,
    description: "Execute a typed Bitstream command over the active BS2 broker session (bitstream2/req).",
    inputSchema: bitstreamRunCommandInputSchema,
    outputSchema: bitstreamRunCommandOutputSchema,
  };
}

export async function runBitstreamCommandMcpTool(
  getSession: () => Bs2BrokerSession | null,
  args: unknown,
): Promise<BitstreamRunCommandMcpOutput> {
  const api = new BitstreamCommandApi({ getSession });
  try {
    const result = await runBitstreamCommandFromMcp(getSession, args);
    if (!result.ok && result.envelope.error) {
      const normalized = normalizeMcpErrorEnvelope(result.envelope.type, result.envelope.error);
      return {
        schemaVersion: BITSTREAM_MCP_SCHEMA_VERSION,
        ok: false,
        supportedCommands: result.supportedCommands,
        envelope: normalized,
      };
    }
    return {
      schemaVersion: BITSTREAM_MCP_SCHEMA_VERSION,
      ...result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const envelope = normalizeMcpErrorEnvelope(
      BITSTREAM_MCP_INTERNAL_ERROR_TYPE,
      `MCP tool execution failed: ${message}`,
    );
    return {
      schemaVersion: BITSTREAM_MCP_SCHEMA_VERSION,
      ok: false,
      supportedCommands: api.listSupportedCommands(),
      envelope,
    };
  }
}
