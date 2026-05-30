#!/usr/bin/env npx tsx
/**
 * Run firmware simulator scenarios (offline in-process or via WS broker).
 *
 * Offline (no bridge):
 *   npx tsx src/bitstream2/dev/run-sim-scenario.ts --offline boot
 *
 * WebSocket (bridge with BITSTREAM2_DEV_LOOPBACK=1):
 *   npx tsx src/bitstream2/dev/run-sim-scenario.ts --ws full_board
 */
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import { BsFirmwareSimulator } from "../device/firmware-simulator";
import { BsUartDecoder } from "../runtime/uart-decode";
import { BsSession } from "../runtime/session";
import { BS2_SIM_BOARD_PROFILE } from "../device/board-profile";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2SensorSamplePayload,
} from "../bridge/protocol";
import { BS2_CMD } from "../domains/config/commands";
import { encodeSensorCfgGetBody } from "../domains/config/sensor-config";
import { bytesToBase64 } from "../util/base64";
import {
  BS2_SIM_SCENARIOS,
  getScenario,
  listScenarioIds,
  type SimScenarioStep,
} from "./scenarios";
import { wireBytesHelloB64 } from "./wire-frames";

const wsUrl = process.env.T3D_WS_CLIENT_URL ?? T3D_DEFAULT_WS_CLIENT_URL;

function usage(): void {
  console.log(`Usage:
  npx tsx src/bitstream2/dev/run-sim-scenario.ts --offline <scenarioId>
  npx tsx src/bitstream2/dev/run-sim-scenario.ts --ws <scenarioId>

Scenarios: ${listScenarioIds().join(", ")}
`);
}

async function runOffline(scenarioId: string): Promise<void> {
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  const decoder = new BsUartDecoder();
  const rx: Uint8Array[] = [];
  const sim = new BsFirmwareSimulator((b) => rx.push(b), {
    hello: { ...BS2_SIM_BOARD_PROFILE.hello },
    defaultSensorConfigs: BS2_SIM_BOARD_PROFILE.defaultSensorConfigs.map((c) => ({ ...c })),
  });
  const session = new BsSession({
    write: async (bytes) => {
      sim.rxFromHost(bytes);
      drain();
    },
  });

  let hello: Bitstream2HelloPayload | null = null;
  const samples: Bitstream2SensorSamplePayload[] = [];
  let lastRes: Bitstream2HostResPayload | null = null;

  const drain = () => {
    while (rx.length > 0) {
      const chunk = rx.shift()!;
      for (const ev of decoder.feed(chunk)) {
        if (ev.type === "hello") hello = ev.payload;
        if (ev.type === "sensor") samples.push(ev.payload);
        if (ev.type === "res_frame") session.handleFrame(ev.frame);
      }
    }
  };

  sim.onBoot();
  drain();

  const t0 = Date.now();
  for (const step of scenario.steps) {
    await runStepOffline(step, {
      sim,
      session,
      drain,
      t0,
      getHello: () => hello,
      getSamples: () => samples,
      setLastRes: (r) => {
        lastRes = r;
      },
    });
  }

  console.log(`OK scenario "${scenarioId}" (${samples.length} samples total)`);
  if (lastRes) console.log("last RES", lastRes);
  sim.dispose();
}

async function runStepOffline(
  step: SimScenarioStep,
  ctx: {
    sim: BsFirmwareSimulator;
    session: BsSession;
    drain: () => void;
    t0: number;
    getHello: () => Bitstream2HelloPayload | null;
    getSamples: () => Bitstream2SensorSamplePayload[];
    setLastRes: (r: Bitstream2HostResPayload) => void;
  },
): Promise<void> {
  if (step.kind === "wait") {
    const end = Date.now() + step.ms;
    while (Date.now() < end) {
      await sleep(20);
      ctx.drain();
    }
    return;
  }
  if (step.kind === "ping") {
    const res = await ctx.session.sendReq({
      requestId: "scenario-ping",
      cmdId: BS2_CMD.PING,
      timeoutMs: 500,
    });
    ctx.drain();
    ctx.setLastRes({
      requestId: "scenario-ping",
      ok: res.status === 0,
      status: res.status,
      atMs: Date.now(),
    });
    return;
  }
  if (step.kind === "cfgGet") {
    await ctx.session.sendReq({
      requestId: `scenario-cfg-${step.sensorId}`,
      cmdId: BS2_CMD.SENSOR_CFG_GET,
      body: encodeSensorCfgGetBody(step.sensorId),
      timeoutMs: 500,
    });
    ctx.drain();
    return;
  }
  if (step.kind === "expectHello") {
    await waitUntil(step.withinMs, () => {
      ctx.drain();
      return ctx.getHello() != null;
    });
    if (!ctx.getHello()) throw new Error("expectHello: no HELLO");
    return;
  }
  if (step.kind === "expectSamples") {
    const start = countSamples(ctx.getSamples(), step.sensorId);
    await waitUntil(step.withinMs, () => {
      ctx.drain();
      return countSamples(ctx.getSamples(), step.sensorId) - start >= step.minCount;
    });
    const got = countSamples(ctx.getSamples(), step.sensorId) - start;
    if (got < step.minCount) {
      throw new Error(`expectSamples: wanted ${step.minCount}, got ${got} for sensor ${step.sensorId ?? "any"}`);
    }
    return;
  }
}

