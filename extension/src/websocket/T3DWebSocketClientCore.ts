import type {
  JsonInboundMessage,
  JsonOutboundMessage,
  T3DWsChannel,
  T3DWsClientIdentity,
  T3DWsQos,
} from './T3DWebSocketServer';
import type { WsTransport } from './transport/types';
import type {
  ConnectionState,
  WebSocketClientConfig,
  WebSocketClientCallbacks,
  Subscription,
} from './T3DWebSocketClient';

type PendingBinaryHeader = {
  topic: string;
  size: number;
  qos: T3DWsQos;
  messageId?: number;
};

type PendingRequest =
  | {
      kind: 'subscribe';
      key: string;
      topic: string;
      channel: T3DWsChannel;
      resolve: () => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  | {
      kind: 'unsubscribe';
      key: string;
      topic: string;
      channel?: T3DWsChannel;
      resolve: () => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    };

type IncomingQoS2 = {
  topic: string;
  channel: T3DWsChannel;
  receivedAt: number;
};

/**
 * Simple event emitter for cross-platform compatibility.
 * Replaces Node's EventEmitter so the client works in browser/webview.
 */
class SimpleEventEmitter {
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  once(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  off(event: string, listener: (...args: any[]) => void): this {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of set) {
        try {
          listener(...args);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      }
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}

function safeParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

function isValidQos(qos: unknown): qos is T3DWsQos {
  return qos === 0 || qos === 1 || qos === 2;
}

function isValidChannel(ch: unknown): ch is T3DWsChannel {
  return ch === 'json' || ch === 'binary';
}

/**
 * Core WebSocket client implementation (transport-agnostic).
 * Handles protocol logic, subscriptions, QoS, reconnection, etc.
 */
export class T3DWebSocketClientCore extends SimpleEventEmitter {
  private transport: WsTransport | null = null;
  private config: Required<Omit<WebSocketClientConfig, 'clientIdentity'>> & {
    clientIdentity?: T3DWsClientIdentity;
  };
  private callbacks: WebSocketClientCallbacks = {};

  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly subscriptions = new Map<string, Subscription>(); // key = `${channel}:${topic}`
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private pendingBinaryHeader: PendingBinaryHeader | null = null;

  private readonly incomingQoS2 = new Map<number, IncomingQoS2>(); // messageId -> state

  constructor(config: WebSocketClientConfig, transport: WsTransport) {
    super();
    this.config = {
      url: config.url,
      autoConnect: config.autoConnect ?? true,
      reconnectPeriod: config.reconnectPeriod ?? 1000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      connectTimeout: config.connectTimeout ?? 15000,
      pingInterval: config.pingInterval ?? 0,
      requestTimeout: config.requestTimeout ?? 5000,
      ...(config.clientIdentity ? { clientIdentity: config.clientIdentity } : {}),
    };
    this.transport = transport;
    this.setupTransportHandlers();
  }

  setCallbacks(callbacks: WebSocketClientCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getConfig(): WebSocketClientConfig {
    return { ...this.config };
  }

  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private setupTransportHandlers(): void {
    if (!this.transport) return;

    this.transport.onOpen = () => {
      if (this.connectTimeoutTimer) {
        clearTimeout(this.connectTimeoutTimer);
        this.connectTimeoutTimer = null;
      }
      this.reconnectAttempts = 0;
      this.transitionState('connected');
      this.startPing();

      this.sendClientHelloIfConfigured();

      this.callbacks.onConnect?.();
      this.emit('connect');

      // Re-subscribe to all remembered subscriptions (best-effort).
      for (const [, sub] of this.subscriptions) {
        this.sendJson({
          type: 'subscribe',
          topic: sub.topic,
          qos: sub.qos,
          channel: sub.channel,
        });
      }
    };

    this.transport.onMessage = (data: string | Uint8Array, isBinary: boolean) => {
      if (isBinary) {
        this.handleBinary(data as Uint8Array);
        return;
      }
      const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
      const parsed = safeParseJson(text);
      if (!parsed.ok) {
        this.handleError(new Error('Invalid JSON received from server'));
        return;
      }
      this.handleMessage(parsed.value);
    };

    this.transport.onError = (err) => {
      this.handleError(err);
    };

    this.transport.onClose = () => {
      if (this.connectTimeoutTimer) {
        clearTimeout(this.connectTimeoutTimer);
        this.connectTimeoutTimer = null;
      }
      this.stopPing();
      // Don't set transport to null - it can be reused for reconnection

      const wasConnected = this.connectionState === 'connected';
      this.transitionState('disconnected');
      if (wasConnected) {
        this.callbacks.onDisconnect?.();
        this.emit('disconnect');
      }

      this.failAllPendingRequests(new Error('Disconnected'));
      this.scheduleReconnect();
    };
  }

  async connect(): Promise<void> {
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }

    if (this.transport.readyState === 1 || this.transport.readyState === 0) {
      return; // Already connected or connecting
    }

    this.cancelReconnect();
    this.transitionState(this.connectionState === 'reconnecting' ? 'reconnecting' : 'connecting');

    const cleanupConnectTimers = () => {
      if (this.connectTimeoutTimer) {
        clearTimeout(this.connectTimeoutTimer);
        this.connectTimeoutTimer = null;
      }
    };

    this.connectTimeoutTimer = setTimeout(() => {
      this.transport?.close();
      cleanupConnectTimers();
      const err = new Error(`WebSocket connect timeout after ${this.config.connectTimeout}ms`);
      this.handleError(err);
      throw err;
    }, this.config.connectTimeout);

    try {
      await this.transport.connect();
      cleanupConnectTimers();
    } catch (err) {
      cleanupConnectTimers();
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.cancelReconnect();
    this.stopPing();
    this.failAllPendingRequests(new Error('Disconnected'));

    if (!this.transport) {
      this.transitionState('disconnected');
      return;
    }

    const transport = this.transport;
    this.transport = null;

    transport.close();

    // Give transport a moment to close
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 50);
    });

    this.transitionState('disconnected');
  }

  async reconnect(): Promise<void> {
    this.cancelReconnect();
    this.reconnectAttempts = 0;
    this.transitionState('reconnecting');
    await this.connect();
  }

  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).map((s) => ({ ...s }));
  }

  isSubscribed(topic: string, channel: T3DWsChannel = 'json'): boolean {
    return this.subscriptions.has(`${channel}:${topic}`);
  }

  async subscribe(topic: string, qos: T3DWsQos = 0, channel: T3DWsChannel = 'json'): Promise<void> {
    if (!isValidQos(qos)) throw new Error(`Invalid qos: ${qos}`);
    if (!isValidChannel(channel)) throw new Error(`Invalid channel: ${String(channel)}`);

    const key = `${channel}:${topic}`;
    // remember intent (even if disconnected; will re-subscribe on connect)
    this.subscriptions.set(key, { topic, qos, channel, subscribedAt: Date.now() });

    if (!this.transport || this.transport.readyState !== 1) {
      // offline subscribe: resolved immediately; will sync on connect
      return;
    }

    // Replace any existing pending request for same key
    this.clearPendingRequest(key);

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(key);
        reject(new Error(`Subscribe timeout: ${topic} (${channel})`));
      }, this.config.requestTimeout);

      this.pendingRequests.set(key, {
        kind: 'subscribe',
        key,
        topic,
        channel,
        resolve,
        reject,
        timer,
      });

      this.sendJson({ type: 'subscribe', topic, qos, channel });
    });
  }

  async unsubscribe(topic: string, channel?: T3DWsChannel): Promise<void> {
    if (channel && !isValidChannel(channel)) throw new Error(`Invalid channel: ${String(channel)}`);

    if (channel) {
      this.subscriptions.delete(`${channel}:${topic}`);
    } else {
      this.subscriptions.delete(`json:${topic}`);
      this.subscriptions.delete(`binary:${topic}`);
    }

    if (!this.transport || this.transport.readyState !== 1) {
      return;
    }

    const key = `unsub:${channel ?? 'both'}:${topic}`;
    this.clearPendingRequest(key);

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(key);
        reject(new Error(`Unsubscribe timeout: ${topic}`));
      }, this.config.requestTimeout);

      this.pendingRequests.set(key, {
        kind: 'unsubscribe',
        key,
        topic,
        channel,
        resolve,
        reject,
        timer,
      });

      this.sendJson({ type: 'unsubscribe', topic, channel });
    });
  }

  async publish(
    topic: string,
    payload: unknown,
    qos: T3DWsQos = 0,
    publishOpts?: { correlationId?: string }
  ): Promise<void> {
    if (!isValidQos(qos)) throw new Error(`Invalid qos: ${qos}`);
    if (!this.transport || this.transport.readyState !== 1) {
      throw new Error('Not connected');
    }

    const correlationId = publishOpts?.correlationId;
    // Note: server currently does not ack client-published messages with matching ids.
    this.sendJson({
      type: 'publish',
      topic,
      payload,
      qos,
      ...(correlationId ? { correlationId } : {}),
    } as JsonInboundMessage);
  }

  async publishBinary(topic: string, data: Uint8Array, qos: T3DWsQos = 0): Promise<void> {
    if (!isValidQos(qos)) throw new Error(`Invalid qos: ${qos}`);
    if (!this.transport || this.transport.readyState !== 1) {
      throw new Error('Not connected');
    }

    this.sendJson({ type: 'binary', topic, size: data.length, qos } as JsonInboundMessage);
    this.sendBinary(data);
  }

  // ===== internal message handling =====

  private handleMessage(raw: unknown): void {
    if (!raw || typeof raw !== 'object') {
      this.handleError(new Error('Invalid message shape received from server'));
      return;
    }
    const msg = raw as Partial<JsonOutboundMessage> & { type?: unknown };
    if (typeof msg.type !== 'string') {
      this.handleError(new Error('Missing message type received from server'));
      return;
    }

    switch (msg.type) {
      case 'pong':
        // keepalive ok
        return;

      case 'error': {
        const err = new Error(
          typeof (msg as any).error === 'string' ? (msg as any).error : 'Server error'
        );
        this.handleError(err);
        return;
      }

      case 'suback': {
        const topic = (msg as any).topic;
        const qos = (msg as any).qos as T3DWsQos;
        const channel = (msg as any).channel as T3DWsChannel;
        if (typeof topic !== 'string' || !isValidQos(qos) || !isValidChannel(channel)) return;

        const key = `${channel}:${topic}`;
        const pending = this.pendingRequests.get(key);
        if (pending && pending.kind === 'subscribe') {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(key);
          pending.resolve();
        }

        // update remembered subscription qos
        const sub = this.subscriptions.get(key);
        if (sub) this.subscriptions.set(key, { ...sub, qos });

        this.callbacks.onSubscribe?.(topic, qos, channel);
        this.emit('subscribe', { topic, qos, channel });
        return;
      }

      case 'unsuback': {
        const topic = (msg as any).topic;
        const channel = (msg as any).channel as T3DWsChannel | 'both';
        if (typeof topic !== 'string') return;

        const key = `unsub:${channel}:${topic}`;
        const pending = this.pendingRequests.get(key);
        if (pending && pending.kind === 'unsubscribe') {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(key);
          pending.resolve();
        } else {
          // also accept matching `both` key when server says both
          const key2 = `unsub:both:${topic}`;
          const p2 = this.pendingRequests.get(key2);
          if (p2 && p2.kind === 'unsubscribe') {
            clearTimeout(p2.timer);
            this.pendingRequests.delete(key2);
            p2.resolve();
          }
        }

        this.callbacks.onUnsubscribe?.(topic, channel === 'both' ? undefined : channel);
        this.emit('unsubscribe', { topic, channel });
        return;
      }

      case 'message': {
        const topic = (msg as any).topic;
        const payload = (msg as any).payload;
        const qos = (msg as any).qos as T3DWsQos;
        const messageId = (msg as any).messageId as number | undefined;
        if (typeof topic !== 'string' || !isValidQos(qos)) return;

        this.callbacks.onMessage?.(topic, payload, qos);
        this.emit('message', { topic, payload, qos });

        // Ack broker->client QoS deliveries
        if (qos === 1 && typeof messageId === 'number') {
          this.sendJson({ type: 'puback', messageId } as JsonInboundMessage);
        } else if (qos === 2 && typeof messageId === 'number') {
          this.incomingQoS2.set(messageId, {
            topic,
            channel: 'json',
            receivedAt: Date.now(),
          });
          this.sendJson({ type: 'pubrec', messageId } as JsonInboundMessage);
        }
        return;
      }

      case 'binary': {
        const topic = (msg as any).topic;
        const size = (msg as any).size;
        const qos = (msg as any).qos as T3DWsQos;
        const messageId = (msg as any).messageId as number | undefined;
        if (typeof topic !== 'string' || typeof size !== 'number' || !isValidQos(qos)) return;

        this.pendingBinaryHeader = { topic, size, qos, messageId };
        return;
      }

      // QoS2 handshake continuations (broker->client)
      case 'pubrel': {
        const messageId = (msg as any).messageId as number | undefined;
        if (typeof messageId !== 'number') return;
        if (this.incomingQoS2.has(messageId)) {
          this.incomingQoS2.delete(messageId);
          this.sendJson({ type: 'pubcomp', messageId } as JsonInboundMessage);
        } else {
          // best-effort anyway
          this.sendJson({ type: 'pubcomp', messageId } as JsonInboundMessage);
        }
        return;
      }

      // The remaining ack types are primarily server-side in this broker design.
      case 'puback':
      case 'pubrec':
      case 'pubcomp':
        return;

      default:
        return;
    }
  }

  private handleBinary(data: Uint8Array): void {
    const header = this.pendingBinaryHeader;
    if (!header) {
      this.handleError(new Error('Binary frame received without prior header'));
      return;
    }
    this.pendingBinaryHeader = null;

    // ignore mismatch, but surface to user
    if (header.size !== data.length) {
      this.handleError(
        new Error(`Binary size mismatch: expected ${header.size}, got ${data.length}`)
      );
    }

    this.callbacks.onBinary?.(header.topic, data, header.qos);
    this.emit('binary', { topic: header.topic, size: data.length, qos: header.qos });

    // Ack broker->client QoS deliveries for binary
    if (header.qos === 1 && typeof header.messageId === 'number') {
      this.sendJson({ type: 'puback', messageId: header.messageId } as JsonInboundMessage);
    } else if (header.qos === 2 && typeof header.messageId === 'number') {
      this.incomingQoS2.set(header.messageId, {
        topic: header.topic,
        channel: 'binary',
        receivedAt: Date.now(),
      });
      this.sendJson({ type: 'pubrec', messageId: header.messageId } as JsonInboundMessage);
    }
  }

  private sendJson(message: JsonInboundMessage): void {
    if (!this.transport || this.transport.readyState !== 1) return;
    try {
      this.transport.sendText(JSON.stringify(message));
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /** Registers `clientIdentity` with the broker (must run before subscriptions for accurate broker logs). */
  private sendClientHelloIfConfigured(): void {
    const id = this.config.clientIdentity;
    if (!id || !this.transport || this.transport.readyState !== 1) return;

    const hello: Record<string, unknown> = { type: 'hello' };
    if (id.role) hello.role = id.role;
    if (id.name) hello.name = id.name;
    if (id.instance) hello.instance = id.instance;
    if (id.meta && Object.keys(id.meta).length > 0) hello.meta = id.meta;

    if (Object.keys(hello).length <= 1) return;

    this.sendJson(hello as JsonInboundMessage);
  }

  private sendBinary(data: Uint8Array): void {
    if (!this.transport || this.transport.readyState !== 1) return;
    try {
      this.transport.sendBinary(data);
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private startPing(): void {
    this.stopPing();
    if (this.config.pingInterval <= 0) return;
    this.pingTimer = setInterval(() => {
      if (this.transport && this.transport.readyState === 1) {
        this.sendJson({ type: 'ping' } as JsonInboundMessage);
      }
    }, this.config.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    // only auto-reconnect when autoConnect is enabled
    if (!this.config.autoConnect) return;

    // Don't reconnect if already connected/connecting
    if (this.transport && (this.transport.readyState === 1 || this.transport.readyState === 0)) {
      return;
    }

    const max = this.config.maxReconnectAttempts;
    if (max >= 0 && this.reconnectAttempts >= max) {
      this.transitionState('error');
      this.handleError(new Error(`Max reconnect attempts reached (${max})`));
      return;
    }

    this.transitionState('reconnecting');
    this.reconnectAttempts += 1;
    this.callbacks.onReconnect?.(this.reconnectAttempts);
    this.emit('reconnect', { attempt: this.reconnectAttempts });

    const delay = this.config.reconnectPeriod * Math.pow(2, Math.max(0, this.reconnectAttempts - 1));

    this.cancelReconnect();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.attemptReconnect();
    }, delay);
  }

  private async attemptReconnect(): Promise<void> {
    try {
      await this.connect();
    } catch {
      // connect() already emitted error; schedule next attempt
      this.scheduleReconnect();
    }
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private transitionState(next: ConnectionState): void {
    if (this.connectionState === next) return;
    this.connectionState = next;
    this.callbacks.onStateChange?.(next);
    this.emit('state', next);
  }

  private handleError(err: Error): void {
    this.callbacks.onError?.(err);
    this.emit('error', err);
  }

  private clearPendingRequest(key: string): void {
    const pending = this.pendingRequests.get(key);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pendingRequests.delete(key);
  }

  private failAllPendingRequests(err: Error): void {
    for (const [key, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      try {
        pending.reject(err);
      } catch {
        // ignore
      }
      this.pendingRequests.delete(key);
    }
  }
}
