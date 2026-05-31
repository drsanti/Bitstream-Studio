import { useEffect, useMemo, useState } from "react";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview";
import { useSerialBridgeExtensionHostStatus } from "../bridge/useSerialBridgeExtensionHostStatus";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store";
import { isLinkHandshakeSatisfied } from "../utils/bitstreamTelemetryTransport";
import { useWsClientStore } from "../../ws-client-store";
import type { ConnectionStepId } from "./connectionPanel.store";

export type ConnectionStepStatus = "ok" | "active" | "pending" | "locked" | "fail" | "warn";

export type ConnectionStepView = {
  id: ConnectionStepId;
  title: string;
  status: ConnectionStepStatus;
  summary: string;
  detail?: string;
  error?: string;
};

type WsProbeState = "idle" | "checking" | "up" | "down";

function useBrokerPortProbe(wsUrl: string, active: boolean): WsProbeState {
  const [state, setState] = useState<WsProbeState>("idle");

  useEffect(() => {
    if (!active || !wsUrl.startsWith("ws")) {
      setState("idle");
      return;
    }

    let cancelled = false;
    setState("checking");
    const ws = new WebSocket(wsUrl);
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      if (ws.readyState !== WebSocket.OPEN) {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        setState("down");
      }
    }, 2200);

    ws.onopen = () => {
      if (cancelled) {
        return;
      }
      window.clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      setState("up");
    };

    ws.onerror = () => {
      if (cancelled) {
        return;
      }
      window.clearTimeout(timer);
      setState("down");
    };

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
  }, [active, wsUrl]);

  return state;
}

