import { create } from 'zustand';
import { T3DWebSocketClient } from '../websocket/T3DWebSocketClient';
import type { ConnectionState } from '../websocket/T3DWebSocketClient';
import type { T3DWsChannel, T3DWsClientIdentity, T3DWsQos } from '../websocket/T3DWebSocketServer';
import { getBitstreamWsClientUrl } from './runtimeWsUrls';

const STORAGE_KEY = 'ternion-ws-config';

// ---------------------------------------------------------------------------
// Persisted config
// ---------------------------------------------------------------------------

function loadWsUrl(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { wsUrl?: string };
      if (parsed.wsUrl) return parsed.wsUrl;
    }
  } catch { /* ignore */ }
  return getBitstreamWsClientUrl();
}

function saveWsUrl(wsUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ wsUrl }));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Listener types
// ---------------------------------------------------------------------------

export type WsMessageListener = (topic: string, payload: unknown, qos: T3DWsQos) => void;
export type WsBinaryListener = (topic: string, data: Uint8Array, qos: T3DWsQos) => void;
export type WsSubscribeListener = (topic: string, qos: T3DWsQos, channel: T3DWsChannel) => void;
export type WsUnsubscribeListener = (topic: string, channel?: T3DWsChannel) => void;

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

/** Approximate byte length of a JSON-serializable payload (topic + payload). */
function estimateMessageBytes(topic: string, payload: unknown): number {
  try {
    const topicBytes = new TextEncoder().encode(topic).length;
    const payloadBytes =
      payload !== undefined && payload !== null
        ? new TextEncoder().encode(JSON.stringify(payload)).length
        : 0;
    return topicBytes + payloadBytes;
  } catch {
    return 0;
  }
}

export interface WsClientStoreState {
  wsUrl: string;
  connectionState: ConnectionState | string;
  isConnected: boolean;
  /** Approximate bytes received over the WebSocket (messages + binary). */
  wsBytesReceived: number;
  /** Approximate bytes sent over the WebSocket (publish payloads). */
  wsBytesSent: number;

