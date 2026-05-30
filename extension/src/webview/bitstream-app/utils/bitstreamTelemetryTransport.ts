import type { SerialPortStatusPayload } from "../../../serialport-bridge/protocol";
import type { Bitstream2SensorSamplePayload } from "../../../bitstream2/bridge/protocol";
import type { HandshakeLifecycleState } from "../state/bitstreamLive.store";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store";
import {
  useBitstreamConnectionStore,
  type TransportState,
} from "../state/bitstreamConnection.store";
import { useBitstreamConfigStore } from "../state/bitstreamConfig.store.js";
import {
  useBitstreamTelemetrySourceStore,
  resolveEffectiveTelemetryBackend,
  type BitstreamTelemetryEffectiveBackend,
} from "../state/bitstreamTelemetrySource.store";

/** Minimal connection slice for transport gating (UART vs BS2 simulator). */
export type TelemetryTransportSnapshot = {
  connected: boolean;
  transportState: TransportState;
  serialBridgeStatus: SerialPortStatusPayload | null;
};

export function getEffectiveTelemetryBackend(): BitstreamTelemetryEffectiveBackend {
  const { backend } = useBitstreamTelemetrySourceStore.getState();
  return resolveEffectiveTelemetryBackend(backend);
}

export function isSimulatorTelemetryBackend(
  backend: BitstreamTelemetryEffectiveBackend = getEffectiveTelemetryBackend(),
): boolean {
  return backend === "simulator";
}

export function isUartTelemetryBackend(
  backend: BitstreamTelemetryEffectiveBackend = getEffectiveTelemetryBackend(),
): boolean {
  return backend === "uart";
}

/** BS2 wire on real MCU UART (not dev simulator / loopback path). */
export function isBs2UartFirmwareLink(
  backend: BitstreamTelemetryEffectiveBackend = getEffectiveTelemetryBackend(),
): boolean {
  return backend === "uart";
}

/** Bitstream app control plane uses BS2 `bitstream2/req` (UART MCU or BS2 simulator). */
export function usesBs2ControlPlane(
  backend: BitstreamTelemetryEffectiveBackend = getEffectiveTelemetryBackend(),
): boolean {
  return backend === "uart" || backend === "simulator";
}

/** Bridge reports an open COM port (authoritative link for BS2 UART). */
export function isComLinkOpen(conn: TelemetryTransportSnapshot): boolean {
  return conn.serialBridgeStatus?.isOpen === true;
}

/**
 * BS2 UART auto-orchestrate disabled while serial bridge UI transport is removed.
 */
export function shouldUseBs2UartAutoOrchestrate(
  _backend: BitstreamTelemetryEffectiveBackend = getEffectiveTelemetryBackend(),
): boolean {
  return false;
}

/**
 * True when telemetry may flow:
 * - **Simulator:** WebSocket path connected.
 * - **BS2 UART:** serial bridge COM open.
 */
export function isTelemetryTransportReady(conn: TelemetryTransportSnapshot): boolean {
  if (isBs2UartFirmwareLink()) {
    return false;
  }
  if (!conn.connected || conn.transportState !== "connected") {
    return false;
  }
  return true;
}

/** True when decoded samples should flow into Sensor Studio / telemetry UI. */
export function isTelemetryDecodePipelineActive(
  conn: TelemetryTransportSnapshot,
  handshakeState: HandshakeLifecycleState,
): boolean {
  if (isBs2UartFirmwareLink()) {
    return isComLinkOpen(conn);
  }
  return isTelemetryTransportReady(conn) && handshakeState === "passed";
}

/**
 * Whether decoded sensor samples may update the UI (BS2 `evt/sensor` on UART; simulator via inject-rx).
 *
 * Modes are mutually exclusive:
 * - **Simulator:** ingest when COM is closed (virtual sim inject only).
 * - **Bitstream (UART):** ingest when COM is open (real hardware only).
 */
export function shouldIngestTelemetryForRoute(
  backend: BitstreamTelemetryEffectiveBackend,
  conn: TelemetryTransportSnapshot,
): boolean {
  const comOpen = isComLinkOpen(conn);

  if (backend === "simulator")
  {
    return !comOpen;
  }

  if (backend === "uart")
  {
    return comOpen;
  }

  return false;
}

export function shouldIngestTelemetry(
  conn: TelemetryTransportSnapshot,
): boolean {
  return shouldIngestTelemetryForRoute(getEffectiveTelemetryBackend(), conn);
}

/**
 * When bridge tags `evt/sensor` with `origin`, enforce mode match (defense in depth).
 * Legacy payloads without `origin` fall back to route + COM rules only.
 */
export function shouldAcceptBs2SampleOrigin(
  sample: Pick<Bitstream2SensorSamplePayload, "origin">,
  backend: BitstreamTelemetryEffectiveBackend = getEffectiveTelemetryBackend(),
): boolean {
  if (sample.origin === "uart")
  {
    return backend === "uart";
  }
  if (sample.origin === "sim")
  {
    return backend === "simulator";
  }
  return true;
}