export function useConnectionSteps(panelActive: boolean): {
  steps: ConnectionStepView[];
  activeStepId: ConnectionStepId | null;
  progressLabel: string;
  linkReady: boolean;
} {
  const ext = isVsCodeExtensionWebview();
  const wsUrl = useWsClientStore((s) => s.wsUrl);
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const loopbackAvailable = useBitstreamTelemetrySourceStore((s) => s.loopbackAvailable);
  const backendWsState = useBitstreamConnectionStore((s) => s.backendWsState);
  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const runtimeSnapshot = useBitstreamConnectionStore((s) => s.runtimeSnapshot);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const handshakeLastError = useBitstreamLiveStore((s) => s.handshakeLastError);
  const wsConnected = useWsClientStore((s) => s.isConnected);
  const wsBytesReceived = useWsClientStore((s) => s.wsBytesReceived);
  const wsBytesSent = useWsClientStore((s) => s.wsBytesSent);

  const bridgeHost = useSerialBridgeExtensionHostStatus(ext && panelActive);
  const portProbe = useBrokerPortProbe(wsUrl, panelActive);

  const bridgeUp =
    portProbe === "up" ||
    bridgeHost?.running === true ||
    (portProbe === "checking" && bridgeHost?.running === true);

  const bridgeStatus: ConnectionStepStatus = bridgeUp
    ? bridgeHost?.externalProcess
      ? "warn"
      : "ok"
    : portProbe === "checking"
      ? "active"
      : ext
        ? "fail"
        : "warn";

  const wsStatus: ConnectionStepStatus = wsConnected
    ? "ok"
    : backendWsState === "connecting" || backendWsState === "reconnecting"
      ? "active"
      : backendWsState === "error"
        ? "fail"
        : bridgeUp
          ? "pending"
          : "locked";

  const sourceStatus: ConnectionStepStatus = wsConnected ? "ok" : "locked";

  const comOpen = serialBridgeStatus?.isOpen === true;
  const transportStatus: ConnectionStepStatus =
    backend === "simulator"
      ? loopbackAvailable
        ? "ok"
        : wsConnected
          ? "active"
          : "locked"
      : comOpen
        ? "ok"
        : wsConnected
          ? "active"
          : "locked";

  const linkReady = isLinkHandshakeSatisfied(handshakeState);
  const handshakeStatus: ConnectionStepStatus = linkReady
    ? "ok"
    : handshakeState === "failed"
      ? "fail"
      : handshakeState === "running"
        ? "active"
        : transportStatus === "ok"
          ? "active"
          : "locked";

  const linkStatus: ConnectionStepStatus = linkReady ? "ok" : handshakeStatus === "ok" ? "active" : "locked";

  const steps = useMemo((): ConnectionStepView[] => {
    const bridgeSummary = bridgeUp
      ? bridgeHost?.managedByExtension
        ? `Port ${bridgeHost.port ?? 9998} · managed by extension`
        : bridgeHost?.externalProcess
          ? `Port ${bridgeHost.port ?? 9998} · external process`
          : `Port reachable on ${wsUrl.replace(/^ws:\/\//, "")}`
      : ext
        ? "Bridge not reachable — start or wait for extension spawn"
        : "Run npm run start:bridge in extension/ (browser dev)";

    const transportTitle = backend === "simulator" ? "External simulator" : "Serial port";
    const transportSummary =
      backend === "simulator"
        ? loopbackAvailable
          ? "bitstream-simulator streaming · COM closed"
          : "Start bitstream-simulator VSIX + bridge streaming"
        : comOpen
          ? `${serialBridgeStatus?.path ?? "COM"} @ ${serialBridgeStatus?.baudRate ?? 921600}`
          : "Select COM and open port @ 921600";

    return [
      {
        id: "bridge",
        title: "Bridge (broker + UART)",
        status: bridgeStatus,
        summary: bridgeSummary,
        detail: bridgeHost?.warning,
      },
      {
        id: "websocket",
        title: "WebSocket client",
        status: wsStatus,
        summary: wsConnected
          ? `${wsUrl} · connected`
          : `${wsUrl} · ${backendWsState}`,
        detail:
          wsConnected
            ? `${Math.round(wsBytesReceived / 1024)} kB rx / ${Math.round(wsBytesSent / 1024)} kB tx`
            : undefined,
      },
      {
        id: "source",
        title: "Telemetry source",
        status: sourceStatus,
        summary: backend === "simulator" ? "Simulator (virtual MCU)" : "Bitstream (UART firmware)",
        detail: `Route: ${backend}`,
      },
      {
        id: "transport",
        title: transportTitle,
        status: transportStatus,
        summary: transportSummary,
      },
      {
        id: "handshake",
        title: "BS2 handshake",
        status: handshakeStatus,
        summary: linkReady
          ? "HELLO / PING passed"
          : handshakeState === "failed"
            ? "Handshake failed"
            : "Waiting for firmware HELLO or PING",
        detail: runtimeSnapshot?.handshakeLastError ?? handshakeLastError ?? undefined,
        error: handshakeState === "failed" ? handshakeLastError ?? undefined : undefined,
      },
      {
        id: "link",
        title: "Link ready",
        status: linkStatus,
        summary: linkReady
          ? "Telemetry and sensor settings unlocked"
          : "Complete prior steps to unlock workspace",
      },
    ];
  }, [
    backend,
    backendWsState,
    bridgeHost?.externalProcess,
    bridgeHost?.managedByExtension,
    bridgeHost?.port,
    bridgeHost?.warning,
    bridgeStatus,
    bridgeUp,
    comOpen,
    ext,
    handshakeLastError,
    handshakeState,
    handshakeStatus,
    linkReady,
    linkStatus,
    loopbackAvailable,
    serialBridgeStatus?.baudRate,
    serialBridgeStatus?.path,
    sourceStatus,
    transportStatus,
    wsBytesReceived,
    wsBytesSent,
    wsConnected,
    wsStatus,
    wsUrl,
  ]);

  const activeStepId = useMemo((): ConnectionStepId | null => {
    const order: ConnectionStepId[] = [
      "bridge",
      "websocket",
      "source",
      "transport",
      "handshake",
      "link",
    ];
    for (const id of order) {
      const step = steps.find((s) => s.id === id);
      if (step && step.status !== "ok") {
        return id;
      }
    }
    return null;
  }, [steps]);

  const doneCount = steps.filter((s) => s.status === "ok").length;
  const progressLabel =
    activeStepId != null
      ? `Step ${Math.min(doneCount + 1, steps.length)} of ${steps.length}`
      : `All ${steps.length} steps complete`;

  return { steps, activeStepId, progressLabel, linkReady };
}
