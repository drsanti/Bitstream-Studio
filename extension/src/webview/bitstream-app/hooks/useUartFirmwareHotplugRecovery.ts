/*******************************************************************************
 * File Name : useUartFirmwareHotplugRecovery.ts
 *
 * Description : Bitstream (firmware) hotplug — on unplug poll for COM return, then queue
 *               full bring-up when the bridge lists ports again.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, type MutableRefObject } from "react";
import { appendTelemetryActivity } from "../../sensor-telemetry/store/telemetryActivity.store";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store";
import { useSerialPortStore } from "../../serialport/serial-port-store";
import type { BitstreamTelemetryBackend } from "../state/bitstreamTelemetryBackend";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store";

/** First poll after plug-in (OS enumeration). */
const HOTPLUG_FIRST_POLL_MS = 400;
/** Interval while waiting for COM to reappear. */
const HOTPLUG_PORT_POLL_MS = 500;
/** Stop polling after this long (user can replug again). */
const HOTPLUG_POLL_TIMEOUT_MS = 120_000;

export type UseUartFirmwareHotplugRecoveryParams = {
  telemetryBackend: BitstreamTelemetryBackend;
  wsConnected: boolean;
  serialOpen: boolean;
  autoUartOpenAttemptedRef: MutableRefObject<boolean>;
};

/**
 * Watch serial open/close while SOURCE is Bitstream (firmware).
 * Unplug: mark awaiting replug and poll `listPorts` until a COM appears.
 * Plug-in: queue bring-up (debounced) when ports are listed or STATUS reports open.
 */
export function useUartFirmwareHotplugRecovery(
  params: UseUartFirmwareHotplugRecoveryParams,
): void {
  const uartAwaitingReplug = useBitstreamTelemetrySourceStore((s) => s.uartAwaitingReplug);
  const prevSerialOpenRef = useRef<boolean | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const portPollStartedAtRef = useRef<number>(0);

  const stopPortPoll = (): void => {
    if (portPollTimerRef.current != null)
    {
      clearInterval(portPollTimerRef.current);
      portPollTimerRef.current = null;
    }
  };

  const queueBringUpAfterComDetected = (paths: string[]): void => {
    stopPortPoll();
    params.autoUartOpenAttemptedRef.current = false;
    useBitstreamTelemetrySourceStore.getState().requestUartBringUpAfterHotplug();
    const label = paths.length > 0 ? paths.join(", ") : "COM";
    appendTelemetryActivity({
      text: `Bitstream: ${label} detected — reconnecting`,
      tone: "info",
    });
  };

  const tryListPortsOnce = async (): Promise<string[] | null> => {
    if (!params.wsConnected)
    {
      return null;
    }
    if (useBitstreamTelemetrySourceStore.getState().backend !== "uart")
    {
      return null;
    }
    try
    {
      await useSerialPortStore.getState().connect();
      const ports = await useSerialPortStore.getState().listPorts();
      return ports.map((p) => p.path).filter((p) => p.length > 0);
    }
    catch
    {
      return null;
    }
  };

  const startPortPoll = (): void => {
    stopPortPoll();
    if (useBitstreamConnectionStore.getState().userPausedLink)
    {
      return;
    }
    if (!params.wsConnected)
    {
      return;
    }
    portPollStartedAtRef.current = Date.now();

    const tick = (): void => {
      const tel = useBitstreamTelemetrySourceStore.getState();
      if (tel.backend !== "uart" || !tel.uartAwaitingReplug)
      {
        stopPortPoll();
        return;
      }
      if (Date.now() - portPollStartedAtRef.current > HOTPLUG_POLL_TIMEOUT_MS)
      {
        stopPortPoll();
        appendTelemetryActivity({
          text: "Bitstream: replug wait timed out — unplug and plug again",
          tone: "warning",
        });
        return;
      }
      void tryListPortsOnce().then((paths) => {
        if (paths != null && paths.length > 0)
        {
          queueBringUpAfterComDetected(paths);
        }
      });
    };

    void tryListPortsOnce().then((paths) => {
      if (paths != null && paths.length > 0)
      {
        queueBringUpAfterComDetected(paths);
        return;
      }
      appendTelemetryActivity({
        text: "Bitstream: watching for COM…",
        tone: "info",
      });
      portPollTimerRef.current = setInterval(() => {
        void tick();
      }, HOTPLUG_PORT_POLL_MS);
    });
  };

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current != null)
      {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      stopPortPoll();
    };
  }, []);

  useEffect(() => {
    const { telemetryBackend, wsConnected, serialOpen, autoUartOpenAttemptedRef } = params;

    if (telemetryBackend !== "uart")
    {
      prevSerialOpenRef.current = serialOpen;
      stopPortPoll();
      return;
    }

    const prev = prevSerialOpenRef.current;
    prevSerialOpenRef.current = serialOpen;

    if (prev === null)
    {
      return;
    }

    if (prev === true && serialOpen === false)
    {
      if (useBitstreamConnectionStore.getState().userPausedLink)
      {
        return;
      }
      autoUartOpenAttemptedRef.current = false;
      useBitstreamTelemetrySourceStore.getState().notifyUartSerialLinkLost();
      appendTelemetryActivity({
        text: "Bitstream: device disconnected — waiting for COM",
        tone: "warning",
      });
      if (reconnectTimerRef.current != null)
      {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsConnected)
      {
        setTimeout(() => {
          startPortPoll();
        }, HOTPLUG_FIRST_POLL_MS);
      }
      return;
    }

    if (prev === false && serialOpen === true && wsConnected)
    {
      const awaiting = useBitstreamTelemetrySourceStore.getState().uartAwaitingReplug;
      if (!awaiting)
      {
        return;
      }
      if (reconnectTimerRef.current != null)
      {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (useBitstreamTelemetrySourceStore.getState().backend !== "uart")
        {
          return;
        }
        queueBringUpAfterComDetected(
          useSerialPortStore.getState().status?.path
            ? [useSerialPortStore.getState().status!.path!]
            : [],
        );
      }, HOTPLUG_FIRST_POLL_MS);
    }
  }, [
    params.telemetryBackend,
    params.wsConnected,
    params.serialOpen,
    params.autoUartOpenAttemptedRef,
  ]);

  /**
   * Poll whenever awaiting replug (unplug on UART, sim→UART with no COM, or list failed).
   * Must depend on uartAwaitingReplug — flag is often set after a failed bring-up, not on a serial edge.
   */
  const userPausedLink = useBitstreamConnectionStore((s) => s.userPausedLink);

  useEffect(() => {
    if (params.telemetryBackend !== "uart" || !params.wsConnected || userPausedLink)
    {
      stopPortPoll();
      return;
    }
    if (!uartAwaitingReplug)
    {
      stopPortPoll();
      return;
    }
    if (portPollTimerRef.current != null)
    {
      return;
    }
    startPortPoll();
  }, [params.telemetryBackend, params.wsConnected, uartAwaitingReplug, userPausedLink]);
}
