import { SerialBridgeTransportAdapter } from "./transport/serial-bridge-transport";
import { HostSession } from "./session/host-session";
import { executeBitstreamCommand } from "./command-api/bitstreamCommandExecutor";
import { runHandshakeSequence } from "./session/handshake-workflow";

function env(name: string, fallback: string): string {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  console.error("DEPRECATED: v1 HostSession probe. Use BS2: npm run bitstream2:uart-probe");
  process.exit(2);
  const wsUrl = env("T3D_WS_CLIENT_URL", "ws://127.0.0.1:9998");
  const path = env("BITSTREAM_SERIAL_PATH", "COM3");
  const baudRate = parseIntEnv("BITSTREAM_BAUD_RATE", 921600);

  const sourceId = clampInt(parseIntEnv("SENSOR_SOURCE_ID", 1), 0, 255);
  const loadSamplingMs = clampInt(parseIntEnv("LOAD_SAMPLING_MS", 10), 10, 60000);
  const loops = clampInt(parseIntEnv("CONTROL_LOOPS", 80), 1, 100000);
  const controlHz = clampInt(parseIntEnv("CONTROL_HZ", 10), 1, 50);

  const ackTimeoutMs = clampInt(parseIntEnv("ACK_TIMEOUT_MS", 8000), 250, 60000);
  const ackRetryCount = clampInt(parseIntEnv("ACK_RETRY_COUNT", 1), 0, 10);
  // The bridge request timeout must cover the full ACK budget including retries,
  // otherwise we'll time out at the RPC layer before the device has a chance to ACK.
  const minBridgeReqTimeoutMs = ackTimeoutMs * (ackRetryCount + 1) + 2500;
  const bridgeReqTimeoutMs = Math.max(
    clampInt(parseIntEnv("BRIDGE_REQ_TIMEOUT_MS", minBridgeReqTimeoutMs), 250, 60000),
    minBridgeReqTimeoutMs,
  );

  console.log("[control-load-cli] wsUrl =", wsUrl);
  console.log("[control-load-cli] serial =", path, "baudRate =", baudRate);
  console.log("[control-load-cli] sourceId =", sourceId);
  console.log("[control-load-cli] load sampling ms =", loadSamplingMs);
  console.log("[control-load-cli] loops =", loops, "controlHz =", controlHz);
  console.log("[control-load-cli] ack =", {
    ackTimeoutMs,
    ackRetryCount,
    bridgeReqTimeoutMs,
    minBridgeReqTimeoutMs,
  });

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
  transport.onState((s) => console.log("[control-load-cli] transport state =", s));

  const session = new HostSession({
    transport,
    timeoutPolicy: { timeoutMs: ackTimeoutMs, retryCount: ackRetryCount },
  });

  const latencies: number[] = [];
  let timeoutCount = 0;
  let errorCount = 0;

  try {
    await session.open();

    const hs = await runHandshakeSequence(session, {
      requestIdPrefix: `cli-handshake-${sourceId}`,
      protocolVersion: 2,
      pingNonce: 0x7f,
    });
    console.log("[control-load-cli] handshake ok =", {
      protocolVersion: hs.protocolVersion,
      capsFlags: hs.capsFlags,
      statusCounter: hs.statusCounter,
      durationsMs: hs.durationsMs,
    });

    // Put the sensor into a high-bandwidth streaming configuration.
    const set0 = await executeBitstreamCommand(session, {
      type: "sensor.cfg.set",
      payload: {
        requestId: `cli-load-set-${sourceId}-${Date.now()}`,
        options: {
          sourceId,
          enabled: true,
          publishMode: 0,
          samplingIntervalMs: loadSamplingMs,
          deltaX100: 0,
          minPublishIntervalMs: 0,
        },
      },
    });
    console.log("[control-load-cli] load set result =", set0.ok ? "ok" : set0.error);

    const periodMs = Math.max(20, Math.floor(1000 / controlHz));
    for (let i = 0; i < loops; i += 1) {
      const t0 = Date.now();
      try {
        const res = await executeBitstreamCommand(session, {
          type: "sensor.cfg.get",
          payload: { requestId: `cli-ctl-get-${sourceId}-${Date.now()}`, sourceId },
        });
        const dt = Date.now() - t0;
        if (!res.ok) {
          if (/timeout/i.test(res.error ?? "")) timeoutCount += 1;
          else errorCount += 1;
          console.warn("[control-load-cli] get error", "i=" + i, res.error);
        } else {
          latencies.push(dt);
          if (i % 10 === 0) {
            console.log("[control-load-cli] get ok", "i=" + i, "latMs=" + dt);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/timeout/i.test(msg)) timeoutCount += 1;
        else errorCount += 1;
        console.warn("[control-load-cli] exception", "i=" + i, msg);
      }
      await sleep(periodMs);
    }
  } finally {
    try {
      await session.close();
    } catch {
      // ignore
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    const p = (q: number) => {
      if (sorted.length === 0) return null;
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * q)));
      return sorted[idx] ?? null;
    };

    console.log("[control-load-cli] summary =", {
      ok: latencies.length,
      timeout: timeoutCount,
      error: errorCount,
      p50: p(0.5),
      p95: p(0.95),
      max: sorted.length ? sorted[sorted.length - 1] : null,
    });

    if (timeoutCount > 0 || errorCount > 0) {
      process.exitCode = 1;
    }
  }
}

void main();