/**
 * Whether BS2 UART RX (HELLO / EVT_SENSOR) may update the UI when SOURCE is Bitstream.
 * Simulator: always. UART: accept broker HELLO (bridge only publishes after open COM);
 * do not drop when webview `serialBridgeStatus` lags `serialport/status` by a frame.
 */
export function shouldAcceptBs2Hello(conn: TelemetryTransportSnapshot): boolean {
  if (isSimulatorTelemetryBackend()) {
    return true;
  }
  if (isBs2UartFirmwareLink()) {
    return isComLinkOpen(conn);
  }
  return false;
}

/**
 * BS2 link handshake satisfied for UI gates (lifecycle bar, BMI270 sync, sensor truth).
 * Legacy `handshakeState === "passed"` or BS2 HELLO stored with transport ready.
 */
export function isLinkHandshakeSatisfied(
  handshakeState: HandshakeLifecycleState,
  conn?: TelemetryTransportSnapshot,
): boolean {
  if (handshakeState === "passed") {
    return true;
  }
  if (handshakeState === "failed" || handshakeState === "running") {
    return false;
  }
  const bs2Hello = useBitstreamTelemetrySourceStore.getState().bs2Hello;
  if (bs2Hello == null) {
    return false;
  }
  if (isSimulatorTelemetryBackend()) {
    return true;
  }
  if (isBs2UartFirmwareLink()) {
    const snap =
      conn ??
      (() => {
        const c = useBitstreamConnectionStore.getState();
        return {
          connected: c.connected,
          transportState: c.transportState,
          serialBridgeStatus: c.serialBridgeStatus,
        };
      })();
    return isComLinkOpen(snap);
  }
  return false;
}

/**
 * Promote live-store handshake to `passed` when BS2 HELLO is known and COM/WS is up.
 * Returns true when the store was updated.
 */
export function reconcileBs2HandshakePassedFromStores(): boolean {
  const live = useBitstreamLiveStore.getState();
  if (live.handshakeState === "passed") {
    return true;
  }
  if (live.handshakeState === "failed" || live.handshakeState === "running") {
    return false;
  }
  const bs2Hello = useBitstreamTelemetrySourceStore.getState().bs2Hello;
  if (bs2Hello == null) {
    return false;
  }
  const connSnap = (() => {
    const c = useBitstreamConnectionStore.getState();
    return {
      connected: c.connected,
      transportState: c.transportState,
      serialBridgeStatus: c.serialBridgeStatus,
    };
  })();
  if (!isLinkHandshakeSatisfied("unknown", connSnap)) {
    return false;
  }
  live.setHandshake({
    protocolVersion: bs2Hello.version,
    capsFlags: bs2Hello.caps,
    statusCounter: 0,
    totalDurationMs: 0,
  });
  live.setHandshakeState("passed");
  live.setHandshakeLastError(null);
  return true;
}

/** @deprecated Use {@link shouldIngestTelemetry} — same rules for BS2 broker path. */
export function shouldIngestBs2Telemetry(
  conn: TelemetryTransportSnapshot,
): boolean {
  return shouldIngestTelemetry(conn);
}

/**
 * When true, dropping UART transport must not call `resetLiveData()`:
 * BS2 `bitstream2/evt/sensor` still flows from the serial bridge while COM stays open.
 */
export function shouldPreserveLiveTelemetryOnSessionDrop(
  conn: TelemetryTransportSnapshot,
): boolean {
  if (isSimulatorTelemetryBackend()) {
    return false;
  }
  return conn.serialBridgeStatus?.isOpen === true;
}

export type SessionLiveTelemetryResetOptions = {
  userInitiated?: boolean;
  /** Force keep or clear live panels regardless of serial bridge state. */
  preserveLiveTelemetry?: boolean;
};

/** Whether disconnect / transport-drop should wipe Sensor Studio samples. */
export function shouldResetLiveTelemetryOnSessionClose(
  conn: TelemetryTransportSnapshot,
  options?: SessionLiveTelemetryResetOptions,
): boolean {
  if (options?.preserveLiveTelemetry === true) {
    return false;
  }
  if (options?.preserveLiveTelemetry === false) {
    return true;
  }
  if (options?.userInitiated === true) {
    return true;
  }
  return !shouldPreserveLiveTelemetryOnSessionDrop(conn);
}

export function telemetryLinkStatusLabel(args: {
  transportReady: boolean;
  handshakeState: HandshakeLifecycleState;
  simulatorMode?: boolean;
}): string | null {
  const simulator = args.simulatorMode ?? isSimulatorTelemetryBackend();
  if (!args.transportReady) {
    return simulator ? "Not connected (simulator)" : "Serial closed";
  }
  if (isLinkHandshakeSatisfied(args.handshakeState)) {
    return null;
  }
  if (args.handshakeState === "running") {
    return "Handshake running";
  }
  if (args.handshakeState === "failed") {
    return "Handshake failed";
  }
  return "Await handshake";
}
