import { create } from "zustand";
import type { ConnectionState as WsConnectionState } from "../../../websocket/T3DWebSocketClient";
import type {
  BridgeRuntimeOperation,
  BridgeRuntimeSnapshotPayload,
  PortInfo,
  SerialPortStatusPayload,
  SerialRxWireWindowStats,
} from "../../../serialport-bridge/protocol";

export type TransportState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

interface BitstreamConnectionState {
  connecting: boolean;
  connected: boolean;
  transportState: TransportState;
  busyAction: string | null;
  backendWsState: WsConnectionState;
  detectingPorts: boolean;
  availablePorts: PortInfo[];
  serialBridgeStatus: SerialPortStatusPayload | null;
  /** Rolling 1s window from `SerialBridgeTransportAdapter` (null when transport closed). */
  serialRxWireStats: SerialRxWireWindowStats | null;
  runtimeSyncState: "idle" | "syncing_snapshot" | "ready";
  runtimeReady: boolean;
  sessionAttached: boolean;
  leaseId: string | null;
  leaseOwner: string | null;
  /** Last `RUNTIME_SNAPSHOT` from the bridge (authoritative multi-client state). */
  runtimeSnapshot: BridgeRuntimeSnapshotPayload | null;
  runtimeOperations: BridgeRuntimeOperation[];
  logs: string[];
  /** User clicked Disconnect — suppress hotplug poll and auto UART until Connect. */
  userPausedLink: boolean;
}

interface BitstreamConnectionActions {
  setConnecting: (value: boolean) => void;
  setConnected: (value: boolean) => void;
  setTransportState: (value: TransportState) => void;
  setBusyAction: (value: string | null) => void;
  setBackendWsState: (value: WsConnectionState) => void;
  setDetectingPorts: (value: boolean) => void;
  setAvailablePorts: (ports: PortInfo[]) => void;
  setSerialBridgeStatus: (value: SerialPortStatusPayload | null) => void;
  setSerialRxWireStats: (value: SerialRxWireWindowStats | null) => void;
  setRuntimeSyncState: (value: "idle" | "syncing_snapshot" | "ready") => void;
  setRuntimeReady: (value: boolean) => void;
  setSessionAttached: (value: boolean) => void;
  setRuntimeSnapshot: (snapshot: BridgeRuntimeSnapshotPayload) => void;
  pushRuntimeOperation: (operation: BridgeRuntimeOperation) => void;
  pushLog: (message: string) => void;
  setUserPausedLink: (value: boolean) => void;
}

export type BitstreamConnectionStore = BitstreamConnectionState & BitstreamConnectionActions;

export const useBitstreamConnectionStore = create<BitstreamConnectionStore>((set) => ({
  connecting: false,
  connected: false,
  transportState: "disconnected",
  busyAction: null,
  backendWsState: "disconnected",
  detectingPorts: false,
  availablePorts: [],
  serialBridgeStatus: null,
  serialRxWireStats: null,
  runtimeSyncState: "idle",
  runtimeReady: false,
  sessionAttached: false,
  leaseId: null,
  leaseOwner: null,
  runtimeSnapshot: null,
  runtimeOperations: [],
  logs: [],
  userPausedLink: false,

  setConnecting: (value) => set({ connecting: value }),
  setConnected: (value) => set({ connected: value }),
  setTransportState: (value) => set({ transportState: value }),
  setBusyAction: (value) => set({ busyAction: value }),
  setBackendWsState: (value) => set({ backendWsState: value }),
  setDetectingPorts: (value) => set({ detectingPorts: value }),
  setAvailablePorts: (ports) => set({ availablePorts: ports }),
  setSerialBridgeStatus: (value) => set({ serialBridgeStatus: value }),
  setSerialRxWireStats: (value) => set({ serialRxWireStats: value }),
  setRuntimeSyncState: (value) => set({ runtimeSyncState: value, runtimeReady: value === "ready" }),
  setRuntimeReady: (value) => set({ runtimeReady: value }),
  setSessionAttached: (value) => set({ sessionAttached: value }),
  setRuntimeSnapshot: (snapshot) =>
    set({
      runtimeSyncState: "ready",
      runtimeReady: true,
      leaseId: snapshot.leaseId,
      leaseOwner: snapshot.leaseOwner,
      runtimeSnapshot: snapshot,
      serialBridgeStatus: snapshot.serialStatus,
      availablePorts: snapshot.ports,
      runtimeOperations: snapshot.recentOperations,
    }),
  pushRuntimeOperation: (operation) =>
    set((state) => ({
      runtimeOperations: [operation, ...state.runtimeOperations].slice(0, 120),
    })),
  pushLog: (message) => {
    const stamp = new Date().toLocaleTimeString();
    set((state) => ({
      logs: [`[${stamp}] ${message}`, ...state.logs].slice(0, 120),
    }));
  },
  setUserPausedLink: (value) => set({ userPausedLink: value }),
}));
