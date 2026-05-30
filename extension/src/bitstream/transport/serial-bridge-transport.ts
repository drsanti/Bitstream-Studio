import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import type { SerialRxWireWindowStats } from "../../serialport-bridge/protocol";
import { getSerialportDataBinaryPublishQos } from "../../serialport-bridge/serialDataBinaryQos";
import type { TransportAdapter, TransportState } from "./transport-adapter";
import type { T3DWsQos } from "../../websocket/T3DWebSocketServer";

interface SerialBridgeOpenRequest {
  requestId: string;
  path: string;
  baudRate: number;
  leaseId?: string;
  leaseOwner?: string;
  mode?: "data" | "line" | "both";
  readline?: boolean;
  readlineDelimiter?: string;
}

interface SerialBridgeOpenResult {
  requestId: string;
  success: boolean;
  error?: string;
  leaseId?: string | null;
}

interface SerialBridgeCloseResult {
  requestId: string;
  success: boolean;
  error?: string;
}

interface SerialBridgeWriteResult {
  requestId: string;
  success: boolean;
  error?: string;
  leaseId?: string | null;
}

interface SerialBridgeCommandRequest {
  requestId: string;
  leaseId?: string | null;
  actorToken?: string;
  frameB64: string;
  awaitAck?: boolean;
  timeoutMs?: number;
  retryCount?: number;
}

interface SerialBridgeCommandResult {
  requestId: string;
  success: boolean;
  error?: string;
  ackFrameB64?: string;
  attempts?: number;
  leaseId?: string | null;
}

interface SerialBridgeDataPayload {
  data: string;
  encoding?: string;
}

interface SerialBridgeStatusPayload {
  isOpen: boolean;
  path: string | null;
  baudRate: number | null;
  error?: string;
}

export interface SerialBridgeTransportOptions {
  wsUrl?: string;
  path: string;
  baudRate: number;
  mode?: "data" | "line" | "both";
  readline?: boolean;
  readlineDelimiter?: string;
  requestTimeoutMs?: number;
  /**
   * When true, `write()` awaits `serialport/write-result` (request/response).
   * When false, `write()` publishes and resolves immediately (fire-and-forget).
   *
   * Default: true in Node runtimes, false in browser/webview runtimes.
   */
  awaitWriteResult?: boolean;
  /**
   * Optional: receive ~1Hz snapshots of broker→client `serialport/data` chunk counts (Bitstream webview diagnostics).
   * Called with `null` when the transport closes or the sampler stops.
   */
  onWireRxWindow?: (stats: SerialRxWireWindowStats | null) => void;
}

const TOPICS = {
  OPEN: "serialport/open",
  OPEN_RESULT: "serialport/open-result",
  CLOSE: "serialport/close",
  CLOSE_RESULT: "serialport/close-result",
  WRITE: "serialport/write",
  WRITE_RESULT: "serialport/write-result",
  // New baseline command RPC (breaking rewrite).
  CMD: "serialport/cmd",
  CMD_RESULT: "serialport/cmd-result",
  DATA: "serialport/data",
  DATA_PRIORITY: "serialport/data-priority",
  STATUS: "serialport/status",
} as const;

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  const btoaFn = (globalThis as { btoa?: (s: string) => string }).btoa;
  if (typeof btoaFn !== "function") {
    throw new Error("No base64 encoder available in this runtime");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoaFn(binary);
}

