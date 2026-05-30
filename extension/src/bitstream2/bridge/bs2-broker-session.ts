/*******************************************************************************
 * File Name : bs2-broker-session.ts
 *
 * Description : BS2 WebSocket broker session (serial open, HELLO, REQ/RES, EVT_SENSOR).
 *               Shared by MCP, AI bridge, and UART test harnesses.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2SensorSamplePayload,
} from "./protocol";
import { BS2_CMD } from "../domains/config/commands";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  normalizeSensorCfg,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import { bytesToBase64, base64ToBytes } from "../util/base64";
import {
  SERIALPORT_TOPICS,
  type CloseRequest,
  type OpenRequest,
  type OpenResult,
} from "../../serialport-bridge/protocol";
import {
  bs2SensorIdToLegacySourceId,
  legacySourceIdToBs2SensorId,
} from "../domains/sensors/legacy-source-id-map";

export type Bs2BrokerSessionOptions = {
  wsUrl?: string;
  path?: string;
  baudRate?: number;
  skipOpen?: boolean;
  reqTimeoutMs?: number;
  helloTimeoutMs?: number;
  connectTimeoutMs?: number;
  clientIdentityRole?: string;
};

function sleep(ms: number): Promise<void>
{
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(maxMs: number, pred: () => boolean, stepMs = 25): Promise<boolean>
{
  const end = Date.now() + maxMs;
  while (Date.now() < end)
  {
    if (pred())
    {
      return true;
    }
    await sleep(stepMs);
  }
  return pred();
}

export class Bs2BrokerSession
{
  private readonly wsUrl: string;
  private readonly path: string;
  private readonly baudRate: number;
  private readonly skipOpen: boolean;
  private readonly reqTimeoutMs: number;
  private readonly helloTimeoutMs: number;
  private readonly connectTimeoutMs: number;
  private readonly clientIdentityRole: string;

  private client: T3DWebSocketClient | null = null;
  private helloPayload: Bitstream2HelloPayload | null = null;
  private samples: Bitstream2SensorSamplePayload[] = [];
  private resByRequestId = new Map<string, Bitstream2HostResPayload>();
  private openOk = false;
  private connected = false;

  constructor(opts: Bs2BrokerSessionOptions = {})
  {
    this.wsUrl = opts.wsUrl ?? process.env.T3D_WS_CLIENT_URL ?? T3D_DEFAULT_WS_CLIENT_URL;
    this.path = opts.path ?? process.env.BITSTREAM_UART_PATH ?? "COM3";
    this.baudRate = opts.baudRate ?? Number(process.env.BITSTREAM_UART_BAUD ?? "921600");
    this.skipOpen = opts.skipOpen ?? false;
    this.reqTimeoutMs = opts.reqTimeoutMs ?? 4000;
    this.helloTimeoutMs = opts.helloTimeoutMs ?? 25_000;
    this.connectTimeoutMs = opts.connectTimeoutMs ?? 15_000;
    this.clientIdentityRole = opts.clientIdentityRole ?? "bs2-broker-session";
  }

  getWsUrl(): string
  {
    return this.wsUrl;
  }

  getPath(): string
  {
    return this.path;
  }

  getBaudRate(): number
  {
    return this.baudRate;
  }

  getHello(): Bitstream2HelloPayload | null
  {
    return this.helloPayload;
  }

  getSamples(): readonly Bitstream2SensorSamplePayload[]
  {
    return this.samples;
  }

  clearSamples(): void
  {
    this.samples = [];
  }

  isWsConnected(): boolean
  {
    return this.client?.isConnected() ?? false;
  }

  /** True when WS is up, serial open succeeded (or skipped), and HELLO was received. */
  isCommandsReady(): boolean
  {
    return this.connected && this.helloPayload != null && this.isWsConnected();
  }

  /** Publish JSON to any broker topic (MCP fan-out to webview dashboards). */
  async publishBrokerJson(topic: string, payload: unknown, qos: 0 | 1 = 0): Promise<void>
  {
    const client = this.client;
    if (client == null || !client.isConnected())
    {
      return;
    }
    await client.publish(topic, payload, qos);
  }

  async ensureWsReady(): Promise<void>
  {
    const client = this.client;
    if (client == null)
    {
      throw new Error("BS2 session not initialized");
    }
    const ready = await waitUntil(this.connectTimeoutMs, () => client.isConnected());
    if (ready)
    {
      return;
    }
    await client.reconnect();
    if (!(await waitUntil(this.connectTimeoutMs, () => client.isConnected())))
    {
      throw new Error("WebSocket not connected");
    }
  }

  async connect(): Promise<void>
  {
    if (this.connected && this.client != null && this.client.isConnected())
    {
      return;
    }
    this.openOk = this.skipOpen;
    this.helloPayload = null;

    if (this.client != null)
    {
      await this.client.disconnect();
      this.client = null;
      this.connected = false;
    }

    this.client = new T3DWebSocketClient(
      {
        url: this.wsUrl,
        autoConnect: false,
        connectTimeout: this.connectTimeoutMs,
        clientIdentity: { role: this.clientIdentityRole },
      },
      {
        onMessage: (topic, payload) =>
        {
          if (topic === BITSTREAM2_TOPICS.HELLO)
          {
            this.helloPayload = payload as Bitstream2HelloPayload;
          }
          if (topic === BITSTREAM2_TOPICS.EVT_SENSOR)
          {
            this.samples.push(payload as Bitstream2SensorSamplePayload);
          }
          if (topic === BITSTREAM2_TOPICS.RES)
          {
            const res = payload as Bitstream2HostResPayload;
            if (res.requestId)
            {
              this.resByRequestId.set(res.requestId, res);
            }
          }
          if (topic === SERIALPORT_TOPICS.OPEN_RESULT)
          {
            const r = payload as OpenResult;
            if (r.success)
            {
              this.openOk = true;
            }
          }
        },
      },
    );

    await this.client.connect();
    await this.ensureWsReady();

    const topics = [
      BITSTREAM2_TOPICS.HELLO,
      BITSTREAM2_TOPICS.EVT_SENSOR,
      BITSTREAM2_TOPICS.RES,
    ];
    if (!this.skipOpen)
    {
      topics.push(SERIALPORT_TOPICS.OPEN_RESULT);
    }
    for (const t of topics)
    {
      await this.client.subscribe(t, 0, "json");
    }

    if (!this.skipOpen)
    {
      const closeReq: CloseRequest = { requestId: `bs2-close-${Date.now()}` };
      await this.client.publish(SERIALPORT_TOPICS.CLOSE, closeReq, 0);
      await sleep(400);
      const openReq: OpenRequest = {
        requestId: `bs2-open-${Date.now()}`,
        path: this.path,
        baudRate: this.baudRate,
        leaseOwner: this.clientIdentityRole,
      };
      await this.client.publish(SERIALPORT_TOPICS.OPEN, openReq, 0);
      if (!(await waitUntil(8000, () => this.openOk)))
      {
        throw new Error(`could not open ${this.path}`);
      }
    }

    const gotHello = await this.waitForHello(this.helloTimeoutMs);
    if (!gotHello || this.helloPayload == null)
    {
      throw new Error("no HELLO");
    }

    this.connected = true;
  }

  async close(): Promise<void>
  {
    await this.disconnect();
  }

  async disconnect(): Promise<void>
  {
    if (this.client != null)
    {
      await this.client.disconnect();
      this.client = null;
    }
    this.connected = false;
    this.openOk = false;
    this.helloPayload = null;
    this.resByRequestId.clear();
  }

  /** Ask bridge to re-probe firmware when HELLO may have been missed before subscribe. */
  async triggerRuntimeHandshakeRun(reason: string): Promise<void>
  {
    const client = this.client;
    if (client == null)
    {
      return;
    }
    await client.publish(
      SERIALPORT_TOPICS.RUNTIME_HANDSHAKE_RUN,
      { requestId: `bs2-hs-${Date.now()}`, reason },
      0,
    );
  }

  async waitForHello(timeoutMs: number): Promise<boolean>
  {
    const client = this.client;
    if (client == null)
    {
      return false;
    }
    const end = Date.now() + timeoutMs;
    while (Date.now() < end)
    {
      if (this.helloPayload != null)
      {
        return true;
      }
      await this.triggerRuntimeHandshakeRun("bs2-broker-session");
      const remaining = end - Date.now();
      if (remaining <= 0)
      {
        break;
      }
      if (await waitUntil(Math.min(5000, remaining), () => this.helloPayload != null))
      {
        return true;
      }
    }
    return this.helloPayload != null;
  }

  async sendReq(options: {
    cmdId: number;
    bodyB64?: string;
    reqId?: number;
    timeoutMs?: number;
    requestId?: string;
  }): Promise<Bitstream2HostResPayload>
  {
    const client = this.client;
    if (client == null)
    {
      throw new Error("BS2 session not connected");
    }
    await this.ensureWsReady();

    const requestId = options.requestId ?? `bs2-req-${options.cmdId}-${Date.now()}`;
    const timeoutMs = options.timeoutMs ?? this.reqTimeoutMs;
    const reqId = options.reqId ?? 1;

    await client.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId,
        reqId,
        cmdId: options.cmdId,
        bodyB64: options.bodyB64,
        timeoutMs,
      },
      0,
    );

    const got = await waitUntil(timeoutMs + 500, () => this.resByRequestId.has(requestId));
    const res = this.resByRequestId.get(requestId);
    if (!got || res == null)
    {
      throw new Error(`BS2 cmd 0x${options.cmdId.toString(16)}: no RES`);
    }
    if (!res.ok)
    {
      throw new Error(res.error ?? `BS2 cmd 0x${options.cmdId.toString(16)} failed`);
    }
    return res;
  }

  async ping(timeoutMs?: number): Promise<Bitstream2HostResPayload>
  {
    return this.sendReq({
      cmdId: BS2_CMD.PING,
      reqId: 1,
      timeoutMs: timeoutMs ?? this.reqTimeoutMs,
    });
  }

  async getCaps(timeoutMs?: number): Promise<Bitstream2HostResPayload>
  {
    return this.sendReq({
      cmdId: BS2_CMD.CAPS_GET,
      reqId: 2,
      timeoutMs: timeoutMs ?? this.reqTimeoutMs,
    });
  }

  async getSensorCfg(sensorId: number): Promise<Bs2SensorConfig>
  {
    const res = await this.sendReq({
      cmdId: BS2_CMD.SENSOR_CFG_GET,
      reqId: 40 + sensorId,
      bodyB64: bytesToBase64(encodeSensorCfgGetBody(sensorId)),
    });
    const cfg = res.bodyB64 != null ? decodeSensorCfgBody(base64ToBytes(res.bodyB64)) : null;
    if (cfg == null)
    {
      throw new Error(`SENSOR_CFG_GET sensorId=${sensorId}: bad body`);
    }
    return cfg;
  }

  async setSensorCfg(cfg: Bs2SensorConfig): Promise<Bs2SensorConfig>
  {
    const normalized = normalizeSensorCfg(cfg);
    const res = await this.sendReq({
      cmdId: BS2_CMD.SENSOR_CFG_SET,
      reqId: 20 + normalized.sensorId,
      bodyB64: bytesToBase64(encodeSensorCfgBody(normalized)),
    });
    const ack = res.bodyB64 != null ? decodeSensorCfgBody(base64ToBytes(res.bodyB64)) : null;
    if (ack == null)
    {
      throw new Error(`SENSOR_CFG_SET sensorId=${normalized.sensorId}: bad ack body`);
    }
    return ack;
  }

  async getSensorCfgByLegacySourceId(sourceId: number): Promise<Bs2SensorConfig>
  {
    const sensorId = legacySourceIdToBs2SensorId(sourceId);
    if (sensorId == null)
    {
      throw new Error(`Unsupported legacy sourceId ${sourceId} (expected 1–4)`);
    }
    return this.getSensorCfg(sensorId);
  }

  async setSensorCfgByLegacySourceId(
    sourceId: number,
    patch: Partial<Omit<Bs2SensorConfig, "sensorId">>,
  ): Promise<Bs2SensorConfig>
  {
    const sensorId = legacySourceIdToBs2SensorId(sourceId);
    if (sensorId == null)
    {
      throw new Error(`Unsupported legacy sourceId ${sourceId} (expected 1–4)`);
    }
    const current = await this.getSensorCfg(sensorId);
    return this.setSensorCfg({
      ...current,
      ...patch,
      sensorId,
    });
  }

  /** Collect latest EVT_SENSOR per BS2 sensorId during a short window. */
  async collectLatestSamplesBySensorId(windowMs: number): Promise<Map<number, Bitstream2SensorSamplePayload>>
  {
    this.clearSamples();
    await sleep(Math.max(200, windowMs));
    const latest = new Map<number, Bitstream2SensorSamplePayload>();
    for (const sample of this.samples)
    {
      latest.set(sample.sensorId, sample);
    }
    return latest;
  }

  legacySourceHint(sourceId: number): "sht40" | "dps368" | "bmm350" | "bmi270" | "unknown"
  {
    switch (sourceId)
    {
      case 1:
        return "sht40";
      case 2:
        return "dps368";
      case 3:
        return "bmm350";
      case 4:
        return "bmi270";
      default:
        return "unknown";
    }
  }

  sensorKeyFromBs2Id(sensorId: number): "sht40" | "dps368" | "bmm350" | "bmi270" | "unknown"
  {
    const legacy = bs2SensorIdToLegacySourceId(sensorId);
    if (legacy == null)
    {
      return "unknown";
    }
    return this.legacySourceHint(legacy);
  }
}
