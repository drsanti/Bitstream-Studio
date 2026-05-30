import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS,
  BITSTREAM_MCP_INTERNAL_ERROR_CODE,
  BITSTREAM_MCP_INTERNAL_ERROR_TYPE,
  BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE,
  BITSTREAM_MCP_NO_SESSION_ERROR_CODE,
  classifyMcpErrorCodeFromMessage,
  getMcpBackoffForErrorCode,
  isRetryableMcpErrorCode,
  normalizeMcpErrorEnvelope,
} from "../../src/bitstream/command-api/bitstreamCommandMcpErrorUtils";

describe("bitstreamCommandMcpErrorUtils", () => {
  it("classifies known messages by policy", () => {
    assert.equal(classifyMcpErrorCodeFromMessage("No active HostSession"), BITSTREAM_MCP_NO_SESSION_ERROR_CODE);
    assert.equal(classifyMcpErrorCodeFromMessage("Bitstream session not available"), BITSTREAM_MCP_NO_SESSION_ERROR_CODE);
    assert.equal(classifyMcpErrorCodeFromMessage("Invalid request payload"), BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE);
    assert.equal(classifyMcpErrorCodeFromMessage("Invalid Bitstream command payload"), BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE);
  });

  it("returns default backoff for unknown code", () => {
    assert.equal(getMcpBackoffForErrorCode("unknown.error.code"), BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS);
  });

  it("marks only configured code as retryable", () => {
    assert.equal(isRetryableMcpErrorCode(BITSTREAM_MCP_NO_SESSION_ERROR_CODE), true);
    assert.equal(isRetryableMcpErrorCode(BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE), false);
  });

  it("normalizes internal errors with non-retryable envelope", () => {
    const envelope = normalizeMcpErrorEnvelope(BITSTREAM_MCP_INTERNAL_ERROR_TYPE, "MCP tool execution failed");
    assert.equal(envelope.ok, false);
    assert.equal(envelope.errorCode, BITSTREAM_MCP_INTERNAL_ERROR_CODE);
    assert.equal(envelope.retryable, false);
    assert.equal(envelope.recommendedBackoffMs, undefined);
  });
});
