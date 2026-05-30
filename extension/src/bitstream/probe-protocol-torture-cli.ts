import { SerialBridgeTransportAdapter } from "./transport/serial-bridge-transport";
import { HostSession } from "./session/host-session";
import { executeBitstreamCommand } from "./command-api/bitstreamCommandExecutor";
import { runHandshakeSequence } from "./session/handshake-workflow";
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

function clampInt(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function parseBoolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const v = raw.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "y" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "n" || v === "off") return false;
  return fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Summary = {
  ok: number;
  timeout: number;
  error: number;
  mismatch: number;
  p50: number | null;
  p95: number | null;
  max: number | null;
};

function summarize(latenciesMs: number[], timeout: number, error: number, mismatch: number): Summary {
  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const p = (q: number) => {
    if (sorted.length === 0) return null;
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * q)));
    return sorted[idx] ?? null;
  };
  return {
    ok: latenciesMs.length,
    timeout,
    error,
    mismatch,
    p50: p(0.5),
    p95: p(0.95),
    max: sorted.length ? sorted[sorted.length - 1] : null,
  };
}

async function startDiagStream(session: HostSession, globalPeriodMs: number, taskPeriodMs: number) {
  const payload = new Uint8Array(6);
  const view = new DataView(payload.buffer);
  payload[0] = 2;
  payload[1] = 0;
  view.setUint16(2, globalPeriodMs & 0xffff, true);
  view.setUint16(4, taskPeriodMs & 0xffff, true);

  return await session.sendCommandAndDecode({
    requestId: `cli-diag-stream-start-${Date.now()}`,
    command: DIAG_STREAM_START_REQ,
    payload,
    decode: decodeDiagAck,
  });
}

async function stopDiagStream(session: HostSession) {
  return await session.sendCommandAndDecode({
    requestId: `cli-diag-stream-stop-${Date.now()}`,
    command: DIAG_STREAM_STOP_REQ,
    payload: Uint8Array.of(2, 0),
    decode: decodeDiagAck,
  });
}

