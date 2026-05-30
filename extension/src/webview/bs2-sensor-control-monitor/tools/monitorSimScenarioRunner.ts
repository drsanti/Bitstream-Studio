import { BITSTREAM2_TOPICS, type Bitstream2HelloPayload, type Bitstream2SensorSamplePayload } from "../../../bitstream2/bridge/protocol";
import { BS2_CMD } from "../../../bitstream2/domains/config/commands";
import { encodeSensorCfgGetBody } from "../../../bitstream2/domains/config/sensor-config";
import { bytesToBase64 } from "../../../bitstream2/util/base64";
import { getScenario, type SimScenarioStep } from "../../../bitstream2/dev/scenarios";
import { wireBytesHelloB64 } from "../../../bitstream2/dev/wire-frames";
import { useWsClientStore } from "../../ws-client-store";

const LISTENER_ID = "bs2-monitor-sim-scenario";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(maxMs: number, pred: () => boolean): Promise<boolean> {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (pred()) {
      return true;
    }
    await sleep(20);
  }
  return false;
}

function countSamples(samples: Bitstream2SensorSamplePayload[], sensorId?: number): number {
  if (sensorId == null) {
    return samples.length;
  }
  return samples.filter((s) => s.sensorId === sensorId).length;
}

export type SimScenarioRunOptions = {
  scenarioId: string;
  signal?: AbortSignal;
  onLog: (text: string, tone: "info" | "cmd" | "pass" | "fail" | "warn") => void;
  onStep: (index: number, total: number, label: string, state: "running" | "ok" | "fail") => void;
};

/**
 * Run a BS2 sim scenario over the webview WebSocket (bridge with loopback).
 * Mirrors run-sim-scenario.ts --ws path.
 */
export async function runMonitorSimScenarioWs(opts: SimScenarioRunOptions): Promise<boolean> {
  const scenario = getScenario(opts.scenarioId);
  if (scenario == null) {
    opts.onLog(`Unknown scenario: ${opts.scenarioId}`, "fail");
    return false;
  }

  const store = useWsClientStore.getState();
  if (!store.isConnected) {
    await store.connect();
  }

  let hello: Bitstream2HelloPayload | null = null;
  const samples: Bitstream2SensorSamplePayload[] = [];

  store.removeMessageListener(LISTENER_ID);
  store.addMessageListener(LISTENER_ID, (topic, payload) => {
    if (topic === BITSTREAM2_TOPICS.HELLO) {
      hello = payload as Bitstream2HelloPayload;
    }
    if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
      samples.push(payload as Bitstream2SensorSamplePayload);
    }
  });

  for (const topic of [
    BITSTREAM2_TOPICS.HELLO,
    BITSTREAM2_TOPICS.EVT_SENSOR,
    BITSTREAM2_TOPICS.RES,
    BITSTREAM2_TOPICS.DEV_STATUS,
  ]) {
    await store.subscribeTopic(topic, 0, "json");
  }

  let failed = false;
  const steps = scenario.steps;
  const total = steps.length;

  const runOne = async (step: SimScenarioStep, i: number): Promise<void> => {
    if (opts.signal?.aborted) {
      throw new Error("aborted");
    }
    const label = stepLabel(step);
    opts.onStep(i, total, label, "running");
    opts.onLog(`Step ${i + 1}/${total}: ${label}`, "cmd");

    if (step.kind === "wait") {
      await sleep(step.ms);
      opts.onStep(i, total, label, "ok");
      return;
    }
    if (step.kind === "ping") {
      await store.publish(
        BITSTREAM2_TOPICS.REQ,
        { requestId: `ws-ping-${Date.now()}`, reqId: 1, cmdId: BS2_CMD.PING, timeoutMs: 2000 },
        0,
      );
      await sleep(100);
      opts.onStep(i, total, label, "ok");
      return;
    }
    if (step.kind === "cfgGet") {
      await store.publish(
        BITSTREAM2_TOPICS.REQ,
        {
          requestId: `ws-cfg-${Date.now()}`,
          reqId: 40 + step.sensorId,
          cmdId: BS2_CMD.SENSOR_CFG_GET,
          bodyB64: bytesToBase64(encodeSensorCfgGetBody(step.sensorId)),
          timeoutMs: 2000,
        },
        0,
      );
      await sleep(100);
      opts.onStep(i, total, label, "ok");
      return;
    }
    if (step.kind === "expectHello") {
      const ok = await waitUntil(step.withinMs, () => hello != null);
      if (!ok || hello == null) {
        opts.onLog("expectHello: no HELLO (enable loopback?)", "fail");
        failed = true;
        opts.onStep(i, total, label, "fail");
      } else {
        opts.onLog(`HELLO tag=${hello.fwTag ?? "?"}`, "pass");
        opts.onStep(i, total, label, "ok");
      }
      return;
    }
    if (step.kind === "expectSamples") {
      const countAtStart = countSamples(samples, step.sensorId);
      const ok = await waitUntil(step.withinMs, () => {
        const n = countSamples(samples, step.sensorId) - countAtStart;
        return n >= step.minCount;
      });
      const got = countSamples(samples, step.sensorId) - countAtStart;
      if (!ok) {
        opts.onLog(`expectSamples: wanted ${step.minCount}, got ${got}`, "fail");
        failed = true;
        opts.onStep(i, total, label, "fail");
      } else {
        opts.onLog(`samples +${got} (sensor ${step.sensorId ?? "any"})`, "pass");
        opts.onStep(i, total, label, "ok");
      }
    }
  };

  try {
    opts.onLog(`Scenario "${opts.scenarioId}" — ${scenario.description}`, "info");
    await store.publish(BITSTREAM2_TOPICS.DEV_SIM_CONTROL, { mode: "run" }, 0);
    await store.publish(
      BITSTREAM2_TOPICS.DEV_INJECT_RX,
      { requestId: `scenario-prime-${Date.now()}`, dataB64: wireBytesHelloB64() },
      0,
    );
    await sleep(80);

    for (let i = 0; i < steps.length; i++) {
      if (opts.signal?.aborted) {
        opts.onLog("Stopped by user", "warn");
        break;
      }
      await runOne(steps[i]!, i);
      if (failed) {
        break;
      }
    }

    if (!opts.signal?.aborted && !failed) {
      opts.onLog(`OK scenario "${opts.scenarioId}" (${samples.length} samples)`, "pass");
    }
    return !failed && !opts.signal?.aborted;
  } catch (e) {
    opts.onLog(e instanceof Error ? e.message : String(e), "fail");
    return false;
  } finally {
    store.removeMessageListener(LISTENER_ID);
  }
}

function stepLabel(step: SimScenarioStep): string {
  if (step.kind === "wait") {
    return `wait ${step.ms}ms`;
  }
  if (step.kind === "ping") {
    return "PING";
  }
  if (step.kind === "cfgGet") {
    return `SENSOR_CFG_GET ${step.sensorId}`;
  }
  if (step.kind === "expectHello") {
    return `expect HELLO (${step.withinMs}ms)`;
  }
  return `expectSamples min=${step.minCount} sid=${step.sensorId ?? "any"} (${step.withinMs}ms)`;
}
