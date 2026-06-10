import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2DevSimStatePayload,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2SensorSamplePayload,
  type Bitstream2TelemetryRoutePayload,
} from "../bridge/protocol";
import type { Bs2SensorConfig } from "../domains/config/sensor-config";
import {
  buildProviderConfigFromBs2Configs,
  buildProviderConfigPayload,
} from "./build-provider-config";
import { createProviderStaleResolver } from "./catalog/provider-stale-ms";
import { buildSensorCatalog, buildStaleAfterMsBySensorId } from "./catalog/sensor-catalog-source";
import { mapBs2ToProviderSample } from "./map-provider-sample";
import { executeProviderCommand } from "./provider-command-handlers";
import { ProviderCommandService } from "./provider-command-service";
import { devSimConfigsToBs2, fetchLiveSensorConfigs } from "./provider-live-config";
import { providerEnvelope } from "./provider-envelope";
import { DEFAULT_PROVIDER_STALE_MS, ProviderStaleTracker } from "./provider-stale-tracker";
import {
  BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_PORT,
  BITSTREAM_TELEMETRY_PROVIDER_EVENT,
  resolveTelemetryProviderListenHost,
  resolveTelemetryProviderListenPort,
} from "./types";

export type TelemetryProviderGatewayOptions = {
  listenHost?: string;
  listenPort?: number;
  brokerUrl?: string;
};

type ProviderClientMessage = {
  type?: string;
  v?: number;
  payload?: {
    what?: string;
    requestId?: string;
    command?: string;
    args?: Record<string, unknown>;
  };
};

export class TelemetryProviderGateway {
  private readonly listenHost: string;
  private readonly listenPort: number;
  private readonly brokerUrl: string;

  private wss: WebSocketServer | null = null;
  private broker: T3DWebSocketClient | null = null;
  private commandService: ProviderCommandService | null = null;
  private readonly clients = new Set<WebSocket>();
  private brokerConnected = false;
  private lastHello: Bitstream2HelloPayload | null = null;
  private routeMode: "uart" | "simulator" = "simulator";
  private lastConfigJson: string | null = null;
  private liveConfigs: Bs2SensorConfig[] = [];
  private staleTracker: ProviderStaleTracker | null = null;

  constructor(opts: TelemetryProviderGatewayOptions = {}) {
    this.listenHost = opts.listenHost ?? resolveTelemetryProviderListenHost();
    this.listenPort = opts.listenPort ?? resolveTelemetryProviderListenPort();
    this.brokerUrl = opts.brokerUrl ?? process.env.T3D_WS_CLIENT_URL ?? T3D_DEFAULT_WS_CLIENT_URL;
  }

