import type { HandshakeLifecycleState } from "../../bitstream-app/state/bitstreamLive.store.js";
import type { TransportState } from "../../bitstream-app/state/bitstreamConnection.store.js";
import type { BitstreamTelemetryBackend } from "../../bitstream-app/state/bitstreamTelemetryBackend.js";

export type LinkLifecycleStepTone = "muted" | "active" | "ok" | "warn";

export type LinkLifecycleInputs = {
  connected: boolean;
  connecting: boolean;
  transportState: TransportState;
  runtimeSyncState: "idle" | "syncing_snapshot" | "ready";
  handshakeState: HandshakeLifecycleState;
  handshakeOk: boolean;
  firmwareSensorTruthReady: boolean;
  telemetryBackend: BitstreamTelemetryBackend;
};

export function isLinkLifecycleReady(headerStatus: string): boolean {
  return headerStatus === "Ready.";
}

export function computeLinkLifecycleHeaderStatus(inputs: LinkLifecycleInputs): string {
  const {
    connected,
    transportState,
    runtimeSyncState,
    handshakeState,
    handshakeOk,
    firmwareSensorTruthReady,
    telemetryBackend,
  } = inputs;

  if (!connected || transportState !== "connected") {
    if (telemetryBackend === "simulator") {
      return "Connect (simulator) to start — pick Source: Simulator above, then Connect. Settings are locked.";
    }
    return "Connect to start — pick Source: Bitstream, then Connect. Settings are locked.";
  }
  if (runtimeSyncState !== "ready") {
    return "Syncing broker snapshot… Settings are locked.";
  }
  if (!handshakeOk && handshakeState === "running") {
    return "Handshake running… Settings are locked.";
  }
  if (!handshakeOk) {
    return "Waiting for firmware handshake… Settings are locked.";
  }
  if (!firmwareSensorTruthReady) {
    return "Syncing sensor config… Settings are locked.";
  }
  return "Ready.";
}

export function transportTone(
  connected: boolean,
  connecting: boolean,
  transportState: TransportState,
): { label: string; tone: LinkLifecycleStepTone } {
  if (connecting || transportState === "connecting" || transportState === "reconnecting") {
    return { label: "UART connecting", tone: "active" };
  }
  if (transportState === "error") {
    return { label: "UART error", tone: "warn" };
  }
  if (connected && transportState === "connected") {
    return { label: "UART open", tone: "ok" };
  }
  return { label: "UART idle", tone: "muted" };
}

export function brokerTone(
  runtimeSyncState: LinkLifecycleInputs["runtimeSyncState"],
): { label: string; tone: LinkLifecycleStepTone } {
  if (runtimeSyncState === "syncing_snapshot") {
    return { label: "Broker snapshot", tone: "active" };
  }
  if (runtimeSyncState === "ready") {
    return { label: "Broker snapshot", tone: "ok" };
  }
  return { label: "Broker snapshot", tone: "muted" };
}

export function handshakeTone(
  handshakeState: HandshakeLifecycleState,
): { label: string; tone: LinkLifecycleStepTone } {
  if (handshakeState === "running") {
    return { label: "Handshake", tone: "active" };
  }
  if (handshakeState === "passed") {
    return { label: "Handshake", tone: "ok" };
  }
  if (handshakeState === "failed") {
    return { label: "Handshake", tone: "warn" };
  }
  return { label: "Handshake", tone: "muted" };
}

export function wifiSyncTone(
  state: "idle" | "syncing" | "ok" | "error",
): { label: string; tone: LinkLifecycleStepTone } {
  if (state === "syncing") return { label: "Wi‑Fi sync", tone: "active" };
  if (state === "ok") return { label: "Wi‑Fi sync", tone: "ok" };
  if (state === "error") return { label: "Wi‑Fi sync", tone: "warn" };
  return { label: "Wi‑Fi sync", tone: "muted" };
}

export function sensorCfgTone(
  handshakeOk: boolean,
  firmwareSensorTruthReady: boolean,
): { label: string; tone: LinkLifecycleStepTone } {
  if (!handshakeOk) {
    return { label: "Sensor cfg sync", tone: "muted" };
  }
  if (firmwareSensorTruthReady) {
    return { label: "Sensor cfg sync", tone: "ok" };
  }
  return { label: "Sensor cfg sync", tone: "active" };
}
