import { EventEmitter } from 'events';
import { createServer } from 'net';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';

import { T3D_WS_BROKER_MONITOR_TOPIC, type BrokerMonitorBody } from './broker-monitor-events';
import { T3D_DEFAULT_SERVER_CONFIG } from './T3DWebSocketConfig';

export type T3DWsQos = 0 | 1 | 2;
export type T3DWsChannel = 'json' | 'binary';

export interface WebSocketServerConfig {
  port?: number;
  host?: string;
  /**
   * When true, the server does not echo a publish back to the sender.
   * Default: true
   */
  noEcho?: boolean;
  /**
   * QoS retransmit base delay in ms (exponential backoff).
   * Default: 1000
   */
  qosRetryBaseDelayMs?: number;
  /**
   * Max QoS retransmit attempts.
   * Default: 3
   */
  qosMaxRetries?: number;
  /**
   * When true, clients subscribed to `t3d/broker/monitor` receive broker telemetry (JSON qos 0).
   * Default: true
   */
  broadcastBrokerEvents?: boolean;
  /**
   * When true, emit monitor rows for every publish (very high volume on topics like serialport/data).
   * Default: false
   */
  brokerMonitorIncludePublishes?: boolean;
}

export interface ServerStatus {
  running: boolean;
  port: number | null;
  host: string | null;
  uptime: number;
  connections: number;
  topics: number;
  messagesReceived: number;
  messagesSent: number;
}

export interface ClientSubscription {
  topic: string; // may contain MQTT wildcards + and #
  qos: T3DWsQos;
  subscribedAt: number;
}

/** Declared by clients via `{ type: 'hello', ... }` after connect; used in logs and admin listings. */
export interface T3DWsClientIdentity {
  role?: string;
  name?: string;
  instance?: string;
  meta?: Record<string, string>;
}

export interface ClientInfo {
  id: string;
  connected: boolean;
  connectedAt: number;
  subscriptions: Map<string, ClientSubscription>;
  jsonSubscriptions: Set<string>;
  binarySubscriptions: Set<string>;
  identity?: T3DWsClientIdentity;
}

/** Payload for the server's `message-published` event (and console logging). */
export interface T3DWsMessagePublishedInfo {
  channel: T3DWsChannel;
  topic: string;
  qos: T3DWsQos;
  /** Broker-assigned WebSocket session id of the publisher (if any). */
  from?: string;
  /** Self-reported client labels when the publisher sent `hello`. */
  publisher?: T3DWsClientIdentity;
  /** Optional per-publish id from the client's `publish.correlationId`. */
  correlationId?: string;
}

export type JsonInboundMessage =
  | {
      type: 'subscribe';
      topic: string;
      qos?: T3DWsQos;
      channel?: T3DWsChannel;
    }
  | {
      type: 'unsubscribe';
      topic: string;
      channel?: T3DWsChannel;
    }
  | {
      type: 'publish';
      topic: string;
      payload: unknown;
      qos?: T3DWsQos;
      correlationId?: string;
    }
  | {
      type: 'hello';
      role?: string;
      name?: string;
      instance?: string;
      meta?: Record<string, unknown>;
    }
  | {
      type: 'binary';
      topic: string;
      size: number;
      qos?: T3DWsQos;
    }
  | {
      type: 'ping';
    }
  | {
      type: 'puback';
      messageId: number;
    }
  | {
      type: 'pubrec';
      messageId: number;
    }
  | {
      type: 'pubrel';
      messageId: number;
    }
  | {
      type: 'pubcomp';
      messageId: number;
    };

export type JsonOutboundMessage =
  | {
      type: 'message';
      topic: string;
      payload: unknown;
      qos: T3DWsQos;
      messageId?: number;
      from?: string;
      correlationId?: string;
    }
  | {
      type: 'binary';
      topic: string;
      size: number;
      qos: T3DWsQos;
      messageId?: number;
      from?: string;
    }
  | {
      type: 'suback';
      topic: string;
      qos: T3DWsQos;
      channel: T3DWsChannel;
    }
  | {
      type: 'unsuback';
      topic: string;
      channel: T3DWsChannel | 'both';
    }
  | {
      type: 'pong';
    }
  | {
      type: 'error';
      error: string;
      details?: unknown;
    }
  | {
      type: 'puback';
      messageId: number;
    }
  | {
      type: 'pubrec';
      messageId: number;
    }
  | {
      type: 'pubrel';
      messageId: number;
    }
  | {
      type: 'pubcomp';
      messageId: number;
    };

