import { create } from "zustand";
import {
  SERIALPORT_TOPICS,
  type PortInfo,
  type SerialPortStatusPayload,
  type OpenRequest,
} from "../../serialport-bridge/protocol";
import { normalizeBitstreamBaudRate } from "../../bitstream/bitstream-default-baud.js";
import { useWsClientStore, isWsClientConnected } from "../ws-client-store";

const STORAGE_KEY = "ternion-serialport-config";
const REQUEST_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function uint8ArrayToBase64(u8: Uint8Array): string {
  let binary = "";
  const len = u8.byteLength;
  const chunk = 8192;
  for (let i = 0; i < len; i += chunk) {
    const end = Math.min(i + chunk, len);
    for (let j = i; j < end; j++) binary += String.fromCharCode(u8[j]!);
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// Persisted config (serial-port-specific; wsUrl now lives in ws-client-store)
// ---------------------------------------------------------------------------

export interface SerialPortPersistedConfig {
  selectedPath: string;
  baudRate: number;
  mode: "data" | "line" | "both";
}

function loadPersistedConfig(): Partial<SerialPortPersistedConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Partial<SerialPortPersistedConfig>;
  } catch {
    /* ignore */
  }
  return {};
}

function savePersistedConfig(config: SerialPortPersistedConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Data handler type
// ---------------------------------------------------------------------------

export type SerialDataHandler = (chunk: Uint8Array, encoding?: string) => void;

// ---------------------------------------------------------------------------
// Open-port config
// ---------------------------------------------------------------------------

export interface OpenPortConfig {
  path: string;
  baudRate: number;
  mode?: "data" | "line" | "both";
  readline?: boolean;
  readlineDelimiter?: string;
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

export interface SerialPortStoreState {
  selectedPath: string;
  baudRate: number;
  mode: "data" | "line" | "both";

  status: SerialPortStatusPayload | null;
  ports: PortInfo[];
  /** True after user Close until next Open — blocks stale broker "still open" updates. */
  sessionClosedByUser: boolean;

  setSelectedPath: (path: string) => void;
  setBaudRate: (baudRate: number) => void;
  setMode: (mode: "data" | "line" | "both") => void;

  /** Connect WS (if needed) and subscribe to serial-port topics. */
  connect: () => Promise<void>;
  /** Unsubscribe serial-port topics. Does NOT disconnect WS. */
  disconnect: () => Promise<void>;
  listPorts: () => Promise<PortInfo[]>;
  openPort: (config: OpenPortConfig) => Promise<void>;
  closePort: () => Promise<void>;
  write: (data: string | Uint8Array) => Promise<void>;

  subscribe: (id: string, handler: SerialDataHandler) => void;
  unsubscribe: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Module-level singletons (request tracking + data fan-out)
// ---------------------------------------------------------------------------

const pending = new Map<
  string,
  { resolve: (v: unknown) => void; reject: (e: Error) => void }
>();
const openConfigs = new Map<string, { mode: "data" | "line" | "both" }>();
const dataSubscribers = new Map<string, SerialDataHandler>();
let currentMode: "data" | "line" | "both" = "data";
let serialListenerRegistered = false;
/** Dedupes concurrent `connect()` (e.g. React StrictMode); cleared after each attempt completes. */
let serialConnectInFlight: Promise<void> | null = null;
let lastOpenAt = 0;
/** After CLOSE_RESULT ok, ignore broker STATUS with isOpen:true until this time (stale while port drains). */
let ignoreOpenStatusUntilMs = 0;
let serialDataSubscribed = false;

async function subscribeSerialDataTopics(
  ws: ReturnType<typeof useWsClientStore.getState>,
): Promise<void> {
  if (serialDataSubscribed)
  {
    return;
  }
  await ws.subscribeTopic(SERIALPORT_TOPICS.DATA, 0, "binary");
  await ws.subscribeTopic(SERIALPORT_TOPICS.DATA, 0, "json");
  serialDataSubscribed = true;
}

async function unsubscribeSerialDataTopics(
  ws: ReturnType<typeof useWsClientStore.getState>,
): Promise<void> {
  if (!serialDataSubscribed)
  {
    return;
  }
  try
  {
    await ws.unsubscribeTopic(SERIALPORT_TOPICS.DATA, "binary");
    await ws.unsubscribeTopic(SERIALPORT_TOPICS.DATA, "json");
  }
  catch
  {
    /* ignore */
  }
  serialDataSubscribed = false;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const saved = loadPersistedConfig();

export const useSerialPortStore = create<SerialPortStoreState>((set, get) => {
  function persist() {
    const { selectedPath, baudRate, mode } = get();
    savePersistedConfig({ selectedPath, baudRate, mode });
  }

  function dispatchSerialDataChunk(chunk: Uint8Array, encoding?: string): void {
    if (get().sessionClosedByUser)
    {
      return;
    }
    for (const handler of dataSubscribers.values()) {
      try {
        handler(chunk, encoding);
      } catch {
        /* isolate subscriber errors */
      }
    }
    const current = get().status;
    if (current?.isOpen) {
      set({
        status: {
          ...current,
          bytesRead: (current.bytesRead ?? 0) + chunk.length,
        },
      });
    }
  }

  function handleBinaryMessage(topic: string, data: Uint8Array): void {
    if (topic !== SERIALPORT_TOPICS.DATA) return;
    dispatchSerialDataChunk(data, undefined);
  }

  function handleMessage(topic: string, payload: unknown) {
    if (topic === SERIALPORT_TOPICS.LIST_RESPONSE) {
      const res = payload as {
        requestId: string;
        ports: PortInfo[];
        error?: string;
      };
      const p = pending.get(res.requestId);
      if (p) {
        pending.delete(res.requestId);
        if (res.error) p.reject(new Error(res.error));
        else p.resolve(res.ports || []);
      }
      return;
    }

    if (topic === SERIALPORT_TOPICS.OPEN_RESULT) {
      const res = payload as {
        requestId: string;
        success: boolean;
        error?: string;
      };
      const p = pending.get(res.requestId);
      const cfg = openConfigs.get(res.requestId);
      if (p) {
        pending.delete(res.requestId);
        if (!res.success) {
          openConfigs.delete(res.requestId);
          p.reject(new Error(res.error ?? "Open failed"));
        }         else {
          if (cfg) currentMode = cfg.mode;
          openConfigs.delete(res.requestId);
          p.resolve(undefined);
          const state = get();
          lastOpenAt = Date.now();
          ignoreOpenStatusUntilMs = 0;
          set({
            sessionClosedByUser: false,
            status: {
              isOpen: true,
              path: state.selectedPath || null,
              baudRate: state.baudRate,
              bytesRead: 0,
              bytesWritten: 0,
            },
          });
          void subscribeSerialDataTopics(useWsClientStore.getState()).catch(() => {
            /* optional raw tap */
          });
        }
      }
      return;
    }

    if (topic === SERIALPORT_TOPICS.CLOSE_RESULT) {
      const res = payload as {
        requestId: string;
        success: boolean;
        error?: string;
      };
      const p = pending.get(res.requestId);
      if (p) {
        pending.delete(res.requestId);
        if (!res.success) p.reject(new Error(res.error ?? "Close failed"));
        else {
          currentMode = "data";
          lastOpenAt = 0;
          ignoreOpenStatusUntilMs = Date.now() + 8000;
          void unsubscribeSerialDataTopics(useWsClientStore.getState()).catch(() => {
            /* ignore */
          });
          set({
            sessionClosedByUser: true,
            status: {
              isOpen: false,
              path: null,
              baudRate: null,
              bytesRead: get().status?.bytesRead ?? 0,
              bytesWritten: 0,
            },
          });
          p.resolve(undefined);
        }
      }
      return;
    }

    if (topic === SERIALPORT_TOPICS.WRITE_RESULT) {
      const res = payload as {
        requestId: string;
        success: boolean;
        error?: string;
        bytesWritten?: number;
      };
      const p = pending.get(res.requestId);
      if (p) {
        pending.delete(res.requestId);
        if (!res.success) {
          p.reject(new Error(res.error ?? "Write failed"));
        } else {
          const current = get().status;
          if (
            current?.isOpen &&
            typeof res.bytesWritten === "number" &&
            Number.isFinite(res.bytesWritten)
          ) {
            set({
              status: {
                ...current,
                bytesWritten: res.bytesWritten,
              },
            });
          }
          p.resolve(undefined);
        }
      }
      return;
    }

    if (topic === SERIALPORT_TOPICS.DATA) {
      const msg = payload as { data: string; encoding?: string };
      if (typeof msg?.data !== "string") return;
      const chunk = base64ToUint8Array(msg.data);
      dispatchSerialDataChunk(chunk, msg.encoding);
      return;
    }

    if (topic === SERIALPORT_TOPICS.STATUS) {
      const statusPayload = payload as SerialPortStatusPayload;
      const current = get().status;
      if (get().sessionClosedByUser && statusPayload.isOpen)
      {
        return;
      }
      if (
        current?.isOpen &&
        !statusPayload.isOpen &&
        Date.now() - lastOpenAt < 1500
      ) {
        return;
      }
      if (
        statusPayload.isOpen &&
        ignoreOpenStatusUntilMs > 0 &&
        Date.now() < ignoreOpenStatusUntilMs
      ) {
        return;
      }
      if (!statusPayload.isOpen)
      {
        ignoreOpenStatusUntilMs = 0;
      }
      set({ status: statusPayload });
    }
  }

  const initialBaudRate = normalizeBitstreamBaudRate(saved.baudRate);
  if (saved.baudRate !== undefined && normalizeBitstreamBaudRate(saved.baudRate) !== Number(saved.baudRate)) {
    savePersistedConfig({
      selectedPath: saved.selectedPath ?? "",
      baudRate: initialBaudRate,
      mode: saved.mode ?? "line",
    });
  }

  return {
    selectedPath: saved.selectedPath ?? "",
    baudRate: initialBaudRate,
    mode: saved.mode ?? "line",

    status: null,
    ports: [],
    sessionClosedByUser: false,

    setSelectedPath: (selectedPath) => {
      set({ selectedPath });
      persist();
    },
    setBaudRate: (baudRate) => {
      const n = normalizeBitstreamBaudRate(baudRate);
      set({ baudRate: n });
      persist();
    },
    setMode: (mode) => {
      set({ mode });
      persist();
    },

    connect: async () => {
      if (serialConnectInFlight) {
        return serialConnectInFlight;
      }
      serialConnectInFlight = (async () => {
        const ws = useWsClientStore.getState();
        if (!ws.isConnected) {
          await ws.connect();
        }

        if (!serialListenerRegistered) {
          ws.addMessageListener("serial-port", handleMessage);
          ws.addBinaryListener("serial-port", handleBinaryMessage);
          serialListenerRegistered = true;
        }

        await ws.subscribeTopic(SERIALPORT_TOPICS.LIST_RESPONSE, 0, "json");
        await ws.subscribeTopic(SERIALPORT_TOPICS.OPEN_RESULT, 1, "json");
        await ws.subscribeTopic(SERIALPORT_TOPICS.CLOSE_RESULT, 1, "json");
        await ws.subscribeTopic(SERIALPORT_TOPICS.STATUS, 0, "json");
        await ws.subscribeTopic(SERIALPORT_TOPICS.WRITE_RESULT, 1, "json");
      })();
      try {
        await serialConnectInFlight;
      } finally {
        serialConnectInFlight = null;
      }
    },

    disconnect: async () => {
      const ws = useWsClientStore.getState();
      if (serialListenerRegistered) {
        ws.removeMessageListener("serial-port");
        ws.removeBinaryListener("serial-port");
        serialListenerRegistered = false;
      }

      if (ws.isConnected) {
        try {
          await ws.unsubscribeTopic(SERIALPORT_TOPICS.LIST_RESPONSE, "json");
          await ws.unsubscribeTopic(SERIALPORT_TOPICS.OPEN_RESULT, "json");
          await ws.unsubscribeTopic(SERIALPORT_TOPICS.CLOSE_RESULT, "json");
          await unsubscribeSerialDataTopics(ws);
          await ws.unsubscribeTopic(SERIALPORT_TOPICS.STATUS, "json");
          await ws.unsubscribeTopic(SERIALPORT_TOPICS.WRITE_RESULT, "json");
        } catch {
          /* ignore if already disconnected */
        }
      }

      currentMode = "data";
      pending.clear();
      openConfigs.clear();
      set({ status: null, ports: [], sessionClosedByUser: false });
    },

    listPorts: async () => {
      if (!isWsClientConnected()) throw new Error("Not connected");
      const requestId = nextRequestId();
      const ws = useWsClientStore.getState();
      return new Promise<PortInfo[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (pending.has(requestId)) {
            pending.delete(requestId);
            reject(new Error("List ports request timeout"));
          }
        }, REQUEST_TIMEOUT_MS);

        pending.set(requestId, {
          resolve: (value) => {
            clearTimeout(timeout);
            const ports = value as PortInfo[];
            set({ ports });
            resolve(ports);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
        });

        ws.publish(SERIALPORT_TOPICS.LIST, { requestId }, 0).catch(
          (err: Error) => {
            clearTimeout(timeout);
            pending.delete(requestId);
            reject(err);
          },
        );
      });
    },

    openPort: async (config) => {
      if (!isWsClientConnected()) throw new Error("Not connected");
      const requestId = nextRequestId();

      let mode: "data" | "line" | "both" = config.mode ?? "data";
      if (!config.mode && config.readline !== undefined) {
        mode = config.readline ? "line" : "data";
      }

      const baudRate = normalizeBitstreamBaudRate(config.baudRate);
      const req: OpenRequest = {
        requestId,
        path: config.path,
        baudRate,
        mode,
      };
      if (config.readline != null) req.readline = config.readline;
      if (config.readlineDelimiter != null)
        req.readlineDelimiter = config.readlineDelimiter;

      openConfigs.set(requestId, { mode });
      currentMode = mode;
      set({ mode });
      persist();

      const ws = useWsClientStore.getState();
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (pending.has(requestId)) {
            pending.delete(requestId);
            openConfigs.delete(requestId);
            reject(new Error("Open port timeout"));
          }
        }, REQUEST_TIMEOUT_MS);
        pending.set(requestId, {
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject: (e) => {
            clearTimeout(timeout);
            openConfigs.delete(requestId);
            reject(e);
          },
        });
        ws.publish(SERIALPORT_TOPICS.OPEN, req, 1).catch((err) => {
          clearTimeout(timeout);
          pending.delete(requestId);
          openConfigs.delete(requestId);
          reject(err);
        });
      });
    },

    closePort: async () => {
      if (!isWsClientConnected()) throw new Error("Not connected");
      const requestId = nextRequestId();
      currentMode = "data";
      const priorStatus = get().status;
      ignoreOpenStatusUntilMs = Date.now() + 8000;
      set({
        sessionClosedByUser: true,
        status: {
          isOpen: false,
          path: priorStatus?.path ?? (get().selectedPath || null),
          baudRate: priorStatus?.baudRate ?? get().baudRate,
          bytesRead: priorStatus?.bytesRead ?? 0,
          bytesWritten: priorStatus?.bytesWritten ?? 0,
        },
      });
      const ws = useWsClientStore.getState();
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (pending.has(requestId)) {
            pending.delete(requestId);
            reject(new Error("Close port timeout"));
          }
        }, REQUEST_TIMEOUT_MS);
        pending.set(requestId, {
          resolve: () => {
            clearTimeout(timeout);
            void unsubscribeSerialDataTopics(useWsClientStore.getState()).catch(() => {
              /* ignore */
            });
            resolve();
          },
          reject: (e) => {
            clearTimeout(timeout);
            ignoreOpenStatusUntilMs = 0;
            set({
              sessionClosedByUser: false,
              status: priorStatus,
            });
            reject(e);
          },
        });
        ws.publish(SERIALPORT_TOPICS.CLOSE, { requestId }, 1).catch((err) => {
          clearTimeout(timeout);
          pending.delete(requestId);
          ignoreOpenStatusUntilMs = 0;
          set({
            sessionClosedByUser: false,
            status: priorStatus,
          });
          reject(err);
        });
      });
    },

    write: async (data) => {
      if (!isWsClientConnected()) throw new Error("Not connected");
      if (!get().status?.isOpen) throw new Error("Serial port is not open");
      const dataStr =
        typeof data === "string" ? data : uint8ArrayToBase64(data);
      const requestId = nextRequestId();
      const ws = useWsClientStore.getState();
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (pending.has(requestId)) {
            pending.delete(requestId);
            reject(new Error("Write request timeout"));
          }
        }, REQUEST_TIMEOUT_MS);
        pending.set(requestId, {
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject: (e) => {
            clearTimeout(timeout);
            reject(e);
          },
        });
        ws
          .publish(
            SERIALPORT_TOPICS.WRITE,
            { requestId, data: dataStr },
            1,
          )
          .catch((err: Error) => {
            clearTimeout(timeout);
            pending.delete(requestId);
            reject(err);
          });
      });
    },

    subscribe: (id, handler) => {
      dataSubscribers.set(id, handler);
    },
    unsubscribe: (id) => {
      dataSubscribers.delete(id);
    },
  };
});
