import { T3DWebSocketClient } from "../websocket/T3DWebSocketClient";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../websocket/T3DWebSocketConfig";
import { T3DSerialPort } from "../serialport/T3DSerialPort";
import type { SerialPortConfig } from "../serialport/T3DSerialPort";
import {
  SERIALPORT_TOPICS,
  type BridgeRuntimeConnectionState,
  type BridgeRuntimeHandshakeState,
  type BridgeRuntimeOperation,
  type BridgeRuntimeSnapshotPayload,
  type FirmwareLivenessPayload,
  type FirmwareLivenessState,
  type ListRequest,
  type ListResponse,
  type OpenRequest,
  type OpenResult,
  type CloseRequest,
  type CloseResult,
  type WriteRequest,
  type WriteResult,
  type SerialDataPayload,
  type SerialPortStatusPayload,
  type PortInfo,
} from "./protocol";
import { getSerialportDataBinaryPublishQos } from "./serialDataBinaryQos";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2DevInjectRxPayload,
  type Bitstream2DevStatusPayload,
  type Bitstream2HelloPayload,
  type Bitstream2HostReqPayload,
  type Bitstream2HostResPayload,
  type Bitstream2MetricsPayload,
  type Bitstream2SimHostTxPayload,
  type Bitstream2SimStatusPayload,
} from "../bitstream2/bridge/protocol";
import { applyDevSerialWrite } from "../bitstream2/dev/dev-write";
import { BsSession } from "../bitstream2/runtime/session";
import { BsUartDecoder } from "../bitstream2/runtime/uart-decode";
import { buildHelloProbeWireBytes } from "../bitstream2/runtime/hello-probe";
import { bytesToBase64, base64ToBytes } from "../bitstream2/util/base64";

/** Heartbeat from `bitstream-simulator` is published every ~2 s; allow one missed interval. */
const EXTERNAL_SIM_STATUS_STALE_MS = 6000;
const EXTERNAL_SIM_BROKER_ROLE = "bitstream-firmware-simulator";

export interface SerialPortBridgeConfig {
  wsUrl?: string;
  /**
   * Force external simulator routing (skip auto-detect). Env: `BITSTREAM2_EXTERNAL_SIM=1`.
   * Normally unnecessary — bridge auto-detects `bitstream2/sim/status` from bitstream-simulator.
   */
  externalSim?: boolean;
  /** When false (default on hardware UART), only BS2 decode topics are published — not `serialport/data`. */
  publishRawUart?: boolean;
}

function resolveExternalSim(config: SerialPortBridgeConfig): boolean {
  if (config.externalSim != null) return config.externalSim;
  const v = process.env.BITSTREAM2_EXTERNAL_SIM;
  return v === "1" || v === "true" || v === "yes";
}

function resolvePublishRawUart(config: SerialPortBridgeConfig, simulationEnabled: boolean): boolean {
  if (simulationEnabled)
  {
    return true;
  }
  if (config.publishRawUart != null)
  {
    return config.publishRawUart;
  }
  const v = process.env.T3D_BRIDGE_PUBLISH_RAW_UART;
  return v === "1" || v === "true" || v === "yes";
}

let bridgeInstance: SerialPortWebSocketBridge | null = null;

function toPortInfo(p: {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}): PortInfo {
  return {
    path: p.path,
    manufacturer: p.manufacturer,
    serialNumber: p.serialNumber,
    pnpId: p.pnpId,
    locationId: p.locationId,
    productId: p.productId,
    vendorId: p.vendorId,
  };
}

function statusToPayload(
  s: { isOpen: boolean; path: string | null; baudRate: number | null; bytesRead: number; bytesWritten: number },
  error?: string,
): SerialPortStatusPayload {
  return {
    isOpen: s.isOpen,
    path: s.path,
    baudRate: s.baudRate,
    bytesRead: s.bytesRead,
    bytesWritten: s.bytesWritten,
    ...(error != null && { error }),
  };
}

