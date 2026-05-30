/**
 * UART test harness for browser monitor — uses shared WebSocket store (no second client).
 */
import {
  BITSTREAM2_TOPICS,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2MetricsPayload,
  type Bitstream2SensorSamplePayload,
} from "../../../bitstream2/bridge/protocol";
import { BS2_CMD } from "../../../bitstream2/domains/config/commands";
import {
  decodeBmi270ModeResBody,
  encodeBmi270FusionFeedSetBody,
  encodeBmi270ModeSetBody,
  bmi270StreamModeCodeToUi,
  bmi270StreamModeUiToCode,
} from "../../../bitstream2/domains/bmi270/bmi270-control";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  type Bs2SensorConfig,
} from "../../../bitstream2/domains/config/sensor-config";
import { intervalMsFromHz } from "../../../bitstream2/domains/config/sensor-rate-presets";
import { bytesToBase64, base64ToBytes } from "../../../bitstream2/util/base64";
import { SERIALPORT_TOPICS } from "../../../serialport-bridge/protocol";
import { BS2_SENSOR_ID } from "../../../bitstream2/domains/sensors/sensor-ids";
import { diffSensorCfg } from "../../../bitstream2/dev/uart-sensor-cfg-assert";
import type { MatrixTestCase, MatrixSensorCfgOverride } from "../../../bitstream2/dev/uart-sensor-test-matrix";
import {
  UART_ALL_SENSOR_IDS,
  UART_BMI270_SENSOR_ID,
  UART_SENSOR_NAMES,
} from "../../../bitstream2/dev/uart-sensor-assert";
import type { Bs2PublishMode } from "../../../bitstream2/domains/config/sensor-config";
import { useWsClientStore } from "../../ws-client-store";

const LISTENER_ID = "bs2-browser-uart-harness";
const FUSION_FEED_MIN_MS = 10;
const FUSION_FEED_MAX_MS = 100;

export type BrowserHarnessOptions = {
  settleMs?: number;
  reqTimeoutMs?: number;
  helloTimeoutMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(maxMs: number, pred: () => boolean): Promise<boolean> {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (pred()) {
      return true;
    }
    await sleep(25);
  }
  return pred();
}

function clampFusionFeedIntervalMs(requestedMs: number): number {
  if (requestedMs < FUSION_FEED_MIN_MS) {
    return FUSION_FEED_MIN_MS;
  }
  if (requestedMs > FUSION_FEED_MAX_MS) {
    return FUSION_FEED_MAX_MS;
  }
  return requestedMs;
}

function defaultMaskForSensor(sensorId: number): number {
  if (sensorId === BS2_SENSOR_ID.BMI270) {
    return 0x1f;
  }
  return 0x03;
}

function resolveSensorCfg(
  sensorId: number,
  enabled: boolean,
  defaults: MatrixSensorCfgOverride | undefined,
  perSensor: Partial<Record<number, MatrixSensorCfgOverride>> | undefined,
): Bs2SensorConfig {
  const o = { ...defaults, ...perSensor?.[sensorId] };
  const hz = o.hz ?? 50;
  const samplingIntervalMs = enabled ? intervalMsFromHz(hz) : 1000;
  const publishIntervalMs =
    enabled && o.publishHz != null && o.publishHz > 0 ? intervalMsFromHz(o.publishHz) : 0;
  return {
    sensorId,
    enabled,
    publishMode: (o.publishMode ?? 0) as import("../../../bitstream2/domains/config/sensor-config").Bs2PublishMode,
    mask: o.mask ?? defaultMaskForSensor(sensorId),
    samplingIntervalMs,
    deltaX100: o.deltaX100 ?? (o.publishMode === 1 || o.publishMode === 2 ? 1 : 0),
    minPublishIntervalMs: o.minPublishIntervalMs ?? 0,
    publishIntervalMs: enabled ? publishIntervalMs : 0,
  };
}

/** Harness backed by webview WS store; COM must already be open in sidebar. */
export class BrowserUartHarness {
  private readonly settleMs: number;
  private readonly reqTimeoutMs: number;
  private readonly helloTimeoutMs: number;