  setWsUrl: (url: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribeTopic: (topic: string, qos?: T3DWsQos, channel?: T3DWsChannel) => Promise<void>;
  unsubscribeTopic: (topic: string, channel?: T3DWsChannel) => Promise<void>;
  publish: (topic: string, payload: unknown, qos?: T3DWsQos) => Promise<void>;

  addMessageListener: (id: string, handler: WsMessageListener) => void;
  removeMessageListener: (id: string) => void;
  addBinaryListener: (id: string, handler: WsBinaryListener) => void;
  removeBinaryListener: (id: string) => void;
  addSubscribeListener: (id: string, handler: WsSubscribeListener) => void;
  removeSubscribeListener: (id: string) => void;
  addUnsubscribeListener: (id: string, handler: WsUnsubscribeListener) => void;
  removeUnsubscribeListener: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Module-level singletons
// ---------------------------------------------------------------------------

let client: T3DWebSocketClient | null = null;

/** Override identity for the next `connect()` (e.g. bitstream-lab). */
let connectClientIdentity: T3DWsClientIdentity = { role: 'webview', name: 'ws-client-store' };

export function setWsConnectClientIdentity(identity: T3DWsClientIdentity): void {
  connectClientIdentity = identity;
}
const messageListeners = new Map<string, WsMessageListener>();
const binaryListeners = new Map<string, WsBinaryListener>();
const subscribeListeners = new Map<string, WsSubscribeListener>();
const unsubscribeListeners = new Map<string, WsUnsubscribeListener>();

/** Expose client connectivity check for stores that need it (e.g. serial-port-store). */
export function isWsClientConnected(): boolean {
  return client?.isConnected() ?? false;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useWsClientStore = create<WsClientStoreState>((set, get) => ({
  wsUrl: loadWsUrl(),
  connectionState: 'disconnected',
  isConnected: false,
  wsBytesReceived: 0,
  wsBytesSent: 0,

  setWsUrl: (wsUrl) => {
    set({ wsUrl });
    saveWsUrl(wsUrl);
  },

  connect: async () => {
    if (client) {
      if (client.isConnected()) return;
      try {
        await client.disconnect();
      } catch { /* ignore */ }
      client = null;
      set({ connectionState: 'disconnected', isConnected: false, wsBytesReceived: 0, wsBytesSent: 0 });
    }

    const { wsUrl } = get();
    set({ wsBytesReceived: 0, wsBytesSent: 0 });
    const ws = new T3DWebSocketClient(
      {
        url: wsUrl,
        autoConnect: false,
        clientIdentity: connectClientIdentity,
      },
      {
        onConnect: () => set({ connectionState: 'connected', isConnected: true }),
        onDisconnect: () => set({ connectionState: 'disconnected', isConnected: false }),
        onStateChange: (s) => set({ connectionState: s, isConnected: s === 'connected' }),
        onReconnect: () => set({ connectionState: 'reconnecting', isConnected: false }),
        onMessage: (topic, payload, qos) => {
          const bytes = estimateMessageBytes(topic, payload);
          set({ wsBytesReceived: get().wsBytesReceived + bytes });
          for (const handler of messageListeners.values()) {
            try { handler(topic, payload, qos); } catch { /* isolate errors */ }
          }
        },
        onBinary: (topic, data, qos) => {
          set({ wsBytesReceived: get().wsBytesReceived + data.byteLength });
          for (const handler of binaryListeners.values()) {
            try { handler(topic, data, qos); } catch { /* isolate errors */ }
          }
        },
        onSubscribe: (topic, qos, channel) => {
          for (const handler of subscribeListeners.values()) {
            try { handler(topic, qos, channel); } catch { /* isolate errors */ }
          }
        },
        onUnsubscribe: (topic, channel) => {
          for (const handler of unsubscribeListeners.values()) {
            try { handler(topic, channel); } catch { /* isolate errors */ }
          }
        },
        onError: (err) => {
          if (client !== ws) return;
          set({ connectionState: 'error', isConnected: false });
          console.error('[ws-client-store] WebSocket error:', err.message);
        },
      },
    );

    client = ws;
    set({ connectionState: 'connecting', isConnected: false });
    try {
      await ws.connect();
    } catch (e) {
      set({ connectionState: 'error', isConnected: false });
      throw e;
    }
  },

  disconnect: async () => {
    if (client) {
      await client.disconnect();
      client = null;
    }
    set({ connectionState: 'disconnected', isConnected: false, wsBytesReceived: 0, wsBytesSent: 0 });
  },

  subscribeTopic: async (topic, qos = 0, channel = 'json') => {
    if (!client?.isConnected()) {
      set({ connectionState: 'disconnected', isConnected: false });
      throw new Error('Not connected');
    }
    await client.subscribe(topic, qos, channel);
  },

  unsubscribeTopic: async (topic, channel) => {
    if (!client?.isConnected()) {
      set({ connectionState: 'disconnected', isConnected: false });
      throw new Error('Not connected');
    }
    await client.unsubscribe(topic, channel);
  },

  publish: async (topic, payload, qos = 0) => {
    if (!client?.isConnected()) {
      set({ connectionState: 'disconnected', isConnected: false });
      throw new Error('Not connected');
    }
    await client.publish(topic, payload, qos);
    const bytes = estimateMessageBytes(topic, payload);
    set({ wsBytesSent: get().wsBytesSent + bytes });
  },

  addMessageListener: (id, handler) => { messageListeners.set(id, handler); },
  removeMessageListener: (id) => { messageListeners.delete(id); },
  addBinaryListener: (id, handler) => { binaryListeners.set(id, handler); },
  removeBinaryListener: (id) => { binaryListeners.delete(id); },
  addSubscribeListener: (id, handler) => { subscribeListeners.set(id, handler); },
  removeSubscribeListener: (id) => { subscribeListeners.delete(id); },
  addUnsubscribeListener: (id, handler) => { unsubscribeListeners.set(id, handler); },
  removeUnsubscribeListener: (id) => { unsubscribeListeners.delete(id); },
}));