/**
 * SerialPort–WebSocket bridge (Bitstream vNext).
 *
 * Responsibilities:
 * - UART IO via `T3DSerialPort`
 * - Publish raw serial bytes (`serialport/data`) for tooling
 * - Decode Bitstream vNext (BS-framed) and publish structured JSON events (`bitstream2/*`)
 * - Handle basic broker requests: list/open/close/write
 */
export class SerialPortWebSocketBridge {
  private readonly client: T3DWebSocketClient;
  private readonly port: T3DSerialPort;
  private readonly config: {
    wsUrl: string;
    /** Env/config override — always route host UART to external sim (skip auto-detect). */
    externalSimForced: boolean;
    publishRawUart: boolean;
  };
  /** Set from `bitstream2/sim/status` heartbeat (auto-detect). */
  private externalSimOnline = false;
  private externalSimLastAtMs = 0;

  private connectionState: BridgeRuntimeConnectionState = "disconnected";
  private recentOperations: BridgeRuntimeOperation[] = [];
  private latestPorts: PortInfo[] = [];

  private lastRxAtMs: number | null = null;
  private firmwareLivenessState: FirmwareLivenessState = "unknown";
  private firmwareLivenessTimer: ReturnType<typeof setInterval> | null = null;

  private readonly bsUartDecoder = new BsUartDecoder();
  private bsLastHello: Bitstream2HelloPayload | null = null;
  private bridgeHandshakeState: BridgeRuntimeHandshakeState = "unknown";
  private bridgeHandshakeLastError: string | null = null;
  private bsMetricsTimer: ReturnType<typeof setInterval> | null = null;
  private statusPublishDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** False after Close until next Open — blocks UART RX broker traffic. */
  private hostUartSessionActive = false;
  /** Consecutive all-zero RX chunks (unplugged/floating USB lines). */
  private allZeroRxStreak = 0;
  /** Skip `serialport/status` when only byte counters changed (UART flood). */
  private lastStatusPublishKey: string | null = null;
  private readonly bsSession: BsSession;

  /** Route host UART TX to standalone bitstream-simulator (auto-detect or forced). */
  private useExternalSim(): boolean {
    if (this.config.externalSimForced) {
      return true;
    }
    if (!this.externalSimOnline || this.externalSimLastAtMs <= 0) {
      return false;
    }
    return Date.now() - this.externalSimLastAtMs < EXTERNAL_SIM_STATUS_STALE_MS;
  }

  constructor(config: SerialPortBridgeConfig = {}) {
    const externalSimForced = resolveExternalSim(config);
    this.config = {
      wsUrl: config.wsUrl ?? T3D_DEFAULT_WS_CLIENT_URL,
      externalSimForced,
      publishRawUart: resolvePublishRawUart(config, externalSimForced),
    };
    this.port = new T3DSerialPort();
    this.client = new T3DWebSocketClient(
      {
        url: this.config.wsUrl,
        autoConnect: false,
        clientIdentity: { role: "serialport-bridge", name: "SerialPortWebSocketBridge" },
      },
      {
        onConnect: () => void this.onWsConnect(),
        onMessage: (topic, payload) => void this.onWsMessage(topic, payload),
        onError: (err) => {
          this.connectionState = "error";
          this.pushOperation("bridge-disconnected", `bridge websocket error: ${err.message}`);
        },
        onDisconnect: () => {
          this.connectionState = "disconnected";
          this.pushOperation("bridge-disconnected", "bridge websocket disconnected");
        },
      },
    );

    this.bsSession = new BsSession({
      write: async (bytes: Uint8Array) => {
        await applyDevSerialWrite({
          data: bytes,
          portOpen: this.port.isOpen(),
          useExternalSim: this.useExternalSim(),
          writeToPort: async (data) => {
            await this.port.write(Buffer.from(data));
          },
          feedExternalSim: async (data) => {
            this.publishSimHostTx(data);
          },
        });
      },
    });

    if (this.config.externalSimForced) {
      this.pushOperation("external-sim-forced", "BITSTREAM2 external sim forced (BITSTREAM2_EXTERNAL_SIM=1)");
    }
    else {
      this.pushOperation("external-sim-autodetect", "BS2 external sim via bitstream2/sim/status (bitstream-simulator app)");
    }

    this.setupSerialListeners();
    this.startFirmwareLivenessMonitor();
    this.startBitstream2MetricsPublisher();
  }

