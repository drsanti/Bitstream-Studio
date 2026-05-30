#!/usr/bin/env npx tsx
/**
 * BS2 UART hardware probe — runs AGENT_HANDOFF §9.2 checklist against real MCU.
 *
 * npm run bitstream2:uart-probe -- [options]
 * npm run bitstream2:uart-probe -- --help
 *
 * Full flag tables, examples, and pass criteria:
 *   src/bitstream2/dev/UART_TEST_COMMANDS.md
 */
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2MetricsPayload,
  type Bitstream2SensorSamplePayload,
} from "../bridge/protocol";
import { BS2_CMD } from "../domains/config/commands";
import { decodeBmi270ModeResBody, encodeBmi270ModeSetBody } from "../domains/bmi270/bmi270-control";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import { bytesToBase64, base64ToBytes } from "../util/base64";
import {
  SERIALPORT_TOPICS,
  type CloseRequest,
  type OpenRequest,
  type OpenResult,
} from "../../serialport-bridge/protocol";

const wsUrl = process.env.T3D_WS_CLIENT_URL ?? T3D_DEFAULT_WS_CLIENT_URL;

const SENSOR_NAMES: Record<number, string> = {
  0: "BMI270",
  1: "BMM350",
  2: "SHT40",
  3: "DPS368",
};

const ALL_SENSOR_IDS = [0, 1, 2, 3] as const;

type CliOpts = {
  path: string;
  baud: number;
  soakMs: number;
  skipOpen: boolean;
  skipSet: boolean;
  helloTimeoutMs: number;
  reqTimeoutMs: number;
};

function parseArgs(argv: string[]): CliOpts {
  const get = (flag: string): string | undefined => {
    const eq = argv.find((a) => a.startsWith(`${flag}=`));
    if (eq) return eq.slice(flag.length + 1);
    const i = argv.indexOf(flag);
    if (i >= 0 && argv[i + 1] && !argv[i + 1]!.startsWith("-")) return argv[i + 1];
    return undefined;
  };
  const has = (flag: string) => argv.includes(flag);
  if (has("--help") || has("-h")) {
    usage();
    process.exit(0);
  }
  return {
    path: get("--path") ?? process.env.BITSTREAM_UART_PATH ?? "COM3",
    baud: Number(get("--baud") ?? process.env.BITSTREAM_UART_BAUD ?? "921600"),
    soakMs: Number(get("--soak-ms") ?? "90000"),
    skipOpen: has("--skip-open"),
    skipSet: has("--skip-set"),
    helloTimeoutMs: Number(get("--hello-timeout-ms") ?? "90000"),
    reqTimeoutMs: Number(get("--req-timeout-ms") ?? "4000"),
  };
}

function usage(): void {
  console.log(`BS2 UART probe (real MCU, bridge required)

  npm run bitstream2:uart-probe -- [options]

Full documentation: src/bitstream2/dev/UART_TEST_COMMANDS.md

Options:
  --path COM3           Serial port (default COM3 or BITSTREAM_UART_PATH)
  --baud 921600         Baud rate (default 921600)
  --soak-ms 90000       Telemetry soak duration (default 90s; use 300000+ for 5–10 min)
  --skip-open           Do not publish serialport/open (COM already open)
  --skip-set            Skip SENSOR_CFG_SET rate test
  --hello-timeout-ms    Wait for bitstream2/hello (default 90000)
  --req-timeout-ms      PING / CFG RPC timeout (default 4000)
  --help, -h            Show this help
`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(maxMs: number, pred: () => boolean, stepMs = 25): Promise<boolean> {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (pred()) return true;
    await sleep(stepMs);
  }
  return false;
}

/** Bridge may have emitted HELLO before we subscribed; ask bridge to re-probe firmware. */
async function waitForHelloWithHandshake(
  client: T3DWebSocketClient,
  hasHello: () => boolean,
  timeoutMs: number,
): Promise<boolean> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (hasHello()) return true;
    await client.publish(
      SERIALPORT_TOPICS.RUNTIME_HANDSHAKE_RUN,
      { requestId: `probe-hs-${Date.now()}`, reason: "uart-probe" },
      0,
    );
    const remaining = end - Date.now();
    if (remaining <= 0) break;
    if (await waitUntil(Math.min(5000, remaining), hasHello)) return true;
  }
  return hasHello();
}

