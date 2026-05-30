import { SerialBridgeTransportAdapter } from "./transport/serial-bridge-transport";
import { HostSession } from "./session/host-session";
import { executeBitstreamCommand } from "./command-api/bitstreamCommandExecutor";

function env(name: string, fallback: string): string {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
}

async function main(): Promise<void> {
  console.error(
    "DEPRECATED: v1 HostSession probe-handshake-cli. Use BS2: npm run bitstream2:uart-probe -- --path=COMx",
  );
  process.exit(2);

  const wsUrl = env("T3D_WS_CLIENT_URL", "ws://127.0.0.1:9998");
  const path = env("BITSTREAM_SERIAL_PATH", "COM3");
  const baudRate = parseIntEnv("BITSTREAM_BAUD_RATE", 921600);
  // Handshake is a CONTROL ACK sequence; the bridge request timeout must cover the ACK budget.
  const ackTimeoutMs = parseIntEnv("ACK_TIMEOUT_MS", 4000);
  const ackRetryCount = parseIntEnv("ACK_RETRY_COUNT", 2);
  const minBridgeReqTimeoutMs = ackTimeoutMs * (ackRetryCount + 1) + 2500;
  const bridgeReqTimeoutMs = Math.max(
    parseIntEnv("BRIDGE_REQ_TIMEOUT_MS", minBridgeReqTimeoutMs),
    minBridgeReqTimeoutMs,
  );

  console.log("[handshake-cli] wsUrl =", wsUrl);
  console.log("[handshake-cli] serial =", path, "baudRate =", baudRate);

  const transport = new SerialBridgeTransportAdapter({
    wsUrl,
    path,
    baudRate,
    mode: "both",
    readline: true,
    readlineDelimiter: "\n",
    requestTimeoutMs: bridgeReqTimeoutMs,
    awaitWriteResult: true,
  });
  transport.onState((s) => console.log("[handshake-cli] transport state =", s));

  const session = new HostSession({
    transport,
    timeoutPolicy: {
      timeoutMs: ackTimeoutMs,
      retryCount: ackRetryCount,
    },
  });

  try {
    await session.open();
    const result = await executeBitstreamCommand(session, {
      type: "handshake.run",
      payload: {
        requestIdPrefix: "cli-handshake",
        protocolVersion: 2,
        pingNonce: 0x7f,
      },
    });
    console.log("[handshake-cli] result =", result);
    if (!result.ok) {
      process.exitCode = 1;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[handshake-cli] ERROR:", msg);
    process.exitCode = 1;
  } finally {
    try {
      await session.close();
    } catch {
      // ignore
    }
  }
}

void main();