  async start(): Promise<void> {
    await this.client.connect();
  }

  async stop(): Promise<void> {
    this.setHostUartSessionActive(false, "bridge-stop");
    try {
      await this.port.close();
    } catch {
      try {
        await this.port.forceClose();
      } catch {
        // ignore
      }
    }
    if (this.firmwareLivenessTimer) {
      clearInterval(this.firmwareLivenessTimer);
      this.firmwareLivenessTimer = null;
    }
    if (this.bsMetricsTimer) {
      clearInterval(this.bsMetricsTimer);
      this.bsMetricsTimer = null;
    }
    await this.client.disconnect();
  }

  /** Gate broker UART traffic; disabled on Close before hardware close completes. */
  private setHostUartSessionActive(active: boolean, reason: string): void {
    this.hostUartSessionActive = active;
    if (!active)
    {
      this.allZeroRxStreak = 0;
      if (this.statusPublishDebounceTimer != null)
      {
        clearTimeout(this.statusPublishDebounceTimer);
        this.statusPublishDebounceTimer = null;
      }
      this.bsSession.cancelAllPending("host-uart-inactive");
      this.bsUartDecoder.reset();
      this.lastRxAtMs = null;
      this.setFirmwareLiveness("unknown", reason);
    }
    else
    {
      this.allZeroRxStreak = 0;
    }
    this.pushOperation(
      active ? "host-uart-rx-on" : "host-uart-rx-off",
      reason,
    );
  }

  /** Unplugged COM often delivers repeating zero buffers; stop RX after a short streak. */
  private noteRxChunk(data: Buffer): boolean {
    if (data.length === 0)
    {
      return false;
    }
    let allZero = true;
    for (let i = 0; i < data.length; i++)
    {
      if (data[i] !== 0)
      {
        allZero = false;
        break;
      }
    }
    if (allZero)
    {
      this.allZeroRxStreak++;
      if (this.allZeroRxStreak >= 16)
      {
        this.setHostUartSessionActive(false, "rx-all-zero-streak");
        this.pushOperation("serial-error", "RX all-zero streak (device unplugged?) — host UART gated off");
        void this.port.forceClose().catch(() => {
          /* ignore */
        });
        void this.publishStatus("RX all-zero streak (device unplugged?)");
        return false;
      }
    }
    else
    {
      this.allZeroRxStreak = 0;
    }
    return true;
  }

  private setupSerialListeners(): void {
    this.port.on("data", (data: Buffer) => {
      if (!this.hostUartSessionActive)
      {
        return;
      }
      if (!this.noteRxChunk(data))
      {
        return;
      }
      this.lastRxAtMs = Date.now();
      this.publishData(data);
    });
    this.port.on("line", (line: string) => {
      if (!this.hostUartSessionActive)
      {
        return;
      }
      const buf = Buffer.from(line, "utf8");
      if (!this.noteRxChunk(buf))
      {
        return;
      }
      this.lastRxAtMs = Date.now();
      this.publishData(buf, "utf8");
    });
    this.port.on("open", () => {
      this.setHostUartSessionActive(true, "serial-open-event");
      this.lastStatusPublishKey = null;
      this.pushOperation("serial-opened", `serial opened (${this.port.getStatus().path ?? "unknown"})`);
      this.lastRxAtMs = Date.now();
      this.setFirmwareLiveness("alive", "serial-open");
      this.bsUartDecoder.reset();
      this.onSerialSessionOpened();
      this.schedulePublishStatus();
    });
    this.port.on("close", () => {
      this.setHostUartSessionActive(false, "serial-close-event");
      this.lastStatusPublishKey = null;
      this.pushOperation("serial-closed", "serial closed");
      this.lastRxAtMs = null;
      this.setFirmwareLiveness("unknown", "serial-closed");
      this.clearBs2HandshakeState("serial-closed");
      this.bsUartDecoder.reset();
      this.schedulePublishStatus();
    });
    this.port.on("error", (err: Error) => {
      this.setHostUartSessionActive(false, "serial-error-event");
      this.lastStatusPublishKey = null;
      this.pushOperation("serial-error", err.message);
      this.setFirmwareLiveness("dead", "serial-error");
      void this.port.forceClose().catch(() => {
        /* ignore */
      });
      void this.schedulePublishStatus(err.message);
    });
    this.port.on("status-changed", () => this.schedulePublishStatusOnStructuralChange());
  }

