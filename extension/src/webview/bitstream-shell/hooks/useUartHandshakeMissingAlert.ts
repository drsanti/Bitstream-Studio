/*******************************************************************************
 * File Name : useUartHandshakeMissingAlert.ts
 *
 * Description : After explicit UART source switch, show floating notice when
 *               handshake is not satisfied within the grace window.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, useState } from "react";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store.js";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store.js";
import {
  type TelemetryTransportSnapshot,
} from "../../bitstream-app/utils/bitstreamTelemetryTransport.js";
import { useWsClientStore } from "../../ws-client-store.js";
import {
  isUartHandshakeEstablished,
  UART_MISSING_HANDSHAKE_GRACE_MS,
  uartMissingHandshakeMessage,
} from "../utils/uartHandshakeMissingAlert.js";

export type UartHandshakeMissingAlertState = {
  open: boolean;
  message: string;
  noticeKey: number;
  onOpenChange: (open: boolean) => void;
};

function buildConnSnapshot(): TelemetryTransportSnapshot {
  const c = useBitstreamConnectionStore.getState();
  return {
    connected: c.connected,
    transportState: c.transportState,
    serialBridgeStatus: c.serialBridgeStatus,
  };
}

/**
 * Watches UART source + handshake; exposes notice state for {@link UartFirmwareNotConnectedNotice}.
 */
export function useUartHandshakeMissingAlert(): UartHandshakeMissingAlertState {
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const uartSourceSwitchSeq = useBitstreamTelemetrySourceStore((s) => s.uartSourceSwitchSeq);
  const uartWatchStartedAtMs = useBitstreamTelemetrySourceStore((s) => s.uartWatchStartedAtMs);
  const bs2Hello = useBitstreamTelemetrySourceStore((s) => s.bs2Hello);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const transportState = useBitstreamConnectionStore((s) => s.transportState);
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const wsConnected = useWsClientStore((s) => s.isConnected);
  const armUartWatch = useBitstreamTelemetrySourceStore((s) => s.armUartMissingHandshakeWatch);

  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSwitchSeqRef = useRef(0);

  const comOpen = serialBridgeStatus?.isOpen === true;
  const message = uartMissingHandshakeMessage({ wsConnected, comOpen });

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handshakeUp = (conn: TelemetryTransportSnapshot) =>
    isUartHandshakeEstablished({ handshakeState, conn });

  /* --- Block: page refresh with persisted UART --- */
  useEffect(() => {
    if (backend !== "uart" || uartWatchStartedAtMs != null) {
      return;
    }
    armUartWatch();
  }, [backend, uartWatchStartedAtMs, armUartWatch]);

  /* --- Block: grace timer on each UART switch --- */
  useEffect(() => {
    if (backend !== "uart" || uartWatchStartedAtMs == null) {
      clearTimer();
      activeSwitchSeqRef.current = 0;
      setOpen(false);
      return;
    }

    activeSwitchSeqRef.current = uartSourceSwitchSeq;
    setOpen(false);
    clearTimer();

    const switchSeq = uartSourceSwitchSeq;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (activeSwitchSeqRef.current !== switchSeq) {
        return;
      }
      if (useBitstreamTelemetrySourceStore.getState().backend !== "uart") {
        return;
      }
      const live = useBitstreamLiveStore.getState();
      if (live.handshakeState === "failed") {
        return;
      }
      const conn = buildConnSnapshot();
      if (
        isUartHandshakeEstablished({
          handshakeState: live.handshakeState,
          conn,
        })
      ) {
        return;
      }
      setOpen(true);
    }, UART_MISSING_HANDSHAKE_GRACE_MS);

    return clearTimer;
  }, [backend, uartSourceSwitchSeq, uartWatchStartedAtMs]);

  /* --- Block: cancel when handshake completes --- */
  useEffect(() => {
    if (backend !== "uart" || uartWatchStartedAtMs == null) {
      return;
    }
    if (activeSwitchSeqRef.current !== uartSourceSwitchSeq) {
      return;
    }
    const conn: TelemetryTransportSnapshot = {
      connected,
      transportState,
      serialBridgeStatus,
    };
    if (handshakeUp(conn) || handshakeState === "failed") {
      clearTimer();
      setOpen(false);
    }
  }, [
    backend,
    uartSourceSwitchSeq,
    uartWatchStartedAtMs,
    handshakeState,
    bs2Hello,
    connected,
    transportState,
    serialBridgeStatus,
  ]);

  useEffect(() => () => clearTimer(), []);

  return {
    open,
    message,
    noticeKey: uartSourceSwitchSeq,
    onOpenChange: setOpen,
  };
}