  async start(): Promise<void> {
    this.staleTracker = new ProviderStaleTracker(
      createProviderStaleResolver(buildStaleAfterMsBySensorId(), DEFAULT_PROVIDER_STALE_MS),
      (payload) => {
        this.broadcast(providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.STALE, payload));
      },
    );
    this.staleTracker.start();
    await this.startBrokerClient();
    await this.startPublicServer();
    console.log(
      `[telemetry-provider] public API ws://${this.listenHost}:${this.listenPort} (broker ${this.brokerUrl})`,
    );
  }

  async stop(): Promise<void> {
    this.staleTracker?.stop();
    this.staleTracker = null;
    for (const ws of this.clients) {
      ws.close();
    }
    this.clients.clear();
    this.wss?.close();
    this.wss = null;
    this.commandService?.dispose();
    this.commandService = null;
    if (this.broker != null) {
      await this.broker.disconnect();
      this.broker = null;
    }
    this.brokerConnected = false;
  }

  private async startPublicServer(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const wss = new WebSocketServer({ host: this.listenHost, port: this.listenPort });
      wss.on("listening", () => {
        this.wss = wss;
        resolve();
      });
      wss.on("error", reject);
      wss.on("connection", (ws) => {
        this.clients.add(ws);
        this.sendInitialSnapshot(ws);
        ws.on("message", (raw) => void this.onClientMessage(ws, raw));
        ws.on("close", () => this.clients.delete(ws));
      });
    });
  }

  private async startBrokerClient(): Promise<void> {
    const client = new T3DWebSocketClient(
      {
        url: this.brokerUrl,
        autoConnect: false,
        maxReconnectAttempts: -1,
        clientIdentity: { role: "telemetry-provider-gateway" },
      },
      {
        onConnect: () => {
          this.brokerConnected = true;
          void this.subscribeBrokerTopics(client);
          this.broadcastConnection();
        },
        onDisconnect: () => {
          this.brokerConnected = false;
          this.broadcastConnection();
        },
        onMessage: (topic, payload) => this.onBrokerMessage(topic, payload),
      },
    );

    this.broker = client;
    this.commandService = new ProviderCommandService({
      publishReq: async (req) => {
        await client.publish(BITSTREAM2_TOPICS.REQ, req, 0);
      },
      // RES is forwarded via onBrokerMessage → noteRes.
      onRes: () => () => {},
    });

    await client.connect();
    await this.subscribeBrokerTopics(client);
    this.brokerConnected = client.isConnected();
  }

  private async subscribeBrokerTopics(client: T3DWebSocketClient): Promise<void> {
    const topics = [
      BITSTREAM2_TOPICS.EVT_SENSOR,
      BITSTREAM2_TOPICS.HELLO,
      BITSTREAM2_TOPICS.TELEMETRY_ROUTE,
      BITSTREAM2_TOPICS.RES,
      BITSTREAM2_TOPICS.DEV_SIM_STATE,
    ];
    for (const topic of topics) {
      await client.subscribe(topic, 0);
    }
  }

  private onBrokerMessage(topic: string, payload: unknown): void {
    if (topic === BITSTREAM2_TOPICS.RES) {
      this.commandService?.noteRes(payload as Bitstream2HostResPayload);
      return;
    }

    if (topic === BITSTREAM2_TOPICS.HELLO) {
      this.lastHello = payload as Bitstream2HelloPayload;
      void this.refreshLiveConfigFromFirmware();
      this.broadcast(providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.HELLO, {
        version: this.lastHello.version,
        caps: this.lastHello.caps,
        mtuSensor: this.lastHello.mtuSensor,
        mtuCtrl: this.lastHello.mtuCtrl,
        fwTag: this.lastHello.fwTag,
        hostMs: Date.now(),
      }));
      this.broadcastConnection();
      return;
    }

    if (topic === BITSTREAM2_TOPICS.TELEMETRY_ROUTE) {
      const route = payload as Bitstream2TelemetryRoutePayload;
      this.routeMode = route.mode === "uart" ? "uart" : "simulator";
      this.pushConfig();
      this.broadcastConnection();
      return;
    }

    if (topic === BITSTREAM2_TOPICS.DEV_SIM_STATE) {
      const sim = payload as Bitstream2DevSimStatePayload;
      this.liveConfigs = devSimConfigsToBs2(sim.configs);
      this.pushConfig("simulator");
      return;
    }

    if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
      const sample = mapBs2ToProviderSample(payload as Bitstream2SensorSamplePayload);
      if (sample == null) {
        return;
      }
      this.staleTracker?.noteSample(sample);
      this.broadcast(providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.SAMPLE, sample));
    }
  }

  private async refreshLiveConfigFromFirmware(): Promise<void> {
    const service = this.commandService;
    if (service == null) {
      return;
    }
    const configs = await fetchLiveSensorConfigs(service);
    if (configs.length > 0) {
      this.liveConfigs = configs;
      this.pushConfig(this.routeMode === "uart" ? "firmware" : "simulator");
    }
  }

  private configSource(): "firmware" | "simulator" {
    return this.routeMode === "uart" ? "firmware" : "simulator";
  }

  private buildConfigPayload() {
    if (this.liveConfigs.length > 0) {
      return buildProviderConfigFromBs2Configs(this.liveConfigs, this.configSource());
    }
    return buildProviderConfigPayload(this.configSource());
  }

  private pushConfig(source?: "firmware" | "simulator" | "draft"): void {
    const config =
      source != null && this.liveConfigs.length > 0
        ? buildProviderConfigFromBs2Configs(this.liveConfigs, source)
        : this.buildConfigPayload();
    const json = JSON.stringify(providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONFIG, config));
    if (json === this.lastConfigJson) {
      return;
    }
    this.lastConfigJson = json;
    this.broadcast(JSON.parse(json) as ReturnType<typeof providerEnvelope>);
  }

  private sendInitialSnapshot(ws: WebSocket): void {
    this.send(ws, providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CATALOG, buildSensorCatalog()));
    this.send(ws, providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONFIG, this.buildConfigPayload()));
    this.send(ws, this.buildConnectionEnvelope());
    if (this.lastHello != null) {
      this.send(ws, providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.HELLO, {
        version: this.lastHello.version,
        caps: this.lastHello.caps,
        mtuSensor: this.lastHello.mtuSensor,
        mtuCtrl: this.lastHello.mtuCtrl,
        fwTag: this.lastHello.fwTag,
        hostMs: Date.now(),
      }));
    }
  }

  private async onClientMessage(ws: WebSocket, raw: WebSocket.RawData): Promise<void> {
    let msg: ProviderClientMessage;
    try {
      msg = JSON.parse(String(raw)) as ProviderClientMessage;
    } catch {
      return;
    }
    if (msg.v !== 1 || typeof msg.type !== "string") {
      return;
    }

    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.REQUEST) {
      const what = msg.payload?.what;
      if (what === "catalog") {
        this.send(ws, providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CATALOG, buildSensorCatalog()));
        return;
      }
      if (what === "config") {
        this.send(ws, providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONFIG, this.buildConfigPayload()));
        return;
      }
      if (what === "connection") {
        this.send(ws, this.buildConnectionEnvelope());
      }
      return;
    }

    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.COMMAND) {
      const requestId = msg.payload?.requestId ?? `cmd-${Date.now()}`;
      const command = msg.payload?.command ?? "";
      const args = msg.payload?.args ?? {};
      const service = this.commandService;
      if (service == null) {
        this.send(ws, providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.RESPONSE, {
          requestId,
          ok: false,
          command,
          data: null,
          error: "provider not ready",
          hostMs: Date.now(),
        }));
        return;
      }
      const result = await executeProviderCommand(service, command, args);
      if (
        result.ok &&
        (command === "sensor.cfg.set" || command === "bmi270.mode.set")
      ) {
        const configs = await fetchLiveSensorConfigs(service);
        if (configs.length > 0) {
          this.liveConfigs = configs;
        }
        this.pushConfig();
      }
      this.send(ws, providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.RESPONSE, {
        requestId,
        ...result,
      }));
    }
  }

  private buildConnectionEnvelope() {
    return providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONNECTION, {
      state: this.brokerConnected ? "connected" : "disconnected",
      route: this.routeMode,
      comOpen: this.routeMode === "uart",
      providerReady: true,
    });
  }

  private broadcastConnection(): void {
    this.broadcast(this.buildConnectionEnvelope());
  }

  private broadcast(envelope: ReturnType<typeof providerEnvelope>): void {
    const json = JSON.stringify(envelope);
    for (const ws of this.clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(json);
      }
    }
  }

  private send(ws: WebSocket, envelope: ReturnType<typeof providerEnvelope>): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(envelope));
    }
  }
}

export { BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_PORT };