function countSamples(samples: Bitstream2SensorSamplePayload[], sensorId?: number): number {
  if (sensorId == null) return samples.length;
  return samples.filter((s) => s.sensorId === sensorId).length;
}

async function runWs(scenarioId: string): Promise<void> {
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  let hello: Bitstream2HelloPayload | null = null;
  const samples: Bitstream2SensorSamplePayload[] = [];
  let lastRes: Bitstream2HostResPayload | null = null;

  const client = new T3DWebSocketClient(
    {
      url: wsUrl,
      autoConnect: true,
      clientIdentity: { role: "bitstream2-scenario", name: "run-sim-scenario" },
    },
    {
      onMessage: (topic, payload) => {
        if (topic === BITSTREAM2_TOPICS.HELLO) hello = payload as Bitstream2HelloPayload;
        if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) samples.push(payload as Bitstream2SensorSamplePayload);
        if (topic === BITSTREAM2_TOPICS.RES) lastRes = payload as Bitstream2HostResPayload;
      },
    },
  );

  await client.connect();
  await client.subscribe(BITSTREAM2_TOPICS.HELLO, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.EVT_SENSOR, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.RES, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.DEV_STATUS, 0, "json");

  // Bridge emits HELLO on connect; late subscribers miss it. Prime HELLO + resume streams.
  await client.publish(BITSTREAM2_TOPICS.DEV_SIM_CONTROL, { mode: "run" }, 0);
  await client.publish(
    BITSTREAM2_TOPICS.DEV_INJECT_RX,
    { requestId: `scenario-prime-${Date.now()}`, dataB64: wireBytesHelloB64() },
    0,
  );
  await sleep(80);

  const t0 = Date.now();
  for (const step of scenario.steps) {
    if (step.kind === "wait") {
      await sleep(step.ms);
      continue;
    }
    if (step.kind === "ping") {
      await client.publish(
        BITSTREAM2_TOPICS.REQ,
        { requestId: `ws-ping-${Date.now()}`, reqId: 0, cmdId: BS2_CMD.PING, timeoutMs: 2000 },
        0,
      );
      await sleep(100);
      continue;
    }
    if (step.kind === "cfgGet") {
      await client.publish(
        BITSTREAM2_TOPICS.REQ,
        {
          requestId: `ws-cfg-${Date.now()}`,
          reqId: 0,
          cmdId: BS2_CMD.SENSOR_CFG_GET,
          bodyB64: bytesToBase64(encodeSensorCfgGetBody(step.sensorId)),
          timeoutMs: 2000,
        },
        0,
      );
      await sleep(100);
      continue;
    }
    if (step.kind === "expectHello") {
      await waitUntil(step.withinMs, () => hello != null);
      if (!hello) throw new Error("expectHello: no HELLO (is loopback on?)");
      continue;
    }
    if (step.kind === "expectSamples") {
      const countAtStart = samples.filter(
        (s) => (step.sensorId == null ? true : s.sensorId === step.sensorId),
      ).length;
      await waitUntil(step.withinMs, () => {
        const n = samples.filter(
          (s) => (step.sensorId == null ? true : s.sensorId === step.sensorId),
        ).length;
        return n - countAtStart >= step.minCount;
      });
      continue;
    }
  }

  console.log(`OK scenario "${scenarioId}" (ws, ${samples.length} samples, ${Date.now() - t0} ms)`);
  if (lastRes) console.log("last RES", lastRes);
  await client.disconnect();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(maxMs: number, pred: () => boolean): Promise<void> {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (pred()) return;
    await sleep(20);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const offline = argv.includes("--offline");
  const ws = argv.includes("--ws");
  const id = argv.find((a) => !a.startsWith("-"));

  if (!id || argv.includes("--help") || argv.includes("-h") || (!offline && !ws)) {
    usage();
    return;
  }

  if (!getScenario(id)) {
    console.error(`Unknown scenario: ${id}. Available: ${listScenarioIds().join(", ")}`);
    process.exit(1);
  }

  if (offline) await runOffline(id);
  else await runWs(id);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
