/**
 * Shared UART + BS2 bridge session for hardware test CLIs.
 */
import { intervalMsFromHz } from "../domains/config/sensor-rate-presets";
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2SensorSamplePayload,
} from "../bridge/protocol";
import { BS2_CMD } from "../domains/config/commands";
import {
  encodeBmi270FusionFeedSetBody,
  encodeBmi270ModeSetBody,
  bmi270StreamModeCodeToUi,
  bmi270StreamModeUiToCode,
  type Bs2Bmi270StreamMode,
} from "../domains/bmi270/bmi270-control";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  type Bs2PublishMode,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import { base64ToBytes, bytesToBase64 } from "../util/base64";
import {
  SERIALPORT_TOPICS,
  type CloseRequest,
  type OpenRequest,
  type OpenResult,
} from "../../serialport-bridge/protocol";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import { UART_ALL_SENSOR_IDS, UART_BMI270_SENSOR_ID, UART_SENSOR_NAMES } from "./uart-sensor-assert";
import { diffSensorCfg } from "./uart-sensor-cfg-assert";
import type { MatrixSensorCfgOverride, MatrixTestCase } from "./uart-sensor-test-matrix";

const FUSION_FEED_MIN_MS = 10;
const FUSION_FEED_MAX_MS = 100;

export type UartHarnessOptions = {
  wsUrl?: string;
  path?: string;
  baud?: number;
  skipOpen?: boolean;
  reqTimeoutMs?: number;
  helloTimeoutMs?: number;
  connectTimeoutMs?: number;
  /** Delay after SENSOR_CFG/mode apply before clearing EVT buffer (ms). */
  settleMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(maxMs: number, pred: () => boolean): Promise<boolean> {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (pred()) return true;
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
    publishMode: (o.publishMode ?? 0) as Bs2PublishMode,
    mask: o.mask ?? defaultMaskForSensor(sensorId),
    samplingIntervalMs,
    deltaX100: o.deltaX100 ?? (o.publishMode === 1 || o.publishMode === 2 ? 1 : 0),
    minPublishIntervalMs: o.minPublishIntervalMs ?? 0,
    publishIntervalMs: enabled ? publishIntervalMs : 0,
  };
}

export class UartTestHarness {
  private readonly wsUrl: string;
  private readonly path: string;
  private readonly baud: number;
  private readonly skipOpen: boolean;
  private readonly reqTimeoutMs: number;
  private readonly helloTimeoutMs: number;
  private readonly connectTimeoutMs: number;
  private readonly settleMs: number;

  private client: T3DWebSocketClient | null = null;
  private helloPayload: Bitstream2HelloPayload | null = null;
  private samples: Bitstream2SensorSamplePayload[] = [];
  private resByRequestId = new Map<string, Bitstream2HostResPayload>();
  private openOk = false;
  private connected = false;

  constructor(opts: UartHarnessOptions = {}) {
    this.wsUrl = opts.wsUrl ?? process.env.T3D_WS_CLIENT_URL ?? T3D_DEFAULT_WS_CLIENT_URL;
    this.path = opts.path ?? process.env.BITSTREAM_UART_PATH ?? "COM3";
    this.baud = opts.baud ?? Number(process.env.BITSTREAM_UART_BAUD ?? "921600");
    this.skipOpen = opts.skipOpen ?? false;
    this.reqTimeoutMs = opts.reqTimeoutMs ?? 4000;
    this.helloTimeoutMs = opts.helloTimeoutMs ?? 25_000;
    this.connectTimeoutMs = opts.connectTimeoutMs ?? 15_000;
    this.settleMs = opts.settleMs ?? 600;
  }

  getHello(): Bitstream2HelloPayload | null {
    return this.helloPayload;
  }

  getSamples(): readonly Bitstream2SensorSamplePayload[] {
    return this.samples;
  }

  clearSamples(): void {
    this.samples = [];
  }

  /** Wait until WS transport is open; reconnect once if needed. */
  async ensureWsReady(): Promise<void> {
    const client = this.client;
    if (client == null) {
      throw new Error("harness not initialized");
    }
    const ready = await waitUntil(this.connectTimeoutMs, () => client.isConnected());
    if (ready) {
      return;
    }
    await client.reconnect();
    if (!(await waitUntil(this.connectTimeoutMs, () => client.isConnected()))) {
      throw new Error("WebSocket not connected");
    }
  }

  /** Drop queued EVT after config changes before measuring soak window. */
  async settleAfterConfig(): Promise<void> {
    if (this.settleMs > 0) {
      await sleep(this.settleMs);
    }
    this.clearSamples();
  }

