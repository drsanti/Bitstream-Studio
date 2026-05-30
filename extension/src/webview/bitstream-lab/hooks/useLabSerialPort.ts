/*******************************************************************************
 * File Name : useLabSerialPort.ts
 *
 * Description : Serial list/open/close for Lab with activity logging (Phase 2).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useRef, useState } from "react";
import type { PortInfo, SerialPortStatusPayload } from "../../../serialport-bridge/protocol";
import { useSerialPort } from "../../serialport/useSerialPort";
import { useSerialPortStore } from "../../serialport/serial-port-store";
import { LAB_DEFAULT_BAUD } from "../lib/labSerialDefaults";
import { appendLabActivity } from "../store/labActivity.store";
import { useLabTopicTapStore } from "../store/labTopicTap.store";

const LAB_SERIAL_SUBSCRIBER = "bitstream-lab-serial";

export type UseLabSerialPortOptions = {
  wsConnected: boolean;
};

export type LabSerialPortApi = {
  ports: PortInfo[];
  selectedPath: string;
  baudRate: number;
  status: ReturnType<typeof useSerialPort>["status"];
  displayStatus: SerialPortStatusPayload | null;
  sessionClosedByUser: boolean;
  bridgeStillReportsOpen: boolean;
  isWsConnected: boolean;
  serialBusy: boolean;
  setSelectedPath: (path: string) => void;
  setBaudRate: (baud: number) => void;
  ensureSerialBridge: () => Promise<void>;
  listPorts: () => Promise<PortInfo[]>;
  openSelectedPort: () => Promise<void>;
  closePort: () => Promise<void>;
};

/**
 * Wraps shared serial-port store: subscribes when WS is up; logs actions to activity.
 */
export function useLabSerialPort(options: UseLabSerialPortOptions): LabSerialPortApi {
  const { wsConnected } = options;
  const serial = useSerialPort(LAB_SERIAL_SUBSCRIBER);
  const sessionClosedByUser = useSerialPortStore((s) => s.sessionClosedByUser);
  const serialSubscribedRef = useRef(false);
  const [serialBusy, setSerialBusy] = useState(false);
  const [frozenStatus, setFrozenStatus] = useState<SerialPortStatusPayload | null>(null);
  const baudInitializedRef = useRef(false);
  const serialWasOpenRef = useRef(false);

  /* Prefer BS2 baud when Lab loads (without clobbering user persist every render). */
  useEffect(() => {
    if (baudInitializedRef.current)
    {
      return;
    }
    baudInitializedRef.current = true;
    if (serial.baudRate !== LAB_DEFAULT_BAUD)
    {
      serial.setBaudRate(LAB_DEFAULT_BAUD);
    }
  }, [serial.baudRate, serial.setBaudRate]);

  const ensureSerialBridge = useCallback(async () => {
    if (!wsConnected)
    {
      throw new Error("Connect WebSocket before using serial controls");
    }
    await useSerialPortStore.getState().connect();
    if (!serialSubscribedRef.current)
    {
      serialSubscribedRef.current = true;
      appendLabActivity({ text: "Serial bridge topics subscribed", tone: "info" });
    }
  }, [wsConnected]);

  useEffect(() => {
    if (!wsConnected)
    {
      serialSubscribedRef.current = false;
      return;
    }
    void ensureSerialBridge().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      appendLabActivity({ text: `Serial bridge subscribe failed: ${msg}`, tone: "error" });
    });
  }, [wsConnected, ensureSerialBridge]);

  const listPorts = useCallback(async () => {
    await ensureSerialBridge();
    appendLabActivity({ text: "Listing serial ports…", tone: "info" });
    try
    {
      const list = await serial.listPorts();
      appendLabActivity({ text: `Listed ${list.length} port(s)`, tone: "ok" });
      if (list.length > 0 && !serial.selectedPath)
      {
        serial.setSelectedPath(list[0]!.path);
      }
      return list;
    }
    catch (e: unknown)
    {
      const msg = e instanceof Error ? e.message : String(e);
      appendLabActivity({ text: `List ports failed: ${msg}`, tone: "error" });
      throw e;
    }
  }, [ensureSerialBridge, serial]);

  const openSelectedPort = useCallback(async () => {
    await ensureSerialBridge();
    const path = serial.selectedPath.trim();
    if (!path)
    {
      appendLabActivity({ text: "Open failed: no COM path selected", tone: "error" });
      throw new Error("Select a serial port path");
    }
    const baud = serial.baudRate;
    appendLabActivity({ text: `Opening ${path} @ ${baud}…`, tone: "info" });
    setSerialBusy(true);
    try
    {
      setFrozenStatus(null);
      await serial.openPort({
        path,
        baudRate: baud,
        mode: "data",
      });
      useLabTopicTapStore.getState().setPaused(false);
      appendLabActivity({ text: `Open ${path} @ ${baud} — OK`, tone: "ok" });
    }
    catch (e: unknown)
    {
      const msg = e instanceof Error ? e.message : String(e);
      appendLabActivity({ text: `Open ${path} failed: ${msg}`, tone: "error" });
      throw e;
    }
    finally
    {
      setSerialBusy(false);
    }
  }, [ensureSerialBridge, serial]);

  const closePort = useCallback(async () => {
    await ensureSerialBridge();
    appendLabActivity({ text: "Closing serial port…", tone: "info" });
    useLabTopicTapStore.getState().setPaused(true);
    setSerialBusy(true);
    try
    {
      await serial.closePort();
      const snap = useSerialPortStore.getState().status;
      setFrozenStatus({
        isOpen: false,
        path: snap?.path ?? serial.selectedPath,
        baudRate: snap?.baudRate ?? serial.baudRate,
        bytesRead: snap?.bytesRead ?? 0,
        bytesWritten: snap?.bytesWritten ?? 0,
      });
      appendLabActivity({ text: "Serial port closed — host RX stopped on bridge", tone: "ok" });
    }
    catch (e: unknown)
    {
      const msg = e instanceof Error ? e.message : String(e);
      appendLabActivity({ text: `Close failed: ${msg}`, tone: "error" });
      throw e;
    }
    finally
    {
      setSerialBusy(false);
    }
  }, [ensureSerialBridge, serial]);

  const displayStatus = frozenStatus ?? serial.status;
  const bridgeStillReportsOpen =
    sessionClosedByUser && serial.status?.isOpen === true;

  /* After unplug, bridge may still stream garbage until Close — sync host gate when COM drops. */
  useEffect(() => {
    const isOpen = serial.status?.isOpen === true;
    if (isOpen)
    {
      serialWasOpenRef.current = true;
      return;
    }
    if (!serialWasOpenRef.current || !wsConnected || sessionClosedByUser)
    {
      return;
    }
    serialWasOpenRef.current = false;
    appendLabActivity({ text: "COM closed externally — sending bridge Close", tone: "info" });
    void closePort().catch(() => {
      /* logged in activity */
    });
  }, [wsConnected, sessionClosedByUser, serial.status?.isOpen, closePort]);

  return {
    ports: serial.ports,
    selectedPath: serial.selectedPath,
    baudRate: serial.baudRate,
    status: serial.status,
    displayStatus,
    sessionClosedByUser,
    bridgeStillReportsOpen,
    isWsConnected: wsConnected,
    serialBusy,
    setSelectedPath: serial.setSelectedPath,
    setBaudRate: serial.setBaudRate,
    ensureSerialBridge,
    listPorts,
    openSelectedPort,
    closePort,
  };
}
