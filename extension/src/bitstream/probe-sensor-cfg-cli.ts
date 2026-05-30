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

function clampInt(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type SensorCfg = {
  enabled: boolean;
  publishMode: number;
  samplingIntervalMs: number;
  deltaX100: number;
  minPublishIntervalMs: number;
};

function formatCfg(cfg: SensorCfg): string {
  return `enabled=${cfg.enabled ? 1 : 0} mode=${cfg.publishMode} samplingMs=${cfg.samplingIntervalMs} deltaX100=${cfg.deltaX100} minPublishMs=${cfg.minPublishIntervalMs}`;
}

function diffCfg(expected: SensorCfg, actual: SensorCfg): string[] {
  const diffs: string[] = [];
  if (expected.enabled !== actual.enabled) diffs.push(`enabled expected=${expected.enabled} actual=${actual.enabled}`);
  if (expected.publishMode !== actual.publishMode) diffs.push(`publishMode expected=${expected.publishMode} actual=${actual.publishMode}`);
  if (expected.samplingIntervalMs !== actual.samplingIntervalMs) diffs.push(`samplingIntervalMs expected=${expected.samplingIntervalMs} actual=${actual.samplingIntervalMs}`);
  if (expected.deltaX100 !== actual.deltaX100) diffs.push(`deltaX100 expected=${expected.deltaX100} actual=${actual.deltaX100}`);
  if (expected.minPublishIntervalMs !== actual.minPublishIntervalMs) diffs.push(`minPublishIntervalMs expected=${expected.minPublishIntervalMs} actual=${actual.minPublishIntervalMs}`);
  return diffs;
}

async function main(): Promise<void> {
  console.error(
    "DEPRECATED: v1 HostSession probe-sensor-cfg-cli. Use BS2: npm run bitstream2:uart-probe or bitstream2:cfg-roundtrip",
  );
  process.exit(2);
  const wsUrl = env("T3D_WS_CLIENT_URL", "ws://127.0.0.1:9998");
  const path = env("BITSTREAM_SERIAL_PATH", "COM3");
  const baudRate = parseIntEnv("BITSTREAM_BAUD_RATE", 921600);
  const bridgeReqTimeoutMs = clampInt(parseIntEnv("BRIDGE_REQ_TIMEOUT_MS", 7000), 250, 60000);

  const sourceId = clampInt(parseIntEnv("SENSOR_SOURCE_ID", 1), 0, 255);
  const loops = clampInt(parseIntEnv("SENSOR_CFG_LOOPS", 40), 1, 100000);
  const setEnabled = parseIntEnv("SENSOR_CFG_ENABLED", 0) !== 0;
  const setPublishMode = clampInt(parseIntEnv("SENSOR_CFG_PUBLISH_MODE", 1), 0, 2);
  const setSamplingIntervalMs = clampInt(parseIntEnv("SENSOR_CFG_SAMPLING_MS", 100), 1, 60000);
  const setDeltaX100 = clampInt(parseIntEnv("SENSOR_CFG_DELTA_X100", 0), 0, 65535);
  const setMinPublishIntervalMs = clampInt(parseIntEnv("SENSOR_CFG_MIN_PUBLISH_MS", 0), 0, 60000);

  const ackTimeoutMs = clampInt(parseIntEnv("SENSOR_CFG_ACK_TIMEOUT_MS", 8000), 250, 60000);
  const ackRetryCount = clampInt(parseIntEnv("SENSOR_CFG_ACK_RETRY_COUNT", 1), 0, 10);
  const settleAfterOpenMs = clampInt(parseIntEnv("SENSOR_CFG_SETTLE_OPEN_MS", 200), 0, 2000);
  const delayBeforeVerifyMs = clampInt(parseIntEnv("SENSOR_CFG_VERIFY_DELAY_MS", 80), 0, 2000);
  const delayBetweenLoopsMs = clampInt(parseIntEnv("SENSOR_CFG_LOOP_DELAY_MS", 120), 0, 2000);

  console.log("[sensor-cfg-cli] wsUrl =", wsUrl);
  console.log("[sensor-cfg-cli] serial =", path, "baudRate =", baudRate);
  console.log("[sensor-cfg-cli] sourceId =", sourceId, "loops =", loops);
  console.log("[sensor-cfg-cli] set =", {
    enabled: setEnabled,
    publishMode: setPublishMode,
    samplingIntervalMs: setSamplingIntervalMs,
    deltaX100: setDeltaX100,
    minPublishIntervalMs: setMinPublishIntervalMs,
  });
  console.log("[sensor-cfg-cli] timeouts =", {
    bridgeReqTimeoutMs,
    ackTimeoutMs,
    ackRetryCount,
    settleAfterOpenMs,
    delayBeforeVerifyMs,
    delayBetweenLoopsMs,
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
  transport.onState((s) => console.log("[sensor-cfg-cli] transport state =", s));

  const session = new HostSession({
    transport,
    timeoutPolicy: {
      timeoutMs: ackTimeoutMs,
      retryCount: ackRetryCount,
    },
  });

  let okCount = 0;
  let timeoutCount = 0;
  let mismatchCount = 0;
  let otherErrCount = 0;

  try {
    console.log("[sensor-cfg-cli] opening...");
    await session.open();
    if (settleAfterOpenMs > 0) {
      await sleep(settleAfterOpenMs);
    }

    for (let i = 0; i < loops; i += 1) {
      const tag = `i=${i}`;
      try {
        const get0 = await executeBitstreamCommand(session, {
          type: "sensor.cfg.get",
          payload: { requestId: `cli-sensor-cfg-get0-${sourceId}-${Date.now()}`, sourceId },
        });
        if (!get0.ok || !get0.data) {
          throw new Error(get0.error ?? "sensor.cfg.get failed");
        }

        const before: SensorCfg = {
          enabled: get0.data.enabled,
          publishMode: get0.data.publishMode,
          samplingIntervalMs: get0.data.samplingIntervalMs,
          deltaX100: get0.data.deltaX100,
          minPublishIntervalMs: get0.data.minPublishIntervalMs,
        };

        const expected: SensorCfg = {
          enabled: setEnabled,
          publishMode: setPublishMode,
          samplingIntervalMs: setSamplingIntervalMs,
          deltaX100: setDeltaX100,
          minPublishIntervalMs: setMinPublishIntervalMs,
        };

        const set = await executeBitstreamCommand(session, {
          type: "sensor.cfg.set",
          payload: {
            requestId: `cli-sensor-cfg-set-${sourceId}-${Date.now()}`,
            options: { sourceId, ...expected },
          },
        });
        if (!set.ok) {
          throw new Error(set.error ?? "sensor.cfg.set failed");
        }

        if (delayBeforeVerifyMs > 0) {
          await sleep(delayBeforeVerifyMs);
        }

        const get1 = await executeBitstreamCommand(session, {
          type: "sensor.cfg.get",
          payload: { requestId: `cli-sensor-cfg-get1-${sourceId}-${Date.now()}`, sourceId },
        });
        if (!get1.ok || !get1.data) {
          throw new Error(get1.error ?? "sensor.cfg.get verify failed");
        }

        const after: SensorCfg = {
          enabled: get1.data.enabled,
          publishMode: get1.data.publishMode,
          samplingIntervalMs: get1.data.samplingIntervalMs,
          deltaX100: get1.data.deltaX100,
          minPublishIntervalMs: get1.data.minPublishIntervalMs,
        };

        const diffs = diffCfg(expected, after);
        if (diffs.length > 0) {
          mismatchCount += 1;
          console.log("[sensor-cfg-cli] MISMATCH", tag);
          console.log("[sensor-cfg-cli] before:", formatCfg(before));
          console.log("[sensor-cfg-cli] expected:", formatCfg(expected));
          console.log("[sensor-cfg-cli] after:", formatCfg(after));
          console.log("[sensor-cfg-cli] diffs:", diffs.join("; "));
        } else {
          okCount += 1;
          if (i % 10 === 0) {
            console.log("[sensor-cfg-cli] OK", tag, "after:", formatCfg(after));
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/timeout/i.test(msg)) {
          timeoutCount += 1;
          console.warn("[sensor-cfg-cli] TIMEOUT", tag, msg);
        } else {
          otherErrCount += 1;
          console.error("[sensor-cfg-cli] ERROR", tag, msg);
        }
      } finally {
        if (delayBetweenLoopsMs > 0) {
          await sleep(delayBetweenLoopsMs);
        }
      }
    }
  } finally {
    try {
      await session.close();
    } catch {
      // ignore
    }
    console.log("[sensor-cfg-cli] summary =", {
      ok: okCount,
      mismatch: mismatchCount,
      timeout: timeoutCount,
      other: otherErrCount,
    });
    if (mismatchCount > 0 || timeoutCount > 0 || otherErrCount > 0) {
      process.exitCode = 1;
    }
  }
}

void main();

