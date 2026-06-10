import {
  BITSTREAM_TELEMETRY_PROVIDER_API_VERSION,
  BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_WS_URL,
  BITSTREAM_TELEMETRY_PROVIDER_EVENT,
  type BitstreamTelemetryProviderEnvelope,
  type BitstreamTelemetrySensorCatalog,
} from "../types";
import type { BitstreamTelemetryProviderConfigPayload } from "../build-provider-config";
import type { BitstreamTelemetryProviderSamplePayload } from "../map-provider-sample";

export type BitstreamTelemetryConnectionPayload = {
  state: "connected" | "disconnected";
  route: "uart" | "simulator";
  comOpen: boolean;
  providerReady: boolean;
};

export type BitstreamTelemetryHelloPayload = {
  version: number;
  caps: number;
  mtuSensor: number;
  mtuCtrl: number;
  fwTag?: string;
  hostMs: number;
};

export type BitstreamTelemetryResponsePayload = {
  requestId: string;
  ok: boolean;
  command: string;
  data: unknown;
  error: string | null;
  hostMs: number;
};

export type BitstreamTelemetryStalePayload = {
  sensor: string;
  lastHostMs: number;
  staleAfterMs: number;
};

export type BitstreamTelemetryClientEventMap = {
  catalog: BitstreamTelemetrySensorCatalog;
  config: BitstreamTelemetryProviderConfigPayload;
  sample: BitstreamTelemetryProviderSamplePayload;
  connection: BitstreamTelemetryConnectionPayload;
  hello: BitstreamTelemetryHelloPayload;
  stale: BitstreamTelemetryStalePayload;
  response: BitstreamTelemetryResponsePayload;
};

export type BitstreamTelemetryClientOptions = {
  url?: string;
  /** Auto-reconnect delay when the socket closes (ms). 0 disables. */
  reconnectMs?: number;
};

type Handler<T> = (payload: T) => void;

function randomRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Browser / Node WebSocket client for the public telemetry provider (R0 + R1).
 * Copy this file into external apps or import from the Bitstream Studio repo.
 */
export class BitstreamTelemetryClient {
  private readonly url: string;
  private readonly reconnectMs: number;
  private ws: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private readonly handlers = new Map<string, Set<Handler<unknown>>>();
  private readonly pendingCommands = new Map<
    string,
    {
      resolve: (payload: BitstreamTelemetryResponsePayload) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  constructor(options: BitstreamTelemetryClientOptions = {}) {
    this.url = options.url ?? BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_WS_URL;
    this.reconnectMs = options.reconnectMs ?? 2000;
  }

  on<K extends keyof BitstreamTelemetryClientEventMap>(
    event: K,
    handler: Handler<BitstreamTelemetryClientEventMap[K]>,
  ): () => void {
    const key = event as string;
    let set = this.handlers.get(key);
    if (set == null) {
      set = new Set();
      this.handlers.set(key, set);
    }
    set.add(handler as Handler<unknown>);
    return () => set?.delete(handler as Handler<unknown>);
  }

  off<K extends keyof BitstreamTelemetryClientEventMap>(
    event: K,
    handler: Handler<BitstreamTelemetryClientEventMap[K]>,
  ): void {
    this.handlers.get(event as string)?.delete(handler as Handler<unknown>);
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    if (this.connectPromise != null) {
      return this.connectPromise;
    }
    this.connectPromise = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.addEventListener("open", () => {
        this.connectPromise = null;
        resolve();
      });

      ws.addEventListener("message", (event) => {
        this.handleMessage(event.data);
      });

      ws.addEventListener("error", () => {
        if (this.connectPromise != null) {
          this.connectPromise = null;
          reject(new Error(`WebSocket error: ${this.url}`));
        }
      });

      ws.addEventListener("close", () => {
        this.ws = null;
        this.connectPromise = null;
        this.emit("connection", {
          state: "disconnected",
          route: "simulator",
          comOpen: false,
          providerReady: false,
        });
        if (this.reconnectMs > 0) {
          setTimeout(() => {
            void this.connect().catch(() => {
              // retry on next close
            });
          }, this.reconnectMs);
        }
      });
    });
    return this.connectPromise;
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    for (const pending of this.pendingCommands.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("client disconnected"));
    }
    this.pendingCommands.clear();
  }

  request(what: "catalog" | "config" | "connection" | "hello"): void {
    this.send({
      type: BITSTREAM_TELEMETRY_PROVIDER_EVENT.REQUEST,
      v: BITSTREAM_TELEMETRY_PROVIDER_API_VERSION,
      payload: { requestId: randomRequestId("req"), what },
    });
  }

  command(
    command: string,
    args: Record<string, unknown> = {},
    timeoutMs = 5000,
  ): Promise<BitstreamTelemetryResponsePayload> {
    const requestId = randomRequestId("cmd");
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCommands.delete(requestId);
        reject(new Error(`command timeout: ${command}`));
      }, timeoutMs);
      this.pendingCommands.set(requestId, { resolve, reject, timer });
      this.send({
        type: BITSTREAM_TELEMETRY_PROVIDER_EVENT.COMMAND,
        v: BITSTREAM_TELEMETRY_PROVIDER_API_VERSION,
        payload: { requestId, command, args },
      });
    });
  }

  private send(envelope: BitstreamTelemetryProviderEnvelope): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error("BitstreamTelemetryClient is not connected");
    }
    this.ws.send(JSON.stringify(envelope));
  }

  private handleMessage(raw: unknown): void {
    let msg: BitstreamTelemetryProviderEnvelope;
    try {
      msg = JSON.parse(String(raw)) as BitstreamTelemetryProviderEnvelope;
    } catch {
      return;
    }
    if (msg.v !== BITSTREAM_TELEMETRY_PROVIDER_API_VERSION || typeof msg.type !== "string") {
      return;
    }

    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.RESPONSE) {
      const payload = msg.payload as BitstreamTelemetryResponsePayload;
      const pending = this.pendingCommands.get(payload.requestId);
      if (pending != null) {
        clearTimeout(pending.timer);
        this.pendingCommands.delete(payload.requestId);
        pending.resolve(payload);
      }
      this.emit("response", payload);
      return;
    }

    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.CATALOG) {
      this.emit("catalog", msg.payload as BitstreamTelemetrySensorCatalog);
      return;
    }
    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONFIG) {
      this.emit("config", msg.payload as BitstreamTelemetryProviderConfigPayload);
      return;
    }
    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.SAMPLE) {
      this.emit("sample", msg.payload as BitstreamTelemetryProviderSamplePayload);
      return;
    }
    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONNECTION) {
      this.emit("connection", msg.payload as BitstreamTelemetryConnectionPayload);
      return;
    }
    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.HELLO) {
      this.emit("hello", msg.payload as BitstreamTelemetryHelloPayload);
      return;
    }
    if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.STALE) {
      this.emit("stale", msg.payload as BitstreamTelemetryStalePayload);
    }
  }

  private emit<K extends keyof BitstreamTelemetryClientEventMap>(
    event: K,
    payload: BitstreamTelemetryClientEventMap[K],
  ): void {
    const set = this.handlers.get(event as string);
    if (set == null) {
      return;
    }
    for (const handler of set) {
      (handler as Handler<BitstreamTelemetryClientEventMap[K]>)(payload);
    }
  }
}