type PendingBinaryHeader = {
  topic: string;
  size: number;
  qos: T3DWsQos;
};

type OutgoingPendingState =
  | { phase: 'qos1_pub_sent' }
  | { phase: 'qos2_pub_sent' }
  | { phase: 'qos2_pubrec_received' }
  | { phase: 'qos2_pubrel_sent' };

type OutgoingPending = {
  clientId: string;
  channel: T3DWsChannel;
  topic: string;
  qos: T3DWsQos;
  messageId: number;
  createdAt: number;
  retries: number;
  timer: NodeJS.Timeout | null;
  // For json channel
  jsonPayload?: unknown;
  jsonCorrelationId?: string;
  // For binary channel
  binaryPayload?: Buffer;
  state: OutgoingPendingState;
};

/**
 * Check if a TCP port is available.
 */
function isPortAvailable(port: number, host?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

function safeParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

const WS_LABEL_MAX = 64;
const WS_META_KEY_MAX = 32;
const WS_META_VALUE_MAX = 128;
const WS_META_MAX_KEYS = 8;
const WS_CORRELATION_MAX = 64;

function sanitizeWsLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim().slice(0, WS_LABEL_MAX);
  if (!t) return undefined;
  if (!/^[\w\-./@:+ ]+$/.test(t)) return undefined;
  return t;
}

function sanitizeWsMetaEntry(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim().slice(0, WS_META_VALUE_MAX);
  return t || undefined;
}

function sanitizeCorrelationId(value: unknown): string | undefined {
  const s = sanitizeWsLabel(value);
  if (!s || s.length > WS_CORRELATION_MAX) return undefined;
  return s;
}

function sanitizeHelloIdentity(msg: Record<string, unknown>): T3DWsClientIdentity | undefined {
  const role = sanitizeWsLabel(msg.role);
  const name = sanitizeWsLabel(msg.name);
  const instance = sanitizeWsLabel(msg.instance);

  let meta: Record<string, string> | undefined;
  const rawMeta = msg.meta;
  if (rawMeta && typeof rawMeta === 'object' && rawMeta !== null && !Array.isArray(rawMeta)) {
    const out: Record<string, string> = {};
    let n = 0;
    for (const [k, v] of Object.entries(rawMeta)) {
      if (n >= WS_META_MAX_KEYS) break;
      const kk = sanitizeWsLabel(k)?.slice(0, WS_META_KEY_MAX);
      const vv = sanitizeWsMetaEntry(v);
      if (kk && vv !== undefined) {
        out[kk] = vv;
        n += 1;
      }
    }
    if (Object.keys(out).length > 0) meta = out;
  }

  if (!role && !name && !instance && !meta) return undefined;
  return {
    ...(role ? { role } : {}),
    ...(name ? { name } : {}),
    ...(instance ? { instance } : {}),
    ...(meta ? { meta } : {}),
  };
}

/**
 * WebSocket Broker Server.
 *
 * - Multiple clients
 * - Topic-based pub/sub for JSON messages (MQTT-like wildcards)
 * - Binary streaming routed by topic (header JSON + next binary frame)
 * - QoS 0/1/2 (best-effort, in-memory only)
 */
