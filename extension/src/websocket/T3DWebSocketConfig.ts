import type { WebSocketServerConfig } from './T3DWebSocketServer';
import type { WebSocketClientConfig } from './T3DWebSocketClient';

export { T3D_WS_BROKER_MONITOR_TOPIC } from './broker-monitor-events';
export type {
  BrokerMonitorBody,
  BrokerMonitorEnvelope,
  BrokerMonitorPublisher,
} from './broker-monitor-events';

/**
 * Shared defaults for the T3D WebSocket broker + client.
 *
 * Keep this file as the single source of truth so:
 * - `T3DWebSocketServer` default port/host match client examples
 * - `run.ws.server.ts` and `run.ws.client.ts` stay in sync
 */

export const T3D_DEFAULT_WS_PORT = 9998;
/** Separate broker for model-downloader / Free Loader so it does not share the serial/bitstream port. */
export const T3D_DEFAULT_MODEL_BROKER_WS_PORT = 9999;
export const T3D_DEFAULT_WS_HOST = '0.0.0.0';
/** Use 127.0.0.1 (not `localhost`) so browser clients match IPv4-bound brokers on Windows (::1 vs 127.0.0.1). */
export const T3D_DEFAULT_WS_CLIENT_URL = `ws://127.0.0.1:${T3D_DEFAULT_WS_PORT}`;
export const T3D_MODEL_LOADER_WS_CLIENT_URL = `ws://127.0.0.1:${T3D_DEFAULT_MODEL_BROKER_WS_PORT}`;

/** Child `combined-bridge-entry` (no VS Code API): model broker TCP port. */
export function resolveModelBrokerListenPortFromEnv(): number {
  const n = Number(process.env.T3D_MODEL_BROKER_WS_PORT);
  if (Number.isFinite(n) && n > 0 && n <= 65535) {
    return Math.trunc(n);
  }
  return T3D_DEFAULT_MODEL_BROKER_WS_PORT;
}

/**
 * Whether the broker emits `message-published` rows on `t3d/broker/monitor`.
 * Default: enabled. Set `T3D_WS_MONITOR_PUBLISHES=0` (or `false` / `no`) to disable (less overhead).
 */
export function resolveBrokerMonitorIncludePublishesFromEnv(): boolean {
  const v = process.env.T3D_WS_MONITOR_PUBLISHES;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return true;
}

export const T3D_DEFAULT_SERVER_CONFIG: Required<WebSocketServerConfig> = {
  port: T3D_DEFAULT_WS_PORT,
  host: T3D_DEFAULT_WS_HOST,
  noEcho: true,
  qosRetryBaseDelayMs: 1000,
  qosMaxRetries: 3,
  broadcastBrokerEvents: true,
  brokerMonitorIncludePublishes: true,
};

export const T3D_DEFAULT_CLIENT_CONFIG: Required<WebSocketClientConfig> = {
  url: T3D_DEFAULT_WS_CLIENT_URL,
  autoConnect: true,
  reconnectPeriod: 1000,
  maxReconnectAttempts: 10,
  connectTimeout: 15000,
  pingInterval: 0,
  requestTimeout: 5000,
  clientIdentity: {},
};