async function main(): Promise<void> {
  console.error("DEPRECATED: v1 HostSession probe. Use BS2 hardware CLIs under src/bitstream2/dev/");
  process.exit(2);
  const wsUrl = env("T3D_WS_CLIENT_URL", "ws://127.0.0.1:9998");
  const path = env("BITSTREAM_SERIAL_PATH", "COM3");
  const baudRate = parseIntEnv("BITSTREAM_BAUD_RATE", 921600);

  const sourceId = clampInt(parseIntEnv("SENSOR_SOURCE_ID", 1), 0, 255);
  const magSourceId = clampInt(parseIntEnv("MAG_SOURCE_ID", 3), 0, 255);
  const baroSourceId = clampInt(parseIntEnv("BARO_SOURCE_ID", 2), 0, 255);
  const loops = clampInt(parseIntEnv("TORTURE_LOOPS", 120), 1, 100000);
  const controlHz = clampInt(parseIntEnv("TORTURE_CONTROL_HZ", 12), 1, 50);
  const loadSamplingMs = clampInt(parseIntEnv("LOAD_SAMPLING_MS", 10), 1, 60000);
  const enablePublishModeStress = parseBoolEnv("ENABLE_PUBLISH_MODE_STRESS", true);
  const strictVerify = parseBoolEnv("STRICT_VERIFY", true);
  const allowSuperseded = parseBoolEnv("ALLOW_SUPERSEDED", true);
  const minPublishAms = clampInt(parseIntEnv("MIN_PUBLISH_A_MS", 0), 0, 60000);
  const minPublishBms = clampInt(parseIntEnv("MIN_PUBLISH_B_MS", 50), 0, 60000);
  const deltaAx100 = clampInt(parseIntEnv("DELTA_A_X100", 0), 0, 65535);
  const deltaBx100 = clampInt(parseIntEnv("DELTA_B_X100", 25), 0, 65535);
  const verifyWindowMs = clampInt(parseIntEnv("VERIFY_WINDOW_MS", 450), 0, 5000);
  const verifyPollMs = clampInt(parseIntEnv("VERIFY_POLL_MS", 60), 10, 1000);

  const ackTimeoutMs = clampInt(parseIntEnv("ACK_TIMEOUT_MS", 8000), 250, 60000);
  const ackRetryCount = clampInt(parseIntEnv("ACK_RETRY_COUNT", 1), 0, 10);
  const minBridgeReqTimeoutMs = ackTimeoutMs * (ackRetryCount + 1) + 2500;
  const bridgeReqTimeoutMs = Math.max(
    clampInt(parseIntEnv("BRIDGE_REQ_TIMEOUT_MS", minBridgeReqTimeoutMs), 250, 60000),
    minBridgeReqTimeoutMs,
  );

  const diagGlobalMs = clampInt(parseIntEnv("DIAG_GLOBAL_MS", 150), 20, 60000);
  const diagTaskMs = clampInt(parseIntEnv("DIAG_TASK_MS", 150), 20, 60000);
  const diagMajor = clampInt(parseIntEnv("DIAG_MAJOR", 2), 0, 255);
  const diagMinor = clampInt(parseIntEnv("DIAG_MINOR", 0), 0, 255);
  const enableBmi270ModeToggle = parseBoolEnv("ENABLE_BMI270_MODE_TOGGLE", false);
  const bmiModeA = clampInt(parseIntEnv("BMI270_MODE_A", 0), 0, 2);
  const bmiModeB = clampInt(parseIntEnv("BMI270_MODE_B", 1), 0, 2);
  const fusionFeedAms = clampInt(parseIntEnv("BMI270_FUSION_FEED_A_MS", 10), 10, 100);
  const fusionFeedBms = clampInt(parseIntEnv("BMI270_FUSION_FEED_B_MS", 20), 10, 100);
  const diagTaskId = clampInt(parseIntEnv("DIAG_TASK_ID", 1), 0, 0xffff);
  const diagTaskPrioA = clampInt(parseIntEnv("DIAG_TASK_PRIO_A", 3), 0, 255);
  const diagTaskPrioB = clampInt(parseIntEnv("DIAG_TASK_PRIO_B", 5), 0, 255);
  const diagTaskStreamPeriodMs = clampInt(parseIntEnv("DIAG_TASK_STREAM_PERIOD_MS", 20), 0, 60000);
  const diagTaskStreamMaxRows = clampInt(parseIntEnv("DIAG_TASK_STREAM_MAX_ROWS", 6), 1, 24);
  const diagTaskStreamResyncMs = clampInt(parseIntEnv("DIAG_TASK_STREAM_RESYNC_MS", 2000), 250, 60000);

  console.log("[protocol-torture] wsUrl =", wsUrl);
  console.log("[protocol-torture] serial =", path, "baudRate =", baudRate);
  console.log("[protocol-torture] loops =", loops, "controlHz =", controlHz, "sourceId =", sourceId);
  console.log("[protocol-torture] sources =", { magSourceId, baroSourceId });
  console.log("[protocol-torture] load sampling ms =", loadSamplingMs);
  console.log("[protocol-torture] cfg stress =", {
    strictVerify,
    allowSuperseded,
    enablePublishModeStress,
    minPublishAms,
    minPublishBms,
    deltaAx100,
    deltaBx100,
  });
  console.log("[protocol-torture] diag =", { diagGlobalMs, diagTaskMs });
  console.log("[protocol-torture] diag tasks =", {
    diagMajor,
    diagMinor,
    diagTaskId,
    diagTaskPrioA,
    diagTaskPrioB,
    diagTaskStreamPeriodMs,
    diagTaskStreamMaxRows,
    diagTaskStreamResyncMs,
  });
  console.log("[protocol-torture] bmi270 mode toggle =", enableBmi270ModeToggle);
  console.log("[protocol-torture] bmi270 mode =", { bmiModeA, bmiModeB });
  console.log("[protocol-torture] bmi270 fusion feed =", { fusionFeedAms, fusionFeedBms });
  console.log("[protocol-torture] timeouts =", {
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
  transport.onState((s) => console.log("[protocol-torture] transport state =", s));

  const session = new HostSession({
    transport,
    timeoutPolicy: { timeoutMs: ackTimeoutMs, retryCount: ackRetryCount },
  });

  const latencies: number[] = [];
  let timeoutCount = 0;
  let errorCount = 0;
  let mismatchCount = 0;
  let reconnectCount = 0;

  const periodMs = Math.max(20, Math.floor(1000 / controlHz));
  const enabledA = true;
  const enabledB = false;
  let expectedEnabled: boolean | null = null;
  let expectedMagEnabled: boolean | null = null;
  let expectedBaroEnabled: boolean | null = null;
  let expectedFusionFeedMs: number | null = null;
  let expectedMagMode: number | null = null;
  let expectedBaroMode: number | null = null;

  try {
    const setupSession = async (reason: string) => {
      console.log("[protocol-torture] setup session:", reason);
      await session.open();

      const countFailure = (message: string) => {
        if (/timeout/i.test(message)) timeoutCount += 1;
        else errorCount += 1;
      };

      // After MCU reset or multi-client close/open churn, the first CONTROL roundtrip can miss.
      let hs: Awaited<ReturnType<typeof runHandshakeSequence>> | null = null;
      let lastHandshakeErr: unknown = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          hs = await runHandshakeSequence(session, {
            requestIdPrefix: `cli-handshake-${sourceId}`,
            protocolVersion: 2,
            pingNonce: 0x7f,
          });
          lastHandshakeErr = null;
          break;
        } catch (e) {
          lastHandshakeErr = e;
          await sleep(250 + attempt * 250);
        }
      }
      if (!hs) {
        throw (lastHandshakeErr instanceof Error
          ? lastHandshakeErr
          : new Error(String(lastHandshakeErr ?? "handshake failed")));
      }
      console.log("[protocol-torture] handshake ok =", {
        protocolVersion: hs.protocolVersion,
        capsFlags: hs.capsFlags,
        statusCounter: hs.statusCounter,
        durationsMs: hs.durationsMs,
      });

      const diagAck = await startDiagStream(session, diagGlobalMs, diagTaskMs);
      console.log("[protocol-torture] DIAG_STREAM_START ack =", diagAck);

      // Ensure diagnostics task-table stream is configured so `diag.task.table.get` has data to return.
      try {
        const ackCfg = await session.sendDiagTaskStreamConfigSet(`cli-diag-task-cfg-${Date.now()}`, {
          diagMajor,
          diagMinor,
          taskPeriodMs: diagTaskStreamPeriodMs,
          maxRowsPerBatch: diagTaskStreamMaxRows,
          priorityMode: "sensor",
          resyncPeriodMs: diagTaskStreamResyncMs,
        });
        console.log("[protocol-torture] diag task stream cfg =", ackCfg);
        const ackResync = await session.sendDiagTaskStreamResyncNow(
          `cli-diag-task-resync-${Date.now()}`,
          diagMajor,
          diagMinor,
        );
        console.log("[protocol-torture] diag task stream resync =", ackResync);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[protocol-torture] diag task stream setup failed:", msg);
      }

      // Ensure BMI270 is in fusion/hybrid when testing fusion feed.
      const ensureFusionMode = await executeBitstreamCommand(session, {
        type: "sensor.bmi270.mode.set",
        payload: { requestId: `cli-bmi270-mode-prep-${Date.now()}`, mode: 2 },
      });
      console.log(
        "[protocol-torture] bmi270 mode prep =",
        ensureFusionMode.ok ? "ok" : ensureFusionMode.error,
      );

      const setLoad = await executeBitstreamCommand(session, {
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
      console.log("[protocol-torture] load cfg set =", setLoad.ok ? "ok" : setLoad.error);
      if (setLoad.ok) {
        expectedEnabled = true;
      } else if (setLoad.error) {
        countFailure(setLoad.error);
      }
      expectedFusionFeedMs = fusionFeedAms;
      expectedMagEnabled = true;
      expectedBaroEnabled = true;
      expectedMagMode = 0;
      expectedBaroMode = 0;

      // Ensure magnetometer + barometer are enabled at least once for streaming sanity.
      const setMag = await executeBitstreamCommand(session, {
        type: "sensor.cfg.set",
        payload: {
          requestId: `cli-mag-set-${magSourceId}-${Date.now()}`,
          options: {
            sourceId: magSourceId,
            enabled: true,
            publishMode: 0,
            samplingIntervalMs: loadSamplingMs,
            deltaX100: deltaAx100,
            minPublishIntervalMs: minPublishAms,
          },
        },
      });
      console.log("[protocol-torture] mag cfg set =", setMag.ok ? "ok" : setMag.error);
      if (!setMag.ok) {
        countFailure(setMag.error ?? "mag cfg set failed");
        throw new Error(setMag.error ?? "mag cfg set failed");
      }

      const setBaro = await executeBitstreamCommand(session, {
        type: "sensor.cfg.set",
        payload: {
          requestId: `cli-baro-set-${baroSourceId}-${Date.now()}`,
          options: {
            sourceId: baroSourceId,
            enabled: true,
            publishMode: 0,
            samplingIntervalMs: loadSamplingMs,
            deltaX100: deltaAx100,
            minPublishIntervalMs: minPublishAms,
          },
        },
      });
      console.log("[protocol-torture] baro cfg set =", setBaro.ok ? "ok" : setBaro.error);
      if (!setBaro.ok) {
        countFailure(setBaro.error ?? "baro cfg set failed");
        throw new Error(setBaro.error ?? "baro cfg set failed");
      }

      for (let w = 0; w < 3; w += 1) {
        try {
          const res = await executeBitstreamCommand(session, {
            type: "sensor.cfg.get",
            payload: { requestId: `cli-warmup-get-${sourceId}-${Date.now()}`, sourceId },
          });
          console.log("[protocol-torture] warmup get", "w=" + w, res.ok ? "ok" : res.error);
          if (!res.ok) {
            countFailure(res.error ?? "warmup get failed");
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log("[protocol-torture] warmup get", "w=" + w, "exception", msg);
          countFailure(msg);
        }
        await sleep(120);
      }
    };

    const recoverIfDisconnected = async (msg: string, where: string) => {
      if (!/not connected/i.test(msg)) return false;
      reconnectCount += 1;
      console.warn("[protocol-torture] reconnecting:", where, msg);
      try {
        await session.close();
      } catch {
        // ignore
      }
      await sleep(250);
      await setupSession(`reconnect(${where})`);
      return true;
    };

    const isSuperseded = (msg: string) =>
      allowSuperseded && /superseded by newer/i.test(msg);

    await setupSession("initial");

    for (let i = 0; i < loops; i += 1) {
      const t0 = Date.now();
      try {
        // Mix read/write patterns to stress queue + ACK correlation.
        if (i % 40 === 4) {
          const reinit = await executeBitstreamCommand(session, {
            type: "sensor.reinit",
            payload: { requestId: `cli-sensor-reinit-${Date.now()}` },
          });
          const dt = Date.now() - t0;
          if (!reinit.ok) {
            if (/timeout/i.test(reinit.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] sensor reinit error", "i=" + i, reinit.error);
          } else {
            latencies.push(dt);
          }
        }

        if (i % 40 === 6) {
          const table = await executeBitstreamCommand(session, {
            type: "diag.task.table.get",
            payload: { requestId: `cli-diag-task-table-get-${Date.now()}`, diagMajor, diagMinor },
          });
          const dt = Date.now() - t0;
          if (!table.ok) {
            if (/timeout/i.test(table.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] diag task table get error", "i=" + i, table.error);
          } else {
            latencies.push(dt);
          }
        }

        if (i % 40 === 7) {
          const newPriority = i % 80 === 7 ? diagTaskPrioA : diagTaskPrioB;
          const prio = await executeBitstreamCommand(session, {
            type: "diag.task.priority.set",
            payload: {
              requestId: `cli-diag-task-prio-set-${Date.now()}`,
              options: {
                diagMajor,
                diagMinor,
                taskId: diagTaskId,
                newPriority,
                requestId: i & 0xffff,
              },
            },
          });
          const dt = Date.now() - t0;
          if (!prio.ok) {
            if (/timeout/i.test(prio.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] diag task prio set error", "i=" + i, prio.error);
          } else {
            latencies.push(dt);
          }
        }

        // Magnetometer + Barometer control traffic (same sensor.cfg lane, different source ids).
        if (i % 10 === 2) {
          const toggle = i % 20 === 2 ? enabledA : enabledB;
          const publishMode =
            enablePublishModeStress ? (i % 30 === 2 ? 0 : i % 30 === 12 ? 1 : 2) : 0;
          const deltaX100 = enablePublishModeStress ? (i % 40 === 2 ? deltaAx100 : deltaBx100) : 0;
          const minPublishIntervalMs =
            enablePublishModeStress ? (i % 40 === 2 ? minPublishAms : minPublishBms) : 0;
          const setMag = await executeBitstreamCommand(session, {
            type: "sensor.cfg.set",
            payload: {
              requestId: `cli-mag-ctl-set-${magSourceId}-${Date.now()}`,
              options: {
                sourceId: magSourceId,
                enabled: toggle,
                publishMode,
                samplingIntervalMs: loadSamplingMs,
                deltaX100,
                minPublishIntervalMs,
              },
            },
          });
          const dt = Date.now() - t0;
          if (!setMag.ok) {
            if (/timeout/i.test(setMag.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] mag set error", "i=" + i, setMag.error);
          } else {
            latencies.push(dt);
            expectedMagEnabled = toggle;
            expectedMagMode = publishMode;
          }
        } else if (i % 10 === 3) {
          const getMag = await executeBitstreamCommand(session, {
            type: "sensor.cfg.get",
            payload: { requestId: `cli-mag-ctl-get-${magSourceId}-${Date.now()}`, sourceId: magSourceId },
          });
          const dt = Date.now() - t0;
          if (!getMag.ok || !getMag.data) {
            if (/timeout/i.test(getMag.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] mag get error", "i=" + i, getMag.error);
          } else {
            latencies.push(dt);
            if (expectedMagEnabled != null && getMag.data.enabled !== expectedMagEnabled) {
              if (strictVerify) {
                mismatchCount += 1;
                console.warn(
                  "[protocol-torture] mag mismatch",
                  "i=" + i,
                  "expected enabled=" + (expectedMagEnabled ? 1 : 0),
                  "actual enabled=" + (getMag.data.enabled ? 1 : 0),
                );
              }
            }
            if (expectedMagMode != null && getMag.data.publishMode !== expectedMagMode) {
              if (strictVerify) {
                mismatchCount += 1;
                console.warn(
                  "[protocol-torture] mag mismatch",
                  "i=" + i,
                  "expected mode=" + expectedMagMode,
                  "actual mode=" + getMag.data.publishMode,
                );
              }
            }
          }
        } else if (i % 10 === 5) {
          const toggle = i % 20 === 5 ? enabledA : enabledB;
          const publishMode =
            enablePublishModeStress ? (i % 30 === 5 ? 0 : i % 30 === 15 ? 1 : 2) : 0;
          const deltaX100 = enablePublishModeStress ? (i % 40 === 5 ? deltaAx100 : deltaBx100) : 0;
          const minPublishIntervalMs =
            enablePublishModeStress ? (i % 40 === 5 ? minPublishAms : minPublishBms) : 0;
          const setBaro = await executeBitstreamCommand(session, {
            type: "sensor.cfg.set",
            payload: {
              requestId: `cli-baro-ctl-set-${baroSourceId}-${Date.now()}`,
              options: {
                sourceId: baroSourceId,
                enabled: toggle,
                publishMode,
                samplingIntervalMs: loadSamplingMs,
                deltaX100,
                minPublishIntervalMs,
              },
            },
          });
          const dt = Date.now() - t0;
          if (!setBaro.ok) {
            if (/timeout/i.test(setBaro.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] baro set error", "i=" + i, setBaro.error);
          } else {
            latencies.push(dt);
            expectedBaroEnabled = toggle;
            expectedBaroMode = publishMode;
          }
        } else if (i % 10 === 6) {
          const getBaro = await executeBitstreamCommand(session, {
            type: "sensor.cfg.get",
            payload: { requestId: `cli-baro-ctl-get-${baroSourceId}-${Date.now()}`, sourceId: baroSourceId },
          });
          const dt = Date.now() - t0;
          if (!getBaro.ok || !getBaro.data) {
            if (/timeout/i.test(getBaro.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] baro get error", "i=" + i, getBaro.error);
          } else {
            latencies.push(dt);
            if (expectedBaroEnabled != null && getBaro.data.enabled !== expectedBaroEnabled) {
              if (strictVerify) {
                mismatchCount += 1;
                console.warn(
                  "[protocol-torture] baro mismatch",
                  "i=" + i,
                  "expected enabled=" + (expectedBaroEnabled ? 1 : 0),
                  "actual enabled=" + (getBaro.data.enabled ? 1 : 0),
                );
              }
            }
            if (expectedBaroMode != null && getBaro.data.publishMode !== expectedBaroMode) {
              if (strictVerify) {
                mismatchCount += 1;
                console.warn(
                  "[protocol-torture] baro mismatch",
                  "i=" + i,
                  "expected mode=" + expectedBaroMode,
                  "actual mode=" + getBaro.data.publishMode,
                );
              }
            }
          }
        }

        if (enableBmi270ModeToggle && i % 24 === 0) {
          const mode = i % 48 === 0 ? bmiModeA : bmiModeB;
          const setMode = await executeBitstreamCommand(session, {
            type: "sensor.bmi270.mode.set",
            payload: { requestId: `cli-bmi270-mode-set-${Date.now()}`, mode },
          });
          const dt = Date.now() - t0;
          if (!setMode.ok) {
            if (/timeout/i.test(setMode.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] bmi270 mode set error", "i=" + i, setMode.error);
          } else {
            latencies.push(dt);
          }
        } else if (enableBmi270ModeToggle && i % 24 === 1) {
          const getMode = await executeBitstreamCommand(session, {
            type: "sensor.bmi270.mode.get",
            payload: { requestId: `cli-bmi270-mode-get-${Date.now()}` },
          });
          const dt = Date.now() - t0;
          if (!getMode.ok) {
            if (/timeout/i.test(getMode.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] bmi270 mode get error", "i=" + i, getMode.error);
          } else {
            latencies.push(dt);
          }
        } else if (i % 24 === 2) {
          const intervalMs = i % 48 === 2 ? fusionFeedAms : fusionFeedBms;
          const setFeed = await executeBitstreamCommand(session, {
            type: "sensor.bmi270.fusion.feed.set",
            payload: { requestId: `cli-bmi270-feed-set-${Date.now()}`, intervalMs },
          });
          const dt = Date.now() - t0;
          if (!setFeed.ok) {
            if (/timeout/i.test(setFeed.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] bmi270 fusion feed set error", "i=" + i, setFeed.error);
          } else {
            latencies.push(dt);
            expectedFusionFeedMs = intervalMs;
          }
        } else if (i % 24 === 3) {
          const getFeed = await executeBitstreamCommand(session, {
            type: "sensor.bmi270.fusion.feed.get",
            payload: { requestId: `cli-bmi270-feed-get-${Date.now()}` },
          });
          const dt = Date.now() - t0;
          if (!getFeed.ok) {
            if (/timeout/i.test(getFeed.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] bmi270 fusion feed get error", "i=" + i, getFeed.error);
          } else {
            latencies.push(dt);
            if (
              expectedFusionFeedMs != null &&
              typeof getFeed.data?.appliedIntervalMs === "number" &&
              getFeed.data.appliedIntervalMs !== expectedFusionFeedMs
            ) {
              mismatchCount += 1;
              console.warn(
                "[protocol-torture] bmi270 fusion feed mismatch",
                "i=" + i,
                "expected=" + expectedFusionFeedMs,
                "actual=" + getFeed.data.appliedIntervalMs,
              );
            }
          }
        }
        if (i % 6 === 0) {
          const toggle = i % 12 === 0 ? enabledA : enabledB;
          const set = await executeBitstreamCommand(session, {
            type: "sensor.cfg.set",
            payload: {
              requestId: `cli-ctl-set-${sourceId}-${Date.now()}`,
              options: {
                sourceId,
                enabled: toggle,
                publishMode: 0,
                samplingIntervalMs: loadSamplingMs,
                deltaX100: 0,
                minPublishIntervalMs: 0,
              },
            },
          });
          const dt = Date.now() - t0;
          if (!set.ok) {
            if (/timeout/i.test(set.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] set error", "i=" + i, set.error);
          } else {
            latencies.push(dt);
            expectedEnabled = toggle;
          }
        } else {
          const get = await executeBitstreamCommand(session, {
            type: "sensor.cfg.get",
            payload: { requestId: `cli-ctl-get-${sourceId}-${Date.now()}`, sourceId },
          });
          const dt = Date.now() - t0;
          if (!get.ok || !get.data) {
            if (/timeout/i.test(get.error ?? "")) timeoutCount += 1;
            else errorCount += 1;
            console.warn("[protocol-torture] get error", "i=" + i, get.error);
          } else {
            latencies.push(dt);
            // Spot-check: after a toggle, allow a short verification window (eventual consistency).
            if (verifyWindowMs > 0 && expectedEnabled != null && i % 12 === 1) {
              const expected = expectedEnabled;
              if (get.data.enabled !== expected) {
                const deadline = Date.now() + verifyWindowMs;
                let ok = false;
                while (Date.now() < deadline) {
                  await sleep(verifyPollMs);
                  const probe = await executeBitstreamCommand(session, {
                    type: "sensor.cfg.get",
                    payload: { requestId: `cli-verify-get-${sourceId}-${Date.now()}`, sourceId },
                  });
                  if (probe.ok && probe.data && probe.data.enabled === expected) {
                    ok = true;
                    break;
                  }
                }
                if (!ok) {
                  mismatchCount += 1;
                  console.warn(
                    "[protocol-torture] mismatch",
                    "i=" + i,
                    "expected enabled=" + (expected ? 1 : 0),
                    "actual enabled=" + (get.data.enabled ? 1 : 0),
                    "verifyWindowMs=" + verifyWindowMs,
                  );
                }
              }
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (await recoverIfDisconnected(msg, `loop i=${i}`)) {
          continue;
        }
        if (isSuperseded(msg)) {
          // In multi-client runs, coalescing can intentionally cancel an older pending request.
          // Treat as a skipped sample, not a protocol failure.
          continue;
        }
        if (/timeout/i.test(msg)) timeoutCount += 1;
        else errorCount += 1;
        console.warn("[protocol-torture] exception", "i=" + i, msg);
      }

      if (i % 20 === 0) {
        const s = summarize(latencies, timeoutCount, errorCount, mismatchCount);
        console.log("[protocol-torture] progress i=", i, "summary=", s);
      }

      await sleep(periodMs);
    }

    try {
      const stop = await stopDiagStream(session);
      console.log("[protocol-torture] DIAG_STREAM_STOP ack =", stop);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[protocol-torture] DIAG_STREAM_STOP error:", msg);
    }
  } finally {
    try {
      await session.close();
    } catch {
      // ignore
    }
    const s = summarize(latencies, timeoutCount, errorCount, mismatchCount);
    console.log("[protocol-torture] summary =", { ...s, reconnect: reconnectCount });
    if (timeoutCount > 0 || errorCount > 0 || mismatchCount > 0) {
      process.exitCode = 1;
    }
  }
}

void main();