export class T3DWebSocketServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private config: Required<WebSocketServerConfig>;
  private startTime: number | null = null;

  private readonly clients = new Map<
    string,
    ClientInfo & {
      ws: WebSocket;
      pendingBinaryHeader: PendingBinaryHeader | null;
      outgoingPending: Map<number, OutgoingPending>;
    }
  >();

  private messageCounter = 1;
  private readonly stats = {
    messagesReceived: 0,
    messagesSent: 0,
  };

  constructor(config?: WebSocketServerConfig) {
    super();
    this.config = {
      port: config?.port ?? T3D_DEFAULT_SERVER_CONFIG.port,
      host: config?.host ?? T3D_DEFAULT_SERVER_CONFIG.host,
      noEcho: config?.noEcho ?? T3D_DEFAULT_SERVER_CONFIG.noEcho,
      qosRetryBaseDelayMs:
        config?.qosRetryBaseDelayMs ?? T3D_DEFAULT_SERVER_CONFIG.qosRetryBaseDelayMs,
      qosMaxRetries: config?.qosMaxRetries ?? T3D_DEFAULT_SERVER_CONFIG.qosMaxRetries,
      broadcastBrokerEvents:
        config?.broadcastBrokerEvents ?? T3D_DEFAULT_SERVER_CONFIG.broadcastBrokerEvents,
      brokerMonitorIncludePublishes:
        config?.brokerMonitorIncludePublishes ??
        T3D_DEFAULT_SERVER_CONFIG.brokerMonitorIncludePublishes,
    };
  }

  async start(config?: WebSocketServerConfig): Promise<void> {
    if (this.isRunning()) {
      return;
    }

    this.config = {
      port: config?.port ?? this.config.port,
      host: config?.host ?? this.config.host,
      noEcho: config?.noEcho ?? this.config.noEcho,
      qosRetryBaseDelayMs: config?.qosRetryBaseDelayMs ?? this.config.qosRetryBaseDelayMs,
      qosMaxRetries: config?.qosMaxRetries ?? this.config.qosMaxRetries,
      broadcastBrokerEvents:
        config?.broadcastBrokerEvents ?? this.config.broadcastBrokerEvents,
      brokerMonitorIncludePublishes:
        config?.brokerMonitorIncludePublishes ?? this.config.brokerMonitorIncludePublishes,
    };

    const portOk = await isPortAvailable(this.config.port, this.config.host);
    if (!portOk) {
      const err = new Error(
        `Port already in use: ${this.config.host}:${this.config.port}`
      ) as NodeJS.ErrnoException;
      err.code = 'EADDRINUSE';
      this.emit('error', err);
      throw err;
    }

    const wss = new WebSocketServer({ port: this.config.port, host: this.config.host });
    this.wss = wss;
    try {
      await new Promise<void>((resolve, reject) => {
        const onListen = () => {
          wss.off('error', onErr);
          resolve();
        };
        const onErr = (err: Error) => {
          wss.off('listening', onListen);
          reject(err);
        };
        wss.once('listening', onListen);
        wss.once('error', onErr);
      });
    } catch (e) {
      try {
        wss.close();
      } catch {
        /* ignore */
      }
      this.wss = null;
      throw e;
    }

    wss.on('connection', (ws) => this.handleConnection(ws));
    wss.on('error', (err) => this.emit('error', err));
    wss.on('close', () => this.emit('status-changed', this.getStatus()));

    this.startTime = Date.now();
    this.emit('status-changed', this.getStatus());
  }

  stop(): void {
    try {
      for (const [, client] of this.clients) {
        for (const [, pending] of client.outgoingPending) {
          if (pending.timer) {
            clearTimeout(pending.timer);
          }
        }
        client.outgoingPending.clear();
        try {
          client.ws.close();
        } catch {
          // ignore
        }
      }
      this.clients.clear();

      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }
      this.startTime = null;
      this.emit('status-changed', this.getStatus());
    } catch (err) {
      this.emit('error', err);
    }
  }

  async restart(config?: WebSocketServerConfig): Promise<void> {
    this.stop();
    await new Promise((r) => setTimeout(r, 200));
    await this.start(config);
  }

  isRunning(): boolean {
    return this.wss !== null;
  }

  getConfig(): WebSocketServerConfig {
    return { ...this.config };
  }

  getStatus(): ServerStatus {
    return {
      running: this.isRunning(),
      port: this.isRunning() ? this.config.port : null,
      host: this.isRunning() ? this.config.host : null,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      connections: this.getConnectionCount(),
      topics: this.getTopicList().length,
      messagesReceived: this.stats.messagesReceived,
      messagesSent: this.stats.messagesSent,
    };
  }

  getConnectionCount(): number {
    return this.clients.size;
  }

  getClientList(): ClientInfo[] {
    const list: ClientInfo[] = [];
    for (const [, client] of this.clients) {
      list.push({
        id: client.id,
        connected: client.connected,
        connectedAt: client.connectedAt,
        subscriptions: new Map(client.subscriptions),
        jsonSubscriptions: new Set(client.jsonSubscriptions),
        binarySubscriptions: new Set(client.binarySubscriptions),
        ...(client.identity ? { identity: { ...client.identity } } : {}),
      });
    }
    return list;
  }

  getTopicList(): string[] {
    const topics = new Set<string>();
    for (const [, client] of this.clients) {
      for (const t of client.jsonSubscriptions) topics.add(t);
      for (const t of client.binarySubscriptions) topics.add(t);
    }
    return Array.from(topics).sort();
  }

  getTopicSubscriberCount(topic: string): number {
    return this.getSubscribers(topic, 'json').size + this.getSubscribers(topic, 'binary').size;
  }

  private handleConnection(ws: WebSocket): void {
    const clientId = this.generateClientId();
    const connectedAt = Date.now();

    const client: ClientInfo & {
      ws: WebSocket;
      pendingBinaryHeader: PendingBinaryHeader | null;
      outgoingPending: Map<number, OutgoingPending>;
    } = {
      id: clientId,
      connected: true,
      connectedAt,
      subscriptions: new Map(),
      jsonSubscriptions: new Set(),
      binarySubscriptions: new Set(),
      ws,
      pendingBinaryHeader: null,
      outgoingPending: new Map(),
    };

    this.clients.set(clientId, client);
    this.emit('client-connected', { id: clientId, connectedAt });
    this.dispatchBrokerMonitor({ kind: 'client-connected', clientId, connectedAt });
    this.emit('status-changed', this.getStatus());

    ws.on('message', (data: RawData, isBinary: boolean) => {
      this.stats.messagesReceived += 1;
      if (isBinary) {
        this.handleBinaryMessage(clientId, Buffer.from(data as any));
        return;
      }

      const text = typeof data === 'string' ? data : Buffer.from(data as any).toString('utf8');
      const parsed = safeParseJson(text);
      if (!parsed.ok) {
        this.sendError(clientId, 'Invalid JSON message', { text });
        return;
      }
      this.handleJsonMessage(clientId, parsed.value);
    });

    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (err) => this.emit('error', err));
  }

  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.connected = false;
    for (const [, pending] of client.outgoingPending) {
      if (pending.timer) clearTimeout(pending.timer);
    }
    client.outgoingPending.clear();
    this.clients.delete(clientId);

    this.emit('client-disconnected', { id: clientId });
    this.dispatchBrokerMonitor({ kind: 'client-disconnected', clientId });
    this.emit('status-changed', this.getStatus());
  }

  private generateClientId(prefix = 't3d-ws'): string {
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${ts}-${rnd}`;
  }

  private getPublisherIdentity(fromClientId?: string): T3DWsClientIdentity | undefined {
    if (!fromClientId) return undefined;
    const id = this.clients.get(fromClientId)?.identity;
    return id ? { ...id, ...(id.meta ? { meta: { ...id.meta } } : {}) } : undefined;
  }

  /** Fan-out broker telemetry to subscribers of `t3d/broker/monitor` (never recursive via publishJson). */
  private dispatchBrokerMonitor(body: BrokerMonitorBody): void {
    if (!this.config.broadcastBrokerEvents) return;

    const topic = T3D_WS_BROKER_MONITOR_TOPIC;
    const recipients = this.getSubscribers(topic, 'json');
    if (recipients.size === 0) return;

    const wrapped = { ts: Date.now(), ...body };
    const qos = 0 as T3DWsQos;
    const msgBase = { type: 'message' as const, topic, payload: wrapped, qos };

    for (const cid of recipients) {
      this.sendWithQos(cid, 'json', topic, qos, undefined, wrapped, undefined, msgBase, undefined);
    }
  }

  // Topic validation & matching (MQTT-style)
  private isValidTopic(topic: string): boolean {
    if (!topic || typeof topic !== 'string') return false;

    // + can only be used as single-level wildcard (between slashes)
    if (topic.includes('+') && !topic.match(/^[^#]*(\+[^#]*)*$/)) return false;

    // # can only appear once at the end
    if (topic.includes('#') && !topic.match(/^[^#]*#$/)) return false;

    // empty levels not allowed
    if (topic.includes('//')) return false;

    // keep same character constraints used in T3D mqtt utils
    const invalidChars = /[^a-zA-Z0-9_\-/+#]/;
    if (invalidChars.test(topic)) return false;

    return true;
  }

  /**
   * Matches `topic` against `pattern` which may include MQTT wildcards:
   * - `+` single level
   * - `#` multi level (must be last)
   */
  topicMatches(topic: string, pattern: string): boolean {
    if (!this.isValidTopic(topic) || !this.isValidTopic(pattern)) return false;

    const regexPattern = pattern
      .replace(/\+/g, '[^/]+')
      .replace(/#/g, '.*')
      .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(topic);
  }

  subscribe(clientId: string, topic: string, qos: T3DWsQos, channel: T3DWsChannel): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (!this.isValidTopic(topic)) {
      this.sendError(clientId, 'Invalid topic format', { topic });
      return;
    }

    const sub: ClientSubscription = { topic, qos, subscribedAt: Date.now() };
    client.subscriptions.set(`${channel}:${topic}`, sub);

    if (channel === 'json') client.jsonSubscriptions.add(topic);
    if (channel === 'binary') client.binarySubscriptions.add(topic);

    this.emit('subscription-added', { clientId, topic, qos, channel });
    this.dispatchBrokerMonitor({ kind: 'subscription-added', clientId, topic, qos, channel });
    this.emit('status-changed', this.getStatus());

    this.sendJson(clientId, { type: 'suback', topic, qos, channel });
  }

  unsubscribe(clientId: string, topic: string, channel?: T3DWsChannel): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const removed: T3DWsChannel[] = [];
    const removeFrom = (ch: T3DWsChannel) => {
      const key = `${ch}:${topic}`;
      if (client.subscriptions.delete(key)) {
        removed.push(ch);
      }
      if (ch === 'json') client.jsonSubscriptions.delete(topic);
      if (ch === 'binary') client.binarySubscriptions.delete(topic);
    };

    if (channel) {
      removeFrom(channel);
    } else {
      removeFrom('json');
      removeFrom('binary');
    }

    if (removed.length > 0) {
      for (const ch of removed) {
        this.emit('subscription-removed', { clientId, topic, channel: ch });
        this.dispatchBrokerMonitor({ kind: 'subscription-removed', clientId, topic, channel: ch });
      }
      this.emit('status-changed', this.getStatus());
    }

    this.sendJson(clientId, {
      type: 'unsuback',
      topic,
      channel: channel ?? 'both',
    });
  }

  getSubscribers(topic: string, channel: T3DWsChannel): Set<string> {
    const result = new Set<string>();
    for (const [clientId, client] of this.clients) {
      const patterns = channel === 'json' ? client.jsonSubscriptions : client.binarySubscriptions;
      for (const pattern of patterns) {
        if (this.topicMatches(topic, pattern)) {
          result.add(clientId);
          break;
        }
      }
    }
    return result;
  }

  publishJson(
    topic: string,
    payload: unknown,
    qos: T3DWsQos,
    fromClientId?: string,
    correlationId?: string
  ): void {
    if (!this.isValidTopic(topic)) {
      if (fromClientId) this.sendError(fromClientId, 'Invalid topic format', { topic });
      return;
    }

    const msgBase = {
      type: 'message' as const,
      topic,
      payload,
      qos,
      ...(correlationId ? { correlationId } : {}),
    };
    const recipients = this.getSubscribers(topic, 'json');

    for (const clientId of recipients) {
      if (this.config.noEcho && fromClientId && clientId === fromClientId) continue;
      const messageId = qos === 0 ? undefined : this.nextMessageId();
      this.sendWithQos(
        clientId,
        'json',
        topic,
        qos,
        messageId,
        payload,
        undefined,
        msgBase,
        correlationId
      );
    }

    const info: T3DWsMessagePublishedInfo = {
      channel: 'json',
      topic,
      qos,
      from: fromClientId,
    };
    const publisher = this.getPublisherIdentity(fromClientId);
    if (publisher) info.publisher = publisher;
    if (correlationId) info.correlationId = correlationId;
    this.emit('message-published', info);

    if (
      this.config.brokerMonitorIncludePublishes &&
      topic !== T3D_WS_BROKER_MONITOR_TOPIC
    ) {
      const row: BrokerMonitorBody = {
        kind: 'message-published',
        channel: 'json',
        topic,
        qos,
        from: fromClientId,
      };
      if (publisher) row.publisher = publisher;
      if (correlationId) row.correlationId = correlationId;
      this.dispatchBrokerMonitor(row);
    }
  }

  publishBinary(topic: string, data: Buffer, qos: T3DWsQos, fromClientId?: string): void {
    if (!this.isValidTopic(topic)) {
      if (fromClientId) this.sendError(fromClientId, 'Invalid topic format', { topic });
      return;
    }

    const recipients = this.getSubscribers(topic, 'binary');
    for (const clientId of recipients) {
      if (this.config.noEcho && fromClientId && clientId === fromClientId) continue;
      const messageId = qos === 0 ? undefined : this.nextMessageId();
      this.sendWithQos(
        clientId,
        'binary',
        topic,
        qos,
        messageId,
        undefined,
        data,
        { type: 'binary', topic, size: data.length, qos },
        undefined
      );
    }

    const info: T3DWsMessagePublishedInfo = {
      channel: 'binary',
      topic,
      qos,
      from: fromClientId,
    };
    const publisher = this.getPublisherIdentity(fromClientId);
    if (publisher) info.publisher = publisher;
    this.emit('message-published', info);

    if (
      this.config.brokerMonitorIncludePublishes &&
      topic !== T3D_WS_BROKER_MONITOR_TOPIC
    ) {
      const row: BrokerMonitorBody = {
        kind: 'message-published',
        channel: 'binary',
        topic,
        qos,
        from: fromClientId,
      };
      if (publisher) row.publisher = publisher;
      this.dispatchBrokerMonitor(row);
    }
  }

  private handleJsonMessage(clientId: string, raw: unknown): void {
    if (!raw || typeof raw !== 'object') {
      this.sendError(clientId, 'Invalid message shape');
      return;
    }

    const msg = raw as Partial<JsonInboundMessage> & { type?: unknown };
    if (typeof msg.type !== 'string') {
      this.sendError(clientId, 'Missing message type');
      return;
    }

    switch (msg.type) {
      case 'hello': {
        const identity = sanitizeHelloIdentity(msg as unknown as Record<string, unknown>);
        if (!identity) {
          this.sendError(clientId, 'hello must include valid role, name, instance, and/or meta fields');
          return;
        }
        const client = this.clients.get(clientId);
        if (!client) return;
        client.identity = identity;
        this.emit('client-identified', { id: clientId, identity: { ...identity } });
        this.dispatchBrokerMonitor({
          kind: 'client-identified',
          clientId,
          identity: { ...identity },
        });
        this.emit('status-changed', this.getStatus());
        return;
      }
      case 'ping': {
        this.sendJson(clientId, { type: 'pong' });
        return;
      }
      case 'subscribe': {
        const topic = (msg as any).topic;
        const qos = (((msg as any).qos ?? 0) as number) as T3DWsQos;
        const channel = (((msg as any).channel ?? 'json') as string) as T3DWsChannel;

        if (typeof topic !== 'string') {
          this.sendError(clientId, 'subscribe.topic must be a string');
          return;
        }
        if (!this.isValidQos(qos)) {
          this.sendError(clientId, 'Invalid qos', { qos });
          return;
        }
        if (channel !== 'json' && channel !== 'binary') {
          this.sendError(clientId, 'Invalid channel', { channel });
          return;
        }

        this.subscribe(clientId, topic, qos, channel);
        return;
      }
      case 'unsubscribe': {
        const topic = (msg as any).topic;
        const channel = (msg as any).channel as T3DWsChannel | undefined;

        if (typeof topic !== 'string') {
          this.sendError(clientId, 'unsubscribe.topic must be a string');
          return;
        }
        if (channel && channel !== 'json' && channel !== 'binary') {
          this.sendError(clientId, 'Invalid channel', { channel });
          return;
        }

        this.unsubscribe(clientId, topic, channel);
        return;
      }
      case 'publish': {
        const topic = (msg as any).topic;
        const payload = (msg as any).payload;
        const qos = (((msg as any).qos ?? 0) as number) as T3DWsQos;
        const correlationId = sanitizeCorrelationId((msg as any).correlationId);

        if (typeof topic !== 'string') {
          this.sendError(clientId, 'publish.topic must be a string');
          return;
        }
        if (!this.isValidQos(qos)) {
          this.sendError(clientId, 'Invalid qos', { qos });
          return;
        }

        this.publishJson(topic, payload, qos, clientId, correlationId);

        // QoS acks for inbound publish (client -> broker)
        if (qos === 1) {
          const messageId = this.nextMessageId();
          this.sendJson(clientId, { type: 'puback', messageId });
        } else if (qos === 2) {
          const messageId = this.nextMessageId();
          // qos2 incoming simplified: pubrec immediately, expecting pubrel then pubcomp
          this.sendJson(clientId, { type: 'pubrec', messageId });
        }
        return;
      }
      case 'binary': {
        const topic = (msg as any).topic;
        const size = (msg as any).size;
        const qos = (((msg as any).qos ?? 0) as number) as T3DWsQos;

        if (typeof topic !== 'string') {
          this.sendError(clientId, 'binary.topic must be a string');
          return;
        }
        if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
          this.sendError(clientId, 'binary.size must be a non-negative number', { size });
          return;
        }
        if (!this.isValidQos(qos)) {
          this.sendError(clientId, 'Invalid qos', { qos });
          return;
        }

        const client = this.clients.get(clientId);
        if (!client) return;

        client.pendingBinaryHeader = { topic, size, qos };
        return;
      }

      // QoS acks for broker -> client flow
      case 'puback':
      case 'pubrec':
      case 'pubrel':
      case 'pubcomp': {
        const messageId = (msg as any).messageId;
        if (typeof messageId !== 'number') {
          this.sendError(clientId, `${msg.type}.messageId must be a number`);
          return;
        }
        this.handleAck(clientId, msg.type, messageId);
        return;
      }
      default: {
        this.sendError(clientId, `Unsupported message type: ${msg.type}`);
      }
    }
  }

  private handleBinaryMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const header = client.pendingBinaryHeader;
    if (!header) {
      this.sendError(clientId, 'Binary payload received without prior header');
      return;
    }

    client.pendingBinaryHeader = null;

    if (header.size !== data.length) {
      // allow mismatch but warn sender
      this.sendError(clientId, 'Binary payload size mismatch', {
        expected: header.size,
        received: data.length,
        topic: header.topic,
      });
      // still route what we received
    }

    this.publishBinary(header.topic, data, header.qos, clientId);

    // QoS acknowledgments for inbound binary publish
    if (header.qos === 1) {
      const messageId = this.nextMessageId();
      this.sendJson(clientId, { type: 'puback', messageId });
    } else if (header.qos === 2) {
      const messageId = this.nextMessageId();
      this.sendJson(clientId, { type: 'pubrec', messageId });
    }
  }

  private isValidQos(qos: unknown): qos is T3DWsQos {
    return qos === 0 || qos === 1 || qos === 2;
  }

  private nextMessageId(): number {
    // Keep it within safe integer range and avoid 0
    const id = this.messageCounter++;
    if (this.messageCounter > Number.MAX_SAFE_INTEGER - 1) this.messageCounter = 1;
    return id;
  }

  private sendJson(clientId: string, msg: JsonOutboundMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    if (client.ws.readyState !== client.ws.OPEN) return;

    try {
      client.ws.send(JSON.stringify(msg));
      this.stats.messagesSent += 1;
    } catch (err) {
      this.emit('error', err);
    }
  }

  private sendError(clientId: string, error: string, details?: unknown): void {
    this.sendJson(clientId, { type: 'error', error, details });
  }

  private sendWithQos(
    clientId: string,
    channel: T3DWsChannel,
    topic: string,
    qos: T3DWsQos,
    messageId: number | undefined,
    jsonPayload: unknown | undefined,
    binaryPayload: Buffer | undefined,
    baseJson:
      | { type: 'message'; topic: string; payload: unknown; qos: T3DWsQos; correlationId?: string }
      | { type: 'binary'; topic: string; size: number; qos: T3DWsQos },
    jsonCorrelationId?: string
  ): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const corr = channel === 'json' ? jsonCorrelationId : undefined;

    if (qos === 0 || messageId === undefined) {
      // No tracking needed
      if (channel === 'json') {
        this.sendJson(clientId, { ...baseJson, qos: 0 } as JsonOutboundMessage);
      } else {
        this.sendJson(clientId, { ...baseJson, qos: 0 } as JsonOutboundMessage);
        if (binaryPayload) this.sendBinary(clientId, binaryPayload);
      }
      return;
    }

    const pending: OutgoingPending = {
      clientId,
      channel,
      topic,
      qos,
      messageId,
      createdAt: Date.now(),
      retries: 0,
      timer: null,
      jsonPayload,
      jsonCorrelationId: corr,
      binaryPayload,
      state: qos === 1 ? { phase: 'qos1_pub_sent' } : { phase: 'qos2_pub_sent' },
    };

    client.outgoingPending.set(messageId, pending);

    // initial send
    if (channel === 'json') {
      this.sendJson(clientId, {
        type: 'message',
        topic,
        payload: jsonPayload,
        qos,
        messageId,
        ...(corr ? { correlationId: corr } : {}),
      });
    } else {
      this.sendJson(clientId, {
        type: 'binary',
        topic,
        size: binaryPayload?.length ?? 0,
        qos,
        messageId,
      });
      if (binaryPayload) this.sendBinary(clientId, binaryPayload);
    }

    this.scheduleRetry(pending);
  }

  private sendBinary(clientId: string, buf: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    if (client.ws.readyState !== client.ws.OPEN) return;
    try {
      client.ws.send(buf, { binary: true });
      this.stats.messagesSent += 1;
    } catch (err) {
      this.emit('error', err);
    }
  }

  private scheduleRetry(pending: OutgoingPending): void {
    const client = this.clients.get(pending.clientId);
    if (!client) return;

    if (pending.timer) clearTimeout(pending.timer);
    const delay = this.config.qosRetryBaseDelayMs * Math.pow(2, pending.retries);

    pending.timer = setTimeout(() => {
      try {
        const still = client.outgoingPending.get(pending.messageId);
        if (!still) return;

        if (still.retries >= this.config.qosMaxRetries) {
          client.outgoingPending.delete(still.messageId);
          this.sendError(still.clientId, 'QoS delivery failed (max retries reached)', {
            topic: still.topic,
            qos: still.qos,
            messageId: still.messageId,
          });
          return;
        }

        still.retries += 1;

        // retransmit depending on state
        if (still.qos === 1) {
          if (still.channel === 'json') {
            this.sendJson(still.clientId, {
              type: 'message',
              topic: still.topic,
              payload: still.jsonPayload,
              qos: 1,
              messageId: still.messageId,
              ...(still.jsonCorrelationId ? { correlationId: still.jsonCorrelationId } : {}),
            });
          } else {
            this.sendJson(still.clientId, {
              type: 'binary',
              topic: still.topic,
              size: still.binaryPayload?.length ?? 0,
              qos: 1,
              messageId: still.messageId,
            });
            if (still.binaryPayload) this.sendBinary(still.clientId, still.binaryPayload);
          }
        } else if (still.qos === 2) {
          // QoS2 retransmits depend on handshake phase (must never crash the broker).
          const phase = still.state?.phase ?? 'qos2_pub_sent';
          if (!still.state) {
            still.state = { phase: 'qos2_pub_sent' };
          }
          if (phase === 'qos2_pub_sent') {
            if (still.channel === 'json') {
              this.sendJson(still.clientId, {
                type: 'message',
                topic: still.topic,
                payload: still.jsonPayload,
                qos: 2,
                messageId: still.messageId,
                ...(still.jsonCorrelationId ? { correlationId: still.jsonCorrelationId } : {}),
              });
            } else {
              this.sendJson(still.clientId, {
                type: 'binary',
                topic: still.topic,
                size: still.binaryPayload?.length ?? 0,
                qos: 2,
                messageId: still.messageId,
              });
              if (still.binaryPayload) this.sendBinary(still.clientId, still.binaryPayload);
            }
          } else if (phase === 'qos2_pubrec_received' || phase === 'qos2_pubrel_sent') {
            this.sendJson(still.clientId, { type: 'pubrel', messageId: still.messageId });
            still.state = { phase: 'qos2_pubrel_sent' };
          }
        }

        this.scheduleRetry(still);
      } catch (err) {
        console.error('[t3d-ws] scheduleRetry error:', err);
        // Drop the pending entry so we cannot spin/crash repeatedly.
        try {
          client.outgoingPending.delete(pending.messageId);
        } catch {
          // ignore
        }
      }
    }, delay);
  }

  private handleAck(clientId: string, ackType: 'puback' | 'pubrec' | 'pubrel' | 'pubcomp', messageId: number): void {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      const pending = client.outgoingPending.get(messageId);
      if (!pending) return;

      if (pending.qos === 1) {
        if (ackType === 'puback') {
          if (pending.timer) clearTimeout(pending.timer);
          client.outgoingPending.delete(messageId);
        }
        return;
      }

      // QoS 2 handshake: PUB (message) -> PUBREC -> PUBREL -> PUBCOMP
      if (pending.qos === 2) {
        const phase = pending.state?.phase ?? 'qos2_pub_sent';
        if (!pending.state) {
          pending.state = { phase: 'qos2_pub_sent' };
        }
        if (ackType === 'pubrec' && phase === 'qos2_pub_sent') {
          pending.state = { phase: 'qos2_pubrec_received' };
          this.sendJson(clientId, { type: 'pubrel', messageId });
          pending.state = { phase: 'qos2_pubrel_sent' };
          this.scheduleRetry(pending);
          return;
        }

        if (ackType === 'pubcomp' && (pending.state?.phase ?? 'qos2_pub_sent') === 'qos2_pubrel_sent') {
          if (pending.timer) clearTimeout(pending.timer);
          client.outgoingPending.delete(messageId);
          return;
        }

        if (ackType === 'pubrel') {
          this.sendJson(clientId, { type: 'pubcomp', messageId });
        }
      }
    } catch (err) {
      console.error('[t3d-ws] handleAck error:', err);
      try {
        const client = this.clients.get(clientId);
        client?.outgoingPending.delete(messageId);
      } catch {
        // ignore
      }
    }
  }
}

