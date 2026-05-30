/*******************************************************************************
 * File Name : releaseOpenSerialPort.ts
 *
 * Description : Close an open COM session on the serial bridge (free UART resource).
 *               Used when entering Simulator routing or unlinking the broker.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useSerialPortStore } from "../../serialport/serial-port-store";
import { useWsClientStore } from "../../ws-client-store";
import { syncSerialBridgeStatusFromPortStore } from "./openUartPortAndHandshake";

/**
 * Publish serialport/close when COM is open. Connects WS first if needed (Source switch).
 * Caller must close WS only after this when unlinking the broker.
 */
export async function releaseOpenSerialPort(): Promise<void> {
  const serial = useSerialPortStore.getState();
  if (serial.status?.isOpen !== true)
  {
    return;
  }

  const ws = useWsClientStore.getState();
  if (!ws.isConnected)
  {
    try
    {
      await ws.connect();
    }
    catch
    {
      return;
    }
  }

  try
  {
    await useSerialPortStore.getState().closePort();
    syncSerialBridgeStatusFromPortStore();
  }
  catch
  {
    /* serialport/status or Activity log reflects remaining state */
  }
}
