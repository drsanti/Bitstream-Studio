/*******************************************************************************
 * File Name : useTelemetryActivityMirror.ts
 *
 * Description : Mirror shell link state (WS, serial, source, handshake) into the
 *               Sensor Telemetry activity log — edge-triggered, no spam.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef } from "react";
import type { HandshakeLifecycleState } from "../../bitstream-app/state/bitstreamLive.store";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import {
  useBitstreamTelemetrySourceStore,
  telemetrySourceDisplayLabel,
  type BitstreamTelemetryBackend,
} from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import { useSerialPortStore } from "../../serialport/serial-port-store";
import { useWsClientStore } from "../../ws-client-store";
import { appendTelemetryActivity } from "../store/telemetryActivity.store";

/** Human label for Source selector value. */
function sourceSettingLabel(backend: BitstreamTelemetryBackend): string {
  return telemetrySourceDisplayLabel(backend);
}

/**
 * Log transport and session transitions once per edge (no spam on re-renders).
 * Mounted on BitstreamShellRoot so events are captured on any workspace tab.
 */
export function useTelemetryActivityMirror(): void {
  const wsState = useWsClientStore((s) => s.connectionState);
  const serialOpen = useSerialPortStore((s) => s.status?.isOpen === true);
  const serialPath = useSerialPortStore((s) => s.status?.path);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const handshakeLastError = useBitstreamLiveStore((s) => s.handshakeLastError);

  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const loopbackAvailable = useBitstreamTelemetrySourceStore((s) => s.loopbackAvailable);
  const bs2Hello = useBitstreamTelemetrySourceStore((s) => s.bs2Hello);

  const userPausedLink = useBitstreamConnectionStore((s) => s.userPausedLink);
  const busyAction = useBitstreamConnectionStore((s) => s.busyAction);
  const runtimeSyncState = useBitstreamConnectionStore((s) => s.runtimeSyncState);

  const prevWs = useRef<string | null>(null);
  const wsBaselineSet = useRef(false);
  const prevSerial = useRef<boolean | null>(null);
  const prevHandshake = useRef<HandshakeLifecycleState | null>(null);
  const prevBackend = useRef<BitstreamTelemetryBackend | null>(null);
  const prevLoopback = useRef<boolean | null>(null);
  const prevUserPaused = useRef<boolean | null>(null);
  const prevBusyAction = useRef<string | null>(null);
  const prevRuntimeSync = useRef<string | null>(null);
  const prevHelloKey = useRef<string | null>(null);
  const shellReadyLogged = useRef(false);

  useEffect(() => {
    if (shellReadyLogged.current)
    {
      return;
    }
    shellReadyLogged.current = true;
    appendTelemetryActivity({ text: "Sensor Telemetry activity log ready", tone: "info" });
  }, []);

  useEffect(() => {
    if (!wsBaselineSet.current)
    {
      prevWs.current = wsState;
      wsBaselineSet.current = true;
      if (wsState === "connected")
      {
        appendTelemetryActivity({ text: "Service link connected", tone: "ok" });
      }
      else if (wsState === "connecting" || wsState === "reconnecting")
      {
        appendTelemetryActivity({ text: "Service link connecting…", tone: "info" });
      }
      return;
    }

    if (prevWs.current === wsState)
    {
      return;
    }
    prevWs.current = wsState;

    if (wsState === "connected")
    {
      appendTelemetryActivity({ text: "Service link connected", tone: "ok" });
    }
    else if (wsState === "connecting" || wsState === "reconnecting")
    {
      appendTelemetryActivity({ text: "Service link connecting…", tone: "info" });
    }
    else if (wsState === "disconnected")
    {
      appendTelemetryActivity({ text: "Service link disconnected", tone: "warning" });
    }
    else if (wsState === "error")
    {
      appendTelemetryActivity({ text: "Service link error", tone: "error" });
    }
  }, [wsState]);

  useEffect(() => {
    if (prevSerial.current === serialOpen)
    {
      return;
    }
    const wasOpen = prevSerial.current === true;
    prevSerial.current = serialOpen;

    if (serialOpen)
    {
      const path = serialPath?.length ? serialPath : "COM";
      appendTelemetryActivity({ text: `Serial port open: ${path}`, tone: "ok" });
    }
    else if (wasOpen)
    {
      appendTelemetryActivity({ text: "Serial port closed", tone: "warning" });
    }
  }, [serialOpen, serialPath]);

  useEffect(() => {
    const prev = prevHandshake.current;
    if (prev === handshakeState)
    {
      return;
    }
    prevHandshake.current = handshakeState;

    if (handshakeState === "unknown" && prev != null && prev !== "unknown")
    {
      appendTelemetryActivity({ text: "Board handshake cleared", tone: "info" });
      return;
    }

    const msg = handshakeMessage(handshakeState, handshakeLastError);
    if (msg != null)
    {
      appendTelemetryActivity(msg);
    }
  }, [handshakeState, handshakeLastError]);

  useEffect(() => {
    if (prevBackend.current === telemetryBackend)
    {
      return;
    }
    const prev = prevBackend.current;
    prevBackend.current = telemetryBackend;
    if (prev == null)
    {
      appendTelemetryActivity({
        text: `Source: ${sourceSettingLabel(telemetryBackend)}`,
        tone: "info",
      });
      return;
    }
    appendTelemetryActivity({
      text: `Source changed to ${sourceSettingLabel(telemetryBackend)}`,
      tone: "info",
    });
  }, [telemetryBackend]);

  useEffect(() => {
    if (prevLoopback.current === loopbackAvailable)
    {
      return;
    }
    prevLoopback.current = loopbackAvailable;
    appendTelemetryActivity({
      text: loopbackAvailable
        ? "Simulator loopback available on service"
        : "Simulator loopback not available",
      tone: loopbackAvailable ? "ok" : "warning",
    });
  }, [loopbackAvailable]);

  useEffect(() => {
    if (prevUserPaused.current === userPausedLink)
    {
      return;
    }
    prevUserPaused.current = userPausedLink;
    if (userPausedLink)
    {
      appendTelemetryActivity({
        text: "Connection stopped (Disconnect) — press Connect to resume",
        tone: "warning",
      });
    }
  }, [userPausedLink]);

  useEffect(() => {
    if (busyAction === prevBusyAction.current)
    {
      return;
    }
    prevBusyAction.current = busyAction;
    if (busyAction != null && busyAction.length > 0)
    {
      appendTelemetryActivity({ text: `${busyAction}…`, tone: "info" });
    }
  }, [busyAction]);

  useEffect(() => {
    if (prevRuntimeSync.current === runtimeSyncState)
    {
      return;
    }
    prevRuntimeSync.current = runtimeSyncState;
    if (runtimeSyncState === "ready")
    {
      appendTelemetryActivity({ text: "Runtime sync ready", tone: "ok" });
    }
    else if (runtimeSyncState === "syncing_snapshot")
    {
      appendTelemetryActivity({ text: "Runtime sync in progress…", tone: "info" });
    }
    else if (runtimeSyncState === "idle")
    {
      appendTelemetryActivity({ text: "Runtime sync idle", tone: "info" });
    }
  }, [runtimeSyncState]);

  useEffect(() => {
    const key =
      bs2Hello != null
        ? `${bs2Hello.version}|${typeof bs2Hello.fwTag === "string" ? bs2Hello.fwTag : ""}`
        : null;
    if (prevHelloKey.current === key)
    {
      return;
    }
    prevHelloKey.current = key;
    if (bs2Hello == null)
    {
      return;
    }
    const tag =
      typeof bs2Hello.fwTag === "string" && bs2Hello.fwTag.length > 0
        ? bs2Hello.fwTag
        : `protocol v${bs2Hello.version}`;
    appendTelemetryActivity({
      text: `Firmware HELLO received (${tag})`,
      tone: "ok",
    });
  }, [bs2Hello]);
}

function handshakeMessage(
  state: HandshakeLifecycleState,
  lastError: string | null,
): { text: string; tone: "info" | "ok" | "warning" | "error" } | null {
  switch (state) {
    case "passed":
      return { text: "Handshake passed (board link ready)", tone: "ok" };
    case "failed":
      return {
        text: lastError?.length
          ? `Handshake failed — ${lastError}`
          : "Handshake failed",
        tone: "error",
      };
    case "running":
      return { text: "Handshake in progress…", tone: "info" };
    case "unknown":
      return null;
    default:
      return null;
  }
}