  private hello: Bitstream2HelloPayload | null = null;
  private metrics: Bitstream2MetricsPayload | null = null;
  private samples: Bitstream2SensorSamplePayload[] = [];
  private resByRequestId = new Map<string, Bitstream2HostResPayload>();
  private prepared = false;

  constructor(opts: BrowserHarnessOptions = {}) {
    this.settleMs = opts.settleMs ?? 600;
    this.reqTimeoutMs = opts.reqTimeoutMs ?? 4000;
    this.helloTimeoutMs = opts.helloTimeoutMs ?? 90_000;
  }

  getHello(): Bitstream2HelloPayload | null {
    return this.hello;
  }

  getMetrics(): Bitstream2MetricsPayload | null {
    return this.metrics;
  }

  getSamples(): readonly Bitstream2SensorSamplePayload[] {
    return this.samples;
  }

  clearSamples(): void {
    this.samples = [];
  }

  /** Subscribe WS topics and wait for HELLO when COM is open. */
  async prepare(existingHello: Bitstream2HelloPayload | null, uartOpen: boolean): Promise<void> {
    if (!uartOpen) {
      throw new Error("Open COM in sidebar before running UART tools");
    }

    const store = useWsClientStore.getState();
    if (!store.isConnected) {
      await store.connect();
    }

    this.hello = existingHello;
    store.removeMessageListener(LISTENER_ID);
    store.addMessageListener(LISTENER_ID, (topic, payload) => {
      if (topic === BITSTREAM2_TOPICS.HELLO) {
        this.hello = payload as Bitstream2HelloPayload;
      }
      if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
        this.samples.push(payload as Bitstream2SensorSamplePayload);
      }
      if (topic === BITSTREAM2_TOPICS.METRICS) {
        this.metrics = payload as Bitstream2MetricsPayload;
      }
      if (topic === BITSTREAM2_TOPICS.RES) {
        const res = payload as Bitstream2HostResPayload;
        if (res.requestId) {
          this.resByRequestId.set(res.requestId, res);
        }
      }
    });

    for (const topic of [
      BITSTREAM2_TOPICS.HELLO,
      BITSTREAM2_TOPICS.EVT_SENSOR,
      BITSTREAM2_TOPICS.RES,
      BITSTREAM2_TOPICS.METRICS,
    ]) {
      await store.subscribeTopic(topic, 0, "json");
    }

    if (this.hello == null) {
      await store.publish(
        SERIALPORT_TOPICS.RUNTIME_HANDSHAKE_RUN,
        { requestId: `monitor-hs-${Date.now()}`, reason: "bs2-monitor-tool" },
        0,
      );
      const ok = await waitUntil(this.helloTimeoutMs, () => this.hello != null);
      if (!ok || this.hello == null) {
        throw new Error(`no HELLO within ${this.helloTimeoutMs}ms`);
      }
    }

