import { SerialBridgeTransportAdapter } from "./transport/serial-bridge-transport";
import { HostSession } from "./session/host-session";
import { DIAG_STREAM_START_REQ, DIAG_STREAM_STOP_REQ } from "./commands/diagnostics-commands";
import { decodeDiagAck } from "./commands/ack-decoders";

function env(name: string, fallback: string): string {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
}

function clampMs(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

async function main(): Promise<void> {
  console.error("DEPRECATED: v1 diag stream probe. Use bitstream2:uart-probe for BS2 bring-up.");
  process.exit(2);
  const wsUrl = env("T3D_WS_CLIENT_URL", "ws://127.0.0.1:9998");
  const path = env("BITSTREAM_SERIAL_PATH", "COM3");
  const baudRate = parseIntEnv("BITSTREAM_BAUD_RATE", 921600);
  const globalPeriodMs = clampMs(parseIntEnv("DIAG_GLOBAL_MS", 1000), 20, 60000);
  const taskPeriodMs = clampMs(parseIntEnv("DIAG_TASK_MS", 1000), 20, 60000);

  // Bridge request timeout (OPEN/WRITE_RESULT etc).
  const bridgeRequestTimeoutMs = clampMs(parseIntEnv("BRIDGE_REQ_TIMEOUT_MS", 7000), 250, 60000);
  // Firmware ACK timeout budget (HostSession / ProtocolEngine).
  const diagAckTimeoutMs = clampMs(parseIntEnv("DIAG_ACK_TIMEOUT_MS", 4000), 250, 60000);
  const diagAckRetryCount = clampMs(parseIntEnv("DIAG_ACK_RETRY_COUNT", 1), 0, 10);

  console.log("[diag-cli] wsUrl =", wsUrl);
  console.log("[diag-cli] serial =", path, "baudRate =", baudRate);
  console.log("[diag-cli] stream globalMs =", globalPeriodMs, "taskMs =", taskPeriodMs);
  console.log(
    "[diag-cli] timeouts bridgeReqMs =",
    bridgeRequestTimeoutMs,
    "diagAckMs =",
    diagAckTimeoutMs,
    "diagAckRetry =",
    diagAckRetryCount,
  );

  const transport = new SerialBridgeTransportAdapter({
    wsUrl,
    path,
    baudRate,
    mode: "both",
    readline: true,
    readlineDelimiter: "\n",
    requestTimeoutMs: bridgeRequestTimeoutMs,
  });

  transport.onState((state) => {
    console.log("[diag-cli] transport state =", state);
  });

  const session = new HostSession({
    transport,
    timeoutPolicy: {
      timeoutMs: diagAckTimeoutMs,
      retryCount: diagAckRetryCount,
    },
  });

  try {
    console.log("[diag-cli] opening...");
    await session.open();

    console.log("[diag-cli] sending DIAG_STREAM_START...");
    const payload = new Uint8Array(6);
    const view = new DataView(payload.buffer);
    payload[0] = 2;
    payload[1] = 0;
    view.setUint16(2, globalPeriodMs & 0xffff, true);
    view.setUint16(4, taskPeriodMs & 0xffff, true);

    const ack = await session.sendCommandAndDecode({
      requestId: `cli-diag-stream-start-${Date.now()}`,
      command: DIAG_STREAM_START_REQ,
      payload,
      decode: decodeDiagAck,
      timeoutMs: diagAckTimeoutMs,
      retryCount: diagAckRetryCount,
    });
    console.log("[diag-cli] DIAG_STREAM_START ack =", ack);

    console.log("[diag-cli] sending DIAG_STREAM_STOP...");
    const ackStop = await session.sendCommandAndDecode({
      requestId: `cli-diag-stream-stop-${Date.now()}`,
      command: DIAG_STREAM_STOP_REQ,
      payload: Uint8Array.of(2, 0),
      decode: decodeDiagAck,
      timeoutMs: diagAckTimeoutMs,
      retryCount: diagAckRetryCount,
    });
    console.log("[diag-cli] DIAG_STREAM_STOP ack =", ackStop);

    console.log("[diag-cli] OK");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[diag-cli] ERROR:", msg);
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