  /** Publish status for open/close/path/baud/error — not on every bytesRead tick. */
  private schedulePublishStatusOnStructuralChange(): void {
    const st = this.port.getStatus();
    const key = `${st.isOpen}|${st.path ?? ""}|${st.baudRate ?? ""}`;
    if (key === this.lastStatusPublishKey)
    {
      return;
    }
    this.lastStatusPublishKey = key;
    this.schedulePublishStatus();
  }

  /** Avoid flooding `serialport/runtime-snapshot` on every UART chunk. */
  private schedulePublishStatus(error?: string): void {
    if (!this.hostUartSessionActive && this.port.isOpen())
    {
      return;
    }
    if (this.statusPublishDebounceTimer != null)
    {
      clearTimeout(this.statusPublishDebounceTimer);
    }
    this.statusPublishDebounceTimer = setTimeout(() => {
      this.statusPublishDebounceTimer = null;
      this.publishStatus(error);
    }, 250);
  }

  /** Treat bytes as virtual UART RX (external sim inject-rx or lab inject). */
  private simulateUartRx(bytes: Uint8Array): void {
    if (!this.hostUartSessionActive)
    {
      this.setHostUartSessionActive(true, "virtual-rx");
    }
    this.lastRxAtMs = Date.now();
    if (this.useExternalSim()) {
      this.setFirmwareLiveness("alive", "external-sim");
    }
    this.publishData(Buffer.from(bytes));
  }

  /** Drop external sim when heartbeat goes stale. */
  private refreshExternalSimPresence(): void {
    if (this.config.externalSimForced || this.externalSimLastAtMs <= 0) {
      return;
    }
    const wasUsing = this.useExternalSim();
    if (Date.now() - this.externalSimLastAtMs >= EXTERNAL_SIM_STATUS_STALE_MS) {
      this.externalSimOnline = false;
    }
    const nowUsing = this.useExternalSim();
    if (wasUsing && !nowUsing) {
      this.pushOperation("external-sim-offline", "external simulator heartbeat stale");
      this.publishDevStatus();
    }
  }

  /** Standalone bitstream-simulator announces itself on `bitstream2/sim/status`. */
  private onExternalSimStatus(payload: unknown): void {
    const status = payload as Partial<Bitstream2SimStatusPayload>;
    if (
      typeof status.role === "string" &&
      status.role.length > 0 &&
      status.role !== EXTERNAL_SIM_BROKER_ROLE
    ) {
      return;
    }
    const wasUsing = this.useExternalSim();
    this.externalSimLastAtMs = Date.now();
    this.externalSimOnline = status.connected !== false;
    const nowUsing = this.useExternalSim();
    if (!wasUsing && nowUsing) {
      this.pushOperation("external-sim-online", "external simulator detected (bitstream2/sim/status)");
      if (!this.hostUartSessionActive) {
        this.setHostUartSessionActive(true, "external-sim-status");
      }
    }
    this.publishDevStatus();
  }

  /** Publish host UART TX to the standalone bitstream-simulator process. */
  private publishSimHostTx(bytes: Uint8Array, requestId?: string): void {
    if (!this.client.isConnected() || !this.useExternalSim()) {
      return;
    }
    const payload: Bitstream2SimHostTxPayload = {
      dataB64: bytesToBase64(bytes),
      requestId: requestId ?? `bridge-host-tx-${Date.now()}`,
      atMs: Date.now(),
    };
    void this.client.publish(BITSTREAM2_TOPICS.SIM_HOST_TX, payload, 0);
  }