  async connect(): Promise<void> {
    if (this.connected && this.client != null && this.client.isConnected()) {
      return;
    }
    this.openOk = false;
    this.helloPayload = null;

    if (this.client != null) {
      await this.client.disconnect();
      this.client = null;
      this.connected = false;
    }

    this.client = new T3DWebSocketClient(
      {
        url: this.wsUrl,
        autoConnect: false,
        connectTimeout: this.connectTimeoutMs,
        clientIdentity: { role: "uart-test-harness" },
      },
      {
        onMessage: (topic, payload) => {
          if (topic === BITSTREAM2_TOPICS.HELLO) {
            this.helloPayload = payload as Bitstream2HelloPayload;
          }
          if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
            this.samples.push(payload as Bitstream2SensorSamplePayload);
          }
          if (topic === BITSTREAM2_TOPICS.RES) {
            const res = payload as Bitstream2HostResPayload;
            if (res.requestId) {
              this.resByRequestId.set(res.requestId, res);
            }
          }
          if (topic === SERIALPORT_TOPICS.OPEN_RESULT) {
            const r = payload as OpenResult;
            if (r.success) {
              this.openOk = true;
            }
          }
        },
      },
    );

    await this.client.connect();
    await this.ensureWsReady();
    for (const t of [
      BITSTREAM2_TOPICS.HELLO,
      BITSTREAM2_TOPICS.EVT_SENSOR,
      BITSTREAM2_TOPICS.RES,
      SERIALPORT_TOPICS.OPEN_RESULT,
    ]) {
      await this.client.subscribe(t, 0, "json");
    }

    if (!this.skipOpen) {
      const closeReq: CloseRequest = { requestId: `uart-harness-close-${Date.now()}` };
      await this.client.publish(SERIALPORT_TOPICS.CLOSE, closeReq, 0);
      await sleep(400);
      const openReq: OpenRequest = {
        requestId: `uart-harness-open-${Date.now()}`,
        path: this.path,
        baudRate: this.baud,
        leaseOwner: "uart-test-harness",
      };
      await this.client.publish(SERIALPORT_TOPICS.OPEN, openReq, 0);
      if (!(await waitUntil(8000, () => this.openOk))) {
        throw new Error(`could not open ${this.path}`);
      }
    }

    if (!(await waitUntil(this.helloTimeoutMs, () => this.helloPayload != null)) || this.helloPayload == null) {
      throw new Error("no HELLO");
    }

    this.connected = true;
  }

  async applyTestCase(testCase: MatrixTestCase): Promise<Map<number, Bs2SensorConfig>> {
    const client = this.client;
    if (client == null) {
      throw new Error("harness not connected");
    }
    await this.ensureWsReady();

    const applied = new Map<number, Bs2SensorConfig>();
    for (const sensorId of UART_ALL_SENSOR_IDS) {
      const enabled = testCase.activeSensorIds.includes(sensorId);
      const cfg = resolveSensorCfg(sensorId, enabled, testCase.defaults, testCase.perSensor);
      applied.set(sensorId, cfg);

      const reqId = `matrix-set-${testCase.id}-${sensorId}-${Date.now()}`;
      await client.publish(
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
      if (ack.enabled !== enabled) {
        throw new Error(
          `SET ${UART_SENSOR_NAMES[sensorId]}: enabled ack=${ack.enabled} expected=${enabled}`,
        );
      }
      applied.set(sensorId, ack);
    }

    const bmi270Mode = bmi270StreamModeUiToCode(testCase.bmi270Mode ?? "raw");
    if (testCase.activeSensorIds.includes(UART_BMI270_SENSOR_ID)) {
      const modeTimeoutMs = bmi270Mode === bmi270StreamModeUiToCode("raw") ? this.reqTimeoutMs : 15_000;
      const modeReqId = `matrix-bmi270-mode-${testCase.id}-${Date.now()}`;
      await client.publish(
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
        await client.publish(
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

  /** SENSOR_CFG_SET one sensor; returns RES ack body. */
  async setSensorCfg(cfg: Bs2SensorConfig): Promise<Bs2SensorConfig> {
    const client = this.client;
    if (client == null) {
      throw new Error("harness not connected");
    }
    await this.ensureWsReady();

    const sensorId = cfg.sensorId;
    const reqId = `harness-set-${sensorId}-${Date.now()}`;
    await client.publish(
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

  /** SENSOR_CFG_GET one sensor. */
  async getSensorCfg(sensorId: number): Promise<Bs2SensorConfig> {
    const client = this.client;
    if (client == null) {
      throw new Error("harness not connected");
    }
    await this.ensureWsReady();

    const reqId = `harness-get-${sensorId}-${Date.now()}`;
    await client.publish(
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

  async soak(ms: number): Promise<number> {
    const t0 = Date.now();
    await sleep(ms);
    return Date.now() - t0;
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

  async disconnect(): Promise<void> {
    if (this.client != null) {
      await this.client.disconnect();
      this.client = null;
    }
    this.connected = false;
  }
}

export function cfgMaskBySensorFromApplied(applied: Map<number, Bs2SensorConfig>): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [id, cfg] of applied) {
    out[id] = cfg.mask;
  }
  return out;
}

export function bmi270ModeFromCase(testCase: MatrixTestCase): Bs2Bmi270StreamMode {
  return bmi270StreamModeUiToCode(testCase.bmi270Mode ?? "raw");
}