function logStep(n: number, title: string): void {
  console.log(`\n=== Step ${n}: ${title} ===`);
}

function logOk(msg: string): void {
  console.log(`  OK  ${msg}`);
}

function logWarn(msg: string): void {
  console.warn(`  WARN ${msg}`);
}

function logFail(msg: string): void {
  console.error(`  FAIL ${msg}`);
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  let failed = false;
  const markFail = (msg: string) => {
    logFail(msg);
    failed = true;
  };

  let hello: Bitstream2HelloPayload | null = null;
  const samples: Bitstream2SensorSamplePayload[] = [];
  let metrics: Bitstream2MetricsPayload | null = null;
  const resByRequestId = new Map<string, Bitstream2HostResPayload>();
  let openOk = opts.skipOpen;

  const wsConnectTimeoutMs = Math.max(120_000, opts.soakMs + 120_000);
  const client = new T3DWebSocketClient(
    {
      url: wsUrl,
      autoConnect: true,
      connectTimeout: wsConnectTimeoutMs,
      pingInterval: 10_000,
      maxReconnectAttempts: -1,
      clientIdentity: { role: "bitstream2-uart-probe", name: "run-uart-probe" },
    },
    {
      onError: (err) => {
        console.warn(`  WARN WS: ${err.message}`);
      },
      onMessage: (topic, payload) => {
        if (topic === BITSTREAM2_TOPICS.HELLO) hello = payload as Bitstream2HelloPayload;
        if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
          samples.push(payload as Bitstream2SensorSamplePayload);
        }
        if (topic === BITSTREAM2_TOPICS.METRICS) metrics = payload as Bitstream2MetricsPayload;
        if (topic === BITSTREAM2_TOPICS.RES) {
          const res = payload as Bitstream2HostResPayload;
          if (res.requestId) resByRequestId.set(res.requestId, res);
        }
        if (topic === SERIALPORT_TOPICS.OPEN_RESULT) {
          const r = payload as OpenResult;
          if (r.success) openOk = true;
        }
      },
    },
  );

  await client.connect();
  await client.subscribe(BITSTREAM2_TOPICS.HELLO, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.EVT_SENSOR, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.METRICS, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.RES, 0, "json");
  if (!opts.skipOpen) {
    await client.subscribe(SERIALPORT_TOPICS.OPEN_RESULT, 0, "json");
  }

  console.log(`WS ${wsUrl}`);
  console.log(`UART ${opts.path} @ ${opts.baud} (skipOpen=${opts.skipOpen})`);

  if (!opts.skipOpen) {
    const closeReq: CloseRequest = { requestId: `uart-probe-close-${Date.now()}` };
    await client.publish(SERIALPORT_TOPICS.CLOSE, closeReq, 0);
    await sleep(400);
    const openReq: OpenRequest = {
      requestId: `uart-probe-open-${Date.now()}`,
      path: opts.path,
      baudRate: opts.baud,
      leaseOwner: "run-uart-probe",
    };
    await client.publish(SERIALPORT_TOPICS.OPEN, openReq, 0);
    const opened = await waitUntil(8000, () => openOk);
    if (!opened) {
      markFail(`serialport/open failed for ${opts.path} (is port busy in UI?)`);
    } else {
      logOk(`COM open ${opts.path} @ ${opts.baud}`);
    }
  }

  logStep(0, "Wait for bitstream2/hello");
  const gotHello = await waitForHelloWithHandshake(client, () => hello != null, opts.helloTimeoutMs);
  if (!gotHello || !hello) {
    markFail(`no HELLO within ${opts.helloTimeoutMs}ms (BS2 wire / baud / firmware?)`);
    await client.disconnect();
    process.exit(1);
  }
  logOk(`HELLO v${hello.version} caps=0x${hello.caps.toString(16)} tag=${hello.fwTag ?? "?"}`);

  /* --- Step 1: telemetry soak --- */
  logStep(1, `Telemetry soak (${opts.soakMs} ms)`);
  const soakStart = Date.now();
  const countsAtStart: Record<number, number> = {};
  for (const id of ALL_SENSOR_IDS) {
    countsAtStart[id] = samples.filter((s) => s.sensorId === id).length;
  }
  const metricsAtStart = metrics ? { ...metrics } : null;
  await sleep(opts.soakMs);
  const soakEnd = Date.now();

  for (const id of ALL_SENSOR_IDS) {
    const n = samples.filter((s) => s.sensorId === id).length - (countsAtStart[id] ?? 0);
    const name = SENSOR_NAMES[id] ?? `id${id}`;
    if (n < 1) {
      markFail(`${name}: no EVT_SENSOR during soak`);
    } else {
      logOk(`${name}: ${n} samples in ${soakEnd - soakStart}ms`);
    }
  }

  /* --- Step 2: metrics --- */
  logStep(2, "bitstream2/metrics (CRC / framesOk)");
  if (!metrics) {
    markFail("no metrics payload yet");
  } else {
    const framesOkDelta =
      metricsAtStart != null ? metrics.framesOk - metricsAtStart.framesOk : metrics.framesOk;
    const crcDelta =
      metricsAtStart != null
        ? metrics.framesCrcFail - metricsAtStart.framesCrcFail
        : metrics.framesCrcFail;
    logOk(
      `framesOk +${framesOkDelta} (total ${metrics.framesOk}), crcFail +${crcDelta}, uartIn ${metrics.uartBytesIn}`,
    );
    if (crcDelta > 0) {
      markFail(`CRC failures increased by ${crcDelta} during soak`);
    }
    if (framesOkDelta < 4) {
      logWarn(`low frame count during soak (+${framesOkDelta})`);
    }
  }

  /* --- Step 3: PING --- */
  logStep(3, "PING");
  const pingReqId = `probe-ping-${Date.now()}`;
  await client.publish(
    BITSTREAM2_TOPICS.REQ,
    {
      requestId: pingReqId,
      reqId: 1,
      cmdId: BS2_CMD.PING,
      timeoutMs: opts.reqTimeoutMs,
    },
    0,
  );
  const pingOk = await waitUntil(opts.reqTimeoutMs + 500, () => resByRequestId.has(pingReqId));
  const pingRes = resByRequestId.get(pingReqId);
  if (!pingOk || !pingRes?.ok) {
    markFail(`PING: ${pingRes?.error ?? "no RES"}`);
  } else {
    logOk(`PING status=${pingRes.status ?? 0}`);
  }

  /* --- Step 4: SENSOR_CFG GET 0..3 --- */
  logStep(4, "SENSOR_CFG_GET sensors 0–3");
  const cfgBySensor = new Map<number, Bs2SensorConfig>();
  for (const id of ALL_SENSOR_IDS) {
    const reqId = `probe-cfg-get-${id}-${Date.now()}`;
    await client.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: reqId,
        reqId: 10 + id,
        cmdId: BS2_CMD.SENSOR_CFG_GET,
        bodyB64: bytesToBase64(encodeSensorCfgGetBody(id)),
        timeoutMs: opts.reqTimeoutMs,
      },
      0,
    );
    const got = await waitUntil(opts.reqTimeoutMs + 500, () => resByRequestId.has(reqId));
    const res = resByRequestId.get(reqId);
    if (!got || !res?.ok || !res.bodyB64) {
      markFail(`${SENSOR_NAMES[id]} GET: ${res?.error ?? "no RES body"}`);
      continue;
    }
    const cfg = decodeSensorCfgBody(base64ToBytes(res.bodyB64));
    if (!cfg) {
      markFail(`${SENSOR_NAMES[id]} GET: decode failed (${res.bodyB64.length} b64 chars)`);
      continue;
    }
    cfgBySensor.set(id, cfg);
    logOk(
      `${SENSOR_NAMES[id]} enabled=${cfg.enabled} mask=0x${cfg.mask.toString(16)} samp=${cfg.samplingIntervalMs}ms pub=${cfg.publishIntervalMs || cfg.samplingIntervalMs}ms`,
    );
  }

  /* --- Step 5: SENSOR_CFG SET (SHT40 publish interval) --- */
  if (!opts.skipSet) {
    logStep(5, "SENSOR_CFG_SET SHT40 publish interval");
    const sht = cfgBySensor.get(2);
    if (!sht) {
      markFail("SHT40 cfg missing from GET — skip SET");
    } else {
      const beforeCount = samples.filter((s) => s.sensorId === 2).length;
      const targetPubMs =
        sht.publishIntervalMs > 0 && sht.publishIntervalMs !== 2500 ? 2500 : 3000;
      const next = encodeSensorCfgBody({
        ...sht,
        publishIntervalMs: targetPubMs,
      });
      const setReqId = `probe-cfg-set-sht40-${Date.now()}`;
      await client.publish(
        BITSTREAM2_TOPICS.REQ,
        {
          requestId: setReqId,
          reqId: 42,
          cmdId: BS2_CMD.SENSOR_CFG_SET,
          bodyB64: bytesToBase64(next),
          timeoutMs: opts.reqTimeoutMs,
        },
        0,
      );
      const setGot = await waitUntil(opts.reqTimeoutMs + 500, () => resByRequestId.has(setReqId));
      const setRes = resByRequestId.get(setReqId);
      if (!setGot || !setRes?.ok) {
        markFail(`SHT40 SET: ${setRes?.error ?? "no RES"}`);
      } else {
        logOk(`SHT40 SET publishIntervalMs→${targetPubMs}`);
        await sleep(Math.max(4000, targetPubMs * 2));
        const afterCount = samples.filter((s) => s.sensorId === 2).length;
        const delta = afterCount - beforeCount;
        if (delta < 1) {
          logWarn(`SHT40: expected more samples after SET (+${delta})`);
        } else {
          logOk(`SHT40: +${delta} samples after SET`);
        }
      }
    }
  } else {
    console.log("\n=== Step 5: skipped (--skip-set) ===");
  }

  /* --- Step 6: BMI270 stream mode (leave RAW so rate tests are not hybrid-gated) --- */
  logStep(6, "BMI270_MODE_SET raw (periodic EVT friendly)");
  const modeReqId = `probe-bmi270-mode-${Date.now()}`;
  await client.publish(
    BITSTREAM2_TOPICS.REQ,
    {
      requestId: modeReqId,
      cmdId: BS2_CMD.BMI270_MODE_SET,
      bodyB64: bytesToBase64(encodeBmi270ModeSetBody(0)),
      timeoutMs: opts.reqTimeoutMs,
    },
    0,
  );
  const modeOk = await waitUntil(opts.reqTimeoutMs + 500, () => resByRequestId.has(modeReqId));
  const modeRes = resByRequestId.get(modeReqId);
  if (!modeOk || !modeRes?.ok || modeRes.status !== 0) {
    markFail(`BMI270_MODE_SET: ${modeRes?.error ?? "no RES"} status=${modeRes?.status ?? "?"}`);
  } else {
    const applied = decodeBmi270ModeResBody(
      modeRes.bodyB64 ? base64ToBytes(modeRes.bodyB64) : new Uint8Array(0),
    );
    logOk(`BMI270 mode raw (applied=${applied ?? "?"})`);
  }

  console.log("\n=== Summary ===");
  console.log(`  samples total: ${samples.length}`);
  console.log(`  hello: ${hello?.fwTag ?? "ok"}`);
  if (failed) {
    console.error("\nPROBE FAILED — see FAIL lines above.");
    process.exit(1);
  }
  console.log("\nPROBE PASSED — optional: golden capture, 5–10 min UI soak.");
  try {
    await client.disconnect();
  } catch {
    /* WS teardown may race reconnect timers; checklist already passed. */
  }
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
