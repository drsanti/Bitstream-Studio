import type {
  JsonInboundMessage,
  JsonOutboundMessage,
  T3DWsChannel,
  T3DWsClientIdentity,
  T3DWsQos,
} from './T3DWebSocketServer';
import { T3D_DEFAULT_CLIENT_CONFIG } from './T3DWebSocketConfig';
import { T3DWebSocketClientCore } from './T3DWebSocketClientCore';
import { WsNodeTransport } from './transport/ws-node';
import { WsBrowserTransport } from './transport/ws-browser';
import type { WsTransport } from './transport/types';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface WebSocketClientConfig {
  url: string;
  autoConnect?: boolean;
  /**
   * Base reconnect delay (ms). Exponential backoff is applied.
   * Default: 1000
   */
  reconnectPeriod?: number;
  /**
   * Max reconnect attempts. -1 means unlimited.
   * Default: 10
   */
  maxReconnectAttempts?: number;
  /**
   * Connection timeout (ms).
   * Default: 15000
   */
  connectTimeout?: number;
  /**
   * Ping interval (ms). 0 disables keepalive pings.
   * Default: 0
   */
  pingInterval?: number;
  /**
   * Subscription ack timeout (ms).
   * Default: 5000
   */
  requestTimeout?: number;
  /**
   * Sent once after connect as `{ type: 'hello', ... }` so the broker can label this session in logs and `getClientList()`.
   */
  clientIdentity?: T3DWsClientIdentity;
}

export interface WebSocketClientCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: (attempt: number) => void;
  onMessage?: (topic: string, payload: unknown, qos: T3DWsQos) => void;
  onBinary?: (topic: string, data: Uint8Array, qos: T3DWsQos) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: ConnectionState) => void;
  onSubscribe?: (topic: string, qos: T3DWsQos, channel: T3DWsChannel) => void;
  onUnsubscribe?: (topic: string, channel?: T3DWsChannel) => void;
}

export interface Subscription {
  topic: string;
  qos: T3DWsQos;
  channel: T3DWsChannel;
  subscribedAt: number;
}

/**
 * Detect if we're in a browser/webview environment.
 */
function isBrowserEnvironment(): boolean {
  if (
    typeof process !== 'undefined' &&
    process.versions != null &&
    typeof process.versions.node === 'string'
  ) {
    return false;
  }
  return (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.WebSocket === 'function' &&
    (typeof window !== 'undefined' || typeof self !== 'undefined')
  );
}

/**
 * Create the appropriate transport for the current environment.
 */
function createTransport(url: string): WsTransport {
  if (isBrowserEnvironment()) {
    return new WsBrowserTransport(url);
  } else {
    return new WsNodeTransport(url);
  }
}

/**
 * Cross-platform WebSocket client for `T3DWebSocketServer`.
 *
 * Auto-selects the appropriate transport:
 * - Node/VS Code extension host: uses `ws` package (lazy-loaded)
 * - Browser/VS Code webview: uses native `WebSocket`
 *
 * Features:
 * - Auto-connect + auto-reconnect
 * - JSON publish/subscribe + binary stream channel (header + frame)
 * - Callback hooks for UX
 * - QoS delivery acks for broker->client messages (puback/pubrec/pubrel/pubcomp)
 * - Unified `Uint8Array` binary API (works with Node `Buffer` since it extends `Uint8Array`)
 */
export class T3DWebSocketClient extends T3DWebSocketClientCore {
  constructor(config: WebSocketClientConfig, callbacks?: WebSocketClientCallbacks) {
    const transport = createTransport(config.url);
    super(config, transport);
    if (callbacks) this.setCallbacks(callbacks);

    if (config.autoConnect ?? T3D_DEFAULT_CLIENT_CONFIG.autoConnect) {
      // Fire and forget; caller can await connect() explicitly if needed.
      void this.connect();
    }
  }
}