    this.prepared = true;
  }

  cleanup(): void {
    useWsClientStore.getState().removeMessageListener(LISTENER_ID);
    this.prepared = false;
  }

  async settleAfterConfig(): Promise<void> {
    if (this.settleMs > 0) {
      await sleep(this.settleMs);
    }
    this.clearSamples();
  }

  async soak(ms: number): Promise<number> {
    const t0 = Date.now();
    await sleep(ms);
    return Date.now() - t0;
  }

  async applyTestCase(testCase: MatrixTestCase): Promise<Map<number, Bs2SensorConfig>> {
    this.assertReady();
    const store = useWsClientStore.getState();
    const applied = new Map<number, Bs2SensorConfig>();

    for (const sensorId of UART_ALL_SENSOR_IDS) {
      const enabled = testCase.activeSensorIds.includes(sensorId);
      const cfg = resolveSensorCfg(sensorId, enabled, testCase.defaults, testCase.perSensor);
      applied.set(sensorId, cfg);

      const reqId = `matrix-set-${testCase.id}-${sensorId}-${Date.now()}`;
      await store.publish(
        BITSTREAM2_TOPICS.REQ,
        {
          requestId: reqId,
          reqId: 20 + sensorId,
          cmdId: BS2_CMD.SENSOR_CFG_SET,
          bodyB64: bytesToBase64(encodeSensorCfgBody(cfg)),
          timeoutMs: this.reqTimeoutMs,
        },
        0,
      );
      const got = await waitUntil(this.reqTimeoutMs + 500, () => this.resByRequestId.has(reqId));
      const res = this.resByRequestId.get(reqId);
      if (!got || !res?.ok) {
        throw new Error(`SET ${UART_SENSOR_NAMES[sensorId]}: ${res?.error ?? "no RES"}`);
      }
      const ack = res.bodyB64 != null ? decodeSensorCfgBody(base64ToBytes(res.bodyB64)) : null;
      if (ack == null) {
        throw new Error(`SET ${UART_SENSOR_NAMES[sensorId]}: bad ack body`);
      }
      applied.set(sensorId, ack);
    }

    const bmi270Mode = bmi270StreamModeUiToCode(testCase.bmi270Mode ?? "raw");
    if (testCase.activeSensorIds.includes(UART_BMI270_SENSOR_ID)) {
      const modeTimeoutMs =
        bmi270Mode === bmi270StreamModeUiToCode("raw") ? this.reqTimeoutMs : 15_000;
      const modeReqId = `matrix-bmi270-mode-${testCase.id}-${Date.now()}`;
      await store.publish(
        BITSTREAM2_TOPICS.REQ,
        {
          requestId: modeReqId,
          reqId: 90,
          cmdId: BS2_CMD.BMI270_MODE_SET,
          bodyB64: bytesToBase64(encodeBmi270ModeSetBody(bmi270Mode)),
          timeoutMs: modeTimeoutMs,
        },
        0,
      );
      const modeGot = await waitUntil(modeTimeoutMs + 500, () => this.resByRequestId.has(modeReqId));
      const modeRes = this.resByRequestId.get(modeReqId);
      if (!modeGot || !modeRes?.ok) {
        throw new Error(
          `BMI270_MODE_SET ${bmi270StreamModeCodeToUi(bmi270Mode)}: ${modeRes?.error ?? "no RES"}`,
        );
      }

      if (bmi270Mode !== bmi270StreamModeUiToCode("raw")) {
        const feedHz = testCase.fusionFeedHz ?? (testCase.defaults?.hz ?? 50) * 2;
        const fusionFeedIntervalMs = clampFusionFeedIntervalMs(intervalMsFromHz(feedHz));
        const feedReqId = `matrix-bmi270-feed-${testCase.id}-${Date.now()}`;
        await store.publish(
          BITSTREAM2_TOPICS.REQ,
          {
            requestId: feedReqId,
            reqId: 91,
            cmdId: BS2_CMD.BMI270_FUSION_FEED_SET,
            bodyB64: bytesToBase64(encodeBmi270FusionFeedSetBody(fusionFeedIntervalMs)),
            timeoutMs: modeTimeoutMs,
          },
          0,
        );
        const feedGot = await waitUntil(modeTimeoutMs + 500, () => this.resByRequestId.has(feedReqId));
        const feedRes = this.resByRequestId.get(feedReqId);
        if (!feedGot || !feedRes?.ok) {
          throw new Error(`BMI270_FUSION_FEED_SET: ${feedRes?.error ?? "no RES"}`);
        }
      }
    }

    return applied;
  }

  async getSensorCfg(sensorId: number): Promise<Bs2SensorConfig> {
    this.assertReady();
    const store = useWsClientStore.getState();
    const reqId = `harness-get-${sensorId}-${Date.now()}`;
    await store.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: reqId,
        reqId: 40 + sensorId,
        cmdId: BS2_CMD.SENSOR_CFG_GET,
        bodyB64: bytesToBase64(encodeSensorCfgGetBody(sensorId)),
        timeoutMs: this.reqTimeoutMs,
      },
      0,
    );
    const got = await waitUntil(this.reqTimeoutMs + 500, () => this.resByRequestId.has(reqId));
    const res = this.resByRequestId.get(reqId);
    if (!got || !res?.ok) {
      throw new Error(`GET ${UART_SENSOR_NAMES[sensorId]}: ${res?.error ?? "no RES"}`);
    }
    const cfg = res.bodyB64 != null ? decodeSensorCfgBody(base64ToBytes(res.bodyB64)) : null;
    if (cfg == null) {
      throw new Error(`GET ${UART_SENSOR_NAMES[sensorId]}: bad body`);
    }
    return cfg;
  }

  async setSensorCfg(cfg: Bs2SensorConfig): Promise<Bs2SensorConfig> {
    this.assertReady();
    const store = useWsClientStore.getState();
    const sensorId = cfg.sensorId;
    const reqId = `harness-set-${sensorId}-${Date.now()}`;
    await store.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: reqId,
        reqId: 20 + sensorId,
        cmdId: BS2_CMD.SENSOR_CFG_SET,
        bodyB64: bytesToBase64(encodeSensorCfgBody(cfg)),
        timeoutMs: this.reqTimeoutMs,
      },
      0,
    );
    const got = await waitUntil(this.reqTimeoutMs + 500, () => this.resByRequestId.has(reqId));
    const res = this.resByRequestId.get(reqId);
    if (!got || !res?.ok) {
      throw new Error(`SET ${UART_SENSOR_NAMES[sensorId]}: ${res?.error ?? "no RES"}`);
    }
    const ack = res.bodyB64 != null ? decodeSensorCfgBody(base64ToBytes(res.bodyB64)) : null;
    if (ack == null) {
      throw new Error(`SET ${UART_SENSOR_NAMES[sensorId]}: bad ack body`);
    }
    return ack;
  }

  async ping(): Promise<boolean> {
    this.assertReady();
    const store = useWsClientStore.getState();
    const reqId = `probe-ping-${Date.now()}`;
    await store.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: reqId,
        reqId: 1,
        cmdId: BS2_CMD.PING,
        timeoutMs: this.reqTimeoutMs,
      },
      0,
    );
    const got = await waitUntil(this.reqTimeoutMs + 500, () => this.resByRequestId.has(reqId));
    const res = this.resByRequestId.get(reqId);
    return got && res?.ok === true;
  }

  async setBmi270StreamMode(mode: number): Promise<void> {
    this.assertReady();
    const store = useWsClientStore.getState();
    const modeTimeoutMs = mode === bmi270StreamModeUiToCode("raw") ? this.reqTimeoutMs : 15_000;
    const modeReqId = `probe-bmi270-mode-${Date.now()}`;
    await store.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: modeReqId,
        reqId: 90,
        cmdId: BS2_CMD.BMI270_MODE_SET,
        bodyB64: bytesToBase64(encodeBmi270ModeSetBody(mode)),
        timeoutMs: modeTimeoutMs,
      },
      0,
    );
    const modeGot = await waitUntil(modeTimeoutMs + 500, () => this.resByRequestId.has(modeReqId));
    const modeRes = this.resByRequestId.get(modeReqId);
    if (!modeGot || !modeRes?.ok) {
      throw new Error(`BMI270_MODE_SET: ${modeRes?.error ?? "no RES"}`);
    }
  }

  async verifySensorCfgGet(
    sensorIds: number[],
    expectedBySensor?: ReadonlyMap<number, Bs2SensorConfig>,
  ): Promise<string[]> {
    const errors: string[] = [];
    for (const sensorId of sensorIds) {
      try {
        const cfg = await this.getSensorCfg(sensorId);
        const expected = expectedBySensor?.get(sensorId);
        if (expected != null) {
          const diffs = diffSensorCfg(expected, cfg);
          if (diffs.length > 0) {
            errors.push(
              `GET ${UART_SENSOR_NAMES[sensorId]} mismatch: ${diffs.map((d) => `${d.field} expected=${d.expected} got=${d.actual}`).join("; ")}`,
            );
          }
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    return errors;
  }

  private assertReady(): void {
    if (!this.prepared) {
      throw new Error("harness not prepared — call prepare() first");
    }
  }
}