  private publishDevStatus(): void {
    if (!this.client.isConnected()) {
      return;
    }
    const external = this.useExternalSim();
    const payload: Bitstream2DevStatusPayload = {
      loopbackEnabled: external,
      externalSim: external ? true : undefined,
      externalSimOnline: external ? true : undefined,
      atMs: Date.now(),
    };
    void this.client.publish(BITSTREAM2_TOPICS.DEV_STATUS, payload, 0);
  }

  private publishData(buf: Buffer, encoding?: string): void {
    if (!this.hostUartSessionActive || !this.client.isConnected())
    {
      return;
    }

    if (this.config.publishRawUart || this.useExternalSim())
    {
      if (encoding != null)
      {
        const payload: SerialDataPayload = { data: buf.toString("base64"), encoding };
        void this.client.publish(SERIALPORT_TOPICS.DATA, payload, 0);
      }
      else
      {
        void this.client.publishBinary(
          SERIALPORT_TOPICS.DATA,
          new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength),
          getSerialportDataBinaryPublishQos(),
        );
      }
    }

    const atMs = Date.now();
    const events = this.bsUartDecoder.feed(
      new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength),
      atMs,
    );
    for (const ev of events) {
      if (ev.type === "hello") {
        this.onBs2HelloDecoded(ev.payload);
        continue;
      }
      if (ev.type === "sensor") {
        void this.client.publish(BITSTREAM2_TOPICS.EVT_SENSOR, ev.payload, 0);
        continue;
      }
      if (ev.type === "res_frame") {
        this.bsSession.handleFrame(ev.frame);
      }
    }
  }

  private startFirmwareLivenessMonitor(): void {
    if (this.firmwareLivenessTimer) return;
    const staleAfterMs = 3500;
    const deadAfterMs = 9000;
    this.firmwareLivenessTimer = setInterval(() => {
      if (!this.hostUartSessionActive) {
        this.setFirmwareLiveness("unknown", "host-uart-inactive");
        return;
      }
      if (!this.port.isOpen() && !this.useExternalSim()) {
        this.setFirmwareLiveness("unknown", "port-closed");
        return;
      }
      const now = Date.now();
      const last = this.lastRxAtMs ?? now;
      const gap = now - last;
      if (gap >= deadAfterMs) return this.setFirmwareLiveness("dead", "rx-inactive");
      if (gap >= staleAfterMs) return this.setFirmwareLiveness("stale", "rx-inactive");
      return this.setFirmwareLiveness("alive", "rx-active");
    }, 500);
  }

  private setFirmwareLiveness(state: FirmwareLivenessState, reason?: string): void {
    if (this.firmwareLivenessState === state) return;
    this.firmwareLivenessState = state;
    this.publishFirmwareLiveness(reason);
  }

  private publishFirmwareLiveness(reason?: string): void {
    if (!this.client.isConnected()) return;
    const payload: FirmwareLivenessPayload = {
      state: this.firmwareLivenessState,
      lastRxAtMs: this.lastRxAtMs,
      updatedAtMs: Date.now(),
      ...(reason != null && { reason }),
    };
    void this.client.publish(SERIALPORT_TOPICS.FIRMWARE_LIVENESS, payload, 0);
  }

  private startBitstream2MetricsPublisher(): void {
    if (this.bsMetricsTimer) return;
    this.bsMetricsTimer = setInterval(() => {
      if (!this.client.isConnected() || !this.hostUartSessionActive) return;
      const s = this.bsUartDecoder.getStats();
      const payload: Bitstream2MetricsPayload = {
        uartBytesIn: s.uartBytesIn,
        framesOk: s.framesOk,
        framesCrcFail: s.framesCrcFail,
        resyncByteSkips: s.resyncByteSkips,
        framesLenReject: s.framesLenReject,
        lastFrameAtMs: this.lastRxAtMs,
        lastCounterBySensorId: { ...this.bsUartDecoder.getLastCounterBySensorId() },
        atMs: Date.now(),
      };
      void this.client.publish(BITSTREAM2_TOPICS.METRICS, payload, 0);
      this.refreshExternalSimPresence();
      this.publishDevStatus();
    }, 1000);
  }

  private async onWsConnect(): Promise<void> {
    this.connectionState = "connected";
    this.pushOperation("bridge-connected", "bridge connected to websocket broker");
    await this.client.subscribe(SERIALPORT_TOPICS.LIST, 0, "json");
    await this.client.subscribe(SERIALPORT_TOPICS.OPEN, 0, "json");
    await this.client.subscribe(SERIALPORT_TOPICS.CLOSE, 0, "json");
    await this.client.subscribe(SERIALPORT_TOPICS.WRITE, 0, "json");
    await this.client.subscribe(BITSTREAM2_TOPICS.REQ, 0, "json");
    await this.client.subscribe(BITSTREAM2_TOPICS.DEV_INJECT_RX, 0, "json");
    await this.client.subscribe(BITSTREAM2_TOPICS.SIM_STATUS, 0, "json");
    /* Browser refresh: webview WS reconnects; OS COM stays open on the bridge. */
    if (this.port.isOpen() && !this.hostUartSessionActive)
    {
      this.setHostUartSessionActive(true, "ws-reconnect-reuse-open-port");
      void this.schedulePublishStatus();
      void this.onSerialSessionOpened();
    }
    else
    {
      void this.schedulePublishStatus();
    }
    this.publishDevStatus();
  }

  private async onWsMessage(topic: string, payload: unknown): Promise<void> {
    if (topic === SERIALPORT_TOPICS.LIST) {
      const req = payload as Partial<ListRequest>;
      const requestId = typeof req.requestId === "string" ? req.requestId : `list-${Date.now()}`;
      try {
        const ports = await T3DSerialPort.list();
        this.latestPorts = ports.map(toPortInfo);
        const res: ListResponse = { requestId, ports: this.latestPorts };
        await this.client.publish(SERIALPORT_TOPICS.LIST_RESPONSE, res, 0);
      } catch (e: unknown) {
        const res: ListResponse = { requestId, ports: [], error: e instanceof Error ? e.message : String(e) };
        await this.client.publish(SERIALPORT_TOPICS.LIST_RESPONSE, res, 0);
      }
      return;
    }

    if (topic === SERIALPORT_TOPICS.OPEN) {
      const req = payload as Partial<OpenRequest>;
      const requestId = typeof req.requestId === "string" ? req.requestId : `open-${Date.now()}`;
      try {
        const cfg: SerialPortConfig = {
          path: String(req.path ?? ""),
          baudRate: Number(req.baudRate ?? 0),
          mode: req.mode,
          readline: req.readline,
          readlineDelimiter: req.readlineDelimiter,
        };
        if (this.port.isOpen())
        {
          const st = this.port.getStatus();
          const samePath = st.path === cfg.path;
          const sameBaud = Number(st.baudRate) === Number(cfg.baudRate);
          if (samePath && sameBaud)
          {
            this.setHostUartSessionActive(true, "open-idempotent");
            void this.onSerialSessionOpened();
            const res: OpenResult = { requestId, success: true, leaseId: null };
            await this.client.publish(SERIALPORT_TOPICS.OPEN_RESULT, res, 0);
            return;
          }
          await this.port.close();
        }
        await this.port.open(cfg);
        this.setHostUartSessionActive(true, "open-request");
        void this.onSerialSessionOpened();
        const res: OpenResult = { requestId, success: true, leaseId: null };
        await this.client.publish(SERIALPORT_TOPICS.OPEN_RESULT, res, 0);
      } catch (e: unknown) {
        const res: OpenResult = { requestId, success: false, error: e instanceof Error ? e.message : String(e), leaseId: null };
        await this.client.publish(SERIALPORT_TOPICS.OPEN_RESULT, res, 0);
      }
      return;
    }

    if (topic === SERIALPORT_TOPICS.CLOSE) {
      const req = payload as Partial<CloseRequest>;
      const requestId = typeof req.requestId === "string" ? req.requestId : `close-${Date.now()}`;
      this.setHostUartSessionActive(false, "close-request");
      this.clearBs2HandshakeState("host-uart-closed");
      this.bsUartDecoder.reset();
      this.lastStatusPublishKey = null;
      const res: CloseResult = { requestId, success: true, leaseId: null };
      await this.client.publish(SERIALPORT_TOPICS.CLOSE_RESULT, res, 0);
      void this.finishHostPortCloseAfterAck();
      return;
    }

    if (topic === SERIALPORT_TOPICS.WRITE) {
      const req = payload as Partial<WriteRequest>;
      const requestId = typeof req.requestId === "string" ? req.requestId : `write-${Date.now()}`;
      try {
        const raw =
          typeof req.data === "string" ? base64ToBytes(req.data) : new Uint8Array(0);
        await applyDevSerialWrite({
          data: raw,
          portOpen: this.port.isOpen(),
          useExternalSim: this.useExternalSim(),
          writeToPort: async (data) => {
            await this.port.write(Buffer.from(data));
          },
          feedExternalSim: async (data) => {
            this.publishSimHostTx(data, requestId);
          },
        });
        const res: WriteResult = {
          requestId,
          success: true,
          bytesWritten: this.port.getStatus().bytesWritten,
          leaseId: null,
        };
        await this.client.publish(SERIALPORT_TOPICS.WRITE_RESULT, res, 0);
      } catch (e: unknown) {
        const res: WriteResult = { requestId, success: false, error: e instanceof Error ? e.message : String(e), leaseId: null };
        await this.client.publish(SERIALPORT_TOPICS.WRITE_RESULT, res, 0);
      }
      return;
    }

    if (topic === BITSTREAM2_TOPICS.DEV_INJECT_RX) {
      const req = payload as Partial<Bitstream2DevInjectRxPayload>;
      if (typeof req.dataB64 !== "string" || req.dataB64.length === 0) {
        return;
      }
      this.simulateUartRx(base64ToBytes(req.dataB64));
      return;
    }

    if (topic === BITSTREAM2_TOPICS.SIM_STATUS) {
      this.onExternalSimStatus(payload);
      return;
    }

    if (topic === BITSTREAM2_TOPICS.REQ) {
      const req = payload as Partial<Bitstream2HostReqPayload>;
      const requestId =
        typeof req.requestId === "string" && req.requestId.trim().length > 0
          ? req.requestId
          : `bitstream2-req-${Date.now()}`;
      const cmdId = Number(req.cmdId ?? NaN);
      if (!Number.isFinite(cmdId)) {
        const res: Bitstream2HostResPayload = {
          requestId,
          ok: false,
          error: "Invalid cmdId",
          atMs: Date.now(),
        };
        await this.client.publish(BITSTREAM2_TOPICS.RES, res, 0);
        return;
      }
      const flags = Number(req.flags ?? 0) & 0xff;
      const timeoutMs = Number(req.timeoutMs ?? 2000);

      let body = new Uint8Array(0);
      if (typeof req.bodyB64 === "string" && req.bodyB64.length > 0) {
        body = base64ToBytes(req.bodyB64);
      }

      try {
        const uartRes = await this.bsSession.sendReq({
          requestId,
          cmdId: cmdId & 0xff,
          flags,
          body,
          timeoutMs,
        });
        const res: Bitstream2HostResPayload = {
          requestId,
          ok: true,
          reqId: uartRes.reqId,
          cmdId: uartRes.cmdId,
          status: uartRes.status,
          bodyB64: uartRes.body.byteLength > 0 ? bytesToBase64(uartRes.body) : undefined,
          atMs: Date.now(),
        };
        await this.client.publish(BITSTREAM2_TOPICS.RES, res, 0);
      } catch (e: unknown) {
        const res: Bitstream2HostResPayload = {
          requestId,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
          atMs: Date.now(),
        };
        await this.client.publish(BITSTREAM2_TOPICS.RES, res, 0);
      }
      return;
    }
  }

  /** Close OS serial handle after CLOSE_RESULT so the webview does not block on hung USB. */
  private async finishHostPortCloseAfterAck(): Promise<void> {
    let closeError: string | undefined;
    try
    {
      if (this.port.isOpen())
      {
        await this.port.close();
      }
    }
    catch (e: unknown)
    {
      closeError = e instanceof Error ? e.message : String(e);
      try
      {
        await this.port.forceClose();
      }
      catch (forceErr: unknown)
      {
        const forceMsg = forceErr instanceof Error ? forceErr.message : String(forceErr);
        closeError = `${closeError}; forceClose: ${forceMsg}`;
      }
    }
    this.bsUartDecoder.reset();
    void this.schedulePublishStatus(closeError);
  }

  private onBs2HelloDecoded(payload: Bitstream2HelloPayload): void {
    this.bsLastHello = payload;
    this.bridgeHandshakeState = "passed";
    this.bridgeHandshakeLastError = null;
    void this.client.publish(BITSTREAM2_TOPICS.HELLO, payload, 0);
    this.schedulePublishStatusOnStructuralChange();
  }

  private clearBs2HandshakeState(reason: string): void {
    this.bsLastHello = null;
    this.bridgeHandshakeState = "unknown";
    this.bridgeHandshakeLastError = reason;
  }

  /** After COM open: probe firmware for BS2 HELLO (device may have sent HELLO before host opened COM). */
  private onSerialSessionOpened(): void {
    this.bridgeHandshakeState = "unknown";
    this.bridgeHandshakeLastError = "awaiting-bs2-hello";
    this.bsLastHello = null;
    void this.probeFirmwareHello();
  }

  private async probeFirmwareHello(): Promise<void> {
    if (!this.port.isOpen()) {
      return;
    }
    try {
      const probe = buildHelloProbeWireBytes();
      await this.port.write(Buffer.from(probe));
      this.pushOperation("bs2-hello-probe", "sent BS2 HELLO probe after serial open");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.pushOperation("bs2-hello-probe-failed", message);
    }
  }

  private publishStatus(error?: string): void {
    if (!this.client.isConnected())
    {
      return;
    }
    const status = statusToPayload(this.port.getStatus(), error);
    if (!this.hostUartSessionActive && status.isOpen)
    {
      return;
    }
    void this.client.publish(SERIALPORT_TOPICS.STATUS, status, 0);
    const snapshot: BridgeRuntimeSnapshotPayload = {
      timestamp: Date.now(),
      leaseId: null,
      leaseOwner: null,
      connectionState: this.connectionState,
      handshakeState: this.bridgeHandshakeState,
      handshakeLastError: this.bridgeHandshakeLastError,
      serialStatus: { ...status, updatedAt: Date.now() },
      ports: this.latestPorts,
      recentOperations: this.recentOperations,
    };
    void this.client.publish(SERIALPORT_TOPICS.RUNTIME_SNAPSHOT, snapshot, 0);
  }

  private pushOperation(type: BridgeRuntimeOperation["type"], message: string): void {
    this.recentOperations = [{ type, message, timestamp: Date.now() }, ...this.recentOperations].slice(0, 80);
    if (this.client.isConnected()) {
      void this.client.publish(SERIALPORT_TOPICS.RUNTIME_OPERATION, this.recentOperations[0], 0);
    }
  }
}

export async function startBridge(config: SerialPortBridgeConfig = {}): Promise<void> {
  if (bridgeInstance) return;
  bridgeInstance = new SerialPortWebSocketBridge(config);
  await bridgeInstance.start();
}

export async function stopBridge(): Promise<void> {
  const cur = bridgeInstance;
  bridgeInstance = null;
  if (!cur) return;
  await cur.stop();
}

