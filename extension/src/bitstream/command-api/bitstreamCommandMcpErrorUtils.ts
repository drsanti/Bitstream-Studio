import type { BitstreamMcpErrorEnvelope } from "./bitstreamCommandMcpAdapter";

export const BITSTREAM_MCP_INTERNAL_ERROR_TYPE = "mcp.internal.error";
export const BITSTREAM_MCP_INTERNAL_ERROR_CODE = "BITSTREAM_MCP_INTERNAL";
export const BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE = "BITSTREAM_MCP_INVALID_REQUEST";
export const BITSTREAM_MCP_NO_SESSION_ERROR_CODE = "BITSTREAM_MCP_NO_SESSION";
export const BITSTREAM_MCP_COMMAND_ERROR_CODE = "BITSTREAM_MCP_COMMAND_ERROR";
export const BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS = 1500;

export const BITSTREAM_MCP_BACKOFF_BY_ERROR_CODE: Record<string, number> = {
  [BITSTREAM_MCP_NO_SESSION_ERROR_CODE]: BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS,
  [BITSTREAM_MCP_COMMAND_ERROR_CODE]: 3000,
};

export const BITSTREAM_MCP_RETRYABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  BITSTREAM_MCP_NO_SESSION_ERROR_CODE,
]);

export function classifyMcpErrorCodeFromMessage(message: string): string {
  if (message.includes("No active HostSession") || message.includes("Bitstream session not available")) {
    return BITSTREAM_MCP_NO_SESSION_ERROR_CODE;
  }
  if (message.includes("Invalid request") || message.includes("Invalid Bitstream command payload")) {
    return BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE;
  }
  return BITSTREAM_MCP_COMMAND_ERROR_CODE;
}

export function getMcpBackoffForErrorCode(errorCode: string): number {
  return BITSTREAM_MCP_BACKOFF_BY_ERROR_CODE[errorCode] ?? BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS;
}

export function isRetryableMcpErrorCode(errorCode: string): boolean {
  return BITSTREAM_MCP_RETRYABLE_ERROR_CODES.has(errorCode);
}

function getRecommendedBackoffMs(errorCode: string, retryable: boolean): number | undefined {
  if (!retryable) {
    return undefined;
  }
  return getMcpBackoffForErrorCode(errorCode);
}

export function normalizeMcpErrorEnvelope(type: string, message: string): BitstreamMcpErrorEnvelope {
  const errorCode =
    type === BITSTREAM_MCP_INTERNAL_ERROR_TYPE
      ? BITSTREAM_MCP_INTERNAL_ERROR_CODE
      : classifyMcpErrorCodeFromMessage(message);
  const retryable = isRetryableMcpErrorCode(errorCode);
  return {
    ok: false,
    type,
    errorCode,
    timestamp: new Date().toISOString(),
    retryable,
    recommendedBackoffMs: getRecommendedBackoffMs(errorCode, retryable),
    error: message,
  };
}