function fromBase64(encoded: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(encoded, "base64"));
  }
  const atobFn = (globalThis as { atob?: (s: string) => string }).atob;
  if (typeof atobFn !== "function") {
    throw new Error("No base64 decoder available in this runtime");
  }
  const raw = atobFn(encoded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bitstream-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class SerialBridgeTransportAdapter implements TransportAdapter {
  readonly transportName = "serial-bridge-ws";

  private static readonly RX_WIRE_WINDOW_MS = 1000;

  private readonly client: T3DWebSocketClient;
  private readonly options: Required<Pick<SerialBridgeTransportOptions, "path" | "baudRate" | "requestTimeoutMs">> &
    Required<Pick<SerialBridgeTransportOptions, "awaitWriteResult">> &
    Pick<SerialBridgeTransportOptions, "mode" | "readline" | "readlineDelimiter">;
  private readonly dataHandlers = new Set<(bytes: Uint8Array) => void>();
  private readonly stateHandlers = new Set<(state: TransportState) => void>();
  private readonly pendingOpen = new Map<string, PendingRequest<void>>();
  private readonly pendingClose = new Map<string, PendingRequest<void>>();
  private readonly pendingWrite = new Map<string, PendingRequest<void>>();
  private readonly pendingWriteAwaitAck = new Map<string, PendingRequest<SerialBridgeCommandResult>>();
  private state: TransportState = "disconnected";
  private lastDisconnectReason: string | null = null;
  private leaseId: string | null = null;
  private readonly leaseOwner: string;
  private readonly actorToken: string;
  private readonly serialDataBinaryPublishQos: T3DWsQos;
  private readonly onWireRxWindow?: (stats: SerialRxWireWindowStats | null) => void;
  private rxWireMainChunks = 0;
  private rxWireMainBytes = 0;
  private rxWirePriChunks = 0;
  private rxWirePriBytes = 0;
  private rxWireTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: SerialBridgeTransportOptions) {
    const isNode =
      typeof process !== "undefined" &&
      process.versions != null &&
      typeof process.versions.node === "string";
    this.options = {
      path: options.path,
      baudRate: options.baudRate,
      mode: options.mode,
      readline: options.readline,
      readlineDelimiter: options.readlineDelimiter,
      requestTimeoutMs: Math.max(100, Math.floor(options.requestTimeoutMs ?? 5000)),
      awaitWriteResult: typeof options.awaitWriteResult === "boolean" ? options.awaitWriteResult : isNode,
    };
    this.leaseOwner = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.actorToken = this.leaseOwner;
    this.serialDataBinaryPublishQos = getSerialportDataBinaryPublishQos();
    this.onWireRxWindow = options.onWireRxWindow;

    this.client = new T3DWebSocketClient(
      {
        url: options.wsUrl ?? T3D_DEFAULT_WS_CLIENT_URL,
        autoConnect: false,
        clientIdentity: {
          role: 'bitstream-serial-bridge-transport',
          name: 'SerialBridgeTransport',
        },
      },
      {
        onConnect: () => {
          this.lastDisconnectReason = null;
          // WebSocket is up; do not set `connected` here — serial is not open until
          // `serialport/open-result` success in `open()`. Otherwise OPEN can complete before
          // onConnect runs and the first `write()` (e.g. handshake) sees `connecting` and throws.
        },
        onDisconnect: () => {
          this.stopRxWireWindow();
          if (!this.lastDisconnectReason) {
            this.lastDisconnectReason = "WebSocket connection closed";
          }
          this.setState("disconnected");
          this.rejectAllPending();
        },
        onError: (error) => {
          this.stopRxWireWindow();
          this.lastDisconnectReason = `WebSocket error: ${error.message}`;
          this.setState("error");
          this.rejectAllPending();
        },
        onMessage: (topic, payload) => {
          this.handleMessage(topic, payload);
        },
        onBinary: (topic, data, qos) => {
          this.handleBinary(topic, data, qos);
        },
      },
    );
  }

  async open(): Promise<void> {
    this.setState("connecting");
    await this.client.connect();
    // OPEN/CLOSE are request/response; use QoS1 to avoid drops under load.
    await this.client.subscribe(TOPICS.OPEN_RESULT, 1, "json");
    await this.client.subscribe(TOPICS.CLOSE_RESULT, 1, "json");
    // WRITE_RESULT is required for request/response; use QoS1 to avoid drops under load.
    await this.client.subscribe(TOPICS.WRITE_RESULT, 1, "json");
    await this.client.subscribe(TOPICS.CMD_RESULT, 1, "json");
    // Bulk Bitstream RX: binary lane (see SerialPortWebSocketBridge.publishData).
    await this.client.subscribe(TOPICS.DATA, this.serialDataBinaryPublishQos, "binary");
    // UART/readline chunks may still arrive as JSON `{ data, encoding:'utf8' }`.
    await this.client.subscribe(TOPICS.DATA, 0, "json");
    await this.client.subscribe(TOPICS.DATA_PRIORITY, 1, "binary");
    await this.client.subscribe(TOPICS.STATUS, 0, "json");

    const requestId = nextRequestId();
    const req: SerialBridgeOpenRequest = {
      requestId,
      path: this.options.path,
      baudRate: this.options.baudRate,
      leaseId: this.leaseId ?? undefined,
      leaseOwner: this.leaseOwner,
      mode: this.options.mode,
      readline: this.options.readline,
      readlineDelimiter: this.options.readlineDelimiter,
    };

    this.createPending(this.pendingOpen, requestId);
    try {
      await this.client.publish(TOPICS.OPEN, req, 1);
      await this.waitPending(this.pendingOpen, requestId);
    } catch (error) {
      this.pendingOpen.delete(requestId);
      this.setState("error");
      throw error;
    }
    this.setState("connected");
    this.startRxWireWindow();
  }

  async close(): Promise<void> {
    if (this.state === "disconnected") {
      return;
    }

    this.stopRxWireWindow();
    const requestId = nextRequestId();
    this.createPending(this.pendingClose, requestId);
    try {
      await this.client.publish(TOPICS.CLOSE, { requestId, leaseId: this.leaseId }, 1);
      await this.waitPending(this.pendingClose, requestId);
    } catch {
      // Ignore close handshake failures; transport is still torn down below.
    }

    this.clearPendingMap(this.pendingOpen);
    this.clearPendingMap(this.pendingClose);
    this.clearPendingMap(this.pendingWrite);
    this.clearPendingMap(this.pendingWriteAwaitAck);

    try {
      await this.client.unsubscribe(TOPICS.OPEN_RESULT, "json");
      await this.client.unsubscribe(TOPICS.CLOSE_RESULT, "json");
      await this.client.unsubscribe(TOPICS.WRITE_RESULT, "json");
      await this.client.unsubscribe(TOPICS.CMD_RESULT, "json");
      await this.client.unsubscribe(TOPICS.DATA, "binary");
      await this.client.unsubscribe(TOPICS.DATA, "json");
      await this.client.unsubscribe(TOPICS.DATA_PRIORITY, "binary");
      await this.client.unsubscribe(TOPICS.STATUS, "json");
    } catch {
      // Ignore if already disconnected.
    }

    await this.client.disconnect();
    this.setState("disconnected");
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (this.state !== "connected") {
      throw new Error("Serial bridge transport is not connected");
    }
    if (!this.options.awaitWriteResult) {
      await this.client.publish(
        TOPICS.WRITE,
        {
          // Intentionally omit requestId in fire-and-forget mode.
          leaseId: this.leaseId,
          actorToken: this.actorToken,
          data: toBase64(bytes),
        },
        1,
      );
      return;
    }

    const requestId = nextRequestId();
    this.createPending(this.pendingWrite, requestId);
    try {
      await this.client.publish(
        TOPICS.WRITE,
        {
          requestId,
          leaseId: this.leaseId,
          actorToken: this.actorToken,
          data: toBase64(bytes),
        },
        1,
      );
      await this.waitPending(this.pendingWrite, requestId);
    } catch (error) {
      this.pendingWrite.delete(requestId);
      throw error;
    }
  }

  /**
   * Backend-owned ACK wait path: write full Bitstream frame and await matching ACK frame.
   */
  async writeAwaitAck(
    frame: Uint8Array,
    options?: { timeoutMs?: number; retryCount?: number },
  ): Promise<Uint8Array> {
    if (this.state !== "connected") {
      throw new Error("Serial bridge transport is not connected");
    }
    const requestId = nextRequestId();
    // Avoid transport-level timeouts when firmware ACK budget exceeds the default requestTimeoutMs.
    const ackTimeoutMs = Math.max(200, Math.floor(options?.timeoutMs ?? 4000));
    const ackRetryCount = Math.max(0, Math.floor(options?.retryCount ?? 0));
    const estimatedMs =
      ackTimeoutMs * (1 + ackRetryCount) +
      // Bridge retry backoff (approx) + scheduler overhead.
      ackRetryCount * 250 +
      750;
    this.createPending(
      this.pendingWriteAwaitAck,
      requestId,
      Math.max(this.options.requestTimeoutMs, estimatedMs),
    );
    try {
      const req: SerialBridgeCommandRequest = {
        requestId,
        leaseId: this.leaseId,
        actorToken: this.actorToken,
        frameB64: toBase64(frame),
        awaitAck: true,
        timeoutMs: options?.timeoutMs,
        retryCount: options?.retryCount,
      };
      await this.client.publish(TOPICS.CMD, req, 1);
      const res = await this.waitPending(this.pendingWriteAwaitAck, requestId);
      this.pendingWriteAwaitAck.delete(requestId);
      if (!res.success) {
        throw new Error(res.error || "WriteAwaitAck failed");
      }
      if (typeof res.ackFrameB64 !== "string") {
        throw new Error("WriteAwaitAck missing ackFrameB64");
      }
      return fromBase64(res.ackFrameB64);
    } catch (error) {
      this.pendingWriteAwaitAck.delete(requestId);
      throw error;
    }
  }

  /**
   * Fire-and-forget on the CMD lane: publish a command frame to the bridge command queue,
   * but do not await ACK. This matches the current UI mode where ACK is intentionally ignored.
   */
  async writeCmd(frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }): Promise<void> {
    if (this.state !== "connected") {
      throw new Error("Serial bridge transport is not connected");
    }
    const requestId = nextRequestId();
    const req: SerialBridgeCommandRequest = {
      requestId,
      leaseId: this.leaseId,
      actorToken: this.actorToken,
      frameB64: toBase64(frame),
      timeoutMs: options?.timeoutMs,
      retryCount: options?.retryCount,
    };
    await this.client.publish(TOPICS.CMD, req, 1);
  }

  onData(handler: (bytes: Uint8Array) => void): () => void {
    this.dataHandlers.add(handler);
    return () => {
      this.dataHandlers.delete(handler);
    };
  }

  onState(handler: (state: TransportState) => void): () => void {
    this.stateHandlers.add(handler);
    handler(this.state);
    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  getLastDisconnectReason(): string | null {
    return this.lastDisconnectReason;
  }

  getTransportState(): TransportState {
    return this.state;
  }

  /** Fan-out to broker subscribers (multi-client dashboard sync). Requires an open transport. */
  async publishBrokerJson(topic: string, payload: unknown, qos: 0 | 1 = 0): Promise<void> {
    if (this.state !== "connected") {
      throw new Error("Serial bridge transport is not connected");
    }
    await this.client.publish(topic, payload, qos);
  }

  private handleBinary(topic: string, data: Uint8Array, _qos: T3DWsQos): void {
    if (topic === TOPICS.DATA) {
      this.notifyRxWireChunk(false, data.byteLength);
      for (const handler of this.dataHandlers) {
        handler(data);
      }
      return;
    }
    if (topic === TOPICS.DATA_PRIORITY) {
      this.notifyRxWireChunk(true, data.byteLength);
      for (const handler of this.dataHandlers) {
        handler(data);
      }
    }
  }

  private notifyRxWireChunk(isPriority: boolean, byteLength: number): void {
    if (!this.onWireRxWindow) {
      return;
    }
    if (isPriority) {
      this.rxWirePriChunks += 1;
      this.rxWirePriBytes += byteLength;
    } else {
      this.rxWireMainChunks += 1;
      this.rxWireMainBytes += byteLength;
    }
  }

  private flushRxWireWindow(): void {
    if (!this.onWireRxWindow) {
      return;
    }
    const qos: 0 | 1 = this.serialDataBinaryPublishQos === 0 ? 0 : 1;
    const stats: SerialRxWireWindowStats = {
      chunksMainPerSec: this.rxWireMainChunks,
      bytesMainPerSec: this.rxWireMainBytes,
      chunksPriorityPerSec: this.rxWirePriChunks,
      bytesPriorityPerSec: this.rxWirePriBytes,
      windowMs: SerialBridgeTransportAdapter.RX_WIRE_WINDOW_MS,
      updatedAtMs: Date.now(),
      bulkDataBinaryQos: qos,
    };
    this.rxWireMainChunks = 0;
    this.rxWireMainBytes = 0;
    this.rxWirePriChunks = 0;
    this.rxWirePriBytes = 0;
    this.onWireRxWindow(stats);
  }

  private startRxWireWindow(): void {
    if (!this.onWireRxWindow || this.rxWireTimer != null) {
      return;
    }
    this.rxWireTimer = setInterval(() => {
      this.flushRxWireWindow();
    }, SerialBridgeTransportAdapter.RX_WIRE_WINDOW_MS);
  }

  private stopRxWireWindow(): void {
    if (this.rxWireTimer != null) {
      clearInterval(this.rxWireTimer);
      this.rxWireTimer = null;
    }
    this.rxWireMainChunks = 0;
    this.rxWireMainBytes = 0;
    this.rxWirePriChunks = 0;
    this.rxWirePriBytes = 0;
    this.onWireRxWindow?.(null);
  }

  private handleMessage(topic: string, payload: unknown): void {
    if (topic === TOPICS.DATA) {
      const packet = payload as SerialBridgeDataPayload;
      if (!packet || typeof packet.data !== "string") {
        return;
      }
      const bytes = fromBase64(packet.data);
      this.notifyRxWireChunk(false, bytes.byteLength);
      for (const handler of this.dataHandlers) {
        handler(bytes);
      }
      return;
    }

    if (topic === TOPICS.STATUS) {
      const status = payload as Partial<SerialBridgeStatusPayload>;
      if (status && status.isOpen === false) {
        this.lastDisconnectReason =
          typeof status.error === "string" && status.error.trim().length > 0
            ? `Serial status: ${status.error}`
            : "Serial status reported closed (isOpen=false)";
        this.setState("disconnected");
      }
      return;
    }

    if (topic === TOPICS.OPEN_RESULT) {
      const res = payload as SerialBridgeOpenResult;
      if (typeof res.leaseId === "string") {
        this.leaseId = res.leaseId;
      } else if (res.leaseId === null) {
        this.leaseId = null;
      }
      this.resolvePending(this.pendingOpen, res.requestId, res.success, res.error);
      return;
    }

    if (topic === TOPICS.CLOSE_RESULT) {
      const res = payload as SerialBridgeCloseResult;
      this.resolvePending(this.pendingClose, res.requestId, res.success, res.error);
      return;
    }

    if (topic === TOPICS.WRITE_RESULT) {
      const res = payload as SerialBridgeWriteResult;
      this.resolvePending(this.pendingWrite, res.requestId, res.success, res.error);
      return;
    }

    if (topic === TOPICS.CMD_RESULT) {
      const res = payload as SerialBridgeCommandResult;
      const entry = this.pendingWriteAwaitAck.get(res.requestId);
      if (!entry) {
        return;
      }
      clearTimeout(entry.timer);
      this.pendingWriteAwaitAck.delete(res.requestId);
      if (res.success) {
        entry.resolve(res);
      } else {
        entry.reject(new Error(res.error || "WriteAwaitAck failed"));
      }
      return;
    }
  }

  private createPending<T>(
    map: Map<string, PendingRequest<T>>,
    requestId: string,
    timeoutMsOverride?: number,
  ): void {
    if (map.has(requestId)) {
      throw new Error(`Duplicate requestId in serial bridge transport: ${requestId}`);
    }

    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const timeoutMs = Math.max(
      200,
      Math.floor(
        Number.isFinite(timeoutMsOverride) ? Number(timeoutMsOverride) : this.options.requestTimeoutMs,
      ),
    );
    const timer = setTimeout(() => {
      map.delete(requestId);
      reject(new Error(`Serial bridge request timed out: ${requestId}`));
    }, timeoutMs);

    map.set(requestId, { promise, resolve, reject, timer });
  }

  private waitPending<T>(map: Map<string, PendingRequest<T>>, requestId: string): Promise<T> {
    const entry = map.get(requestId);
    if (!entry) {
      throw new Error(`Pending request not found: ${requestId}`);
    }
    return entry.promise;
  }

  private resolvePending<T>(
    map: Map<string, PendingRequest<T>>,
    requestId: string,
    success: boolean,
    error?: string,
  ): void {
    const entry = map.get(requestId);
    if (!entry) {
      return;
    }
    clearTimeout(entry.timer);
    map.delete(requestId);

    if (success) {
      entry.resolve(undefined as T);
      return;
    }

    entry.reject(new Error(error || "Serial bridge request failed"));
  }

  private clearPendingMap<T>(map: Map<string, PendingRequest<T>>): void {
    for (const req of map.values()) {
      clearTimeout(req.timer);
      req.reject(new Error("Serial bridge transport was cleared"));
    }
    map.clear();
  }

  private rejectAllPending(): void {
    this.clearPendingMap(this.pendingOpen);
    this.clearPendingMap(this.pendingClose);
    this.clearPendingMap(this.pendingWrite);
    this.clearPendingMap(this.pendingWriteAwaitAck);
  }

  private setState(next: TransportState): void {
    if (this.state === next) {
      return;
    }
    this.state = next;
    for (const handler of this.stateHandlers) {
      handler(next);
    }
  }
}
