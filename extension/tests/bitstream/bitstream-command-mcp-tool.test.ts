import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BITSTREAM_MCP_BACKOFF_BY_ERROR_CODE,
  BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS,
  BITSTREAM_MCP_INTERNAL_ERROR_CODE,
  BITSTREAM_MCP_INTERNAL_ERROR_TYPE,
  BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE,
  BITSTREAM_MCP_NO_SESSION_ERROR_CODE,
  BITSTREAM_MCP_RETRYABLE_ERROR_CODES,
  BITSTREAM_MCP_SCHEMA_VERSION,
  BITSTREAM_MCP_TOOL_NAME,
  classifyMcpErrorCodeFromMessage,
  getMcpBackoffForErrorCode,
  getBitstreamRunCommandMcpToolDescriptor,
  isRetryableMcpErrorCode,
  normalizeMcpErrorEnvelope,
  runBitstreamCommandMcpTool,
} from "../../src/bitstream/command-api/bitstreamCommandMcpTool";
import { withHostSessionForHandshakeTest } from "./helpers/hostSessionHandshakeTestEnv";

describe("bitstreamCommandMcpTool", () => {
  it("exposes stable tool descriptor metadata", () => {
    const descriptor = getBitstreamRunCommandMcpToolDescriptor();
    assert.equal(descriptor.name, BITSTREAM_MCP_TOOL_NAME);
    assert.equal(descriptor.inputSchema.type, "object");
    assert.equal(descriptor.outputSchema.type, "object");
  });

  it("returns schema version and adapter output", async () => {
    await withHostSessionForHandshakeTest(async (session) => {
      const result = await runBitstreamCommandMcpTool(() => session, {
        command: { type: "handshake.run", payload: {} },
      });
      assert.equal(result.schemaVersion, BITSTREAM_MCP_SCHEMA_VERSION);
      assert.equal(result.ok, true);
      assert.equal(result.envelope.ok, true);
    });
  });

  it("normalizes unexpected runtime exceptions to schema-safe envelope", async () => {
    const result = await runBitstreamCommandMcpTool(() => {
      throw new Error("session provider crashed");
    }, {
      command: { type: "handshake.run", payload: {} },
    });
    assert.equal(result.schemaVersion, BITSTREAM_MCP_SCHEMA_VERSION);
    assert.equal(result.ok, false);
    assert.equal(result.envelope.ok, false);
    assert.equal(result.envelope.type, BITSTREAM_MCP_INTERNAL_ERROR_TYPE);
    if ("errorCode" in result.envelope && "timestamp" in result.envelope) {
      assert.equal(result.envelope.errorCode, BITSTREAM_MCP_INTERNAL_ERROR_CODE);
      assert.equal(result.envelope.retryable, false);
      assert.equal(result.envelope.recommendedBackoffMs, undefined);
      assert.equal(typeof result.envelope.timestamp, "string");
      assert.ok((result.envelope.timestamp as string).length > 0);
      assert.ok(
        "error" in result.envelope &&
          typeof result.envelope.error === "string" &&
          result.envelope.error.includes("session provider crashed"),
      );
      return;
    }
    assert.fail("Expected normalized MCP error envelope with errorCode and timestamp");
  });

  it("marks no-session command error as retryable", async () => {
    const result = await runBitstreamCommandMcpTool(() => null, {
      command: { type: "handshake.run", payload: {} },
    });
    assert.equal(result.ok, false);
    if ("errorCode" in result.envelope && "retryable" in result.envelope) {
      assert.equal(result.envelope.errorCode, BITSTREAM_MCP_NO_SESSION_ERROR_CODE);
      assert.equal(result.envelope.retryable, true);
      assert.equal(
        result.envelope.recommendedBackoffMs,
        BITSTREAM_MCP_BACKOFF_BY_ERROR_CODE[BITSTREAM_MCP_NO_SESSION_ERROR_CODE] ??
          BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS,
      );
      return;
    }
    assert.fail("Expected normalized no-session MCP envelope");
  });

  it("marks invalid request as non-retryable", async () => {
    const result = await runBitstreamCommandMcpTool(() => null, { command: "bad-input" });
    assert.equal(result.ok, false);
    if ("errorCode" in result.envelope && "retryable" in result.envelope) {
      assert.equal(result.envelope.errorCode, BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE);
      assert.equal(result.envelope.retryable, false);
      assert.equal(result.envelope.recommendedBackoffMs, undefined);
      return;
    }
    assert.fail("Expected normalized invalid-request MCP envelope");
  });

  it("provides adaptive backoff helper with fallback default", () => {
    assert.equal(
      getMcpBackoffForErrorCode(BITSTREAM_MCP_NO_SESSION_ERROR_CODE),
      BITSTREAM_MCP_BACKOFF_BY_ERROR_CODE[BITSTREAM_MCP_NO_SESSION_ERROR_CODE],
    );
    assert.equal(getMcpBackoffForErrorCode("unknown.error.code"), BITSTREAM_MCP_DEFAULT_RETRY_BACKOFF_MS);
  });

  it("exposes retryable error-code helper", () => {
    assert.equal(BITSTREAM_MCP_RETRYABLE_ERROR_CODES.has(BITSTREAM_MCP_NO_SESSION_ERROR_CODE), true);
    assert.equal(isRetryableMcpErrorCode(BITSTREAM_MCP_NO_SESSION_ERROR_CODE), true);
    assert.equal(isRetryableMcpErrorCode(BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE), false);
  });

  it("normalizes envelope via shared helper", () => {
    const normalized = normalizeMcpErrorEnvelope("bitstream.command.error", "No active HostSession");
    assert.equal(normalized.ok, false);
    assert.equal(normalized.errorCode, BITSTREAM_MCP_NO_SESSION_ERROR_CODE);
    assert.equal(normalized.retryable, true);
    assert.equal(
      normalized.recommendedBackoffMs,
      BITSTREAM_MCP_BACKOFF_BY_ERROR_CODE[BITSTREAM_MCP_NO_SESSION_ERROR_CODE],
    );
  });

  it("classifies error code from message using exported helper", () => {
    assert.equal(classifyMcpErrorCodeFromMessage("No active HostSession"), BITSTREAM_MCP_NO_SESSION_ERROR_CODE);
    assert.equal(classifyMcpErrorCodeFromMessage("Invalid request payload"), BITSTREAM_MCP_INVALID_REQUEST_ERROR_CODE);
  });
});
